import { useMemo, useState } from 'react';
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
  Check,
  Filter,
  BarChart3,
  Activity,
  TrendingUp,
  TimerReset,
  TimerOff,
  CalendarDays,
  PlayCircle,
  StopCircle,
  X as XIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrderStore } from '@/store/orderStore';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import { useReviewStore } from '@/store/reviewStore';
import type { OrderStatus } from '@/shared/types';
import Select, { type SelectOption } from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';

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
  selectedTeamId?: string | null;
  onTeamClick?: (teamId: string | null) => void;
  filterTypeId?: string | null;
  onFilterTypeChange?: (id: string | null) => void;
}

export default function OrderClosureKanban({ className, selectedStage, onStageClick, selectedTeamId, onTeamClick, filterTypeId, onFilterTypeChange }: OrderClosureKanbanProps) {
  const orders = useOrderStore((s) => s.orders);
  const diseases = useDiseaseStore((s) => s.diseases);
  const { teams, getTeamName, diseaseTypes, getTypeName } = useDictStore();
  const { getAllReviewsByOrderId } = useReviewStore();
  const diseaseTypeOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '__all__', label: '全部道路类型' },
      ...diseaseTypes.map((t) => ({ value: t.id, label: t.name })),
    ];
  }, [diseaseTypes]);

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

  interface OverdueAnalysis {
    totalAnalyzed: number;
    filteredByType: number;
    filteredByTeam: number;
    arriveDelay: { count: number; avgHours: number; totalHours: number; pct: number };
    completeOverdue: { count: number; avgHours: number; totalHours: number; pct: number };
    planDuration: { avgHours: number };
    actualDuration: { avgHours: number };
    worstStage: 'arrive' | 'complete' | 'none';
  }

  const overdueAnalysis = useMemo<OverdueAnalysis>(() => {
    const now = Date.now();
    const diseaseMap = new Map(diseases.map((d) => [d.id, d]));
    const dispatchMap = new Map(orders.map((o) => [o.id, o]));
    let analyzed = 0;
    let arriveCount = 0, arriveTotal = 0;
    let completeCount = 0, completeTotal = 0;
    let planTotal = 0, planCnt = 0;
    let actualTotal = 0, actualCnt = 0;
    let typeFiltered = 0;
    let teamFiltered = 0;

    orders.forEach((o) => {
      const disease = diseaseMap.get(o.diseaseId);
      if (!disease) return;
      if (filterTypeId && filterTypeId !== '__all__' && disease.typeId !== filterTypeId) return;
      if (selectedTeamId && o.teamId !== selectedTeamId) return;
      typeFiltered++;
      if (selectedTeamId && o.teamId === selectedTeamId) teamFiltered++;

      const reviews = getAllReviewsByOrderId(o.id)
        .slice()
        .sort((a, b) => new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime());
      if (reviews.length === 0) return;

      const dispatchList = o.dispatchHistory?.length ? o.dispatchHistory : [{ teamId: o.teamId, plannedStart: o.plannedStart, plannedEnd: o.plannedEnd }];
      const rounds = Math.max(dispatchList.length, reviews.length);
      for (let i = 0; i < rounds; i++) {
        const d = dispatchList[i] || dispatchList[0];
        const r = reviews[i];
        if (!d || !r) continue;
        analyzed++;
        const ps = d.plannedStart ? new Date(d.plannedStart).getTime() : 0;
        const pe = d.plannedEnd ? new Date(d.plannedEnd).getTime() : 0;
        const ar = r.arrivedAt ? new Date(r.arrivedAt).getTime() : 0;
        const co = r.completedAt ? new Date(r.completedAt).getTime() : 0;

        if (ps && ar) {
          const diff = (ar - ps) / 3600000;
          if (diff > 0.5) {
            arriveCount++;
            arriveTotal += diff;
          }
        }
        if (pe && co) {
          const diff = (co - pe) / 3600000;
          if (diff > 0) {
            completeCount++;
            completeTotal += diff;
          } else if (pe < now && o.status !== 'accepted') {
            const diffNow = (now - pe) / 3600000;
            if (diffNow > 0) {
              completeCount++;
              completeTotal += diffNow;
            }
          }
        }
        if (ps && pe) {
          planTotal += (pe - ps) / 3600000;
          planCnt++;
        }
        if (ar && co) {
          actualTotal += (co - ar) / 3600000;
          actualCnt++;
        }
      }
    });

    const worst: OverdueAnalysis['worstStage'] =
      completeCount > arriveCount ? 'complete' : arriveCount > completeCount ? 'arrive' : 'none';
    const pctBase = Math.max(1, analyzed);

    return {
      totalAnalyzed: analyzed,
      filteredByType: typeFiltered,
      filteredByTeam: teamFiltered,
      arriveDelay: {
        count: arriveCount,
        avgHours: arriveCount > 0 ? Math.round((arriveTotal / arriveCount) * 10) / 10 : 0,
        totalHours: Math.round(arriveTotal * 10) / 10,
        pct: Math.round((arriveCount / pctBase) * 100),
      },
      completeOverdue: {
        count: completeCount,
        avgHours: completeCount > 0 ? Math.round((completeTotal / completeCount) * 10) / 10 : 0,
        totalHours: Math.round(completeTotal * 10) / 10,
        pct: Math.round((completeCount / pctBase) * 100),
      },
      planDuration: { avgHours: planCnt > 0 ? Math.round((planTotal / planCnt) * 10) / 10 : 0 },
      actualDuration: { avgHours: actualCnt > 0 ? Math.round((actualTotal / actualCnt) * 10) / 10 : 0 },
      worstStage: worst,
    };
  }, [orders, diseases, filterTypeId, selectedTeamId, getAllReviewsByOrderId]);

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
            {teamBacklog.map((t) => {
              const isSelected = selectedTeamId === t.teamId;
              return (
                <button
                  type="button"
                  key={t.teamId}
                  onClick={() => onTeamClick?.(isSelected ? null : t.teamId)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-lg border transition-all relative group',
                    t.overdue > 0
                      ? isSelected
                        ? 'border-red-400 bg-red-50/70 ring-2 ring-red-300 shadow'
                        : 'border-red-200 bg-red-50/40 hover:bg-red-50/70'
                      : t.backlog > 6
                        ? isSelected
                          ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300 shadow'
                          : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                        : isSelected
                          ? 'border-primary-400 bg-primary-50/70 ring-2 ring-primary-300 shadow'
                          : 'border-neutral-200 bg-neutral-50/40 hover:bg-neutral-50/70'
                  )}
                >
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center shadow">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-2 pr-1">
                    <div className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5">
                      {getTeamName(t.teamId)}
                      {onTeamClick && (
                        <span className="text-[10px] text-neutral-400 group-hover:text-neutral-600">
                          点击筛选
                        </span>
                      )}
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
                        isSelected ? 'bg-primary-500' : t.backlog >= 6 ? 'bg-amber-500' : 'bg-cyan-500'
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
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary-500" />
                  超期来源分析
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  从到场、完成、计划、实际四环节定位超期卡点，共分析 {overdueAnalysis.totalAnalyzed} 轮作业
                  {filterTypeId && filterTypeId !== '__all__' && (
                    <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                      类型：{getTypeName(filterTypeId)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-[180px]">
                  <Select
                    size="sm"
                    value={filterTypeId || '__all__'}
                    onChange={(v) => onFilterTypeChange?.(v === '__all__' ? null : v)}
                    options={diseaseTypeOptions}
                    placeholder="按道路类型筛选"
                    showClear={false}
                  />
                </div>
                {(filterTypeId && filterTypeId !== '__all__') && (
                  <button
                    type="button"
                    onClick={() => onFilterTypeChange?.(null)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
                  >
                    <XIcon className="w-3 h-3" />
                    清除类型
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className={cn(
                'rounded-lg border p-3.5 transition-all',
                overdueAnalysis.worstStage === 'arrive'
                  ? 'border-amber-400 bg-amber-50/60 ring-1 ring-amber-200'
                  : 'border-neutral-200 bg-gradient-to-br from-cyan-50/60 to-white'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center">
                      <PlayCircle className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-700">到场延迟</span>
                  </div>
                  {overdueAnalysis.worstStage === 'arrive' && (
                    <Badge variant="warning" size="sm">主要卡点</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-bold tabular-nums text-cyan-700">{overdueAnalysis.arriveDelay.count}</span>
                  <span className="text-xs text-neutral-500">轮次</span>
                  <span className="ml-auto text-[11px] text-neutral-500 tabular-nums">
                    平均 {overdueAnalysis.arriveDelay.avgHours}h
                  </span>
                </div>
                <div className="h-1.5 w-full bg-cyan-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${overdueAnalysis.arriveDelay.pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-neutral-500 tabular-nums">
                  占比 {overdueAnalysis.arriveDelay.pct}% · 累计 {overdueAnalysis.arriveDelay.totalHours}h
                </div>
              </div>

              <div className={cn(
                'rounded-lg border p-3.5 transition-all',
                overdueAnalysis.worstStage === 'complete'
                  ? 'border-red-400 bg-red-50/60 ring-1 ring-red-200'
                  : 'border-neutral-200 bg-gradient-to-br from-red-50/60 to-white'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-md bg-red-100 text-red-700 flex items-center justify-center">
                      <TimerOff className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-700">完成超期</span>
                  </div>
                  {overdueAnalysis.worstStage === 'complete' && (
                    <Badge variant="danger" size="sm">主要卡点</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-bold tabular-nums text-red-700">{overdueAnalysis.completeOverdue.count}</span>
                  <span className="text-xs text-neutral-500">轮次</span>
                  <span className="ml-auto text-[11px] text-neutral-500 tabular-nums">
                    平均 {overdueAnalysis.completeOverdue.avgHours}h
                  </span>
                </div>
                <div className="h-1.5 w-full bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${overdueAnalysis.completeOverdue.pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-neutral-500 tabular-nums">
                  占比 {overdueAnalysis.completeOverdue.pct}% · 累计 {overdueAnalysis.completeOverdue.totalHours}h
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 p-3.5 bg-gradient-to-br from-violet-50/60 to-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-700">平均计划工期</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-bold tabular-nums text-violet-700">
                    {overdueAnalysis.planDuration.avgHours >= 24
                      ? (overdueAnalysis.planDuration.avgHours / 24).toFixed(1)
                      : overdueAnalysis.planDuration.avgHours.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {overdueAnalysis.planDuration.avgHours >= 24 ? '天' : '小时'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-violet-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, overdueAnalysis.planDuration.avgHours > 0 ? (overdueAnalysis.actualDuration.avgHours / overdueAnalysis.planDuration.avgHours) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-neutral-500">
                  计划/实际 比值：{overdueAnalysis.planDuration.avgHours > 0 ? ((overdueAnalysis.actualDuration.avgHours / overdueAnalysis.planDuration.avgHours) * 100).toFixed(0) : '--'}%
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 p-3.5 bg-gradient-to-br from-emerald-50/60 to-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <StopCircle className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-700">平均实际处置</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-bold tabular-nums text-emerald-700">
                    {overdueAnalysis.actualDuration.avgHours >= 24
                      ? (overdueAnalysis.actualDuration.avgHours / 24).toFixed(1)
                      : overdueAnalysis.actualDuration.avgHours.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {overdueAnalysis.actualDuration.avgHours >= 24 ? '天' : '小时'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, overdueAnalysis.actualDuration.avgHours > 0 ? (overdueAnalysis.actualDuration.avgHours / Math.max(overdueAnalysis.planDuration.avgHours, overdueAnalysis.actualDuration.avgHours, 1)) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-neutral-500">
                  效率指数：{overdueAnalysis.planDuration.avgHours > 0 && overdueAnalysis.actualDuration.avgHours <= overdueAnalysis.planDuration.avgHours ? '按时' : overdueAnalysis.planDuration.avgHours === 0 ? '--' : '延期'}
                </div>
              </div>
            </div>

            {(overdueAnalysis.arriveDelay.count > 0 || overdueAnalysis.completeOverdue.count > 0) && (
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1.5">
                {overdueAnalysis.worstStage === 'complete' && (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-red-700">处置完成超期为主要卡点</span>，
                      共 {overdueAnalysis.completeOverdue.count} 轮，平均超期 {overdueAnalysis.completeOverdue.avgHours} 小时。
                      建议：优化计划完成时间设置 {selectedTeamId ? '，重点关注该班组处置能力匹配度' : '，结合班组能力合理分配工单'}。
                    </span>
                  </div>
                )}
                {overdueAnalysis.worstStage === 'arrive' && (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-amber-700">到场延迟为主要卡点</span>，
                      共 {overdueAnalysis.arriveDelay.count} 轮，平均延迟 {overdueAnalysis.arriveDelay.avgHours} 小时。
                      建议：优化派单后班组调度路径，加强到场打卡管理。
                    </span>
                  </div>
                )}
                {overdueAnalysis.worstStage === 'none' && overdueAnalysis.arriveDelay.count > 0 && (
                  <div className="flex items-start gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>
                      到场延迟与完成超期分布均衡，建议从全流程节点进行整体管控。
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { PipelineKey };
