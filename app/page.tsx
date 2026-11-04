import Link from 'next/link';
import Universe from '@/components/Universe';
import CopyEmail from '@/components/CopyEmail';
import MotionToggle from '@/components/MotionToggle';
import ReadmeDrawer from '@/components/ReadmeDrawer';
import ReadmeMarkdown from '@/components/ReadmeMarkdown';
import { links, projects } from '@/lib/projects';
import { getReadme, readmeHeader, readmeHeadings } from '@/lib/readme';

/* `data-scene` marks which camera shot each section asks for; the solar system reads them while scrolling. */
export default async function Home() {
  const readmes = await Promise.all(projects.map(getReadme));
  return (
    <>
      <Universe />

      <header>
        <div className="in">
          <a className="mark" href="#topo">Ryan Corazza<span>.</span></a>
          <nav aria-label="Seções">
            <a href="#projetos">Projetos</a>
            <a className="opt" href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="scene hero" id="topo" data-scene="hero">
          <div className="wrap" style={{ width: '100%' }}>
            <div className="col">
              <span className="status"><i />Aberto a vagas CLT de dev back-end júnior</span>
              <h1>Ryan<em>Corazza</em></h1>
              <p>
                <strong>Dev back-end júnior, hoje estagiário na OIC.</strong> Trabalho com Java/Spring Boot e
                Python/Flask: APIs, integrações e filas, do banco ao deploy em Docker.
              </p>
              <div className="links">
                <a href={links.github} target="_blank" rel="noopener">GitHub</a>
                <a href={links.linkedin} target="_blank" rel="noopener">LinkedIn</a>
                <a href="#contato">E-mail</a>
              </div>
              <MotionToggle />
            </div>
          </div>
          <span className="hint">Role para entrar no sistema</span>
        </section>

        <section id="projetos">
          <div className="sys-intro" data-scene="system">
            <div className="wrap" style={{ width: '100%' }}>
              <p className="label" style={{ marginBottom: 18 }}>Projetos</p>
              <h2>Quatro projetos, <em>um em uso real.</em></h2>
              <ol className="index">
                {projects.map((p) => (
                  <li key={p.id}>
                    <a href={`#p-${p.id}`}>
                      <b>{p.title}</b>
                      <span>{p.brief}</span>
                      <small>{p.where}</small>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          {projects.map((p, i) => {
            const readme = readmes[i];
            const header = readme ? readmeHeader(readme.markdown) : '';
            return (
            <article className="scene proj" id={`p-${p.id}`} key={p.id} data-scene="planet" data-i={i}>
              <div className="wrap" style={{ width: '100%' }}>
                <div className="col">
                  <div className="meta"><b>{p.area}</b><span>{p.where}</span></div>
                  <h3>{p.title}</h3>
                  {readme && header ? (
                    <div className="rhead readme">
                      <ReadmeMarkdown readme={readme} markdown={header} drawer={p.id} />
                    </div>
                  ) : (
                    <>
                      <p className="kind">{p.kind}</p>
                      <p className="d">{p.brief}</p>
                      <div className="chips">{p.stack.map((s) => <span key={s}>{s}</span>)}</div>
                    </>
                  )}
                  {readme && (
                    <nav className="toc" aria-label={`Seções do README de ${p.title}`}>
                      <p className="label">No README</p>
                      <ol>
                        {readmeHeadings(readme.markdown).map((h, n) => (
                          <li key={h.slug}>
                            <button type="button" data-readme={p.id} data-section={h.slug}>
                              <span>{String(n + 1).padStart(2, '0')}</span>{h.text}
                            </button>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  )}
                  <div className="go">
                    {readme && <button type="button" className="open" data-readme={p.id}>Abrir o README</button>}
                    {p.internal
                      ? <span>Projeto interno · código privado</span>
                      : <a href={p.repo} target="_blank" rel="noopener">Ver repositório no GitHub</a>}
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </section>

        <section className="sheet" id="sobre" data-scene="overview">
          <div className="wrap">
            <h2>Procuro minha primeira vaga CLT como dev back-end júnior.</h2>
            <div className="block">
              <p className="label">Experiência</p>
              <div className="xp">
                <span className="when">Atual</span>
                <h3>Estágio em desenvolvimento back-end<small>OIC</small></h3>
                <ul>
                  <li>Projetei e desenvolvi sozinho o Notifier, serviço de notificações por WhatsApp em uso interno.</li>
                  <li>Construí o catálogo de marcas de carros.</li>
                </ul>
              </div>
              <p>
                O que levo para um time: APIs e integrações com código organizado para crescer sem reescrever,
                testes, Docker e Linux no dia a dia. Quando a tarefa pede, vou até o front-end para entregar a
                funcionalidade inteira.
              </p>
            </div>
            <div className="block">
              <p className="label">Stack</p>
              <div className="stack">
                <div><span className="label">Back-end</span><ul><li>Java · Spring Boot</li><li>Python · Flask</li><li>Python · Django</li><li>C#</li></ul></div>
                <div><span className="label">Front e dados</span><ul><li>Next.js</li><li>Pandas</li></ul></div>
                <div><span className="label">Infra</span><ul><li>Docker</li><li>Linux</li><li>Git</li></ul></div>
              </div>
              <p className="offline">
                <span className="label">Fora do código</span>Ex-barista, cerâmica nas horas vagas e produção musical
                de madrugada, com dois gatos supervisionando.
              </p>
            </div>
          </div>
        </section>

        <section className="scene contact" id="contato" data-scene="core">
          <div className="wrap contact-grid">
            <div className="col">
              <p className="label">Contato</p>
              <h2>Tem uma vaga de back-end júnior?</h2>
              <p className="lede">Me mande um e-mail ou chame no LinkedIn. Respondo em até dois dias úteis.</p>
              <CopyEmail email={links.email} />
              <div className="links">
                <a href={links.github} target="_blank" rel="noopener">github.com/aishiteirai</a>
                <a href={links.linkedin} target="_blank" rel="noopener">linkedin.com/in/ryancorazza</a>
              </div>
            </div>
            <figure className="catstage">
              <div
                className="catcanvas"
                id="catStage"
                aria-label="Um gato feito de nebulosa brincando com uma galáxia. Arraste e arremesse a galáxia."
              />
              <figcaption id="catHint">
                <span className="long">
                  Arraste e arremesse a galáxia. Segure um pouco antes de soltar para o gato armar o bote.
                </span>
                <span className="short">Toque na galáxia e arraste para jogar. Segure antes de soltar: o gato arma o bote.</span>
              </figcaption>
            </figure>
          </div>
        </section>
      </main>

      {projects.map((p, i) => {
        const readme = readmes[i];
        return readme && (
          <ReadmeDrawer key={p.id} id={p.id} title={p.title} label={p.internal ? 'resumo público' : 'README.md'}>
            <ReadmeMarkdown readme={readme} idPrefix={p.id} drawer={p.id} />
          </ReadmeDrawer>
        );
      })}

      <footer>
        <div className="wrap">
          <span>© 2026 Ryan Corazza</span>
          <span>Renderizado em tempo real com three.js</span>
        </div>
      </footer>
    </>
  );
}
