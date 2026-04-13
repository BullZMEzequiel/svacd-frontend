'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { analyzeText, analyzeURL, analyzeImage, analyzeDocument, pollJobStatus } from '@/lib/api'
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
    setResult(null)
    setError('')
    setInput('')
    setFile(null)
  }, [type])

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

    try {
      if (type === 'text') {
        setStatus('Analizando texto...')
        const res = await analyzeText(input, userId)
        setResult(res)
      } else if (type === 'url') {
        setStatus('Extrayendo contenido de la URL...')
        const res = await analyzeURL(input, userId)
        setResult(res)
      } else if ((type === 'image' || type === 'document') && file) {
        setStatus(type === 'image' ? 'Subiendo imagen...' : 'Subiendo documento...')
        const job = type === 'image'
          ? await analyzeImage(file, userId)
          : await analyzeDocument(file, userId)

        setStatus(type === 'image' ? 'Analizando imagen...' : 'Extrayendo y analizando texto del documento...')

        pollRef.current = setInterval(async () => {
          const jobStatus = await pollJobStatus(job.job_id)
          if (jobStatus.status === 'done' && jobStatus.result) {
            clearInterval(pollRef.current!)
            setResult(jobStatus.result)
            setLoading(false)
            setStatus('')
          } else if (jobStatus.status === 'error') {
            clearInterval(pollRef.current!)
            setError(jobStatus.error || 'Error procesando archivo')
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

  const config: Record<ContentType, { title: string; icon: string }> = {
    text:     { title: 'Analizar texto',     icon: '📝' },
    url:      { title: 'Analizar URL',        icon: '🔗' },
    image:    { title: 'Analizar imagen',     icon: '🖼️' },
    document: { title: 'Analizar documento',  icon: '📄' },
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900 text-sm">
          {config[type]?.icon} {config[type]?.title}
        </span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex gap-2 mb-8">
          {(['text', 'url', 'image', 'document'] as ContentType[]).map(t => (
            <Link
              key={t}
              href={`/analyze?type=${t}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {config[t].icon} {t.charAt(0).toUpperCase() + t.slice(1)}
            </Link>
          ))}
        </div>

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

          {(type === 'image' || type === 'document') && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                type="file"
                accept={type === 'image'
                  ? 'image/jpeg,image/png,image/webp'
                  : 'application/pdf,text/plain'
                }
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-input"
              />
              {file ? (
                <div>
                  <p className="text-gray-700 font-medium">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-4xl mb-3">{type === 'image' ? '🖼️' : '📄'}</p>
                  <p className="text-gray-600 font-medium mb-1">
                    Haz clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-400">
                    {type === 'image' ? 'JPG, PNG o WEBP' : 'PDF o TXT'}
                  </p>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || ((type === 'image' || type === 'document') && !file)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {status}
              </span>
            ) : 'Verificar contenido'}
          </button>
        </form>

        {result && <AnalysisResult result={result} />}
      </div>
    </main>
  )
}