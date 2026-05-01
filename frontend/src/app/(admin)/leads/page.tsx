'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { leadsApi } from '@/lib/api'
import { Lead, LeadStatus, STATUS_LABELS, STATUS_COLORS } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  Search, Download, ChevronLeft, ChevronRight,
  Users, Loader2, Eye, X, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES: { value: LeadStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'NEW', label: 'Novo' },
  { value: 'CONTACTED', label: 'Contatado' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'INSTALLED', label: 'Instalado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const CONTRACT_LABELS: Record<string, string> = {
  FIDELITY: '12 meses',
  NO_FIDELITY: 'Sem fidelidade',
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

function maskCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.***.***.${d.slice(-2)}`
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Partial<Lead>[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<LeadStatus | ''>('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await leadsApi.list({
        search: search || undefined,
        status: status || undefined,
        page,
        limit: 20,
      })
      setLeads(res.data)
      setMeta(res.meta)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleStatusChange = (val: LeadStatus | '') => {
    setStatus(val)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await leadsApi.delete(id)
      setDeleteId(null)
      fetchLeads()
    } finally {
      setDeleting(false)
    }
  }

  const exportCSV = () => {
    if (!leads.length) return
    const headers = ['Nome', 'CPF', 'Telefone', 'Bairro', 'Plano', 'Mensalidade', 'Contrato', 'Status', 'Cadastrado em']
    const rows = leads.map((l) => [
      l.fullName,
      l.cpf,
      l.phone,
      l.neighborhood,
      l.planName || '',
      l.planPrice ? formatCurrency(l.planPrice) : '',
      CONTRACT_LABELS[l.contractType as string] || l.contractType,
      STATUS_LABELS[l.status as LeadStatus] || l.status,
      l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">{meta.total} cadastros no total</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={loading || leads.length === 0}
          className="flex items-center gap-2 text-sm border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nome, CPF ou telefone..."
              className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearch('') }} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as LeadStatus | '')}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white text-gray-700 sm:w-48"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Users className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CPF</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bairro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contrato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cadastro</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 leading-tight">{lead.fullName}</p>
                      <p className="text-xs text-gray-400">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{maskCpf(lead.cpf || '')}</td>
                    <td className="px-4 py-3 text-gray-600">{formatPhone(lead.phone || '')}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.neighborhood}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 font-medium">{lead.planName || '—'}</p>
                      {lead.planPrice && (
                        <p className="text-xs text-green-600 font-medium">{formatCurrency(lead.planPrice)}/mês</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{CONTRACT_LABELS[lead.contractType as string] || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_COLORS[lead.status as LeadStatus]
                      )}>
                        {STATUS_LABELS[lead.status as LeadStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </Link>
                        {deleteId === lead.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(lead.id!)}
                              disabled={deleting}
                              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                            >
                              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(lead.id!)}
                            className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:underline"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(meta.pages, 7) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-8 h-8 text-xs rounded border transition-colors',
                      p === page
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, meta.pages))}
                disabled={page === meta.pages}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
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
