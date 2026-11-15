// Uso (na pasta do backend):  node scripts/seedCommissionTiers.js
// Cadastra/atualiza os 3 tiers do contrato. A taxa real da comissão vem de
// src/utils/commissionRules.js (muda com a faixa de valor da venda); commissionRate é legado.
try {
  process.loadEnvFile();
} catch {
  /* sem .env */
}

const { prisma } = await import("../src/config/db.js");

console.log(
  "Tiers atuais:",
  await prisma.commissionTier.findMany({ orderBy: { id: "asc" } }),
);

const TIERS = [
  {
    id: 1,
    name: "Tier 1 - Bronze",
    minDeals: 0,
    maxDeals: 3,
    commissionRate: 8,
  },
  {
    id: 2,
    name: "Tier 2 - Prata",
    minDeals: 4,
    maxDeals: 8,
    commissionRate: 10,
  },
  {
    id: 3,
    name: "Tier 3 - Ouro",
    minDeals: 9,
    maxDeals: null,
    commissionRate: 12,
  },
];

for (const { id, ...t } of TIERS) {
  await prisma.commissionTier.upsert({
    where: { id },
    create: { id, ...t },
    update: { name: t.name, minDeals: t.minDeals, maxDeals: t.maxDeals }, // não mexe no legado
  });
}

console.log(
  "✅ Tiers gravados:",
  await prisma.commissionTier.findMany({ orderBy: { id: "asc" } }),
);
await prisma.$disconnect();
