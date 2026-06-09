import { useEffect, useRef } from 'react';
import { CalendarDays, Clock, Eye, Send, User, Phone, AlertCircle } from 'lucide-react';
import type { WorkOrder, DiseaseLevelCode } from '@/shared/types';
import { useDictStore } from '@/store/dictStore';
import { useDiseaseStore } from '@/store/diseaseStore';
import { ORDER_STATUS_MAP } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface OrderCardProps {
  order: WorkOrder;
  onAssign?: (orderId: string) => void;
  onView?: (orderId: string) => void;
  className?: string;
  highlight?: boolean;
  reworkCount?: number;
}

const priorityBarColors: Record<DiseaseLevelCode, string> = {
  critical: 'bg-red-600',
  severe: 'bg-orange-500',
  moderate: 'bg-yellow-400',
  mild: 'bg-green-500',
};

const priorityBadgeVariants: Record<DiseaseLevelCode, 'success' | 'warning' | 'danger' | 'info'> = {
  critical: 'danger',
  severe: 'warning',
  moderate: 'warning',
  mild: 'success',
};

export default function OrderCard({ order, onAssign, onView, className, highlight, reworkCount = 0 }: OrderCardProps) {
  const getRoadName = useDictStore((s) => s.getRoadName);
  const getTypeName = useDictStore((s) => s.getTypeName);
  const getLevelName = useDictStore((s) => s.getLevelName);
  const teams = useDictStore((s) => s.teams);
  const diseases = useDiseaseStore((s) => s.diseases);
  const cardRef = useRef<HTMLDivElement>(null);

  const disease = diseases.find((d) => d.id === order.diseaseId);
  const team = teams.find((t) => t.id === order.teamId);

  useEffect(() => {
    if (highlight && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlight]);

  if (!disease) return null;

  const statusInfo = ORDER_STATUS_MAP[order.status];
  const priorityColor = priorityBarColors[order.priority];
  const priorityVariant = priorityBadgeVariants[order.priority];

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative flex bg-white rounded-lg border',
        'transition-all duration-200 ease-out',
        'hover:translate-y-[-1px] hover:shadow-lg hover:border-neutral-300',
        'overflow-hidden',
        highlight ? 'border-amber-400 ring-2 ring-amber-300/60 shadow-amber-100 shadow-md' : 'border-neutral-200',
        className
      )}
    >
      <div className={cn('w-1.5 flex-shrink-0', priorityColor)} />

      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <h3 className="text-sm font-semibold text-neutral-900 truncate">
                {getRoadName(disease.roadId)} · {disease.stakeNo}
              </h3>
              {reworkCount > 0 && (
                <Badge variant="danger" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
                  返工×{reworkCount}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-neutral-500 truncate">
              {getTypeName(disease.typeId)} · {disease.description}
            </p>
          </div>
          <span className="flex-shrink-0 text-[10px] font-mono text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded">
            {order.id}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={priorityVariant} size="sm" dot>
            {getLevelName(order.priority)}
          </Badge>
          <span
            className={cn(
              'inline-flex items-center justify-center h-5 px-2 text-[11px] font-medium rounded-md border leading-none',
              order.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : statusInfo.color
            )}
          >
            {order.status === 'rejected' ? '待整改' : statusInfo.label}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-neutral-500 ml-auto">
            <Clock className="w-3 h-3" />
            <span>到期 {formatDateTime(disease.deadlineAt)}</span>
          </div>
        </div>

        {team && (
          <div className="flex items-center gap-4 mb-3 p-2.5 bg-neutral-50 rounded-md">
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium text-neutral-700">{team.name}</span>
              <span className="text-neutral-400">·</span>
              <span>{team.leader}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Phone className="w-3 h-3 text-neutral-400" />
              <span>{team.phone}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {(order.status === 'unassigned' || order.status === 'rejected') && onAssign && (
            <Button
              size="sm"
              variant={order.status === 'rejected' ? 'warning' : 'primary'}
              icon={Send}
              onClick={() => onAssign(order.id)}
            >
              {order.status === 'rejected' ? '重新派单' : '派单'}
            </Button>
          )}
          {onView && (
            <Button size="sm" variant="secondary" icon={Eye} onClick={() => onView(order.id)}>
              查看详情
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-neutral-400">
            <CalendarDays className="w-3 h-3" />
            <span>创建 {formatDateTime(disease.reportedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
