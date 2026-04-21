/**
 * ERP Integration Service
 * Prepared for future ERP synchronization (SGP, Grandstream, etc.)
 */

import { Lead } from '@prisma/client'

const ERP_API_URL = process.env.ERP_API_URL || ''
const ERP_API_KEY = process.env.ERP_API_KEY || ''

const isConfigured = (): boolean => Boolean(ERP_API_URL && ERP_API_KEY)

interface ERPCustomer {
  externalId: string
  name: string
  cpf: string
  email: string
  phone: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  plan: {
    id: string
    name: string
  }
  contract: {
    type: string
    billingDate: number
  }
  installation: {
    scheduledDate?: string
    wifiName?: string
  }
}

async function post(endpoint: string, body: object): Promise<unknown> {
  if (!isConfigured()) {
    console.warn('[ERP] Not configured. Skipping sync.')
    return null
  }

  try {
    const { default: axios } = await import('axios')
    const { data } = await axios.post(`${ERP_API_URL}${endpoint}`, body, {
      headers: {
        Authorization: `Bearer ${ERP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    return data
  } catch (error) {
    console.error('[ERP] Request failed:', error)
    throw error
  }
}

export async function syncLeadToERP(lead: Lead): Promise<string | null> {
  if (!isConfigured()) return null

  const customer: ERPCustomer = {
    externalId: lead.id,
    name: lead.fullName,
    cpf: lead.cpf,
    email: lead.email,
    phone: lead.phone,
    address: {
      street: lead.street,
      number: lead.number,
      complement: lead.complement ?? undefined,
      neighborhood: lead.neighborhood,
      city: lead.city,
      state: lead.state,
      zipCode: lead.zipCode,
    },
    plan: {
      id: lead.planId ?? '',
      name: lead.planName ?? '',
    },
    contract: {
      type: lead.contractType,
      billingDate: lead.billingDate ?? 10,
    },
    installation: {
      scheduledDate: lead.scheduledDate?.toISOString(),
      wifiName: lead.wifiName ?? undefined,
    },
  }

  try {
    const result = await post('/customers', customer) as { id?: string }
    console.log(`[ERP] Lead ${lead.id} synced. ERP ID: ${result?.id}`)
    return result?.id ?? null
  } catch {
    console.error(`[ERP] Failed to sync lead ${lead.id}`)
    return null
  }
}

export default {
  syncLeadToERP,
  isConfigured,
}
