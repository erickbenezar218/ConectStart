import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PizZip = require('pizzip')

const execAsync = promisify(exec)
const TEMPLATES_DIR = path.join(process.cwd(), 'templates')
const CONTRACTS_DIR = path.join(process.cwd(), 'contracts')

if (!fs.existsSync(CONTRACTS_DIR)) fs.mkdirSync(CONTRACTS_DIR, { recursive: true })

export interface ContractTemplateData {
  CLIENTE_ID: string           // Nº de ordem do contrato
  CLIENTE_NOME: string
  CLIENTE_DATANASC: string
  CLIENTE_RGIE: string
  CLIENTE_CPFCNPJ: string
  CLIENTE_TELEFONE: string
  CLIENTE_CELULAR: string
  CLIENTE_EMAIL: string
  SERVICO_ENDERECO: string
  SERVICO_NUMERO: string       // fragmentado no docx: SERVICO_ + NUMERO
  SERVICO_COMPLEMENTO: string  // fragmentado no docx: SERVICO_ + COMPLEMENTO
  SERVICO_BAIRRO: string
  SERVICO_CEP: string
  SERVICO_CIDADE: string
  SERVICO_INSTALACAO_VALOR: string
  PLANO_VELOCIDADE: string     // fragmentado no docx: PLANO_ + VELOCIDADE
  PLANO_VALOR: string
  COBRANCA_VENCIMENTO: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildContractData(lead: any, contractId: string): ContractTemplateData {
  const fmtDate = (d?: Date | string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—'
  const fmtMoney = (v?: number | null) =>
    v != null ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'

  return {
    CLIENTE_ID: contractId.slice(-8).toUpperCase(),
    CLIENTE_NOME: lead.fullName || '',
    CLIENTE_DATANASC: fmtDate(lead.birthDate),
    CLIENTE_RGIE: lead.rg || '—',
    CLIENTE_CPFCNPJ: lead.cpf || '',
    CLIENTE_TELEFONE: lead.phone || '',
    CLIENTE_CELULAR: lead.phone || '',
    CLIENTE_EMAIL: lead.email || '',
    SERVICO_ENDERECO: [lead.street, lead.number].filter(Boolean).join(', '),
    SERVICO_NUMERO: lead.number || '',
    SERVICO_COMPLEMENTO: lead.complement || '—',
    SERVICO_BAIRRO: lead.neighborhood || '',
    SERVICO_CEP: lead.zipCode || '',
    SERVICO_CIDADE: [lead.city, lead.state].filter(Boolean).join(' - '),
    SERVICO_INSTALACAO_VALOR: fmtMoney(lead.totalSetup),
    PLANO_VELOCIDADE: lead.planSpeed || lead.planName || '—',
    PLANO_VALOR: fmtMoney(lead.planPrice),
    COBRANCA_VENCIMENTO: lead.billingDate ? `Dia ${lead.billingDate}` : '—',
  }
}

export function computeContractHash(contractId: string, data: ContractTemplateData): string {
  return crypto.createHash('sha256').update(JSON.stringify({ contractId, ...data })).digest('hex')
}

export async function fillTemplate(
  data: ContractTemplateData,
  contractId: string
): Promise<{ docxFilename: string; pdfFilename: string | null }> {
  const templatePath = path.join(TEMPLATES_DIR, 'contrato.docx')

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      'Template nao encontrado. Adicione o arquivo backend/templates/contrato.docx com as variaveis (ex: CLIENTE_NOME, PLANO_VALOR, etc.)'
    )
  }

  const content = fs.readFileSync(templatePath)
  const zip = new PizZip(content)

  let docXml: string = zip.files['word/document.xml'].asText()

  docXml = applySubstitutions(docXml, data)

  zip.file('word/document.xml', docXml)

  const docxBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
  const docxFilename = `${contractId}.docx`
  fs.writeFileSync(path.join(CONTRACTS_DIR, docxFilename), docxBuffer)

  const pdfFilename = await convertToPdf(contractId)
  return { docxFilename, pdfFilename }
}

/**
 * Applies all variable substitutions to the document XML.
 *
 * Some variables are split across two consecutive <w:t> elements by Word
 * (happens when formatting changes mid-word). Those are handled first with
 * a targeted regex before the simple global replacements.
 */
function applySubstitutions(xml: string, data: ContractTemplateData): string {
  let result = xml

  // --- Split variables ---
  // Pattern: first <w:t> contains the first fragment, next <w:t> contains the second.
  // We replace the first fragment with the full value and the second with an empty string.
  const splitVars: Array<{ key: keyof ContractTemplateData; frag1: string; frag2: string }> = [
    { key: 'PLANO_VELOCIDADE', frag1: 'PLANO_', frag2: 'VELOCIDADE' },
    { key: 'SERVICO_NUMERO', frag1: 'SERVICO_', frag2: 'NUMERO' },
    { key: 'SERVICO_COMPLEMENTO', frag1: 'SERVICO_', frag2: 'COMPLEMENTO' },
  ]

  for (const { key, frag1, frag2 } of splitVars) {
    const value = escapeXml(data[key])
    // Replace frag1 with value and frag2 with empty, keeping everything in between
    result = result.replace(
      new RegExp(`${escapeRegex(frag1)}(<\\/w:t>[\\s\\S]{0,500}?<w:t[^>]*>)${escapeRegex(frag2)}`, 'g'),
      `${value}$1`
    )
  }

  // --- Simple variables (whole content of a <w:t> or partial) ---
  const simpleVars: Array<keyof ContractTemplateData> = [
    'CLIENTE_ID',
    'CLIENTE_NOME',
    'CLIENTE_DATANASC',
    'CLIENTE_RGIE',
    'CLIENTE_CPFCNPJ',
    'CLIENTE_TELEFONE',
    'CLIENTE_CELULAR',
    'CLIENTE_EMAIL',
    'SERVICO_ENDERECO',
    'SERVICO_BAIRRO',
    'SERVICO_CEP',
    'SERVICO_CIDADE',
    'SERVICO_INSTALACAO_VALOR',
    'PLANO_VALOR',
    'COBRANCA_VENCIMENTO',
  ]

  for (const key of simpleVars) {
    result = result.split(key).join(escapeXml(data[key]))
  }

  return result
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function findLibreOfficeBin(): Promise<string | null> {
  const candidates = [
    'libreoffice',
    'soffice',
    '/usr/bin/libreoffice',
    '/usr/bin/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    '/snap/bin/libreoffice',
  ]
  for (const bin of candidates) {
    try {
      await execAsync(`"${bin}" --version`)
      return bin
    } catch {
      // not found, try next
    }
  }
  return null
}

async function convertToPdf(contractId: string): Promise<string | null> {
  const docxPath = path.join(CONTRACTS_DIR, `${contractId}.docx`)
  try {
    const bin = await findLibreOfficeBin()
    if (!bin) {
      console.warn('[Document] LibreOffice nao encontrado — PDF nao gerado. Instale para conversao automatica.')
      return null
    }
    await execAsync(`"${bin}" --headless --convert-to pdf --outdir "${CONTRACTS_DIR}" "${docxPath}"`)
    const pdfFilename = `${contractId}.pdf`
    return fs.existsSync(path.join(CONTRACTS_DIR, pdfFilename)) ? pdfFilename : null
  } catch (err) {
    console.warn('[Document] Falha ao converter para PDF:', err)
    return null
  }
}

export interface SignatureProofData {
  contractId: string
  signerName: string
  signerCpf: string
  signedAt: Date
  signerIp: string
  contractHash: string
  hasSelfie: boolean
  hasDocumentPhoto: boolean
}

export async function generateSignedProof(data: SignatureProofData): Promise<string> {
  const originalPdfPath = path.join(CONTRACTS_DIR, `${data.contractId}.pdf`)
  let pdfDoc: PDFDocument

  if (fs.existsSync(originalPdfPath)) {
    const originalBytes = fs.readFileSync(originalPdfPath)
    pdfDoc = await PDFDocument.load(originalBytes)
  } else {
    pdfDoc = await PDFDocument.create()
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const page = pdfDoc.addPage([595.28, 841.89])
  const { width, height } = page.getSize()

  const draw = (text: string, x: number, y: number, size: number, useBold = false, color = rgb(0, 0, 0)) =>
    page.drawText(text, { x, y, font: useBold ? bold : font, size, color })

  let y = height - 55

  draw('COMPROVANTE DE ASSINATURA ELETRONICA', 50, y, 15, true, rgb(0.08, 0.15, 0.5))
  y -= 28
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.7, 0.7, 0.7) })
  y -= 18
  draw('Documento assinado eletronicamente conforme MP 2.200-2/2001 e Lei 14.063/2020', 50, y, 8, false, rgb(0.4, 0.4, 0.4))
  y -= 30

  const rows: [string, string][] = [
    ['ID do Contrato', data.contractId],
    ['Assinado por', data.signerName],
    ['CPF', data.signerCpf],
    ['Data e Hora', new Date(data.signedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })],
    ['Endereco IP', data.signerIp],
    ['Hash SHA-256', data.contractHash],
  ]

  for (const [label, value] of rows) {
    draw(`${label}:`, 50, y, 10, true)
    const maxChars = 65
    if (value.length <= maxChars) {
      draw(value, 210, y, 10)
      y -= 22
    } else {
      draw(value.substring(0, maxChars), 210, y, 10)
      y -= 15
      draw(value.substring(maxChars), 210, y, 10)
      y -= 22
    }
  }

  y -= 15
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 22

  draw('Prova de Vida', 50, y, 11, true)
  y -= 20

  if (data.hasSelfie) {
    draw('[OK] Selfie do signatario capturada e armazenada', 50, y, 10, false, rgb(0.1, 0.5, 0.1))
    y -= 18
  }
  if (data.hasDocumentPhoto) {
    draw('[OK] Foto do documento de identidade capturada e armazenada', 50, y, 10, false, rgb(0.1, 0.5, 0.1))
    y -= 18
  }

  y -= 25
  draw('Este comprovante possui validade juridica e confirma a concordancia do signatario', 50, y, 8, false, rgb(0.45, 0.45, 0.45))
  y -= 14
  draw('com os termos do contrato identificado acima, conforme legislacao vigente.', 50, y, 8, false, rgb(0.45, 0.45, 0.45))

  const proofFilename = `${data.contractId}_signed.pdf`
  fs.writeFileSync(path.join(CONTRACTS_DIR, proofFilename), await pdfDoc.save())
  return proofFilename
}

export function deleteContractFiles(contractId: string): void {
  const suffixes = ['.docx', '.pdf', '_signed.pdf', '_selfie.jpg', '_selfie.png', '_document.jpg', '_document.png']
  for (const s of suffixes) {
    const p = path.join(CONTRACTS_DIR, `${contractId}${s}`)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  }
}
