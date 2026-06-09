import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

interface PieChartDataItem {
  name: string;
  value: number;
}

interface PieChartCardProps {
  title: string;
  description?: string;
  data: PieChartDataItem[];
  colors?: string[];
  height?: number;
  centerLabel?: string;
  className?: string;
}

const defaultColors = [
  '#3B82F6',
  '#22C55E',
  '#F97316',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F59E0B',
  '#EC4899',
];

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
    payload: PieChartDataItem;
  }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  if (!payload) return null;
  return (
    <div className="flex flex-col gap-2">
      {payload.map((entry, index) => {
        const item = entry.payload;
        return (
          <div key={`legend-${index}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-neutral-600 truncate">{entry.value}</span>
            </div>
            <span className="text-xs font-semibold text-neutral-900 tabular-nums">
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PieChartCard({
  title,
  description,
  data,
  colors,
  height = 280,
  centerLabel = '总数',
  className,
}: PieChartCardProps) {
  const colorList = colors || defaultColors;

  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const renderCustomLabel = ({
    cx,
    cy,
  }: {
    cx: number;
    cy: number;
  }) => {
    return (
      <g>
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          className="fill-neutral-500"
          style={{ fontSize: '12px' }}
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-neutral-900 font-semibold"
          style={{ fontSize: '22px', fontWeight: 600 }}
        >
          {total.toLocaleString()}
        </text>
      </g>
    );
  };

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

      <div className="flex items-center" style={{ height }}>
        <div style={{ width: '60%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                label={renderCustomLabel}
                labelLine={false}
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colorList[index % colorList.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [value.toLocaleString(), '数量']}
                labelStyle={{
                  fontWeight: 600,
                  color: '#0F172A',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: '40%' }} className="pl-4">
          <CustomLegend
            payload={data.map((item, index) => ({
            value: item.name,
            color: colorList[index % colorList.length],
            payload: item,
          }))}
          />
        </div>
      </div>
    </div>
  );
}
