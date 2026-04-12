'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { analyzeText, analyzeURL, analyzeImage, pollJobStatus } from '@/lib/api'
import AnalysisResult from '@/components/analysis/AnalysisResult'
import type { AnalysisResponse, ContentType } from '@/types/analysis'
import Link from 'next/link'

export default function AnalyzePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = (searchParams.get('type') as ContentType) || 'text'

  const [userId, setUserId] = useState<string | undefined>()
  const [input, setInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth/login'); return }
      setUserId(data.user.id)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    setStatus('Analizando contenido...')

    try {
      if (type === 'text') {
        const res = await analyzeText(input, userId)
        setResult(res)
      } else if (type === 'url') {
        setStatus('Extrayendo contenido de la URL...')
        const res = await analyzeURL(input, userId)
        setResult(res)
      } else if (type === 'image' && file) {
        setStatus('Subiendo imagen...')
        const job = await analyzeImage(file, userId)
        setStatus('Procesando imagen...')
        pollRef.current = setInterval(async () => {
          const status = await pollJobStatus(job.job_id)
          if (status.status === 'done' && status.result) {
            clearInterval(pollRef.current!)
            setResult(status.result)
            setLoading(false)
            setStatus('')
          } else if (status.status === 'error') {
            clearInterval(pollRef.current!)
            setError(status.error || 'Error procesando imagen')
            setLoading(false)
            setStatus('')
          }
        }, 3000)
        return
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    }

    setLoading(false)
    setStatus('')
  }

  const titles: Record<ContentType, string> = {
    text: 'Analizar texto',
    url: 'Analizar URL',
    image: 'Analizar imagen',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          ← Dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900">{titles[type]}</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {type === 'text' && (
            <textarea
              required
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pega aquí el texto o noticia que deseas verificar..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white resize-none"
            />
          )}

          {type === 'url' && (
            <input
              type="url"
              required
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="https://ejemplo.com/noticia"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          )}

          {type === 'image' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                {file ? (
                  <p className="text-gray-700 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-gray-500 mb-1">Haz clic para seleccionar una imagen</p>
                    <p className="text-xs text-gray-400">JPG, PNG o WEBP</p>
                  </>
                )}
              </label>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (type === 'image' && !file)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? status : 'Verificar contenido'}
          </button>
        </form>

        {result && <AnalysisResult result={result} />}
      </div>
    </main>
  )
}