import * as pdfjsLib from 'pdfjs-dist'

// Usa o worker via CDN para evitar configuração complexa no Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

export interface PdfExtractionResult {
  texto_completo: string
  paginas: Array<{ pagina: number; texto: string }>
}

export async function extrairTextoPdf(file: File): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const paginas: Array<{ pagina: number; texto: string }> = []
  let texto_completo = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const texto = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    paginas.push({ pagina: i, texto })
    texto_completo += `\n--- Página ${i} ---\n${texto}`
  }

  return { texto_completo, paginas }
}
