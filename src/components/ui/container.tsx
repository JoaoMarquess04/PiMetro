type ContainerProps = {
    children: React.ReactNode,
    titulo?: string,
    subtitulo?: string
}

function Container({ children, titulo, subtitulo }: ContainerProps) {
    return (
        <div className="p-4 border-2 border-gray-200 rounded-xl h-full w-full space-y-4 bg-white">
            <div>
                {titulo && <h1 className="text-xl font-medium">{titulo}</h1>}
                {subtitulo && <h2 className="text-md text-[#717182]">{subtitulo}</h2>}
            </div>
            {children}
        </div>
    )
}

export default Container