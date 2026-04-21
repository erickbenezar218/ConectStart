'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  label: string
}

interface FormProgressProps {
  currentStep: number
  totalSteps: number
  steps: Step[]
}

export default function FormProgress({ currentStep, steps }: FormProgressProps) {
  return (
    <div className="px-2">
      {/* Mobile: simple indicator */}
      <div className="flex items-center justify-between mb-2 sm:hidden">
        <span className="text-sm font-medium text-primary">
          Etapa {currentStep} de {steps.length}
        </span>
        <span className="text-sm text-muted-foreground">{steps[currentStep - 1]?.label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 sm:hidden">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>

      {/* Desktop: step dots */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Line behind */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((s, i) => {
          const n = i + 1
          const done = n < currentStep
          const active = n === currentStep
          return (
            <div key={n} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300',
                  done && 'bg-primary border-primary text-white',
                  active && 'bg-white border-primary text-primary scale-110 shadow-md',
                  !done && !active && 'bg-white border-gray-200 text-gray-400'
                )}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium text-center max-w-[60px] leading-tight',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
