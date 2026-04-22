'use client'

import { useEffect, useState } from 'react'
import { usersApi, AdminUser } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import {
  UserCog, Plus, Loader2, Check, X, Eye, EyeOff,
  ShieldCheck, Users, Briefcase, MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_CONFIG = {
  ADMIN: { label: 'Administrador', icon: ShieldCheck, color: 'bg-red-100 text-red-700' },
  SUPERVISOR: { label: 'Supervisor', icon: Users, color: 'bg-blue-100 text-blue-700' },
  COMERCIAL: { label: 'Comercial', icon: Briefcase, color: 'bg-green-100 text-green-700' },
}

interface FormState {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'SUPERVISOR' | 'COMERCIAL'
}

const EMPTY_FORM: FormState = { name: '', email: '', password: '', role: 'COMERCIAL' }

export default function UsuariosPage() {
  const { user: currentUser } = useAuthStore()
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  const load = async () => {
    try {
      const data = await usersApi.list()
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editId) {
        const payload: any = { name: form.name, role: form.role }
        if (form.password) payload.password = form.password
        await usersApi.update(editId, payload)
      } else {
        await usersApi.create(form)
      }
      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: AdminUser) => {
    setToggleLoading(u.id)
    try {
      await usersApi.update(u.id, { isActive: !u.isActive })
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro')
    } finally {
      setToggleLoading(null)
    }
  }

  const openEdit = (u: AdminUser) => {
    setEditId(u.id)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setShowForm(true)
    setError('')
  }

  const cancelForm = () => {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setEditId(null)
    setError('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">{users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setError('') }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            {editId ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Nome completo *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="João Silva"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={!!editId}
                className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="joao@empresa.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                {editId ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editId}
                  className="w-full h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Perfil de acesso *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}
                className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="COMERCIAL">Comercial</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={cancelForm} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editId ? 'Salvar alterações' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Último acesso</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => {
              const role = ROLE_CONFIG[u.role]
              const RoleIcon = role.icon
              const isSelf = u.id === currentUser?.id
              return (
                <tr key={u.id} className={cn('hover:bg-gray-50 transition-colors', !u.isActive && 'opacity-50')}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {u.name} {isSelf && <span className="text-xs text-gray-400 font-normal">(você)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', role.color)}>
                      <RoleIcon className="w-3 h-3" />
                      {role.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {u.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {u.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={toggleLoading === u.id}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {toggleLoading === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : u.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
