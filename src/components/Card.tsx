type CardProps = {
    texto: string,
    icone?: string,
    footer?: string
}

function Card({ texto, icone, footer }: CardProps) {

    let contador = 0;

    return (
        <div className="px-2">

            <div className="border-2 border-gray-200 rounded-xl max-h-40 w-75 max-w-75">
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