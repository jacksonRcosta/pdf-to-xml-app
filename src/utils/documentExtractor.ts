import type { CnpjInfo, CpfInfo, DadosExtraidos, TabelaExtraida } from '../types'

export function extrairCnpj(texto: string): CnpjInfo[] {
  const padrao = /(\d{2})\s*\.?\s*(\d{3})\s*\.?\s*(\d{3})\s*\/?\s*(\d{4})\s*-?\s*(\d{2})/g
  const encontrados = [...texto.matchAll(padrao)]
  const vistos = new Set<string>()
  const resultado: CnpjInfo[] = []

  for (const match of encontrados) {
    const n = `${match[1]}${match[2]}${match[3]}${match[4]}${match[5]}`
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
  data_emissao: /(?:data\s*(?:de\s*)?emiss[aã]o|emitido\s*em|data)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i,
  data_compra: /data\s*compra\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i,
  valor_total: /valor\s*total\s*[:\-R$]*\s*([\d.]+,\d{2})/i,
  razao_social: /raz[aã]o\s*social\s*[:\-]?\s*(.+?)(?:\n|\t|CNPJ|CPF|$)/i,
  nome_fantasia: /nome\s*(?:fantasia)?\s*[:\-]?\s*(.+?)(?:\n|\t|CNPJ|$)/i,
  natureza_operacao: /natureza\s*(?:da\s*)?opera[çc][aã]o\s*[:\-]?\s*(.+?)(?:\n|\t|$)/i,
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

function extrairNumeroPedido(texto: string): string {
  const m =
    texto.match(/N[ºO°]?\.?\s*PEDIDO\s*[:\s]+(\d{4,8})/i) ||
    texto.match(/PEDIDO[:\s#]+(\d{4,8})/i)
  return m?.[1] ?? ''
}

/**
 * Extrai itens de produto pelo padrão estrutural do PDF VR SOFTWARE:
 * barcode EAN-13  →  (descrição opcional)  →  EMB (XX/N)  →  cód. externo  →  quantidade
 *
 * O padrão (?:[^\/\n]|\/(?!\d))* permite "/" na descrição (ex: "C/ACUCAR")
 * mas pára antes de EMB com "/" seguido de dígito (ex: "UN/12").
 * Funciona mesmo quando o barcode está colado ao texto (ex: "PROM7506339325249").
 */
function extrairItensDaPagina(texto: string): string[][] {
  const itens: string[][] = []

  for (const linha of texto.split('\n')) {
    const l = linha.replace(/\t/g, ' ')

    const m = l.match(
      /(\d{13})(?!\d)(?:[^/\n]|\/(?!\d))*[A-Za-z]{1,4}\/\d+\s+\d{6,15}\s+(\d{1,6})(?=\s|$)/,
    )
    if (m) {
      itens.push([m[1], m[2]])
    }
  }

  return itens
}

export function montarDadosExtraidos(
  texto_completo: string,
  paginas: Array<{ pagina: number; texto: string }>,
): DadosExtraidos {
  const cnpjs = extrairCnpj(texto_completo)
  const cpfs = extrairCpf(texto_completo)
  const campos_extras = extrairCamposRegex(texto_completo)

  const tabelas: TabelaExtraida[] = paginas
    .map(({ pagina, texto }) => {
      // Itens filtrados por regex (apenas linhas de produto com barcode)
      const itens = extrairItensDaPagina(texto)
      if (itens.length === 0) return null

      // Linhas brutas mantidas para referência (layout personalizado)
      const dados = texto
        .split('\n')
        .map((l) => l.split('\t').map((s) => s.trim()).filter(Boolean))
        .filter((cols) => cols.length > 0 && cols.join('').length > 2)

      const numeroPedido = extrairNumeroPedido(texto)

      return { pagina, dados, itens, numeroPedido: numeroPedido || undefined }
    })
    .filter((t): t is NonNullable<typeof t> => t !== null) as TabelaExtraida[]

  return { cnpjs, cpfs, campos_extras, tabelas, texto_completo }
}
