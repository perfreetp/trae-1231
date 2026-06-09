import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendUp?: boolean;
  iconBg?: string;
  color?: string;
  className?: string;
}

const defaultGradients: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-rose-500 to-rose-600',
  purple: 'from-violet-500 to-violet-600',
  cyan: 'from-cyan-500 to-cyan-600',
};

const defaultColors: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  orange: 'text-orange-600',
  red: 'text-rose-600',
  purple: 'text-violet-600',
  cyan: 'text-cyan-600',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  iconBg = 'blue',
  color = 'blue',
  className,
}: StatCardProps) {
  const gradientClass = defaultGradients[iconBg] || iconBg;
  const colorClass = defaultColors[color] || color;
  const isTrendPositive = trendUp ?? (trend !== undefined && trend >= 0);

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg border border-neutral-200',
        'p-5 overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:-translate-y-0.5 hover:border-neutral-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 truncate">{title}</p>
          <p
            className={cn(
              'mt-3 font-mono text-3xl font-semibold tracking-tight',
              colorClass
            )}
          >
            {value}
          </p>
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              {isTrendPositive ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isTrendPositive ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
              <span className="text-xs text-neutral-400">环比</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'relative flex-shrink-0 w-12 h-12 rounded-lg',
            'flex items-center justify-center',
            'bg-gradient-to-br shadow-sm',
            gradientClass,
            'transition-transform duration-300',
            'group-hover:scale-110'
          )}
        >
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
      </div>

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1',
          'bg-gradient-to-r opacity-60',
          gradientClass,
          'transform scale-x-0 origin-left',
          'transition-transform duration-500 ease-out',
          'hover:scale-x-100'
        )}
      />
    </div>
  );
}
