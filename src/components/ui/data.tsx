type DataProps = {
    cor?: string;
    data?: string;
}

function Data({ cor, data }: DataProps) {
    const displayDate = data || new Date().toLocaleDateString('en-GB');
    return <p style={{ color: cor }}>{displayDate}</p>
}

export default Data