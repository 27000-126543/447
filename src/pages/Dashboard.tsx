import { useEffect, useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Tag,
  RefreshCw,
  Package,
  Users,
  UserPlus,
  Moon,
  Target,
  Activity,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import TrendChart from '@/components/TrendChart'
import DonutChart from '@/components/DonutChart'
import AlertCard from '@/components/AlertCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber, formatPercent, formatRelativeTime } from '@/lib/format'
import type { DashboardOverview } from '@shared/types'
import type { TrendDataPoint } from '@/components/TrendChart'

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get<DashboardOverview>('/dashboard/overview')
        setData(res.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const { gmv, channels, metrics, alerts } = data

  const orderCount = Math.round(gmv.today / metrics.avgOrderValue)
  const monthOrderCount = Math.round(gmv.month / metrics.avgOrderValue)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1">数据看板</h1>
        <p className="text-sm text-slate-400">实时业务数据概览</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="今日GMV"
          value={gmv.today}
          trend={gmv.mom}
          trendUp={gmv.mom >= 0}
          icon={<DollarSign className="w-5 h-5" />}
          color="orange"
          prefix="¥"
          decimals={0}
        />
        <StatCard
          title="本月GMV"
          value={gmv.month}
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
          prefix="¥"
          decimals={0}
        />
        <StatCard
          title="今日订单数"
          value={orderCount}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="客单价"
          value={metrics.avgOrderValue}
          icon={<Tag className="w-5 h-5" />}
          color="purple"
          prefix="¥"
          decimals={1}
        />
        <StatCard
          title="退货率"
          value={metrics.refundRate}
          icon={<RefreshCw className="w-5 h-5" />}
          color="pink"
          suffix="%"
          decimals={1}
        />
        <StatCard
          title="库存周转率"
          value={metrics.inventoryTurnover}
          icon={<Package className="w-5 h-5" />}
          color="cyan"
          suffix="次"
          decimals={1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="glass-card p-5 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">30天GMV趋势</h3>
              <p className="text-xs text-slate-400 mt-0.5">近30天每日GMV变化</p>
            </div>
          </div>
          <TrendChart
            data={gmv.trend as TrendDataPoint[]}
            dataKeys={['value']}
            colors={['#FF6B35']}
            type="area"
            height={280}
            formatter={(v) => formatCurrency(v, 0)}
          />
        </div>

        <div className="glass-card p-5 lg:col-span-3">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white">渠道GMV占比</h3>
            <p className="text-xs text-slate-400 mt-0.5">本月各渠道销售分布</p>
          </div>
          <DonutChart
            data={channels}
            height={260}
            innerRadius={55}
            outerRadius={85}
            centerLabel="总GMV"
            centerValue={formatCurrency(gmv.month, 0)}
            formatter={(v) => formatCurrency(v, 0)}
          />
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">运营指标明细</h3>
          <p className="text-xs text-slate-400 mt-0.5">用户增长与转化核心指标</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400">转化率</span>
            </div>
            <div className="text-xl font-display font-bold text-white">
              {formatPercent(metrics.conversionRate / 100, 1)}
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-slate-400">活跃用户</span>
            </div>
            <div className="text-xl font-display font-bold text-white">
              {formatNumber(18560)}
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs text-slate-400">新客数</span>
            </div>
            <div className="text-xl font-display font-bold text-white">
              {formatNumber(1820)}
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Moon className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-slate-400">沉睡召回</span>
            </div>
            <div className="text-xl font-display font-bold text-white">
              {formatNumber(420)}
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs text-slate-400">本月订单</span>
            </div>
            <div className="text-xl font-display font-bold text-white">
              {formatNumber(monthOrderCount)}
            </div>
          </div>
          <div className="glass-card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs text-slate-400">客单价</span>
            </div>
            <div className="text-xl font-display font-bold text-white">
              {formatCurrency(metrics.avgOrderValue, 0)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">异常告警</h3>
            <p className="text-xs text-slate-400 mt-0.5">最近需要关注的业务告警</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.slice(0, 6).map((alert) => (
            <AlertCard
              key={alert.id}
              level={alert.type}
              title={alert.title}
              description={alert.description}
              channel={alert.channel}
              time={formatRelativeTime(alert.createdAt)}
              assignee={alert.assignee}
              status={alert.status}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
