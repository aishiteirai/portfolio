import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Project } from './projects';

export type Readme = {
  markdown: string;
  /** Resolves a relative link or image path from the README; null for local READMEs. */
  resolve: ((url: string, kind: 'href' | 'src') => string) | null;
};

/**
 * Public READMEs are cached for a day, and a push to the repo refreshes them sooner through the
 * GitHub webhook (app/api/github-webhook). In development they are fetched fresh on every request.
 */
const DAY = 60 * 60 * 24;
const REVALIDATE = process.env.NODE_ENV === 'development' ? 0 : DAY;

/** Cache tag for a repo's README, e.g. `readme:aishiteirai/naquela-mesa`. Lowercase, since GitHub names are case-insensitive. */
export const readmeTag = (slug: string) => `readme:${slug.toLowerCase()}`;

function repoSlug(repo: string) {
  return new URL(repo).pathname.replace(/^\/|\/$/g, '');
}

export async function getReadme(p: Project): Promise<Readme | null> {
  if (p.readme === 'local') {
    const file = path.join(process.cwd(), 'content', 'readmes', `${p.id}.md`);
    try {
      return { markdown: await readFile(file, 'utf8'), resolve: null };
    } catch {
      return null;
    }
  }

  if (p.readme === 'github' && p.repo) {
    const slug = repoSlug(p.repo);
    const res = await fetch(`https://api.github.com/repos/${slug}/readme`, {
      headers: { Accept: 'application/vnd.github.raw' },
      next: { revalidate: REVALIDATE, tags: [readmeTag(slug)] },
    });
    if (!res.ok) return null;
    return {
      markdown: await res.text(),
      resolve: (url, kind) => {
        if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(url)) return url;
        const file = url.replace(/^\.?\//, '');
        return kind === 'src'
          ? `https://raw.githubusercontent.com/${slug}/HEAD/${file}`
          : `https://github.com/${slug}/blob/HEAD/${file}`;
      },
    };
  }

  return null;
}

/** URL-safe id for a heading's text; used both for the section list and for the ids on the rendered headings. */
export function slugify(text: string) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Plain text of a markdown heading: drops emphasis, code ticks, inline HTML and link targets. */
function headingText(md: string) {
  return md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .trim();
}

export type Heading = { text: string; slug: string };

/** The README's `##` sections, in order, skipping anything inside fenced code blocks. */
export function readmeHeadings(markdown: string): Heading[] {
  const out: Heading[] = [];
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      const text = headingText(m[1]);
      if (text) out.push({ text, slug: slugify(text) });
    }
  }
  return out;
}

/**
 * The README's header: everything before the first `##` section (banner, tagline, badges).
 * A leading `# Title` is dropped, since the scene already shows the project's name. Empty when there is none.
 */
export function readmeHeader(markdown: string) {
  const lines = markdown.split('\n');
  let fenced = false, end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) fenced = !fenced;
    if (!fenced && /^##\s/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(0, end).join('\n').trim().replace(/^#\s+.*(\n|$)/, '').trim();
}
