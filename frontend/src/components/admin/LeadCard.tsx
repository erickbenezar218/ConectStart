'use client'

import Link from 'next/link'
import { LeadSummary, LeadStatus, STATUS_LABELS } from '@/types'
import { formatDate, formatCurrency, formatPhone } from '@/lib/utils'
import { MapPin, Phone, Wifi, Calendar, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  NEW: 'CONTACTED',
  CONTACTED: 'SCHEDULED',
  SCHEDULED: 'INSTALLED',
}

interface Props {
  lead: LeadSummary
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<void>
}

export default function LeadCard({ lead, onStatusChange }: Props) {
  const [updating, setUpdating] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const nextStatus = NEXT_STATUS[lead.status]

  const handleAdvance = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!nextStatus || updating) return
    setUpdating(true)
    await onStatusChange(lead.id, nextStatus)
    setUpdating(false)
  }

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault()
    setMenuOpen(false)
    if (updating) return
    setUpdating(true)
    await onStatusChange(lead.id, 'CANCELLED')
    setUpdating(false)
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow group">
      {/* Priority indicator */}
      {lead.priority > 0 && (
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-orange-400 rounded-full" />
      )}

      {/* Menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen) }}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg z-20 min-w-[140px]">
            <button
              onClick={handleCancel}
              className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50"
            >
              Cancelar lead
            </button>
          </div>
        )}
      </div>

      <Link href={`/leads/${lead.id}`} className="block space-y-2">
        {/* Photo + Name */}
        <div className="flex items-start gap-2">
          {lead.housePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lead.housePhotoUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">
                {lead.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{lead.fullName}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{lead.neighborhood}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{formatPhone(lead.phone)}</span>
          </div>
          {lead.planName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Wifi className="w-3 h-3 text-gray-400" />
              <span className="truncate">{lead.planName}</span>
              {lead.planPrice && (
                <span className="ml-auto font-semibold text-primary">
                  {formatCurrency(lead.planPrice)}
                </span>
              )}
            </div>
          )}
          {lead.scheduledDate && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span>{formatDate(lead.scheduledDate)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDate(lead.createdAt)}
          </span>
          {nextStatus && (
            <button
              onClick={handleAdvance}
              disabled={updating}
              className={cn(
                'flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors',
                'bg-primary-50 text-primary hover:bg-primary hover:text-white'
              )}
            >
              {updating ? '...' : `→ ${STATUS_LABELS[nextStatus]}`}
            </button>
          )}
        </div>
      </Link>
    </div>
  )
}
