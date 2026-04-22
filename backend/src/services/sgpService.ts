import axios, { AxiosInstance } from 'axios'
import NodeCache from 'node-cache'
import { SGPPlan, SGPBillingDate } from '../types'

const cache = new NodeCache({ stdTTL: 300 }) // 5-minute cache

const SGP_BASE_URL = process.env.SGP_BASE_URL || 'https://sgp.conectstelecom.com.br/api/precadastro'
const SGP_BASE_ROOT = 'https://sgp.conectstelecom.com.br'
const SGP_CREDENTIALS = {
  app: process.env.SGP_APP || 'appprecadastro',
  token: process.env.SGP_TOKEN || '',
}

const sgpClient: AxiosInstance = axios.create({
  baseURL: SGP_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

const sgpRootClient: AxiosInstance = axios.create({
  baseURL: SGP_BASE_ROOT,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

for (const client of [sgpClient, sgpRootClient]) {
  client.interceptors.request.use((config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SGP] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    }
    return config
  })
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      console.error('[SGP] Error:', err.response?.data || err.message)
      throw err
    }
  )
}

// Only these plan IDs are shown in the public form
const ALLOWED_PLAN_IDS = new Set([128, 145, 130, 154, 141])

// ---- Plans ----
export async function getPlans(): Promise<SGPPlan[]> {
  const cacheKey = 'sgp_plans'
  const cached = cache.get<SGPPlan[]>(cacheKey)
  if (cached) return cached

  try {
    const { data } = await sgpClient.post('/plano/list', SGP_CREDENTIALS)

    const raw: { id: number; descricao: string; valor: number; tipo: string }[] =
      Array.isArray(data) ? data : data?.planos || data?.data || []

    const plans: SGPPlan[] = raw
      .filter((p) => p.tipo === 'internet' && ALLOWED_PLAN_IDS.has(p.id))
      .sort((a, b) => a.valor - b.valor)
      .map((p) => ({
        id: String(p.id),
        nome: p.descricao,
        valor: p.valor,
        velocidade: extractSpeed(p.descricao),
        tipo: p.tipo,
      }))

    cache.set(cacheKey, plans)
    return plans
  } catch (error) {
    console.error('[SGP] Failed to fetch plans:', error)
    if (process.env.NODE_ENV === 'development') return getMockPlans()
    throw new Error('Falha ao buscar planos. Tente novamente.')
  }
}

// ---- Billing Dates ----
export async function getBillingDates(): Promise<SGPBillingDate[]> {
  const cacheKey = 'sgp_billing_dates'
  const cached = cache.get<SGPBillingDate[]>(cacheKey)
  if (cached) return cached

  try {
    const { data } = await sgpClient.post('/vencimento/list', SGP_CREDENTIALS)
    const raw: { id: number; dia: number }[] = Array.isArray(data)
      ? data
      : data?.vencimentos || data?.data || []

    const ALLOWED_DAYS = new Set([5, 10, 15, 20, 25])
    const dates: SGPBillingDate[] = raw
      .filter((d) => ALLOWED_DAYS.has(d.dia))
      .sort((a, b) => a.dia - b.dia)
      .map((d) => ({ ...d, descricao: `Dia ${d.dia}` }))

    cache.set(cacheKey, dates)
    return dates
  } catch (error) {
    console.error('[SGP] Failed to fetch billing dates:', error)
    if (process.env.NODE_ENV === 'development') return getMockBillingDates()
    throw new Error('Falha ao buscar datas de vencimento.')
  }
}

// ---- POPs ----
export interface SGPPop {
  id: number
  nome: string     // clean display name
  original: string // raw name from API
}

// IDs to exclude from the public dropdown
const EXCLUDED_POP_IDS = new Set([33, 17, 28, 35, 44, 45])

// Name patterns (on the raw string) that should always be hidden
const EXCLUDED_POP_PATTERNS = [
  'CORPORATIVO',
  'REDE NEUTRA',
  'REDE HRC',
  'PERMUTA',
  'CSS',
]

function isExcludedPop(id: number, raw: string): boolean {
  if (EXCLUDED_POP_IDS.has(id)) return true
  const upper = raw.toUpperCase()
  return EXCLUDED_POP_PATTERNS.some((p) => upper.includes(p))
}

export async function getPops(): Promise<SGPPop[]> {
  const cacheKey = 'sgp_pops'
  const cached = cache.get<SGPPop[]>(cacheKey)
  if (cached) return cached

  try {
    const { data } = await sgpRootClient.post('/api/ura/pops/', SGP_CREDENTIALS)
    const raw: { id: number; pop: string }[] =
      Array.isArray(data) ? data : data?.pops || data?.data || []

    const pops: SGPPop[] = raw
      .filter((p) => !isExcludedPop(p.id, p.pop))
      .map((p) => ({ id: p.id, nome: cleanPopName(p.pop), original: p.pop }))
      .filter((p) => p.nome.length > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

    cache.set(cacheKey, pops)
    return pops
  } catch (error) {
    console.error('[SGP] Failed to fetch POPs:', error)
    if (process.env.NODE_ENV === 'development') return getMockPops()
    throw new Error('Falha ao buscar bairros atendidos.')
  }
}

export function clearSGPCache(): void {
  cache.flushAll()
}

// ---- Helpers ----

function cleanPopName(pop: string): string {
  let name = pop
  // Remove city/region prefix: "IRANDUBA/", "MANAUS/", etc.
  name = name.replace(/^[^/]+\//, '')
  // Remove "COMUNIDADE " prefix
  name = name.replace(/^COMUNIDADE\s+/i, '')
  // Normalize "CONDOMINIO" → "COND"
  name = name.replace(/^CONDOMINIO\s+/i, 'COND ')
  // Remove "POP " prefix
  name = name.replace(/^POP\s+/i, '')
  // Remove "-AM" suffix
  name = name.replace(/-AM$/i, '')
  // Collapse extra spaces
  return name.trim().replace(/\s+/g, ' ')
}

function extractSpeed(descricao: string): string {
  const match = descricao.match(/(\d+)\s*[Mm]bps/i) || descricao.match(/(\d+)\s*GB/i)
  if (match) return `${match[1]} Mbps`
  return ''
}

// --- Mock data for development ---
function getMockPlans(): SGPPlan[] {
  return [
    { id: '1', nome: 'Fibra 100 Mega', valor: 79.9, velocidade: '100 Mbps', tipo: 'fibra' },
    { id: '2', nome: 'Fibra 200 Mega', valor: 99.9, velocidade: '200 Mbps', tipo: 'fibra' },
    { id: '3', nome: 'Fibra 400 Mega', valor: 129.9, velocidade: '400 Mbps', tipo: 'fibra' },
    { id: '4', nome: 'Fibra 1 Giga', valor: 199.9, velocidade: '1 Gbps', tipo: 'fibra' },
  ]
}

function getMockBillingDates(): SGPBillingDate[] {
  return [5, 10, 15, 20, 25].map((dia) => ({ dia, descricao: `Dia ${dia}` }))
}

function getMockPops(): SGPPop[] {
  return [
    { id: 1, nome: 'CENTRO', original: 'CENTRO-AM' },
    { id: 2, nome: 'COND BELA VISTA', original: 'IRANDUBA/CONDOMINIO BELA VISTA-AM' },
    { id: 3, nome: 'FÉ EM DEUS', original: 'IRANDUBA/COMUNIDADE FÉ EM DEUS-AM' },
    { id: 4, nome: 'MAIAPOLIS', original: 'MANAUS/MAIAPOLIS-AM' },
  ]
}
