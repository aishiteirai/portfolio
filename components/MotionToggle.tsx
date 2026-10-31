'use client';

import { useEffect, useState } from 'react';

type Mode = 'soft' | 'full';
const KEY = 'motion';

/**
 * Shown only to visitors whose system asks for reduced motion. The page then runs in a gentle mode;
 * this button lets them opt into the full animations, and back. The choice is remembered in this browser.
 * The scenes read the mode from <html data-motion>.
 */
export default function MotionToggle() {
  const [reduced, setReduced] = useState(false);
  const [mode, setMode] = useState<Mode>('soft');

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch {}
    const apply = () => {
      setReduced(mq.matches);
      const m: Mode = mq.matches ? (saved === 'full' ? 'full' : 'soft') : 'full';
      setMode(m);
      document.documentElement.dataset.motion = m;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  if (!reduced) return null;

  function toggle() {
    const next: Mode = mode === 'soft' ? 'full' : 'soft';
    setMode(next);
    document.documentElement.dataset.motion = next;
    try { localStorage.setItem(KEY, next); } catch {}
  }

  return (
    <button className="motion" type="button" onClick={toggle} aria-pressed={mode === 'full'}>
      {mode === 'soft'
        ? <>Movimento reduzido pelo seu sistema · <b>Ver animações completas</b></>
        : <>Animações completas · <b>Voltar ao movimento reduzido</b></>}
    </button>
  );
}
