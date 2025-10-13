function Envio() {
    return (
        <>
            <form action="http://localhost:8000/analyze" method="POST" encType="multipart/form-data">
                <input type="file" accept='.png, .jpg, .jpeg' name="file" />
                <input type="submit" value="Submit"></input>
            </form>
        </>
    )
}

export default Envio
