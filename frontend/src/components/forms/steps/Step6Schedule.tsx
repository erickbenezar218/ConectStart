'use client'

import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step6Schema, Step6Data } from '@/lib/validations'
import { FormData, SchedulePeriod } from '@/types'
import { Calendar, ChevronLeft, ChevronRight, Sun, Sunset } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

const PERIODS: { value: SchedulePeriod; label: string; time: string; icon: typeof Sun }[] = [
  { value: 'MORNING', label: 'Manhã', time: '08h - 12h', icon: Sun },
  { value: 'AFTERNOON', label: 'Tarde', time: '13h - 18h', icon: Sunset },
]

// Minimum date: tomorrow
function getMinDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function Step6Schedule({ formData, updateForm, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step6Data>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      scheduledDate: formData.scheduledDate,
      schedulePeriod: (formData.schedulePeriod || undefined) as 'MORNING' | 'AFTERNOON' | undefined,
    },
  })

  const onSubmit: SubmitHandler<Step6Data> = (data) => {
    updateForm(data)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agendamento</h2>
          <p className="text-sm text-muted-foreground">Escolha a data e período para instalação</p>
        </div>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Data de instalação *</label>
        <input
          {...register('scheduledDate')}
          type="date"
          min={getMinDate()}
          className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {errors.scheduledDate && (
          <p className="text-xs text-red-500">{errors.scheduledDate.message}</p>
        )}
      </div>

      {/* Period */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Período preferido *</label>
        <div className="grid grid-cols-2 gap-3">
          {PERIODS.map(({ value, label, time, icon: Icon }) => {
            const selected = formData.schedulePeriod === value
            return (
              <label
                key={value}
                className={cn(
                  'cursor-pointer flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  selected
                    ? 'border-primary bg-primary-50'
                    : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                )}
              >
                <input
                  {...register('schedulePeriod')}
                  type="radio"
                  value={value}
                  onChange={() => updateForm({ schedulePeriod: value })}
                  className="sr-only"
                />
                <Icon className={cn('w-6 h-6', selected ? 'text-primary' : 'text-gray-400')} />
                <div className="text-center">
                  <p className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-gray-700')}>
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{time}</p>
                </div>
              </label>
            )
          })}
        </div>
        {errors.schedulePeriod && (
          <p className="text-xs text-red-500">{errors.schedulePeriod.message}</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
        Nossa equipe confirmará o agendamento via WhatsApp ou telefone.
      </div>

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
          type="submit"
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
