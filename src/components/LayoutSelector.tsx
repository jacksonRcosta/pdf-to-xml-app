import type { LayoutId, LayoutInfo } from '../types'

const LAYOUTS: LayoutInfo[] = [
  { id: 'nfe',          nome: 'NF-e',            descricao: 'Nota Fiscal Eletrônica / DANFe', icone: '🧾' },
  { id: 'cadastro',     nome: 'Cadastro PJ',      descricao: 'Pessoa Jurídica — contratos e fichas', icone: '🏢' },
  { id: 'protheus',     nome: 'TOTVS Protheus',   descricao: 'Importação ERP Protheus / TOTVS', icone: '⚙️' },
  { id: 'importacao',   nome: 'Importação ION',   descricao: 'Layout ArquivoImportado (13 colunas)', icone: '📦' },
  { id: 'personalizado', nome: 'Personalizado',    descricao: 'Esqueleto genérico adaptável', icone: '🔧' },
]

interface Props {
  selected: LayoutId
  onChange: (id: LayoutId) => void
}

export function LayoutSelector({ selected, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
        <h3 className="font-semibold text-gray-700 text-sm">Selecione o layout de saída</h3>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all
              ${selected === l.id
                ? 'bg-brand-600 text-white border-brand-600 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600'}`}
          >
            <span>{l.icone}</span>
            <span>{l.nome}</span>
          </button>
        ))}
      </div>
      <div className="px-5 pb-4">
        <p className="text-sm text-gray-500">
          {LAYOUTS.find((l) => l.id === selected)?.descricao}
        </p>
      </div>
    </div>
  )
}
