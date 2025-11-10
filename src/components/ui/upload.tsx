import { useState, useRef, useEffect } from 'react'
import Progress from './progress'

type UploadProps = {
  onFileSelect?: (file: File) => void
  type: 'image' | 'ifc'
  /** URL da imagem atual (para modo edição) */
  initialPreview?: string | null
  /** Nome do arquivo atual (exibir quando for IFC ou quando quiser forçar o nome) */
  initialFileName?: string | null
}

function Upload({ onFileSelect, type, initialPreview = null, initialFileName = null }: UploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 👉 carrega preview/nome inicial (modo edição)
  useEffect(() => {
    setPreview(type === 'image' ? initialPreview : null)
    setFileName(initialFileName)
  }, [initialPreview, initialFileName, type])

  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === dropZone) setIsDragging(true) }
    const handleDragOver  = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
    const handleDragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === dropZone) setIsDragging(false) }
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false)
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) await handleFile(files[0])
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
    if (files && files.length > 0) await handleFile(files[0])
  }

  const handleFile = async (file: File) => {
    if (type === 'image' && !file.type.startsWith('image/')) { alert('Por favor, selecione apenas arquivos de imagem.'); return }
    if (type === 'ifc' && !file.name.toLowerCase().endsWith('.ifc')) { alert('Por favor, selecione apenas arquivos IFC.'); return }

    setIsLoading(true); setProgress(0); setFileName(file.name)

    if (type === 'image') {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    // simulação de barra de progresso local (UI)
    const totalTime = 2000, interval = 100, steps = totalTime / interval
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      currentProgress += 100 / steps
      setProgress(Math.min(Math.round(currentProgress), 100))
      if (currentProgress >= 100) {
        clearInterval(progressInterval)
        setTimeout(() => { setIsLoading(false); onFileSelect?.(file) }, 200)
      }
    }, interval)
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null); setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      ref={dropZoneRef}
      onClick={() => !preview && !fileName && inputRef.current?.click()}
      className={`relative p-4 border-2 border-dashed ${
        isDragging ? 'border-blue-500 bg-blue-50 z-50' : 'border-gray-300 z-50'
      } rounded-lg h-64 w-full flex flex-col items-center justify-center transition-colors ${
        !preview && !fileName ? 'cursor-pointer' : ''
      } overflow-hidden`}
    >
      {(fileName || preview) ? (
        <>
          {type === 'image' && (preview || initialPreview) ? (
            <div className="absolute inset-0">
              <img src={preview || initialPreview || ''} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <i className="fa-solid fa-file-lines fa-3x text-blue-500 mb-4"></i>
              <p className="text-blue-500 font-medium text-center">
                {fileName || initialFileName || 'arquivo selecionado'}
              </p>
            </div>
          )}
          <button onClick={clearSelection}
            className="absolute top-3 right-3 bg-red-500 w-8 h-8 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-51">
            <i className="fa-solid fa-x text-white" />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <i className={`fa-solid ${type === 'image' ? 'fa-image' : 'fa-cube'} fa-3x ${
            isDragging ? 'text-blue-500' : 'text-gray-400'
          } mb-4 transition-colors`}></i>
          <p className={`${isDragging ? 'text-blue-500' : 'text-gray-600'} transition-colors text-center`}>
            {isDragging ? 'Solte o arquivo aqui'
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

export default Upload
