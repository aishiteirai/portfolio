import Universe from '@/components/Universe';
import CopyEmail from '@/components/CopyEmail';
import MotionToggle from '@/components/MotionToggle';
import { links, projects } from '@/lib/projects';

/* `data-scene` marks which camera shot each section asks for; the solar system reads them while scrolling. */
export default function Home() {
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
              <span className="status"><i />Estágio em back-end na OIC</span>
              <h1>Ryan<em>Corazza</em></h1>
              <p>
                <strong>Dev full-stack com foco em back-end.</strong> Construo o que sustenta o sistema: APIs,
                integrações e filas, do banco ao deploy.
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
              <h2>Quatro corpos <em>em órbita de uma estrela.</em></h2>
            </div>
          </div>
          {projects.map((p, i) => (
            <article className="scene proj" id={`p-${p.id}`} key={p.id} data-scene="planet" data-i={i}>
              <div className="wrap" style={{ width: '100%' }}>
                <div className="col">
                  <div className="meta"><b>{p.area}</b><span>{p.where}</span></div>
                  <h3>{p.title}</h3>
                  <p className="kind">{p.kind}</p>
                  <p className="d">{p.d}</p>
                  {p.more && <p className="d more">{p.more}</p>}
                  <div className="chips">{p.stack.map((s) => <span key={s}>{s}</span>)}</div>
                  <div className="go">
                    {p.internal
                      ? <span>Projeto interno · código privado</span>
                      : <a href={p.repo} target="_blank" rel="noopener">Ver repositório</a>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="sheet" id="sobre" data-scene="overview">
          <div className="wrap">
            <h2>Gosto da parte do sistema que ninguém vê, mas todo mundo sente quando quebra.</h2>
            <div className="block">
              <p className="label">Experiência</p>
              <div className="xp">
                <span className="when">Atual</span>
                <h3>Estágio em desenvolvimento back-end<small>OIC</small></h3>
                <p>
                  Construção do catálogo de marcas de carros e autoria do Notifier, fluxo modular de notificações
                  por WhatsApp usado internamente, desenvolvido do zero.
                </p>
              </div>
              <p>
                Meu foco é back-end: APIs, integrações, filas e código organizado para que crescer não vire
                reescrever. Quando o projeto pede, vou até o front-end para entregar a funcionalidade inteira.
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
              <h2>Vamos construir algo que fique de pé.</h2>
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

      <footer>
        <div className="wrap">
          <span>© 2026 Ryan Corazza</span>
          <span>Renderizado em tempo real com three.js</span>
        </div>
      </footer>
    </>
  );
}
