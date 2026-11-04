import Markdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { Readme } from '@/lib/readme';
import { slugify } from '@/lib/readme';

type HastNode = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: HastNode[] };

const textOf = (n: HastNode): string => n.type === 'text' ? n.value ?? '' : (n.children ?? []).map(textOf).join('');

/** Gives every h2 the id `<prefix>-<slug>`, so the section list can jump to it. Runs after sanitizing. */
function rehypeSectionIds(prefix: string) {
  return () => (tree: HastNode) => {
    const walk = (n: HastNode) => {
      if (n.type === 'element' && n.tagName === 'h2') n.properties = { ...n.properties, id: `${prefix}-${slugify(textOf(n))}` };
      n.children?.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Renders a README as sanitized HTML; relative links and images point back to the repo.
 * With `drawer`, in-page links like `#como-funciona` open that project's README panel at the section instead.
 */
export default function ReadmeMarkdown({ readme, markdown = readme.markdown, idPrefix, drawer }: {
  readme: Readme;
  markdown?: string;
  idPrefix?: string;
  drawer?: string;
}) {
  const { resolve } = readme;
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={idPrefix ? [rehypeRaw, rehypeSanitize, rehypeSectionIds(idPrefix)] : [rehypeRaw, rehypeSanitize]}
      urlTransform={(url, key) =>
        defaultUrlTransform(resolve ? resolve(url, key === 'src' ? 'src' : 'href') : url)}
      components={{
        a: ({ node: _node, href, ...rest }) =>
          href?.startsWith('#')
            ? drawer
              ? <a href={href} data-readme={drawer} data-section={slugify(decodeURIComponent(href.slice(1)))} {...rest} />
              : <a href={idPrefix ? `#${idPrefix}-${slugify(decodeURIComponent(href.slice(1)))}` : href} {...rest} />
            : <a href={href} target="_blank" rel="noopener" {...rest} />,
      }}
    >
      {markdown}
    </Markdown>
  );
}
