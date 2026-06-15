import { useState, useEffect, Fragment } from 'react'
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  PartyPopper,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  type TooltipProps,
} from 'recharts'
import StatCard from '@/components/StatCard'
import { api } from '@/lib/api'
import type { InventoryForecast } from '@shared/types'
import { formatCurrency, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type StockHealth = 'healthy' | 'warning' | 'critical'

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="glass-card px-3 py-2.5 text-sm shadow-card border-slate-600/50">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}</span>
          <span className="text-white font-medium ml-auto">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Inventory() {
  const [data, setData] = useState<InventoryForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [skuSearch, setSkuSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get<InventoryForecast[]>('/inventory/forecast')
      if (res.data) {
        setData(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getStockHealth = (item: InventoryForecast): StockHealth => {
    const ratio = item.currentStock / item.safeStock
    if (ratio <= 1) return 'critical'
    if (ratio <= 1.5) return 'warning'
    return 'healthy'
  }

  const healthyCount = data.filter((i) => getStockHealth(i) === 'healthy').length
  const warningCount = data.filter((i) => getStockHealth(i) === 'warning').length
  const criticalCount = data.filter((i) => getStockHealth(i) === 'critical').length

  const categories = Array.from(new Set(data.map((i) => i.category)))

  const filteredData = data.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) return false
    if (skuSearch) {
      const keyword = skuSearch.toLowerCase()
      return (
        item.skuName.toLowerCase().includes(keyword) ||
        item.skuId.toLowerCase().includes(keyword)
      )
    }
    return true
  })

  const handleViewDetail = (skuId: string) => {
    console.log('View detail:', skuId)
  }

  const handleCreatePurchase = (skuId: string) => {
    console.log('Create purchase:', skuId)
  }

  const toggleExpand = (skuId: string) => {
    setExpandedRow(expandedRow === skuId ? null : skuId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white mb-1 flex items-center gap-2">
          <Package className="w-7 h-7 text-accent-400" />
          库存预测看板
        </h1>
        <p className="text-slate-400 text-sm">基于销量预测的智能库存监控与补货建议</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="库存健康"
          value={healthyCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
          suffix=" 个SKU"
        />
        <StatCard
          title="库存预警"
          value={warningCount}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
          suffix=" 个SKU"
        />
        <StatCard
          title="库存紧缺"
          value={criticalCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="pink"
          suffix=" 个SKU"
        />
      </div>

      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索SKU名称或编号..."
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field md:w-52"
          >
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>SKU信息</th>
                <th>分类</th>
                <th className="text-right" style={{ width: 200 }}>当前库存 / 安全库存</th>
                <th className="text-right">安全库存</th>
                <th className="text-right">30天预测销量</th>
                <th className="text-right">建议补货量</th>
                <th className="text-right" style={{ width: 160 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const health = getStockHealth(item)
                const ratio = Math.min(item.currentStock / Math.max(item.safeStock * 2, 1), 1)
                const isExpanded = expandedRow === item.skuId
                return (
                  <Fragment key={item.skuId}>
                    <tr
                      key={item.skuId}
                      className={cn(
                        index % 2 === 1 && 'bg-slate-900/30',
                        'cursor-pointer'
                      )}
                      onClick={() => toggleExpand(item.skuId)}
                    >
                      <td>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </td>
                      <td>
                        <div>
                          <div className="font-medium text-white">{item.skuName}</div>
                          <div className="text-xs text-slate-500">{item.skuId}</div>
                        </div>
                      </td>
                      <td>
                        <span className="badge border border-slate-600/50 bg-slate-700/30 text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  health === 'critical'
                                    ? 'text-rose-400'
                                    : health === 'warning'
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                )}
                              >
                                {item.currentStock}
                              </span>
                              <span className="text-xs text-slate-500">/ {item.safeStock}</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  health === 'critical'
                                    ? 'bg-rose-500'
                                    : health === 'warning'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                )}
                                style={{ width: `${ratio * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right text-slate-300">{item.safeStock}</td>
                      <td className="text-right text-slate-300">
                        {formatNumber(
                          item.forecast30d.reduce((s, f) => s + f.predicted, 0)
                        )}
                      </td>
                      <td className="text-right">
                        <span
                          className={cn(
                            'font-semibold',
                            item.currentStock <= item.safeStock
                              ? 'text-rose-400'
                              : 'text-slate-200'
                          )}
                        >
                          {item.suggestedReplenish > 0 ? `+${item.suggestedReplenish}` : '-'}
                        </span>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetail(item.skuId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCreatePurchase(item.skuId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-accent-400 hover:bg-accent-500/10 transition-all"
                            title="创建采购单"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${item.skuId}-expand`} className="bg-slate-900/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-white flex items-center gap-2">
                              <span>30天销量预测</span>
                              <span className="text-xs text-slate-500">
                                单位：件
                              </span>
                            </h4>
                            {item.festivalFactors.length > 0 && (
                              <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="text-slate-400">节庆/促销</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="w-full" style={{ height: 240 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={item.forecast30d}
                                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                  dataKey="date"
                                  stroke="#64748B"
                                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                                  axisLine={{ stroke: '#334155' }}
                                  tickLine={false}
                                  tickFormatter={(value) => value.slice(5)}
                                />
                                <YAxis
                                  stroke="#64748B"
                                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeDasharray: '3 3' }} />
                                <Legend
                                  wrapperStyle={{ paddingTop: 5 }}
                                  iconType="circle"
                                  iconSize={8}
                                  formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
                                />
                                {item.festivalFactors.map((f) => (
                                  <ReferenceLine
                                    key={f.date}
                                    x={f.date}
                                    stroke="#F59E0B"
                                    strokeDasharray="5 5"
                                    strokeWidth={1.5}
                                  />
                                ))}
                                <Line
                                  type="monotone"
                                  dataKey="predicted"
                                  name="预测销量"
                                  stroke="#FF6B35"
                                  strokeWidth={2}
                                  dot={false}
                                  activeDot={{ r: 4, fill: '#FF6B35', stroke: '#080E1A', strokeWidth: 2 }}
                                  strokeDasharray="5 3"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="actual"
                                  name="实际销量"
                                  stroke="#3B82F6"
                                  strokeWidth={2}
                                  dot={false}
                                  connectNulls
                                  activeDot={{ r: 4, fill: '#3B82F6', stroke: '#080E1A', strokeWidth: 2 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {item.festivalFactors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700/50">
                              {item.festivalFactors.map((f) => (
                                <div
                                  key={f.date}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs"
                                >
                                  <PartyPopper className="w-3 h-3" />
                                  {f.date.slice(5)} {f.name}
                                  <span className="text-amber-500/70">×{f.impact}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
