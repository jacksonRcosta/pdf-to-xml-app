import type { CnpjInfo, CpfInfo, DadosExtraidos, TabelaExtraida } from '../types'

export function extrairCnpj(texto: string): CnpjInfo[] {
  const padrao = /\b(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[/\s]?\d{4}[-\s]?\d{2})\b/g
  const encontrados = [...texto.matchAll(padrao)]
  const vistos = new Set<string>()
  const resultado: CnpjInfo[] = []

  for (const match of encontrados) {
    const n = match[1].replace(/\D/g, '')
    if (n.length === 14 && !vistos.has(n)) {
      vistos.add(n)
      const formatado = `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12, 14)}`
      resultado.push({ formatado, numerico: n })
    }
  }

  return resultado
}

export function extrairCpf(texto: string): CpfInfo[] {
  const padrao = /\b(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2})\b/g
  const encontrados = [...texto.matchAll(padrao)]
  const vistos = new Set<string>()
  const resultado: CpfInfo[] = []

  for (const match of encontrados) {
    const n = match[1].replace(/\D/g, '')
    if (n.length === 11 && !vistos.has(n)) {
      vistos.add(n)
      const formatado = `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`
      resultado.push({ formatado, numerico: n })
    }
  }

  return resultado
}

const PADROES_CAMPOS: Record<string, RegExp> = {
  chave_nfe: /\b(\d{44})\b/,
  inscricao_est: /(?:insc(?:ri[çc][aã]o)?\s*est(?:adual)?\s*[:\-]?\s*)([\w\d.\-/]+)/i,
  data_emissao: /(?:data\s*emiss[aã]o|emitido\s*em)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i,
  valor_total: /valor\s*total\s*[:\-R$]*\s*([\d.]+,\d{2})/i,
  razao_social: /raz[aã]o\s*social\s*[:\-]?\s*(.+?)(?:\n|CNPJ|CPF|$)/i,
  nome_fantasia: /nome\s*(?:fantasia)?\s*[:\-]?\s*(.+?)(?:\n|CNPJ|$)/i,
  natureza_operacao: /natureza\s*(?:da\s*)?opera[çc][aã]o\s*[:\-]?\s*(.+?)(?:\n|$)/i,
  email: /[\w.\-+]+@[\w\-]+\.[a-z]{2,}(?:\.[a-z]{2})?/i,
  telefone: /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[\s\-]?\d{4}/,
  cep: /\b\d{5}[\-\s]?\d{3}\b/,
}

export function extrairCamposRegex(texto: string): Record<string, string> {
  const campos: Record<string, string> = {}

  for (const [nome, padrao] of Object.entries(PADROES_CAMPOS)) {
    const match = padrao.exec(texto)
    if (match) {
      campos[nome] = (match[1] ?? match[0]).trim().slice(0, 200)
    }
  }

  return campos
}

export function montarDadosExtraidos(
  texto_completo: string,
  paginas: Array<{ pagina: number; texto: string }>,
): DadosExtraidos {
  const cnpjs = extrairCnpj(texto_completo)
  const cpfs = extrairCpf(texto_completo)
  const campos_extras = extrairCamposRegex(texto_completo)

  // Tenta detectar linhas tabulares simples (linhas com múltiplos campos separados por espaços)
  const tabelas: TabelaExtraida[] = paginas
    .map(({ pagina, texto }) => {
      const linhas = texto.split(/\s{3,}|\t/).filter((l) => l.trim().length > 2)
      if (linhas.length >= 3) {
        return { pagina, dados: linhas.map((l) => [l.trim()]) }
      }
      return null
    })
    .filter((t): t is TabelaExtraida => t !== null)

  return { cnpjs, cpfs, campos_extras, tabelas, texto_completo }
}
