import axios from 'axios'
import { Lead, Plan, BillingDate, SGPPop, PricingResult, KanbanColumn, LeadStatus, FollowUp, FollowUpStats, FollowUpStatus, Contract, ContractStatus } from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cf_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error || err.message || 'Erro de conexão com o servidor'
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('cf_token')
      localStorage.removeItem('cf_user')
      document.cookie = 'cf_token=; path=/; max-age=0'
      window.location.href = '/login'
    }
    return Promise.reject(new Error(message))
  }
)

// --- Auth ---
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data.data as { token: string; user: { id: string; name: string; email: string; role: string } }
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data.data
  },
  logout: async () => {
    await api.post('/auth/logout')
  },
}

// --- Users ---
export const usersApi = {
  list: async () => {
    const { data } = await api.get('/users')
    return data.data as AdminUser[]
  },
  create: async (payload: { name: string; email: string; password: string; role: string }) => {
    const { data } = await api.post('/users', payload)
    return data.data as AdminUser
  },
  update: async (id: string, payload: Partial<AdminUser & { password?: string }>) => {
    const { data } = await api.patch(`/users/${id}`, payload)
    return data.data as AdminUser
  },
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'SUPERVISOR' | 'COMERCIAL'
  isActive: boolean
  lastLogin?: string
  createdAt: string
  createdBy?: string
}

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

  update: async (id: string, data: Partial<Lead>) => {
    const { data: res } = await api.patch(`/leads/${id}`, data)
    return res.data as Lead
  },

  delete: async (id: string) => {
    await api.delete(`/leads/${id}`)
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

  getDashboardStats: async () => {
    const { data: res } = await api.get('/leads/dashboard-stats')
    return res.data as DashboardStats
  },
}

export interface DashboardStats {
  kpis: {
    totalLeads: number
    newThisMonth: number
    installedThisMonth: number
    scheduled: number
    conversionRate: number
  }
  byStatus: Record<string, number>
  upcomingInstalls: {
    id: string
    fullName: string
    phone: string
    neighborhood: string
    scheduledDate: string
    schedulePeriod: string
    planName: string
  }[]
  byNeighborhood: { name: string; total: number }[]
  byContractType: { type: string; total: number }[]
  recentLeads: {
    id: string
    fullName: string
    neighborhood: string
    planName: string
    status: string
    createdAt: string
    contractType: string
  }[]
}

// --- Follow-ups ---
export const followUpsApi = {
  list: async (params?: { status?: FollowUpStatus; type?: string; leadId?: string; page?: number; limit?: number }) => {
    const { data: res } = await api.get('/follow-ups', { params })
    return res as { data: FollowUp[]; meta: { total: number; page: number; limit: number; pages: number } }
  },

  getStats: async () => {
    const { data: res } = await api.get('/follow-ups/stats')
    return res.data as FollowUpStats
  },

  updateStatus: async (id: string, status: FollowUpStatus, responseNote?: string) => {
    const { data: res } = await api.patch(`/follow-ups/${id}/status`, { status, responseNote })
    return res.data as FollowUp
  },

  triggerManual: async () => {
    const { data: res } = await api.post('/follow-ups/trigger')
    return res
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

  getPops: async () => {
    const { data: res } = await api.get('/plans/pops')
    return res.data as SGPPop[]
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

// --- Contracts ---
export const contractsApi = {
  generate: async (leadId: string) => {
    const { data: res } = await api.post(`/contracts/generate/${leadId}`)
    return res.data as Contract
  },

  list: async (params?: { status?: ContractStatus; page?: number; limit?: number }) => {
    const { data: res } = await api.get('/contracts', { params })
    return res as { data: Contract[]; meta: { total: number; page: number; limit: number; pages: number } }
  },

  getById: async (id: string) => {
    const { data: res } = await api.get(`/contracts/${id}`)
    return res.data as Contract
  },

  getByLeadId: async (leadId: string) => {
    const { data: res } = await api.get(`/contracts/lead/${leadId}`)
    return res.data as Contract
  },

  dispatch: async (id: string) => {
    const { data: res } = await api.post(`/contracts/${id}/dispatch`)
    return res.data as Contract
  },

  remove: async (id: string) => {
    await api.delete(`/contracts/${id}`)
  },

  // Public (no auth)
  getPublicInfo: async (token: string) => {
    const { data: res } = await api.get(`/contracts/public/${token}`)
    return res.data as {
      contractId: string
      status: ContractStatus
      tokenExpiresAt: string
      pdfUrl: string | null
      lead: { fullName: string; cpf: string; planName?: string; planPrice?: number; planSpeed?: string; neighborhood: string; city: string; state: string }
    }
  },

  getTemplateInfo: async () => {
    const { data: res } = await api.get('/contracts/template/info')
    return res.data as { exists: boolean; size?: number; updatedAt?: string }
  },

  uploadTemplate: async (file: File) => {
    const form = new FormData()
    form.append('template', file)
    const { data: res } = await api.post('/contracts/template/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data as { uploaded: boolean; filename: string; size: number }
  },

  submitSignature: async (token: string, selfie: File, documentPhoto: File) => {
    const form = new FormData()
    form.append('selfie', selfie)
    form.append('documentPhoto', documentPhoto)
    const { data: res } = await api.post(`/contracts/sign/${token}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data as { message: string; signedAt: string }
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
