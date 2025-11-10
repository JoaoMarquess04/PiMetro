import Container from "./ui/container.tsx";
import Form from "./ui/form.tsx";

type Case = {
  id: number;
  caso: string;
  descricao: string;
  progress_pct: number;
  img_path: string | null;
  ifc_path: string | null;
  data: string;
}

function PopUp({ onClose, onChanged, caseData }: { onClose: () => void, onChanged?: () => void, caseData?: Case }) {
  const isEdit = Boolean(caseData);
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative w-250 items-center flex flex-col justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-full relative">
          <button onClick={onClose} className="absolute -top-3 -right-3 bg-red-500 w-8 h-8 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-[51]">
            <i className="fa-solid fa-x text-white" />
          </button>
          <Container titulo={isEdit ? "Editar caso" : "Upload"}>
            <div className="relative bg-white rounded-lg p-6 z-[51] overflow-y-auto max-h-[80vh] space-y-6">                      
              <Form 
                onDone={() => { onChanged?.(); onClose(); }}
                mode={isEdit ? 'edit' : 'create'}
                caseData={caseData}
              />
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}

export default PopUp;
