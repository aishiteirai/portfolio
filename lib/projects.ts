export type Project = {
  id: string;
  title: string;
  kind: string;
  area: string;
  where: string;
  /** Short description, shown in the project's section, the overview list and the explore-mode card. The README tells the rest. */
  brief: string;
  stack: string[];
  repo?: string;
  internal?: boolean;
  /** Where the README page reads from: the public repo on GitHub, or content/readmes/<id>.md. Absent: no README page. */
  readme?: 'github' | 'local';
};

/** Order matters: the first project orbits closest to the star. */
export const projects: Project[] = [
  {
    id: 'notifier', title: 'Notifier', kind: 'Serviço de notificações por WhatsApp', area: 'Back-end', where: 'OIC · uso interno',
    brief: 'Serviço modular de notificações por WhatsApp, projetado e desenvolvido por mim para uso interno na OIC.',
    stack: ['Java', 'Spring Boot', 'WhatsApp API', 'Docker'], internal: true, readme: 'local',
  },
  {
    id: 'mesa', title: 'Naquela Mesa', kind: 'Cardápio digital com pedidos pelo celular', area: 'Full-stack', where: 'Projeto pessoal',
    brief: 'Cardápio digital: o cliente pede pelo celular e a loja acompanha tudo num painel que se atualiza sozinho.',
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'PostgreSQL', 'Drizzle', 'Better Auth', 'Vitest', 'Playwright'],
    repo: 'https://github.com/aishiteirai/naquela-mesa', readme: 'github',
  },
  {
    id: 'pdf', title: 'EverythingIsPDF', kind: 'API de conversão de arquivos para PDF', area: 'Back-end', where: 'Projeto pessoal',
    brief: 'API que converte documentos e imagens em PDF com LibreOffice e Pillow, com rate limit no Redis.',
    stack: ['Python', 'Flask', 'LibreOffice', 'Pillow', 'Redis', 'Docker', 'pytest'],
    repo: 'https://github.com/aishiteirai/everythingispdf', readme: 'github',
  },
  {
    id: 'cacau', title: 'Site do Cacau', kind: 'HQ virtual sobre a UFABC', area: 'Full-stack', where: 'Em dupla com Pâmela Campos',
    brief: 'HQ virtual que apresenta a UFABC, com palavras cruzadas e caça-palavras no final da leitura.',
    stack: ['Python', 'Flask', 'JavaScript'],
    repo: 'https://github.com/aishiteirai/site_do_cacau',
  },
];

export const links = {
  github: 'https://github.com/aishiteirai',
  linkedin: 'https://www.linkedin.com/in/ryancorazza',
  email: 'crzzryan@gmail.com',
};
