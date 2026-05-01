import axios from 'axios'
import { prisma } from '../config/database'

const FOLLOWUP_WEBHOOK_URL = process.env.FOLLOWUP_WEBHOOK_URL || ''
const FOLLOWUP_WEBHOOK_SECRET = process.env.FOLLOWUP_WEBHOOK_SECRET || ''
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`

export async function scheduleFollowUpsForLead(leadId: string, installedAt: Date): Promise<void> {
  const existing = await prisma.followUp.count({ where: { leadId } })
  if (existing > 0) return

  const d1 = new Date(installedAt)
  d1.setDate(d1.getDate() + 1)
  d1.setHours(9, 0, 0, 0)

  const d7 = new Date(installedAt)
  d7.setDate(d7.getDate() + 7)
  d7.setHours(9, 0, 0, 0)

  const d30 = new Date(installedAt)
  d30.setDate(d30.getDate() + 30)
  d30.setHours(9, 0, 0, 0)

  await prisma.followUp.createMany({
    data: [
      { leadId, type: 'D1_CHECK', scheduledFor: d1 },
      { leadId, type: 'D7_FEEDBACK', scheduledFor: d7 },
      { leadId, type: 'D30_UPGRADE', scheduledFor: d30 },
    ],
  })

  console.log(`[FollowUp] 3 follow-ups agendados para lead ${leadId}`)
}

export async function processDueFollowUps(): Promise<void> {
  const now = new Date()

  const due = await prisma.followUp.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: now } },
    include: {
      lead: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          planName: true,
          neighborhood: true,
          installedAt: true,
          status: true,
        },
      },
    },
    orderBy: { scheduledFor: 'asc' },
  })

  console.log(`[FollowUp] ${due.length} follow-ups a processar`)

  for (const followUp of due) {
    if (followUp.lead.status === 'CANCELLED') {
      await prisma.followUp.update({ where: { id: followUp.id }, data: { status: 'SKIPPED' } })
      continue
    }
    await sendWebhook(followUp)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendWebhook(followUp: any): Promise<void> {
  const message = buildMessage(followUp.type, followUp.lead.fullName, followUp.lead.planName)
  const callbackUrl = `${API_BASE_URL}/api/follow-ups/webhook/callback`

  if (!FOLLOWUP_WEBHOOK_URL) {
    console.warn(`[FollowUp] FOLLOWUP_WEBHOOK_URL não configurado — marcando ${followUp.type} como SENT sem envio`)
    await prisma.followUp.update({
      where: { id: followUp.id },
      data: { status: 'SENT', sentAt: new Date() },
    })
    return
  }

  try {
    await axios.post(
      FOLLOWUP_WEBHOOK_URL,
      {
        followUpId: followUp.id,
        type: followUp.type,
        lead: {
          id: followUp.lead.id,
          fullName: followUp.lead.fullName,
          phone: formatPhone(followUp.lead.phone),
          planName: followUp.lead.planName,
          neighborhood: followUp.lead.neighborhood,
          installedAt: followUp.lead.installedAt,
        },
        message,
        callbackUrl,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(FOLLOWUP_WEBHOOK_SECRET && { 'X-Webhook-Secret': FOLLOWUP_WEBHOOK_SECRET }),
        },
        timeout: 10000,
      }
    )

    await prisma.followUp.update({
      where: { id: followUp.id },
      data: { status: 'SENT', sentAt: new Date() },
    })

    console.log(`[FollowUp] ✓ ${followUp.type} enviado para lead ${followUp.leadId}`)
  } catch (error) {
    const retryCount = followUp.retryCount + 1
    await prisma.followUp.update({
      where: { id: followUp.id },
      data: {
        retryCount,
        status: retryCount >= 3 ? 'FAILED' : 'PENDING',
      },
    })
    console.error(`[FollowUp] ✗ Falha em ${followUp.type} para lead ${followUp.leadId} (tentativa ${retryCount}):`, error)
  }
}

export function buildMessage(type: string, fullName: string, planName?: string | null): string {
  const firstName = fullName.split(' ')[0]

  if (type === 'D1_CHECK') {
    return (
      `Olá ${firstName}! 👋\n\n` +
      `Aqui é da *ConectPlus Fibra*!\n\n` +
      `Sua internet foi instalada ontem e queríamos saber: está tudo funcionando bem? 📶\n\n` +
      `Caso tenha algum problema ou dúvida, é só responder essa mensagem que vamos te ajudar! 😊`
    )
  }

  if (type === 'D7_FEEDBACK') {
    return (
      `Olá ${firstName}! 🌟\n\n` +
      `Já faz uma semana que você está com a *ConectPlus Fibra*!\n\n` +
      `O que você está achando da velocidade e qualidade do serviço? Sua opinião é muito importante pra gente! ⭐\n\n` +
      `Responda com uma nota de 1️⃣ a 5️⃣ para nos ajudar a melhorar!`
    )
  }

  if (type === 'D30_UPGRADE') {
    return (
      `Olá ${firstName}! 📶\n\n` +
      `Completou 1 mês com a *ConectPlus Fibra*! 🎉` +
      (planName ? `\n\nVocê está no plano *${planName}*.` : '') +
      ` Que tal turbinar sua internet? Temos planos com velocidades ainda maiores disponíveis na sua região! 🚀\n\n` +
      `Responda *SIM* e te apresento as opções!`
    )
  }

  return `Olá ${firstName}! Aqui é da *ConectPlus Fibra*. Como podemos te ajudar?`
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}
