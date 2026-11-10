import multer from "multer";
import { analyzeFile, commitImport } from "../services/leadImportService.js";

export const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
}).single("file");

export const importLeads = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Envie um arquivo .xlsx ou .csv." });

  try {
    const analysis = await analyzeFile(req.file);

    if (req.query.dryRun === "true") {
      return res.json({ dryRun: true, ...analysis.summary });
    }

    const result = await commitImport({
      file: req.file,
      uploadedBy: req.user.id,
      analysis,
    });
    return res.json({ dryRun: false, ...result, ...analysis.summary, sample: undefined });
  } catch (err) {
    console.error("❌ [importLeads]:", err);
    return res.status(400).json({
      error: err.message || "Falha ao processar o arquivo.",
      headers: err.headers,
    });
  }
};