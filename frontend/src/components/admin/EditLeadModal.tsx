'use client'

import { useState } from 'react'
import { Lead, ContractType, SchedulePeriod } from '@/types'
import { leadsApi } from '@/lib/api'
import { X, Loader2 } from 'lucide-react'

interface Props {
  lead: Lead
  onClose: () => void
  onSaved: (updated: Lead) => void
}

export default function EditLeadModal({ lead, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    fullName: lead.fullName,
    cpf: lead.cpf,
    rg: lead.rg ?? '',
    email: lead.email,
    phone: lead.phone,
    birthDate: lead.birthDate ? lead.birthDate.slice(0, 10) : '',
    zipCode: lead.zipCode,
    street: lead.street,
    number: lead.number,
    complement: lead.complement ?? '',
    neighborhood: lead.neighborhood,
    city: lead.city,
    state: lead.state,
    referencePoint: lead.referencePoint ?? '',
    planName: lead.planName ?? '',
    planPrice: lead.planPrice?.toString() ?? '',
    planSpeed: lead.planSpeed ?? '',
    contractType: lead.contractType as ContractType,
    billingDate: lead.billingDate?.toString() ?? '',
    scheduledDate: lead.scheduledDate ? lead.scheduledDate.slice(0, 10) : '',
    schedulePeriod: lead.schedulePeriod ?? '',
    wifiName: lead.wifiName ?? '',
    wifiPassword: lead.wifiPassword ?? '',
    notes: lead.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const updated = await leadsApi.update(lead.id, {
        fullName: form.fullName,
        cpf: form.cpf,
        rg: form.rg || undefined,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate || undefined,
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        complement: form.complement || undefined,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        referencePoint: form.referencePoint || undefined,
        planName: form.planName || undefined,
        planPrice: form.planPrice ? Number(form.planPrice) : undefined,
        planSpeed: form.planSpeed || undefined,
        contractType: form.contractType,
        billingDate: form.billingDate ? Number(form.billingDate) : undefined,
        scheduledDate: form.scheduledDate || undefined,
        schedulePeriod: (form.schedulePeriod as SchedulePeriod) || undefined,
        wifiName: form.wifiName || undefined,
        wifiPassword: form.wifiPassword || undefined,
        notes: form.notes || undefined,
      })
      onSaved(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white'
  const labelCls = 'block text-xs text-gray-500 mb-1'
  const sectionTitleCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />

      <div className="w-full max-w-xl bg-white flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Editar Cadastro</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Personal */}
          <section>
            <h3 className={sectionTitleCls}>Dados Pessoais</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Nome completo *</label>
                <input value={form.fullName} onChange={set('fullName')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CPF *</label>
                <input value={form.cpf} onChange={set('cpf')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>RG</label>
                <input value={form.rg} onChange={set('rg')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>E-mail *</label>
                <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Telefone *</label>
                <input value={form.phone} onChange={set('phone')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Data de nascimento</label>
                <input type="date" value={form.birthDate} onChange={set('birthDate')} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className={sectionTitleCls}>Endereço</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>CEP</label>
                <input value={form.zipCode} onChange={set('zipCode')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <input value={form.state} onChange={set('state')} maxLength={2} className={`${inputCls} uppercase`} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Rua</label>
                <input value={form.street} onChange={set('street')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Número</label>
                <input value={form.number} onChange={set('number')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Complemento</label>
                <input value={form.complement} onChange={set('complement')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Bairro</label>
                <input value={form.neighborhood} onChange={set('neighborhood')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cidade</label>
                <input value={form.city} onChange={set('city')} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Ponto de referência</label>
                <input value={form.referencePoint} onChange={set('referencePoint')} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Plan */}
          <section>
            <h3 className={sectionTitleCls}>Plano & Contrato</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Plano</label>
                <input value={form.planName} onChange={set('planName')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Mensalidade (R$)</label>
                <input type="number" step="0.01" value={form.planPrice} onChange={set('planPrice')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Velocidade</label>
                <input value={form.planSpeed} onChange={set('planSpeed')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contrato</label>
                <select value={form.contractType} onChange={set('contractType')} className={inputCls}>
                  <option value="FIDELITY">12 meses (fidelidade)</option>
                  <option value="NO_FIDELITY">Sem fidelidade</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Dia do vencimento</label>
                <input type="number" min="1" max="31" value={form.billingDate} onChange={set('billingDate')} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h3 className={sectionTitleCls}>Agendamento</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Data</label>
                <input type="date" value={form.scheduledDate} onChange={set('scheduledDate')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Período</label>
                <select value={form.schedulePeriod} onChange={set('schedulePeriod')} className={inputCls}>
                  <option value="">Não definido</option>
                  <option value="MORNING">Manhã (08h–12h)</option>
                  <option value="AFTERNOON">Tarde (12h–18h)</option>
                  <option value="EVENING">Noite (18h–21h)</option>
                </select>
              </div>
            </div>
          </section>

          {/* WiFi */}
          <section>
            <h3 className={sectionTitleCls}>Wi-Fi</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nome da rede</label>
                <input value={form.wifiName} onChange={set('wifiName')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Senha</label>
                <input value={form.wifiPassword} onChange={set('wifiPassword')} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className={sectionTitleCls}>Observações</h3>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </section>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
