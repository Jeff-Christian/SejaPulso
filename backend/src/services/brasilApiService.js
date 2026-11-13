import fetch from "node-fetch";

export const fetchBrasilApiCompany = async (cnpj) => {
  const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    headers: { "User-Agent": "SejaPulso-B2B-App/1.0" },
  });
  if (!r.ok) return { ok: false, status: r.status };
  return { ok: true, status: r.status, data: await r.json() };
};

export const toCompanyData = (b, cnpj) => ({
  cnpj,
  companyName: b.razao_social,
  tradeName: b.nome_fantasia || b.razao_social,
  cnaeCode: b.cnae_fiscal,
  cnaeDescription: b.cnae_fiscal_descricao,
  location: `${b.municipio} / ${b.uf}`,
  officialPhone: b.ddd_telefone_1 || b.telefone_1,
  officialEmail: b.email,
  openingDate: b.data_inicio_atividade,
  companySize: b.porte,
  capitalSocial: b.capital_social,
});