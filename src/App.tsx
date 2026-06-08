import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import type { DadosExtraidos, LayoutId } from './types'
import { extrairTextoPdf } from './utils/pdfExtractor'
import { montarDadosExtraidos } from './utils/documentExtractor'
import { gerarCsv, gerarXlsImportacao } from './utils/csvGenerator'

function downloadBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

function downloadText(conteudo: string, nome: string, tipo: string) {
  downloadBlob(new Blob([conteudo], { type: tipo }), nome)
}

function parseItemRow(row: string[]): [string, number] {
  if (row.length === 0) return ['', 0]
  let codemb = ''
  let qtd = 0
  for (const cell of row) {
    const t = cell.trim()
    if (!codemb && /^\d{8,13}$/.test(t)) codemb = t
    else if (qtd === 0) {
      const n = parseFloat(t.replace(/\./g, '').replace(',', '.'))
      if (!isNaN(n) && n > 0 && n < 1_000_000) qtd = n
    }
  }
  return [codemb, qtd]
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [dados, setDados] = useState<DadosExtraidos | null>(null)
  const [layoutId, setLayoutId] = useState<LayoutId>('importacao')
  const [tabelaIdx, setTabelaIdx] = useState(0)

  const processarArquivo = useCallback(async (file: File) => {
    setErro(null)
    setLoading(true)
    setDados(null)
    setTabelaIdx(0)
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

  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted[0]) processarArquivo(accepted[0]) },
    [processarArquivo],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: loading,
    noClick: true,
    noKeyboard: true,
  })

  const tabela = dados?.tabelas[tabelaIdx]
  const itensDados = tabela?.itens ?? []
  const parsedRows = itensDados.map(parseItemRow)
  const totalSkus = parsedRows.filter(([cod]) => cod.length > 0).length
  const totalUnidades = parsedRows.reduce((acc, [, qtd]) => acc + qtd, 0)
  const cnpjPrincipal = tabela?.cnpj ?? dados?.cnpjs[0]
  const dataEmissao = dados?.campos_extras?.data_emissao ?? ''
  const razaoSocial = dados?.campos_extras?.razao_social ?? ''
  const nomeBase = `resultado_${layoutId}`

  const handleExportCsv = () => {
    if (!dados) return
    downloadText(`﻿${gerarCsv(layoutId, dados)}`, `${nomeBase}.csv`, 'text/csv;charset=utf-8')
  }
  const handleExportXls = () => {
    if (!dados) return
    downloadBlob(gerarXlsImportacao(dados), `${nomeBase}.xls`)
  }

  return (
    <div {...getRootProps()} className="min-h-screen bg-gray-100">
      <input {...getInputProps()} />

      {/* Header */}
      <header className="bg-brand-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 rounded-lg p-2 flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">Leitor de Pedidos</h1>
              <p className="text-brand-200 text-xs mt-0.5">ASA BRANCA INDUSTRIAL</p>
            </div>
          </div>
          <button
            onClick={open}
            disabled={loading}
            className="flex items-center gap-2 border border-white/30 hover:border-white/70 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V8.625M13.5 3L19 8.625M13.5 3V8.625H19" />
            </svg>
            Novo arquivo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-40">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Extraindo texto do PDF...</p>
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && !loading && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {erro}
          </div>
        )}

        {/* Drop zone inicial */}
        {!dados && !loading && (
          <div
            onClick={open}
            className={`border-2 border-dashed rounded-xl p-24 text-center mt-4 cursor-pointer transition-colors
              ${isDragActive
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-300 hover:border-brand-400 bg-white'}`}
          >
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-500 font-medium text-lg">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique em "Novo arquivo"'}
            </p>
            <p className="text-gray-400 text-sm mt-2">Apenas arquivos .pdf</p>
          </div>
        )}

        {/* Dashboard */}
        {dados && !loading && (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow">
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-2">SKUs</p>
                <p className="text-5xl font-bold">{totalSkus}</p>
                {tabela && (
                  <p className="text-blue-100 text-xs mt-3">
                    {tabela.numeroPedido ? `Pedido #${tabela.numeroPedido}` : `Página ${tabela.pagina}`}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-5 text-white shadow">
                <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider mb-2">Total Unidades</p>
                <p className="text-5xl font-bold">{totalUnidades.toLocaleString('pt-BR')}</p>
                {dataEmissao && (
                  <p className="text-teal-100 text-xs mt-3">Data: {dataEmissao}</p>
                )}
              </div>

              <div className="bg-brand-900 rounded-xl p-5 text-white shadow border border-white/10">
                <p className="text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">CNPJ</p>
                <p className="text-xl font-bold leading-tight">{cnpjPrincipal?.numerico ?? '—'}</p>
                <p className="text-brand-200 text-xs mt-2 truncate">
                  {razaoSocial || cnpjPrincipal?.formatado || ''}
                </p>
              </div>
            </div>

            {/* Painel principal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Título + tabs de páginas */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-200 flex-wrap">
                <h2 className="font-semibold text-gray-800 mr-2">Itens do Pedido</h2>
                {dados.tabelas.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTabelaIdx(idx)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors
                      ${tabelaIdx === idx
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {t.numeroPedido ? `#${t.numeroPedido}` : `Pág. ${t.pagina}`}
                  </button>
                ))}
              </div>

              {/* Barra de ações */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 bg-gray-50 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Exportar:</span>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <DownloadIcon />
                    CSV
                  </button>
                  <button
                    onClick={handleExportXls}
                    className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <DownloadIcon />
                    XLS
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {totalSkus} itens · {totalUnidades.toLocaleString('pt-BR')} unidades
                  </span>
                  <div className="flex gap-1">
                    {(['importacao', 'personalizado'] as LayoutId[]).map((id) => (
                      <button
                        key={id}
                        onClick={() => setLayoutId(id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all
                          ${layoutId === id
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600'}`}
                      >
                        {id === 'importacao' ? 'Importação ION' : 'Personalizado'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 450px)', minHeight: '200px' }}>
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                        CodEmbalagem
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">
                        Quantidade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-5 py-8 text-center text-sm text-gray-400">
                          Nenhum item encontrado nesta página
                        </td>
                      </tr>
                    ) : (
                      parsedRows.map(([codemb, qtd], i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-5 py-2.5 text-sm text-blue-600 font-mono">{codemb}</td>
                          <td className="px-5 py-2.5 text-sm text-gray-800 text-right font-medium">
                            {qtd > 0 ? qtd.toLocaleString('pt-BR') : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rodapé total */}
              <div className="flex items-center justify-between px-5 py-3 bg-brand-900 text-white">
                <span className="text-sm font-semibold">Total Geral</span>
                <span className="text-sm font-bold">{totalUnidades.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
