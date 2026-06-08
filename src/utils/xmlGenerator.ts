import type { DadosExtraidos, LayoutId } from '../types'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function agora(): string {
  return new Date().toISOString().slice(0, 19)
}

function tagValida(nome: string): string {
  const limpo = nome.replace(/[^a-zA-Z0-9_]/g, '_')
  return /^\d/.test(limpo) ? `C_${limpo}` : limpo || 'Campo'
}

// ── Layout 1 — NF-e Simplificado ──────────────────────────────────────────────
function gerarXmlNfe(dados: DadosExtraidos): string {
  const c = dados.campos_extras
  const cnpj = dados.cnpjs[0]?.formatado ?? ''
  const tabela = dados.tabelas[0]

  const itensXml = tabela
    ? tabela.dados
        .slice(1)
        .map((linha, i) => `    <Item seq="${i + 1}">${linha.map((v) => `<Col>${esc(v)}</Col>`).join('')}</Item>`)
        .join('\n')
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe/simplificado" geradoEm="${agora()}">
  <Emitente>
    <RazaoSocial>${esc(c.razao_social ?? '')}</RazaoSocial>
    <NomeFantasia>${esc(c.nome_fantasia ?? '')}</NomeFantasia>
    <CNPJ>${esc(cnpj)}</CNPJ>
    <InscricaoEstadual>${esc(c.inscricao_est ?? '')}</InscricaoEstadual>
  </Emitente>
  <Nota>
    <ChaveAcesso>${esc(c.chave_nfe ?? '')}</ChaveAcesso>
    <DataEmissao>${esc(c.data_emissao ?? '')}</DataEmissao>
    <NaturezaOperacao>${esc(c.natureza_operacao ?? '')}</NaturezaOperacao>
    <ValorTotal>${esc(c.valor_total ?? '')}</ValorTotal>
    <Itens>
${itensXml}
    </Itens>
  </Nota>
</NFe>`
}

// ── Layout 2 — Cadastro PJ ────────────────────────────────────────────────────
function gerarXmlCadastro(dados: DadosExtraidos): string {
  const c = dados.campos_extras
  const cnpj = dados.cnpjs[0]?.formatado ?? ''

  const representantes = dados.cpfs
    .map((cpf) => `    <CPF formatado="${esc(cpf.formatado)}" />`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<CadastroPJ geradoEm="${agora()}">
  <Identificacao>
    <CNPJ>${esc(cnpj)}</CNPJ>
    <RazaoSocial>${esc(c.razao_social ?? '')}</RazaoSocial>
    <NomeFantasia>${esc(c.nome_fantasia ?? '')}</NomeFantasia>
    <InscEstadual>${esc(c.inscricao_est ?? '')}</InscEstadual>
  </Identificacao>
  <Endereco>
    <Logradouro>${esc(c.endereco ?? '')}</Logradouro>
    <CEP>${esc(c.cep ?? '')}</CEP>
    <Cidade>${esc(c.cidade ?? '')}</Cidade>
    <UF>${esc(c.uf ?? '')}</UF>
  </Endereco>
  <Contato>
    <Telefone>${esc(c.telefone ?? '')}</Telefone>
    <Email>${esc(c.email ?? '')}</Email>
  </Contato>
  <Representantes>
${representantes}
  </Representantes>
</CadastroPJ>`
}

// ── Layout 3 — Importação TOTVS Protheus ─────────────────────────────────────
function gerarXmlProtheus(dados: DadosExtraidos): string {
  const c = dados.campos_extras
  const cnpj = dados.cnpjs[0]?.formatado ?? ''
  const tabela = dados.tabelas[0]

  const itensXml = tabela
    ? tabela.dados
        .slice(1)
        .map((linha, i) => `        <Item seq="${i + 1}">${linha.map((v, ci) => `<${tagValida(`Col${ci + 1}`)}>${esc(v)}</${tagValida(`Col${ci + 1}`)}>`).join('')}</Item>`)
        .join('\n')
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<TOTVS type="BusinessObject" geradoEm="${agora()}">
  <TotvsBusMsg>
    <TotvsMsgHeader>
      <CodigoEmpresa>01</CodigoEmpresa>
      <CodigoFilial>01</CodigoFilial>
      <TipoMensagem>BusinessObject</TipoMensagem>
      <Transacao>ImportacaoPDF</Transacao>
    </TotvsMsgHeader>
    <TotvsMsgBody>
      <Cabecalho>
        <CNPJ>${esc(cnpj)}</CNPJ>
        <RazaoSocial>${esc(c.razao_social ?? '')}</RazaoSocial>
        <CodFornecedor>${esc(c.cod_fornecedor ?? '')}</CodFornecedor>
        <DataEmissao>${esc(c.data_emissao ?? '')}</DataEmissao>
        <ValorTotal>${esc(c.valor_total ?? '')}</ValorTotal>
        <CondPagamento>${esc(c.condicao_pagamento ?? '')}</CondPagamento>
        <Prazo>${esc(c.prazo ?? '')}</Prazo>
      </Cabecalho>
      <Itens>
${itensXml}
      </Itens>
    </TotvsMsgBody>
  </TotvsBusMsg>
</TOTVS>`
}

// ── Layout 4 — Personalizado (esqueleto) ─────────────────────────────────────
function gerarXmlPersonalizado(dados: DadosExtraidos): string {
  const c = dados.campos_extras
  const cnpj = dados.cnpjs[0]?.formatado ?? ''

  const camposXml = Object.entries({ cnpj_principal: cnpj, ...c })
    .map(([k, v]) => `  <${tagValida(k)}>${esc(v)}</${tagValida(k)}>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<DocumentoPersonalizado geradoEm="${agora()}" versao="1.0">
${camposXml}
</DocumentoPersonalizado>`
}

// ── Layout 5 — Importação ION (ArquivoImportado) ─────────────────────────────
function gerarXmlImportacao(dados: DadosExtraidos): string {
  const cnpjCliente = dados.cnpjs[0]?.numerico ?? ''
  const cnpjFmt = dados.cnpjs[0]?.formatado ?? ''
  const tabela = dados.tabelas[0]

  const COLUNAS = [
    'CodProduto', 'CodEmbalagem', 'Quantidade', 'Descricao',
    'Emba', 'QtUnit', 'PrecoVenda', 'PrecoEmba', 'PrecoEmbaST',
    'PrecoUnit', 'PrecoTot', 'PrecoTotION', 'PrecoTotIONST',
  ]

  const itensXml = tabela
    ? tabela.dados
        .slice(1)
        .map((linha, i) => {
          const cols = COLUNAS.map((col, ci) => `      <${col}>${esc(linha[ci] ?? '')}</${col}>`).join('\n')
          return `    <Item seq="${i + 1}">\n${cols}\n    </Item>`
        })
        .join('\n')
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<ImportacaoProdutos geradoEm="${agora()}" versao="1.0">
  <Cabecalho>
    <CNPJ>${esc(cnpjFmt)}</CNPJ>
    <CNPJNumerico>${esc(cnpjCliente)}</CNPJNumerico>
    <TotalItens>${tabela ? Math.max(0, tabela.dados.length - 1) : 0}</TotalItens>
  </Cabecalho>
  <Itens>
${itensXml}
  </Itens>
</ImportacaoProdutos>`
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export function gerarXml(layoutId: LayoutId, dados: DadosExtraidos): string {
  switch (layoutId) {
    case 'nfe':          return gerarXmlNfe(dados)
    case 'cadastro':     return gerarXmlCadastro(dados)
    case 'protheus':     return gerarXmlProtheus(dados)
    case 'personalizado': return gerarXmlPersonalizado(dados)
    case 'importacao':   return gerarXmlImportacao(dados)
  }
}
