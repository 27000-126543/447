import { Store, Share2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChannelType = 'self' | 'social' | 'distributor'

interface ChannelBadgeProps {
  channel: ChannelType
  showIcon?: boolean
  className?: string
}

const channelMap: Record<ChannelType, { label: string; className: string; icon: typeof Store }> = {
  self: {
    label: '自营商城',
    className: 'bg-accent-500/15 text-accent-400 border-accent-500/30',
    icon: Store,
  },
  social: {
    label: '社交平台',
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: Share2,
  },
  distributor: {
    label: '第三方分销',
    className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    icon: Users,
  },
}

export default function ChannelBadge({ channel, showIcon = true, className }: ChannelBadgeProps) {
  const config = channelMap[channel]
  const Icon = config.icon

  return (
    <span className={cn('badge border', config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1.5" />}
      {config.label}
    </span>
  )
}
