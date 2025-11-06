type CardProps = {
    texto: string,
    icone?: string,
    footer?: string
    contador?: React.ReactNode
}

function Card({ texto, icone, footer, contador = 0 }: CardProps) {

    return (
        <div className=" h-40 max-h-40 w-full">
            <div className="border-2 border-gray-200 rounded-xl h-full w-full">
                <div className="p-4 flex flex-col justify-between h-full">
                    <article className="flex justify-between">
                        <h4>{texto}</h4>
                        <span style={{ color: 'gray' }}>
                            {icone && <i className={`fa-solid fa-${icone} content-center`}></i>}
                        </span>
                    </article>
                    <article>
                        <p className="text-2xl">
                            {contador}
                        </p>
                        <p className="text-xs text-[#717182]">
                            {footer}
                        </p>
                    </article>
                </div>
            </div>
        </div>
    )
}

export default Card