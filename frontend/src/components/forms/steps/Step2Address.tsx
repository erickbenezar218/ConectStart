'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormData, SGPPop } from '@/types'
import { plansApi } from '@/lib/api'
import { formatCEP, fetchCEP } from '@/lib/utils'
import { MapPin, ChevronLeft, ChevronRight, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

const schema = z.object({
  neighborhood: z.string().min(2, 'Selecione o bairro/comunidade'),
  referencePoint: z.string().optional(),
  zipCode: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3, 'Logradouro inválido'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  city: z.string().min(2, 'Cidade inválida'),
  state: z.string().length(2, 'UF inválida'),
})

type FormValues = z.infer<typeof schema>

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function Step2Address({ formData, updateForm, onNext, onBack }: Props) {
  const [pops, setPops] = useState<SGPPop[]>([])
  const [loadingPops, setLoadingPops] = useState(true)
  const [loadingCEP, setLoadingCEP] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      neighborhood: formData.neighborhood,
      referencePoint: formData.referencePoint,
      zipCode: formData.zipCode,
      street: formData.street,
      number: formData.number,
      complement: formData.complement,
      city: formData.city,
      state: formData.state,
    },
  })

  const selectedNeighborhood = watch('neighborhood')

  // Load POPs from SGP
  useEffect(() => {
    plansApi.getPops()
      .then(setPops)
      .catch(() => {}) // fail silently, user can type manually
      .finally(() => setLoadingPops(false))
  }, [])

  const handleCEP = async (value: string) => {
    const formatted = formatCEP(value)
    setValue('zipCode', formatted)
    if (formatted.replace(/\D/g, '').length === 8) {
      setLoadingCEP(true)
      const data = await fetchCEP(formatted)
      if (data) {
        setValue('street', data.logradouro)
        setValue('city', data.localidade)
        setValue('state', data.uf)
      }
      setLoadingCEP(false)
    }
  }

  const onSubmit = (data: FormValues) => {
    updateForm({
      ...data,
      referencePoint: data.referencePoint || '',
    })
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

      {/* ── Bairro / Comunidade (POP) ── PRIMEIRO CAMPO */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Bairro / Comunidade atendida *
        </label>

        {loadingPops ? (
          <div className="flex items-center gap-2 h-11 px-3 border border-gray-200 rounded-lg text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando bairros...
          </div>
        ) : pops.length > 0 ? (
          <div className="relative">
            <select
              {...register('neighborhood')}
              onChange={(e) => {
                setValue('neighborhood', e.target.value)
                updateForm({ neighborhood: e.target.value })
              }}
              className={cn(
                'w-full h-11 px-3 pr-8 border rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors',
                errors.neighborhood ? 'border-red-400' : 'border-gray-200',
                !selectedNeighborhood && 'text-gray-400'
              )}
            >
              <option value="">Selecione o bairro/comunidade</option>
              {pops.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        ) : (
          // Fallback: free text if API failed
          <input
            {...register('neighborhood')}
            onChange={(e) => {
              setValue('neighborhood', e.target.value)
              updateForm({ neighborhood: e.target.value })
            }}
            className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Nome do bairro ou comunidade"
          />
        )}
        {errors.neighborhood && (
          <p className="text-xs text-red-500">{errors.neighborhood.message}</p>
        )}
      </div>

      {/* ── Ponto de referência ── */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Ponto de referência
        </label>
        <input
          {...register('referencePoint')}
          className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          placeholder="Ex: Em frente ao mercado X, perto da escola Y..."
        />
        <p className="text-xs text-muted-foreground">
          Ajuda nossa equipe a chegar mais facilmente
        </p>
      </div>

      <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
