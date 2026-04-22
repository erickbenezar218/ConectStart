'use client'

import { useEffect, useState } from 'react'
import { FormData, Plan, BillingDate } from '@/types'
import { plansApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Wifi, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Tag, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const DISCOUNT = 0.10

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

export default function Step4Plan({ formData, updateForm, onNext, onBack }: Props) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingDates, setBillingDates] = useState<BillingDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isFidelity = formData.contractType === 'FIDELITY'

  useEffect(() => {
    async function load() {
      try {
        const [p, d] = await Promise.all([plansApi.list(), plansApi.getBillingDates()])
        setPlans(p)
        setBillingDates(d)
      } catch {
        setError('Erro ao carregar planos. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectPlan = (plan: Plan) => {
    updateForm({
      planId: plan.id,
      planName: plan.nome,
      planBasePrice: plan.valor,
      planPrice: isFidelity ? plan.valor * (1 - DISCOUNT) : plan.valor,
      planSpeed: plan.velocidade,
    })
  }

  const canNext = formData.planId !== ''

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Wifi className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Escolha seu Plano</h2>
          <p className="text-sm text-muted-foreground">Selecione o plano ideal para você</p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Banner de desconto — condicional */}
          {isFidelity ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700 font-medium">
                Contrato com fidelidade: preços com{' '}
                <span className="font-bold">10% de desconto de pontualidade</span>. Pague até o vencimento e garanta esse valor!
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Contrato sem fidelidade: planos pelo{' '}
                <span className="font-bold">valor cheio, sem desconto de pontualidade</span>.
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {plans.map((plan) => {
              const selected = formData.planId === plan.id
              const valorOriginal = plan.valor
              const valorComDesconto = plan.valor * (1 - DISCOUNT)

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => selectPlan(plan)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all',
                    selected
                      ? 'border-primary bg-primary-50 shadow-sm'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', selected ? 'bg-primary' : 'bg-gray-100')}>
                      <Wifi className={cn('w-5 h-5', selected ? 'text-white' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{plan.nome}</p>
                      <p className="text-xs text-muted-foreground">{plan.velocidade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isFidelity ? (
                      <div className="text-right">
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(valorOriginal)}</p>
                        <p className="font-bold text-primary text-lg leading-tight">{formatCurrency(valorComDesconto)}</p>
                        <p className="text-[10px] text-green-600 font-medium">/mês c/ pontualidade</p>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-lg leading-tight">{formatCurrency(valorOriginal)}</p>
                        <p className="text-[10px] text-gray-500 font-medium">/mês</p>
                      </div>
                    )}
                    {selected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>

          {billingDates.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-gray-700">
                Data de vencimento preferida
              </label>
              <div className="flex flex-wrap gap-2">
                {billingDates.map(({ dia }) => (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => updateForm({ billingDate: dia })}
                    className={cn(
                      'w-12 h-12 rounded-xl text-sm font-semibold border-2 transition-all',
                      formData.billingDate === dia
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 text-gray-700 hover:border-primary/50'
                    )}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
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
