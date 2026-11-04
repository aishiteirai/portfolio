import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Bodoni_Moda({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-display' });
const body = Hanken_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Ryan Corazza',
  description: 'Ryan Corazza, dev back-end júnior (Java/Spring Boot, Python/Flask), aberto a vagas CLT. Projetos, experiência e contato.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0909',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
