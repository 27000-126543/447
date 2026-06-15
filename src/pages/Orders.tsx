import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  Download,
  ShoppingCart,
  Clock,
  CheckCircle,
  RotateCcw,
  DollarSign,
  Filter,
  ChevronDown,
  Eye,
} from 'lucide-react'
import DataTable, { type Column } from '@/components/DataTable'
import ChannelBadge from '@/components/ChannelBadge'
import StatusBadge from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, maskPhone } from '@/lib/format'
import type { Order, OrderListResponse, OrderChannel, OrderStatus } from '@shared/types'

interface OrderFilters {
  channel: OrderChannel | ''
  status: OrderStatus | ''
  region: string
  keyword: string
  startTime: string
  endTime: string
}

const CHANNEL_OPTIONS: { value: OrderChannel | ''; label: string }[] = [
  { value: '', label: '全部渠道' },
  { value: 'self', label: '自营商城' },
  { value: 'social', label: '社交平台' },
  { value: 'distributor', label: '第三方分销' },
]

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'refunded', label: '已退款' },
  { value: 'cancelled', label: '已取消' },
]

const REGION_OPTIONS = [
  { value: '', label: '全部区域' },
  { value: '华北', label: '华北' },
  { value: '华东', label: '华东' },
  { value: '华南', label: '华南' },
  { value: '华中', label: '华中' },
  { value: '西南', label: '西南' },
  { value: '西北', label: '西北' },
]

export default function Orders() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<OrderFilters>({
    channel: '',
    status: '',
    region: '',
    keyword: '',
    startTime: '',
    endTime: '',
  })

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))
      if (filters.channel) params.append('channel', filters.channel)
      if (filters.status) params.append('status', filters.status)
      if (filters.region) params.append('region', filters.region)
      if (filters.keyword) params.append('keyword', filters.keyword)
      if (filters.startTime) params.append('startTime', filters.startTime)
      if (filters.endTime) params.append('endTime', filters.endTime)

      const res = await api.get<OrderListResponse>(`/orders?${params.toString()}`)
      setOrders(res.data.list)
      setTotal(res.data.total)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleReset = () => {
    setFilters({
      channel: '',
      status: '',
      region: '',
      keyword: '',
      startTime: '',
      endTime: '',
    })
    setPage(1)
  }

  const handleExport = () => {
    alert('导出功能开发中...')
  }

  const stats = {
    total,
    pending: orders.filter((o) => o.status === 'pending' || o.status === 'paid').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    refunded: orders.filter((o) => o.status === 'refunded').length,
    amount: orders.reduce((sum, o) => sum + o.amount, 0),
  }

  const columns: Column<Order>[] = [
    {
      key: 'orderNo',
      title: '订单号',
      dataIndex: 'orderNo',
      render: (record) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/orders/${record.id}`)
          }}
          className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
        >
          {record.orderNo}
        </button>
      ),
    },
    {
      key: 'channel',
      title: '渠道',
      render: (record) => <ChannelBadge channel={record.channel} />,
    },
    {
      key: 'user',
      title: '用户信息',
      render: (record) => (
        <div>
          <div className="text-white font-medium">{record.userName}</div>
          <div className="text-xs text-slate-400 mt-0.5">{maskPhone(record.userPhone)}</div>
        </div>
      ),
    },
    {
      key: 'region',
      title: '区域',
      dataIndex: 'region',
      render: (record) => <span className="text-slate-300">{record.region}</span>,
    },
    {
      key: 'amount',
      title: '金额',
      dataIndex: 'amount',
      align: 'right',
      render: (record) => (
        <span className="text-white font-medium">{formatCurrency(record.amount)}</span>
      ),
    },
    {
      key: 'quantity',
      title: '商品数量',
      align: 'center',
      render: (record) => (
        <span className="text-slate-300">
          {record.items.reduce((sum, item) => sum + item.quantity, 0)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (record) => <StatusBadge status={record.status} type="order" />,
    },
    {
      key: 'createdAt',
      title: '下单时间',
      render: (record) => <span className="text-slate-400 text-sm">{formatDate(record.createdAt)}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      align: 'center',
      render: (record) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/orders/${record.id}`)
          }}
          className="btn-ghost text-xs flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          详情
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">订单管理</h1>
          <p className="text-sm text-slate-400">全渠道订单查询与管理</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="relative">
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value as OrderChannel | '' })}
              className="input-field appearance-none pr-10"
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as OrderStatus | '' })}
              className="input-field appearance-none pr-10"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className="input-field appearance-none pr-10"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div>
            <input
              type="date"
              value={filters.startTime}
              onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
              className="input-field"
              placeholder="开始日期"
            />
          </div>
          <div>
            <input
              type="date"
              value={filters.endTime}
              onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
              className="input-field"
              placeholder="结束日期"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1)
                  fetchOrders()
                }
              }}
              className="input-field pl-9"
              placeholder="搜索订单号/姓名/手机号"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button className="btn-primary" onClick={() => { setPage(1); fetchOrders() }}>
            查询
          </button>
          <button className="btn-secondary flex items-center gap-1.5" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
          <button className="btn-secondary flex items-center gap-1.5 ml-auto" onClick={handleExport}>
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-slate-400">订单总数</span>
          </div>
          <div className="text-xl font-display font-bold text-white">{stats.total}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs text-slate-400">待处理</span>
          </div>
          <div className="text-xl font-display font-bold text-white">{stats.pending}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400">已完成</span>
          </div>
          <div className="text-xl font-display font-bold text-white">{stats.completed}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-xs text-slate-400">退款数</span>
          </div>
          <div className="text-xl font-display font-bold text-white">{stats.refunded}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent-400" />
            </div>
            <span className="text-xs text-slate-400">总金额</span>
          </div>
          <div className="text-xl font-display font-bold text-white">{formatCurrency(stats.amount, 0)}</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        rowKey="id"
        onRowClick={(record) => navigate(`/orders/${record.id}`)}
        emptyText="暂无订单数据"
        emptyDescription="请尝试调整筛选条件"
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
        }}
      />

      {loading && orders.length === 0 && (
        <div className="flex items-center justify-center h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </div>
  )
}
