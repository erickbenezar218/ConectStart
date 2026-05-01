'use client'

import { useEffect, useState, useCallback } from 'react'
import { followUpsApi } from '@/lib/api'
import {
  FollowUp, FollowUpStatus, FollowUpType,
  FOLLOWUP_TYPE_LABELS, FOLLOWUP_TYPE_COLORS,
  FOLLOWUP_STATUS_LABELS, FOLLOWUP_STATUS_COLORS,
} from '@/types'
import { formatPhone } from '@/lib/utils'
import {
  MessageCircle, Clock, CheckCircle, XCircle, SkipForward,
  RefreshCw, Loader2, ChevronLeft, ChevronRight, Zap,
  Phone, Calendar, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STATUS_TABS: { value: FollowUpStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'SENT', label: 'Enviados' },
  { value: 'COMPLETED', label: 'Concluídos' },
  { value: 'FAILED', label: 'Falharam' },
]

const TYPE_LABELS_SHORT: Record<FollowUpType, string> = {
  D1_CHECK: 'D+1',
  D7_FEEDBACK: 'D+7',
  D30_UPGRADE: 'D+30',
}

const TYPE_DESCRIPTIONS: Record<FollowUpType, string> = {
  D1_CHECK: 'Verificar se está tudo ok',
  D7_FEEDBACK: 'Solicitar avaliação do serviço',
  D30_UPGRADE: 'Oferecer upgrade de plano',
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function PosVendaPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [stats, setStats] = useState({ pendingTotal: 0, dueToday: 0, sentThisWeek: 0, completed: 0, failed: 0 })
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FollowUpStatus | ''>('')
  const [page, setPage] = useState(1)
  const [triggering, setTriggering] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        followUpsApi.list({ status: activeTab || undefined, page, limit: 20 }),
        followUpsApi.getStats(),
      ])
      setFollowUps(listRes.data)
      setMeta(listRes.meta)
      setStats(statsRes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleTabChange = (tab: FollowUpStatus | '') => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleUpdateStatus = async (id: string, status: FollowUpStatus, responseNote?: string) => {
    setUpdatingId(id)
    try {
      await followUpsApi.updateStatus(id, status, responseNote)
      fetchData()
    } finally {
      setUpdatingId(null)
    }
  }

  const handleTrigger = async () => {
    setTriggering(true)
    try {
      await followUpsApi.triggerManual()
      setTimeout(() => { fetchData(); setTriggering(false) }, 1500)
    } catch {
      setTriggering(false)
    }
  }

  const isOverdue = (scheduledFor: string) => new Date(scheduledFor) < new Date()

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pós-Venda</h1>
          <p className="text-sm text-gray-500">Follow-up automático de clientes instalados via WhatsApp</p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="flex items-center gap-2 text-sm bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Processar Agora
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Atrasados / Hoje" value={stats.dueToday} icon={AlertCircle} color="bg-red-100 text-red-600" />
        <StatCard label="Total pendentes" value={stats.pendingTotal} icon={Clock} color="bg-orange-100 text-orange-600" />
        <StatCard label="Enviados (7 dias)" value={stats.sentThisWeek} icon={MessageCircle} color="bg-blue-100 text-blue-600" />
        <StatCard label="Concluídos" value={stats.completed} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Falharam" value={stats.failed} icon={XCircle} color="bg-red-100 text-red-600" />
      </div>

      {/* Webhook info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm">
        <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-800">Integração via Webhook → n8n → EvolutionAPI</p>
          <p className="text-blue-600 mt-0.5">
            Configure <code className="bg-blue-100 px-1 rounded font-mono text-xs">FOLLOWUP_WEBHOOK_URL</code> no backend com a URL do seu webhook no n8n.
            O payload inclui <code className="bg-blue-100 px-1 rounded font-mono text-xs">followUpId</code>, dados do cliente, a mensagem pronta e a URL de callback.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value as FollowUpStatus | '')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : followUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhum follow-up encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agendado para</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enviado em</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {followUps.map((fu) => {
                  const overdue = fu.status === 'PENDING' && isOverdue(fu.scheduledFor)
                  return (
                    <tr key={fu.id} className={cn('hover:bg-gray-50 transition-colors', overdue && 'bg-red-50/40')}>
                      <td className="px-4 py-3">
                        <Link href={`/leads/${fu.leadId}`} className="font-semibold text-gray-900 hover:text-primary leading-tight block">
                          {fu.lead?.fullName || '—'}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {fu.lead?.phone ? formatPhone(fu.lead.phone) : '—'}
                          {fu.lead?.planName && <span className="text-gray-300">·</span>}
                          {fu.lead?.planName && <span className="text-green-600">{fu.lead.planName}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', FOLLOWUP_TYPE_COLORS[fu.type])}>
                          {TYPE_LABELS_SHORT[fu.type]}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{TYPE_DESCRIPTIONS[fu.type]}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-600 font-semibold' : 'text-gray-600')}>
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {new Date(fu.scheduledFor).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {overdue && <span className="ml-1 text-red-500">● atrasado</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', FOLLOWUP_STATUS_COLORS[fu.status])}>
                          {FOLLOWUP_STATUS_LABELS[fu.status]}
                        </span>
                        {fu.retryCount > 0 && (
                          <p className="text-xs text-red-400 mt-0.5">{fu.retryCount} tentativa(s)</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {fu.sentAt
                          ? new Date(fu.sentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {updatingId === fu.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <div className="flex items-center gap-2">
                            {(fu.status === 'SENT' || fu.status === 'PENDING') && (
                              <button
                                onClick={() => handleUpdateStatus(fu.id, 'COMPLETED')}
                                className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                                title="Marcar como concluído"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Concluir
                              </button>
                            )}
                            {fu.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(fu.id, 'SKIPPED')}
                                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 hover:underline"
                                title="Pular este follow-up"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                                Pular
                              </button>
                            )}
                            {fu.status === 'FAILED' && (
                              <button
                                onClick={() => handleUpdateStatus(fu.id, 'PENDING')}
                                className="inline-flex items-center gap-1 text-xs text-orange-500 hover:underline"
                                title="Tentar novamente"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Retentar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, meta.pages))}
                disabled={page === meta.pages}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
