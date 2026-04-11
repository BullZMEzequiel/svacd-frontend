export type VeracityLevel =
  | 'verified'
  | 'likely_true'
  | 'uncertain'
  | 'likely_false'
  | 'false'

export type ContentType = 'text' | 'url' | 'image'

export interface AnalysisResponse {
  content_type: ContentType
  veracity_score: number
  veracity_level: VeracityLevel
  summary: string
  indicators: string[]
  sources_checked: string[]
  analyzed_at: string
  job_id: string | null
}

export interface JobStatusResponse {
  job_id: string
  status: 'processing' | 'done' | 'error'
  result: AnalysisResponse | null
  error: string | null
}

export const VERACITY_CONFIG: Record<VeracityLevel, {
  label: string
  color: string
  bg: string
}> = {
  verified:      { label: 'Verificado',        color: '#166534', bg: '#dcfce7' },
  likely_true:   { label: 'Probablemente real', color: '#14532d', bg: '#bbf7d0' },
  uncertain:     { label: 'Incierto',           color: '#92400e', bg: '#fef3c7' },
  likely_false:  { label: 'Probablemente falso',color: '#9a3412', bg: '#ffedd5' },
  false:         { label: 'Falso',              color: '#7f1d1d', bg: '#fee2e2' },
}