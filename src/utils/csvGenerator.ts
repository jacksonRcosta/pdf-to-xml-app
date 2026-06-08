import type { DadosExtraidos, LayoutId } from '../types'
import * as XLSX from 'xlsx'

const CABECALHOS_ION = [
  'codproduto', 'codembalagem', 'quantidade', 'descricao',
  'emba', 'qtUnit', 'precoVenda', 'preço emba', 'preço emba st',
  'preço unit', 'preço tot', 'preco tot ion', 'preco tot ion st',
]

function linhasCsv(linhas: string[][]): string {
  return linhas
    .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(';'))
    .join('\n')
}

// Detecta codembalagem e quantidade de uma linha bruta do PDF
function detectarCodEQtd(row: string[]): [string, string] {
  let codemb = ''
  let qtd = ''
  for (const cell of row) {
    const t = cell.trim()
    if (!codemb && /^\d{8,13}$/.test(t)) codemb = t
    else if (!qtd) {
      const n = parseFloat(t.replace(/\./g, '').replace(',', '.'))
      if (!isNaN(n) && n > 0 && n < 1_000_000) qtd = String(n)
    }
  }
  return [codemb, qtd]
}

// Converte linha bruta para as 13 colunas do layout ION
function linhaIon(row: string[]): string[] {
  const [codemb, qtd] = detectarCodEQtd(row)
  return ['', codemb, qtd, '', '', '', '', '', '', '', '', '', '']
}

export function gerarCsv(layoutId: LayoutId, dados: DadosExtraidos): string {
  const c = dados.campos_extras
  const cnpj = dados.cnpjs[0]?.formatado ?? ''
  const tabela = dados.tabelas[0]

  if (layoutId === 'importacao') {
    const itens = tabela?.itens ?? []
    const linhas: string[][] = [
      ['cnpj', dados.cnpjs[0]?.numerico ?? ''],
      CABECALHOS_ION,
      ...itens.map(linhaIon),
    ]
    return linhasCsv(linhas)
  }

  // Layout personalizado — campos gerais + itens brutos
  const linhas: string[][] = [
    ['Campo', 'Valor'],
    ['CNPJ', cnpj],
    ...dados.cpfs.map((cpf) => ['CPF', cpf.formatado]),
    ...Object.entries(c).map(([k, v]) => [k, v]),
  ]

  if (tabela) {
    linhas.push([])
    linhas.push(['=== Itens ==='])
    linhas.push(...(tabela.itens.length > 0 ? tabela.itens : tabela.dados))
  }

  return linhasCsv(linhas)
}

export function gerarXlsImportacao(dados: DadosExtraidos): Blob {
  const cnpjNum = dados.cnpjs[0]?.numerico ?? ''
  const tabela = dados.tabelas[0]
  const itens = tabela?.itens ?? []

  const aoa: unknown[][] = [
    ['cnpj', cnpjNum],
    CABECALHOS_ION,
    ...itens.map(linhaIon),
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Planilha1')

  const buffer = XLSX.write(wb, { bookType: 'xls', type: 'array' }) as ArrayBuffer
  return new Blob([buffer], { type: 'application/vnd.ms-excel' })
}
