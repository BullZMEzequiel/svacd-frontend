const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

import type { AnalysisResponse, JobStatusResponse } from '@/types/analysis'

export async function analyzeText(
  content: string,
  userId?: string
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_URL}/api/v1/analysis/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, user_id: userId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error analizando texto')
  }
  return res.json()
}

export async function analyzeURL(
  url: string,
  userId?: string
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_URL}/api/v1/analysis/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, user_id: userId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error analizando URL')
  }
  return res.json()
}

export async function analyzeImage(
  file: File,
  userId?: string
): Promise<JobStatusResponse> {
  const form = new FormData()
  form.append('file', file)
  if (userId) form.append('user_id', userId)

  const res = await fetch(`${API_URL}/api/v1/analysis/image`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error analizando imagen')
  }
  return res.json()
}

export async function pollJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_URL}/api/v1/analysis/jobs/${jobId}`)
  if (!res.ok) throw new Error('Error consultando estado del job')
  return res.json()
}

export async function getHistory(userId: string): Promise<AnalysisResponse[]> {
  const res = await fetch(`${API_URL}/api/v1/analysis/history/${userId}`)
  if (!res.ok) throw new Error('Error obteniendo historial')
  return res.json()
}
export async function analyzeDocument(
  file: File,
  userId?: string
): Promise<JobStatusResponse> {
  const form = new FormData()
  form.append('file', file)
  if (userId) form.append('user_id', userId)

  const res = await fetch(`${API_URL}/api/v1/analysis/document`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Error analizando documento')
  }
  return res.json()
}