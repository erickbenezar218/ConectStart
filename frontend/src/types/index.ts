export type LeadStatus = 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'INSTALLED' | 'CANCELLED'
export type ContractType = 'FIDELITY' | 'NO_FIDELITY'
export type SchedulePeriod = 'MORNING' | 'AFTERNOON' | 'EVENING'

export interface Lead {
  id: string
  createdAt: string
  updatedAt: string

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
  installerNotes?: string

  // WiFi
  wifiName?: string
  wifiPassword?: string

  // Pricing
  adhesionFee?: number
  distanceFee?: number
  distance?: number
  totalSetup?: number

  // Status
  status: LeadStatus
  notes?: string
  priority: number

  // Timestamps
  contactedAt?: string
  scheduledAt?: string
  installedAt?: string
  cancelledAt?: string

  // Audit
  assignedTo?: string
  source?: string

  statusHistory?: StatusHistoryEntry[]
}

export interface StatusHistoryEntry {
  id: string
  fromStatus?: LeadStatus
  toStatus: LeadStatus
  notes?: string
  changedBy?: string
  createdAt: string
}

export interface Plan {
  id: string
  nome: string
  valor: number
  velocidade: string
  descricao?: string
  tipo?: string
}

export interface BillingDate {
  dia: number
  descricao: string
}

export interface PricingResult {
  adhesionFee: number
  distanceFee: number
  totalSetup: number
  breakdown: { label: string; value: number }[]
  isSpecialNeighborhood: boolean
  notes?: string
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
  planPrice?: number
  status: LeadStatus
  priority: number
  createdAt: string
  scheduledDate?: string
  housePhotoUrl?: string
  contractType: ContractType
  totalSetup?: number
}

// Multi-step form state
export interface FormData {
  // Step 1 - Personal
  fullName: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  rg: string

  // Step 2 - Address
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string

  // Step 3 - Photo & Location
  housePhotoUrl: string
  latitude: number | null
  longitude: number | null

  // Step 4 - Plan
  planId: string
  planName: string
  planPrice: number | null
  planSpeed: string
  billingDate: number | null

  // Step 5 - Contract
  contractType: ContractType | ''

  // Step 6 - Schedule
  scheduledDate: string
  schedulePeriod: SchedulePeriod | ''

  // Step 7 - WiFi
  wifiName: string
  wifiPassword: string

  // Pricing
  distance: number | null
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contatado',
  SCHEDULED: 'Agendado',
  INSTALLED: 'Instalado',
  CANCELLED: 'Cancelado',
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  INSTALLED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}
