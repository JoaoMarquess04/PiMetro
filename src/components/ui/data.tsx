type DataProps = {
    cor?: string
}

function Data({ cor }: DataProps) {
    const hoje = new Date();
    const data = hoje.toLocaleDateString('en-GB');

    return <p className={`text-[${cor}]`}>{data}</p>
}

export default Data