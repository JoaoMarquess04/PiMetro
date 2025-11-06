import Data from './ui/data.tsx'
import img from '../assets/placeholder.png'
import Progress from './ui/progress.tsx';

function CardCasos() {
    return (
        <article className='border-2 flex flex-col border-gray-200 w-65 overflow-hidden rounded-xl h-80'>
            <div className='bg-black h-40 w-full'>
                <img src={img} alt="" className='h-full w-full object-cover' />
            </div>
            <div className='p-4 flex flex-col justify-between h-full'>
                <div>
                    <h1 className='font-semibold text-lg'>Caso</h1>
                    <Progress progress={45} />
                </div>
                <div>
                    <h2 className='text-gray-600 font-semibold'>Descricao</h2>
                    <Data cor="#717182" />
                </div>
            </div>
        </article>
    )
}

export default CardCasos;