type BotaoProps = {
    texto: string
    icone?: string
    isActive?: boolean
    onSelect?: () => void
}

function Botao({ texto, icone, isActive = false, onSelect }: BotaoProps) {
    const baseClasses = 'rounded-sm p-1 my-0.5 w-[100%] text-start font-normal'
    const activeClass = isActive ? 'bg-gray-300' : ''

    const handleClick = () => {
        onSelect?.()
    }

    return (
        <button
            type="button"
            aria-pressed={isActive}
            onClick={handleClick}
            className={`${activeClass} ${baseClasses}`}
        >
            {icone && <i className={`fa-solid fa-${icone}`}></i>}
            <span className="px-2">{texto}</span>
        </button>
    )
}

export default Botao