import { useEffect, useState, type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  trend?: number
  trendUp?: boolean
  icon?: ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'cyan'
  prefix?: string
  suffix?: string
  decimals?: number
}

const gradientMap: Record<string, string> = {
  blue: 'from-blue-500/20 to-transparent',
  green: 'from-emerald-500/20 to-transparent',
  orange: 'from-accent-500/25 to-transparent',
  purple: 'from-purple-500/20 to-transparent',
  pink: 'from-pink-500/20 to-transparent',
  cyan: 'from-cyan-500/20 to-transparent',
}

const iconBgMap: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-emerald-500/20 text-emerald-400',
  orange: 'bg-accent-500/25 text-accent-400',
  purple: 'bg-purple-500/20 text-purple-400',
  pink: 'bg-pink-500/20 text-pink-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
}

function formatNumber(num: number, decimals: number = 0): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(decimals + 1) + '亿'
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(decimals) + '万'
  }
  return num.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export default function StatCard({
  title,
  value,
  trend,
  trendUp,
  icon,
  color = 'blue',
  prefix = '',
  suffix = '',
  decimals = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 40
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, value)
      setDisplayValue(current)
      if (step >= steps) {
        setDisplayValue(value)
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const isTrendingUp = trendUp ?? (trend !== undefined && trend >= 0)

  return (
    <div className={cn('stat-card')}>
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-60 blur-2xl pointer-events-none',
          gradientMap[color]
        )}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-sm text-slate-400 font-medium">{title}</div>
          {icon && (
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgMap[color])}>
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-3xl font-display font-bold text-white tracking-tight">
            {prefix}{formatNumber(displayValue, decimals)}{suffix}
          </span>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1.5">
            {isTrendingUp ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                isTrendingUp ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {isTrendingUp ? '+' : ''}{trend}%
            </span>
            <span className="text-slate-500 text-sm">较上期</span>
          </div>
        )}
      </div>
    </div>
  )
}
