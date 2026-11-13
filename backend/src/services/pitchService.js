import OpenAI from "openai";
import { tripBreaker, isQuotaError } from "./aiGuard.js";
import { getSuggestedPackageByCnae } from "../config/serviceCatalog.js";

// Cliente criado sob demanda: evita erro no import caso o .env ainda não
// tenha sido carregado quando este módulo é avaliado.
let openaiClient = null;
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada no .env");
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 1,
      timeout: 20000,
    });
  }
  return openaiClient;
};

const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.com.br",
  "bol.com.br",
  "uol.com.br",
  "icloud.com",
];

// Monta SINAIS reais sobre a empresa. Quanto mais fato verdadeiro a IA recebe,
// menos ela inventa e menos genérica fica.
const buildSignals = (c) => {
  const signals = [];

  const email = String(c.officialEmail || "").toLowerCase();
  const domain = email.includes("@") ? email.split("@")[1] : "";
  if (domain) {
    signals.push(
      FREE_EMAIL_DOMAINS.includes(domain)
        ? `Usa e-mail gratuito (${domain}): sinal forte de que NÃO tem domínio/site próprio`
        : `Usa e-mail com domínio próprio (@${domain}): pode já ter site, vale perguntar se está atualizado`,
    );
  }

  if (c.openingDate) {
    const years = Math.floor(
      (Date.now() - new Date(c.openingDate).getTime()) / 31557600000,
    );
    if (!Number.isNaN(years) && years >= 0) {
      signals.push(
        years < 2
          ? `Empresa nova (${years} ano(s)): precisa ser encontrada e passar credibilidade`
          : `Empresa com ${years} anos de mercado: já tem clientela, o ganho é organizar e captar mais`,
      );
    }
  }

  if (c.companySize) signals.push(`Porte: ${c.companySize}`);
  if (c.capitalSocial) signals.push(`Capital social: R$ ${c.capitalSocial}`);

  const phone = String(c.officialPhone || "").replace(/\D/g, "");
  if (phone.length === 11 && phone[2] === "9") {
    signals.push("Telefone oficial é celular (provável WhatsApp)");
  } else if (phone.length === 10) {
    signals.push(
      "Telefone oficial é fixo (WhatsApp talvez não seja o canal principal)",
    );
  }

  return signals;
};

const SYSTEM_PROMPT = `Você é um Diretor Comercial B2B sênior da SejaPulso / Pulso Tech. Você treina consultores de vendas que vão abordar pequenas e médias empresas locais, quase sempre pelo WhatsApp, para vender sites e presença digital.
 
O consultor recebe dados públicos do CNPJ. Ele NÃO conhece a empresa. Sua tarefa é dizer COMO ele deve conduzir a conversa, com a dor mais provável do SEGMENTO.
 
## Regras de honestidade (mais importantes)
- Você só tem dados públicos. NUNCA afirme ter visto o Instagram, o site, o trabalho ou os clientes da empresa. Proibido: "acompanho o trabalho de vocês", "vi que vocês...", "parabéns pelo trabalho".
- Trate dores como PROVÁVEIS do segmento, nunca como fatos sobre a empresa. Use "costuma", "em geral", "muito comum".
- Use os "signals" recebidos para personalizar. Se um signal indicar e-mail gratuito, a pergunta de abertura pode checar se já têm site. Se a empresa é antiga, valorize a clientela existente.
- Não invente números, estatísticas nem prazos.
 
## Tradução do segmento
- Converta o CNAE para como o dono fala no dia a dia (ex.: "mercadinho", "oficina mecânica", "clínica de estética"). Nunca copie a descrição da Receita.
 
## Estilo do script de WhatsApp
- 2 a 3 frases curtas, tom de conversa entre pessoas, sem emoji em excesso (no máximo 1).
- Começa com o nome da empresa de forma natural e termina com UMA pergunta simples e fácil de responder.
- Foca em um problema do segmento, não em vender o produto. NÃO mencione preço nem o nome do pacote.
- Proibido clichê: "estudo rápido de conversão", "carregamento abaixo de 2 segundos", "canal de atendimento instantâneo", "solução completa", "transformação digital", "presença digital" solto, "posso te enviar uma proposta".
 
## Qualidade
- Cada item precisa ser específico para ESTE segmento. Se serviria para qualquer empresa, reescreva.
- Objeções devem ser as que um dono desse segmento realmente faria, com respostas curtas e honestas, sem pressão.
 
## Formato
Responda APENAS com JSON válido neste formato exato:
{
  "segmentLabel": "string, nome popular do negócio (2 a 4 palavras)",
  "whyOffer": "string, 2 a 3 frases informais para o consultor: por que esse pacote faz sentido para esse segmento e o que o dono perde sem ele",
  "painPoints": ["string", "string", "string"],
  "pitchScript": "string, mensagem de WhatsApp",
  "openingQuestions": ["string", "string"],
  "objections": [
    { "objection": "string", "answer": "string" },
    { "objection": "string", "answer": "string" }
  ],
  "avoid": ["string", "string"],
  "nextStep": "string, o micro-passo que o consultor deve propor depois da resposta positiva (ex.: mandar exemplo, marcar 10 min de conversa)"
}
 
## Exemplo de qualidade (segmento diferente, só para calibrar o nível)
Entrada: oficina mecânica, e-mail gmail, 8 anos, celular.
Saída esperada (resumida):
{
  "segmentLabel": "Oficina mecânica",
  "whyOffer": "Oferta o site simples porque oficina vive de confiança e indicação. Quem não acha a oficina no Google ou não vê o que ela faz acaba indo na que aparece primeiro, mesmo sendo pior.",
  "painPoints": ["Cliente pesquisa 'mecânico perto de mim' e não encontra a oficina", "Orçamento por telefone toma tempo e muita gente desiste de esperar", "Sem lugar para mostrar serviços, horários e localização num só lugar"],
  "pitchScript": "Oi, pessoal da Auto Center Silva, tudo bem? Trabalho com sites para oficinas e vi que vocês estão em Santo André. Quando alguém busca mecânico na região, vocês já aparecem com endereço e botão de WhatsApp?",
  "openingQuestions": ["Hoje o cliente novo chega mais por indicação ou por busca na internet?", "Vocês já têm um lugar onde o cliente vê serviços e horário sem precisar ligar?"],
  "objections": [{"objection": "Meus clientes vêm por indicação", "answer": "Ótimo sinal. O site não substitui isso, ele ajuda quem foi indicado a confirmar que vocês são confiáveis antes de ir."}],
  "avoid": ["Falar de tecnologia ou SEO com termo técnico", "Mandar o preço antes de entender se ele quer o site"],
  "nextStep": "Oferecer enviar um exemplo de site de outra oficina e combinar 10 minutos para conversar."
}`;

const asStringArray = (v, max) =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x.trim()).slice(0, max)
    : [];

// Garante que o frontend nunca quebre com resposta incompleta da IA
const normalizeAiContent = (raw) => {
  const pitchScript =
    typeof raw?.pitchScript === "string" ? raw.pitchScript.trim() : "";
  const whyOffer = typeof raw?.whyOffer === "string" ? raw.whyOffer.trim() : "";
  if (!pitchScript || !whyOffer) throw new Error("Resposta da IA incompleta");

  return {
    segmentLabel: String(raw.segmentLabel || "").trim(),
    whyOffer,
    painPoints: asStringArray(raw.painPoints, 3),
    pitchScript,
    openingQuestions: asStringArray(raw.openingQuestions, 2),
    objections: Array.isArray(raw.objections)
      ? raw.objections
          .filter((o) => o?.objection && o?.answer)
          .slice(0, 3)
          .map((o) => ({
            objection: String(o.objection),
            answer: String(o.answer),
          }))
      : [],
    avoid: asStringArray(raw.avoid, 3),
    nextStep: typeof raw?.nextStep === "string" ? raw.nextStep.trim() : "",
  };
};

// Consome a Fonte Única (serviceCatalog.js) mantendo o contrato esperado pelo pitchGateway.js
export const resolvePackage = (cnaeCode) => {
  const pkg = getSuggestedPackageByCnae(cnaeCode);
  return {
    package: pkg.formattedLabel,
    packageCode: pkg.code,
    plan: pkg.plan,
    deliveryTime: pkg.deliveryTime,
    howToPitch: pkg.howToPitch,
    pitchHook: pkg.pitchHook,
  };
};

const cleanName = (companyData) =>
  String(companyData.tradeName || companyData.companyName || "")
    .replace(/\d+/g, "")
    .replace(/\b(LTDA|MEI|ME|EPP|S\/A)\b/gi, "")
    .replace(/[\.\-\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Fallback honesto alimentado pelo playbook oficial do serviceCatalog.js
export const buildFallbackPitch = (companyData) => {
  const mappedInfo = resolvePackage(companyData.cnaeCode);
  const name = cleanName(companyData);
  const place = companyData.location
    ? `aqui em ${companyData.location}`
    : "aqui na região";

  return {
    suggestedPackage: mappedInfo.package,
    packageCode: mappedInfo.packageCode,
    plan: mappedInfo.plan,
    deliveryTime: mappedInfo.deliveryTime,
    segmentLabel: companyData.cnaeDescription || "Negócio Local",
    whyOffer: mappedInfo.howToPitch,
    painPoints: [],
    pitchScript: `Oi, pessoal da ${name}, tudo bem? Atendemos empresas ${place} com estruturação digital. ${mappedInfo.pitchHook}`,
    openingQuestions: [mappedInfo.pitchHook],
    objections: [],
    avoid: [],
    nextStep: `Apresentar detalhes do pacote ${mappedInfo.package} (prazo: ${mappedInfo.deliveryTime}) e combinar 10 minutos para alinhamento.`,
  };
};

export const generateSmartPitch = async (companyData) => {
  const mappedInfo = resolvePackage(companyData.cnaeCode);
  const cleanCompanyName = cleanName(companyData);
  let response = null; // se chegou a existir, a OpenAI já cobrou os tokens

  try {
    response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 900,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            companyName: cleanCompanyName,
            cnaeDescription: companyData.cnaeDescription,
            city: companyData.location,
            suggestedPackage: mappedInfo.package,
            deliveryTime: mappedInfo.deliveryTime,
            catalogStrategy: mappedInfo.howToPitch,
            catalogHook: mappedInfo.pitchHook,
            signals: buildSignals(companyData),
          }),
        },
      ],
    });

    console.log("🧮 [AI usage]", response.usage);

    const aiContent = normalizeAiContent(
      JSON.parse(response.choices[0].message.content),
    );

    return {
      suggestedPackage: mappedInfo.package,
      packageCode: mappedInfo.packageCode,
      plan: mappedInfo.plan,
      deliveryTime: mappedInfo.deliveryTime,
      ...aiContent,
      source: "ai",
    };
  } catch (error) {
    console.error("⚠️ [OpenAI Pitch Warning] Usando fallback:", error.message);

    // 429: pausa as chamadas (60 min se acabou o saldo, 2 min se foi limite de ritmo)
    if (error?.status === 429) tripBreaker(isQuotaError(error) ? 60 : 2);

    return {
      ...buildFallbackPitch(companyData),
      source: "fallback",
      charged: response !== null,
    };
  }
};