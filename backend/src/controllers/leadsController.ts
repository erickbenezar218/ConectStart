import { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database'
import { calculatePricing } from '../services/pricingService'
import whatsappService from '../services/whatsappService'
import erpService from '../services/erpService'
import { AppError } from '../middleware/errorHandler'
import { CreateLeadDTO, UpdateLeadStatusDTO, LeadStatus } from '../types'

export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body: CreateLeadDTO = req.body

    // Calculate pricing server-side
    const pricing = await calculatePricing({
      neighborhood: body.neighborhood,
      distance: body.distance,
      contractType: body.contractType,
    })

    const lead = await prisma.lead.create({
      data: {
        fullName: body.fullName,
        cpf: body.cpf.replace(/\D/g, ''),
        email: body.email,
        phone: body.phone.replace(/\D/g, ''),
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        rg: body.rg,
        zipCode: body.zipCode.replace(/\D/g, ''),
        street: body.street,
        number: body.number,
        complement: body.complement,
        neighborhood: body.neighborhood,
        city: body.city,
        state: body.state,
        latitude: body.latitude,
        longitude: body.longitude,
        housePhotoUrl: body.housePhotoUrl,
        planId: body.planId,
        planName: body.planName,
        planPrice: body.planPrice,
        planSpeed: body.planSpeed,
        contractType: body.contractType,
        billingDate: body.billingDate,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        schedulePeriod: body.schedulePeriod,
        wifiName: body.wifiName,
        wifiPassword: body.wifiPassword,
        distance: body.distance,
        adhesionFee: pricing.adhesionFee,
        distanceFee: pricing.distanceFee,
        totalSetup: pricing.totalSetup,
        source: body.source || 'web',
      },
    })

    // Fire-and-forget integrations
    whatsappService.notifyLeadCreated({
      leadId: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      status: lead.status,
    }).catch(console.error)

    erpService.syncLeadToERP(lead).catch(console.error)

    res.status(201).json({ success: true, data: lead })
  } catch (error) {
    next(error)
  }
}

export async function getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      status,
      neighborhood,
      page = '1',
      limit = '20',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { cpf: { contains: search } },
      ]
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          neighborhood: true,
          city: true,
          planName: true,
          planPrice: true,
          status: true,
          priority: true,
          createdAt: true,
          scheduledDate: true,
          housePhotoUrl: true,
          totalSetup: true,
          contractType: true,
        },
      }),
      prisma.lead.count({ where }),
    ])

    res.json({
      success: true,
      data: leads,
      meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    })
  } catch (error) {
    next(error)
  }
}

export async function getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!lead) throw new AppError('Lead não encontrado', 404)

    res.json({ success: true, data: lead })
  } catch (error) {
    next(error)
  }
}

export async function updateLeadStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params
    const { status, notes, changedBy }: UpdateLeadStatusDTO = req.body

    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) throw new AppError('Lead não encontrado', 404)

    const timestampField: Record<string, Date | null> = {}
    const now = new Date()
    if (status === 'CONTACTED') timestampField.contactedAt = now
    if (status === 'SCHEDULED') timestampField.scheduledAt = now
    if (status === 'INSTALLED') timestampField.installedAt = now
    if (status === 'CANCELLED') timestampField.cancelledAt = now

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { status, notes, ...timestampField },
      }),
      prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStatus: lead.status,
          toStatus: status,
          notes,
          changedBy,
        },
      }),
    ])

    // WhatsApp notifications on key status changes
    if (status === 'SCHEDULED') {
      whatsappService.notifyLeadScheduled({
        leadId: id,
        fullName: lead.fullName,
        phone: lead.phone,
        status,
        scheduledDate: lead.scheduledDate?.toISOString(),
      }).catch(console.error)
    }
    if (status === 'INSTALLED') {
      whatsappService.notifyLeadInstalled({
        leadId: id,
        fullName: lead.fullName,
        phone: lead.phone,
        status,
      }).catch(console.error)
    }

    res.json({ success: true, data: updatedLead })
  } catch (error) {
    next(error)
  }
}

export async function getKanban(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'SCHEDULED', 'INSTALLED', 'CANCELLED']

    const columns = await Promise.all(
      statuses.map(async (status) => {
        const leads = await prisma.lead.findMany({
          where: { status },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            fullName: true,
            neighborhood: true,
            phone: true,
            planName: true,
            planPrice: true,
            status: true,
            priority: true,
            createdAt: true,
            scheduledDate: true,
            housePhotoUrl: true,
            contractType: true,
            totalSetup: true,
          },
        })

        const labels: Record<LeadStatus, string> = {
          NEW: 'Novos',
          CONTACTED: 'Contatados',
          SCHEDULED: 'Agendados',
          INSTALLED: 'Instalados',
          CANCELLED: 'Cancelados',
        }

        return { status, label: labels[status], leads, count: leads.length }
      })
    )

    res.json({ success: true, data: columns })
  } catch (error) {
    next(error)
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [total, byStatus, recentLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({ by: ['status'], _count: { status: true } }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, status: true, createdAt: true, planName: true },
      }),
    ])

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count.status])
    )

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusMap,
        recentLeads,
      },
    })
  } catch (error) {
    next(error)
  }
}
