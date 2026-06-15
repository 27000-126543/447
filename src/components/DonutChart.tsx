import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import { cn } from '@/lib/utils'

export interface DonutDataPoint {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: DonutDataPoint[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  centerLabel?: string
  centerValue?: string | number
  className?: string
  formatter?: (value: number) => string
}

const defaultColors = ['#FF6B35', '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EC4899']

function CustomTooltip({ active, payload, formatter }: TooltipProps<number, string> & { formatter?: (value: number) => string }) {
  if (!active || !payload || !payload.length) return null

  const entry = payload[0]

  return (
    <div className="glass-card px-3 py-2.5 text-sm shadow-card border-slate-600/50">
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="text-slate-300">{entry.name}</span>
        <span className="text-white font-medium ml-auto">
          {formatter ? formatter(Number(entry.value)) : entry.value?.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default function DonutChart({
  data,
  height = 260,
  innerRadius = 60,
  outerRadius = 90,
  centerLabel,
  centerValue,
  className,
  formatter,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={cn('relative w-full flex items-center justify-center', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors[index % defaultColors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip formatter={formatter} />}
            cursor={false}
          />
        </PieChart>
      </ResponsiveContainer>

      {(centerLabel || centerValue !== undefined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue !== undefined && (
            <span className="text-2xl font-display font-bold text-white">
              {typeof centerValue === 'number'
                ? formatter
                  ? formatter(centerValue)
                  : centerValue.toLocaleString()
                : centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-sm text-slate-400 mt-0.5">{centerLabel}</span>
          )}
          {!centerLabel && centerValue === undefined && (
            <span className="text-2xl font-display font-bold text-white">
              {formatter ? formatter(total) : total.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {data.length > 0 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {data.slice(0, 4).map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color || defaultColors[index % defaultColors.length] }}
              />
              <span className="text-slate-400 truncate max-w-[100px]">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
