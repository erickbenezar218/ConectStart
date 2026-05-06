import axios from 'axios'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''

function isConfigured(): boolean {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE)
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('55') ? digits : `55${digits}`
}

export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  if (!isConfigured()) {
    console.warn('[Evolution] Não configurado — mensagem não enviada para:', phone)
    return false
  }

  try {
    await axios.post(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        number: formatPhone(phone),
        text: message,
      },
      {
        headers: {
          apikey: EVOLUTION_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )
    console.log(`[Evolution] ✓ Mensagem enviada para ${formatPhone(phone)}`)
    return true
  } catch (error) {
    console.error('[Evolution] ✗ Falha ao enviar mensagem:', error)
    return false
  }
}
