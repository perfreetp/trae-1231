import { useMemo } from 'react';
import {
  Clock,
  Send,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  CircleCheck,
  ChevronRight,
  Users,
  FileWarning,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrderStore } from '@/store/orderStore';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import type { OrderStatus } from '@/shared/types';

type PipelineKey = 'unassigned' | 'inprogress' | 'reviewed' | 'rejected' | 'accepted';

interface PipelineStage {
  key: PipelineKey;
  label: string;
  icon: typeof Clock;
  color: string;
  bg: string;
  border: string;
  hoverBorder: string;
  statuses: OrderStatus[];
}

const PIPELINE: PipelineStage[] = [
  {
    key: 'unassigned',
    label: '待派单',
    icon: Clock,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    hoverBorder: 'hover:border-violet-200',
    statuses: ['unassigned'],
  },
  {
    key: 'inprogress',
    label: '施工中',
    icon: Wrench,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-300',
    hoverBorder: 'hover:border-cyan-200',
    statuses: ['assigned', 'processing'],
  },
  {
    key: 'reviewed',
    label: '待验收',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-300',
    hoverBorder: 'hover:border-green-200',
    statuses: ['reviewed'],
  },
  {
    key: 'rejected',
    label: '整改中',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300',
    hoverBorder: 'hover:border-red-200',
    statuses: ['rejected'],
  },
  {
    key: 'accepted',
    label: '已完成',
    icon: CircleCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    hoverBorder: 'hover:border-emerald-200',
    statuses: ['accepted'],
  },
];

interface OrderClosureKanbanProps {
  className?: string;
  selectedStage?: PipelineKey | null;
  onStageClick?: (key: PipelineKey | null, statuses: OrderStatus[]) => void;
}

export default function OrderClosureKanban({ className, selectedStage, onStageClick }: OrderClosureKanbanProps) {
  const orders = useOrderStore((s) => s.orders);
  const diseases = useDiseaseStore((s) => s.diseases);
  const { teams, getTeamName } = useDictStore();

  const stageCounts = useMemo(() => {
    const counts: Record<PipelineKey, number> = {
      unassigned: 0,
      inprogress: 0,
      reviewed: 0,
      rejected: 0,
      accepted: 0,
    };
    orders.forEach((o) => {
      for (const stage of PIPELINE) {
        if (stage.statuses.includes(o.status)) {
          counts[stage.key]++;
          break;
        }
      }
    });
    return counts;
  }, [orders]);

  const total = orders.length;
  const closedRate = total > 0 ? Math.round((stageCounts.accepted / total) * 100) : 0;

  const teamBacklog = useMemo(() => {
    const now = Date.now();
    const map: Record<string, { teamId: string; backlog: number; overdue: number; inprogress: number; reviewed: number; rejected: number }> = {};

    teams.forEach((t) => {
      map[t.id] = { teamId: t.id, backlog: 0, overdue: 0, inprogress: 0, reviewed: 0, rejected: 0 };
    });

    const diseaseMap = new Map(diseases.map((d) => [d.id, d]));
    orders.forEach((o) => {
      if (!o.teamId) return;
      const slot = map[o.teamId];
      if (!slot) return;

      const disease = diseaseMap.get(o.diseaseId);
      const isBacklogStatus = ['assigned', 'processing', 'reviewed', 'rejected'].includes(o.status);
      if (isBacklogStatus) {
        slot.backlog++;
        if (o.status === 'assigned' || o.status === 'processing') slot.inprogress++;
        if (o.status === 'reviewed') slot.reviewed++;
        if (o.status === 'rejected') slot.rejected++;
        if (disease && new Date(disease.deadlineAt).getTime() < now) {
          slot.overdue++;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.backlog - a.backlog);
  }, [orders, diseases, teams]);

  const maxBacklog = Math.max(1, ...teamBacklog.map((t) => t.backlog));

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary-600" />
            工单闭环看板
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            全流程跟踪工单流转，点击节点筛选对应工单，查看班组积压情况
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-neutral-500">闭环率</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums text-emerald-600">{closedRate}</span>
              <span className="text-xs text-neutral-500">%</span>
            </div>
          </div>
          <div className="h-10 w-px bg-neutral-200" />
          <div className="text-right">
            <div className="text-xs text-neutral-500">处理中 / 总数</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums text-primary-600">
                {total - stageCounts.accepted - stageCounts.unassigned}
              </span>
              <span className="text-xs text-neutral-400">/</span>
              <span className="text-sm font-medium text-neutral-600 tabular-nums">{total}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-2 lg:gap-1 mb-6">
          {PIPELINE.map((stage, idx) => {
            const count = stageCounts[stage.key];
            const isSelected = selectedStage === stage.key;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex-1 flex items-stretch">
                <button
                  type="button"
                  onClick={() =>
                    onStageClick?.(isSelected ? null : stage.key, stage.statuses)
                  }
                  className={cn(
                    'flex-1 group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                    stage.bg,
                    isSelected
                      ? `${stage.border} shadow-md bg-white/70`
                      : `border-transparent ${stage.hoverBorder} hover:shadow-sm`
                  )}
                >
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                      isSelected ? 'bg-white shadow-sm' : `${stage.bg} border ${stage.border}`
                    )}
                  >
                    <Icon className={cn('w-5 h-5', stage.color)} />
                  </div>
                  <div className="text-center">
                    <div className={cn('text-xs font-medium', stage.color)}>{stage.label}</div>
                    <div className={cn('text-2xl font-bold tabular-nums mt-0.5', stage.color)}>
                      {count}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border shadow-sm flex items-center justify-center">
                      <ChevronRight className={cn('w-3 h-3', stage.color)} />
                    </span>
                  )}
                </button>

                {idx < PIPELINE.length - 1 && (
                  <div className="hidden lg:flex flex-shrink-0 w-4 items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-neutral-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              班组负载与超期预警
            </h3>
            <div className="flex items-center gap-4 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                积压
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                超期
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {teamBacklog.map((t) => (
              <div
                key={t.teamId}
                className={cn(
                  'p-3.5 rounded-lg border transition-all',
                  t.overdue > 0
                    ? 'border-red-200 bg-red-50/40 hover:bg-red-50/70'
                    : t.backlog > 6
                    ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                    : 'border-neutral-200 bg-neutral-50/40 hover:bg-neutral-50/70'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-neutral-800">
                    {getTeamName(t.teamId)}
                  </div>
                  {t.overdue > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-medium">
                      <FileWarning className="w-3 h-3" />
                      超期 {t.overdue}
                    </span>
                  )}
                </div>

                <div className="h-1.5 w-full bg-white rounded-full overflow-hidden mb-2">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      t.backlog >= 6 ? 'bg-amber-500' : 'bg-cyan-500'
                    )}
                    style={{ width: `${(t.backlog / maxBacklog) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">积压</div>
                    <div className="text-sm font-bold tabular-nums text-neutral-800">{t.backlog}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">施工</div>
                    <div className="text-sm font-medium tabular-nums text-cyan-700">{t.inprogress}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500 mb-0.5">整改</div>
                    <div className="text-sm font-medium tabular-nums text-red-700">{t.rejected}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { PipelineKey };
