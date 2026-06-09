import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarningBadgeProps {
  warningFlag: 'none' | 'approaching' | 'overdue';
  showText?: boolean;
  className?: string;
}

export default function WarningBadge({ warningFlag, showText = true, className }: WarningBadgeProps) {
  if (warningFlag === 'none') return null;

  const isOverdue = warningFlag === 'overdue';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5',
        className
      )}
    >
      <span className="relative flex-shrink-0">
        <span
          className={cn(
            'block w-2.5 h-2.5 rounded-full',
            isOverdue ? 'bg-red-500' : 'bg-orange-500'
          )}
        />
        {isOverdue && (
          <span
            className={cn(
              'absolute inset-0 w-2.5 h-2.5 rounded-full bg-red-500',
              'animate-ping opacity-75'
            )}
          />
        )}
      </span>
      {showText && (
        <span
          className={cn(
            'text-xs font-medium',
            isOverdue ? 'text-red-600' : 'text-orange-600'
          )}
        >
          {isOverdue ? (
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              已逾期
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              即将到期
            </span>
          )}
        </span>
      )}
    </div>
  );
}
