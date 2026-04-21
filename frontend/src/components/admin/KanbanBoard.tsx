'use client'

import { useEffect, useState, useCallback } from 'react'
import { KanbanColumn, LeadStatus, LeadSummary } from '@/types'
import { leadsApi } from '@/lib/api'
import LeadCard from './LeadCard'
import { Loader2, RefreshCw, Users, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const COLUMN_COLORS: Record<LeadStatus, string> = {
  NEW: 'border-t-blue-500',
  CONTACTED: 'border-t-yellow-500',
  SCHEDULED: 'border-t-purple-500',
  INSTALLED: 'border-t-green-500',
  CANCELLED: 'border-t-red-500',
}

const COLUMN_BADGES: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  SCHEDULED: 'bg-purple-100 text-purple-700',
  INSTALLED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(null)

  const load = useCallback(async () => {
    try {
      const [kanban, statsData] = await Promise.all([
        leadsApi.getKanban(),
        leadsApi.getStats(),
      ])
      setColumns(kanban)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load kanban:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await leadsApi.updateStatus(leadId, newStatus)
      await load()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalInstalled = stats?.byStatus?.INSTALLED ?? 0
  const totalNew = stats?.byStatus?.NEW ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-6 px-6 py-4 bg-white border-b overflow-x-auto">
          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">Instalados:</span>
            <span className="font-bold text-green-700">{totalInstalled}</span>
          </div>
          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Novos:</span>
            <span className="font-bold text-blue-700">{totalNew}</span>
          </div>
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-900 flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {columns.map((col) => (
            <div
              key={col.status}
              className={`w-72 flex flex-col bg-white rounded-xl border-t-4 shadow-sm ${COLUMN_COLORS[col.status]}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm text-gray-900">{col.label}</h3>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${COLUMN_BADGES[col.status]}`}
                >
                  {col.count}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-280px)]">
                {col.leads.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-8">
                    Nenhum lead
                  </p>
                ) : (
                  col.leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
