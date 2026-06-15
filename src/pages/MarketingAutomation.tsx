import { useEffect, useState } from 'react'
import {
  Plus, Edit, Copy, Play, Pause, Eye,
  PlayCircle, Users, GitBranch, MessageSquare,
  Mail, Bell, Clock, GitMerge, CheckCircle,
  Search, EyeOff, Smartphone
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import LoadingSpinner from '@/components/LoadingSpinner'
import { api } from '@/lib/api'
import { formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MarketingCampaign } from '@shared/types'

interface CampaignListResponse {
  list: MarketingCampaign[]
  total: number
  page: number
  pageSize: number
}

interface FlowNode {
  id: string
  type: 'trigger' | 'segment' | 'abtest' | 'action' | 'wait' | 'condition' | 'end'
  label: string
  icon: typeof PlayCircle
  x: number
  y: number
  color: string
  bgColor: string
  subLabel?: string
}

interface FlowConnection {
  from: string
  to: string
}

const defaultFlowNodes: FlowNode[] = [
  { id: '1', type: 'trigger', label: '开始触发器', icon: PlayCircle, x: 40, y: 30, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/40', subLabel: '用户注册事件' },
  { id: '2', type: 'segment', label: '用户分层判断', icon: Users, x: 40, y: 130, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/40', subLabel: '新客用户群' },
  { id: '3', type: 'abtest', label: 'A/B测试分支', icon: GitBranch, x: 40, y: 230, color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/40', subLabel: '70% / 30%' },
  { id: '4', type: 'action', label: '短信触达', icon: MessageSquare, x: 0, y: 350, color: 'text-accent-400', bgColor: 'bg-accent-500/20 border-accent-500/40', subLabel: '优惠券模板A' },
  { id: '5', type: 'action', label: '站内信触达', icon: Mail, x: 80, y: 350, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/40', subLabel: '优惠券模板B' },
  { id: '6', type: 'wait', label: '等待', icon: Clock, x: 40, y: 470, color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/40', subLabel: '24小时' },
  { id: '7', type: 'condition', label: '条件判断', icon: GitMerge, x: 40, y: 570, color: 'text-pink-400', bgColor: 'bg-pink-500/20 border-pink-500/40', subLabel: '是否已转化' },
  { id: '8', type: 'end', label: '结束', icon: CheckCircle, x: 40, y: 670, color: 'text-slate-400', bgColor: 'bg-slate-500/20 border-slate-500/40' },
]

const defaultFlowConnections: FlowConnection[] = [
  { from: '1', to: '2' },
  { from: '2', to: '3' },
  { from: '3', to: '4' },
  { from: '3', to: '5' },
  { from: '4', to: '6' },
  { from: '5', to: '6' },
  { from: '6', to: '7' },
  { from: '7', to: '8' },
]

export default function MarketingAutomation() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchText, setSearchText] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    targetSegment: '',
    channels: [] as string[],
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<CampaignListResponse>('/marketing/campaigns')
        setCampaigns(res.data.list)
        if (res.data.list.length > 0) {
          setSelectedId(res.data.list[0].id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const selectedCampaign = campaigns.find(c => c.id === selectedId)

  const handleToggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c
      if (c.status === 'running') return { ...c, status: 'paused', statusName: '已暂停' }
      if (c.status === 'paused') return { ...c, status: 'running', statusName: '进行中' }
      return c
    }))
  }

  const handleCopy = (campaign: MarketingCampaign) => {
    const newCampaign: MarketingCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}`,
      name: `${campaign.name} (副本)`,
      status: 'draft',
      statusName: '草稿',
    }
    setCampaigns(prev => [newCampaign, ...prev])
  }

  const handleCreateSubmit = () => {
    if (!formData.name.trim()) return
    const newCampaign: MarketingCampaign = {
      id: `campaign-${Date.now()}`,
      name: formData.name,
      targetSegment: formData.targetSegment || '全部用户',
      status: 'draft',
      statusName: '草稿',
      channels: formData.channels.length > 0 ? formData.channels : ['sms'],
      createdAt: new Date().toISOString(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalImpressions: 0,
      totalConversions: 0,
      conversionRate: 0,
    }
    setCampaigns(prev => [newCampaign, ...prev])
    setSelectedId(newCampaign.id)
    setShowCreateModal(false)
    setFormData({ name: '', targetSegment: '', channels: [], startDate: '', endDate: '' })
  }

  const renderNode = (node: FlowNode) => {
    const Icon = node.icon
    return (
      <div
        key={node.id}
        className="absolute w-[calc(100%-80px)]"
        style={{ left: `${node.x}%`, top: node.y, transform: node.x !== 40 ? 'translateX(-50%)' : undefined }}
      >
        <div className={cn(
          'glass-card border-2 p-4 cursor-move hover:shadow-lg transition-all duration-200',
          node.bgColor
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', node.bgColor)}>
              <Icon className={cn('w-5 h-5', node.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn('text-sm font-semibold', node.color)}>{node.label}</div>
              {node.subLabel && (
                <div className="text-xs text-slate-400 truncate">{node.subLabel}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-display font-bold text-white">自动化营销流程</h1>
          <p className="text-slate-400 text-sm mt-1">可视化编排营销活动，自动化触达目标用户</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建活动
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索活动名称..."
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin pr-1">
            {filteredCampaigns.map(campaign => (
              <div
                key={campaign.id}
                onClick={() => setSelectedId(campaign.id)}
                className={cn(
                  'glass-card-hover p-4 cursor-pointer',
                  selectedId === campaign.id && 'ring-2 ring-accent-500/50 border-accent-500/40'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate">{campaign.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{campaign.targetSegment}</p>
                  </div>
                  <StatusBadge status={campaign.status} type="activity" className="ml-2 flex-shrink-0" />
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {campaign.abTest?.enabled && (
                    <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <GitBranch className="w-3 h-3 mr-1" />
                      A/B测试
                    </span>
                  )}
                  {campaign.channels.map(ch => (
                    <span key={ch} className="badge bg-slate-700/70 text-slate-300 border border-slate-600/50">
                      {ch === 'sms' && <MessageSquare className="w-3 h-3 mr-1" />}
                      {ch === 'push' && <Bell className="w-3 h-3 mr-1" />}
                      {ch === 'email' && <Mail className="w-3 h-3 mr-1" />}
                      {ch === 'inapp' && <Smartphone className="w-3 h-3 mr-1" />}
                      {ch === 'sms' ? '短信' : ch === 'push' ? 'Push' : ch === 'email' ? '邮件' : '站内信'}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-slate-400">曝光数</div>
                    <div className="text-white font-semibold">{formatNumber(campaign.totalImpressions || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">转化率</div>
                    <div className="text-emerald-400 font-semibold">{formatPercent(campaign.conversionRate || 0)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-3 border-t border-slate-700/50">
                  <button
                    onClick={(e) => { e.stopPropagation() }}
                    className="btn-ghost text-xs px-2 py-1.5 flex-1"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    编辑
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(campaign) }}
                    className="btn-ghost text-xs px-2 py-1.5 flex-1"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    复制
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(campaign.id) }}
                    className={cn(
                      'btn-ghost text-xs px-2 py-1.5 flex-1',
                      campaign.status === 'running' ? 'text-amber-400' : 'text-emerald-400'
                    )}
                    disabled={campaign.status === 'draft' || campaign.status === 'completed'}
                  >
                    {campaign.status === 'running' ? (
                      <><Pause className="w-3.5 h-3.5 mr-1" />暂停</>
                    ) : (
                      <><Play className="w-3.5 h-3.5 mr-1" />启动</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="glass-card p-5 h-full min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {selectedCampaign?.name || '请选择营销活动'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">流程画布 - 节点可拖动示意</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost text-sm">
                  <Eye className="w-4 h-4 mr-1.5" />
                  预览
                </button>
                <button className="btn-secondary text-sm">
                  <Edit className="w-4 h-4 mr-1.5" />
                  编辑流程
                </button>
              </div>
            </div>

            {selectedCampaign ? (
              <div className="relative bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden" style={{ height: '760px' }}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {defaultFlowConnections.map((conn, idx) => {
                    const fromNode = defaultFlowNodes.find(n => n.id === conn.from)
                    const toNode = defaultFlowNodes.find(n => n.id === conn.to)
                    if (!fromNode || !toNode) return null
                    const fromX = fromNode.x !== 40 ? `${fromNode.x}%` : '50%'
                    const toX = toNode.x !== 40 ? `${toNode.x}%` : '50%'
                    return (
                      <line
                        key={idx}
                        x1={fromX}
                        y1={fromNode.y + 60}
                        x2={toX}
                        y2={toNode.y}
                        stroke="#475569"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )
                  })}
                </svg>

                <div className="relative h-full p-6">
                  {defaultFlowNodes.map(renderNode)}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="glass-card p-3">
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-emerald-500/40" />
                        <span>触发器</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-500/40" />
                        <span>用户分层</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-purple-500/40" />
                        <span>A/B测试</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-accent-500/40" />
                        <span>触达动作</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-500/40" />
                        <span>等待</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-pink-500/40" />
                        <span>条件判断</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-slate-400">
                <EyeOff className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-base">请从左侧选择一个营销活动</p>
                <p className="text-sm text-slate-500 mt-1">或点击"新建活动"创建新的营销流程</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建营销活动"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleCreateSubmit} className="btn-primary">
              创建
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">活动名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入活动名称"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">目标人群</label>
            <select
              value={formData.targetSegment}
              onChange={(e) => setFormData(prev => ({ ...prev, targetSegment: e.target.value }))}
              className="input-field"
            >
              <option value="">选择目标人群</option>
              <option value="全部用户">全部用户</option>
              <option value="新客">新客用户</option>
              <option value="活跃">活跃用户</option>
              <option value="沉睡">沉睡用户</option>
              <option value="流失">流失用户</option>
              <option value="高价值">高价值客户</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">触达渠道</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'sms', label: '短信', icon: MessageSquare },
                { key: 'push', label: 'Push推送', icon: Bell },
                { key: 'email', label: '邮件', icon: Mail },
                { key: 'inapp', label: '站内信', icon: Smartphone },
              ].map(ch => {
                const Icon = ch.icon
                const checked = formData.channels.includes(ch.key)
                return (
                  <button
                    key={ch.key}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        channels: checked
                          ? prev.channels.filter(c => c !== ch.key)
                          : [...prev.channels, ch.key]
                      }))
                    }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
                      checked
                        ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
                        : 'border-slate-700/50 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{ch.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">开始日期</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">结束日期</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
