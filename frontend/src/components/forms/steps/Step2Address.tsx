'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step2Schema, Step2Data } from '@/lib/validations'
import { FormData } from '@/types'
import { formatCEP, fetchCEP } from '@/lib/utils'
import { MapPin, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function Step2Address({ formData, updateForm, onNext, onBack }: Props) {
  const [loadingCEP, setLoadingCEP] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      zipCode: formData.zipCode,
      street: formData.street,
      number: formData.number,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
    },
  })

  const handleCEP = async (value: string) => {
    const formatted = formatCEP(value)
    setValue('zipCode', formatted)
    if (formatted.replace(/\D/g, '').length === 8) {
      setLoadingCEP(true)
      const data = await fetchCEP(formatted)
      if (data) {
        setValue('street', data.logradouro)
        setValue('neighborhood', data.bairro)
        setValue('city', data.localidade)
        setValue('state', data.uf)
      }
      setLoadingCEP(false)
    }
  }

  const onSubmit = (data: Step2Data) => {
    updateForm(data)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Endereço</h2>
          <p className="text-sm text-muted-foreground">Informe onde será feita a instalação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CEP */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">CEP *</label>
          <div className="relative">
            <input
              {...register('zipCode')}
              onChange={(e) => handleCEP(e.target.value)}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="00000-000"
            />
            {loadingCEP && (
              <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-primary" />
            )}
          </div>
          {errors.zipCode && <p className="text-xs text-red-500">{errors.zipCode.message}</p>}
        </div>

        {/* Logradouro */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-sm font-medium text-gray-700">Logradouro *</label>
          <input
            {...register('street')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Rua, Avenida..."
          />
          {errors.street && <p className="text-xs text-red-500">{errors.street.message}</p>}
        </div>

        {/* Número */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Número *</label>
          <input
            {...register('number')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="123"
          />
          {errors.number && <p className="text-xs text-red-500">{errors.number.message}</p>}
        </div>

        {/* Complemento */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-sm font-medium text-gray-700">Complemento</label>
          <input
            {...register('complement')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Apto, Bloco..."
          />
        </div>

        {/* Bairro */}
        <div className="sm:col-span-2 space-y-1">
          <label className="text-sm font-medium text-gray-700">Bairro *</label>
          <input
            {...register('neighborhood')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Centro"
          />
          {errors.neighborhood && (
            <p className="text-xs text-red-500">{errors.neighborhood.message}</p>
          )}
        </div>

        {/* Estado */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">UF *</label>
          <select
            {...register('state')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">UF</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
        </div>

        {/* Cidade */}
        <div className="sm:col-span-3 space-y-1">
          <label className="text-sm font-medium text-gray-700">Cidade *</label>
          <input
            {...register('city')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Sua cidade"
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>
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
