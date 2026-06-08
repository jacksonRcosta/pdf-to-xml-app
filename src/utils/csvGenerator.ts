import type { DadosExtraidos, LayoutId } from '../types'
import * as XLSX from 'xlsx'

function linhasCsv(linhas: string[][]): string {
  return linhas
    .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(';'))
    .join('\n')
}

export function gerarCsv(layoutId: LayoutId, dados: DadosExtraidos): string {
  const c = dados.campos_extras
  const cnpj = dados.cnpjs[0]?.formatado ?? ''
  const tabela = dados.tabelas[0]

  if (layoutId === 'importacao') {
    const cabecalho = [
      'codproduto', 'codembalagem', 'quantidade', 'descricao',
      'emba', 'qtUnit', 'precoVenda', 'preço emba', 'preço emba st',
      'preço unit', 'preço tot', 'preco tot ion', 'preco tot ion st',
    ]
    const linhas: string[][] = [
      ['cnpj', dados.cnpjs[0]?.numerico ?? ''],
      cabecalho,
      ...(tabela?.dados.slice(1) ?? []),
    ]
    return linhasCsv(linhas)
  }

  // Campos genéricos para demais layouts
  const linhas: string[][] = [
    ['Campo', 'Valor'],
    ['CNPJ', cnpj],
    ...dados.cpfs.map((cpf) => ['CPF', cpf.formatado]),
    ...Object.entries(c).map(([k, v]) => [k, v]),
  ]

  if (tabela) {
    linhas.push([''])
    linhas.push(['=== Itens ==='])
    linhas.push(...tabela.dados)
  }

  return linhasCsv(linhas)
}

export function gerarXlsImportacao(dados: DadosExtraidos): Blob {
  const cnpjNum = dados.cnpjs[0]?.numerico ?? ''
  const tabela = dados.tabelas[0]

  const CABECALHOS = [
    'codproduto', 'codembalagem', 'quantidade', 'descricao',
    'emba', 'qtUnit', 'precoVenda', 'preço emba', 'preço emba st',
    'preço unit', 'preço tot', 'preco tot ion', 'preco tot ion st',
  ]

  const aoa: unknown[][] = [
    ['cnpj', cnpjNum],
    CABECALHOS,
    ...(tabela?.dados.slice(1) ?? []),
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Planilha1')

  const buffer = XLSX.write(wb, { bookType: 'xls', type: 'array' }) as ArrayBuffer
  return new Blob([buffer], { type: 'application/vnd.ms-excel' })
}
