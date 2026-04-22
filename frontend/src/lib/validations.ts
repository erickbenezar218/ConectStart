import { z } from 'zod'

export const step1Schema = z.object({
  fullName: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().optional(),
  rg: z.string().optional(),
})

export const step2Schema = z.object({
  zipCode: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3, 'Logradouro inválido'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro inválido'),
  city: z.string().min(2, 'Cidade inválida'),
  state: z.string().length(2, 'UF inválida'),
})

export const step3Schema = z.object({
  housePhotoUrl: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})

export const step4Schema = z.object({
  planId: z.string().min(1, 'Selecione um plano'),
  planName: z.string(),
  planPrice: z.number(),
  planSpeed: z.string(),
  billingDate: z.number().nullable().optional(),
})

export const step5Schema = z.object({
  contractType: z.enum(['FIDELITY', 'NO_FIDELITY'], {
    required_error: 'Selecione o tipo de contrato',
  }),
})

export const step6Schema = z.object({
  scheduledDate: z.string().min(1, 'Selecione uma data'),
  schedulePeriod: z.enum(['MORNING', 'AFTERNOON'], {
    required_error: 'Selecione um período',
  }),
})

export const step7Schema = z.object({
  wifiName: z.string().min(1, 'Nome do Wi-Fi obrigatório'),
  wifiPassword: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Deve conter ao menos uma letra minúscula'),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step5Data = z.infer<typeof step5Schema>
export type Step6Data = z.infer<typeof step6Schema>
export type Step7Data = z.infer<typeof step7Schema>
