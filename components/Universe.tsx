'use client';

import { useEffect, useRef } from 'react';
import { initSolarSystem } from '@/lib/solar-system';
import { startNebulaCat } from '@/lib/nebula-cat';
import { projects } from '@/lib/projects';

type NebulaCat = ReturnType<typeof startNebulaCat>;

/**
 * The fixed WebGL layer behind the page, the floating labels and the explore-mode UI.
 * The scenes are imperative three.js code; this component mounts them once and tears them down on unmount.
 */
export default function Universe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const shared: { cat: NebulaCat | null } = { cat: null };
    const stopSystem = initSolarSystem({ canvas, projects, shared });

    /* the cat is built only when the contact section comes near, and pauses when it leaves */
    const stage = document.getElementById('catStage');
    let io: IntersectionObserver | undefined;
    if (stage) {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !shared.cat) {
          try {
            shared.cat = startNebulaCat(stage, document.getElementById('catHint'));
          } catch {
            const fig = stage.closest<HTMLElement>('.catstage');
            if (fig) fig.hidden = true;
            return;
          }
        }
        shared.cat?.play(e.isIntersecting);
      }, { rootMargin: '200px 0px' });
      io.observe(stage);
    }

    return () => {
      io?.disconnect();
      shared.cat?.dispose();
      stopSystem();
    };
  }, []);

  return (
    <>
      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div className="veil" aria-hidden="true" />
      <div className="labels" id="labels" />
      <div className="explore-ui" id="exUi" hidden>
        <button className="ex-close" id="exClose" type="button">
          Voltar ao portfólio <span aria-hidden="true">×</span>
        </button>
        <aside className="ex-card" id="exCard" aria-live="polite" hidden />
        <p className="ex-hint" id="exHint">
          Arraste para girar · role ou use dois dedos para aproximar · toque num planeta
        </p>
      </div>
    </>
  );
}
