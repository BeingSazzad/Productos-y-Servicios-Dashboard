import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { RevenueChartPoint, TimeSeriesPoint } from '@/types/models'
import { formatCurrency } from '@/lib/utils'

export function RevenueChart({ data }: { data: (RevenueChartPoint | TimeSeriesPoint)[] }) {
  const chartData = data.map((item) => ({
    month: 'month' in item ? item.month : item.label,
    revenue: item.revenue,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#039855" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#039855" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eaecf0" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#667085', fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#667085', fontSize: 12 }}
          tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), 'Revenue']}
          contentStyle={{ borderRadius: 8, border: '1px solid #eaecf0', fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#039855"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
