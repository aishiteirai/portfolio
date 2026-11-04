'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * A side panel with a project's full README. It opens from any element with `data-readme="<id>"`,
 * jumping to `data-section="<slug>"` when given. The README itself is rendered on the server and passed in as children.
 */
export default function ReadmeDrawer({ id, title, label, children }: {
  id: string;
  title: string;
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element).closest<HTMLElement>(`[data-readme="${id}"]`);
      if (!t) return;
      e.preventDefault();
      opener.current = t;
      setOpen(true);
      const section = t.dataset.section;
      requestAnimationFrame(() => {
        const el = body.current;
        if (!el) return;
        const target = section ? el.querySelector<HTMLElement>(`#${CSS.escape(`${id}-${section}`)}`) : null;
        el.scrollTop = target ? target.offsetTop - 24 : 0;
        closeBtn.current?.focus({ preventScroll: true });
      });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [id]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      opener.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <div className={`drawer${open ? ' open' : ''}`}>
      <div className="drawer-scrim" onClick={() => setOpen(false)} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-labelledby={`${id}-drawer-title`}>
        <div className="drawer-bar">
          <span id={`${id}-drawer-title`}><b>{title}</b> · {label}</span>
          <Link href={`/projetos/${id}`}>Página própria ↗</Link>
          <button ref={closeBtn} type="button" onClick={() => setOpen(false)} aria-label="Fechar README">×</button>
        </div>
        <div ref={body} className="drawer-body readme">{children}</div>
      </aside>
    </div>
  );
}
