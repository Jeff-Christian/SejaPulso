import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import { prisma } from "../config/db.js";
import { onlyDigits, isValidCnpj, normalizePhone } from "../utils/brDocs.js";

const norm = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");

const ALIASES = {
  cnpj: ["cnpj"],
  companyName: ["razaosocial", "razao", "empresa", "nomeempresarial", "nome"],
  tradeName: ["nomefantasia", "fantasia"],
  phone: ["telefone", "telefone1", "tel", "celular", "fone", "dddtelefone1"],
  email: ["email", "emailempresa", "correioeletronico"],
  city: ["municipio", "cidade"],
  state: ["uf", "estado"],
  cnaeCode: ["cnae", "cnaefiscal", "cnaeprincipal", "codigocnae"],
  cnaeDescription: ["cnaedescricao", "descricaocnae", "atividade", "atividadeprincipal"],
};

const cellText = (v) => {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if (v.text) return String(v.text);
    if (v.result != null) return String(v.result);
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("");
    return "";
  }
  return String(v);
};

const readMatrix = async (file) => {
  const name = file.originalname.toLowerCase();
  if (name.endsWith(".csv")) {
    return parse(file.buffer.toString("utf8"), {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      delimiter: [",", ";"],
    });
  }
  if (name.endsWith(".xlsx")) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(file.buffer);
    const ws = wb.worksheets[0];
    const matrix = [];
    ws.eachRow({ includeEmpty: false }, (row) =>
      matrix.push(Array.from(row.values).slice(1).map(cellText))
    );
    return matrix;
  }
  throw new Error("Formato não suportado. Envie .xlsx ou .csv.");
};

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

export const analyzeFile = async (file) => {
  const matrix = await readMatrix(file);
  if (matrix.length < 2) throw new Error("Arquivo vazio ou sem linhas de dados.");

  const [header, ...body] = matrix;
  const idx = {};
  header.forEach((h, i) => {
    const key = norm(h);
    for (const [field, names] of Object.entries(ALIASES)) {
      if (idx[field] === undefined && names.includes(key)) idx[field] = i;
    }
  });

  if (idx.cnpj === undefined) {
    const err = new Error("Coluna de CNPJ não encontrada.");
    err.headers = header;
    throw err;
  }

  const seen = new Set();
  const valid = [];
  const errors = [];
  let invalid = 0;
  let duplicatesInFile = 0;
  let withoutPhone = 0;

  const addError = (line, reason, value) => {
    invalid++;
    if (errors.length < 50) errors.push({ line, reason, value });
  };

  body.forEach((row, i) => {
    const line = i + 2;
    const get = (f) => (idx[f] === undefined ? "" : String(row[idx[f]] ?? "").trim());

    // Excel costuma perder o zero à esquerda do CNPJ quando a célula é numérica
    let cnpj = onlyDigits(get("cnpj"));
    if (cnpj.length >= 8 && cnpj.length < 14) cnpj = cnpj.padStart(14, "0");

    if (!isValidCnpj(cnpj)) return addError(line, "CNPJ inválido", get("cnpj"));
    if (seen.has(cnpj)) {
      duplicatesInFile++;
      return;
    }
    seen.add(cnpj);

    const companyName = get("companyName") || get("tradeName");
    if (!companyName) return addError(line, "Sem razão social ou nome fantasia", cnpj);

    const phone = normalizePhone(get("phone"));
    if (!phone) withoutPhone++;

    const email = get("email").toLowerCase();

    valid.push({
      cnpj,
      companyName,
      tradeName: get("tradeName") || null,
      contactPhone: phone,
      contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
      city: get("city") || null,
      state: get("state").toUpperCase().slice(0, 2) || null,
      cnaeCode: onlyDigits(get("cnaeCode")) || null,
      cnaeDescription: get("cnaeDescription") || null,
    });
  });

  // Quais CNPJs já existem no banco (nunca sobrescrevemos lead de ninguém)
  const existing = new Set();
  for (const part of chunk(valid.map((l) => l.cnpj), 1000)) {
    const found = await prisma.lead.findMany({
      where: { cnpj: { in: part } },
      select: { cnpj: true },
    });
    found.forEach((f) => existing.add(f.cnpj));
  }

  const toInsert = valid.filter((l) => !existing.has(l.cnpj));

  return {
    toInsert,
    summary: {
      totalRows: body.length,
      toImport: toInsert.length,
      alreadyInDb: existing.size,
      duplicatesInFile,
      invalid,
      withoutPhone,
      errors,
      detectedColumns: Object.keys(idx),
      sample: toInsert.slice(0, 5),
    },
  };
};

export const commitImport = async ({ file, uploadedBy, analysis }) => {
  const { toInsert, summary } = analysis;

  const batch = await prisma.importBatch.create({
    data: {
      filename: file.originalname,
      uploadedBy,
      total: summary.totalRows,
      inserted: 0,
      duplicates: summary.alreadyInDb + summary.duplicatesInFile,
      invalid: summary.invalid,
    },
  });

  let inserted = 0;
  for (const part of chunk(toInsert, 1000)) {
    const r = await prisma.lead.createMany({
      data: part.map((l) => ({
        ...l,
        status: "POOL",
        source: "BASE_CENTRAL",
        importBatchId: batch.id,
      })),
      skipDuplicates: true,
    });
    inserted += r.count;
  }

  await prisma.importBatch.update({ where: { id: batch.id }, data: { inserted } });
  return { batchId: batch.id, inserted };
};