// components/ImportLeadsTab.jsx
import { useState } from "react";
import { Upload } from "lucide-react";
import { apiUpload } from "../services/api";

const Stat = ({ label, value, tone = "text-white" }) => (
  <div className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-4">
    <p className="text-[10px] font-mono uppercase text-gray-400">{label}</p>
    <p className={`text-2xl font-black font-mono ${tone}`}>{value}</p>
  </div>
);

export const ImportLeadsTab = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (dryRun) => {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await apiUpload(`/admin/leads/import?dryRun=${dryRun}`, form);
      if (dryRun) {
        setPreview(data);
        setResult(null);
      } else {
        setResult(data);
        setPreview(null);
        setFile(null);
      }
    } catch (err) {
      setError(
        err.headers
          ? `${err.message} Colunas encontradas: ${err.headers.join(", ")}`
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Importar base de leads</h2>
        <p className="text-xs text-gray-400 mt-1">
          Envie um .xlsx ou .csv. Você confere o resultado antes de confirmar.
        </p>
      </div>

      <label className="flex items-center gap-3 bg-[#0B132B] border border-dashed border-[#1E2D50] rounded-xl p-4 cursor-pointer hover:border-[#00F5D4]/50 transition">
        <Upload className="w-5 h-5 text-[#00F5D4]" />
        <span className="text-xs text-gray-300">
          {file ? file.name : "Escolher arquivo"}
        </span>
        <input
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files[0] || null);
            setPreview(null);
            setResult(null);
            setError("");
          }}
        />
      </label>

      {file && !preview && (
        <button
          onClick={() => send(true)}
          disabled={loading}
          className="bg-[#00F5D4] text-[#0B132B] px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
        >
          {loading ? "Analisando..." : "Analisar arquivo"}
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Linhas lidas" value={preview.totalRows} />
            <Stat label="Serão importados" value={preview.toImport} tone="text-[#00F5D4]" />
            <Stat label="Já existem no banco" value={preview.alreadyInDb} />
            <Stat label="Repetidos no arquivo" value={preview.duplicatesInFile} />
            <Stat label="Inválidos" value={preview.invalid} tone="text-red-400" />
            <Stat label="Sem telefone válido" value={preview.withoutPhone} tone="text-amber-400" />
          </div>

          {preview.errors.length > 0 && (
            <div className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-4 text-xs text-gray-300 space-y-1 max-h-40 overflow-y-auto">
              {preview.errors.map((e, i) => (
                <p key={i} className="font-mono">
                  Linha {e.line}: {e.reason} {e.value ? `(${e.value})` : ""}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={() => send(false)}
            disabled={loading || preview.toImport === 0}
            className="bg-[#00F5D4] text-[#0B132B] px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
          >
            {loading ? "Importando..." : `Confirmar importação de ${preview.toImport} leads`}
          </button>
        </div>
      )}

      {result && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs">
          {result.inserted} leads entraram no pool (lote {result.batchId.slice(0, 8)}).
        </div>
      )}
    </div>
  );
};