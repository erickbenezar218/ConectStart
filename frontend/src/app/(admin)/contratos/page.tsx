'use client'

import { useEffect, useState, useCallback } from 'react'
import { contractsApi } from '@/lib/api'
import {
  Contract, ContractStatus,
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
} from '@/types'
import {
  FileText, Send, Eye, RefreshCw, Loader2, Trash2,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, XCircle, FileCheck,
  Upload, Settings, FileCheck2,
} from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'

const STATUS_TABS: { value: ContractStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'SENT', label: 'Enviados' },
  { value: 'SIGNED', label: 'Assinados' },
  { value: 'EXPIRED', label: 'Expirados' },
]

const STATUS_ICONS: Record<ContractStatus, React.ElementType> = {
  PENDING: Clock,
  SENT: Send,
  SIGNED: CheckCircle2,
  EXPIRED: AlertCircle,
  CANCELLED: XCircle,
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function fmtPhone(p?: string | null) {
  if (!p) return '—'
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return p
}

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ContractStatus | ''>('')
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [templateInfo, setTemplateInfo] = useState<{ exists: boolean; size?: number; updatedAt?: string } | null>(null)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const templateInputRef = useRef<HTMLInputElement>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, tplRes] = await Promise.all([
        contractsApi.list({ status: activeTab || undefined, page, limit: 20 }),
        contractsApi.getTemplateInfo(),
      ])
      setContracts(listRes.data)
      setMeta(listRes.meta)
      setTemplateInfo(tplRes)
    } catch {
      showToast('error', 'Erro ao carregar contratos')
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingTemplate(true)
    try {
      await contractsApi.uploadTemplate(file)
      showToast('success', 'Template enviado com sucesso!')
      const info = await contractsApi.getTemplateInfo()
      setTemplateInfo(info)
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao enviar template')
    } finally {
      setUploadingTemplate(false)
      if (templateInputRef.current) templateInputRef.current.value = ''
    }
  }

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [activeTab])

  const handleGenerate = async (leadId: string) => {
    setActionId(leadId)
    try {
      await contractsApi.generate(leadId)
      showToast('success', 'Contrato gerado com sucesso')
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar contrato'
      showToast('error', msg)
    } finally {
      setActionId(null)
    }
  }

  const handleDispatch = async (contract: Contract) => {
    setActionId(contract.id)
    try {
      await contractsApi.dispatch(contract.id)
      showToast('success', 'Contrato disparado via WhatsApp')
      fetchData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao disparar'
      showToast('error', msg)
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (contract: Contract) => {
    if (!confirm(`Excluir contrato de ${contract.lead?.fullName}?`)) return
    setActionId(contract.id)
    try {
      await contractsApi.remove(contract.id)
      showToast('success', 'Contrato excluído')
      fetchData()
    } catch {
      showToast('error', 'Erro ao excluir')
    } finally {
      setActionId(null)
    }
  }

  const stats = {
    total: contracts.length,
    signed: contracts.filter((c) => c.status === 'SIGNED').length,
    sent: contracts.filter((c) => c.status === 'SENT').length,
    pending: contracts.filter((c) => c.status === 'PENDING').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2',
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Geração e assinatura de contratos via WhatsApp</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Assinados', value: stats.signed, color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
          { label: 'Enviados', value: stats.sent, color: 'bg-blue-50 text-blue-700', icon: Send },
          { label: 'Pendentes', value: stats.pending, color: 'bg-yellow-50 text-yellow-700', icon: Clock },
          { label: 'Total', value: meta.total, color: 'bg-gray-50 text-gray-700', icon: FileText },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              activeTab === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Nenhum contrato encontrado</p>
            <p className="text-xs mt-1">Acesse um lead e clique em &quot;Gerar Contrato&quot;</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Plano</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Enviado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Assinado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => {
                const StatusIcon = STATUS_ICONS[contract.status]
                const isActing = actionId === contract.id || actionId === contract.leadId
                return (
                  <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">{contract.lead?.fullName || '—'}</p>
                      <p className="text-xs text-gray-400">{contract.lead?.cpf || '—'}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      <p className="truncate max-w-[140px]">{contract.lead?.planName || '—'}</p>
                      {contract.lead?.planPrice && (
                        <p className="text-xs text-gray-400">
                          {contract.lead.planPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', CONTRACT_STATUS_COLORS[contract.status])}>
                        <StatusIcon className="w-3 h-3" />
                        {CONTRACT_STATUS_LABELS[contract.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {fmtDate(contract.sentAt)}
                      {contract.sentBy && <p className="text-gray-400">por {contract.sentBy}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs hidden md:table-cell">
                      {contract.signedAt ? (
                        <span className="text-green-600 font-medium">{fmtDate(contract.signedAt)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview contrato */}
                        {(contract.docxFilename || contract.pdfFilename) && (
                          <a
                            href={`${API_URL}/api/contracts/${contract.id}/preview`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Visualizar contrato"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        {/* Preview signed PDF */}
                        {contract.signedPdfFilename && (
                          <a
                            href={`${API_URL}/contracts/${contract.signedPdfFilename}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Comprovante assinado"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          >
                            <FileCheck className="w-4 h-4" />
                          </a>
                        )}
                        {/* Dispatch */}
                        {contract.status !== 'SIGNED' && contract.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleDispatch(contract)}
                            disabled={isActing}
                            title="Disparar via WhatsApp"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
                          >
                            {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        )}
                        {/* Regenerate */}
                        {contract.status !== 'SIGNED' && (
                          <button
                            onClick={() => handleGenerate(contract.leadId)}
                            disabled={isActing}
                            title="Regenerar contrato"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors disabled:opacity-40"
                          >
                            {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                        )}
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(contract)}
                          disabled={isActing}
                          title="Excluir"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <p className="text-gray-500">
              {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} de {meta.total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page === meta.pages}
                className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template config */}
      <div className="mt-4 bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-800">Template do Contrato (.docx)</h2>
          </div>
          {templateInfo?.exists && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <FileCheck2 className="w-3.5 h-3.5" />
              Template ativo
            </span>
          )}
        </div>

        {templateInfo?.exists ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg mb-3">
            <div className="text-sm">
              <p className="font-medium text-green-800">contrato.docx</p>
              <p className="text-xs text-green-600 mt-0.5">
                {templateInfo.size ? `${(templateInfo.size / 1024).toFixed(1)} KB` : ''}
                {templateInfo.updatedAt ? ` · Atualizado em ${new Date(templateInfo.updatedAt).toLocaleDateString('pt-BR')}` : ''}
              </p>
            </div>
            <button
              onClick={() => templateInputRef.current?.click()}
              disabled={uploadingTemplate}
              className="flex items-center gap-1.5 text-xs border border-green-300 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {uploadingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Substituir
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg mb-3">
            <div className="text-sm">
              <p className="font-medium text-orange-800">Nenhum template carregado</p>
              <p className="text-xs text-orange-600 mt-0.5">Faça upload do arquivo .docx com os placeholders</p>
            </div>
            <button
              onClick={() => templateInputRef.current?.click()}
              disabled={uploadingTemplate}
              className="flex items-center gap-1.5 text-xs bg-orange-500 text-white hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            >
              {uploadingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Enviar template
            </button>
          </div>
        )}

        <input
          ref={templateInputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={handleTemplateUpload}
        />

        <p className="text-xs text-gray-400">
          Placeholders suportados: <span className="font-mono">CLIENTE_NOME, CLIENTE_CPFCNPJ, PLANO_VELOCIDADE, PLANO_VALOR, SERVICO_ENDERECO, COBRANCA_VENCIMENTO</span> e outros.
        </p>
      </div>

      {/* Info box */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        <p className="font-medium mb-1">Como usar</p>
        <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
          <li>Acesse um lead e clique em <strong>Gerar Contrato</strong> para criar o PDF</li>
          <li>Clique em <Send className="w-3 h-3 inline" /> para disparar o link de assinatura via WhatsApp</li>
          <li>O cliente acessa o link, envia selfie + foto do documento e assina</li>
          <li>Status muda para <span className="font-semibold text-green-700">Assinado</span> automaticamente</li>
        </ol>
      </div>
    </div>
  )
}
