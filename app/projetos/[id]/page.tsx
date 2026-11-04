import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReadmeMarkdown from '@/components/ReadmeMarkdown';
import { projects } from '@/lib/projects';
import { getReadme } from '@/lib/readme';

/** Only projects with a README get a page; any other id is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.filter((p) => p.readme).map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<'/projetos/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const p = projects.find((x) => x.id === id);
  return p ? { title: `${p.title} · Ryan Corazza`, description: p.brief } : {};
}

export default async function ProjectReadme({ params }: PageProps<'/projetos/[id]'>) {
  const { id } = await params;
  const p = projects.find((x) => x.id === id);
  if (!p) notFound();
  const readme = await getReadme(p);

  return (
    <div className="doc">
      <div className="wrap">
        <nav className="doc-top" aria-label="Navegação">
          <Link href={`/#p-${p.id}`}>← Voltar ao portfólio</Link>
          {p.internal
            ? <span>Código privado</span>
            : <a href={p.repo} target="_blank" rel="noopener">Ver no GitHub</a>}
        </nav>

        <div className="doc-head">
          <div className="meta"><b>{p.area}</b><span>{p.where}</span></div>
          <h1>{p.title}</h1>
          <p className="kind">{p.kind}</p>
        </div>

        {readme ? (
          <article className="readme">
            <ReadmeMarkdown readme={readme} idPrefix={p.id} />
          </article>
        ) : (
          <p className="readme-missing">
            Não foi possível carregar o README agora.{' '}
            {p.repo && <a href={p.repo} target="_blank" rel="noopener">Abrir o repositório no GitHub</a>}
          </p>
        )}
      </div>
    </div>
  );
}
