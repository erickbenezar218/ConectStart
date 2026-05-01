import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { processDueFollowUps } from '../services/followUpService'

export async function listFollowUps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, type, leadId, page = '1', limit = '20' } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}
    if (status) where.status = status
    if (type) where.type = type
    if (leadId) where.leadId = leadId

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              planName: true,
              neighborhood: true,
              installedAt: true,
            },
          },
        },
        orderBy: { scheduledFor: 'asc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.followUp.count({ where }),
    ])

    res.json({
      success: true,
      data: followUps,
      meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    })
  } catch (error) {
    next(error)
  }
}

export async function getFollowUpStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    startOfWeek.setHours(0, 0, 0, 0)

    const [pendingTotal, dueToday, sentThisWeek, completed, failed] = await Promise.all([
      prisma.followUp.count({ where: { status: 'PENDING' } }),
      prisma.followUp.count({ where: { status: 'PENDING', scheduledFor: { lte: now } } }),
      prisma.followUp.count({ where: { status: 'SENT', sentAt: { gte: startOfWeek } } }),
      prisma.followUp.count({ where: { status: 'COMPLETED' } }),
      prisma.followUp.count({ where: { status: 'FAILED' } }),
    ])

    res.json({ success: true, data: { pendingTotal, dueToday, sentThisWeek, completed, failed } })
  } catch (error) {
    next(error)
  }
}

export async function updateFollowUpStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params
    const { status, responseNote } = req.body

    const followUp = await prisma.followUp.findUnique({ where: { id } })
    if (!followUp) throw new AppError('Follow-up não encontrado', 404)

    const updated = await prisma.followUp.update({
      where: { id },
      data: { status, responseNote: responseNote || null },
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
}

export async function triggerManual(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('[FollowUp] Disparo manual iniciado')
    processDueFollowUps().catch(console.error)
    res.json({ success: true, message: 'Processamento iniciado' })
  } catch (error) {
    next(error)
  }
}

export async function webhookCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const secret = req.headers['x-webhook-secret']
    const webhookSecret = process.env.FOLLOWUP_WEBHOOK_SECRET

    if (webhookSecret && secret !== webhookSecret) {
      res.status(401).json({ success: false, error: 'Invalid secret' })
      return
    }

    const { followUpId, success } = req.body
    if (!followUpId) {
      res.status(400).json({ success: false, error: 'followUpId obrigatório' })
      return
    }

    await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date() : undefined,
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
