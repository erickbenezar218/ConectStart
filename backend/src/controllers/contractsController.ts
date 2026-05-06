import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import { prisma } from '../config/database'
import { sendWhatsApp } from '../services/evolutionService'
import {
  buildContractData,
  fillTemplate,
  computeContractHash,
  generateSignedProof,
  deleteContractFiles,
} from '../services/documentService'

const CONTRACTS_DIR = path.join(process.cwd(), 'contracts')
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000'

// 7-day token expiry
const TOKEN_TTL_DAYS = 7

function tokenExpiry(): Date {
  const d = new Date()
  d.setDate(d.getDate() + TOKEN_TTL_DAYS)
  return d
}

function generateToken(): string {
  const { randomUUID } = require('crypto')
  return randomUUID()
}

// --- Multer for signature uploads ---
const signatureStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CONTRACTS_DIR),
  filename: (req, file, cb) => {
    const token = (req as Request).params.token
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const suffix = file.fieldname === 'selfie' ? 'selfie' : 'document'
    cb(null, `_tmp_${token}_${suffix}${ext}`)
  },
})

export const signatureUpload = multer({
  storage: signatureStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Apenas imagens sao aceitas'))
  },
})

// --- Helpers ---
function getFileUrl(req: Request, filename: string, subdir = 'contracts'): string {
  return `${req.protocol}://${req.get('host')}/${subdir}/${filename}`
}

function ok(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data })
}

function fail(res: Response, message: string, status = 400) {
  return res.status(status).json({ success: false, error: message })
}

// --- Controllers ---

export async function generate(req: Request, res: Response) {
  const { leadId } = req.params
  try {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } })
    if (!lead) return fail(res, 'Lead nao encontrado', 404)

    let contract = await prisma.contract.findUnique({ where: { leadId } })

    // Delete old files if regenerating
    if (contract) deleteContractFiles(contract.id)

    const newId = contract?.id ?? (require('crypto').randomUUID() as string)

    const templateData = buildContractData(lead, newId)
    const hash = computeContractHash(newId, templateData)

    const { docxFilename, pdfFilename } = await fillTemplate(templateData, newId)

    const upsertData = {
      leadId,
      status: 'PENDING' as const,
      signatureToken: generateToken(),
      tokenExpiresAt: tokenExpiry(),
      docxFilename,
      pdfFilename,
      signedPdfFilename: null,
      signatureHash: hash,
      sentAt: null,
      sentBy: null,
      signedAt: null,
      signerIp: null,
      signerUserAgent: null,
      selfieFilename: null,
      documentPhotoFilename: null,
    }

    contract = await prisma.contract.upsert({
      where: { leadId },
      update: { ...upsertData, id: undefined },
      create: { id: newId, ...upsertData },
    })

    return ok(res, contract, 201)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar contrato'
    console.error('[Contracts] generate error:', err)
    return fail(res, msg, 500)
  }
}

export async function list(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'))
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20')))
    const status = req.query.status as string | undefined

    const where = status ? { status: status as never } : {}

    const [total, contracts] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              cpf: true,
              phone: true,
              planName: true,
              planPrice: true,
              neighborhood: true,
              status: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return res.json({
      success: true,
      data: contracts,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[Contracts] list error:', err)
    return fail(res, 'Erro ao listar contratos', 500)
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        lead: true,
      },
    })
    if (!contract) return fail(res, 'Contrato nao encontrado', 404)
    return ok(res, contract)
  } catch {
    return fail(res, 'Erro ao buscar contrato', 500)
  }
}

export async function getByLeadId(req: Request, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { leadId: req.params.leadId },
      include: { lead: { select: { id: true, fullName: true, cpf: true, phone: true, planName: true, planPrice: true } } },
    })
    if (!contract) return fail(res, 'Contrato nao encontrado', 404)
    return ok(res, contract)
  } catch {
    return fail(res, 'Erro ao buscar contrato', 500)
  }
}

export async function dispatch(req: Request, res: Response) {
  const { id } = req.params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user as { id: string; name: string } | undefined

  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { lead: true },
    })
    if (!contract) return fail(res, 'Contrato nao encontrado', 404)
    if (contract.status === 'SIGNED') return fail(res, 'Contrato ja assinado', 400)

    const signingUrl = `${APP_BASE_URL}/assinar/${contract.signatureToken}`
    const lead = contract.lead

    const message =
      `Olá ${lead.fullName.split(' ')[0]}! 📝\n\n` +
      `Seu contrato com a *ConectPlus Fibra* está pronto para assinatura.\n\n` +
      `Acesse o link abaixo para visualizar e assinar eletronicamente:\n${signingUrl}\n\n` +
      `_O link expira em ${TOKEN_TTL_DAYS} dias._`

    await sendWhatsApp(lead.phone, message)

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), sentBy: user?.name || null },
    })

    return ok(res, updated)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao disparar contrato'
    console.error('[Contracts] dispatch error:', err)
    return fail(res, msg, 500)
  }
}

// PUBLIC: returns info needed by the signing page
export async function getPublicInfo(req: Request, res: Response) {
  const { token } = req.params
  try {
    const contract = await prisma.contract.findUnique({
      where: { signatureToken: token },
      include: {
        lead: {
          select: {
            fullName: true,
            cpf: true,
            planName: true,
            planPrice: true,
            planSpeed: true,
            neighborhood: true,
            city: true,
            state: true,
          },
        },
      },
    })

    if (!contract) return fail(res, 'Link invalido ou contrato nao encontrado', 404)

    if (contract.status === 'SIGNED') {
      return ok(res, { status: 'SIGNED', signedAt: contract.signedAt })
    }

    if (new Date() > contract.tokenExpiresAt) {
      await prisma.contract.update({ where: { id: contract.id }, data: { status: 'EXPIRED' } })
      return fail(res, 'Link expirado. Solicite um novo link ao atendimento.', 410)
    }

    const pdfUrl = contract.pdfFilename
      ? `${req.protocol}://${req.get('host')}/contracts/${contract.pdfFilename}`
      : null

    return ok(res, {
      contractId: contract.id,
      status: contract.status,
      tokenExpiresAt: contract.tokenExpiresAt,
      pdfUrl,
      lead: contract.lead,
    })
  } catch {
    return fail(res, 'Erro ao buscar contrato', 500)
  }
}

// PUBLIC: submit signature
export async function submitSignature(req: Request, res: Response) {
  const { token } = req.params
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined

  try {
    const contract = await prisma.contract.findUnique({
      where: { signatureToken: token },
      include: { lead: { select: { fullName: true, cpf: true } } },
    })

    if (!contract) {
      cleanTmpFiles(files)
      return fail(res, 'Link invalido', 404)
    }
    if (contract.status === 'SIGNED') {
      cleanTmpFiles(files)
      return fail(res, 'Contrato ja assinado', 400)
    }
    if (new Date() > contract.tokenExpiresAt) {
      cleanTmpFiles(files)
      await prisma.contract.update({ where: { id: contract.id }, data: { status: 'EXPIRED' } })
      return fail(res, 'Link expirado', 410)
    }

    const selfieFile = files?.['selfie']?.[0]
    const documentFile = files?.['documentPhoto']?.[0]

    if (!selfieFile || !documentFile) {
      cleanTmpFiles(files)
      return fail(res, 'Envie a selfie e a foto do documento', 400)
    }

    // Rename temp files to permanent names
    const selfieFilename = `${contract.id}_selfie${path.extname(selfieFile.filename)}`
    const documentFilename = `${contract.id}_document${path.extname(documentFile.filename)}`
    fs.renameSync(selfieFile.path, path.join(CONTRACTS_DIR, selfieFilename))
    fs.renameSync(documentFile.path, path.join(CONTRACTS_DIR, documentFilename))

    const signerIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
    const signerUserAgent = req.headers['user-agent'] || ''

    const signedPdfFilename = await generateSignedProof({
      contractId: contract.id,
      signerName: contract.lead.fullName,
      signerCpf: contract.lead.cpf,
      signedAt: new Date(),
      signerIp,
      contractHash: contract.signatureHash || '',
      hasSelfie: true,
      hasDocumentPhoto: true,
    })

    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
        signerIp,
        signerUserAgent,
        selfieFilename,
        documentPhotoFilename: documentFilename,
        signedPdfFilename,
      },
    })

    return ok(res, { message: 'Contrato assinado com sucesso', signedAt: new Date() })
  } catch (err: unknown) {
    cleanTmpFiles(files)
    const msg = err instanceof Error ? err.message : 'Erro ao assinar contrato'
    console.error('[Contracts] sign error:', err)
    return fail(res, msg, 500)
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } })
    if (!contract) return fail(res, 'Contrato nao encontrado', 404)
    deleteContractFiles(contract.id)
    await prisma.contract.delete({ where: { id: req.params.id } })
    return ok(res, { deleted: true })
  } catch {
    return fail(res, 'Erro ao excluir contrato', 500)
  }
}

function cleanTmpFiles(files?: { [fieldname: string]: Express.Multer.File[] }) {
  if (!files) return
  Object.values(files)
    .flat()
    .forEach((f) => {
      if (fs.existsSync(f.path)) fs.unlinkSync(f.path)
    })
}
