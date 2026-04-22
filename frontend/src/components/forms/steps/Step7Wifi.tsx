'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step7Schema, Step7Data } from '@/lib/validations'
import { FormData } from '@/types'
import { Wifi, ChevronLeft, Loader2, Eye, EyeOff, Send } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export default function Step7Wifi({ formData, updateForm, onBack, onSubmit, isSubmitting }: Props) {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step7Data>({
    resolver: zodResolver(step7Schema),
    defaultValues: {
      wifiName: formData.wifiName || `WiFi_${formData.fullName.split(' ')[0]}`,
      wifiPassword: formData.wifiPassword,
    },
  })

  const wifiName = watch('wifiName')
  const wifiPassword = watch('wifiPassword')

  const onFormSubmit = (data: Step7Data) => {
    updateForm(data)
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Wifi className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configuração Wi-Fi</h2>
          <p className="text-sm text-muted-foreground">Defina o nome e senha da sua rede</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Nome da rede (SSID) *</label>
          <input
            {...register('wifiName')}
            onChange={(e) => updateForm({ wifiName: e.target.value })}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="MinhaCasaWiFi"
          />
          {errors.wifiName && <p className="text-xs text-red-500">{errors.wifiName.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Senha do Wi-Fi *</label>
          <div className="relative">
            <input
              {...register('wifiPassword')}
              type={showPassword ? 'text' : 'password'}
              onChange={(e) => updateForm({ wifiPassword: e.target.value })}
              className="w-full h-11 px-3 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="touch-auto absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.wifiPassword && (
            <p className="text-xs text-red-500">{errors.wifiPassword.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
        </div>
      </div>

      {/* Wi-Fi preview */}
      {wifiName && (
        <div className="bg-gray-900 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-secondary-400" />
            <span className="text-xs text-gray-400">Preview da rede</span>
          </div>
          <p className="font-mono text-sm font-semibold">{wifiName}</p>
          {wifiPassword && (
            <p className="font-mono text-xs text-gray-400 mt-1">
              🔒 {showPassword ? wifiPassword : '•'.repeat(wifiPassword.length)}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-primary mb-3">Resumo do Cadastro</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-gray-500">Nome:</span>
          <span className="font-medium text-gray-800 truncate">{formData.fullName}</span>
          <span className="text-gray-500">Bairro:</span>
          <span className="font-medium text-gray-800">{formData.neighborhood}</span>
          <span className="text-gray-500">Plano:</span>
          <span className="font-medium text-gray-800">{formData.planName}</span>
          {formData.planPrice && (
            <>
              <span className="text-gray-500">Mensalidade:</span>
              <span className="font-medium text-gray-800">{formatCurrency(formData.planPrice)}/mês</span>
            </>
          )}
          {formData.scheduledDate && (
            <>
              <span className="text-gray-500">Agendamento:</span>
              <span className="font-medium text-gray-800">{formatDate(formData.scheduledDate)}</span>
            </>
          )}
        </div>
      </div>

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
          type="submit"
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          <>
            <Send className="w-4 h-4" />
            Próximo
          </>
        </button>
      </div>
    </form>
  )
}
