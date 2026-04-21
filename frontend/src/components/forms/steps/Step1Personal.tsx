'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step1Schema, Step1Data } from '@/lib/validations'
import { FormData } from '@/types'
import { formatCPF, formatPhone } from '@/lib/utils'
import { User, ChevronRight } from 'lucide-react'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onNext: () => void
}

export default function Step1Personal({ formData, updateForm, onNext }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: formData.fullName,
      cpf: formData.cpf,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate,
      rg: formData.rg,
    },
  })

  const onSubmit = (data: Step1Data) => {
    updateForm(data)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dados Pessoais</h2>
          <p className="text-sm text-muted-foreground">Informe seus dados de identificação</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-sm font-medium text-gray-700">Nome completo *</label>
          <input
            {...register('fullName')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="João Silva"
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">CPF *</label>
          <input
            {...register('cpf')}
            onChange={(e) => setValue('cpf', formatCPF(e.target.value))}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="000.000.000-00"
          />
          {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">RG</label>
          <input
            {...register('rg')}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="00.000.000-0"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">E-mail *</label>
          <input
            {...register('email')}
            type="email"
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="joao@email.com"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Telefone / WhatsApp *</label>
          <input
            {...register('phone')}
            onChange={(e) => setValue('phone', formatPhone(e.target.value))}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="(00) 00000-0000"
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Data de nascimento</label>
          <input
            {...register('birthDate')}
            type="date"
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
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
