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
  referencePoint?: string

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

export interface SGPPop {
  id: number
  nome: string
  original: string
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
  referencePoint: string

  // Step 3 - Photo & Location
  housePhotoUrl: string
  latitude: number | null
  longitude: number | null

  // Step 4 - Plan
  planId: string
  planName: string
  planPrice: number | null      // valor que será cobrado (com ou sem desconto)
  planBasePrice: number | null  // valor original do plano (sem desconto algum)
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

  // Terms
  termsAccepted: boolean
}

// --- Follow-up ---

export type FollowUpType = 'D1_CHECK' | 'D7_FEEDBACK' | 'D30_UPGRADE'
export type FollowUpStatus = 'PENDING' | 'SENT' | 'FAILED' | 'COMPLETED' | 'SKIPPED'

export interface FollowUp {
  id: string
  leadId: string
  lead?: {
    id: string
    fullName: string
    phone: string
    planName?: string
    neighborhood: string
    installedAt?: string
  }
  type: FollowUpType
  scheduledFor: string
  sentAt?: string
  status: FollowUpStatus
  responseNote?: string
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface FollowUpStats {
  pendingTotal: number
  dueToday: number
  sentThisWeek: number
  completed: number
  failed: number
}

export const FOLLOWUP_TYPE_LABELS: Record<FollowUpType, string> = {
  D1_CHECK: 'D+1 Verificação',
  D7_FEEDBACK: 'D+7 Feedback',
  D30_UPGRADE: 'D+30 Upgrade',
}

export const FOLLOWUP_TYPE_COLORS: Record<FollowUpType, string> = {
  D1_CHECK: 'bg-blue-100 text-blue-700',
  D7_FEEDBACK: 'bg-yellow-100 text-yellow-700',
  D30_UPGRADE: 'bg-purple-100 text-purple-700',
}

export const FOLLOWUP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviado',
  FAILED: 'Falhou',
  COMPLETED: 'Concluído',
  SKIPPED: 'Pulado',
}

export const FOLLOWUP_STATUS_COLORS: Record<FollowUpStatus, string> = {
  PENDING: 'bg-orange-100 text-orange-700',
  SENT: 'bg-blue-100 text-blue-700',
  FAILED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-green-100 text-green-700',
  SKIPPED: 'bg-gray-100 text-gray-500',
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
