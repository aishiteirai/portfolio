export type Project = {
  id: string;
  title: string;
  kind: string;
  area: string;
  where: string;
  /** Full description, shown in the project's section. */
  d: string;
  /** Optional second paragraph with a technical detail. */
  more?: string;
  /** One sentence for the card in the explore mode. */
  brief: string;
  stack: string[];
  repo?: string;
  internal?: boolean;
};

/** Order matters: the first project orbits closest to the star. */
export const projects: Project[] = [
  {
    id: 'notifier', title: 'Notifier', kind: 'Notificações por WhatsApp', area: 'Back-end', where: 'OIC · interno',
    d: 'Fluxo modular de notificações por WhatsApp, criado como ferramenta interna da OIC e desenvolvido inteiramente por mim, da arquitetura à entrega. Novos tipos de aviso entram como módulos, sem alterar o fluxo principal.',
    brief: 'Fluxo modular de notificações por WhatsApp, feito do zero para uso interno na OIC.',
    stack: ['Java', 'Spring Boot', 'WhatsApp API', 'Docker'], internal: true,
  },
  {
    id: 'mesa', title: 'Naquela Mesa', kind: 'Cardápio digital com pedidos pelo celular', area: 'Full-stack', where: 'Projeto pessoal',
    d: 'O cliente monta o pedido na página pública da loja, sem instalar nada. A equipe recebe, acompanha e imprime tudo num painel que se atualiza sozinho, com alerta sonoro, comanda para impressora térmica e métricas de faturamento.',
    more: 'Monólito modular: cada domínio (pedidos, cardápio, lojas, WhatsApp, auditoria) é um módulo com dados, regras e API pública próprios. O preço é sempre recalculado no servidor antes de gravar o pedido.',
    brief: 'Cardápio digital: o cliente pede pelo celular e a loja acompanha tudo num painel que se atualiza sozinho.',
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'PostgreSQL', 'Drizzle', 'Better Auth', 'Vitest', 'Playwright'],
    repo: 'https://github.com/aishiteirai/naquela-mesa',
  },
  {
    id: 'cacau', title: 'Site do Cacau', kind: 'HQ virtual sobre a UFABC', area: 'Full-stack', where: 'Com Pâmela Campos',
    d: '"Cacau em: Conhecendo a UFABC" apresenta a universidade em quadrinhos, com o Cacau e a Betty como guias. A leitura termina em atividades interativas: palavras cruzadas e caça-palavras.',
    brief: 'HQ virtual que apresenta a UFABC, com palavras cruzadas e caça-palavras no final da leitura.',
    stack: ['Python', 'Flask', 'JavaScript'],
    repo: 'https://github.com/aishiteirai/site_do_cacau',
  },
  {
    id: 'pdf', title: 'EverythingIsPDF', kind: 'Conversor de arquivos para PDF', area: 'Back-end', where: 'Laboratório',
    d: 'Serviço web que converte documentos e imagens em PDF. Documentos passam pelo LibreOffice em modo headless e imagens pelo Pillow. Tem API documentada, rate limit compartilhado no Redis e roda em Docker.',
    more: 'No front, bolinhas com física que dá para arremessar: o atrito depende do tempo e não da taxa de quadros, então se comportam igual numa tela de 60 Hz e numa de 120 Hz.',
    brief: 'Converte documentos e imagens em PDF com LibreOffice e Pillow, por uma API documentada.',
    stack: ['Python', 'Flask', 'LibreOffice', 'Pillow', 'Redis', 'Docker', 'pytest'],
    repo: 'https://github.com/aishiteirai/everythingispdf',
  },
];

export const links = {
  github: 'https://github.com/aishiteirai',
  linkedin: 'https://www.linkedin.com/in/ryancorazza',
  email: 'crzzryan@gmail.com',
};
