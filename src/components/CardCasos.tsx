import Data from './ui/data.tsx'
import Progress from './ui/progress.tsx';
import PopUp from './PopUp.tsx';
import { useState } from 'react';

type Case = {
  id: number;
  caso: string;
  descricao: string;
  progress_pct: number;
  img_path: string | null;
  ifc_path: string | null;
  data: string;
}

type CardCasosProps = {
  add?: boolean;
  case?: Case;
  onChanged?: () => void;
}

const API = 'http://localhost:8000';

function CardCasos({ add = false, case: caseData, onChanged }: CardCasosProps) {
  const [showModal, setShowModal] = useState(false);          // popup de criar/editar
  const [showDeleteModal, setShowDeleteModal] = useState(false); // popup de confirmar exclusão

  // função que realmente EXCLUI no backend
  const confirmDelete = async () => {
    if (!caseData) return;
    try {
      const res = await fetch(`${API}/casos/${caseData.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      onChanged?.();
      setShowDeleteModal(false); // fecha popup depois de excluir
    } catch (e) {
      alert('Erro ao excluir o caso.');
    }
  };

  if (add) {
    return (
      <div>
        <article
          onClick={() => setShowModal(true)}
          className='border-2 flex flex-col border-dashed border-gray-200 w-65 overflow-hidden rounded-xl min-h-80 h-full justify-center items-center cursor-pointer bg-gray-50'
        >
          <h1 className='text-6xl text-gray-400'>+</h1>
        </article>
        {showModal && <PopUp onClose={() => setShowModal(false)} onChanged={onChanged} />}
      </div>
    );
  }

  return (
    <>
      <article className='border-2 flex flex-col border-gray-200 w-65 overflow-hidden rounded-xl h-90'>
        <div className='bg-black h-40 w-full'>
          {caseData?.img_path ? (
            <img 
              src={caseData.img_path} 
              alt={caseData?.caso || "Imagem do caso"} 
              className='h-full w-full object-cover' 
            />
          ) : (
            <div className='h-full w-full grid place-items-center text-white/70 text-sm'>sem imagem</div>
          )}
        </div>
        <div className='p-4 flex flex-col justify-between h-full'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h1 className='font-semibold text-lg truncate'>
                {caseData?.caso || "Sem nome"}
              </h1>
            </div>
            <Progress progress={caseData?.progress_pct || 0} />
          </div>
          <div>
            <h2 className='text-gray-600 font-semibold line-clamp-2 truncate'>
              {caseData?.descricao || "Sem descrição"}
            </h2>
            <Data cor="#717182" data={caseData?.data} />
          </div>
          <div className='flex items-center justify-center gap-2'>
            <button
              onClick={() => setShowModal(true)}
              className='px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600'
            >
              <i className='fa-solid fa-pen mr-1'/> Editar
            </button>

            {/* agora só abre o popup de confirmação */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className='px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700'
            >
              <i className='fa-solid fa-trash mr-1'/> Excluir
            </button>
          </div>
        </div>

        {showModal && caseData && (
          <PopUp 
            onClose={() => setShowModal(false)} 
            onChanged={onChanged}
            caseData={caseData}
          />
        )}
      </article>

      {/* POPUP DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteModal && caseData && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full relative shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute -top-3 -right-3 bg-red-500 w-8 h-8 rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform"
            >
              <i className="fa-solid fa-x text-white" />
            </button>

            <h2 className="text-lg font-semibold mb-2">Excluir caso</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja excluir o caso{" "}
              <span className="font-semibold break-all">"{caseData.caso}"</span>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700"
              >
                <i className="fa-solid fa-trash mr-1" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CardCasos;
