import { useState, useRef, useEffect } from 'react'
import Progress from './progress'

type UploadProps = {
    onFileSelect?: (file: File) => void
    type: 'image' | 'ifc'
}

function Upload({ onFileSelect, type }: UploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const dropZoneRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const dropZone = dropZoneRef.current
        if (!dropZone) return

        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.target === dropZone) {
                setIsDragging(true)
            }
        }

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(true)
        }

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.target === dropZone) {
                setIsDragging(false)
            }
        }

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            const files = Array.from(e.dataTransfer?.files || [])
            if (files.length > 0) {
                await handleFile(files[0])
            }
        }

        dropZone.addEventListener('dragenter', handleDragEnter)
        dropZone.addEventListener('dragover', handleDragOver)
        dropZone.addEventListener('dragleave', handleDragLeave)
        dropZone.addEventListener('drop', handleDrop)

        return () => {
            dropZone.removeEventListener('dragenter', handleDragEnter)
            dropZone.removeEventListener('dragover', handleDragOver)
            dropZone.removeEventListener('dragleave', handleDragLeave)
            dropZone.removeEventListener('drop', handleDrop)
        }
    }, [])

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            await handleFile(files[0])
        }
    }

    const handleFile = async (file: File) => {
        // Validar tipo de arquivo
        if (type === 'image' && !file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem.')
            return
        }
        if (type === 'ifc' && !file.name.toLowerCase().endsWith('.ifc')) {
            alert('Por favor, selecione apenas arquivos IFC.')
            return
        }

        setIsLoading(true)
        setProgress(0)
        setFileName(file.name)

        // Criar preview apenas para imagens
        if (type === 'image') {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }

        // Simular progresso de upload
        const totalTime = 2000 // 2 segundos
        const interval = 100 // atualizar a cada 100ms
        const steps = totalTime / interval
        let currentProgress = 0

        const progressInterval = setInterval(() => {
            currentProgress += 100 / steps
            setProgress(Math.min(Math.round(currentProgress), 100))

            if (currentProgress >= 100) {
                clearInterval(progressInterval)
                setTimeout(() => {
                    setIsLoading(false)
                    onFileSelect?.(file)
                }, 200)
            }
        }, interval)
    }

    return (
        <div
            ref={dropZoneRef}
            onClick={() => !preview && inputRef.current?.click()}
            className={`relative p-4 border-2 border-dashed ${
                isDragging ? 'border-blue-500 bg-blue-50 z-50' : 'border-gray-300 z-50'
            } rounded-lg h-64 w-full flex flex-col items-center justify-center transition-colors ${!preview && 'cursor-pointer'} overflow-hidden`}
        >
            {fileName ? (
                <>
                    {type === 'image' && preview ? (
                        <div className="absolute inset-0">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <i className="fa-solid fa-file-lines fa-3x text-blue-500 mb-4"></i>
                            <p className="text-blue-500 font-medium text-center">
                                {fileName}
                            </p>
                        </div>
                    )}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            setPreview(null)
                            setFileName(null)
                            if (inputRef.current) {
                                inputRef.current.value = ''
                            }
                        }} 
                        className="absolute top-3 right-3 bg-red-500 w-8 h-8 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-51"
                    >
                        <i className="fa-solid fa-x text-white" />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center">
                    <i className={`fa-solid ${type === 'image' ? 'fa-image' : 'fa-cube'} fa-3x ${
                        isDragging ? 'text-blue-500' : 'text-gray-400'
                    } mb-4 transition-colors`}></i>
                    <p className={`${isDragging ? 'text-blue-500' : 'text-gray-600'} transition-colors text-center`}>
                        {isDragging 
                            ? 'Solte o arquivo aqui' 
                            : `Arraste e solte ${type === 'image' ? 'a imagem' : 'o arquivo IFC'} aqui, ou clique para selecionar`}
                    </p>
                </div>
            )}

            {isLoading && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white bg-opacity-90">
                    <Progress progress={progress} />
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                name={type === 'image' ? 'img' : 'ifc'}
                onChange={handleFileInput}
                className="hidden"
                accept={type === 'image' ? 'image/*' : '.ifc'}
            />
        </div>
    )
}

export default Upload;