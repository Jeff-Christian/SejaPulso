import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db.js';

async function main() {
  console.log('🌱 Gerando dados iniciais para o SejaPulso no Neon.tech...');

  // Criptografa a senha de teste
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Criar um Tier de Comissão base (Tier 1 Bronze - 10%)
  const tierBronze = await prisma.commissionTier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Tier 1 — Bronze',
      minDeals: 0,
      maxDeals: 3,
      commissionRate: 10.0,
    },
  });

  // 2. Criar Usuário Administrador da Pulso Tech (ADMIN)
  const admin = await prisma.affiliate.upsert({
    where: { email: 'admin@pulsotech.com.br' },
    update: {},
    create: {
      role: 'ADMIN',
      companyName: 'Pulso Tech Tecnologia LTDA',
      tradeName: 'Pulso Tech',
      cnpj: '00000000000191',
      responsible: 'Administrador Pulso',
      email: 'admin@pulsotech.com.br',
      passwordHash: passwordHash,
      phone: '11999999999',
      status: 'APPROVED',
      contractSigned: true,
    },
  });

  // 3. Criar Usuário Afiliado Pendente de Aprovação (AFILIADO PENDENTE)
  const pendingAffiliate = await prisma.affiliate.upsert({
    where: { email: 'consultor.pendente@empresa.com.br' },
    update: {},
    create: {
      role: 'AFFILIATE',
      companyName: 'Consultoria B2B Soluções LTDA',
      tradeName: 'Consultoria B2B',
      cnpj: '12345678000195',
      responsible: 'Carlos Consultor',
      email: 'consultor.pendente@empresa.com.br',
      passwordHash: passwordHash,
      phone: '11988887777',
      status: 'PENDING_APPROVAL',
      contractSigned: false,
      tierId: tierBronze.id,
    },
  });

  // 4. Criar Usuário Afiliado Aprovado para Acesso ao Dashboard (AFILIADO ATIVO)
  const approvedAffiliate = await prisma.affiliate.upsert({
    where: { email: 'afiliado.ativo@parceiro.com.br' },
    update: {},
    create: {
      role: 'AFFILIATE',
      companyName: 'Parceiro Digital Vendas MEI',
      tradeName: 'Parceiro Digital',
      cnpj: '98765432000110',
      responsible: 'Fernanda Lima',
      email: 'afiliado.ativo@parceiro.com.br',
      passwordHash: passwordHash,
      phone: '11977776666',
      status: 'APPROVED',
      contractSigned: true,
      tierId: tierBronze.id,
    },
  });

  console.log('✅ Dados de teste criados com sucesso!');
  console.log('----------------------------------------------------');
  console.log('🔑 CREDENCIAIS DE TESTE (Senha comum: 123456):');
  console.log('1. ADMIN:            admin@pulsotech.com.br');
  console.log('2. PENDENTE:         consultor.pendente@empresa.com.br');
  console.log('3. AFILIADO ATIVO:   afiliado.ativo@parceiro.com.br');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });