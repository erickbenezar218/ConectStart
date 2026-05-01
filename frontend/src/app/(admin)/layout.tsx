'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { authApi, followUpsApi } from '@/lib/api'
import {
  LayoutDashboard, Users, Kanban, UserCog,
  LogOut, ExternalLink, ChevronRight, MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_LABELS = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', COMERCIAL: 'Comercial' }
const ROLE_COLORS = { ADMIN: 'bg-red-100 text-red-700', SUPERVISOR: 'bg-blue-100 text-blue-700', COMERCIAL: 'bg-green-100 text-green-700' }

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/kanban', label: 'Pipeline', icon: Kanban },
  { href: '/pos-venda', label: 'Pós-Venda', icon: MessageCircle },
  { href: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, loadFromStorage, clearAuth, isLoading } = useAuthStore()
  const [followUpDue, setFollowUpDue] = useState(0)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login')
    }
  }, [isLoading, token, router])

  useEffect(() => {
    if (!token) return
    followUpsApi.getStats().then((s) => setFollowUpDue(s.dueToday)).catch(() => {})
  }, [token])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    router.replace('/login')
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <Image src="/logo.png" alt="Logo" height={36} width={160} className="h-9 w-auto object-contain" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.filter((item) => !item.adminOnly || user.role === 'ADMIN').map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            const badge = href === '/pos-venda' && followUpDue > 0 ? followUpDue : 0
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {badge > 0 && !active && (
                  <span className="text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
              </Link>
            )
          })}

          <div className="pt-3 mt-3 border-t border-gray-100">
            <Link
              href="/cadastro"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver Formulário</span>
            </Link>
          </div>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen pl-60">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
