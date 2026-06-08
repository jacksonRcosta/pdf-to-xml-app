import type { DadosExtraidos } from '../types'

interface Props {
  dados: DadosExtraidos
  nomeArquivo: string
  onChange: (dados: DadosExtraidos) => void
}

export function ExtractionSummary({ dados, nomeArquivo, onChange }: Props) {
  const setCampo = (key: string, value: string) => {
    onChange({ ...dados, campos_extras: { ...dados.campos_extras, [key]: value } })
  }

  const CAMPOS_EDITAVEIS = [
    { key: 'razao_social', label: 'Razão Social' },
    { key: 'nome_fantasia', label: 'Nome Fantasia' },
    { key: 'data_emissao', label: 'Data Emissão' },
    { key: 'valor_total', label: 'Valor Total' },
    { key: 'natureza_operacao', label: 'Natureza da Operação' },
    { key: 'chave_nfe', label: 'Chave NF-e (44 dígitos)' },
    { key: 'inscricao_est', label: 'Inscrição Estadual' },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'cep', label: 'CEP' },
    { key: 'endereco', label: 'Endereço' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'uf', label: 'UF' },
    { key: 'cod_fornecedor', label: 'Cód. Fornecedor' },
    { key: 'condicao_pagamento', label: 'Condição Pagamento' },
    { key: 'prazo', label: 'Prazo' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-brand-50 border-b border-brand-100 px-5 py-3">
        <h3 className="font-semibold text-brand-800 text-sm">Dados extraídos de: {nomeArquivo}</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* CNPJs */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            CNPJs encontrados ({dados.cnpjs.length})
          </p>
          {dados.cnpjs.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Nenhum CNPJ detectado automaticamente</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dados.cnpjs.map((c) => (
                <span key={c.numerico} className="text-xs bg-green-100 text-green-800 font-mono px-2 py-1 rounded">
                  {c.formatado}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CPFs */}
        {dados.cpfs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              CPFs encontrados ({dados.cpfs.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {dados.cpfs.map((c) => (
                <span key={c.numerico} className="text-xs bg-blue-100 text-blue-800 font-mono px-2 py-1 rounded">
                  {c.formatado}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Campos editáveis */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Campos do documento (editáveis)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAMPOS_EDITAVEIS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={dados.campos_extras[key] ?? ''}
                  onChange={(e) => setCampo(key, e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder={`${label}...`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
