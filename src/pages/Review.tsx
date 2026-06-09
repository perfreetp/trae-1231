import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  Ruler,
  Layers,
  FileText,
  Camera,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageContainer from '@/components/layout/PageContainer';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Empty from '@/components/Empty';
import ReviewForm from '@/components/order/ReviewForm';
import { useReviewStore } from '@/store/reviewStore';
import { useOrderStore } from '@/store/orderStore';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import type { Disease, WorkOrder, DiseaseLevelCode } from '@/shared/types';
import {
  DISEASE_LEVEL_MAP,
  DISEASE_TYPE_MAP,
  ORDER_STATUS_MAP,
} from '@/utils/constants';
import { formatDateTime } from '@/utils/format';

const levelPriorityColors: Record<DiseaseLevelCode, string> = {
  critical: 'border-l-danger-500 bg-danger-50/40',
  severe: 'border-l-warning-500 bg-warning-50/40',
  moderate: 'border-l-warning-400 bg-warning-50/30',
  mild: 'border-l-success-500 bg-success-50/30',
};

const levelBadgeVariants: Record<DiseaseLevelCode, 'success' | 'warning' | 'danger' | 'info'> = {
  critical: 'danger',
  severe: 'warning',
  moderate: 'warning',
  mild: 'success',
};

export default function Review() {
  const { getPendingReviewOrders, selectedOrderId, setSelectedOrderId, reviews, getReviewByOrderId, getAllReviewsByOrderId } = useReviewStore();
  const { orders } = useOrderStore();
  const { diseases } = useDiseaseStore();
  const { roads, teams, getRoadName, getTypeName, getTeamName } = useDictStore();
  const { getReworkCount } = useAcceptanceStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterRoad, setFilterRoad] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  useEffect(() => {
    useReviewStore.getState()._ensureInit();
    useOrderStore.getState()._ensureInit();
    useAcceptanceStore.getState()._ensureInit();
  }, []);

  const pendingOrders = useMemo(() => {
    const list = getPendingReviewOrders();
    return list
      .map(({ orderId, diseaseId }) => {
        const order = orders.find((o) => o.id === orderId);
        const disease = diseases.find((d) => d.id === diseaseId);
        const reworkCount = order ? getReworkCount(order.id) : 0;
        return { orderId, diseaseId, order, disease, reworkCount };
      })
      .filter((item) => item.order && item.disease) as {
      orderId: string;
      diseaseId: string;
      order: WorkOrder;
      disease: Disease;
      reworkCount: number;
    }[];
  }, [getPendingReviewOrders, orders, diseases, getReworkCount]);

  const filteredPending = useMemo(() => {
    let list = pendingOrders;
    if (filterRoad) {
      list = list.filter((item) => item.disease.roadId === filterRoad);
    }
    if (filterTeam) {
      list = list.filter((item) => item.order.teamId === filterTeam);
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      list = list.filter((item) => {
        const roadName = getRoadName(item.disease.roadId);
        const typeName = getTypeName(item.disease.typeId);
        const text = `${roadName} ${item.disease.stakeNo} ${item.disease.description} ${typeName} ${item.orderId}`.toLowerCase();
        return text.includes(kw);
      });
    }
    return list;
  }, [pendingOrders, filterRoad, filterTeam, searchKeyword, getRoadName, getTypeName]);

  const sortedFiltered = useMemo(() => {
    const priorityMap: Record<DiseaseLevelCode, number> = {
      critical: 4,
      severe: 3,
      moderate: 2,
      mild: 1,
    };
    return [...filteredPending].sort(
      (a, b) => priorityMap[b.disease.levelId] - priorityMap[a.disease.levelId]
    );
  }, [filteredPending]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) return null;
    const disease = diseases.find((d) => d.id === order.diseaseId);
    return { order, disease };
  }, [selectedOrderId, orders, diseases]);

  const historyReviews = selectedOrderId ? getAllReviewsByOrderId(selectedOrderId) : [];
  const latestReview = historyReviews[0];
  const selectedReworkCount = selectedOrderId ? getReworkCount(selectedOrderId) : 0;

  const roadOptions: SelectOption[] = roads.map((r) => ({
    value: r.id,
    label: r.name,
    description: `长度 ${r.lengthKm}km`,
  }));

  const teamOptions: SelectOption[] = teams.map((t) => ({
    value: t.id,
    label: `${t.name} - ${t.leader}`,
  }));

  const handleReviewSuccess = () => {
    setSelectedOrderId(null);
  };

  return (
    <PageContainer title="现场复核" subtitle="对处置完成的工单进行现场复核登记">
      <div className="space-y-6 h-full flex flex-col min-h-0">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Filter className="w-4 h-4 text-neutral-400" />
              <span className="font-medium text-neutral-700">筛选</span>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                value={filterRoad}
                onChange={setFilterRoad}
                options={roadOptions}
                placeholder="全部道路"
                clearable
              />
              <Select
                value={filterTeam}
                onChange={setFilterTeam}
                options={teamOptions}
                placeholder="全部班组"
                clearable
              />
              <Input
                type="search"
                placeholder="搜索道路/病害关键词..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onClear={() => setSearchKeyword('')}
                showClear
                leftIcon={Search}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col min-h-0">
            <div className="bg-white rounded-lg border border-neutral-200 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0">
                <h3 className="text-sm font-semibold text-neutral-700">
                  待复核工单
                  <span className="ml-2 text-xs text-neutral-400 font-normal">
                    共 {sortedFiltered.length} 条
                  </span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {sortedFiltered.length === 0 ? (
                  <div className="h-64">
                    <Empty />
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {sortedFiltered.map((item) => {
                      const isActive = selectedOrderId === item.orderId;
                      return (
                        <li key={item.orderId}>
                          <button
                            onClick={() => setSelectedOrderId(item.orderId)}
                            className={cn(
                              'w-full text-left p-4 transition-all duration-200 border-l-4',
                              levelPriorityColors[item.disease.levelId],
                              isActive && 'bg-primary-50/60 ring-1 ring-inset ring-primary-200'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  <Badge
                                    variant={levelBadgeVariants[item.disease.levelId]}
                                    size="sm"
                                    dot
                                  >
                                    {DISEASE_LEVEL_MAP[item.disease.levelId]}
                                  </Badge>
                                  {item.reworkCount > 0 && (
                                    <Badge variant="danger" size="sm" icon={<RefreshCw className="w-3 h-3" />}>
                                      返工×{item.reworkCount}
                                    </Badge>
                                  )}
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {item.orderId}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-neutral-900 truncate">
                                  {getRoadName(item.disease.roadId)} · {item.disease.stakeNo}
                                </div>
                              </div>
                              <ChevronRight
                                className={cn(
                                  'w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-200',
                                  isActive
                                    ? 'text-primary-600 translate-x-0.5'
                                    : 'text-neutral-300'
                                )}
                              />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-neutral-500">
                              <span className="inline-flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {DISEASE_TYPE_MAP[item.disease.typeId]}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Ruler className="w-3 h-3" />
                                {item.disease.areaM2}m²
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {getTeamName(item.order.teamId)}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-neutral-600 line-clamp-2">
                              {item.disease.description}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0 gap-6 overflow-y-auto">
            {!selectedOrder ? (
              <div className="flex-1 bg-white rounded-lg border border-neutral-200 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-neutral-300" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-1">
                    请选择待复核工单
                  </h3>
                  <p className="text-xs text-neutral-400">
                    点击左侧列表中的工单查看详情并进行复核
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2 flex-wrap">
                        病害基本信息
                        {selectedReworkCount > 0 && (
                          <Badge variant="danger" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
                            返工工单 · 已退回{selectedReworkCount}次
                          </Badge>
                        )}
                      </h3>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {selectedOrder.order.id} ·{' '}
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border',
                            selectedOrder.order.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : ORDER_STATUS_MAP[selectedOrder.order.status].color
                          )}
                        >
                          {selectedOrder.order.status === 'rejected' ? '整改中' : ORDER_STATUS_MAP[selectedOrder.order.status].label}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={levelBadgeVariants[selectedOrder.disease.levelId]}
                        size="md"
                        dot
                      >
                        {DISEASE_LEVEL_MAP[selectedOrder.disease.levelId]}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                    <div className="md:col-span-2 aspect-square md:aspect-auto bg-neutral-100 relative overflow-hidden min-h-[240px]">
                      {selectedOrder.disease.photoBefore ? (
                        <img
                          src={selectedOrder.disease.photoBefore}
                          alt="病害照片"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                          <Camera className="w-12 h-12 mb-2 opacity-50" />
                          <span className="text-xs">暂无病害照片</span>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/50 text-white text-[11px] font-medium backdrop-blur-sm">
                        修复前照片
                      </div>
                    </div>

                    <div className="md:col-span-3 p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            道路名称
                          </div>
                          <div className="font-medium text-neutral-900">
                            {getRoadName(selectedOrder.disease.roadId)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            桩号
                          </div>
                          <div className="font-medium text-neutral-900">
                            {selectedOrder.disease.stakeNo}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            病害等级
                          </div>
                          <div className="font-medium text-neutral-900">
                            {DISEASE_LEVEL_MAP[selectedOrder.disease.levelId]}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <FileText className="w-3.5 h-3.5" />
                            病害类型
                          </div>
                          <div className="font-medium text-neutral-900">
                            {DISEASE_TYPE_MAP[selectedOrder.disease.typeId]}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <Ruler className="w-3.5 h-3.5" />
                            病害面积
                          </div>
                          <div className="font-medium text-neutral-900">
                            {selectedOrder.disease.areaM2} m²
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <Layers className="w-3.5 h-3.5" />
                            影响车道
                          </div>
                          <div className="font-medium text-neutral-900">
                            {selectedOrder.disease.affectedLanes.length > 0
                              ? selectedOrder.disease.affectedLanes.join('、')
                              : '--'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-neutral-100">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2">
                          <FileText className="w-3.5 h-3.5" />
                          病害描述
                        </div>
                        <div className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-md p-3">
                          {selectedOrder.disease.description}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100 text-sm">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <User className="w-3.5 h-3.5" />
                            负责班组
                          </div>
                          <div className="font-medium text-neutral-900">
                            {getTeamName(selectedOrder.order.teamId)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            派单时间
                          </div>
                          <div className="font-medium text-neutral-900">
                            {selectedOrder.order.assignedAt
                              ? formatDateTime(selectedOrder.order.assignedAt)
                              : '--'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {historyReviews.length > 0 && (
                  <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-6">
                    <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success-500" />
                      历史复核记录
                      <span className="text-xs text-neutral-400 font-normal">
                        共 {historyReviews.length} 次
                      </span>
                    </h3>
                    {historyReviews.map((hr, idx) => {
                      const round = historyReviews.length - idx;
                      return (
                        <div key={hr.id} className="border-t border-neutral-100 pt-5 first:border-t-0 first:pt-0">
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="info" size="sm">
                              第 {round} 轮处置
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">到场时间</div>
                              <div className="font-medium text-neutral-900 tabular-nums">
                                {formatDateTime(hr.arrivedAt)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">完成时间</div>
                              <div className="font-medium text-neutral-900 tabular-nums">
                                {formatDateTime(hr.completedAt)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">处置人员</div>
                              <div className="font-medium text-neutral-900">
                                {hr.workers.join('、')}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">是否封路</div>
                              <div className="font-medium text-neutral-900">
                                {hr.roadClosed ? '是' : '否'}
                              </div>
                            </div>
                          </div>
                          {hr.disposalMeasures && (
                            <div className="mt-4 pt-4 border-t border-neutral-100">
                              <div className="text-xs text-neutral-500 mb-2">处置措施</div>
                              <div className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-md p-3">
                                {hr.disposalMeasures}
                              </div>
                            </div>
                          )}
                          {hr.materials.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-neutral-100">
                              <div className="text-xs text-neutral-500 mb-2">材料用量</div>
                              <div className="overflow-hidden rounded-md border border-neutral-200">
                                <table className="w-full text-sm">
                                  <thead className="bg-neutral-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600">
                                        材料名称
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600">
                                        单位
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600">
                                        数量
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600">
                                        单价
                                      </th>
                                      <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600">
                                        小计
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-100">
                                    {hr.materials.map((m) => (
                                      <tr key={m.id}>
                                        <td className="px-3 py-2 text-neutral-800">{m.materialName}</td>
                                        <td className="px-3 py-2 text-neutral-600">{m.unit}</td>
                                        <td className="px-3 py-2 text-right text-neutral-800 tabular-nums">{m.quantity}</td>
                                        <td className="px-3 py-2 text-right text-neutral-600 tabular-nums">¥{m.unitPrice.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-medium text-neutral-900 tabular-nums">
                                          ¥{m.subtotal.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <ReviewForm
                  orderId={selectedOrder.order.id}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setSelectedOrderId(null)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
