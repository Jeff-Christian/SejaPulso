// shared/serviceCatalog.js

export const COMMERCIAL_RULES = {
  paymentStructure: '50% na contratação (via Asaas) e 50% na entrega do projeto',
  receivingAccount: 'Pulso Tech (Conta PJ Asaas - proibida cobrança em conta de terceiro)',
  consultantDiscountAllowed: false,
  discountPolicy: 'Qualquer variação de escopo ou valor exige aprovação prévia do financeiro/comercial antes da cobrança.',
  taxesAndFeesOwner: 'Pulso Tech absorve taxas do Asaas e impostos da venda ao cliente.',
  invoiceRequirement: 'Consultor emite NFS-e pelo próprio MEI/CNPJ no valor exato da comissão liberada antes do repasse via Pix.'
};

export const SERVICE_PLANS = {
  START: {
    id: 'START',
    label: 'Plano Start / Entrada',
    badgeColor: 'emerald',
    closingMode: 'DIRECT', // Fechamento direto pelo consultor
    description: 'Soluções rápidas de entrada para validação digital e captura imediata de clientes.'
  },
  STANDARD: {
    id: 'STANDARD',
    label: 'Plano Standard',
    badgeColor: 'cyan',
    closingMode: 'DIRECT',
    description: 'Estruturação profissional completa para empresas que buscam autoridade e escala local.'
  },
  PRO: {
    id: 'PRO',
    label: 'Plano Pro / Premium',
    badgeColor: 'purple',
    closingMode: 'DIRECT_OR_FAST_VALIDATION',
    description: 'Plataformas robustas de vendas online e portais de conteúdo avançados.'
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    label: 'Plano Enterprise (Sob Medida)',
    badgeColor: 'amber',
    closingMode: 'DISCOVERY_BRIEFING', // Tratado diretamente pela Pulso Tech (SLA 24-48h)
    description: 'Projetos especializados orçados e negociados diretamente pela engenharia da Pulso Tech.'
  }
};

export const SERVICE_PACKAGES = [
  // --- START ---
  {
    code: 'START_LP_EXPRESS',
    plan: 'START',
    name: 'Landing Page Start / Express',
    price: 1500.00,
    priceFormatted: 'R$ 1.500,00',
    isStartingPrice: false,
    deliveryTime: '5 dias úteis',
    cnaePrefixes: ['86', '95', '96', '85', '93'], // Saúde, estética, reparos, serviços pessoais, cursos
    deliverables: [
      'Página única de alta conversão (até 4 seções estratégicas)',
      'Botão flutuante e CTAs diretos para WhatsApp',
      'Formulário de captura + design 100% responsivo',
      'Otimização de velocidade para tráfego pago (Meta/Google Ads)'
    ],
    salesPlaybook: {
      targetAudience: 'Clínicas de estética, dentistas, psicólogos, oficinas, assistências técnicas, prestadores de serviços locais e profissionais que rodam anúncios.',
      howToPitch: 'Foque na perda de dinheiro com cliques desqualificados. Mostre que mandar tráfego pago direto para o WhatsApp sem uma página rápida faz o cliente desistir antes de conversar.',
      pitchHook: 'Vocês já têm uma página rápida focada em converter quem clica nos anúncios ou busca o serviço no celular direto para o agendamento no WhatsApp?',
      objections: [
        {
          objection: '“Já tenho Instagram, não preciso de site.”',
          response: 'O Instagram é ótimo para relacionamento, mas quem pesquisa no Google quer resolver o problema agora. Além disso, em anúncios pagos, uma Landing Page converte até 3x mais que o direct.'
        },
        {
          objection: '“Achei caro para uma página só.”',
          response: 'Por ser uma página única focada em conversão, ela se paga com 1 ou 2 clientes novos fechados. E você paga apenas R$ 750 de sinal agora e o restante só na entrega em 5 dias úteis.'
        }
      ]
    }
  },
  {
    code: 'START_ID_VISUAL',
    plan: 'START',
    name: 'Identidade Visual Express',
    price: 800.00,
    priceFormatted: 'R$ 800,00',
    isStartingPrice: false,
    deliveryTime: '7 dias úteis',
    cnaePrefixes: ['56', '10', '14', '43'], // Alimentação artesanal, vestuário, reformas/construção
    deliverables: [
      'Logotipo principal + variação secundária (reduzida)',
      'Paleta de cores oficial (códigos Hex/RGB)',
      'Definição tipográfica',
      'Manual básico da marca em PDF'
    ],
    salesPlaybook: {
      targetAudience: 'Empresas recém-abertas (MEIs), negócios locais com logo amador/feito no celular ou empresas passando por modernização básica.',
      howToPitch: 'Mostre que a primeira impressão define quanto o cliente aceita pagar pelo serviço. Uma marca amadora passa insegurança e obriga a empresa a competir por preço.',
      pitchHook: 'Notei que vocês têm um excelente serviço na região, mas a apresentação visual ainda não reflete o nível profissional da entrega de vocês.',
      objections: [
        {
          objection: '“Meu sobrinho/eu mesmo fiz o logo no Canva.”',
          response: 'Para começar funciona, mas quando o cliente compara orçamentos, o visual profissional transmite confiança imediata. Entregamos os arquivos vetoriais prontos para fachada, uniforme e redes em 7 dias.'
        }
      ]
    }
  },
  {
    code: 'START_SOCIAL_PACK',
    plan: 'START',
    name: 'Kit Pack Redes Sociais',
    price: 500.00,
    priceFormatted: 'R$ 500,00',
    isStartingPrice: false,
    deliveryTime: '4 dias úteis',
    cnaePrefixes: ['96', '4721', '5611'], // Salões, barbearias, cafeterias, lanchonetes
    deliverables: [
      '6 templates editáveis no Canva (Feed + Stories)',
      'Arte de capa/perfil padronizada',
      'Capas para destaques do Instagram'
    ],
    salesPlaybook: {
      targetAudience: 'Pequenos comércios, salões de beleza, barbearias e autônomos com perfil parado ou visual desorganizado no Instagram.',
      howToPitch: 'Use como produto porta de entrada (baixo atrito) para abrir relacionamento com negócios que ainda não têm orçamento para site.',
      pitchHook: 'Para facilitar a rotina de postagens de vocês sem depender de designer todo mês, montamos um kit editável no Canva pronto para vocês só trocarem foto e texto.',
      objections: [
        {
          objection: '“Não sei mexer com design.”',
          response: 'Os templates são entregues prontos no Canva gratuito: você só clica, troca a foto ou o preço do dia e baixa em 30 segundos pelo celular.'
        }
      ]
    }
  },

  // --- STANDARD ---
  {
    code: 'STD_SITE_INSTITUCIONAL',
    plan: 'STANDARD',
    name: 'Site Institucional Standard',
    price: 2500.00,
    priceFormatted: 'R$ 2.500,00',
    isStartingPrice: false,
    deliveryTime: '12 a 15 dias úteis',
    cnaePrefixes: ['69', '70', '71', '62', '66', '73'], // Advocacia, contabilidade, consultoria, engenharia/arquitetura, corretoras
    deliverables: [
      'Até 5 páginas estruturadas (Home, Sobre, Serviços, Portfólio/Galeria, Contato)',
      'Painel administrativo (CMS) para edição de textos/imagens',
      'Certificado de segurança SSL e layout responsivo',
      'Otimização SEO local básica para buscas no Google'
    ],
    salesPlaybook: {
      targetAudience: 'Escritórios de advocacia, contabilidades, consultorias B2B, arquitetos, engenheiros, clínicas maiores e prestadores corporativos.',
      howToPitch: 'Empresas B2B e serviços de ticket médio/alto são pesquisados no Google antes do fechamento. Não ter site (ou ter um site lento/antigo) faz o cliente fechar com o concorrente.',
      pitchHook: 'Quando um cliente recebe indicação de vocês e pesquisa o nome da empresa no Google, ele encontra uma estrutura que passa a autoridade do trabalho de vocês?',
      objections: [
        {
          objection: '“Já temos um site antigo no ar.”',
          response: 'Sites antigos costumam ser lentos no celular e penalizados pelo Google. Modernizamos toda a arquitetura com carregamento rápido, SSL e painel fácil para vocês atualizarem sem depender de ninguém.'
        },
        {
          objection: '“Vou pensar e te aviso.”',
          response: 'Sem problemas. Como trabalhamos com cronograma fechado de 12 a 15 dias úteis e entrada de 50% (R$ 1.250), consigo reservar a janela de produção desta semana se quiser garantir a entrega ainda este mês.'
        }
      ]
    }
  },
  {
    code: 'STD_BRANDING_COMPLETO',
    plan: 'STANDARD',
    name: 'Branding Profissional Completo',
    price: 2200.00,
    priceFormatted: 'R$ 2.200,00',
    isStartingPrice: false,
    deliveryTime: '10 dias úteis',
    cnaePrefixes: ['74', '41', '68'], // Design, incorporadoras, imobiliárias em expansão
    deliverables: [
      'Estratégia e posicionamento visual de marca',
      'Logotipo completo + variações de aplicação',
      'Brand Book detalhado (guia completo de identidade)',
      'Papelaria institucional (cartão de visita, papel timbrado) + assinatura de e-mail'
    ],
    salesPlaybook: {
      targetAudience: 'Empresas em expansão, rebranding de negócios consolidados ou startups que precisam de padronização comercial completa.',
      howToPitch: 'Diferencie de um “simples logo”: aqui a empresa recebe o universo visual completo para propostas comerciais, e-mails, apresentações e pontos físicos.',
      pitchHook: 'Vocês estão em fase de expansão e precisam alinhar a identidade visual desde o cartão/assinatura até as propostas comerciais para cobrar mais valor agregado?',
      objections: [
        {
          objection: '“Qual a diferença desse para o de R$ 800?”',
          response: 'O Express entrega apenas o logotipo básico. O Branding Completo constrói todo o posicionamento, Brand Book detalhado e papelaria corporativa para sua equipe comercial vender com padrão de grande empresa.'
        }
      ]
    }
  },
  {
    code: 'STD_CATALOGO_DIGITAL',
    plan: 'STANDARD',
    name: 'Catálogo Digital Interativo',
    price: 1800.00,
    priceFormatted: 'R$ 1.800,00',
    isStartingPrice: false,
    deliveryTime: '10 dias úteis',
    cnaePrefixes: ['47', '56'], // Varejo, minimercados, distribuidoras locais, restaurantes, pet shops
    deliverables: [
      'Catálogo web responsivo organizado por categorias',
      'Carrinho rápido de seleção de itens',
      'Envio do pedido formatado direto para o WhatsApp comercial',
      'Painel simples para atualização de produtos e preços'
    ],
    salesPlaybook: {
      targetAudience: 'Minimercados, distribuidoras de bebidas, lojas de bairro, autopeças, restaurantes e comércios que mandam PDF pesado ou foto solta no WhatsApp.',
      howToPitch: 'Atendimento manual via WhatsApp trava o vendedor. Com o catálogo interativo, o cliente escolhe os itens sozinho e o pedido já chega mastigado no WhatsApp da loja.',
      pitchHook: 'Hoje quando um cliente pede tabela de preços ou produtos no WhatsApp, vocês precisam mandar PDF ou ficar respondendo item por item?',
      objections: [
        {
          objection: '“Não quero pagar taxa por venda de aplicativo (iFood/marketplace).”',
          response: 'Esse é o maior diferencial: o catálogo é 100% seu, sem comissão por pedido e sem mensalidade de plataforma. O cliente monta o carrinho e manda direto no seu WhatsApp.'
        }
      ]
    }
  },

  // --- PRO ---
  {
    code: 'PRO_ECOMMERCE',
    plan: 'PRO',
    name: 'Loja Virtual / E-commerce Pro',
    price: 5500.00,
    priceFormatted: 'R$ 5.500,00',
    isStartingPrice: false,
    deliveryTime: '20 a 25 dias úteis',
    cnaePrefixes: ['46', '4781', '4772', '4751'], // Atacadistas, moda, cosméticos, eletrônicos com venda nacional
    deliverables: [
      'E-commerce completo (Shopify / WooCommerce / Nuvemshop)',
      'Integração com gateways de pagamento (Pix e Cartão)',
      'Cálculo automático de frete (Correios / Melhor Envio)',
      'Cadastro inicial de até 30 produtos + treinamento de gestão'
    ],
    salesPlaybook: {
      targetAudience: 'Lojas físicas querendo vender para todo o Brasil, marcas próprias (roupas, cosméticos, suplementos) e distribuidores.',
      howToPitch: 'Mostre a escalabilidade: vender 24h por dia com pagamento e frete automáticos sem depender de atendimento humano em cada venda.',
      pitchHook: 'Vocês já vendem para fora da cidade com cálculo automático de frete e checkout online ou ainda dependem de fechar cada pedido manualmente?',
      objections: [
        {
          objection: '“Tenho medo de não saber operar a loja depois.”',
          response: 'Entregamos a loja configurada com os primeiros 30 produtos cadastrados e fazemos o treinamento prático da sua equipe para gerenciar pedidos e estoque com facilidade.'
        }
      ]
    }
  },
  {
    code: 'PRO_PORTAL_CONTEUDO',
    plan: 'PRO',
    name: 'Portal Corporativo / Conteúdo',
    price: 4800.00,
    priceFormatted: 'R$ 4.800,00',
    isStartingPrice: false,
    deliveryTime: '20 dias úteis',
    cnaePrefixes: ['6810', '6821', '58', '63'], // Imobiliárias, portais de notícias, associações, diretórios
    deliverables: [
      'Estrutura avançada para portais de notícias, imobiliárias ou diretórios',
      'Busca dinâmica e sistema de filtros customizados',
      'Painel de gerenciamento corporativo multi-categorias',
      'Área de membros / acesso restrito básico'
    ],
    salesPlaybook: {
      targetAudience: 'Imobiliárias com carteira de imóveis, portais regionais de notícias, associações comerciais e empresas de conteúdo.',
      howToPitch: 'Foque na experiência de busca e filtragem rápida (por bairro, faixa de valor, categoria) e na autonomia da equipe editorial.',
      pitchHook: 'Os clientes conseguem filtrar rapidamente o que procuram no portal de vocês pelo celular sem travamentos?',
      objections: [
        {
          objection: '“Usamos um sistema engessado de terceiros.”',
          response: 'Desenvolvemos uma estrutura sob medida para a identidade da sua marca, com filtros rápidos, SEO otimizado para ranquear no Google e controle total do conteúdo.'
        }
      ]
    }
  },

  // --- ENTERPRISE ---
  {
    code: 'ENT_SISTEMA_SAAS',
    plan: 'ENTERPRISE',
    name: 'Sistemas Web / SaaS Sob Medida',
    price: 8500.00,
    priceFormatted: 'A partir de R$ 8.500,00',
    isStartingPrice: true,
    deliveryTime: 'Definido na proposta (SLA Discovery: 24h a 48h)',
    cnaePrefixes: ['62', '64', '49', '52'], // Logística, fintechs, operações complexas, franquias
    deliverables: [
      'Levantamento técnico e proposta direta pela engenharia da Pulso Tech',
      'CRMs internos, sistemas de agendamento avançado ou controle de estoque',
      'Dashboards analíticos, painéis administrativos complexos e APIs de automação'
    ],
    salesPlaybook: {
      targetAudience: 'Empresas com gargalos operacionais em planilhas, franquias, operações logísticas ou empreendedores criando um SaaS próprio.',
      howToPitch: 'REGRA DE OURO: O consultor NÃO passa orçamento fechado. Identifique a dor operacional, preencha o Briefing/Discovery e agende a call com a engenharia da Pulso Tech.',
      pitchHook: 'Esse processo que vocês controlam hoje em várias planilhas/sistemas desconectados dá para centralizar numa plataforma própria. Vou registrar o escopo técnico para nossos engenheiros apresentarem a arquitetura ideal.',
      objections: [
        {
          objection: '“Me dá pelo menos uma ideia de valor agora.”',
          response: 'Projetos sob medida partem de R$ 8.500,00, mas o valor exato depende das regras de negócio e integrações. Em até 48h nossa equipe técnica te entrega a proposta fechada sem compromisso.'
        }
      ]
    }
  },
  {
    code: 'ENT_APP_MOBILE',
    plan: 'ENTERPRISE',
    name: 'Aplicativos Mobile PWA / Híbridos',
    price: 12000.00,
    priceFormatted: 'A partir de R$ 12.000,00',
    isStartingPrice: true,
    deliveryTime: 'Definido na proposta (SLA Discovery: 24h a 48h)',
    cnaePrefixes: [], // Acionado via qualificação de necessidade de app
    deliverables: [
      'Aplicativo mobile (iOS / Android híbrido ou PWA)',
      'Painel web administrativo de gestão',
      'Notificações push e banco de dados gerenciado em nuvem'
    ],
    salesPlaybook: {
      targetAudience: 'Empresas com base recorrente de usuários, clubes de assinatura, delivery próprio, apps de serviços ou startups.',
      howToPitch: 'Qualifique se o cliente realmente precisa de aplicativo instalado/notificações push ou se um sistema web resolve. Se for App, encaminhe via Briefing Enterprise.',
      pitchHook: 'Como vocês precisam de presença direta no celular do usuário com notificações e painel de gestão integrado, vou acionar nosso time de engenharia para desenhar o escopo do aplicativo.',
      objections: [
        {
          objection: '“Precisa publicar na Apple Store e Google Play?”',
          response: 'Sim, trabalhamos tanto com aplicativos híbridos publicados nas lojas quanto com PWA de instalação rápida, dependendo do orçamento e estratégia do projeto.'
        }
      ]
    }
  }
];

// ============================================================================
// HELPERS DE INTEGRAÇÃO (Backend & Frontend)
// ============================================================================

/**
 * 1. Alimenta o CNAE_PACKAGE_MAP no backend (leadController.js)
 * Retorna o pacote sugerido com base nos dígitos do CNAE.
 */
export function getSuggestedPackageByCnae(cnaeCode) {
  const clean = String(cnaeCode || '').replace(/\D/g, '');
  const prefix4 = clean.substring(0, 4);
  const prefix2 = clean.substring(0, 2);

  // Busca match exato de 4 dígitos primeiro, depois 2 dígitos
  const matched =
    SERVICE_PACKAGES.find((pkg) => pkg.cnaePrefixes.includes(prefix4)) ||
    SERVICE_PACKAGES.find((pkg) => pkg.cnaePrefixes.includes(prefix2)) ||
    SERVICE_PACKAGES.find((pkg) => pkg.code === 'STD_SITE_INSTITUCIONAL'); // Fallback padrão

  return {
    code: matched.code,
    plan: matched.plan,
    name: matched.name,
    price: matched.price,
    priceFormatted: matched.priceFormatted,
    deliveryTime: matched.deliveryTime,
    formattedLabel: `${matched.name} (${matched.priceFormatted})`,
    pitchHook: matched.salesPlaybook.pitchHook,
    howToPitch: matched.salesPlaybook.howToPitch
  };
}

/**
 * 2. Alimenta o <select> do EditDealModal.jsx e SalesHandoverModal.jsx
 * Agrupa os pacotes por plano para renderização com <optgroup>.
 */
export function getGroupedPackagesForSelect() {
  return Object.values(SERVICE_PLANS).map((plan) => ({
    planId: plan.id,
    planLabel: plan.label,
    closingMode: plan.closingMode,
    options: SERVICE_PACKAGES.filter((pkg) => pkg.plan === plan.id).map((pkg) => ({
      value: pkg.code,
      label: `${pkg.name} — ${pkg.priceFormatted} (${pkg.deliveryTime})`,
      price: pkg.price,
      isStartingPrice: pkg.isStartingPrice
    }))
  }));
}

/**
 * 3. Busca detalhes completos de um pacote pelo código (ex: para preencher valor automático no modal)
 */
export function getPackageByCode(code) {
  return SERVICE_PACKAGES.find((pkg) => pkg.code === code) || null;
}