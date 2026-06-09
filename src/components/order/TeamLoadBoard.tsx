import { useMemo } from 'react';
import { Users, Phone } from 'lucide-react';
import { useDictStore } from '@/store/dictStore';
import { useOrderStore } from '@/store/orderStore';
import { cn } from '@/lib/utils';

interface TeamLoadBoardProps {
  className?: string;
}

const getProgressColor = (percent: number) => {
  if (percent >= 80) return 'bg-red-500';
  if (percent >= 60) return 'bg-orange-500';
  if (percent >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getProgressTrackColor = (percent: number) => {
  if (percent >= 80) return 'bg-red-100';
  if (percent >= 60) return 'bg-orange-100';
  if (percent >= 40) return 'bg-yellow-100';
  return 'bg-green-100';
};

export default function TeamLoadBoard({ className }: TeamLoadBoardProps) {
  const { teams } = useDictStore();
  const orders = useOrderStore((s) => s.orders);

  const teamLoad = useMemo(() => {
    const load: Record<string, number> = {};
    orders
      .filter((o) => ['assigned', 'processing', 'reviewed'].includes(o.status))
      .forEach((o) => {
        load[o.teamId] = (load[o.teamId] || 0) + 1;
      });
    return load;
  }, [orders]);

  const loadValues = Object.values(teamLoad);
  const maxLoad = Math.max(...loadValues, teams.length);
  const baseline = maxLoad > 0 ? maxLoad : 1;

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {teams.map((team) => {
        const load = teamLoad[team.id] || 0;
        const percent = Math.min(100, Math.round((load / baseline) * 100));
        const barColor = getProgressColor(percent);
        const trackColor = getProgressTrackColor(percent);

        return (
          <div
            key={team.id}
            className={cn(
              'bg-white rounded-lg border border-neutral-200 p-4',
              'transition-all duration-200',
              'hover:shadow-md hover:border-neutral-300'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center',
                  percent >= 80 ? 'bg-red-50 text-red-600' :
                  percent >= 60 ? 'bg-orange-50 text-orange-600' :
                  percent >= 40 ? 'bg-yellow-50 text-yellow-600' :
                  'bg-green-50 text-green-600'
                )}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{team.name}</div>
                  <div className="text-xs text-neutral-500">{team.leader}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-neutral-900">{load}</div>
                <div className="text-[10px] text-neutral-400">已分配工单</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-neutral-500">负载进度</span>
                <span className={cn(
                  'text-xs font-medium',
                  percent >= 80 ? 'text-red-600' :
                  percent >= 60 ? 'text-orange-600' :
                  percent >= 40 ? 'text-yellow-600' :
                  'text-green-600'
                )}>
                  {percent}%
                </span>
              </div>
              <div className={cn('h-2 rounded-full overflow-hidden', trackColor)}>
                <div
                  className={cn('h-full rounded-full transition-all duration-500', barColor)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Phone className="w-3 h-3 text-neutral-400" />
                <span>{team.phone}</span>
              </div>
              <div className="mt-1 text-[11px] text-neutral-400 truncate">
                成员：{team.members.join('、')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
