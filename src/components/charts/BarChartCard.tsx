import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface BarChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: BarChartDataItem[];
  dataKey?: string;
  color?: string;
  gradientId?: string;
  height?: number;
  className?: string;
}

const defaultColors = {
  blue: { start: '#3B82F6', end: '#1D4ED8' },
  green: { start: '#22C55E', end: '#15803D' },
  orange: { start: '#F97316', end: '#C2410C' },
  red: { start: '#EF4444', end: '#B91C1C' },
  purple: { start: '#8B5CF6', end: '#6D28D9' },
  cyan: { start: '#06B6D4', end: '#0E7490' },
};

export default function BarChartCard({
  title,
  description,
  data,
  dataKey = 'value',
  color = 'blue',
  gradientId,
  height = 280,
  className,
}: BarChartCardProps) {
  const uid = useMemo(() => gradientId || `bar-grad-${Math.random().toString(36).slice(2, 9)}`, [gradientId]);
  const colorPair = (defaultColors as Record<string, { start: string; end: string }>)[color] || defaultColors.blue;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-neutral-200',
        'p-5',
        'transition-all duration-300',
        'hover:shadow-md',
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            barSize={32}
          >
            <defs>
              <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorPair.start} stopOpacity={0.9} />
                <stop offset="100%" stopColor={colorPair.end} stopOpacity={1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E2E8F0"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
            />

            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              labelStyle={{
                fontWeight: 600,
                color: '#0F172A',
                marginBottom: '4px',
              }}
              itemStyle={{
                color: '#475569',
              }}
            />

            <Bar
              dataKey={dataKey}
              fill={`url(#${uid})`}
              radius={[6, 6, 0, 0]}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${uid})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
