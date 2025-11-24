import Upload from "./upload.tsx";
import { useCallback, useRef, useState } from "react";

type Case = {
  id: number;
  caso: string;
  descricao: string;
  progress_pct: number;
  img_path: string | null;
  ifc_path: string | null;
  data: string;
};

type FormProps = {
  onDone?: () => void;
  mode?: "create" | "edit";
  caseData?: Case;
};

const API = "http://localhost:8000";

const basename = (url?: string | null) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.pathname.split("/").filter(Boolean).pop() || null;
  } catch {
    return url.split("/").filter(Boolean).pop() || null;
  }
};

function Form({ onDone, mode = "create", caseData }: FormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const defaultCaso = caseData?.caso ?? "";
  const defaultDesc = caseData?.descricao ?? "";

  const isEdit = mode === "edit";
  const editId = isEdit ? caseData?.id : undefined;
  const safeAction = isEdit ? (editId ? `${API}/casos/${editId}` : "") : `${API}/teste`;
  const httpMethod = isEdit ? "PUT" : "POST";

  const doXhrUpload = useCallback(
    (form: HTMLFormElement) => {
      try {
        if (isEdit && !editId) {
          setError("Sem ID do caso para editar (caseData.id ausente).");
          return;
        }
        const fd = new FormData(form);
        setError(null);

        // 👀 loga a URL e método no console para depuração
        
        console.log("[Form submit]", httpMethod, safeAction);

        const xhr = new XMLHttpRequest();
        xhr.open(httpMethod, safeAction);

        xhr.onload = function () {
          setIsUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            setTimeout(() => onDone?.(), 200);
          } else {
            let extra = "";
            try { extra = xhr.responseText ? ` — ${xhr.responseText}` : ""; } catch { }
            setError(`Upload failed: ${xhr.status} ${xhr.statusText}${extra}`);
          }
        };

        xhr.onerror = function () {
          setIsUploading(false);
          setError("Network error during upload");
        };

        setIsUploading(true);
        xhr.send(fd);
      } catch (err) {
        console.warn("could not send FormData", err);
      }
    },
    [onDone, httpMethod, safeAction, isEdit, editId]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (e.currentTarget) doXhrUpload(e.currentTarget);
    },
    [doXhrUpload]
  );

  return (
    <div>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        action={safeAction}
        method={httpMethod}
        encType="multipart/form-data"
        className="flex flex-col w-full space-y-4"
      >
        {/* Upload de IMAGEM */}
        <div className="flex space-x-2">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Imagem</label>
            {isEdit && caseData?.img_path && (
              <p className="text-xs text-gray-500 truncate max-w-xs">
                Atual: {caseData.img_path}
              </p>
            )}
            <Upload
              type="image"
              initialPreview={caseData?.img_path || null}
              initialFileName={basename(caseData?.img_path)}
            />
          </div>

          {/* Upload de IFC */}
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">IFC</label>
            {isEdit && caseData?.ifc_path && (
              <p className="text-xs text-gray-500 truncate max-w-xs">
                Atual: {caseData.ifc_path}
              </p>
            )}
            <Upload
              type="ifc"
              initialPreview={null}
              initialFileName={basename(caseData?.ifc_path)}
            />
          </div>
        </div>


        {/* Campos de texto */}
        <div className="pt-2">
          <h1 className="text-sm font-medium">Caso</h1>
          <input
            type="text"
            name="caso"
            defaultValue={defaultCaso}
            className="px-2 rounded-lg h-9 w-64 border-2 border-gray-200 focus:outline-none hover:bg-gray-50"
            placeholder="Insira o nome"
          />
        </div>

        <div>
          <h1 className="text-sm font-medium">Descrição</h1>
          <textarea
            name="desc"
            defaultValue={defaultDesc}
            className="px-2 py-2 min-h-24 rounded-lg border-2 border-gray-200 focus:outline-none hover:bg-gray-50 w-full"
            placeholder="Insira a descrição aqui..."
          />
        </div>

        <div className="py-2">
          {!isUploading ? (
            <button
              type="submit"
              className="px-3 py-2 bg-[#001489] text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isEdit && !editId}
              title={isEdit && !editId ? "Sem ID do caso para editar" : ""}
            >
              {isEdit ? "Salvar alterações" : "Enviar"}
            </button>
          ) : (
            <div className="text-blue-600 text-center">
              <i className="fa-solid fa-spinner animate-spin text-2xl"></i>
              <div className="text-sm mt-2">Enviando...</div>
            </div>
          )}
        </div>
        {error && <div className="text-red-600 text-sm mt-2 whitespace-pre-wrap">{error}</div>}
      </form>
    </div>
  );
}

export default Form;
