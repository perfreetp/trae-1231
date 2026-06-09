import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface RankingItem {
  label: string;
  value: number;
  [key: string]: any;
}

interface RankingListProps {
  title: string;
  description?: string;
  items: RankingItem[];
  unit?: string;
  maxItems?: number;
  barColor?: string;
  className?: string;
}

const rankBadgeStyles: Record<number, string> = {
  1: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-200',
  2: 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-sm shadow-slate-200',
  3: 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-sm shadow-orange-200',
};

const barColorMap: Record<string, string> = {
  blue: 'from-blue-400 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-rose-400 to-rose-600',
  purple: 'from-violet-400 to-violet-600',
  cyan: 'from-cyan-400 to-cyan-600',
};

export default function RankingList({
  title,
  description,
  items,
  unit = '',
  maxItems,
  barColor = 'blue',
  className,
}: RankingListProps) {
  const displayItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    return maxItems ? sorted.slice(0, maxItems) : sorted;
  }, [items, maxItems]);

  const maxValue = useMemo(() => {
    if (displayItems.length === 0) return 0;
    return Math.max(...displayItems.map((i) => i.value));
  }, [displayItems]);

  const barGradient = barColorMap[barColor] || barColorMap.blue;

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

      {displayItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-400">
          暂无数据
        </div>
      ) : (
        <ul className="space-y-3">
          {displayItems.map((item, index) => {
            const rank = index + 1;
            const percentage = maxValue > 0 ? item.value / maxValue : 0;
            const badgeClass =
              rankBadgeStyles[rank] ||
              'bg-neutral-100 text-neutral-600';

            return (
              <li
                key={item.label + '-' + index}
                className={cn(
                  'group relative flex items-center gap-3',
                  'p-2 -mx-2 rounded-md',
                  'transition-all duration-200',
                  'hover:bg-neutral-50 hover:px-3 hover:-mx-3',
                  'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-md',
                    'flex items-center justify-center',
                    'text-xs font-bold tabular-nums',
                    badgeClass
                  )}
                >
                  {rank}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={cn(
                        'text-sm font-medium text-neutral-700 truncate',
                        'group-hover:text-neutral-900 transition-colors'
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-semibold text-neutral-900 tabular-nums flex-shrink-0'
                      )}
                    >
                      {item.value.toLocaleString()}
                      {unit && (
                        <span className="text-xs font-normal text-neutral-400 ml-0.5">
                          {unit}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={cn(
                        'h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out',
                        barGradient
                      )}
                      style={{ width: `${Math.max(percentage * 100, 4)}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
