import axios, { AxiosInstance } from 'axios'
import NodeCache from 'node-cache'
import { SGPPlan, SGPBillingDate } from '../types'

const cache = new NodeCache({ stdTTL: 300 }) // 5-minute cache

const SGP_BASE_URL = process.env.SGP_BASE_URL || 'https://sgp.conectstelecom.com.br/api/precadastro'
const SGP_CREDENTIALS = {
  app: process.env.SGP_APP || 'appprecadastro',
  token: process.env.SGP_TOKEN || '1ca74ff6-739d-48f5-aadb-e03f85d0edb6',
}

const sgpClient: AxiosInstance = axios.create({
  baseURL: SGP_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor for logging
sgpClient.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SGP] ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

sgpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[SGP] Error:', err.response?.data || err.message)
    throw err
  }
)

export async function getPlans(): Promise<SGPPlan[]> {
  const cacheKey = 'sgp_plans'
  const cached = cache.get<SGPPlan[]>(cacheKey)
  if (cached) return cached

  try {
    const { data } = await sgpClient.post('/plano/list', SGP_CREDENTIALS)

    const plans: SGPPlan[] = Array.isArray(data)
      ? data
      : data?.planos || data?.data || []

    cache.set(cacheKey, plans)
    return plans
  } catch (error) {
    console.error('[SGP] Failed to fetch plans:', error)
    // Return mock data in dev if SGP is unavailable
    if (process.env.NODE_ENV === 'development') {
      return getMockPlans()
    }
    throw new Error('Falha ao buscar planos. Tente novamente.')
  }
}

export async function getBillingDates(): Promise<SGPBillingDate[]> {
  const cacheKey = 'sgp_billing_dates'
  const cached = cache.get<SGPBillingDate[]>(cacheKey)
  if (cached) return cached

  try {
    const { data } = await sgpClient.post('/vencimento/list', SGP_CREDENTIALS)

    const dates: SGPBillingDate[] = Array.isArray(data)
      ? data
      : data?.vencimentos || data?.data || []

    cache.set(cacheKey, dates)
    return dates
  } catch (error) {
    console.error('[SGP] Failed to fetch billing dates:', error)
    if (process.env.NODE_ENV === 'development') {
      return getMockBillingDates()
    }
    throw new Error('Falha ao buscar datas de vencimento.')
  }
}

export function clearSGPCache(): void {
  cache.flushAll()
}

// --- Mock data for development ---
function getMockPlans(): SGPPlan[] {
  return [
    { id: '1', nome: 'Fibra 100 Mega', valor: 79.9, velocidade: '100 Mbps', tipo: 'fibra' },
    { id: '2', nome: 'Fibra 200 Mega', valor: 99.9, velocidade: '200 Mbps', tipo: 'fibra' },
    { id: '3', nome: 'Fibra 400 Mega', valor: 129.9, velocidade: '400 Mbps', tipo: 'fibra' },
    { id: '4', nome: 'Fibra 600 Mega', valor: 159.9, velocidade: '600 Mbps', tipo: 'fibra' },
    { id: '5', nome: 'Fibra 1 Giga', valor: 199.9, velocidade: '1 Gbps', tipo: 'fibra' },
  ]
}

function getMockBillingDates(): SGPBillingDate[] {
  return [5, 10, 15, 20, 25].map((dia) => ({
    dia,
    descricao: `Dia ${dia}`,
  }))
}
