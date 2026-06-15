import { type ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title = '暂无数据',
  description = '当前列表为空',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6', className)}>
      <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-5 border border-slate-700/50">
        {icon ?? <Inbox className="w-10 h-10 text-slate-500" />}
      </div>
      <h3 className="text-lg font-medium text-slate-200 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 mb-5 text-center max-w-xs">{description}</p>
      {action}
    </div>
  )
}
