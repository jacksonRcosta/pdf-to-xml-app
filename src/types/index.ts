export interface CnpjInfo {
  formatado: string
  numerico: string
}

export interface CpfInfo {
  formatado: string
  numerico: string
}

export interface TabelaExtraida {
  pagina: number
  dados: string[][]       // todas as linhas brutas da página
  itens: string[][]       // somente linhas com código de barras (produto)
  numeroPedido?: string   // extraído do texto da página
  cnpj?: CnpjInfo         // CNPJ do cliente nesta página
}

export interface DadosExtraidos {
  cnpjs: CnpjInfo[]
  cpfs: CpfInfo[]
  campos_extras: Record<string, string>
  tabelas: TabelaExtraida[]
  texto_completo: string
}

export type LayoutId = 'nfe' | 'cadastro' | 'protheus' | 'importacao' | 'personalizado'

export interface LayoutInfo {
  id: LayoutId
  nome: string
  descricao: string
  icone: string
}

export interface GeracaoResultado {
  xml: string
  csv: string
  xls?: Blob
}
