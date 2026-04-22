'use client'

import { useState } from 'react'
import { FormData } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileCheck, ChevronLeft, Loader2, Send,
  Wifi, Calendar, MapPin, DollarSign, AlertCircle,
  CheckCircle2, Info, Tag, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

const PERIOD_LABELS: Record<string, string> = {
  MORNING: 'Manhã (08h - 12h)',
  AFTERNOON: 'Tarde (13h - 18h)',
}

function getNextBillingDate(billingDay: number): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const sameMonth = new Date(year, month, billingDay)
  const diffDays = (sameMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  const target = diffDays >= 3 ? sameMonth : new Date(year, month + 1, billingDay)
  return target.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <div className="px-4 py-3 space-y-0">{children}</div>
    </div>
  )
}

function Row({ label, value, valueClass }: {
  label: string
  value: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className={cn('text-sm font-semibold text-right text-gray-900', valueClass)}>
        {value}
      </span>
    </div>
  )
}

export default function Step8Terms({ formData, updateForm, onBack, onSubmit, isSubmitting }: Props) {
  const [accepted, setAccepted] = useState(formData.termsAccepted)

  const toggle = () => {
    const next = !accepted
    setAccepted(next)
    updateForm({ termsAccepted: next })
  }

  const isFidelity = formData.contractType === 'FIDELITY'

  // planBasePrice = valor cheio do plano (sempre, independente do contrato)
  // planPrice     = valor que será cobrado (com ou sem desconto)
  const priceOriginal = formData.planBasePrice ?? formData.planPrice ?? 0
  const priceWithDiscount = isFidelity ? (formData.planPrice ?? 0) : null

  const nextBilling = formData.billingDate
    ? getNextBillingDate(formData.billingDate)
    : 'A confirmar'

  const adhesionFee = formData.contractType === 'NO_FIDELITY'
    ? 300
    : ['BELA VISTA', 'MAIAPOLIS', 'FÉ EM DEUS', 'FE EM DEUS'].some(s =>
        formData.neighborhood.toUpperCase().includes(s)
      ) ? 100 : 50

  const fullAddress = [
    formData.street,
    formData.number,
    formData.complement,
    formData.neighborhood,
    formData.city,
    formData.state,
  ].filter(Boolean).join(', ')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <FileCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Confirmação & Termos</h2>
          <p className="text-sm text-muted-foreground">Leia com atenção antes de confirmar</p>
        </div>
      </div>

      {/* Pós-pago info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-blue-800">Serviço Pós-Pago — Como funciona?</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Você <strong>não paga nenhuma mensalidade antes da instalação.</strong>{' '}
            No dia em que o técnico instalar sua internet, você paga apenas a{' '}
            <strong>taxa de adesão de {formatCurrency(adhesionFee)}</strong>.{' '}
            A partir daí, as mensalidades passam a ser cobradas todo mês na data escolhida.
          </p>
        </div>
      </div>

      {/* Mensalidade */}
      <Section icon={DollarSign} title="Sua Mensalidade">
        <div className="py-2 space-y-3">
          {isFidelity ? (
            <>
              {/* Com fidelidade: mostra preço cheio + desconto */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Valor cheio da mensalidade</p>
                  <p className="text-xs text-gray-400">Cobrado se o pagamento for feito após o vencimento</p>
                </div>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(priceOriginal)}</p>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-green-600" />
                      <p className="text-sm text-green-700 font-semibold">Com desconto de pontualidade</p>
                    </div>
                    <p className="text-xs text-green-600 mt-0.5">
                      Pague até o dia <strong>{formData.billingDate ?? '—'}</strong> e garanta 10% de desconto todo mês
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(priceWithDiscount!)}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-xs text-amber-700">
                <strong>Atenção:</strong> O desconto de pontualidade é aplicado automaticamente quando o
                pagamento é realizado até a data de vencimento. Após o vencimento, o valor cobrado
                volta a ser <strong>{formatCurrency(priceOriginal)}</strong>.
              </div>

              <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-700">
                <strong>Em caso de atraso:</strong> serão cobrados juros de mora de 1% ao mês e
                multa de 2% sobre o valor da fatura em aberto.
              </div>
            </>
          ) : (
            <>
              {/* Sem fidelidade: só preço cheio, sem desconto */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700 font-medium">Valor da mensalidade</p>
                  <p className="text-xs text-gray-400">Contrato sem fidelidade — preço fixo</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(priceOriginal)}</p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600">
                O contrato sem fidelidade <strong>não possui desconto de pontualidade</strong>.
                O valor cobrado todo mês será sempre <strong>{formatCurrency(priceOriginal)}</strong>.
              </div>

              <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-xs text-red-700">
                <strong>Em caso de atraso:</strong> serão cobrados juros de mora de 1% ao mês e
                multa de 2% sobre o valor da fatura em aberto.
              </div>
            </>
          )}
        </div>

        <Row label="Próximo vencimento" value={nextBilling} />
        <Row
          label="Tipo de contrato"
          value={isFidelity ? 'Com fidelidade (12 meses)' : 'Sem fidelidade'}
        />
        <Row label="Plano contratado" value={formData.planName ?? '—'} />
      </Section>

      {/* Taxa de adesão */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Taxa de adesão — paga na instalação</p>
          <p className="text-3xl font-bold text-amber-700 my-1">{formatCurrency(adhesionFee)}</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            Este valor é pago <strong>uma única vez</strong>, diretamente ao técnico no dia da instalação.{' '}
            {isFidelity
              ? 'Você optou por contrato com fidelidade de 12 meses.'
              : 'Você optou por contrato sem fidelidade (mais flexível, porém com taxa de adesão maior).'}
          </p>
        </div>
      </div>

      {/* Endereço */}
      <Section icon={MapPin} title="Local de Instalação">
        <Row label="Bairro" value={formData.neighborhood} />
        <div className="flex justify-between items-start gap-4 py-2 border-b border-gray-100">
          <span className="text-sm text-gray-500 flex-shrink-0">Endereço completo</span>
          <span className="text-sm font-semibold text-right text-gray-900">{fullAddress}</span>
        </div>
        {formData.referencePoint && (
          <Row label="Referência" value={formData.referencePoint} />
        )}
      </Section>

      {/* Agendamento */}
      <Section icon={Calendar} title="Agendamento">
        {formData.scheduledDate && (
          <Row label="Data" value={formatDate(formData.scheduledDate)} />
        )}
        {formData.schedulePeriod && (
          <Row label="Período" value={PERIOD_LABELS[formData.schedulePeriod] ?? '—'} />
        )}
      </Section>

      {/* Wi-Fi */}
      {formData.wifiName && (
        <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-3 text-white">
          <Wifi className="w-5 h-5 text-secondary-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Rede Wi-Fi que será configurada</p>
            <p className="font-mono font-bold text-sm">{formData.wifiName}</p>
          </div>
        </div>
      )}

      {/* Aceite */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
          accepted ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-primary/40'
        )}
      >
        <div className={cn(
          'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors',
          accepted ? 'bg-green-500 border-green-500' : 'border-gray-300'
        )}>
          {accepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {isFidelity ? (
            <>
              Estou ciente de que o serviço é <strong>pós-pago</strong> e que pagarei apenas a taxa
              de adesão de <strong>{formatCurrency(adhesionFee)}</strong> no dia da instalação.
              A mensalidade do plano é de <strong>{formatCurrency(priceOriginal)}/mês</strong>,
              podendo ser reduzida para <strong>{formatCurrency(priceWithDiscount!)}/mês</strong>{' '}
              com o desconto de pontualidade ao pagar até o dia{' '}
              <strong>{formData.billingDate ?? '—'}</strong> de cada mês.
              Confirmo que todos os dados informados estão corretos.
            </>
          ) : (
            <>
              Estou ciente de que o serviço é <strong>pós-pago</strong> e que pagarei apenas a taxa
              de adesão de <strong>{formatCurrency(adhesionFee)}</strong> no dia da instalação.
              A mensalidade do plano é de <strong>{formatCurrency(priceOriginal)}/mês</strong>{' '}
              (contrato sem fidelidade — sem desconto de pontualidade).
              Confirmo que todos os dados informados estão corretos.
            </>
          )}
        </p>
      </button>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!accepted || isSubmitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
            : <><Send className="w-4 h-4" />Confirmar Cadastro</>
          }
        </button>
      </div>
    </div>
  )
}
