'use client'

import { useState } from 'react'
import { FormData } from '@/types'
import { leadsApi } from '@/lib/api'
import FormProgress from './FormProgress'
import Step1Personal from './steps/Step1Personal'
import Step2Address from './steps/Step2Address'
import Step3Photo from './steps/Step3Photo'
import Step4Plan from './steps/Step4Plan'
import Step5Contract from './steps/Step5Contract'
import Step6Schedule from './steps/Step6Schedule'
import Step7Wifi from './steps/Step7Wifi'
import Step8Terms from './steps/Step8Terms'
import { CheckCircle2 } from 'lucide-react'

const TOTAL_STEPS = 8

const STEPS = [
  { label: 'Dados Pessoais' },
  { label: 'Endereço' },
  { label: 'Localização' },
  { label: 'Contrato' },
  { label: 'Plano' },
  { label: 'Agendamento' },
  { label: 'Wi-Fi' },
  { label: 'Confirmação' },
]

const initialData: FormData = {
  fullName: '', cpf: '', email: '', phone: '', birthDate: '', rg: '',
  zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', referencePoint: '',
  housePhotoUrl: '', latitude: null, longitude: null,
  planId: '', planName: '', planPrice: null, planBasePrice: null, planSpeed: '', billingDate: null,
  contractType: '',
  scheduledDate: '', schedulePeriod: '',
  wifiName: '', wifiPassword: '',
  distance: null,
  termsAccepted: false,
}

export default function MultiStepForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateForm = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      await leadsApi.create({
        ...formData,
        planPrice: formData.planPrice ?? undefined,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        billingDate: formData.billingDate ?? undefined,
        distance: formData.distance ?? undefined,
        contractType: (formData.contractType as 'FIDELITY' | 'NO_FIDELITY') || undefined,
        schedulePeriod: (formData.schedulePeriod as 'MORNING' | 'AFTERNOON' | 'EVENING') || undefined,
      })
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar cadastro')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Enviado!</h2>
          <p className="text-muted-foreground mb-6">
            Recebemos seus dados com sucesso. Nossa equipe entrará em contato em breve para
            confirmar sua instalação.
          </p>
          <div className="bg-primary-50 rounded-lg p-4 text-sm text-primary-700 font-medium">
            Verifique seu WhatsApp e e-mail para mais informações.
          </div>
        </div>
      </div>
    )
  }

  const stepProps = { formData, updateForm, onNext: nextStep, onBack: prevStep }

  return (
    <div className="max-w-2xl mx-auto">
      <FormProgress currentStep={step} totalSteps={TOTAL_STEPS} steps={STEPS} />

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-4 md:mt-6">
        <div className="p-4 sm:p-6 md:p-8 animate-fade-in" key={step}>
          {step === 1 && <Step1Personal {...stepProps} />}
          {step === 2 && <Step2Address {...stepProps} />}
          {step === 3 && <Step3Photo {...stepProps} />}
          {step === 4 && <Step5Contract {...stepProps} />}
          {step === 5 && <Step4Plan {...stepProps} />}
          {step === 6 && <Step6Schedule {...stepProps} />}
          {step === 7 && <Step7Wifi {...stepProps} onSubmit={nextStep} isSubmitting={false} />}
          {step === 8 && (
            <Step8Terms
              formData={formData}
              updateForm={updateForm}
              onBack={prevStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {error && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
