'use client'

import { useEffect, useState } from 'react'
import { FormData, ContractType } from '@/types'
import { pricingApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { FileText, ChevronLeft, ChevronRight, Shield, Zap, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

const CONTRACT_OPTIONS = [
  {
    value: 'FIDELITY' as ContractType,
    label: 'Com Fidelidade',
    subtitle: '12 meses de contrato',
    description: 'Menor taxa de instalação. Compromisso de 12 meses.',
    highlight: '10% de desconto de pontualidade nos planos',
    highlightColor: 'text-green-700 bg-green-50 border-green-200',
    icon: Shield,
    badge: 'Mais econômico',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    value: 'NO_FIDELITY' as ContractType,
    label: 'Sem Fidelidade',
    subtitle: 'Livre para cancelar',
    description: 'Sem compromisso. Cancele quando quiser.',
    highlight: 'Planos pelo valor cheio — sem desconto de pontualidade',
    highlightColor: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: Zap,
    badge: 'Mais flexível',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
]

export default function Step5Contract({ formData, updateForm, onNext, onBack }: Props) {
  const [pricing, setPricing] = useState<{
    adhesionFee: number
    distanceFee: number
    totalSetup: number
    breakdown: { label: string; value: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!formData.neighborhood) return
    setLoading(true)
    pricingApi
      .calculate({
        neighborhood: formData.neighborhood,
        distance: formData.distance ?? undefined,
        contractType: formData.contractType || undefined,
      })
      .then(setPricing)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [formData.neighborhood, formData.distance, formData.contractType])

  const canNext = formData.contractType !== ''

  const handleContractChange = (value: ContractType) => {
    const base = formData.planBasePrice
    const update: Partial<typeof formData> = { contractType: value }
    // Se já escolheu um plano, recalcula o planPrice para o novo tipo de contrato
    if (base !== null) {
      update.planPrice = value === 'FIDELITY' ? base * 0.9 : base
    }
    updateForm(update)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tipo de Contrato</h2>
          <p className="text-sm text-muted-foreground">Escolha como prefere contratar</p>
        </div>
      </div>

      <div className="grid gap-3">
        {CONTRACT_OPTIONS.map(({ value, label, subtitle, description, highlight, highlightColor, icon: Icon, badge, badgeColor }) => {
          const selected = formData.contractType === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleContractChange(value)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all',
                selected
                  ? 'border-primary bg-primary-50 shadow-sm'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    selected ? 'bg-primary' : 'bg-gray-100'
                  )}
                >
                  <Icon className={cn('w-5 h-5', selected ? 'text-white' : 'text-gray-400')} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{label}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', badgeColor)}>
                      {badge}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-medium mt-0.5">{subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                  <p className={cn('text-xs font-semibold mt-2 px-2 py-1 rounded border', highlightColor)}>
                    {highlight}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Pricing summary */}
      {pricing && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Resumo de Valores</h3>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Bairro: {formData.neighborhood}</p>
              {pricing.breakdown.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">{value === 0 ? 'Grátis' : formatCurrency(value)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between text-sm font-bold">
                <span>Total na instalação</span>
                <span className="text-primary">
                  {pricing.totalSetup === 0 ? 'Gratuito' : formatCurrency(pricing.totalSetup)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
