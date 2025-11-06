import img from '../assets/placeholder.png'
import Progress from './ui/progress'

type CasoProps = {
    titulo: string,
    descricao?: string,
    progress?: number
}

function Caso({ titulo, descricao, progress = 75 }: CasoProps) {
    const normalizedProgress = Math.min(100, Math.max(0, progress))
    const hoje = new Date();
    const data = hoje.toLocaleDateString('en-GB');

    return (
        <div className="flex p-4 border-2 border-gray-200 rounded-xl w-full h-full justify-between items-center">
            <div className='flex items-center'>
                <div className='h-20 w-20'>
                    <img src={img} alt="placeholder" className="h-full w-full object-cover rounded-md" />
                </div>
                <div className='px-4'>
                    <h1>{titulo}</h1>
                    <h2 className='text-[#717182]'>{descricao}</h2>
                </div>
            </div>
            <div className='text-right'>
                <p>{data}</p>
                <div className='w-30 h-full'>
                    <Progress progress={normalizedProgress}></Progress>
                </div>
            </div>
        </div>
    )
}

export default Caso