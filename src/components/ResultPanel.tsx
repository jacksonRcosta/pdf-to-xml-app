import { useState } from 'react'
import type { LayoutId, DadosExtraidos } from '../types'
import { gerarXml } from '../utils/xmlGenerator'
import { gerarCsv, gerarXlsImportacao } from '../utils/csvGenerator'

interface Props {
  dados: DadosExtraidos
  layoutId: LayoutId
}

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

export function ResultPanel({ dados, layoutId }: Props) {
  const [aba, setAba] = useState<'xml' | 'csv'>('xml')

  const xml = gerarXml(layoutId, dados)
  const csv = gerarCsv(layoutId, dados)

  const nomeBase = `resultado_${layoutId}`

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Abas + Botões de download */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4">
        <div className="flex">
          {(['xml', 'csv'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAba(tab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${aba === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-2 py-2">
          <button
            onClick={() => downloadText(xml, `${nomeBase}.xml`, 'application/xml')}
            className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            ⬇ XML
          </button>
          <button
            onClick={() => downloadText(`﻿${csv}`, `${nomeBase}.csv`, 'text/csv;charset=utf-8')}
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            ⬇ CSV
          </button>
          {layoutId === 'importacao' && (
            <button
              onClick={() => downloadBlob(gerarXlsImportacao(dados), `${nomeBase}.xls`)}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              ⬇ XLS (ION)
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="overflow-auto max-h-[500px]">
        <pre className="text-xs font-mono p-5 text-gray-800 leading-relaxed whitespace-pre-wrap">
          {aba === 'xml' ? xml : csv}
        </pre>
      </div>
    </div>
  )
}
