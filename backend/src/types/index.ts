import { LeadStatus, ContractType, SchedulePeriod } from '@prisma/client'

export { LeadStatus, ContractType, SchedulePeriod }

export interface CreateLeadDTO {
  // Personal
  fullName: string
  cpf: string
  email: string
  phone: string
  birthDate?: string
  rg?: string

  // Address
  zipCode: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string

  // Location
  latitude?: number
  longitude?: number
  housePhotoUrl?: string

  // Plan
  planId?: string
  planName?: string
  planPrice?: number
  planSpeed?: string

  // Contract
  contractType: ContractType
  billingDate?: number

  // Schedule
  scheduledDate?: string
  schedulePeriod?: SchedulePeriod

  // WiFi
  wifiName?: string
  wifiPassword?: string

  // Pricing (calculated server-side)
  distance?: number
  source?: string
}

export interface UpdateLeadStatusDTO {
  status: LeadStatus
  notes?: string
  changedBy?: string
}

export interface PricingCalculationRequest {
  neighborhood: string
  distance?: number
  contractType?: ContractType
}

export interface PricingCalculationResult {
  adhesionFee: number
  distanceFee: number
  totalSetup: number
  breakdown: {
    label: string
    value: number
  }[]
  isSpecialNeighborhood: boolean
  notes?: string
}

export interface SGPPlan {
  id: string
  nome: string
  valor: number
  velocidade: string
  descricao?: string
  tipo?: string
}

export interface SGPBillingDate {
  dia: number
  descricao: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

export interface KanbanColumn {
  status: LeadStatus
  label: string
  leads: LeadSummary[]
  count: number
}

export interface LeadSummary {
  id: string
  fullName: string
  neighborhood: string
  phone: string
  planName?: string
  status: LeadStatus
  priority: number
  createdAt: string
  scheduledDate?: string
  housePhotoUrl?: string
}
