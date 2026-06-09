import { useDictStore } from '@/store/dictStore';
import { DISEASE_STATUS_MAP } from '@/utils/constants';
import { cn } from '@/lib/utils';

interface MapLegendProps {
  className?: string;
}

export default function MapLegend({ className }: MapLegendProps) {
  const { diseaseTypes, diseaseLevels } = useDictStore();

  const statusItems = Object.entries(DISEASE_STATUS_MAP).map(([key, val]) => ({
    key,
    label: val.label,
    color: val.color,
  }));

  return (
    <div
      className={cn(
        'bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-md',
        'p-4 space-y-5',
        className
      )}
    >
      <div>
        <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
          病害类型
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {diseaseTypes.map((t) => (
            <div key={t.id} className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-xs text-neutral-600 truncate">{t.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
          病害等级
        </h4>
        <div className="space-y-2">
          {diseaseLevels.map((l) => (
            <div key={l.id} className="flex items-center gap-2">
              <div
                className="w-6 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: l.color }}
              />
              <span className="text-xs text-neutral-600 flex-1">{l.name}</span>
              <span className="text-[10px] text-neutral-400 tabular-nums">
                {l.deadlineHours}h
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
          处理状态
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {statusItems.map((s) => (
            <div key={s.key} className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  s.color.split(' ').find((c) => c.startsWith('bg-'))?.replace('bg-', 'bg-').replace('-50', '-400').replace('-100', '-300')
                )}
                style={{
                  backgroundColor:
                    s.key === 'pending' ? '#9CA3AF'
                    : s.key === 'assigned' ? '#3B82F6'
                    : s.key === 'processing' ? '#F59E0B'
                    : s.key === 'reviewed' ? '#06B6D4'
                    : s.key === 'accepted' ? '#22C55E'
                    : '#EF4444',
                }}
              />
              <span className="text-xs text-neutral-600 truncate">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
          预警标识
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex-shrink-0 w-3 h-3">
              <span className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
              <span className="relative block w-3 h-3 rounded-full bg-red-500" />
            </span>
            <span className="text-xs text-neutral-600">已逾期</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
            <span className="text-xs text-neutral-600">即将到期</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-neutral-300 flex-shrink-0" />
            <span className="text-xs text-neutral-600">正常</span>
          </div>
        </div>
      </div>
    </div>
  );
}
