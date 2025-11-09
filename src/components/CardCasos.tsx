import Data from './ui/data.tsx'
import Progress from './ui/progress.tsx';
import PopUp from './PopUp.tsx';
import { useState } from 'react';

type Case = {
    id: number;
    caso: string;
    descricao: string;
    progress_pct: number;
    img_path: string;
    ifc_path: string;
    data: string;
}

type CardCasosProps = {
    add?: boolean;
    case?: Case;
}

function CardCasos({ add = false, case: caseData }: CardCasosProps) {
    const [showModal, setShowModal] = useState(false);

    if (add) {
        return (
            <div>
                <article onClick={() => setShowModal(true)} className='border-2 flex flex-col border-dashed border-gray-200 w-65 overflow-hidden rounded-xl h-80 justify-center items-center cursor-pointer bg-gray-50'>
                    <h1 className='text-6xl text-gray-400'>+</h1>
                </article>
                {showModal && <PopUp onClose={() => setShowModal(false)}/>}
            </div>
        )
    }

    return (
        <article className='border-2 flex flex-col border-gray-200 w-65 overflow-hidden rounded-xl h-80'>
            <div className='bg-black h-40 w-full'>
                <img 
                    src={caseData?.img_path} 
                    alt={caseData?.caso || "Imagem do caso"} 
                    className='h-full w-full object-cover' 
                />
            </div>
            <div className='p-4 flex flex-col justify-between h-full'>
                <div>
                    <h1 className='font-semibold text-lg'>{caseData?.caso || "Sem nome"}</h1>
                    <Progress progress={caseData?.progress_pct || 0} />
                </div>
                <div>
                    <h2 className='text-gray-600 font-semibold'>{caseData?.descricao || "Sem descrição"}</h2>
                    <Data cor="#717182" data={caseData?.data} />
                </div>
            </div>
        </article>
    )
}

export default CardCasos;