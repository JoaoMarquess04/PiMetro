type BotaoProps = {
    texto: string
    icone?: string
    isActive?: boolean
}

function Botao({ texto, icone, isActive = false }: BotaoProps) {
    const baseClasses = 'rounded-sm p-1 my-0.5 w-[100%] text-start font-normal'
    const activeClass = isActive ? 'bg-gray-300' : 'hover:bg-gray-200'

    return (
        <button type="button" aria-pressed={isActive} className={`${activeClass} ${baseClasses} hover:cursor-pointer`}>
            {icone && <i className={`fa-solid fa-${icone}`}></i>}
            <span className="px-2">{texto}</span>
        </button>
    )
}

export default Botao