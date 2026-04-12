import { VERACITY_CONFIG } from '@/types/analysis'
import type { VeracityLevel } from '@/types/analysis'

export default function VeracityBadge({ level }: { level: VeracityLevel }) {
  const config = VERACITY_CONFIG[level]
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-sm font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}