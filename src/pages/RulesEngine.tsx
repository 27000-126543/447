import { useEffect, useState } from 'react'
import {
  Plus, Search, Edit, Play, Trash2,
  Clock, Zap, AlertTriangle, Tag,
  ChevronDown, ChevronRight, PlusCircle, X,
  Gauge, Calendar, Activity, ArrowRight
} from 'lucide-react'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import LoadingSpinner from '@/components/LoadingSpinner'
import { api } from '@/lib/api'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RuleConfig, RuleCondition, RuleAction } from '@shared/types'

interface RuleListResponse {
  list: RuleConfig[]
  total: number
  page: number
  pageSize: number
}

const categoryTabs = [
  { key: 'all', label: '全部' },
  { key: 'pricing', label: '自动调价' },
  { key: 'replenish', label: '自动补货' },
  { key: 'reconcile', label: '自动对账' },
  { key: 'other', label: '其他' },
] as const

const categoryMap: Record<string, { label: string; className: string; icon: typeof Tag }> = {
  pricing: { label: '自动调价', className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30', icon: Gauge },
  replenish: { label: '自动补货', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', icon: Activity },
  reconcile: { label: '自动对账', className: 'bg-purple-500/15 text-purple-400 border border-purple-500/30', icon: Calendar },
  other: { label: '其他', className: 'bg-slate-500/15 text-slate-400 border border-slate-500/30', icon: Tag },
}

const triggerTypeMap: Record<string, { label: string; icon: typeof Clock }> = {
  schedule: { label: '定时触发', icon: Clock },
  event: { label: '事件触发', icon: Zap },
  threshold: { label: '阈值触发', icon: AlertTriangle },
}

const operatorMap: Record<string, string> = {
  gt: '大于',
  lt: '小于',
  eq: '等于',
  gte: '大于等于',
  lte: '小于等于',
  between: '在...之间',
  contains: '包含',
}

const fieldOptions = [
  { key: 'order_amount', label: '订单金额' },
  { key: 'stock_quantity', label: '库存数量' },
  { key: 'user_level', label: '用户等级' },
  { key: 'product_price', label: '商品价格' },
  { key: 'refund_rate', label: '退款率' },
]

const actionTypeOptions = [
  { key: 'adjust_price', label: '调整价格' },
  { key: 'create_po', label: '创建采购单' },
  { key: 'send_alert', label: '发送告警' },
  { key: 'update_status', label: '更新状态' },
  { key: 'trigger_reconcile', label: '触发对账' },
]

export default function RulesEngine() {
  const [loading, setLoading] = useState(true)
  const [rules, setRules] = useState<RuleConfig[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [testRunning, setTestRunning] = useState(false)

  const [formData, setFormData] = useState<Partial<RuleConfig>>({
    name: '',
    description: '',
    category: 'other',
    enabled: true,
    trigger: { type: 'event', config: {} },
    conditions: [],
    actions: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<RuleListResponse>('/rules')
        setRules(res.data.list)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredRules = rules.filter(r => {
    const matchCategory = activeTab === 'all' || r.category === activeTab
    const matchSearch = r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.description.toLowerCase().includes(searchText.toLowerCase())
    return matchCategory && matchSearch
  })

  const handleToggleEnabled = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const handleEdit = (rule: RuleConfig) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      category: rule.category,
      enabled: rule.enabled,
      trigger: rule.trigger,
      conditions: [...rule.conditions],
      actions: [...rule.actions],
    })
    setShowRuleModal(true)
  }

  const handleCreate = () => {
    setEditingRule(null)
    setFormData({
      name: '',
      description: '',
      category: 'other',
      enabled: true,
      trigger: { type: 'event', config: {} },
      conditions: [],
      actions: [],
    })
    setShowRuleModal(true)
  }

  const handleDelete = async () => {
    if (!deletingRuleId) return
    try {
      await api.delete(`/rules/${deletingRuleId}`)
      setRules(prev => prev.filter(r => r.id !== deletingRuleId))
    } catch (e) {
      console.error(e)
    }
    setShowDeleteDialog(false)
    setDeletingRuleId(null)
  }

  const handleSubmit = async () => {
    if (!formData.name?.trim()) return
    try {
      if (editingRule) {
        const res = await api.put<RuleConfig>(`/rules/${editingRule.id}`, formData)
        setRules(prev => prev.map(r => r.id === editingRule.id ? res.data : r))
      } else {
        const res = await api.post<RuleConfig>('/rules', formData)
        setRules(prev => [res.data, ...prev])
      }
      setShowRuleModal(false)
    } catch (e) {
      console.error(e)
    }
  }

  const handleTestRun = () => {
    setTestRunning(true)
    setTimeout(() => {
      setTestRunning(false)
    }, 2000)
  }

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: `cond-${Date.now()}`,
      field: 'order_amount',
      operator: 'gt',
      value: 0,
    }
    setFormData(prev => ({ ...prev, conditions: [...(prev.conditions || []), newCondition] }))
  }

  const removeCondition = (id: string) => {
    setFormData(prev => ({ ...prev, conditions: (prev.conditions || []).filter(c => c.id !== id) }))
  }

  const updateCondition = (id: string, key: keyof RuleCondition, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      conditions: (prev.conditions || []).map(c => c.id === id ? { ...c, [key]: value } : c)
    }))
  }

  const addAction = () => {
    const newAction: RuleAction = {
      id: `action-${Date.now()}`,
      type: 'adjust_price',
      params: {},
    }
    setFormData(prev => ({ ...prev, actions: [...(prev.actions || []), newAction] }))
  }

  const removeAction = (id: string) => {
    setFormData(prev => ({ ...prev, actions: (prev.actions || []).filter(a => a.id !== id) }))
  }

  const updateAction = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      actions: (prev.actions || []).map(a => a.id === id ? { ...a, type: value } : a)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">规则引擎配置</h1>
          <p className="text-slate-400 text-sm mt-1">图形化配置业务自动化规则</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建规则
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg overflow-x-auto scrollbar-thin">
            {categoryTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-accent-500 text-white shadow-glow-accent'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md sm:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索规则名称或描述..."
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRules.map(rule => {
          const catConf = categoryMap[rule.category] || categoryMap.other
          const CatIcon = catConf.icon
          const trigConf = triggerTypeMap[rule.trigger.type] || triggerTypeMap.event
          const TrigIcon = trigConf.icon
          return (
            <div key={rule.id} className="glass-card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-semibold truncate">{rule.name}</h4>
                    <span className={cn('badge', catConf.className)}>
                      <CatIcon className="w-3 h-3 mr-1" />
                      {catConf.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{rule.description || '暂无描述'}</p>
                </div>
                <button
                  onClick={() => handleToggleEnabled(rule.id)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-3',
                    rule.enabled ? 'bg-accent-500' : 'bg-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200',
                      rule.enabled ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                    <TrigIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500">触发方式</div>
                    <div className="text-slate-300">{trigConf.label}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                  <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500">条件/动作</div>
                    <div className="text-slate-300">{rule.conditions.length} 条件 / {rule.actions.length} 动作</div>
                  </div>
                </div>

                {rule.conditions.length > 0 && (
                  <div className="bg-slate-800/40 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-2">触发条件</div>
                    <div className="space-y-1.5">
                      {rule.conditions.slice(0, 2).map(cond => {
                        const field = fieldOptions.find(f => f.key === cond.field)
                        return (
                          <div key={cond.id} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5">
                              {field?.label || cond.field}
                            </span>
                            <span className="text-slate-500">{operatorMap[cond.operator]}</span>
                            <span className="text-white font-medium">{String(cond.value)}</span>
                          </div>
                        )
                      })}
                      {rule.conditions.length > 2 && (
                        <div className="text-xs text-slate-500">还有 {rule.conditions.length - 2} 个条件...</div>
                      )}
                    </div>
                  </div>
                )}

                {rule.actions.length > 0 && (
                  <div className="bg-slate-800/40 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-2">执行动作</div>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.actions.slice(0, 3).map(action => {
                        const act = actionTypeOptions.find(a => a.key === action.type)
                        return (
                          <span key={action.id} className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            {act?.label || action.type}
                          </span>
                        )
                      })}
                      {rule.actions.length > 3 && (
                        <span className="badge bg-slate-700 text-slate-300">+{rule.actions.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">最近运行: {formatRelativeTime(rule.updatedAt)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="btn-ghost text-xs px-2 py-1"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    编辑
                  </button>
                  <button
                    onClick={() => { setTestRunning(true); setTimeout(() => setTestRunning(false), 2000) }}
                    className="btn-ghost text-xs px-2 py-1 text-emerald-400"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    测试
                  </button>
                  <button
                    onClick={() => { setDeletingRuleId(rule.id); setShowDeleteDialog(true) }}
                    className="btn-ghost text-xs px-2 py-1 text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredRules.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">暂无符合条件的规则</p>
          </div>
        )}
      </div>

      <Modal
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={editingRule ? '编辑规则' : '新建规则'}
        size="xl"
        footer={
          <>
            <button onClick={() => setShowRuleModal(false)} className="btn-secondary">
              取消
            </button>
            <button
              onClick={handleTestRun}
              className="btn-secondary"
              disabled={testRunning}
            >
              <Play className="w-4 h-4 mr-1.5" />
              {testRunning ? '测试中...' : '测试运行'}
            </button>
            <button onClick={handleSubmit} className="btn-primary">
              {editingRule ? '保存修改' : '创建规则'}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">规则名称</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入规则名称"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as RuleConfig['category'] }))}
                className="input-field"
              >
                {Object.entries(categoryMap).map(([key, conf]) => (
                  <option key={key} value={key}>{conf.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">描述</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入规则描述"
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">触发方式</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(triggerTypeMap).map(([key, conf]) => {
                const Icon = conf.icon
                const active = formData.trigger?.type === key
                return (
                  <button
                    key={key}
                    onClick={() => setFormData(prev => ({ ...prev, trigger: { type: key as RuleConfig['trigger']['type'], config: {} } }))}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200',
                      active
                        ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
                        : 'border-slate-700/50 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{conf.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              {formData.trigger?.type === 'schedule' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">执行周期</label>
                    <select className="input-field text-sm py-2">
                      <option>每天</option>
                      <option>每周</option>
                      <option>每月</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">执行时间</label>
                    <input type="time" className="input-field text-sm py-2" defaultValue="09:00" />
                  </div>
                </div>
              )}
              {formData.trigger?.type === 'event' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">监听事件</label>
                  <select className="input-field text-sm py-2">
                    <option>订单创建</option>
                    <option>订单支付</option>
                    <option>库存变化</option>
                    <option>用户注册</option>
                  </select>
                </div>
              )}
              {formData.trigger?.type === 'threshold' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">监控指标</label>
                    <select className="input-field text-sm py-2">
                      <option>库存数量</option>
                      <option>订单金额</option>
                      <option>退款率</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">阈值</label>
                    <input type="number" className="input-field text-sm py-2" placeholder="100" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-300">条件配置</label>
              <button
                onClick={addCondition}
                className="btn-ghost text-xs py-1 text-accent-400"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                添加条件
              </button>
            </div>

            {(formData.conditions || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                <ChevronDown className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">暂无条件，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(formData.conditions || []).map((condition, idx) => (
                  <div key={condition.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    {idx > 0 && (
                      <span className="badge bg-slate-700 text-slate-300 self-start mt-2">AND</span>
                    )}
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <select
                          value={condition.field}
                          onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                          className="input-field text-sm py-2"
                        >
                          {fieldOptions.map(f => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                          className="input-field text-sm py-2"
                        >
                          {Object.entries(operatorMap).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={String(condition.value)}
                          onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                          className="input-field text-sm py-2"
                          placeholder="输入值"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          onClick={() => removeCondition(condition.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-300">动作配置</label>
              <button
                onClick={addAction}
                className="btn-ghost text-xs py-1 text-accent-400"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                添加动作
              </button>
            </div>

            {(formData.actions || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
                <ArrowRight className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">暂无动作，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(formData.actions || []).map((action, idx) => (
                  <div key={action.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      动作 {idx + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(action.id, e.target.value)}
                          className="input-field text-sm py-2"
                        >
                          {actionTypeOptions.map(a => (
                            <option key={a.key} value={a.key}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="动作参数（JSON 或描述）"
                          className="input-field text-sm py-2"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          onClick={() => removeAction(action.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeletingRuleId(null) }}
        onConfirm={handleDelete}
        title="删除规则"
        message="确定要删除该规则吗？删除后无法恢复。"
        confirmText="删除"
        type="danger"
      />
    </div>
  )
}
