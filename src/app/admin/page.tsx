'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VeracityBadge from '@/components/ui/VeracityBadge'
import type { AnalysisResponse } from '@/types/analysis'

interface Profile {
  id: string
  email: string
  role: string
  full_name: string | null
  is_blocked: boolean
  created_at: string
}

interface Stats {
  total_analyses: number
  total_users: number
  by_veracity_level: Record<string, number>
}

type View = 'users' | 'history'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [userHistory, setUserHistory] = useState<AnalysisResponse[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role, email').eq('id', data.user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }
      setAdminEmail(profile.email)
      await loadUsers(supabase)
      await loadStats(data.user.id)
      setLoading(false)
    })
  }, [router])

  async function loadUsers(supabase: any) {
    const { data } = await supabase
      .from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function loadStats(adminId: string) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analysis/admin/stats?admin_id=${adminId}`
      )
      if (res.ok) setStats(await res.json())
    } catch { }
  }

  async function viewUserHistory(user: Profile) {
    setSelectedUser(user)
    setView('history')
    setHistoryLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analysis/history/${user.id}`
      )
      if (res.ok) setUserHistory(await res.json())
      else setUserHistory([])
    } catch {
      setUserHistory([])
    }
    setHistoryLoading(false)
  }

  async function toggleBlock(userId: string, isBlocked: boolean) {
    setActionLoading(userId)
    const supabase = createClient()
    await supabase.from('profiles').update({
      is_blocked: !isBlocked,
      blocked_at: !isBlocked ? new Date().toISOString() : null,
    }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_blocked: !isBlocked } : u))
    setActionLoading(null)
  }

  async function changeRole(userId: string, currentRole: string) {
    setActionLoading(userId)
    const supabase = createClient()
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setActionLoading(null)
  }

  async function deleteUser(userId: string, userEmail: string) {
    if (!confirm(`¿Eliminar permanentemente a ${userEmail}?`)) return
    setActionLoading(userId)
    const supabase = createClient()
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando panel admin...</p>
      </div>
    )
  }

  const LEVEL_COLORS: Record<string, string> = {
    verified: '#16a34a', likely_true: '#65a30d',
    uncertain: '#ca8a04', likely_false: '#ea580c', false: '#dc2626',
  }
  const LEVEL_LABELS: Record<string, string> = {
    verified: 'Verificado', likely_true: 'Prob. real',
    uncertain: 'Incierto', likely_false: 'Prob. falso', false: 'Falso',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900">SVACD</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{adminEmail}</span>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">Ver como usuario</Link>
          <button
            onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push('/') }}
            className="text-sm text-red-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {view === 'history' && selectedUser ? (
          <>
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => { setView('users'); setSelectedUser(null); setUserHistory([]) }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                ← Volver a usuarios
              </button>
              <span className="text-gray-300">|</span>
              <h1 className="text-xl font-bold text-gray-900">
                Historial de {selectedUser.email}
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                selectedUser.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {selectedUser.role}
              </span>
            </div>

            {historyLoading ? (
              <p className="text-gray-400 text-center py-12">Cargando historial...</p>
            ) : userHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400">Este usuario no tiene análisis registrados.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500">{userHistory.length} análisis encontrados</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {userHistory.map((item, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-400 uppercase">
                            {item.content_type}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.analyzed_at).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 truncate">{item.summary}</p>
                        {item.indicators.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {item.indicators.slice(0, 2).join(' · ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-lg font-bold text-gray-700">
                          {Math.round(item.veracity_score)}
                        </span>
                        <VeracityBadge level={item.veracity_level} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Panel de administración</h1>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total usuarios</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_users}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total análisis</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_analyses}</p>
                </div>
                {Object.entries(stats.by_veracity_level).map(([level, count]) => (
                  <div key={level} className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs text-gray-400 mb-1">{LEVEL_LABELS[level] || level}</p>
                    <p className="text-3xl font-bold" style={{ color: LEVEL_COLORS[level] || '#111' }}>
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  Gestión de usuarios
                  <span className="ml-2 text-sm font-normal text-gray-400">({users.length})</span>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Email</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Rol</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Estado</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Registro</th>
                      <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-700">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            user.is_blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {user.is_blocked ? 'Bloqueado' : 'Activo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewUserHistory(user)}
                              className="text-xs px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50 text-purple-600"
                            >
                              Ver historial
                            </button>
                            <button
                              onClick={() => toggleBlock(user.id, user.is_blocked)}
                              disabled={actionLoading === user.id}
                              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-gray-600"
                            >
                              {user.is_blocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                            <button
                              onClick={() => changeRole(user.id, user.role)}
                              disabled={actionLoading === user.id}
                              className="text-xs px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-40 text-blue-600"
                            >
                              {user.role === 'admin' ? '→ User' : '→ Admin'}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id, user.email)}
                              disabled={actionLoading === user.id}
                              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 text-red-500"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}