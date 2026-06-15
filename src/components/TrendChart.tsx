import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'

export interface TrendDataPoint {
  date: string
  value: number
  [key: string]: string | number
}

interface TrendChartProps {
  data: TrendDataPoint[]
  dataKeys?: string[]
  colors?: string[]
  type?: 'line' | 'area'
  xAxisKey?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  smooth?: boolean
  className?: string
  formatter?: (value: number) => string
}

const defaultColors = ['#FF6B35', '#3B82F6', '#10B981', '#A855F7', '#F59E0B']

function CustomTooltip({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (value: number) => string }) {
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
            {formatter ? formatter(Number(entry.value)) : entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({
  data,
  dataKeys = ['value'],
  colors = defaultColors,
  type = 'area',
  xAxisKey = 'date',
  height = 280,
  showGrid = true,
  smooth = true,
  className,
  formatter,
}: TrendChartProps) {
  const ChartComponent = type === 'area' ? AreaChart : LineChart

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="#64748B"
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatter?.(value) ?? value.toLocaleString()}
          />
          <Tooltip
            content={<CustomTooltip formatter={formatter} />}
            cursor={{ stroke: '#475569', strokeDasharray: '3 3' }}
          />
          {dataKeys.map((key, index) => {
            const color = colors[index % colors.length]
            if (type === 'area') {
              return (
                <Area
                  key={key}
                  type={smooth ? 'monotone' : 'linear'}
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#gradient-${key})`}
                  activeDot={{ r: 4, fill: color, stroke: '#080E1A', strokeWidth: 2 }}
                  dot={false}
                />
              )
            }
            return (
              <Line
                key={key}
                type={smooth ? 'monotone' : 'linear'}
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: '#080E1A', strokeWidth: 2 }}
              />
            )
          })}
          <defs>
            {dataKeys.map((key, index) => {
              const color = colors[index % colors.length]
              return (
                <linearGradient key={`gradient-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              )
            })}
          </defs>
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}
