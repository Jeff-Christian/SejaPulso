// Uso (na pasta do backend):  node scripts/geminiCheck.js [modelo]
// 1) lista os modelos que a sua chave pode usar com generateContent
// 2) faz uma chamada de teste com o modelo escolhido (GEMINI_MODEL, argumento ou padrão)
try {
  process.loadEnvFile(); // lê o .env da pasta atual (Node 20.12+)
} catch {
  /* sem .env: segue com as variáveis do sistema */
}

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("❌ GEMINI_API_KEY não encontrada no .env");
  process.exit(1);
}

const BASE = "https://generativelanguage.googleapis.com/v1beta";

const list = await fetch(`${BASE}/models?pageSize=200`, {
  headers: { "x-goog-api-key": key },
});
const listData = await list.json().catch(() => null);
if (!list.ok) {
  console.error(
    `❌ Falha ao listar modelos (HTTP ${list.status}):`,
    listData?.error?.message,
  );
  process.exit(1);
}

console.log("Modelos Gemini da sua chave (e os métodos que cada um aceita):\n");
for (const m of listData.models || []) {
  if (m.name.includes("gemini")) {
    console.log(
      `  ${m.name.replace("models/", "")}  [${(m.supportedGenerationMethods || []).join(", ")}]`,
    );
  }
}
console.log(
  "\nO app usa o método generateContent: o modelo escolhido precisa tê-lo na lista.",
);

const model =
  process.argv[2] || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
console.log(`\nTestando o modelo: ${model}`);

const res = await fetch(`${BASE}/models/${model}:generateContent`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": key },
  body: JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: 'Responda apenas com o JSON {"ok": true}' }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 256,
    },
  }),
});
const data = await res.json().catch(() => null);

if (!res.ok) {
  console.error(`❌ Falhou (HTTP ${res.status}):`, data?.error?.message);
  if (res.status === 404)
    console.error(
      "   O modelo não existe para a sua chave. Use um nome da lista acima no .env (GEMINI_MODEL).",
    );
  if (res.status === 429)
    console.error(
      "   Cota esgotada ou limite por minuto. Tente de novo mais tarde.",
    );
  process.exit(1);
}

console.log("✅ Resposta:", data?.candidates?.[0]?.content?.parts?.[0]?.text);
console.log("   Uso de tokens:", data?.usageMetadata);
