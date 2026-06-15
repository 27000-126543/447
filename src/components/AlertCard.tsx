import { AlertTriangle, AlertCircle, Info, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertLevel = 'critical' | 'warning' | 'info'

interface AlertCardProps {
  id?: string
  level: AlertLevel
  title: string
  description?: string
  channel?: string
  time?: string
  assignee?: string
  status?: 'pending' | 'processing' | 'resolved'
  onClick?: () => void
  className?: string
}

const levelConfig: Record<
  AlertLevel,
  {
    Icon: typeof AlertTriangle
    iconColor: string
    iconBg: string
    borderColor: string
    pulseColor: string
    badgeBg: string
    badgeText: string
  }
> = {
  critical: {
    Icon: AlertTriangle,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    pulseColor: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    badgeBg: 'bg-rose-500/15 text-rose-400',
    badgeText: '严重',
  },
  warning: {
    Icon: AlertCircle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    pulseColor: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    badgeBg: 'bg-amber-500/15 text-amber-400',
    badgeText: '警告',
  },
  info: {
    Icon: Info,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    pulseColor: '',
    badgeBg: 'bg-blue-500/15 text-blue-400',
    badgeText: '提示',
  },
}

const statusMap: Record<'pending' | 'processing' | 'resolved', { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-amber-500/15 text-amber-400' },
  processing: { label: '处理中', className: 'bg-blue-500/15 text-blue-400' },
  resolved: { label: '已解决', className: 'bg-emerald-500/15 text-emerald-400' },
}

export default function AlertCard({
  level,
  title,
  description,
  channel,
  time,
  assignee,
  status,
  onClick,
  className,
}: AlertCardProps) {
  const config = levelConfig[level]
  const { Icon, iconColor, iconBg, borderColor, pulseColor, badgeBg, badgeText } = config

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card-hover p-4 border transition-all duration-300',
        borderColor,
        pulseColor,
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'relative w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            iconBg
          )}
        >
          <Icon className={cn('w-5 h-5', iconColor)} />
          {level === 'critical' && (
            <span
              className={cn(
                'absolute inset-0 rounded-lg animate-ping opacity-40',
                iconBg
              )}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-sm font-medium text-white truncate">{title}</h4>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn('badge', badgeBg)}>{badgeText}</span>
              {status && <span className={cn('badge', statusMap[status].className)}>{statusMap[status].label}</span>}
            </div>
          </div>

          {description && (
            <p className="text-sm text-slate-400 leading-relaxed mb-2 line-clamp-2">{description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {channel && (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {channel}
              </span>
            )}
            {time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {time}
              </span>
            )}
            {assignee && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {assignee}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
