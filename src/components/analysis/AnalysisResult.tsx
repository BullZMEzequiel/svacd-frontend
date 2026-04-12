import type { AnalysisResponse } from '@/types/analysis'
import VeracityBadge from '@/components/ui/VeracityBadge'
import ScoreGauge from '@/components/ui/ScoreGauge'

export default function AnalysisResult({ result }: { result: AnalysisResponse }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <ScoreGauge score={result.veracity_score} />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <VeracityBadge level={result.veracity_level} />
            <span className="text-sm text-gray-400 capitalize">{result.content_type}</span>
          </div>
          <p className="text-gray-700 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {result.indicators.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Indicadores detectados</h3>
          <ul className="space-y-2">
            {result.indicators.map((indicator, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs flex-shrink-0">!</span>
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.sources_checked.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Fuentes consultadas</h3>
          <ul className="space-y-1">
            {result.sources_checked.map((source, i) => (
              <li key={i} className="text-sm text-gray-500">— {source}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Analizado el {new Date(result.analyzed_at).toLocaleString('es-ES')}
      </p>
    </div>
  )
}