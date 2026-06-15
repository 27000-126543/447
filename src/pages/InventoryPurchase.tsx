import { useState, useEffect, useMemo } from 'react'
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
  Plus,
  Edit,
  Trash2,
  Send,
  RotateCcw,
  CheckSquare,
} from 'lucide-react'
import Modal from '@/components/Modal'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import DataTable from '@/components/DataTable'
import { api } from '@/lib/api'
import { hasPermission, usePermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/authStore'
import { PERMISSIONS } from '@shared/types'
import type { PurchaseOrder, POStatus, ApprovalHistory } from '@shared/types'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type TabType = 'pending' | 'my' | 'draft' | 'all'

const PO_STATUS_OPTIONS: { value: POStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'finance_pending', label: '财务待审批' },
  { value: 'finance_rejected', label: '财务已驳回' },
  { value: 'warehouse_pending', label: '仓储待确认' },
  { value: 'warehouse_rejected', label: '仓储已驳回' },
  { value: 'approved', label: '审批通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'completed', label: '已完成' },
]

const TAB_LABELS: Record<TabType, string> = {
  pending: '待我审批',
  my: '我发起的',
  draft: '草稿箱',
  all: '全部',
}

interface PurchaseListResponse {
  list: PurchaseOrder[]
  total: number
  page: number
  pageSize: number
}

export default function InventoryPurchase() {
  const [data, setData] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [statusFilter, setStatusFilter] = useState<POStatus | ''>('')
  const [dateFilter, setDateFilter] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('')
  const [detailModal, setDetailModal] = useState<PurchaseOrder | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'resubmit' | 'submit' | 'complete' | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const user = useAuthStore((s) => s.user)
  const canCreate = usePermission(PERMISSIONS.PURCHASE_CREATE)
  const canSubmit = usePermission(PERMISSIONS.PURCHASE_SUBMIT)
  const canApproveFinance = usePermission(PERMISSIONS.PURCHASE_APPROVE_FINANCE)
  const canApproveWarehouse = usePermission(PERMISSIONS.PURCHASE_APPROVE_WAREHOUSE)
  const canReject = usePermission(PERMISSIONS.PURCHASE_REJECT)
  const canResubmit = usePermission(PERMISSIONS.PURCHASE_RESUBMIT)

  useEffect(() => {
    fetchData()
  }, [activeTab, statusFilter, page])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))
      const res = await api.get<PurchaseListResponse>(
        `/inventory/purchase?${params.toString()}`
      )
      if (res.data) {
        let list = res.data.list
        if (activeTab === 'my') {
          list = list.filter((p) => p.createdById === user?.id || p.createdBy === user?.name)
        } else if (activeTab === 'draft') {
          list = list.filter((p) => p.status === 'draft' && (p.createdById === user?.id || p.createdBy === user?.name))
        } else if (activeTab === 'pending') {
          if (canApproveFinance) {
            list = list.filter((p) => p.status === 'finance_pending')
          } else if (canApproveWarehouse) {
            list = list.filter((p) => p.status === 'warehouse_pending')
          } else {
            list = []
          }
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
      let endpoint = ''
      switch (actionType) {
        case 'approve':
          endpoint = `/inventory/purchase/${detailModal.id}/approve`
          break
        case 'reject':
          endpoint = `/inventory/purchase/${detailModal.id}/reject`
          break
        case 'submit':
          endpoint = `/inventory/purchase/${detailModal.id}/submit`
          break
        case 'resubmit':
          endpoint = `/inventory/purchase/${detailModal.id}/resubmit`
          break
        case 'complete':
          endpoint = `/inventory/purchase/${detailModal.id}/complete`
          break
      }
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

  const handleDelete = async (po: PurchaseOrder) => {
    if (!confirm('确定要删除该采购单吗？')) return
    try {
      await api.delete(`/inventory/purchase/${po.id}`)
      fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const getApprovalStepLabel = (step: number): string => {
    const labels = ['草稿', '运营提交', '财务审核', '仓储审核', '完成']
    return labels[step] || `步骤${step}`
  }

  const getStepStatus = (history: ApprovalHistory[], step: number, status: POStatus, version: number) => {
    const versionHistory = history.filter(h => h.version === version)
    const found = versionHistory.find((h) => h.step === step)
    if (found) {
      return found.action === 'reject' ? 'rejected' : 'completed'
    }
    const maxStep = Math.max(...versionHistory.map(h => h.step), 0)
    if (step === maxStep + 1 && status !== 'rejected' && status !== 'completed') return 'current'
    return 'pending'
  }

  const canEditDraft = (po: PurchaseOrder) => {
    return po.status === 'draft' && (po.createdById === user?.id || po.createdBy === user?.name) && canSubmit
  }

  const canShowApproveButtons = (po: PurchaseOrder) => {
    if (po.status === 'finance_pending' && canApproveFinance) return true
    if (po.status === 'warehouse_pending' && canApproveWarehouse) return true
    return false
  }

  const canResubmitPO = (po: PurchaseOrder) => {
    const isRejected = po.status === 'finance_rejected' || po.status === 'warehouse_rejected' || po.status === 'rejected'
    return isRejected && (po.createdById === user?.id || po.createdBy === user?.name) && canResubmit
  }

  const canComplete = (po: PurchaseOrder) => {
    return po.status === 'approved' && canApproveWarehouse
  }

  const columns = [
    {
      key: 'poNo',
      title: '采购单号',
      render: (po: PurchaseOrder) => (
        <div className="font-medium text-white">{po.poNo}</div>
      ),
    },
    {
      key: 'createdBy',
      title: '创建人',
      render: (po: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-600/50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <span className="text-slate-200">{po.createdBy}</span>
        </div>
      ),
    },
    {
      key: 'itemCount',
      title: '商品数',
      align: 'center' as const,
      render: (po: PurchaseOrder) => (
        <span className="inline-flex items-center gap-1 text-slate-300">
          <Package className="w-3.5 h-3.5 text-slate-500" />
          {po.items.length}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      title: '总金额',
      align: 'right' as const,
      render: (po: PurchaseOrder) => (
        <span className="font-medium text-white">{formatCurrency(po.totalAmount)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (po: PurchaseOrder) => <StatusBadge status={po.status} type="po" />,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (po: PurchaseOrder) => (
        <span className="text-slate-400 text-sm">{formatDate(po.createdAt)}</span>
      ),
    },
    {
      key: 'expectedDate',
      title: '预计到货日',
      render: (po: PurchaseOrder) => (
        <span className="text-slate-400 text-sm">
          {po.expectedDate ? formatDate(po.expectedDate, false) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right' as const,
      width: 240,
      render: (po: PurchaseOrder) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openDetail(po)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canEditDraft(po) && (
            <>
              <button
                className="p-2 rounded-lg text-accent-400 hover:bg-accent-500/10 transition-all"
                title="编辑"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setDetailModal(po)
                  setActionType('submit')
                }}
                className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="提交审批"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(po)}
                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {canResubmitPO(po) && (
            <>
              <button
                className="p-2 rounded-lg text-accent-400 hover:bg-accent-500/10 transition-all"
                title="编辑"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setDetailModal(po)
                  setActionType('resubmit')
                }}
                className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="重新提交"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
          {canShowApproveButtons(po) && (
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
          {canComplete(po) && (
            <button
              onClick={() => {
                setDetailModal(po)
                setActionType('complete')
              }}
              className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-all"
              title="标记完成"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const groupedHistory = useMemo(() => {
    if (!detailModal) return []
    const versions = [...new Set(detailModal.approvalHistory.map(h => h.version))].sort()
    return versions.map(v => ({
      version: v,
      items: detailModal.approvalHistory.filter(h => h.version === v).sort((a, b) => a.step - b.step)
    }))
  }, [detailModal])

  const getActionButtonConfig = () => {
    if (!detailModal || !actionType) return null
    switch (actionType) {
      case 'approve':
        return {
          label: canApproveFinance ? '财务审批通过' : '仓储确认通过',
          placeholder: '请输入审批意见（可选）',
          btnClass: '!bg-emerald-600 !hover:bg-emerald-700',
          icon: <CheckCircle2 className="w-4 h-4" />,
        }
      case 'reject':
        return {
          label: '确认驳回',
          placeholder: '请输入驳回原因（必填）',
          btnClass: '!bg-rose-600 !hover:bg-rose-700',
          icon: <XCircle className="w-4 h-4" />,
        }
      case 'submit':
        return {
          label: '提交审批',
          placeholder: '请输入备注（可选）',
          btnClass: '!bg-accent-600 !hover:bg-accent-700',
          icon: <Send className="w-4 h-4" />,
        }
      case 'resubmit':
        return {
          label: '重新提交',
          placeholder: '请输入修改说明（可选）',
          btnClass: '!bg-emerald-600 !hover:bg-emerald-700',
          icon: <RotateCcw className="w-4 h-4" />,
        }
      case 'complete':
        return {
          label: '标记完成',
          placeholder: '请输入备注（可选）',
          btnClass: '!bg-cyan-600 !hover:bg-cyan-700',
          icon: <CheckSquare className="w-4 h-4" />,
        }
      default:
        return null
    }
  }

  const actionConfig = getActionButtonConfig()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-accent-400" />
            采购审批流程
          </h1>
          <p className="text-slate-400 text-sm">管理采购单的审批流程与进度跟踪</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建采购单
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center border-b border-slate-700/50">
          {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setPage(1)
              }}
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

        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          rowKey="id"
          emptyText="暂无采购单"
          emptyDescription="当前筛选条件下没有采购单数据"
          pagination={{
            page,
            pageSize,
            total: data.length,
            onPageChange: setPage,
          }}
        />
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
          detailModal ? (
            <div className="w-full flex items-center justify-between">
              {actionType && actionConfig && (
                <input
                  type="text"
                  placeholder={actionConfig.placeholder}
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
                {!actionType && canShowApproveButtons(detailModal) && (
                  <>
                    <button
                      onClick={() => setActionType('approve')}
                      className="btn-primary !bg-emerald-600 !hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {canApproveFinance ? '财务审批通过' : '仓储确认通过'}
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
                {!actionType && canResubmitPO(detailModal) && (
                  <>
                    <button
                      className="btn-secondary flex items-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => setActionType('resubmit')}
                      className="btn-primary !bg-emerald-600 !hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重新提交
                    </button>
                  </>
                )}
                {!actionType && canEditDraft(detailModal) && (
                  <>
                    <button
                      className="btn-secondary flex items-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => setActionType('submit')}
                      className="btn-primary !bg-accent-600 !hover:bg-accent-700 flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      提交审批
                    </button>
                  </>
                )}
                {!actionType && canComplete(detailModal) && (
                  <button
                    onClick={() => setActionType('complete')}
                    className="btn-primary !bg-cyan-600 !hover:bg-cyan-700 flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-4 h-4" />
                    标记完成
                  </button>
                )}
                {actionType && actionConfig && (
                  <button
                    onClick={handleAction}
                    disabled={submitting || (actionType === 'reject' && !comment.trim())}
                    className={cn(
                      'btn-primary flex items-center gap-1.5',
                      actionConfig.btnClass
                    )}
                  >
                    {submitting ? '提交中...' : actionConfig.label}
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
                <div className="text-sm font-medium text-white">{detailModal.currentApprover || '-'}</div>
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

            <div className="flex items-center gap-2">
              <StatusBadge status={detailModal.status} type="po" />
              {detailModal.version > 1 && (
                <span className="badge border border-slate-600/50 bg-slate-700/30 text-slate-400 text-xs">
                  v{detailModal.version}
                </span>
              )}
              {detailModal.rejectionCount > 0 && (
                <span className="badge border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs">
                  已驳回 {detailModal.rejectionCount} 次
                </span>
              )}
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
              <div className="space-y-6">
                {groupedHistory.map(({ version, items }) => (
                  <div key={version} className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="badge bg-accent-500/20 text-accent-400 border border-accent-500/30">
                        v{version}
                      </span>
                      {version < detailModal.version && (
                        <span className="text-xs text-slate-500">历史版本</span>
                      )}
                      {version === detailModal.version && (
                        <span className="text-xs text-emerald-400">当前版本</span>
                      )}
                    </div>
                    <div className="relative pl-8">
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-700" />
                      {[1, 2, 3, 4].map((step) => {
                        const stepLabel = getApprovalStepLabel(step)
                        const stepStatus = getStepStatus(detailModal.approvalHistory, step, detailModal.status, version)
                        const historyItem = items.find((h) => h.step === step)
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
                                  {historyItem?.rejectedFrom !== undefined && (
                                    <span className="badge bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs">
                                      从步骤{historyItem.rejectedFrom}驳回
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
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建采购单"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
              取消
            </button>
            <button
              onClick={() => {
                setShowCreateModal(false)
                alert('采购单创建功能演示')
              }}
              className="btn-primary"
            >
              创建
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">新建采购单功能演示页面</p>
        </div>
      </Modal>
    </div>
  )
}
