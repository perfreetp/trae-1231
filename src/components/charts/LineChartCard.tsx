import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface LineChartDataItem {
  name: string;
  [key: string]: string | number;
}

interface DataKeyConfig {
  key: string;
  label: string;
  color?: string;
}

interface LineChartCardProps {
  title: string;
  description?: string;
  data: LineChartDataItem[];
  dataKeys: (string | DataKeyConfig)[];
  height?: number;
  showArea?: boolean;
  showLegend?: boolean;
  className?: string;
}

const defaultLineColors = [
  { stroke: '#3B82F6', fill: '#3B82F6', fillStart: 'rgba(59,130,246,0.25)', fillEnd: 'rgba(59,130,246,0.02)' },
  { stroke: '#22C55E', fill: '#22C55E', fillStart: 'rgba(34,197,94,0.25)', fillEnd: 'rgba(34,197,94,0.02)' },
  { stroke: '#F97316', fill: '#F97316', fillStart: 'rgba(249,115,22,0.25)', fillEnd: 'rgba(249,115,22,0.02)' },
  { stroke: '#8B5CF6', fill: '#8B5CF6', fillStart: 'rgba(139,92,246,0.25)', fillEnd: 'rgba(139,92,246,0.02)' },
  { stroke: '#06B6D4', fill: '#06B6D4', fillStart: 'rgba(6,182,212,0.25)', fillEnd: 'rgba(6,182,212,0.02)' },
];

function normalizeDataKey(item: string | DataKeyConfig, index: number): DataKeyConfig {
  if (typeof item === 'string') {
    return { key: item, label: item };
  }
  return item;
}

interface LineLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

function LineLegend({ payload }: LineLegendProps) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 justify-end">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-neutral-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function LineChartCard({
  title,
  description,
  data,
  dataKeys,
  height = 280,
  showArea = true,
  showLegend = true,
  className,
}: LineChartCardProps) {
  const normalizedKeys = useMemo(
    () => dataKeys.map((k, i) => normalizeDataKey(k, i)),
    [dataKeys]
  );

  const uid = useMemo(() => `line-chart-${Math.random().toString(36).slice(2, 9)}`, []);

  const getGradientId = (i: number) => `${uid}-area-${i}`;

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
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {showLegend && (
          <LineLegend
            payload={normalizedKeys.map((k, i) => ({
              value: k.label,
              color: k.color || defaultLineColors[i % defaultLineColors.length].stroke,
            }))}
          />
        )}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              {normalizedKeys.map((_, i) => {
                const c = defaultLineColors[i % defaultLineColors.length];
                return (
                  <linearGradient
                    key={`grad-${i}`}
                    id={getGradientId(i)}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={c.fillStart} />
                    <stop offset="100%" stopColor={c.fillEnd} />
                  </linearGradient>
                );
              })}
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
                marginBottom: '6px',
              }}
              itemStyle={{
                color: '#475569',
              }}
            />

            {showArea &&
              normalizedKeys.map((k, i) => {
                const c = defaultLineColors[i % defaultLineColors.length];
                return (
                  <Area
                    key={`area-${k.key}`}
                    type="monotone"
                    dataKey={k.key}
                    stroke="none"
                    fill={`url(#${getGradientId(i)})`}
                    fillOpacity={1}
                  />
                );
              })}

            {normalizedKeys.map((k, i) => {
              const c = defaultLineColors[i % defaultLineColors.length];
              return (
                <Line
                  key={`line-${k.key}`}
                  type="monotone"
                  dataKey={k.key}
                  name={k.label}
                  stroke={k.color || c.stroke}
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: '#FFFFFF',
                    stroke: k.color || c.stroke,
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: k.color || c.stroke,
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
