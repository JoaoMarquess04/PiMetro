import Upload from "./upload.tsx";
import { useCallback, useState, useRef } from 'react'

type FormProps = {
    onDone?: () => void
}

function Form({ onDone }: FormProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const formRef = useRef<HTMLFormElement | null>(null)

    const doXhrUpload = useCallback((form: HTMLFormElement) => {
        try {
            const fd = new FormData(form)
            // keep existing debug logging of FormData (do not remove)
            for (const pair of Array.from(fd.entries())) {
                const [k, v] = pair as [string, any]
                if (v instanceof File) {
                    console.log(k, { type: 'file', name: v.name })
                } else {
                    console.log(k, { type: 'field', value: String(v) })
                }
            }

            setError(null)
            const xhr = new XMLHttpRequest()
            xhr.open('POST', form.action)

            xhr.onload = function () {
                setIsUploading(false)
                if (xhr.status >= 200 && xhr.status < 300) {
                    setTimeout(() => onDone?.(), 300)
                } else {
                    setError(`Upload failed: ${xhr.status} ${xhr.statusText}`)
                }
            }

            xhr.onerror = function () {
                setIsUploading(false)
                setError('Network error during upload')
            }

            setIsUploading(true)
            xhr.send(fd)
        } catch (err) {
            console.warn('could not read FormData', err)
        }
    }, [onDone])

    const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (e.currentTarget) doXhrUpload(e.currentTarget)
    }, [doXhrUpload])

    return (
        <div>
            <form ref={formRef} onSubmit={handleSubmit} action="http://localhost:8000/teste" method="POST" encType="multipart/form-data" className="flex flex-col w-full">
                <div className="flex space-x-3 space-y-10">
                    <Upload type="image" />
                    <Upload type="ifc" />
                </div>
                <h1>Caso</h1>
                <input type="text" name="caso" className="px-1 rounded-lg h-7 w-50 border-2 border-gray-200 focus:outline-none hover:bg-gray-50"
                    placeholder="Insira o nome" />
                <div className="py-1"></div>
                <h1>Descrição</h1>
                <textarea name="desc" className="px-1 min-h-20 rounded-lg border-2 border-gray-200 focus:outline-none hover:bg-gray-50" placeholder="Insira a descrição aqui..."></textarea>
                <div className="py-2">
                    {!isUploading ? (
                        <button type="button" onClick={() => formRef.current && doXhrUpload(formRef.current)} className="px-3 py-2 bg-blue-600 text-white rounded">Enviar</button>
                    ) : (
                        <div>
                            <div className="text-blue-600 text-center">
                                <i className="fa-solid fa-spinner animate-spin text-2xl"></i>
                                <div className="text-sm mt-2">Enviando...</div>
                            </div>
                        </div>
                    )}
                </div>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </form>

        </div>
    )
}

export default Form