import { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Package,
} from 'lucide-react'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import { api } from '@/lib/api'
import type { PurchaseOrder, POStatus } from '@shared/types'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type TabType = 'pending' | 'my' | 'all'

const PO_STATUS_OPTIONS: { value: POStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'finance_pending', label: '财务待审批' },
  { value: 'warehouse_pending', label: '仓储待确认' },
  { value: 'approved', label: '审批通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'completed', label: '已完成' },
]

const TAB_LABELS: Record<TabType, string> = {
  pending: '待我审批',
  my: '我发起的',
  all: '全部',
}

interface PurchaseListResponse {
  list: PurchaseOrder[]
  total: number
  page: number
  pageSize: number
}

export default function PurchaseApproval() {
  const [data, setData] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [statusFilter, setStatusFilter] = useState<POStatus | ''>('')
  const [dateFilter, setDateFilter] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('')
  const [detailModal, setDetailModal] = useState<PurchaseOrder | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const res = await api.get<PurchaseListResponse>(
        `/inventory/purchase?${params.toString()}`
      )
      if (res.data) {
        let list = res.data.list
        if (activeTab === 'my') {
          list = list.filter((p) => p.createdBy === '王俊杰')
        } else if (activeTab === 'pending') {
          list = list.filter(
            (p) => p.status === 'finance_pending' || p.status === 'warehouse_pending'
          )
        }
        if (creatorFilter) {
          list = list.filter((p) => p.createdBy.includes(creatorFilter))
        }
        setData(list)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openDetail = (po: PurchaseOrder) => {
    setDetailModal(po)
    setActionType(null)
    setComment('')
  }

  const handleAction = async () => {
    if (!detailModal || !actionType) return
    try {
      setSubmitting(true)
      const endpoint =
        actionType === 'approve'
          ? `/inventory/purchase/${detailModal.id}/approve`
          : `/inventory/purchase/${detailModal.id}/reject`
      await api.post(endpoint, { comment: comment || undefined })
      setDetailModal(null)
      setActionType(null)
      setComment('')
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const getApprovalStepLabel = (step: number): string => {
    const labels = ['草稿', '运营提交', '财务审核', '仓储审核', '完成']
    return labels[step] || `步骤${step}`
  }

  const getStepStatus = (history: PurchaseOrder['approvalHistory'], step: number, status: POStatus) => {
    const found = history.find((h) => h.step === step)
    if (found) {
      return found.action === 'reject' ? 'rejected' : 'completed'
    }
    if (status === 'rejected' && step > history.length) return 'pending'
    if (step === history.length + 1 && status !== 'rejected' && status !== 'completed') return 'current'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1 flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7 text-accent-400" />
          采购审批流程
        </h1>
        <p className="text-slate-400 text-sm">管理采购单的审批流程与进度跟踪</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center border-b border-slate-700/50">
          {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-3.5 text-sm font-medium transition-all duration-200 relative',
                activeTab === tab
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {TAB_LABELS[tab]}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5 border-b border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="搜索创建人..."
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as POStatus | '')}
              className="input-field md:w-48"
            >
              {PO_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-field pl-10 md:w-48"
              />
            </div>
            <button
              onClick={fetchData}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              筛选
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="data-table">
            <thead>
              <tr>
                <th>采购单号</th>
                <th>创建人</th>
                <th className="text-center">商品数</th>
                <th className="text-right">总金额</th>
                <th>当前审批节点</th>
                <th>创建时间</th>
                <th>预计到货日</th>
                <th className="text-right" style={{ width: 200 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map((po, index) => (
                <tr key={po.id} className={cn(index % 2 === 1 && 'bg-slate-900/30')}>
                  <td>
                    <div className="font-medium text-white">{po.poNo}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-600/50 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                      <span className="text-slate-200">{po.createdBy}</span>
                    </div>
                  </td>
                  <td className="text-center text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      {po.items.length}
                    </span>
                  </td>
                  <td className="text-right font-medium text-white">
                    {formatCurrency(po.totalAmount)}
                  </td>
                  <td>
                    <StatusBadge status={po.status} type="po" />
                  </td>
                  <td className="text-slate-400 text-sm">{formatDate(po.createdAt)}</td>
                  <td className="text-slate-400 text-sm">
                    {po.expectedDate ? formatDate(po.expectedDate, false) : '-'}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openDetail(po)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(po.status === 'finance_pending' || po.status === 'warehouse_pending') && (
                        <>
                          <button
                            onClick={() => {
                              setDetailModal(po)
                              setActionType('approve')
                            }}
                            className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            title="审批通过"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDetailModal(po)
                              setActionType('reject')
                            }}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="驳回"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!detailModal}
        onClose={() => {
          setDetailModal(null)
          setActionType(null)
          setComment('')
        }}
        title={detailModal ? `采购单详情 - ${detailModal.poNo}` : ''}
        size="xl"
        footer={
          detailModal &&
          (detailModal.status === 'finance_pending' || detailModal.status === 'warehouse_pending') ? (
            <div className="w-full flex items-center justify-between">
              {actionType && (
                <input
                  type="text"
                  placeholder={actionType === 'approve' ? '请输入审批意见（可选）' : '请输入驳回原因（必填）'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field flex-1 max-w-md"
                />
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    setDetailModal(null)
                    setActionType(null)
                    setComment('')
                  }}
                  className="btn-secondary"
                >
                  关闭
                </button>
                {!actionType && (
                  <>
                    <button
                      onClick={() => setActionType('approve')}
                      className="btn-primary !bg-emerald-600 !hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      审批通过
                    </button>
                    <button
                      onClick={() => setActionType('reject')}
                      className="btn-primary !bg-rose-600 !hover:bg-rose-700 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      驳回
                    </button>
                  </>
                )}
                {actionType && (
                  <button
                    onClick={handleAction}
                    disabled={submitting || (actionType === 'reject' && !comment.trim())}
                    className={cn(
                      'btn-primary flex items-center gap-1.5',
                      actionType === 'approve' && '!bg-emerald-600 !hover:bg-emerald-700',
                      actionType === 'reject' && '!bg-rose-600 !hover:bg-rose-700'
                    )}
                  >
                    {submitting ? '提交中...' : actionType === 'approve' ? '确认通过' : '确认驳回'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setDetailModal(null)}
              className="btn-secondary"
            >
              关闭
            </button>
          )
        }
      >
        {detailModal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">创建人</div>
                <div className="text-sm font-medium text-white">{detailModal.createdBy}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">当前审批人</div>
                <div className="text-sm font-medium text-white">{detailModal.currentApprover}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">创建时间</div>
                <div className="text-sm font-medium text-white">{formatDate(detailModal.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">预计到货日</div>
                <div className="text-sm font-medium text-white">
                  {detailModal.expectedDate ? formatDate(detailModal.expectedDate, false) : '-'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent-400" />
                商品明细
              </h4>
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>商品名称</th>
                        <th className="text-right">单价</th>
                        <th className="text-right">数量</th>
                        <th className="text-right">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModal.items.map((item, idx) => (
                        <tr key={item.skuId} className={cn(idx % 2 === 1 && 'bg-slate-900/30')}>
                          <td className="text-slate-400 text-xs font-mono">{item.skuId}</td>
                          <td className="text-slate-200">{item.skuName}</td>
                          <td className="text-right text-slate-300">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right text-slate-300">{formatNumber(item.quantity)}</td>
                          <td className="text-right font-medium text-white">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-700/50 bg-slate-900/50">
                        <td colSpan={4} className="text-right text-slate-400 font-medium py-3.5">
                          合计金额：
                        </td>
                        <td className="text-right py-3.5">
                          <span className="text-lg font-display font-bold text-accent-400">
                            {formatCurrency(detailModal.totalAmount)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                审批流程
              </h4>
              <div className="relative pl-8">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-700" />
                {[1, 2, 3, 4].map((step) => {
                  const stepLabel = getApprovalStepLabel(step)
                  const stepStatus = getStepStatus(detailModal.approvalHistory, step, detailModal.status)
                  const historyItem = detailModal.approvalHistory.find((h) => h.step === step)
                  return (
                    <div key={step} className="relative mb-6 last:mb-0">
                      <div
                        className={cn(
                          'absolute -left-8 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                          stepStatus === 'completed' && 'bg-emerald-500/20 border-emerald-500',
                          stepStatus === 'current' && 'bg-accent-500/20 border-accent-500 animate-pulse-slow',
                          stepStatus === 'rejected' && 'bg-rose-500/20 border-rose-500',
                          stepStatus === 'pending' && 'bg-slate-800 border-slate-600'
                        )}
                      >
                        {stepStatus === 'completed' && <Check className="w-3 h-3 text-emerald-400" />}
                        {stepStatus === 'rejected' && <X className="w-3 h-3 text-rose-400" />}
                        {stepStatus === 'current' && <Clock className="w-3 h-3 text-accent-400" />}
                        {stepStatus === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-slate-600" />
                        )}
                      </div>
                      <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-medium',
                                stepStatus === 'completed' && 'text-emerald-400',
                                stepStatus === 'current' && 'text-accent-400',
                                stepStatus === 'rejected' && 'text-rose-400',
                                stepStatus === 'pending' && 'text-slate-500'
                              )}
                            >
                              {stepLabel}
                            </span>
                            {historyItem && (
                              <span className="badge border border-slate-600/50 bg-slate-700/30 text-slate-400 text-xs">
                                v{historyItem.version}
                              </span>
                            )}
                          </div>
                          {historyItem && (
                            <span className="text-xs text-slate-500">
                              {formatDate(historyItem.createdAt)}
                            </span>
                          )}
                        </div>
                        {historyItem ? (
                          <div className="space-y-1">
                            <div className="text-xs text-slate-400">
                              <span className="text-slate-300">{historyItem.role}</span>
                              <span className="mx-1.5">·</span>
                              <span>{historyItem.user}</span>
                            </div>
                            {historyItem.comment && (
                              <div className="text-xs text-slate-400 mt-1">
                                <span className="text-slate-500">意见：</span>
                                {historyItem.comment}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600">
                            {stepStatus === 'current' ? '待处理...' : '等待上一步完成'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
