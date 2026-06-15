import { useState, useEffect, useMemo } from 'react'
import {
  Database,
  ShoppingCart,
  Eye,
  Play,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Wrench,
  Flag,
} from 'lucide-react'
import Modal from '@/components/Modal'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { api } from '@/lib/api'
import { usePermission } from '@/lib/permissions'
import { PERMISSIONS } from '@shared/types'
import type { DataCollectionTask, CleanRecord } from '@shared/types'
import { formatDate, formatNumber, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TaskListResponse {
  list: DataCollectionTask[]
}

interface CleanRecordsResponse {
  list: CleanRecord[]
  stats: {
    duplicate: number
    missing_phone: number
    abnormal_amount: number
    other: number
  }
}

const channelConfig = {
  self: { name: '自营商城', color: 'from-blue-500 to-cyan-500', icon: ShoppingCart },
  social: { name: '社交平台', color: 'from-pink-500 to-rose-500', icon: Eye },
  distributor: { name: '第三方分销', color: 'from-amber-500 to-orange-500', icon: Database },
}

const typeConfig = {
  orders: { name: '订单同步', description: '同步各渠道订单数据' },
  browsing: { name: '浏览数据同步', description: '同步用户浏览行为数据' },
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  idle: { label: '待运行', className: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: Clock },
  running: { label: '运行中', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: RefreshCw },
  completed: { label: '已完成', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  failed: { label: '失败', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: XCircle },
}

const issueTypeConfig: Record<string, { label: string; className: string }> = {
  duplicate: { label: '重复订单', className: 'text-amber-400' },
  missing_phone: { label: '缺手机号', className: 'text-rose-400' },
  abnormal_amount: { label: '异常金额', className: 'text-danger' },
  invalid_status: { label: '无效状态', className: 'text-warning' },
  other: { label: '其他', className: 'text-slate-400' },
}

const actionTypeConfig: Record<string, { label: string; className: string; icon: typeof Trash2 }> = {
  discarded: { label: '丢弃', className: 'text-rose-400 bg-rose-500/10', icon: Trash2 },
  fixed: { label: '修复', className: 'text-emerald-400 bg-emerald-500/10', icon: Wrench },
  flagged: { label: '标记', className: 'text-amber-400 bg-amber-500/10', icon: Flag },
}

export default function DataCollection() {
  const [tasks, setTasks] = useState<DataCollectionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<DataCollectionTask | null>(null)
  const [cleanRecords, setCleanRecords] = useState<CleanRecord[]>([])
  const [cleanStats, setCleanStats] = useState<CleanRecordsResponse['stats'] | null>(null)
  const [showCleanModal, setShowCleanModal] = useState(false)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)

  const canTrigger = usePermission(PERMISSIONS.COLLECTION_TRIGGER)

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await api.get<TaskListResponse>('/collection/tasks')
      if (res.data) {
        setTasks(res.data.list)
      }
    } catch (e) {
      console.error('Failed to fetch collection tasks:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async (taskId: string) => {
    try {
      setTriggeringId(taskId)
      await api.post(`/collection/tasks/${taskId}/trigger`)
      fetchTasks()
    } catch (e) {
      console.error('Failed to trigger task:', e)
    } finally {
      setTriggeringId(null)
    }
  }

  const handleViewCleanRecords = async (task: DataCollectionTask) => {
    try {
      setSelectedTask(task)
      setShowCleanModal(true)
      const res = await api.get<CleanRecordsResponse>(`/collection/tasks/${task.id}/clean-records`)
      if (res.data) {
        setCleanRecords(res.data.list)
        setCleanStats(res.data.stats)
      }
    } catch (e) {
      console.error('Failed to fetch clean records:', e)
    }
  }

  const groupedTasks = useMemo(() => {
    const groups: Record<string, DataCollectionTask[]> = {
      self: [],
      social: [],
      distributor: [],
    }
    tasks.forEach(task => {
      if (groups[task.channel]) {
        groups[task.channel].push(task)
      }
    })
    return groups
  }, [tasks])

  const columns = [
    {
      key: 'issueType',
      title: '脏数据类型',
      render: (record: CleanRecord) => {
        const config = issueTypeConfig[record.issueType] || issueTypeConfig.other
        return (
          <span className={cn('text-sm font-medium', config.className)}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'issueDescription',
      title: '问题描述',
      render: (record: CleanRecord) => (
        <span className="text-sm text-slate-300">{record.issueDescription}</span>
      ),
    },
    {
      key: 'action',
      title: '处理方式',
      render: (record: CleanRecord) => {
        const config = actionTypeConfig[record.action] || actionTypeConfig.flagged
        const Icon = config.icon
        return (
          <span className={cn('badge inline-flex items-center gap-1', config.className)}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      title: '处理时间',
      render: (record: CleanRecord) => (
        <span className="text-sm text-slate-400">{formatDate(record.createdAt)}</span>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1 flex items-center gap-2">
          <Database className="w-7 h-7 text-accent-400" />
          数据采集中心
        </h1>
        <p className="text-slate-400 text-sm">管理各渠道数据采集任务与清洗质量监控</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(Object.keys(channelConfig) as Array<keyof typeof channelConfig>).map(channel => {
          const config = channelConfig[channel]
          const channelTasks = groupedTasks[channel] || []
          const ChannelIcon = config.icon

          return (
            <div key={channel} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', config.color)}>
                  <ChannelIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                  <p className="text-xs text-slate-500">{channelTasks.length} 个采集任务</p>
                </div>
              </div>

              <div className="space-y-4">
                {channelTasks.map(task => {
                  const typeConf = typeConfig[task.type]
                  const statusConf = statusConfig[task.status]
                  const StatusIcon = statusConf.icon

                  return (
                    <div key={task.id} className="glass-card-hover p-4 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white">{typeConf.name}</h4>
                            <span className={cn('badge border text-xs', statusConf.className)}>
                              <StatusIcon className={cn('w-3 h-3 mr-1', task.status === 'running' && 'animate-spin')} />
                              {statusConf.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{typeConf.description}</p>
                        </div>
                        {canTrigger && task.status !== 'running' && (
                          <button
                            onClick={() => handleTrigger(task.id)}
                            disabled={triggeringId === task.id}
                            className="p-2 rounded-lg bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 transition-colors disabled:opacity-50"
                            title="手动触发"
                          >
                            <Play className={cn('w-4 h-4', triggeringId === task.id && 'animate-pulse')} />
                          </button>
                        )}
                      </div>

                      {task.status === 'running' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span>采集进度</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all duration-500"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-lg font-bold text-white">{formatNumber(task.collected)}</div>
                          <div className="text-[10px] text-slate-500">采集数</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-lg font-bold text-emerald-400">{formatNumber(task.cleaned)}</div>
                          <div className="text-[10px] text-slate-500">清洗数</div>
                        </div>
                        <div className="text-center p-2 bg-slate-800/50 rounded-lg">
                          <div className="text-lg font-bold text-rose-400">{formatNumber(task.discarded)}</div>
                          <div className="text-[10px] text-slate-500">丢弃数</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          最近同步：{task.completedAt ? formatRelativeTime(task.completedAt) : '未同步'}
                        </span>
                        <button
                          onClick={() => handleViewCleanRecords(task)}
                          className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
                        >
                          查看清洗记录
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={showCleanModal}
        onClose={() => {
          setShowCleanModal(false)
          setSelectedTask(null)
          setCleanRecords([])
          setCleanStats(null)
        }}
        title={selectedTask ? `清洗记录 - ${channelConfig[selectedTask.channel]?.name} ${typeConfig[selectedTask.type]?.name}` : ''}
        size="xl"
        footer={
          <button
            onClick={() => {
              setShowCleanModal(false)
              setSelectedTask(null)
            }}
            className="btn-secondary"
          >
            关闭
          </button>
        }
      >
        {cleanStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="glass-card-hover p-4 text-center rounded-xl">
              <div className="text-2xl font-bold text-amber-400">{cleanStats.duplicate}</div>
              <div className="text-xs text-slate-500">重复订单</div>
            </div>
            <div className="glass-card-hover p-4 text-center rounded-xl">
              <div className="text-2xl font-bold text-rose-400">{cleanStats.missing_phone}</div>
              <div className="text-xs text-slate-500">缺手机号</div>
            </div>
            <div className="glass-card-hover p-4 text-center rounded-xl">
              <div className="text-2xl font-bold text-danger">{cleanStats.abnormal_amount}</div>
              <div className="text-xs text-slate-500">异常金额</div>
            </div>
            <div className="glass-card-hover p-4 text-center rounded-xl">
              <div className="text-2xl font-bold text-slate-400">{cleanStats.other}</div>
              <div className="text-xs text-slate-500">其他</div>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={cleanRecords}
          rowKey="id"
          emptyText="暂无清洗记录"
          emptyDescription="该任务暂无数据清洗记录"
        />
      </Modal>
    </div>
  )
}
