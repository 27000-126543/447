import { useEffect, useState } from 'react'
import { Users, Sparkles, Zap, Moon, UserX, Clock, Repeat, DollarSign, Megaphone, CheckSquare } from 'lucide-react'
import StatCard from '@/components/StatCard'
import DonutChart from '@/components/DonutChart'
import TrendChart, { type TrendDataPoint } from '@/components/TrendChart'
import LoadingSpinner from '@/components/LoadingSpinner'
import { api } from '@/lib/api'
import { formatNumber, formatCurrency } from '@/lib/format'
import type { LifecycleDistribution } from '@shared/types'

interface HighValueCustomer {
  id: string
  name: string
  phone: string
  rScore: number
  fScore: number
  mScore: number
  totalAmount: number
  lastPurchase: string
  selected?: boolean
}

const mockRFMCustomers: HighValueCustomer[] = [
  { id: '1', name: '张伟', phone: '138****1234', rScore: 95, fScore: 88, mScore: 92, totalAmount: 58600, lastPurchase: '2024-01-10' },
  { id: '2', name: '李娜', phone: '139****5678', rScore: 88, fScore: 95, mScore: 90, totalAmount: 72300, lastPurchase: '2024-01-12' },
  { id: '3', name: '王强', phone: '136****9012', rScore: 92, fScore: 80, mScore: 95, totalAmount: 89500, lastPurchase: '2024-01-08' },
  { id: '4', name: '刘芳', phone: '137****3456', rScore: 85, fScore: 92, mScore: 88, totalAmount: 45200, lastPurchase: '2024-01-11' },
  { id: '5', name: '陈明', phone: '135****7890', rScore: 90, fScore: 85, mScore: 92, totalAmount: 63400, lastPurchase: '2024-01-09' },
]

export default function MarketingLifecycle() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<LifecycleDistribution | null>(null)
  const [customers, setCustomers] = useState<HighValueCustomer[]>(mockRFMCustomers)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<LifecycleDistribution>('/marketing/lifecycle')
        setData(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleCustomer = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c))
  }

  const toggleAllCustomers = () => {
    const allSelected = customers.every(c => c.selected)
    setCustomers(prev => prev.map(c => ({ ...c, selected: !allSelected })))
  }

  const selectedCount = customers.filter(c => c.selected).length

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const total = data.newCustomers + data.activeCustomers + data.dormantCustomers + data.churnedCustomers

  const donutData = [
    { name: '新客', value: data.newCustomers, color: '#3B82F6' },
    { name: '活跃', value: data.activeCustomers, color: '#10B981' },
    { name: '沉睡', value: data.dormantCustomers, color: '#F59E0B' },
    { name: '流失', value: data.churnedCustomers, color: '#EF4444' },
  ]

  const trendData = data.trend.map(t => ({
    date: t.date.slice(5),
    新客: t.new,
    活跃: t.active,
    沉睡: t.dormant,
    流失: t.churned,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">用户生命周期分层</h1>
          <p className="text-slate-400 text-sm mt-1">基于用户行为数据的分层分析与RFM模型</p>
        </div>
        {selectedCount > 0 && (
          <button className="btn-primary flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            创建营销活动 ({selectedCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="总用户数"
          value={total}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          trend={12.5}
        />
        <StatCard
          title="新客"
          value={data.newCustomers}
          icon={<Sparkles className="w-5 h-5" />}
          color="cyan"
          trend={8.3}
        />
        <StatCard
          title="活跃用户"
          value={data.activeCustomers}
          icon={<Zap className="w-5 h-5" />}
          color="green"
          trend={5.2}
        />
        <StatCard
          title="沉睡用户"
          value={data.dormantCustomers}
          icon={<Moon className="w-5 h-5" />}
          color="orange"
          trend={-2.1}
        />
        <StatCard
          title="流失用户"
          value={data.churnedCustomers}
          icon={<UserX className="w-5 h-5" />}
          color="pink"
          trend={-1.5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">用户分层分布</h3>
          <DonutChart
            data={donutData}
            height={220}
            centerLabel="总用户"
            centerValue={formatNumber(total)}
          />
        </div>

        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">14天用户分层趋势</h3>
          <TrendChart
            data={trendData as unknown as TrendDataPoint[]}
            dataKeys={['新客', '活跃', '沉睡', '流失']}
            colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
            type="area"
            height={260}
            formatter={formatNumber}
          />
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="text-base font-semibold text-white mb-4">RFM模型分析</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-slate-400">R - 最近购买时间</div>
                <div className="text-lg font-semibold text-white">Recency</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">高价值占比</span>
                <span className="text-white font-medium">32%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[32%] bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" />
              </div>
              <div className="flex gap-2 text-xs text-slate-400">
                <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30">近7天 42%</span>
                <span className="badge bg-slate-700 text-slate-300">7-30天 38%</span>
                <span className="badge bg-slate-700 text-slate-300">30天+ 20%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-slate-400">F - 购买频次</div>
                <div className="text-lg font-semibold text-white">Frequency</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">高价值占比</span>
                <span className="text-white font-medium">28%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[28%] bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" />
              </div>
              <div className="flex gap-2 text-xs text-slate-400">
                <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">10次+ 25%</span>
                <span className="badge bg-slate-700 text-slate-300">5-10次 40%</span>
                <span className="badge bg-slate-700 text-slate-300">5次- 35%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-slate-400">M - 购买金额</div>
                <div className="text-lg font-semibold text-white">Monetary</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">高价值占比</span>
                <span className="text-white font-medium">25%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[25%] bg-gradient-to-r from-purple-500 to-pink-400 rounded-full" />
              </div>
              <div className="flex gap-2 text-xs text-slate-400">
                <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/30">5万+ 20%</span>
                <span className="badge bg-slate-700 text-slate-300">1-5万 45%</span>
                <span className="badge bg-slate-700 text-slate-300">1万- 35%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">高价值客户列表</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">已选 {selectedCount}/{customers.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">
                  <button
                    onClick={toggleAllCustomers}
                    className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                  >
                    <CheckSquare
                      className={`w-4 h-4 ${customers.every(c => c.selected) ? 'text-accent-400' : 'text-slate-500'}`}
                    />
                  </button>
                </th>
                <th>客户</th>
                <th>R得分</th>
                <th>F得分</th>
                <th>M得分</th>
                <th>累计消费</th>
                <th>最近购买</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id} className={customer.selected ? 'bg-accent-500/10' : ''}>
                  <td>
                    <button
                      onClick={() => toggleCustomer(customer.id)}
                      className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                    >
                      <CheckSquare
                        className={`w-4 h-4 ${customer.selected ? 'text-accent-400' : 'text-slate-500'}`}
                      />
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-medium">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{customer.name}</div>
                        <div className="text-xs text-slate-400">{customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${customer.rScore >= 85 ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-slate-700 text-slate-300'}`}>
                      {customer.rScore}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${customer.fScore >= 85 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}>
                      {customer.fScore}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${customer.mScore >= 85 ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-slate-700 text-slate-300'}`}>
                      {customer.mScore}
                    </span>
                  </td>
                  <td className="text-white font-medium">{formatCurrency(customer.totalAmount, 0)}</td>
                  <td className="text-slate-300">{customer.lastPurchase}</td>
                  <td>
                    <button className="btn-ghost text-xs px-2 py-1">
                      <Megaphone className="w-3 h-3 mr-1" />
                      触达
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
