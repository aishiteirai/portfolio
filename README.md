# Portfólio · Ryan Corazza

Portfólio em uma página, feito em Next.js: um sistema solar em three.js em que cada projeto é um planeta em órbita, e um gato de nebulosa que brinca com uma galáxia na seção de contato.

- Clique no sol para explorar o sistema: arraste para girar, role ou use dois dedos para aproximar, clique num planeta para ler sobre ele.
- Ao rolar até o contato, o sistema solar gira, encolhe e vira a galáxia com que o gato brinca.

## Estrutura

| Caminho | O que tem |
|---|---|
| `app/page.tsx` | Todo o conteúdo da página, renderizado no servidor |
| `app/layout.tsx` | Fontes (`next/font`), metadados e viewport |
| `app/globals.css` | Estilos e tokens de cor e tipografia |
| `lib/projects.ts` | Projetos e links: edite aqui para mudar os planetas e os cartões |
| `components/Universe.tsx` | Monta as cenas three.js no cliente e as desmonta ao sair |
| `components/CopyEmail.tsx` | Botão de copiar o e-mail |
| `lib/solar-system.js` | Sistema solar, câmera guiada pela rolagem, modo exploração e colapso na galáxia |
| `lib/nebula-cat.js` | O gato de partículas e a galáxia que ele persegue |

Cada seção marca com `data-scene` o enquadramento de câmera que pede (`hero`, `system`, `planet`, `overview`, `core`).

## Rodando localmente

Requer Node 20 ou mais novo.

```bash
npm install
npm run dev      # http://localhost:3000
```

`npm run build` gera a versão de produção e `npm run lint` checa os tipos.

## Deploy

Na Vercel, importe o repositório: o preset Next.js é detectado sozinho, sem configuração extra.
