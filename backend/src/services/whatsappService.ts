/**
 * WhatsApp Integration Service
 * Prepared for future WhatsApp Business API integration
 * Using Meta Cloud API (whatsapp.com/business/api)
 */

interface WhatsAppMessage {
  to: string
  type: 'text' | 'template'
  text?: { body: string }
  template?: {
    name: string
    language: { code: string }
    components?: object[]
  }
}

interface LeadNotificationData {
  leadId: string
  fullName: string
  phone: string
  status: string
  scheduledDate?: string
  installerName?: string
}

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || ''
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || ''
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || ''

const isConfigured = (): boolean =>
  Boolean(WHATSAPP_API_URL && WHATSAPP_TOKEN && WHATSAPP_PHONE_ID)

async function sendMessage(message: WhatsAppMessage): Promise<boolean> {
  if (!isConfigured()) {
    console.warn('[WhatsApp] Not configured. Skipping message to:', message.to)
    return false
  }

  try {
    const { default: axios } = await import('axios')
    await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...message,
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return true
  } catch (error) {
    console.error('[WhatsApp] Failed to send message:', error)
    return false
  }
}

export async function notifyLeadCreated(data: LeadNotificationData): Promise<void> {
  const phone = formatPhone(data.phone)
  await sendMessage({
    to: phone,
    type: 'text',
    text: {
      body: `Olá ${data.fullName}! 🎉\n\nSeu pré-cadastro foi recebido com sucesso!\n\nEm breve nossa equipe entrará em contato para confirmar sua instalação.\n\nQualquer dúvida, responda esta mensagem.\n\n*ConectFlow*`,
    },
  })
}

export async function notifyLeadScheduled(data: LeadNotificationData): Promise<void> {
  const phone = formatPhone(data.phone)
  const dateStr = data.scheduledDate
    ? new Date(data.scheduledDate).toLocaleDateString('pt-BR')
    : 'a confirmar'

  await sendMessage({
    to: phone,
    type: 'text',
    text: {
      body: `Olá ${data.fullName}! 📅\n\nSua instalação foi agendada para o dia *${dateStr}*!\n\n${data.installerName ? `Técnico responsável: ${data.installerName}` : ''}\n\nAguardamos você em casa!\n\n*ConectFlow*`,
    },
  })
}

export async function notifyLeadInstalled(data: LeadNotificationData): Promise<void> {
  const phone = formatPhone(data.phone)
  await sendMessage({
    to: phone,
    type: 'text',
    text: {
      body: `Olá ${data.fullName}! ✅\n\nSua instalação foi concluída com sucesso!\n\nBem-vindo(a) à família ConectFlow! 🚀\n\nEm caso de dúvidas, estamos à disposição.\n\n*ConectFlow*`,
    },
  })
}

function formatPhone(phone: string): string {
  // Strip non-digits and ensure country code
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  return `55${digits}`
}

export default {
  notifyLeadCreated,
  notifyLeadScheduled,
  notifyLeadInstalled,
  isConfigured,
}
