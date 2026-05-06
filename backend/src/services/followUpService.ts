import { prisma } from '../config/database'
import { sendWhatsApp } from './evolutionService'

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

  try {
    const sent = await sendWhatsApp(followUp.lead.phone, message)

    await prisma.followUp.update({
      where: { id: followUp.id },
      data: { status: sent ? 'SENT' : 'FAILED', sentAt: sent ? new Date() : undefined },
    })

    if (sent) console.log(`[FollowUp] ✓ ${followUp.type} enviado para lead ${followUp.leadId}`)
    else console.warn(`[FollowUp] Evolution API não configurada — ${followUp.type} marcado como FAILED`)
  } catch (error) {
    const retryCount = followUp.retryCount + 1
    await prisma.followUp.update({
      where: { id: followUp.id },
      data: { retryCount, status: retryCount >= 3 ? 'FAILED' : 'PENDING' },
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

