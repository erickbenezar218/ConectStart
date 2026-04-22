'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { leadsApi, DashboardStats } from '@/lib/api'
import { STATUS_LABELS, STATUS_COLORS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, TrendingUp, CalendarCheck, Zap, ArrowUpRight,
  Clock, MapPin, Loader2, RefreshCw,
} from 'lucide-react'

const STATUS_CHART_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#f59e0b',
  SCHEDULED: '#8b5cf6',
  INSTALLED: '#10b981',
  CANCELLED: '#ef4444',
}

const PERIOD_LABELS: Record<string, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  EVENING: 'Noite',
}

function KPICard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  href?: string
}) {
  const content = (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const data = await leadsApi.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-gray-500">
        Erro ao carregar dados. <button onClick={() => load()} className="text-primary underline">Tentar novamente</button>
      </div>
    )
  }

  const { kpis, byStatus, upcomingInstalls, byNeighborhood, byContractType, recentLeads } = stats

  const statusChartData = Object.entries(byStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
    total: count,
    fill: STATUS_CHART_COLORS[status] || '#94a3b8',
  }))

  const contractData = byContractType.map((c) => ({
    name: c.type === 'FIDELITY' ? 'Com Fidelidade' : 'Sem Fidelidade',
    value: c.total,
  }))
  const PIE_COLORS = ['#3b82f6', '#f59e0b']

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral das operações</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Total de Leads"
          value={kpis.totalLeads}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          href="/leads"
        />
        <KPICard
          label="Novos este mês"
          value={kpis.newThisMonth}
          icon={ArrowUpRight}
          color="bg-green-50 text-green-600"
        />
        <KPICard
          label="Agendamentos"
          value={kpis.scheduled}
          sub="aguardando instalação"
          icon={CalendarCheck}
          color="bg-purple-50 text-purple-600"
          href="/kanban"
        />
        <KPICard
          label="Instalados (mês)"
          value={kpis.installedThisMonth}
          sub={`${kpis.conversionRate}% de conversão`}
          icon={Zap}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Status bar chart */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Leads por Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusChartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {statusChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contract type pie */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Tipo de Contrato</h3>
          {contractData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={contractData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {contractData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming installs */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Próximas Instalações</h3>
            <Link href="/kanban" className="text-xs text-primary hover:underline">Ver pipeline</Link>
          </div>
          {upcomingInstalls.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Nenhuma instalação agendada para os próximos 7 dias</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingInstalls.map((inst) => (
                <Link
                  key={inst.id}
                  href={`/leads/${inst.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CalendarCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inst.fullName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{inst.neighborhood}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{PERIOD_LABELS[inst.schedulePeriod] || inst.schedulePeriod}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-700">{formatDate(inst.scheduledDate)}</p>
                    <p className="text-xs text-gray-400">{inst.planName}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top neighborhoods */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Top Bairros</h3>
          </div>
          <div className="p-4 space-y-2">
            {byNeighborhood.slice(0, 6).map((n, i) => {
              const max = byNeighborhood[0]?.total || 1
              return (
                <div key={n.name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700 font-medium truncate pr-2">{n.name}</span>
                    <span className="text-gray-500 flex-shrink-0">{n.total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(n.total / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Leads Recentes</h3>
          <Link href="/leads" className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left px-5 py-2.5 font-medium">Nome</th>
                <th className="text-left px-5 py-2.5 font-medium">Bairro</th>
                <th className="text-left px-5 py-2.5 font-medium">Plano</th>
                <th className="text-left px-5 py-2.5 font-medium">Status</th>
                <th className="text-left px-5 py-2.5 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                      {lead.fullName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{lead.neighborhood}</td>
                  <td className="px-5 py-3 text-gray-500">{lead.planName || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
