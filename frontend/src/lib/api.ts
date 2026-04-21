import axios from 'axios'
import { Lead, Plan, BillingDate, PricingResult, KanbanColumn, LeadStatus } from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error || err.message || 'Erro de conexão com o servidor'
    return Promise.reject(new Error(message))
  }
)

// --- Leads ---
export const leadsApi = {
  create: async (data: Partial<Lead>) => {
    const { data: res } = await api.post('/leads', data)
    return res.data as Lead
  },

  list: async (params?: {
    status?: LeadStatus
    neighborhood?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    const { data: res } = await api.get('/leads', { params })
    return res as {
      data: Lead[]
      meta: { total: number; page: number; limit: number; pages: number }
    }
  },

  getById: async (id: string) => {
    const { data: res } = await api.get(`/leads/${id}`)
    return res.data as Lead
  },

  updateStatus: async (id: string, status: LeadStatus, notes?: string) => {
    const { data: res } = await api.patch(`/leads/${id}/status`, { status, notes })
    return res.data as Lead
  },

  getKanban: async () => {
    const { data: res } = await api.get('/leads/kanban')
    return res.data as KanbanColumn[]
  },

  getStats: async () => {
    const { data: res } = await api.get('/leads/stats')
    return res.data as {
      total: number
      byStatus: Record<LeadStatus, number>
      recentLeads: Partial<Lead>[]
    }
  },
}

// --- Plans ---
export const plansApi = {
  list: async () => {
    const { data: res } = await api.get('/plans')
    return res.data as Plan[]
  },

  getBillingDates: async () => {
    const { data: res } = await api.get('/plans/billing-dates')
    return res.data as BillingDate[]
  },
}

// --- Pricing ---
export const pricingApi = {
  calculate: async (params: {
    neighborhood: string
    distance?: number
    contractType?: string
  }) => {
    const { data: res } = await api.post('/pricing/calculate', params)
    return res.data as PricingResult
  },
}

// --- Uploads ---
export const uploadsApi = {
  uploadPhoto: async (file: File): Promise<{ filename: string; url: string }> => {
    const formData = new FormData()
    formData.append('photo', file)
    const { data: res } = await api.post('/uploads/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}

export default api
