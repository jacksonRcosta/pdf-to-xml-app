import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  onFile: (file: File) => void
  loading: boolean
}

export function FileUploader({ onFile, loading }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0])
    },
    [onFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: loading,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-brand-400 bg-white'}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {loading ? (
          <p className="text-brand-600 font-medium">Extraindo texto do PDF...</p>
        ) : isDragActive ? (
          <p className="text-brand-600 font-medium">Solte o arquivo aqui</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">Arraste o PDF aqui ou clique para selecionar</p>
            <p className="text-sm text-gray-400">Apenas arquivos .pdf</p>
          </>
        )}
      </div>
    </div>
  )
}
