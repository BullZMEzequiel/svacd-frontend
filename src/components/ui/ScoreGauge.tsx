export default function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score))

  const getColor = () => {
    if (clamped >= 75) return '#16a34a'
    if (clamped >= 50) return '#ca8a04'
    if (clamped >= 25) return '#ea580c'
    return '#dc2626'
  }

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={getColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{Math.round(clamped)}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">Índice de veracidad</p>
    </div>
  )
}