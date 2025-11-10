import Progress from './ui/progress';

type CasoProps = {
  titulo: string;
  descricao?: string;
  progress?: number;
  img?: string;
  dataLabel?: Date;
};

function Caso({ titulo, descricao, progress = 0, img, dataLabel }: CasoProps) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const dataText = dataLabel
    ? dataLabel.toLocaleDateString('pt-BR') + ' ' + dataLabel.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('pt-BR');

  return (
    <div className="flex p-4 border-2 border-gray-200 rounded-xl w-full h-full justify-between items-center">
      <div className='flex items-center'>
        <div className='h-20 w-20 bg-black/5 rounded-md overflow-hidden'>
          {img ? (
            <img src={img} alt={titulo} className="h-full w-full object-cover" />
          ) : (
            <div className='h-full w-full grid place-items-center text-xs text-gray-500'>sem imagem</div>
          )}
        </div>
        <div className='px-4'>
          <h1 className='font-semibold'>{titulo}</h1>
          <h2 className='text-[#717182]'>{descricao || 'Sem descrição'}</h2>
        </div>
      </div>
      <div className='text-right'>
        <p className='text-sm text-gray-600'>{dataText}</p>
        <div className='w-30'>
          <Progress progress={normalizedProgress} />
        </div>
      </div>
    </div>
  );
}

export default Caso;
