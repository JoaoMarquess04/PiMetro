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
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    if (!caseData) return;
    if (!confirm(`Excluir o caso "${caseData.caso}"?`)) return;
    try {
      const res = await fetch(`${API}/casos/${caseData.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      onChanged?.();
    } catch (e) {
      alert('Erro ao excluir o caso.');
    }
  };

  if (add) {
    return (
      <div>
        <article onClick={() => setShowModal(true)} className='border-2 flex flex-col border-dashed border-gray-200 w-65 overflow-hidden rounded-xl h-80 justify-center items-center cursor-pointer bg-gray-50'>
          <h1 className='text-6xl text-gray-400'>+</h1>
        </article>
        {showModal && <PopUp onClose={() => setShowModal(false)} onChanged={onChanged} />}
      </div>
    )
  }

  return (
    <article className='border-2 flex flex-col border-gray-200 w-65 overflow-hidden rounded-xl h-80'>
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
        <div>
          <div className='flex items-center justify-between'>
            <h1 className='font-semibold text-lg'>{caseData?.caso || "Sem nome"}</h1>
            <div className='flex gap-2'>
              <button onClick={() => setShowModal(true)} className='px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600'>
                <i className='fa-solid fa-pen mr-1'/> Editar
              </button>
              <button onClick={handleDelete} className='px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700'>
                <i className='fa-solid fa-trash mr-1'/> Excluir
              </button>
            </div>
          </div>
          <Progress progress={caseData?.progress_pct || 0} />
        </div>
        <div>
          <h2 className='text-gray-600 font-semibold line-clamp-2'>{caseData?.descricao || "Sem descrição"}</h2>
          <Data cor="#717182" data={caseData?.data} />
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
  )
}

export default CardCasos;
