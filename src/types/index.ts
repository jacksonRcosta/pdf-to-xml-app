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
  dados: string[][]
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
