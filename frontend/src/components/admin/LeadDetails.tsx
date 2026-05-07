'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lead, LeadStatus, STATUS_LABELS, STATUS_COLORS, Contract, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '@/types'
import { leadsApi, contractsApi } from '@/lib/api'
import {
  ArrowLeft, MapPin, Phone, Mail, Calendar, Wifi, FileText,
  DollarSign, User, Clock, CheckCircle, Loader2, Camera, Navigation,
  Pencil, Trash2, Copy, Check, FileSignature, Send, Eye, RefreshCw, CheckCircle2,
} from 'lucide-react'
import { formatDate, formatDateTime, formatCurrency, formatCPF, formatPhone } from '@/lib/utils'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import EditLeadModal from './EditLeadModal'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'NEW', label: 'Novo' },
  { value: 'CONTACTED', label: 'Contatado' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'INSTALLED', label: 'Instalado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

export default function LeadDetails({ leadId }: { leadId: string }) {
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [notes, setNotes] = useState('')
  const [newStatus, setNewStatus] = useState<LeadStatus | ''>('')
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copiedCoords, setCopiedCoords] = useState(false)
  const [contract, setContract] = useState<Contract | null>(null)
  const [contractLoading, setContractLoading] = useState(false)
  const [contractAction, setContractAction] = useState<string | null>(null)

  useEffect(() => {
    leadsApi.getById(leadId).then((data) => {
      setLead(data)
      setNewStatus(data.status)
      setLoading(false)
    })
    contractsApi.getByLeadId(leadId).then(setContract).catch(() => {})
  }, [leadId])

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:3001'

  const handleGenerateContract = async () => {
    if (!lead) return
    setContractLoading(true)
    try {
      const c = await contractsApi.generate(lead.id)
      setContract(c)
    } finally {
      setContractLoading(false)
    }
  }

  const handleDispatchContract = async () => {
    if (!contract) return
    setContractAction('dispatch')
    try {
      const c = await contractsApi.dispatch(contract.id)
      setContract(c)
    } finally {
      setContractAction(null)
    }
  }

  const handleUpdateStatus = async () => {
    if (!lead || !newStatus || newStatus === lead.status) return
    setUpdatingStatus(true)
    try {
      const updated = await leadsApi.updateStatus(lead.id, newStatus as LeadStatus, notes)
      setLead(updated)
      setNotes('')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!lead) return
    setDeleting(true)
    try {
      await leadsApi.delete(lead.id)
      router.push('/leads')
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleCopyCoords = () => {
    if (!lead?.latitude || !lead?.longitude) return
    navigator.clipboard.writeText(`${lead.latitude}, ${lead.longitude}`)
    setCopiedCoords(true)
    setTimeout(() => setCopiedCoords(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lead) {
    return <div className="p-6 text-red-500">Lead não encontrado.</div>
  }

  const PERIOD_LABELS: Record<string, string> = {
    MORNING: 'Manhã (08h-12h)',
    AFTERNOON: 'Tarde (12h-18h)',
    EVENING: 'Noite (18h-21h)',
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{lead.fullName}</h1>
          </div>
          <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full', STATUS_COLORS[lead.status])}>
            {STATUS_LABELS[lead.status]}
          </span>

          {/* Edit button */}
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 text-sm border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors text-gray-600"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>

          {/* Delete button */}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Confirmar exclusão?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors text-gray-600"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-sm border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          )}
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Personal */}
              <section className="bg-white rounded-xl border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm text-gray-900">Dados Pessoais</h2>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">CPF</dt>
                    <dd className="font-medium">{formatCPF(lead.cpf)}</dd>
                  </div>
                  {lead.rg && (
                    <div>
                      <dt className="text-xs text-muted-foreground">RG</dt>
                      <dd className="font-medium">{lead.rg}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Telefone
                    </dt>
                    <dd className="font-medium">
                      <a href={`tel:${lead.phone}`} className="hover:text-primary">
                        {formatPhone(lead.phone)}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> E-mail
                    </dt>
                    <dd className="font-medium truncate">
                      <a href={`mailto:${lead.email}`} className="hover:text-primary">
                        {lead.email}
                      </a>
                    </dd>
                  </div>
                  {lead.birthDate && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Nascimento</dt>
                      <dd className="font-medium">{formatDate(lead.birthDate)}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Address */}
              <section className="bg-white rounded-xl border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm text-gray-900">Endereço</h2>
                </div>
                <p className="text-sm text-gray-800 font-medium">
                  {lead.street}, {lead.number}
                  {lead.complement ? ` — ${lead.complement}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {lead.neighborhood}, {lead.city} — {lead.state} · CEP {lead.zipCode}
                </p>

                {/* Coordinates + copy */}
                {lead.latitude && lead.longitude && (
                  <div className="flex items-center gap-2 mt-3">
                    <Navigation className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono">
                      {lead.latitude.toFixed(6)}, {lead.longitude.toFixed(6)}
                    </span>
                    <button
                      onClick={handleCopyCoords}
                      className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto"
                      title="Copiar coordenadas"
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-green-600">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Map */}
                {lead.latitude && lead.longitude && (
                  <div className="mt-3 rounded-xl overflow-hidden border">
                    <MapView lat={lead.latitude} lng={lead.longitude} label={lead.fullName} />
                  </div>
                )}
              </section>

              {/* Photo */}
              {lead.housePhotoUrl && (
                <section className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm text-gray-900">Foto da Casa</h2>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lead.housePhotoUrl}
                    alt="Fachada"
                    className="w-full max-h-64 object-cover rounded-xl"
                  />
                </section>
              )}

              {/* Status history */}
              {lead.statusHistory && lead.statusHistory.length > 0 && (
                <section className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm text-gray-900">Histórico</h2>
                  </div>
                  <div className="space-y-3">
                    {lead.statusHistory.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800">
                            {h.fromStatus ? `${STATUS_LABELS[h.fromStatus]} → ` : ''}
                            {STATUS_LABELS[h.toStatus]}
                          </p>
                          {h.notes && <p className="text-xs text-muted-foreground">{h.notes}</p>}
                          <p className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Plan & Contract */}
              <section className="bg-white rounded-xl border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm text-gray-900">Plano & Contrato</h2>
                </div>
                <dl className="space-y-3 text-sm">
                  {lead.planName && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Plano</dt>
                      <dd className="font-semibold text-primary">{lead.planName}</dd>
                    </div>
                  )}
                  {lead.planPrice && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Mensalidade</dt>
                      <dd className="font-semibold">{formatCurrency(lead.planPrice)}/mês</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-muted-foreground">Contrato</dt>
                    <dd className="font-medium">
                      {lead.contractType === 'FIDELITY' ? '12 meses (fidelidade)' : 'Sem fidelidade'}
                    </dd>
                  </div>
                  {lead.billingDate && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Vencimento</dt>
                      <dd className="font-medium">Dia {lead.billingDate}</dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Contract */}
              <section className="bg-white rounded-xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm text-gray-900">Assinatura Digital</h2>
                  </div>
                  {contract && (
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', CONTRACT_STATUS_COLORS[contract.status])}>
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </span>
                  )}
                </div>

                {contract ? (
                  <div className="space-y-2">
                    {contract.signedAt && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Assinado em {new Date(contract.signedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(contract.docxFilename || contract.pdfFilename) && (
                        <a
                          href={`${API_URL}/api/contracts/${contract.id}/preview`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"
                        >
                          <Eye className="w-3.5 h-3.5" /> Visualizar
                        </a>
                      )}
                      {contract.signedPdfFilename && (
                        <a
                          href={`${API_URL}/contracts/${contract.signedPdfFilename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs border border-green-200 rounded-lg px-2.5 py-1.5 text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Comprovante
                        </a>
                      )}
                      {contract.status !== 'SIGNED' && (
                        <button
                          onClick={handleDispatchContract}
                          disabled={contractAction === 'dispatch'}
                          className="flex items-center gap-1.5 text-xs bg-green-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-green-700 disabled:opacity-40"
                        >
                          {contractAction === 'dispatch' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Disparar WhatsApp
                        </button>
                      )}
                      {contract.status !== 'SIGNED' && (
                        <button
                          onClick={handleGenerateContract}
                          disabled={contractLoading}
                          className="flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          {contractLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Regenerar
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 mb-3">Nenhum contrato gerado ainda</p>
                    <button
                      onClick={handleGenerateContract}
                      disabled={contractLoading}
                      className="w-full flex items-center justify-center gap-2 text-sm bg-primary text-white rounded-lg py-2 hover:bg-primary/90 disabled:opacity-40"
                    >
                      {contractLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
                      Gerar Contrato
                    </button>
                  </div>
                )}
              </section>

              {/* Pricing */}
              {(lead.adhesionFee != null || lead.distanceFee != null) && (
                <section className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm text-gray-900">Taxas</h2>
                  </div>
                  <dl className="space-y-2 text-sm">
                    {lead.adhesionFee != null && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Adesão</dt>
                        <dd className="font-medium">{formatCurrency(lead.adhesionFee)}</dd>
                      </div>
                    )}
                    {lead.distanceFee != null && lead.distanceFee > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Distância</dt>
                        <dd className="font-medium">{formatCurrency(lead.distanceFee)}</dd>
                      </div>
                    )}
                    {lead.totalSetup != null && (
                      <div className="flex justify-between border-t pt-2">
                        <dt className="font-semibold">Total instalação</dt>
                        <dd className="font-bold text-primary">{formatCurrency(lead.totalSetup)}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* Schedule */}
              {lead.scheduledDate && (
                <section className="bg-white rounded-xl border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm text-gray-900">Agendamento</h2>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Data</dt>
                      <dd className="font-semibold">{formatDate(lead.scheduledDate)}</dd>
                    </div>
                    {lead.schedulePeriod && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Período</dt>
                        <dd className="font-medium">{PERIOD_LABELS[lead.schedulePeriod]}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* WiFi */}
              {lead.wifiName && (
                <section className="bg-gray-900 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi className="w-4 h-4 text-secondary-400" />
                    <h2 className="font-semibold text-sm">Wi-Fi</h2>
                  </div>
                  <p className="font-mono text-sm font-bold">{lead.wifiName}</p>
                  {lead.wifiPassword && (
                    <p className="font-mono text-xs text-gray-400 mt-1">🔒 {lead.wifiPassword}</p>
                  )}
                </section>
              )}

              {/* Update status */}
              <section className="bg-white rounded-xl border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold text-sm text-gray-900">Atualizar Status</h2>
                </div>
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações (opcional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus || newStatus === lead.status}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40"
                  >
                    {updatingStatus && <Loader2 className="w-4 h-4 animate-spin" />}
                    Salvar alteração
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditLeadModal
          lead={lead}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setLead({ ...updated, statusHistory: lead.statusHistory })
            setShowEdit(false)
          }}
        />
      )}
    </>
  )
}
