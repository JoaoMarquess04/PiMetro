type SeparadorProps = {
    linha?: boolean,
    titulo?: string,
    subtitulo?: string
}

function Separador({ linha = true, titulo, subtitulo }: SeparadorProps) {
    return (
        <div className="w-full my-7">
            {titulo && <h1 className="text-xl font-medium">{titulo}</h1>}
            {subtitulo && <h2 className="text-md text-[#717182]">{subtitulo}</h2>}
            {linha && <div className="mt-5 h-0.5 bg-gray-200"></div>}
        </div>
    )
}

export default Separador