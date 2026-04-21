'use client'

import { useState, useRef } from 'react'
import { FormData } from '@/types'
import { uploadsApi } from '@/lib/api'
import { Camera, MapPin, ChevronLeft, ChevronRight, Loader2, CheckCircle, X } from 'lucide-react'

interface Props {
  formData: FormData
  updateForm: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

export default function Step3Photo({ formData, updateForm, onNext, onBack }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [preview, setPreview] = useState<string | null>(formData.housePhotoUrl || null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploadError('')
    setUploading(true)

    try {
      const result = await uploadsApi.uploadPhoto(file)
      updateForm({ housePhotoUrl: result.url })
    } catch (err) {
      setUploadError('Erro ao enviar foto. Tente novamente.')
      setPreview(null)
      updateForm({ housePhotoUrl: '' })
    } finally {
      setUploading(false)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não disponível neste navegador.')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateForm({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setGettingLocation(false)
      },
      () => {
        alert('Não foi possível obter a localização. Verifique as permissões do navegador.')
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const clearPhoto = () => {
    setPreview(null)
    updateForm({ housePhotoUrl: '' })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Camera className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Foto e Localização</h2>
          <p className="text-sm text-muted-foreground">Ajuda nossa equipe a chegar no local</p>
        </div>
      </div>

      {/* Photo upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Foto da fachada da casa</label>
        {preview ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Fachada" className="w-full h-52 object-cover" />
            <div className="absolute top-2 right-2 flex gap-2">
              {uploading && (
                <div className="bg-black/50 text-white rounded-full p-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
              {!uploading && (
                <>
                  <div className="bg-green-500 text-white rounded-full p-1.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary hover:bg-primary-50/50 transition-colors">
              <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-600">Clique para enviar foto</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP · Máx. 10MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Localização GPS</label>
        {formData.latitude && formData.longitude ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-700">Localização capturada!</p>
              <p className="text-green-600 text-xs">
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateForm({ latitude: null, longitude: null })}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={gettingLocation}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary-50/50 transition-colors disabled:opacity-50"
          >
            {gettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            {gettingLocation ? 'Obtendo localização...' : 'Capturar minha localização'}
          </button>
        )}
        <p className="text-xs text-muted-foreground">
          Opcional, mas ajuda nossa equipe a otimizar o atendimento.
        </p>
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
          type="button"
          onClick={onNext}
          disabled={uploading}
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
