"use client"

export interface Threshold {
  id: string
  pollutant_code: string
  status_label: string
  min_value: number
  max_value: number
  severity_color: string
}

interface EnvironmentalCardProps {
  title: string
  code: string
  value: number
  unit: string
  thresholds: Threshold[]
}

export function EnvironmentalCard({ title, code, value, unit, thresholds }: EnvironmentalCardProps) {
  // Find matching status threshold from database array
  const matchedThreshold = thresholds.find(
    (t) =>
      t.pollutant_code.toLowerCase() === code.toLowerCase() &&
      value >= t.min_value &&
      value <= t.max_value
  )

  const label = matchedThreshold?.status_label || "Good"
  const color = matchedThreshold?.severity_color || "green"

  // Map database colors to Tailwind CSS styling classes
  const colorMap: Record<string, { dot: string; bar: string }> = {
    green: { dot: "bg-emerald-500", bar: "bg-emerald-500" },
    yellow: { dot: "bg-amber-500", bar: "bg-amber-500" },
    red: { dot: "bg-red-500", bar: "bg-red-500" },
    purple: { dot: "bg-purple-600", bar: "bg-purple-600" },
    gray: { dot: "bg-gray-400", bar: "bg-gray-300" },
  }

  const activeColor = colorMap[color] || colorMap.green

  // Calculate progress bar percentage
  const minVal = matchedThreshold?.min_value ?? 0
  const maxVal = matchedThreshold?.max_value ?? 100
  const progressPercent = Math.min(Math.max(((value - minVal) / (maxVal - minVal)) * 100, 5), 100)

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Title & Top Status Dot */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${activeColor.dot}`} />
      </div>

      {/* Numerical Value */}
      <div className="my-4 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-gray-900">{value}</span>
        <span className="text-sm font-medium text-gray-500">{unit}</span>
      </div>

      {/* Dynamic Progress Bar & Status Text */}
      <div className="space-y-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full transition-all duration-500 ${activeColor.bar}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-right text-xs font-semibold text-gray-600">{label}</div>
      </div>
    </div>
  )
}