import { useEffect, useMemo, useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  User,
  Phone,
  ShieldAlert,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Disease, ReviewLog, AcceptanceRecord, WorkOrder } from '@/shared/types';
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

type TimelineNodeKey =
  | 'report'
  | 'assign'
  | 'arrive'
  | 'complete'
  | 'review'
  | 'accept-pass'
  | 'accept-reject';

interface TimelineNode {
  id: string;
  key: TimelineNodeKey;
  title: string;
  icon: typeof MapPin;
  time: string | null;
  done: boolean;
  current: boolean;
  color: string;
  round?: number;
  isReworkStart?: boolean;
  description?: string;
  relatedOrder?: WorkOrder;
  relatedReview?: ReviewLog;
  relatedAcceptance?: AcceptanceRecord;
}

const statusLabelMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  pending: { label: '待派单', variant: 'warning' },
  assigned: { label: '已派单', variant: 'info' },
  processing: { label: '处置中', variant: 'info' },
  reviewed: { label: '待验收', variant: 'warning' },
  accepted: { label: '已验收', variant: 'success' },
  rejected: { label: '整改中', variant: 'danger' },
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

function dateTimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DiseaseDetail({
  open,
  diseaseId,
  onClose,
}: DiseaseDetailProps) {
  const { diseases } = useDiseaseStore();
  const { getOrderByDiseaseId } = useOrderStore();
  const { getAllReviewsByOrderId } = useReviewStore();
  const { getAllByOrderId, getReworkCount } = useAcceptanceStore();
  const { getRoadName, getGridName, getTeamName, getTypeName, getLevelName, diseaseTypes, diseaseLevels } = useDictStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const disease = useMemo<Disease | undefined>(() => {
    if (!diseaseId) return undefined;
    return diseases.find((d) => d.id === diseaseId);
  }, [diseases, diseaseId]);

  const order = useMemo(() => {
    if (!disease) return undefined;
    return getOrderByDiseaseId(disease.id);
  }, [disease, getOrderByDiseaseId]);

  const allReviews = useMemo(() => {
    if (!order) return [] as ReviewLog[];
    return getAllReviewsByOrderId(order.id)
      .slice()
      .sort((a, b) => new Date(a.arrivedAt).getTime() - new Date(b.arrivedAt).getTime());
  }, [order, getAllReviewsByOrderId]);

  const allAcceptances = useMemo(() => {
    if (!order) return [] as AcceptanceRecord[];
    return getAllByOrderId(order.id)
      .slice()
      .sort((a, b) => new Date(a.inspectedAt).getTime() - new Date(b.inspectedAt).getTime());
  }, [order, getAllByOrderId]);

  const reworkCount = useMemo(
    () => (order ? getReworkCount(order.id) : 0),
    [order, getReworkCount]
  );

  const typeInfo = useMemo(() => {
    if (!disease) return null;
    return diseaseTypes.find((t) => t.id === disease.typeId) || null;
  }, [disease, diseaseTypes]);

  const levelInfo = useMemo(() => {
    if (!disease) return null;
    return diseaseLevels.find((l) => l.id === disease.levelId) || null;
  }, [disease, diseaseLevels]);

  const timeline: TimelineNode[] = useMemo(() => {
    const nodes: TimelineNode[] = [];

    nodes.push({
      id: 'report',
      key: 'report',
      title: '病害上报',
      icon: FileText,
      time: disease?.reportedAt || null,
      done: !!disease?.reportedAt,
      current: !disease || disease.status === 'pending',
      color: 'bg-blue-500',
      description: disease ? `上报人：${disease.reporter}` : undefined,
    });

    if (!order) {
      nodes.push({
        id: 'assign-pending',
        key: 'assign',
        title: '等待工单创建',
        icon: Clock,
        time: null,
        done: false,
        current: !!disease,
        color: 'bg-neutral-300',
      });
      return nodes;
    }

    const buildRoundNodes = (
      idx: number,
      review: ReviewLog | undefined,
      acceptance: AcceptanceRecord | undefined,
      isCurrentRound: boolean
    ) => {
      const round = idx + 1;
      const isRework = idx > 0;

      if (isRework) {
        nodes.push({
          id: `rework-start-${round}`,
          key: 'accept-reject',
          title: `第 ${round} 轮返工整改`,
          icon: RefreshCw,
          time: allAcceptances[idx - 1]?.inspectedAt || null,
          done: true,
          current: false,
          color: 'bg-amber-500',
          isReworkStart: true,
          round,
          description: `退回原因：${allAcceptances[idx - 1]?.rejectReason || '详见验收记录'}`,
          relatedAcceptance: allAcceptances[idx - 1],
        });
      }

      let stepCurrent = false;
      if (isCurrentRound && disease?.status === 'assigned') stepCurrent = true;
      nodes.push({
        id: `assign-${round}`,
        key: 'assign',
        title: isRework ? `返工派单 (第${round}轮)` : `工单派发`,
        icon: ClipboardList,
        time: order?.assignedAt || null,
        done: !!(order?.assignedAt && (!isRework || allAcceptances[idx - 1])),
        current: stepCurrent,
        color: 'bg-violet-500',
        round,
        description: order ? `派单人：${order.dispatcher || '--'}，班组：${getTeamName(order.teamId)}` : undefined,
        relatedOrder: order,
      });

      if (isCurrentRound && disease?.status === 'processing') stepCurrent = true;
      else stepCurrent = false;
      nodes.push({
        id: `arrive-${round}`,
        key: 'arrive',
        title: `到场处置${isRework ? ` (第${round}轮)` : ''}`,
        icon: Wrench,
        time: review?.arrivedAt || null,
        done: !!review?.arrivedAt,
        current: isCurrentRound && disease?.status === 'processing',
        color: 'bg-orange-500',
        round,
        description: review ? `施工人员：${review.workers.join('、') || '--'}` : undefined,
        relatedReview: review,
      });

      nodes.push({
        id: `complete-${round}`,
        key: 'complete',
        title: `处置完成${isRework ? ` (第${round}轮)` : ''}`,
        icon: CheckCircle2,
        time: review?.completedAt || null,
        done: !!review?.completedAt,
        current: isCurrentRound && disease?.status === 'reviewed' && !acceptance,
        color: 'bg-emerald-500',
        round,
        description: review ? `处置措施：${review.disposalMeasures || '--'}` : undefined,
        relatedReview: review,
      });

      if (acceptance) {
        const passed = acceptance.result === 'passed';
        nodes.push({
          id: `accept-${round}`,
          key: passed ? 'accept-pass' : 'accept-reject',
          title: `${passed ? '验收通过' : '验收退回'}${isRework ? ` (第${round}轮)` : ''}`,
          icon: BadgeCheck,
          time: acceptance.inspectedAt,
          done: true,
          current: isCurrentRound && disease?.status === 'accepted' && passed,
          color: passed ? 'bg-cyan-500' : 'bg-red-500',
          round,
          description: `验收人：${acceptance.inspector}，评分：${acceptance.qualityScore}/100${passed ? '' : '，退回待整改'}`,
          relatedAcceptance: acceptance,
        });
      } else if (review && isCurrentRound && disease?.status === 'reviewed') {
        nodes.push({
          id: `accept-pending-${round}`,
          key: 'accept-pass',
          title: `待验收${isRework ? ` (第${round}轮)` : ''}`,
          icon: Clock,
          time: null,
          done: false,
          current: true,
          color: 'bg-neutral-300',
          round,
        });
      }
    };

    const totalRounds = Math.max(1, allReviews.length, reworkCount + 1);
    for (let i = 0; i < totalRounds; i++) {
      const isLast = i === totalRounds - 1;
      buildRoundNodes(i, allReviews[i], allAcceptances[i], isLast);
    }

    return nodes;
  }, [disease, order, allReviews, allAcceptances, reworkCount, getTeamName]);

  useEffect(() => {
    if (open) {
      useOrderStore.getState()._ensureInit();
      useReviewStore.getState()._ensureInit();
      useAcceptanceStore.getState()._ensureInit();
    }
  }, [open]);

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

  useEffect(() => {
    if (open) setExpandedNodes(new Set());
  }, [open, diseaseId]);

  if (!open) return null;

  const renderNodeDetail = (node: TimelineNode) => {
    if (!expandedNodes.has(node.id)) return null;

    if (node.relatedOrder && (node.key === 'assign')) {
      const o = node.relatedOrder;
      return (
        <div className="mt-3 ml-6 p-4 rounded-lg bg-gradient-to-br from-violet-50 to-white border border-violet-100 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">工单号</div>
              <div className="font-mono text-neutral-800">{o.id}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">处置班组</div>
              <div className="font-medium text-neutral-800">{getTeamName(o.teamId)}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">计划开始</div>
              <div className="text-neutral-700 tabular-nums">{formatDateTime(o.plannedStart)}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">计划完成</div>
              <div className="text-neutral-700 tabular-nums">{formatDateTime(o.plannedEnd)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[11px] text-neutral-400 mb-0.5">派单人</div>
              <div className="flex items-center gap-1.5 text-neutral-700">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                {o.dispatcher || '--'}
              </div>
            </div>
          </div>
          {o.remark && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-1">派单备注</div>
              <div className="text-sm text-neutral-700 bg-white rounded-md p-2.5 border border-neutral-200">
                {o.remark}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (node.relatedReview && (node.key === 'arrive' || node.key === 'complete')) {
      const r = node.relatedReview;
      return (
        <div className="mt-3 ml-6 p-4 rounded-lg bg-gradient-to-br from-orange-50 to-white border border-orange-100 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">到场时间</div>
              <div className="text-neutral-700 tabular-nums">{formatDateTime(r.arrivedAt)}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">完成时间</div>
              <div className="text-neutral-700 tabular-nums">{formatDateTime(r.completedAt)}</div>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" />
              施工人员
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.workers.map((w, i) => (
                <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-white text-xs text-neutral-700 border border-neutral-200">
                  {w}
                </span>
              ))}
              {r.workers.length === 0 && <span className="text-xs text-neutral-400">--</span>}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-neutral-400 mb-1">处置措施</div>
            <div className="text-sm text-neutral-700 bg-white rounded-md p-2.5 border border-neutral-200">
              {r.disposalMeasures || '--'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                是否封路
              </div>
              <Badge variant={r.roadClosed ? 'danger' : 'success'} size="sm">
                {r.roadClosed ? '已封路' : '未封路'}
              </Badge>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">封路时段</div>
              <div className="text-sm text-neutral-700 tabular-nums">{r.closurePeriod || '--'}</div>
            </div>
          </div>
          {r.trafficGuide && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-1">交通疏导方案</div>
              <div className="text-sm text-neutral-700 bg-white rounded-md p-2.5 border border-neutral-200">
                {r.trafficGuide}
              </div>
            </div>
          )}
          {r.materials.length > 0 && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" />
                材料用量明细
              </div>
              <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">材料名称</th>
                      <th className="text-right px-3 py-2 font-medium">数量</th>
                      <th className="text-right px-3 py-2 font-medium">单价</th>
                      <th className="text-right px-3 py-2 font-medium">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {r.materials.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2">{m.materialName}</td>
                        <td className="text-right px-3 py-2 tabular-nums">{m.quantity} {m.unit}</td>
                        <td className="text-right px-3 py-2 tabular-nums">¥{m.unitPrice.toFixed(2)}</td>
                        <td className="text-right px-3 py-2 tabular-nums font-medium">¥{m.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 text-neutral-800 font-medium">
                    <tr>
                      <td className="px-3 py-2" colSpan={3}>合计</td>
                      <td className="text-right px-3 py-2 tabular-nums">
                        ¥{r.materials.reduce((s, m) => s + m.subtotal, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {r.photoDuring && (
              <div>
                <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  施工中照片
                </div>
                <div className="rounded-md overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                  <img
                    src={r.photoDuring}
                    alt="施工中"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                  />
                </div>
              </div>
            )}
            {r.photoAfter && (
              <div>
                <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  处置后照片
                </div>
                <div className="rounded-md overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                  <img
                    src={r.photoAfter}
                    alt="处置后"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (node.relatedAcceptance && (node.key === 'accept-pass' || node.key === 'accept-reject' || node.isReworkStart)) {
      const a = node.relatedAcceptance;
      const passed = a.result === 'passed';
      return (
        <div className={`mt-3 ml-6 p-4 rounded-lg bg-gradient-to-br border space-y-3 ${passed ? 'from-cyan-50 to-white border-cyan-100' : 'from-red-50 to-white border-red-100'}`}>
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-neutral-400 mb-0.5">验收结果</div>
            <Badge variant={passed ? 'success' : 'danger'} size="sm">
              {passed ? '验收通过' : '验收退回'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">质量评分</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-mono font-semibold text-neutral-900 tabular-nums">{a.qualityScore}</div>
                <div className="text-xs text-neutral-400">/ 100</div>
                <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', a.qualityScore >= 80 ? 'bg-emerald-500' : a.qualityScore >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(100, a.qualityScore)}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">返工次数</div>
              <div className="text-sm font-medium tabular-nums">
                {a.reworkCount > 0 ? (
                  <span className="text-danger-600">{a.reworkCount} 次</span>
                ) : (
                  <span className="text-neutral-500">初次验收</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">验收人</div>
              <div className="flex items-center gap-1.5 text-neutral-700">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                {a.inspector}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">验收时间</div>
              <div className="text-neutral-700 tabular-nums">{formatDateTime(a.inspectedAt)}</div>
            </div>
          </div>
          {a.opinion && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-1">验收意见</div>
              <div className="text-sm text-neutral-700 bg-white rounded-md p-2.5 border border-neutral-200">
                {a.opinion}
              </div>
            </div>
          )}
          {a.rejectReason && (
            <div className="p-3 rounded-md bg-red-100/60 border border-red-200">
              <div className="text-xs text-red-700 font-medium mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                驳回原因
              </div>
              <p className="text-sm text-red-800 leading-relaxed">{a.rejectReason}</p>
            </div>
          )}
        </div>
      );
    }

    if (node.key === 'report' && disease) {
      return (
        <div className="mt-3 ml-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">病害ID</div>
              <div className="font-mono text-neutral-800">{disease.id}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">上报人</div>
              <div className="flex items-center gap-1.5 text-neutral-700">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                {disease.reporter}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">道路 / 桩号</div>
              <div className="text-neutral-800 font-medium">{getRoadName(disease.roadId)} · {disease.stakeNo}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 mb-0.5">坐标</div>
              <div className="text-neutral-700 tabular-nums text-xs font-mono">{disease.lat.toFixed(5)}, {disease.lng.toFixed(5)}</div>
            </div>
          </div>
          {disease.photoBefore && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                上报照片（处置前）
              </div>
              <div className="rounded-md overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                <img
                  src={disease.photoBefore}
                  alt="处置前"
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
                />
              </div>
            </div>
          )}
          {disease.description && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-1">病害描述</div>
              <div className="text-sm text-neutral-700 bg-white rounded-md p-2.5 border border-neutral-200">
                {disease.description}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

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
          'relative z-10 w-full max-w-2xl h-full',
          'bg-white shadow-2xl',
          'flex flex-col',
          'animate-in slide-in-from-right duration-300 ease-out'
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-semibold text-neutral-900 leading-tight truncate">
                {disease ? getTypeName(disease.typeId) : '病害详情'}
              </h2>
              {disease && (
                <Badge variant={statusLabelMap[disease.status]?.variant || 'neutral'} size="sm">
                  {statusLabelMap[disease.status]?.label || disease.status}
                </Badge>
              )}
              {reworkCount > 0 && (
                <Badge variant="danger" size="sm" icon={<RefreshCw className="w-3 h-3" />}>
                  返工×{reworkCount}
                </Badge>
              )}
              {disease && disease.warningFlag !== 'none' && (
                <Badge variant={warningLabelMap[disease.warningFlag]?.variant || 'neutral'} size="sm" dot>
                  {warningLabelMap[disease.warningFlag]?.label}
                </Badge>
              )}
            </div>
            {disease && (
              <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {disease.id}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(disease.reportedAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {getRoadName(disease.roadId)} · {disease.stakeNo}
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
            <div className="p-6 space-y-7">
              <section>
                <SectionTitle title="基本信息" icon={FileText} />
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoItem icon={MapPin} label="所属道路" value={getRoadName(disease.roadId)} />
                  <InfoItem icon={Layers} label="所属网格" value={getGridName(disease.gridId)} />
                  <InfoItem icon={AlertTriangle} label="病害类型" value={getTypeName(disease.typeId)} valueColor={typeInfo?.color || undefined} />
                  <InfoItem icon={AlertTriangle} label="病害等级" value={getLevelName(disease.levelId)} valueColor={levelInfo?.color || undefined} />
                  <InfoItem icon={Ruler} label="桩号" value={disease.stakeNo} />
                  <InfoItem icon={Ruler} label="面积" value={`${disease.areaM2.toFixed(2)} m²`} />
                  <InfoItem icon="span" label="影响车道" value={disease.affectedLanes.join('、') || '--'} full />
                  <InfoItem icon={Navigation} label="经纬度" value={`${disease.lat.toFixed(5)}, ${disease.lng.toFixed(5)}`} />
                  <InfoItem icon={Clock} label="截止期限" value={formatDateTime(disease.deadlineAt)} />
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
                  <SectionTitle title="处置前照片" icon={Camera} />
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
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle title="完整流程时间线" icon={Clock} />
                  <button
                    onClick={() => setExpandedNodes(new Set(timeline.map((n) => n.id)))}
                    className="text-[11px] text-primary-600 hover:text-primary-700 font-medium"
                  >
                    展开全部
                  </button>
                </div>
                {timeline.length <= 1 ? (
                  <div className="ml-4 text-xs text-neutral-400 italic">
                    暂无工单流程记录，请先创建工单并派单
                  </div>
                ) : (
                  <div className="pl-2">
                    <ol className="relative border-l border-neutral-200 ml-2">
                      {timeline.map((node, idx) => {
                        const Icon = node.icon;
                        const isExpandable = node.key === 'report'
                          || node.key === 'assign'
                          || node.key === 'arrive'
                          || node.key === 'complete'
                          || node.key === 'accept-pass'
                          || node.key === 'accept-reject'
                          || !!node.isReworkStart;
                        const expanded = expandedNodes.has(node.id);
                        return (
                          <li key={node.id} className={cn('mb-5 ml-5 last:mb-0')}>
                            {node.isReworkStart && (
                              <div className="absolute -left-[18px] -top-2 bottom-2 w-[2px] bg-amber-300" />
                            )}
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center -ml-7 pt-0.5">
                                <span
                                  className={cn(
                                    'relative flex items-center justify-center',
                                    'w-5 h-5 rounded-full border-2 border-white',
                                    node.done ? node.color : 'bg-neutral-200',
                                    node.isReworkStart ? 'ring-2 ring-amber-300/60' : '',
                                    'shadow-sm'
                                  )}
                                >
                                  {node.done && !node.isReworkStart && (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  )}
                                  {node.isReworkStart && (
                                    <RefreshCw className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                  )}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  'flex-1 min-w-0 rounded-lg transition-colors',
                                  isExpandable && 'cursor-pointer hover:bg-neutral-50/80 -mx-2 px-2 py-1.5'
                                )}
                                onClick={() => isExpandable && toggleExpand(node.id)}
                              >
                                <div
                                  className={cn(
                                    'flex items-center gap-2 mb-0.5'
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <h4
                                      className={cn(
                                        'text-sm font-medium leading-none truncate',
                                        node.done || node.current ? 'text-neutral-900' : 'text-neutral-400'
                                      )}
                                    >
                                      {node.title}
                                    </h4>
                                    {node.current && !node.done && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                                        当前环节
                                      </span>
                                    )}
                                    {node.isReworkStart && (
                                      <Badge variant="warning" size="sm">
                                        返工节点
                                      </Badge>
                                    )}
                                  </div>
                                  {isExpandable && (
                                    <span className="flex-shrink-0 text-neutral-400">
                                      {expanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-0.5">
                                  <span className="inline-flex items-center gap-1 tabular-nums">
                                    <Clock className="w-3 h-3" />
                                    {formatDateTime(node.time)}
                                  </span>
                                </div>
                                {node.description && (
                                  <p className="text-xs text-neutral-600 leading-relaxed">
                                    {node.description}
                                  </p>
                                )}
                                {renderNodeDetail(node)}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </section>

              {order && (
                <section>
                  <SectionTitle title="工单摘要" icon={ClipboardList} />
                  <div className="mt-3 p-4 rounded-md border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">工单号</span>
                      <span className="text-sm font-mono font-medium text-neutral-900">{order.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">处置班组</span>
                      <span className="text-sm font-medium text-neutral-900">{getTeamName(order.teamId) || '--'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">计划开始</span>
                      <span className="text-sm text-neutral-700 tabular-nums">{formatDateTime(order.plannedStart)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">计划完成</span>
                      <span className="text-sm text-neutral-700 tabular-nums">{formatDateTime(order.plannedEnd)}</span>
                    </div>
                    {allReviews.length > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Package className="w-3 h-3" /> 累计材料费用
                        </span>
                        <span className="text-sm font-mono font-semibold text-neutral-900 tabular-nums">
                          ¥{allReviews.reduce(
                            (s, r) => s + r.materials.reduce((ss, m) => ss + m.subtotal, 0),
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {order.remark && (
                      <div className="pt-2 border-t border-neutral-200">
                        <span className="text-xs text-neutral-500 block mb-1">派单备注</span>
                        <p className="text-sm text-neutral-700">{order.remark}</p>
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
    <div className={cn('flex items-start gap-2 min-w-0', full && 'col-span-full md:col-span-3')}>
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
