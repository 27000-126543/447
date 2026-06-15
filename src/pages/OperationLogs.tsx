import { useCallback, useEffect, useState } from 'react'
import {
  Search, Filter, Calendar, User, Shield,
  RefreshCw, FileText, Clock,
  MapPin, Eye
} from 'lucide-react'
import DataTable from '@/components/DataTable'
import Modal from '@/components/Modal'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OperationLog } from '@shared/types'
import type { Column } from '@/components/DataTable'

interface LogListResponse {
  list: OperationLog[]
  total: number
  page: number
  pageSize: number
}

const actionTypeOptions = [
  { key: '', label: '全部动作' },
  { key: 'create', label: '创建' },
  { key: 'update', label: '更新' },
  { key: 'delete', label: '删除' },
  { key: 'login', label: '登录' },
  { key: 'export', label: '导出' },
  { key: 'approve', label: '审核' },
]

const roleOptions = [
  { key: '', label: '全部角色' },
  { key: 'super_admin', label: '超级管理员' },
  { key: 'region_manager', label: '区域经理' },
  { key: 'operator', label: '运营专员' },
  { key: 'finance', label: '财务审核' },
  { key: 'warehouse', label: '仓储管理员' },
]

const userOptions = [
  { key: '', label: '全部用户' },
  { key: 'user-1', label: '张三' },
  { key: 'user-2', label: '李四' },
  { key: 'user-3', label: '王五' },
  { key: 'user-4', label: '赵六' },
]

const actionColorMap: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  update: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  delete: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  login: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  export: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approve: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
}

const actionLabelMap: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  login: '登录',
  export: '导出',
  approve: '审核',
}

export default function OperationLogs() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [filters, setFilters] = useState({
    userId: '',
    userRole: '',
    action: '',
    keyword: '',
    startTime: '',
    endTime: '',
  })

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null)
  const [showFilters, setShowFilters] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.startTime && { startTime: filters.startTime }),
        ...(filters.endTime && { endTime: filters.endTime }),
      })
      const res = await api.get<LogListResponse>(`/settings/logs?${params.toString()}`)
      setLogs(res.data.list)
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    setFilters({
      userId: '',
      userRole: '',
      action: '',
      keyword: '',
      startTime: '',
      endTime: '',
    })
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleViewDetail = (log: OperationLog) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  const columns: Column<OperationLog>[] = [
    {
      key: 'createdAt',
      title: '时间',
      width: 170,
      render: (record) => (
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-300 font-mono text-xs">{formatDate(record.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'userName',
      title: '操作人',
      width: 140,
      render: (record) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {record.userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{record.userName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'userRole',
      title: '角色',
      width: 120,
      render: (record) => (
        <span className="badge bg-slate-700/70 text-slate-300 border border-slate-600/50">
          <Shield className="w-3 h-3 mr-1" />
          {record.userRole}
        </span>
      ),
    },
    {
      key: 'action',
      title: '动作',
      width: 90,
      render: (record) => {
        const actionKey = Object.keys(actionLabelMap).find(k => record.action.includes(k)) || 'update'
        return (
          <span className={cn(
            'badge border',
            actionColorMap[actionKey] || 'bg-slate-700/70 text-slate-300 border-slate-600/50'
          )}>
            {actionLabelMap[actionKey] || record.action}
          </span>
        )
      },
    },
    {
      key: 'target',
      title: '目标对象',
      width: 150,
      render: (record) => (
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-slate-300 text-sm truncate">{record.target}</span>
        </div>
      ),
    },
    {
      key: 'detail',
      title: '详情摘要',
      render: (record) => (
        <div className="text-slate-400 text-sm truncate max-w-xs" title={record.detail}>
          {record.detail}
        </div>
      ),
    },
    {
      key: 'ip',
      title: 'IP地址',
      width: 130,
      render: (record) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-slate-400 text-sm font-mono">{record.ip || '-'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: 80,
      align: 'right',
      render: (record) => (
        <button
          onClick={() => handleViewDetail(record)}
          className="btn-ghost text-xs px-2 py-1 text-accent-400"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          详情
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">操作审计日志</h1>
          <p className="text-slate-400 text-sm mt-1">记录所有系统操作行为，支持追溯与审计</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'btn-secondary flex items-center gap-2',
              showFilters && 'border-accent-500/50 text-accent-400'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="glass-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <User className="w-3 h-3" />
                用户
              </label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                className="input-field text-sm py-2"
              >
                {userOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                角色
              </label>
              <select
                value={filters.userRole}
                onChange={(e) => setFilters(prev => ({ ...prev, userRole: e.target.value }))}
                className="input-field text-sm py-2"
              >
                {roleOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                动作类型
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="input-field text-sm py-2"
              >
                {actionTypeOptions.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Search className="w-3 h-3" />
                关键词
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索动作/详情/用户"
                className="input-field text-sm py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                开始时间
              </label>
              <input
                type="date"
                value={filters.startTime}
                onChange={(e) => setFilters(prev => ({ ...prev, startTime: e.target.value }))}
                className="input-field text-sm py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                结束时间
              </label>
              <input
                type="date"
                value={filters.endTime}
                onChange={(e) => setFilters(prev => ({ ...prev, endTime: e.target.value }))}
                className="input-field text-sm py-2"
              />
            </div>

            <div className="lg:col-span-2 flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="btn-primary flex-1 h-[38px]"
              >
                <Search className="w-4 h-4 mr-1.5 inline" />
                查询
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary flex-1 h-[38px]"
              >
                <RefreshCw className="w-4 h-4 mr-1.5 inline" />
                重置
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              共 <span className="text-white font-semibold">{total}</span> 条记录
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>动作图例：</span>
              {Object.entries(actionLabelMap).slice(0, 4).map(([key, label]) => (
                <span
                  key={key}
                  className={cn('badge border', actionColorMap[key])}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DataTable<OperationLog>
          columns={columns}
          data={logs}
          loading={loading}
          rowKey={(record) => record.id}
          striped
          hoverable
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: (size) => { setPageSize(size); setPage(1) },
            pageSizeOptions: [10, 20, 50, 100],
          }}
          emptyText="暂无日志记录"
          emptyDescription="暂无符合条件的操作日志"
        />
      </div>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="日志详情"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">操作时间</label>
                <div className="text-white font-medium">{formatDate(selectedLog.createdAt)}</div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">日志ID</label>
                <div className="text-slate-300 font-mono text-sm">{selectedLog.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">操作人</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-medium">
                    {selectedLog.userName.charAt(0)}
                  </div>
                  <span className="text-white font-medium">{selectedLog.userName}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">用户角色</label>
                <span className="badge bg-slate-700/70 text-slate-300 border border-slate-600/50">
                  <Shield className="w-3 h-3 mr-1" />
                  {selectedLog.userRole}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">操作动作</label>
                <span className={cn(
                  'badge border',
                  actionColorMap[selectedLog.action] || 'bg-slate-700/70 text-slate-300 border-slate-600/50'
                )}>
                  {actionLabelMap[selectedLog.action] || selectedLog.action}
                </span>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">IP地址</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300 font-mono">{selectedLog.ip || '-'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">目标对象</label>
              <div className="glass-card p-3">
                <div className="text-white text-sm">{selectedLog.target}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">操作详情</label>
              <div className="glass-card p-4 bg-slate-900/60">
                <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedLog.detail}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
