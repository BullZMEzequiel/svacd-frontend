'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getHistory } from '@/lib/api'
import VeracityBadge from '@/components/ui/VeracityBadge'
import Link from 'next/link'
import type { AuthUser } from '@/types/auth'
import type { AnalysisResponse } from '@/types/analysis'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [history, setHistory] = useState<AnalysisResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      setUser({ id: data.user.id, email: data.user.email })
      try {
        const h = await getHistory(data.user.id)
        setHistory(h)
      } catch {
        setHistory([])
      }
      setLoading(false)
    })
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">SVACD</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           {[
              { type: 'text',     label: 'Texto',      icon: '📝', desc: 'Pega un fragmento de texto o noticia' },
              { type: 'url',      label: 'URL',        icon: '🔗', desc: 'Ingresa un enlace para analizar' },
              { type: 'image',    label: 'Imagen',     icon: '🖼️', desc: 'Sube JPG, PNG o WEBP' },
              { type: 'document', label: 'Documento',  icon: '📄', desc: 'Sube un PDF o TXT' },
            ].map(item => (
        <Link
    key={item.type}
    href={`/analyze?type=${item.type}`}
    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
    <span className="text-3xl">{item.icon}</span>
         <div>
      <p className="font-semibold text-gray-900">Analizar {item.label}</p>
      <p className="text-xs text-gray-400">{item.desc}</p>
          </div>
        </Link>
      ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Historial de análisis
            <span className="ml-2 text-sm font-normal text-gray-400">({history.length})</span>
          </h2>

          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Aún no has realizado ningún análisis.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{item.summary}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.content_type.toUpperCase()} · {new Date(item.analyzed_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-700">{Math.round(item.veracity_score)}</span>
                    <VeracityBadge level={item.veracity_level} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}