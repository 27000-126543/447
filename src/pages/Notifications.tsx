import { useState, useEffect, useMemo } from 'react'
import {
  Bell,
  MessageSquare,
  Search,
  Filter,
  Check,
  CheckCheck,
  AlertTriangle,
  FileCheck,
  Info,
  Phone,
  Send,
  XCircle,
  Clock,
  User,
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import EmptyState from '@/components/EmptyState'
import { api } from '@/lib/api'
import { usePermission } from '@/lib/permissions'
import { PERMISSIONS } from '@shared/types'
import type { InboxMessage, SmsRecord } from '@shared/types'
import { formatDate, formatRelativeTime, maskPhone } from '@/lib/format'
import { cn } from '@/lib/utils'

type TabType = 'inbox' | 'sms'
type InboxCategory = 'all' | 'unread' | 'alert' | 'approval' | 'system'

interface InboxResponse {
  list: InboxMessage[]
  total: number
  unreadCount: number
}

interface SmsResponse {
  list: SmsRecord[]
  total: number
}

const inboxCategories: { key: InboxCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'alert', label: '告警' },
  { key: 'approval', label: '审批' },
  { key: 'system', label: '系统' },
]

const typeConfig: Record<string, { label: string; className: string; icon: typeof AlertTriangle }> = {
  alert: { label: '告警', className: 'text-danger bg-danger/10', icon: AlertTriangle },
  approval: { label: '审批', className: 'text-accent-400 bg-accent-500/10', icon: FileCheck },
  system: { label: '系统', className: 'text-info bg-info/10', icon: Info },
}

const smsStatusConfig: Record<string, { label: string; className: string; icon: typeof Send }> = {
  pending: { label: '待发送', className: 'text-slate-400 bg-slate-500/10', icon: Clock },
  sent: { label: '已发送', className: 'text-emerald-400 bg-emerald-500/10', icon: Send },
  failed: { label: '发送失败', className: 'text-rose-400 bg-rose-500/10', icon: XCircle },
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<TabType>('inbox')
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([])
  const [smsRecords, setSmsRecords] = useState<SmsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [inboxCategory, setInboxCategory] = useState<InboxCategory>('all')
  const [searchText, setSearchText] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [smsStatusFilter, setSmsStatusFilter] = useState<string>('')
  const [smsAssigneeFilter, setSmsAssigneeFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [unreadCount, setUnreadCount] = useState(0)

  const canMarkRead = usePermission(PERMISSIONS.NOTIFICATIONS_MARK_READ)

  useEffect(() => {
    fetchData()
  }, [activeTab, inboxCategory, smsStatusFilter, smsAssigneeFilter, page])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'inbox') {
        const params = new URLSearchParams()
        if (inboxCategory !== 'all') {
          if (inboxCategory === 'unread') {
            params.append('unreadOnly', 'true')
          } else {
            params.append('type', inboxCategory)
          }
        }
        params.append('page', String(page))
        params.append('pageSize', String(pageSize))
        const res = await api.get<InboxResponse>(`/notifications/inbox?${params.toString()}`)
        if (res.data) {
          setInboxMessages(res.data.list)
          setUnreadCount(res.data.unreadCount)
        }
      } else {
        const params = new URLSearchParams()
        if (smsStatusFilter) params.append('status', smsStatusFilter)
        if (smsAssigneeFilter) params.append('assignee', smsAssigneeFilter)
        params.append('page', String(page))
        params.append('pageSize', String(pageSize))
        const res = await api.get<SmsResponse>(`/notifications/sms?${params.toString()}`)
        if (res.data) {
          setSmsRecords(res.data.list)
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (ids?: string[]) => {
    const targetIds = ids || Array.from(selectedIds)
    if (targetIds.length === 0) return
    try {
      await api.post('/notifications/inbox/batch-read', { ids: targetIds })
      setInboxMessages(prev => prev.map(m => targetIds.includes(m.id) ? { ...m, read: true } : m))
      setUnreadCount(prev => Math.max(0, prev - targetIds.length))
      setSelectedIds(new Set())
    } catch (e) {
      console.error('Failed to mark as read:', e)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadIds = inboxMessages.filter(m => !m.read).map(m => m.id)
    if (unreadIds.length === 0) return
    handleMarkAsRead(unreadIds)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === inboxMessages.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(inboxMessages.map(m => m.id)))
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredInbox = useMemo(() => {
    if (!searchText) return inboxMessages
    const query = searchText.toLowerCase()
    return inboxMessages.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query)
    )
  }, [inboxMessages, searchText])

  const assigneeOptions = useMemo(() => {
    const assignees = new Set<string>()
    smsRecords.forEach(r => {
      if (r.assigneeUserId) assignees.add(r.assigneeUserId)
      if (r.receiverName) assignees.add(r.receiverName)
    })
    return Array.from(assignees)
  }, [smsRecords])

  const inboxColumns = [
    {
      key: 'select',
      title: (
        <button
          onClick={handleSelectAll}
          className="p-1 rounded hover:bg-slate-700/50 transition-colors"
        >
          {selectedIds.size === inboxMessages.length && inboxMessages.length > 0 ? (
            <CheckCheck className="w-4 h-4 text-accent-400" />
          ) : (
            <div className="w-4 h-4 border border-slate-600 rounded" />
          )}
        </button>
      ),
      width: 40,
      render: (record: InboxMessage) => (
        <button
          onClick={() => handleSelectOne(record.id)}
          className="p-1 rounded hover:bg-slate-700/50 transition-colors"
        >
          {selectedIds.has(record.id) ? (
            <Check className="w-4 h-4 text-accent-400" />
          ) : (
            <div className="w-4 h-4 border border-slate-600 rounded" />
          )}
        </button>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: 80,
      render: (record: InboxMessage) => {
        const config = typeConfig[record.type] || typeConfig.system
        const Icon = config.icon
        return (
          <span className={cn('badge inline-flex items-center gap-1 text-xs', config.className)}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'title',
      title: '标题',
      render: (record: InboxMessage) => (
        <div className="flex items-center gap-2">
          {!record.read && <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0" />}
          <span className={cn('text-sm', !record.read ? 'text-white font-medium' : 'text-slate-400')}>
            {record.title}
          </span>
        </div>
      ),
    },
    {
      key: 'content',
      title: '内容',
      render: (record: InboxMessage) => (
        <span className="text-sm text-slate-400 line-clamp-1">{record.content}</span>
      ),
    },
    {
      key: 'createdAt',
      title: '时间',
      width: 160,
      render: (record: InboxMessage) => (
        <span className="text-sm text-slate-500">{formatRelativeTime(record.createdAt)}</span>
      ),
    },
  ]

  const smsColumns = [
    {
      key: 'phone',
      title: '手机号',
      render: (record: SmsRecord) => (
        <span className="text-sm text-slate-200 font-mono">{maskPhone(record.phone)}</span>
      ),
    },
    {
      key: 'receiverName',
      title: '收件人',
      render: (record: SmsRecord) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-600/50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <span className="text-sm text-slate-200">{record.receiverName}</span>
        </div>
      ),
    },
    {
      key: 'content',
      title: '短信内容',
      render: (record: SmsRecord) => (
        <span className="text-sm text-slate-400 line-clamp-1">{record.content}</span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      width: 80,
      render: (record: SmsRecord) => {
        const labels: Record<string, string> = {
          alert: '告警',
          marketing: '营销',
          verification: '验证',
        }
        return (
          <span className="badge bg-slate-500/15 text-slate-400 border border-slate-500/30 text-xs">
            {labels[record.type] || record.type}
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      width: 100,
      render: (record: SmsRecord) => {
        const config = smsStatusConfig[record.status] || smsStatusConfig.pending
        const Icon = config.icon
        return (
          <span className={cn('badge inline-flex items-center gap-1 text-xs', config.className)}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'sentAt',
      title: '发送时间',
      width: 160,
      render: (record: SmsRecord) => (
        <span className="text-sm text-slate-500">
          {record.sentAt ? formatDate(record.sentAt) : '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1 flex items-center gap-2">
          <Bell className="w-7 h-7 text-accent-400" />
          消息中心
        </h1>
        <p className="text-slate-400 text-sm">管理站内信和短信通知记录</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center border-b border-slate-700/50">
          <button
            onClick={() => {
              setActiveTab('inbox')
              setPage(1)
            }}
            className={cn(
              'px-5 py-3.5 text-sm font-medium transition-all duration-200 relative flex items-center gap-2',
              activeTab === 'inbox' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            站内信
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-accent-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {activeTab === 'inbox' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('sms')
              setPage(1)
            }}
            className={cn(
              'px-5 py-3.5 text-sm font-medium transition-all duration-200 relative flex items-center gap-2',
              activeTab === 'sms' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Phone className="w-4 h-4" />
            短信记录
            {activeTab === 'sms' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-t-full" />
            )}
          </button>
        </div>

        {activeTab === 'inbox' ? (
          <>
            <div className="p-5 border-b border-slate-700/50">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg overflow-x-auto scrollbar-thin">
                  {inboxCategories.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setInboxCategory(cat.key)
                        setPage(1)
                      }}
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
                        inboxCategory === cat.key
                          ? 'bg-accent-500 text-white shadow-glow-accent'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 relative md:ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="搜索消息..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>

                {canMarkRead && (
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => handleMarkAsRead()}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        标记已读 ({selectedIds.size})
                      </button>
                    )}
                    <button
                      onClick={handleMarkAllAsRead}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <CheckCheck className="w-4 h-4" />
                      全部已读
                    </button>
                  </div>
                )}
              </div>
            </div>

            <DataTable
              columns={inboxColumns}
              data={filteredInbox}
              loading={loading}
              rowKey="id"
              emptyText="暂无消息"
              emptyDescription="当前筛选条件下没有消息"
              pagination={{
                page,
                pageSize,
                total: filteredInbox.length,
                onPageChange: setPage,
              }}
            />
          </>
        ) : (
          <>
            <div className="p-5 border-b border-slate-700/50">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="搜索手机号或内容..."
                    className="input-field pl-10"
                  />
                </div>
                <select
                  value={smsAssigneeFilter}
                  onChange={(e) => {
                    setSmsAssigneeFilter(e.target.value)
                    setPage(1)
                  }}
                  className="input-field md:w-40"
                >
                  <option value="">全部责任人</option>
                  {assigneeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <select
                  value={smsStatusFilter}
                  onChange={(e) => {
                    setSmsStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="input-field md:w-32"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待发送</option>
                  <option value="sent">已发送</option>
                  <option value="failed">发送失败</option>
                </select>
                <button
                  onClick={fetchData}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
            </div>

            <DataTable
              columns={smsColumns}
              data={smsRecords}
              loading={loading}
              rowKey="id"
              emptyText="暂无短信记录"
              emptyDescription="当前筛选条件下没有短信记录"
              pagination={{
                page,
                pageSize,
                total: smsRecords.length,
                onPageChange: setPage,
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
