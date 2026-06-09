import { useEffect, useMemo } from 'react';
import {
  X,
  MapPin,
  AlertTriangle,
  FileText,
  ClipboardList,
  CheckCircle2,
  Clock,
  Ruler,
  Layers,
  Navigation,
  Wrench,
  BadgeCheck,
  Camera,
  Calendar,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Disease } from '@/shared/types';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useOrderStore } from '@/store/orderStore';
import { useReviewStore } from '@/store/reviewStore';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import { useDictStore } from '@/store/dictStore';

interface DiseaseDetailProps {
  open: boolean;
  diseaseId: string | null;
  onClose: () => void;
}

interface TimelineItem {
  key: string;
  title: string;
  icon: typeof MapPin;
  time: string | null;
  done: boolean;
  current: boolean;
  color: string;
  description?: string;
}

const statusLabelMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  pending: { label: '待派单', variant: 'warning' },
  assigned: { label: '已派单', variant: 'info' },
  processing: { label: '处置中', variant: 'info' },
  reviewed: { label: '待验收', variant: 'warning' },
  accepted: { label: '已验收', variant: 'success' },
  rejected: { label: '已驳回', variant: 'danger' },
};

const warningLabelMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  none: { label: '正常', variant: 'success' },
  approaching: { label: '即将超时', variant: 'warning' },
  overdue: { label: '已超时', variant: 'danger' },
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '--';
  }
}

export default function DiseaseDetail({
  open,
  diseaseId,
  onClose,
}: DiseaseDetailProps) {
  const { diseases } = useDiseaseStore();
  const { getOrderByDiseaseId } = useOrderStore();
  const { getReviewByOrderId } = useReviewStore();
  const { getByOrderId } = useAcceptanceStore();
  const { getRoadName, getGridName, getTeamName, getTypeName, getLevelName, diseaseTypes, diseaseLevels } = useDictStore();

  const disease = useMemo<Disease | undefined>(() => {
    if (!diseaseId) return undefined;
    return diseases.find((d) => d.id === diseaseId);
  }, [diseases, diseaseId]);

  const order = useMemo(() => {
    if (!disease) return undefined;
    return getOrderByDiseaseId(disease.id);
  }, [disease, getOrderByDiseaseId]);

  const review = useMemo(() => {
    if (!order) return undefined;
    return getReviewByOrderId(order.id);
  }, [order, getReviewByOrderId]);

  const acceptance = useMemo(() => {
    if (!order) return undefined;
    return getByOrderId(order.id);
  }, [order, getByOrderId]);

  const typeInfo = useMemo(() => {
    if (!disease) return null;
    return diseaseTypes.find((t) => t.id === disease.typeId) || null;
  }, [disease, diseaseTypes]);

  const levelInfo = useMemo(() => {
    if (!disease) return null;
    return diseaseLevels.find((l) => l.id === disease.levelId) || null;
  }, [disease, diseaseLevels]);

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [
      {
        key: 'report',
        title: '病害上报',
        icon: FileText,
        time: disease?.reportedAt || null,
        done: !!disease?.reportedAt,
        current: !disease || disease.status === 'pending',
        color: 'bg-blue-500',
        description: disease ? `上报人：${disease.reporter}` : undefined,
      },
      {
        key: 'assign',
        title: '工单派发',
        icon: ClipboardList,
        time: order?.assignedAt || null,
        done: !!order?.assignedAt,
        current: disease?.status === 'assigned',
        color: 'bg-violet-500',
        description: order ? `派单人：${order.dispatcher || '--'}` : undefined,
      },
      {
        key: 'arrive',
        title: '到场处置',
        icon: Wrench,
        time: review?.arrivedAt || null,
        done: !!review?.arrivedAt,
        current: disease?.status === 'processing',
        color: 'bg-orange-500',
        description: review ? `施工人员：${review.workers.join('、') || '--'}` : undefined,
      },
      {
        key: 'complete',
        title: '处置完成',
        icon: CheckCircle2,
        time: review?.completedAt || null,
        done: !!review?.completedAt,
        current: disease?.status === 'reviewed',
        color: 'bg-emerald-500',
        description: review ? `处置措施：${review.disposalMeasures || '--'}` : undefined,
      },
      {
        key: 'accept',
        title: '验收通过',
        icon: BadgeCheck,
        time: acceptance?.inspectedAt || null,
        done: !!acceptance?.inspectedAt && acceptance.result === 'passed',
        current: disease?.status === 'accepted',
        color: 'bg-cyan-500',
        description: acceptance ? `验收人：${acceptance.inspector}` : undefined,
      },
    ];
    return items;
  }, [disease, order, review, acceptance]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-xl h-full',
          'bg-white shadow-2xl',
          'flex flex-col',
          'animate-in slide-in-from-right duration-300 ease-out'
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-neutral-900 leading-tight truncate">
                {disease ? getTypeName(disease.typeId) : '病害详情'}
              </h2>
              {disease && (
                <Badge variant={statusLabelMap[disease.status]?.variant || 'neutral'} size="sm">
                  {statusLabelMap[disease.status]?.label || disease.status}
                </Badge>
              )}
              {disease && disease.warningFlag !== 'none' && (
                <Badge variant={warningLabelMap[disease.warningFlag]?.variant || 'neutral'} size="sm" dot>
                  {warningLabelMap[disease.warningFlag]?.label}
                </Badge>
              )}
            </div>
            {disease && (
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {disease.id}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(disease.reportedAt)}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              'flex-shrink-0 w-8 h-8 -m-1 flex items-center justify-center',
              'rounded-md text-neutral-400',
              'hover:bg-white hover:text-neutral-600',
              'transition-colors duration-200'
            )}
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!disease ? (
            <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
              未找到病害信息
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <section>
                <SectionTitle title="基本信息" icon={FileText} />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <InfoItem icon={MapPin} label="所属道路" value={getRoadName(disease.roadId)} />
                  <InfoItem icon={Layers} label="所属网格" value={getGridName(disease.gridId)} />
                  <InfoItem icon={AlertTriangle} label="病害类型" value={getTypeName(disease.typeId)} valueColor={typeInfo?.color || undefined} />
                  <InfoItem icon={AlertTriangle} label="病害等级" value={getLevelName(disease.levelId)} valueColor={levelInfo?.color || undefined} />
                  <InfoItem icon={Ruler} label="桩号" value={disease.stakeNo} />
                  <InfoItem icon={Ruler} label="面积" value={`${disease.areaM2} m²`} />
                  <InfoItem icon="span" label="影响车道" value={disease.affectedLanes.join('、') || '--'} full />
                  <InfoItem icon={Navigation} label="经纬度" value={`${disease.lat.toFixed(5)}, ${disease.lng.toFixed(5)}`} full />
                  <InfoItem icon={Clock} label="截止期限" value={formatDateTime(disease.deadlineAt)} full />
                </div>
                {disease.description && (
                  <div className="mt-3 p-3 rounded-md bg-neutral-50 border border-neutral-200">
                    <p className="text-xs font-medium text-neutral-500 mb-1">病害描述</p>
                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {disease.description}
                    </p>
                  </div>
                )}
              </section>

              {disease.photoBefore && (
                <section>
                  <SectionTitle title="现场照片（处置前）" icon={Camera} />
                  <div className="mt-3 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video">
                    <img
                      src={disease.photoBefore}
                      alt="处置前照片"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </section>
              )}

              <section>
                <SectionTitle title="全流程时间线" icon={Clock} />
                <div className="mt-4 pl-2">
                  <ol className="relative border-l border-neutral-200 ml-2">
                    {timeline.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.key} className="mb-5 ml-5 last:mb-0">
                          <span
                            className={cn(
                              'absolute -left-[9px] flex items-center justify-center',
                              'w-4 h-4 rounded-full border-2 border-white',
                              item.color,
                              item.done ? 'shadow-sm' : 'bg-neutral-200'
                            )}
                          >
                            {item.done && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </span>
                          <div
                            className={cn(
                              'flex items-center gap-2 mb-0.5',
                              item.current && !item.done ? 'opacity-100' : ''
                            )}
                          >
                            <h4
                              className={cn(
                                'text-sm font-medium leading-none',
                                item.done || item.current ? 'text-neutral-900' : 'text-neutral-400'
                              )}
                            >
                              {item.title}
                            </h4>
                            {item.current && !item.done && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                当前环节
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(item.time)}
                          </div>
                          {item.description && (
                            <p className="text-xs text-neutral-600">
                              {item.description}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>

              {order && (
                <section>
                  <SectionTitle title="关联工单" icon={ClipboardList} />
                  <div className="mt-3 p-4 rounded-md border border-neutral-200 bg-neutral-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">工单号</span>
                      <span className="text-sm font-mono font-medium text-neutral-900">{order.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">处置班组</span>
                      <span className="text-sm font-medium text-neutral-900">{getTeamName(order.teamId)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">计划开始</span>
                      <span className="text-sm text-neutral-700">{formatDateTime(order.plannedStart)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">计划完成</span>
                      <span className="text-sm text-neutral-700">{formatDateTime(order.plannedEnd)}</span>
                    </div>
                    {order.remark && (
                      <div className="pt-2 border-t border-neutral-200">
                        <span className="text-xs text-neutral-500 block mb-1">备注</span>
                        <p className="text-sm text-neutral-700">{order.remark}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {review && (
                <section>
                  <SectionTitle title="处置复核" icon={Wrench} />
                  <div className="mt-3 p-4 rounded-md border border-neutral-200 bg-neutral-50/50 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-xs text-neutral-500 block">到场时间</span>
                        <span className="text-sm text-neutral-700">{formatDateTime(review.arrivedAt)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">完成时间</span>
                        <span className="text-sm text-neutral-700">{formatDateTime(review.completedAt)}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500 block mb-1">施工人员</span>
                      <span className="text-sm text-neutral-700">{review.workers.join('、') || '--'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500 block mb-1">处置措施</span>
                      <span className="text-sm text-neutral-700">{review.disposalMeasures || '--'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-xs text-neutral-500 block">是否封路</span>
                        <span className="text-sm text-neutral-700">{review.roadClosed ? '是' : '否'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 block">封路时段</span>
                        <span className="text-sm text-neutral-700">{review.closurePeriod || '--'}</span>
                      </div>
                    </div>
                    {review.trafficGuide && (
                      <div>
                        <span className="text-xs text-neutral-500 block mb-1">交通疏导</span>
                        <span className="text-sm text-neutral-700">{review.trafficGuide}</span>
                      </div>
                    )}
                    {review.materials.length > 0 && (
                      <div className="pt-2 border-t border-neutral-200">
                        <span className="text-xs text-neutral-500 block mb-2">材料使用</span>
                        <div className="space-y-1.5">
                          {review.materials.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-neutral-700">
                                {m.materialName} × {m.quantity} {m.unit}
                              </span>
                              <span className="font-mono font-medium text-neutral-900">
                                ¥{m.subtotal.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {acceptance && (
                <section>
                  <SectionTitle title="验收记录" icon={BadgeCheck} />
                  <div className="mt-3 p-4 rounded-md border border-neutral-200 bg-neutral-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">验收结果</span>
                      <Badge
                        variant={acceptance.result === 'passed' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {acceptance.result === 'passed' ? '验收通过' : '验收驳回'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">质量评分</span>
                      <span className="text-sm font-mono font-semibold text-neutral-900">
                        {acceptance.qualityScore} / 100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">验收人</span>
                      <span className="text-sm text-neutral-700">{acceptance.inspector}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">验收时间</span>
                      <span className="text-sm text-neutral-700">{formatDateTime(acceptance.inspectedAt)}</span>
                    </div>
                    {acceptance.reworkCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">返工次数</span>
                        <span className="text-sm font-medium text-danger-600">
                          {acceptance.reworkCount} 次
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-neutral-200">
                      <span className="text-xs text-neutral-500 block mb-1">验收意见</span>
                      <p className="text-sm text-neutral-700">{acceptance.opinion || '--'}</p>
                    </div>
                    {acceptance.rejectReason && (
                      <div className="pt-2 border-t border-danger-100 bg-danger-50/50 -mx-4 -mb-4 px-4 py-3 rounded-b-md">
                        <span className="text-xs text-danger-600 font-medium block mb-1">驳回原因</span>
                        <p className="text-sm text-danger-700">{acceptance.rejectReason}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: typeof MapPin }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      <div className="flex-1 h-px bg-neutral-200 ml-2" />
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  valueColor,
  full,
}: {
  icon: any;
  label: string;
  value: string;
  valueColor?: string;
  full?: boolean;
}) {
  return (
    <div className={cn('flex items-start gap-2 min-w-0', full && 'col-span-2')}>
      <span className="w-5 h-5 mt-0.5 flex items-center justify-center text-neutral-400 flex-shrink-0">
        {typeof Icon === 'string' ? (
          <Layers className="w-4 h-4" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
        <p
          className={cn(
            'text-sm font-medium truncate',
            !valueColor && 'text-neutral-900'
          )}
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
