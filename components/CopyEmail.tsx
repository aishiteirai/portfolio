'use client';

import { useRef, useState } from 'react';

export default function CopyEmail({ email }: { email: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState('Clique no e-mail para copiar.');

  function selectText() {
    if (!ref.current) return;
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    const sel = getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    setStatus('Selecionado. Use Ctrl+C para copiar.');
  }

  function copy() {
    try {
      navigator.clipboard.writeText(email).then(() => setStatus('E-mail copiado.'), selectText);
    } catch {
      selectText();
    }
  }

  return (
    <>
      <button className="mail" ref={ref} type="button" aria-describedby="copied" onClick={copy}>
        {email}
      </button>
      <span className="copied" id="copied" aria-live="polite">{status}</span>
    </>
  );
}
