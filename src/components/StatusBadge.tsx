import { cn } from '@/lib/utils'

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'refunded' | 'cancelled'
type POStatus = 'draft' | 'finance_pending' | 'finance_rejected' | 'warehouse_pending' | 'warehouse_rejected' | 'approved' | 'rejected' | 'completed'
type AlertLevel = 'critical' | 'warning' | 'info'
type ActivityStatus = 'draft' | 'running' | 'paused' | 'completed'

type StatusType = 'order' | 'po' | 'alert' | 'activity'

interface StatusBadgeProps {
  status: OrderStatus | POStatus | AlertLevel | ActivityStatus
  type: StatusType
  className?: string
}

const orderStatusMap: Record<OrderStatus, { label: string; className: string; dotClass: string }> = {
  pending: {
    label: '待支付',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  paid: {
    label: '已支付',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  shipped: {
    label: '已发货',
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dotClass: 'bg-purple-400',
  },
  completed: {
    label: '已完成',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  refunded: {
    label: '已退款',
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
}

const poStatusMap: Record<POStatus, { label: string; className: string; dotClass: string }> = {
  draft: {
    label: '草稿',
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
  finance_pending: {
    label: '财务审核中',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  finance_rejected: {
    label: '财务已驳回',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
  warehouse_pending: {
    label: '仓库审核中',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  warehouse_rejected: {
    label: '仓库已驳回',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
  approved: {
    label: '已通过',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  rejected: {
    label: '已拒绝',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
  completed: {
    label: '已完成',
    className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    dotClass: 'bg-cyan-400',
  },
}

const alertLevelMap: Record<AlertLevel, { label: string; className: string; dotClass: string }> = {
  critical: {
    label: '严重',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
  warning: {
    label: '警告',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  info: {
    label: '提示',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
}

const activityStatusMap: Record<ActivityStatus, { label: string; className: string; dotClass: string }> = {
  draft: {
    label: '草稿',
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
  running: {
    label: '进行中',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  paused: {
    label: '已暂停',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  completed: {
    label: '已结束',
    className: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
}

function getStatusConfig(status: string, type: StatusType) {
  switch (type) {
    case 'order':
      return orderStatusMap[status as OrderStatus]
    case 'po':
      return poStatusMap[status as POStatus]
    case 'alert':
      return alertLevelMap[status as AlertLevel]
    case 'activity':
      return activityStatusMap[status as ActivityStatus]
    default:
      return { label: status, className: 'bg-slate-500/15 text-slate-400 border-slate-500/30', dotClass: 'bg-slate-400' }
  }
}

export default function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const config = getStatusConfig(status, type)

  return (
    <span className={cn('badge border', config.className, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.dotClass)} />
      {config.label}
    </span>
  )
}
