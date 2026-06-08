import { useState, useCallback } from 'react'
import type { DadosExtraidos, LayoutId } from './types'
import { extrairTextoPdf } from './utils/pdfExtractor'
import { montarDadosExtraidos } from './utils/documentExtractor'
import { FileUploader } from './components/FileUploader'
import { ExtractionSummary } from './components/ExtractionSummary'
import { LayoutSelector } from './components/LayoutSelector'
import { ResultPanel } from './components/ResultPanel'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [dados, setDados] = useState<DadosExtraidos | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [layoutId, setLayoutId] = useState<LayoutId>('nfe')

  const handleFile = useCallback(async (file: File) => {
    setErro(null)
    setLoading(true)
    setDados(null)
    setNomeArquivo(file.name)

    try {
      const { texto_completo, paginas } = await extrairTextoPdf(file)
      const extraido = montarDadosExtraidos(texto_completo, paginas)
      setDados(extraido)
    } catch (e) {
      setErro(`Erro ao processar o PDF: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="bg-brand-600 rounded-lg p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Extrator PDF → XML / CSV</h1>
            <p className="text-brand-200 text-xs mt-0.5">Conversão estruturada com layouts corporativos</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Passo 1 — Upload */}
        <section>
          <StepLabel numero={1} titulo="Selecione o PDF" />
          <FileUploader onFile={handleFile} loading={loading} />
          {erro && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {erro}
            </div>
          )}
        </section>

        {dados && (
          <>
            {/* Passo 2 — Dados Extraídos */}
            <section>
              <StepLabel numero={2} titulo="Verifique os dados extraídos" />
              <ExtractionSummary
                dados={dados}
                nomeArquivo={nomeArquivo}
                onChange={setDados}
              />
            </section>

            {/* Passo 3 — Layout */}
            <section>
              <StepLabel numero={3} titulo="Escolha o layout de saída" />
              <LayoutSelector selected={layoutId} onChange={setLayoutId} />
            </section>

            {/* Passo 4 — Resultado */}
            <section>
              <StepLabel numero={4} titulo="Resultado — pré-visualização e download" />
              <ResultPanel dados={dados} layoutId={layoutId} />
            </section>
          </>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Extrator PDF → XML / CSV · Layouts: NF-e, Cadastro PJ, TOTVS Protheus, Importação ION, Personalizado
      </footer>
    </div>
  )
}

function StepLabel({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
        {numero}
      </span>
      <h2 className="font-semibold text-gray-700">{titulo}</h2>
    </div>
  )
}
