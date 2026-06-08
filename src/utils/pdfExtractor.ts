import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

export interface PdfExtractionResult {
  texto_completo: string
  paginas: Array<{ pagina: number; texto: string }>
}

interface ItemPos {
  str: string
  x: number
  y: number
  w: number
}

function isTextItem(item: unknown): item is { str: string; transform: number[]; width: number } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'str' in item &&
    'transform' in item &&
    typeof (item as { transform: unknown }).transform === 'object'
  )
}

export async function extrairTextoPdf(file: File): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const paginas: Array<{ pagina: number; texto: string }> = []
  let texto_completo = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Coleta itens com posição (cast para unknown[] para o type guard funcionar)
    const itens: ItemPos[] = (content.items as unknown[])
      .filter(isTextItem)
      .filter((item) => item.str.trim().length > 0)
      .map((item) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        w: item.width || item.str.length * 6,
      }))

    if (itens.length === 0) {
      paginas.push({ pagina: i, texto: '' })
      continue
    }

    // Agrupa por linha (tolerância de 4pt no eixo Y)
    const linhasMap = new Map<number, ItemPos[]>()
    for (const it of itens) {
      let chave = it.y
      for (const k of linhasMap.keys()) {
        if (Math.abs(k - it.y) <= 4) {
          chave = k
          break
        }
      }
      if (!linhasMap.has(chave)) linhasMap.set(chave, [])
      linhasMap.get(chave)!.push(it)
    }

    // Ordena linhas de cima para baixo (Y maior = mais alto no PDF)
    const linhasOrdenadas = [...linhasMap.entries()].sort(([ya], [yb]) => yb - ya)

    const linhasTexto = linhasOrdenadas.map(([, rowItens]) => {
      rowItens.sort((a, b) => a.x - b.x)
      let linha = rowItens[0].str
      for (let j = 1; j < rowItens.length; j++) {
        const prev = rowItens[j - 1]
        const gap = rowItens[j].x - (prev.x + prev.w)
        // Gap > 40pt = separador de coluna (tab); caso contrário, espaço normal
        if (gap > 40) {
          linha += '\t'
        } else if (gap > 0 && !prev.str.endsWith(' ') && !rowItens[j].str.startsWith(' ')) {
          linha += ' '
        }
        linha += rowItens[j].str
      }
      return linha
    })

    const texto = linhasTexto.join('\n')
    paginas.push({ pagina: i, texto })
    texto_completo += `\n--- Página ${i} ---\n${texto}`
  }

  return { texto_completo, paginas }
}
