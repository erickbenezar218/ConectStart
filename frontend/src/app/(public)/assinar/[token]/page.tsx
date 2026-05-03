'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { contractsApi } from '@/lib/api'
import {
  Camera, FileText, CheckCircle2, AlertCircle, Loader2,
  Upload, Eye, ShieldCheck, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PageState = 'loading' | 'ready' | 'signed' | 'expired' | 'error'

interface ContractInfo {
  contractId: string
  status: string
  tokenExpiresAt: string
  pdfUrl: string | null
  lead: {
    fullName: string
    cpf: string
    planName?: string
    planPrice?: number
    planSpeed?: string
    neighborhood: string
    city: string
    state: string
  }
}

function fmtMoney(v?: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  return cpf
}

export default function AssinarPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<PageState>('loading')
  const [info, setInfo] = useState<ContractInfo | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [selfie, setSelfie] = useState<File | null>(null)
  const [documentPhoto, setDocumentPhoto] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [docPreview, setDocPreview] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [signedAt, setSignedAt] = useState<string | null>(null)
  const [showPdf, setShowPdf] = useState(false)

  const selfieRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    contractsApi
      .getPublicInfo(token)
      .then((data) => {
        if (data.status === 'SIGNED') {
          setState('signed')
          return
        }
        setInfo(data)
        setState('ready')
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar contrato'
        if (msg.includes('expirado') || msg.includes('410')) {
          setState('expired')
        } else {
          setErrorMsg(msg)
          setState('error')
        }
      })
  }, [token])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'selfie' | 'document') => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    if (type === 'selfie') {
      setSelfie(file)
      setSelfiePreview(url)
    } else {
      setDocumentPhoto(file)
      setDocPreview(url)
    }
  }

  const handleSubmit = async () => {
    if (!selfie || !documentPhoto || !agreed || !token) return
    setSubmitting(true)
    try {
      const result = await contractsApi.submitSignature(token, selfie, documentPhoto)
      setSignedAt(result.signedAt)
      setState('signed')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao assinar contrato'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = selfie && documentPhoto && agreed && !submitting

  // --- Signed screen ---
  if (state === 'signed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contrato Assinado!</h1>
        <p className="text-gray-600 mb-1">Sua assinatura foi registrada com sucesso.</p>
        {signedAt && (
          <p className="text-sm text-gray-400">
            {new Date(signedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </p>
        )}
        <div className="mt-8 p-4 bg-white rounded-xl border text-left text-sm text-gray-600 max-w-sm w-full">
          <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Validade Jurídica
          </p>
          <p>Este contrato foi assinado eletronicamente conforme a <strong>Lei 14.063/2020</strong> e a <strong>MP 2.200-2/2001</strong>.</p>
        </div>
      </div>
    )
  }

  // --- Expired screen ---
  if (state === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expirado</h1>
        <p className="text-gray-600 text-sm">Este link de assinatura expirou. Entre em contato com nossa equipe para receber um novo link.</p>
      </div>
    )
  }

  // --- Error screen ---
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Link Inválido</h1>
        <p className="text-gray-600 text-sm">{errorMsg || 'Este link é inválido ou não existe.'}</p>
      </div>
    )
  }

  // --- Loading screen ---
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // --- Main signing screen ---
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Assinatura de Contrato</p>
            <p className="text-xs text-gray-400">ConectPlus Fibra</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            Seguro
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* Client info card */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Dados do Contrato</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium text-gray-900">{info?.lead.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CPF</span>
              <span className="text-gray-700">{fmtCpf(info?.lead.cpf || '')}</span>
            </div>
            {info?.lead.planName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Plano</span>
                <span className="text-gray-700">{info.lead.planName}</span>
              </div>
            )}
            {info?.lead.planPrice && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mensalidade</span>
                <span className="font-semibold text-primary">{fmtMoney(info.lead.planPrice)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Local</span>
              <span className="text-gray-700">{[info?.lead.neighborhood, info?.lead.city].filter(Boolean).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* PDF preview */}
        {info?.pdfUrl && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <button
              onClick={() => setShowPdf(!showPdf)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Visualizar contrato completo
              </span>
              <span className="text-xs text-gray-400">{showPdf ? 'Fechar' : 'Abrir'}</span>
            </button>
            {showPdf && (
              <iframe
                src={info.pdfUrl}
                className="w-full h-96 border-t"
                title="Contrato"
              />
            )}
          </div>
        )}

        {/* Step 1: Selfie */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', selfie ? 'bg-green-500' : 'bg-primary')}>
              {selfie ? '✓' : '1'}
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Selfie (Prova de Vida)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Tire uma foto do seu rosto olhando para a câmera</p>

          <input
            ref={selfieRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleFileChange(e, 'selfie')}
          />

          {selfiePreview ? (
            <div className="relative">
              <Image src={selfiePreview} alt="Selfie" width={400} height={160} className="w-full h-40 object-cover rounded-lg border" />
              <button
                onClick={() => { setSelfie(null); setSelfiePreview(null) }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-xs text-red-500 hover:text-red-700"
              >
                Trocar
              </button>
            </div>
          ) : (
            <button
              onClick={() => selfieRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-6 text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm">Tirar selfie / Selecionar foto</span>
            </button>
          )}
        </div>

        {/* Step 2: Document photo */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', documentPhoto ? 'bg-green-500' : 'bg-primary')}>
              {documentPhoto ? '✓' : '2'}
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Documento de Identidade</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Foto do RG ou CNH (frente) com boa iluminação</p>

          <input
            ref={docRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileChange(e, 'document')}
          />

          {docPreview ? (
            <div className="relative">
              <Image src={docPreview} alt="Documento" width={400} height={160} className="w-full h-40 object-cover rounded-lg border" />
              <button
                onClick={() => { setDocumentPhoto(null); setDocPreview(null) }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-xs text-red-500 hover:text-red-700"
              >
                Trocar
              </button>
            </div>
          ) : (
            <button
              onClick={() => docRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-6 text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm">Fotografar / Selecionar documento</span>
            </button>
          )}
        </div>

        {/* Step 3: Agreement */}
        <div className="bg-white rounded-xl border p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-primary"
            />
            <p className="text-sm text-gray-700">
              Declaro que li e concordo com todos os termos e condições do contrato apresentado acima,
              e confirmo que as informações e documentos fornecidos são verdadeiros.
            </p>
          </label>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all',
            canSubmit
              ? 'bg-primary text-white shadow-md hover:shadow-lg active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Assinando...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Assinar Contrato
            </>
          )}
        </button>

        {/* Security note */}
        <p className="text-center text-xs text-gray-400 pb-4">
          <Lock className="w-3 h-3 inline mr-1" />
          Assinatura eletrônica com validade jurídica — Lei 14.063/2020
        </p>
      </div>
    </div>
  )
}
