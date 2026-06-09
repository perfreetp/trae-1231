import { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  History,
  ChevronRight,
  Wrench,
  Package,
  ShieldAlert,
  ThumbsUp,
  XCircle,
  RotateCcw,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PhotoCompare from '@/components/order/PhotoCompare';
import AcceptanceForm from '@/components/order/AcceptanceForm';
import Empty from '@/components/Empty';
import { cn } from '@/lib/utils';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useOrderStore } from '@/store/orderStore';
import { useReviewStore } from '@/store/reviewStore';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_LEVEL_MAP, DISEASE_TYPE_MAP, DISEASE_STATUS_MAP } from '@/utils/constants';
import { formatDateTime, formatArea, relativeTime } from '@/utils/format';
import type { Disease, WorkOrder, ReviewLog, AcceptanceRecord } from '@/shared/types';

interface PendingItem {
  orderId: string;
  diseaseId: string;
  disease: Disease | undefined;
  order: WorkOrder | undefined;
  review: ReviewLog | undefined;
}

export default function Acceptance() {
  const { getPendingAcceptance, records, getReworkCount, selectedOrderId, setSelectedOrderId, getAllByOrderId } = useAcceptanceStore();
  const { getAllReviewsByOrderId } = useReviewStore();
  const { diseases } = useDiseaseStore();
  const { orders } = useOrderStore();
  const { reviews, getReviewByOrderId } = useReviewStore();
  const { getRoadName, getLevelName, getTypeName } = useDictStore();

  const [activeTab, setActiveTab] = useState<string>('pending');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successResult, setSuccessResult] = useState<'passed' | 'rejected' | null>(null);
  const [successRecord, setSuccessRecord] = useState<AcceptanceRecord | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    useAcceptanceStore.getState()._ensureInit();
    useOrderStore.getState()._ensureInit();
    useReviewStore.getState()._ensureInit();
  }, []);

  const pendingList = useMemo<PendingItem[]>(() => {
    const pending = getPendingAcceptance();
    return pending.map((p) => ({
      ...p,
      disease: diseases.find((d) => d.id === p.diseaseId),
      order: orders.find((o) => o.id === p.orderId),
      review: getReviewByOrderId(p.orderId),
    }));
  }, [getPendingAcceptance, diseases, orders, getReviewByOrderId]);

  const acceptedList = useMemo(() => {
    return records
      .map((r) => {
        const order = orders.find((o) => o.id === r.orderId);
        const disease = diseases.find((d) => d.id === order?.diseaseId);
        return { record: r, order, disease };
      })
      .filter((x) => x.order && x.disease)
      .sort((a, b) => new Date(b.record.inspectedAt).getTime() - new Date(a.record.inspectedAt).getTime());
  }, [records, orders, diseases]);

  const selected = useMemo(() => {
    if (activeTab === 'pending') {
      const target = selectedOrderId ? pendingList.find((p) => p.orderId === selectedOrderId) : pendingList[0];
      return target
        ? (() => {
            const allReviews = target.orderId ? getAllReviewsByOrderId(target.orderId).slice().sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()) : [];
            return {
              orderId: target.orderId,
              disease: target.disease,
              order: target.order,
              review: allReviews[0] || target.review,
              allReviews,
              reworkCount: target.orderId ? getReworkCount(target.orderId) : 0,
              reworkHistory: target.orderId
                ? records.filter((r) => r.orderId === target.orderId && r.result === 'rejected')
                : [],
            };
          })()
        : null;
    } else {
      let target: typeof acceptedList[number] | undefined;
      if (selectedRecordId) {
        target = acceptedList.find((a) => a.record.id === selectedRecordId);
      }
      if (!target && selectedOrderId) {
        target = acceptedList.find((a) => a.record.orderId === selectedOrderId);
      }
      if (!target) target = acceptedList[0];
      if (!target) return null;
      const allReviews = getAllReviewsByOrderId(target.record.orderId).slice().sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      return {
        orderId: target.record.orderId,
        disease: target.disease,
        order: target.order,
        review: allReviews[0],
        allReviews,
        acceptanceRecord: target.record,
        reworkCount: getReworkCount(target.record.orderId),
        reworkHistory: records.filter((r) => r.orderId === target.record.orderId && r.result === 'rejected'),
      };
    }
  }, [activeTab, selectedOrderId, selectedRecordId, pendingList, acceptedList, records, getReviewByOrderId, getReworkCount, getAllReviewsByOrderId]);

  const handleAcceptanceSuccess = (lastRecord: AcceptanceRecord) => {
    setSuccessResult(lastRecord?.result || 'passed');
    setSuccessRecord(lastRecord || null);
    setSelectedRecordId(lastRecord?.id || null);
    setSelectedOrderId(lastRecord?.orderId || null);
    setShowSuccess(true);
    if (lastRecord?.result === 'rejected') {
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessResult(null);
        setSuccessRecord(null);
        setActiveTab('history');
      }, 3000);
    } else {
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessResult(null);
        setSuccessRecord(null);
        setSelectedOrderId(null);
        setSelectedRecordId(null);
      }, 2500);
    }
  };

  return (
    <PageContainer
      title="维修验收"
      subtitle="对已完成维修的病害进行质量验收和结果确认"
    >
      <div className="h-full flex gap-6">
        <div className="w-[420px] flex-shrink-0 flex flex-col bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="m-4 mb-0">
              <TabsTrigger value="pending">
                <Clock className="w-4 h-4 mr-1.5" />
                待验收
                <Badge variant="danger" size="sm" className="ml-2">
                  {pendingList.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-1.5" />
                历史验收
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <TabsContent value="pending" className="mt-4 p-0">
                {pendingList.length === 0 ? (
                  <div className="py-16 text-center">
                    <CheckCircle2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-neutral-600">暂无待验收工单</p>
                    <p className="text-xs text-neutral-400 mt-1">所有工单均已完成验收</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {pendingList.map((item) => (
                      <PendingListItem
                        key={item.orderId}
                        item={item}
                        selected={selectedOrderId === item.orderId}
                        onClick={() => setSelectedOrderId(item.orderId)}
                        getRoadName={getRoadName}
                        getLevelName={getLevelName}
                        getTypeName={getTypeName}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4 p-0">
                {acceptedList.length === 0 ? (
                  <div className="py-16 text-center">
                    <History className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-neutral-600">暂无历史验收记录</p>
                    <p className="text-xs text-neutral-400 mt-1">完成验收后记录将显示在此处</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {acceptedList.map((item) => (
                      <HistoryListItem
                        key={item.record.id}
                        record={item.record}
                        disease={item.disease}
                        selected={selectedRecordId === item.record.id || (!selectedRecordId && selectedOrderId === item.record.orderId)}
                        isJustSubmitted={successRecord?.id === item.record.id && activeTab === 'history'}
                        onClick={() => {
                          setSelectedRecordId(item.record.id);
                          setSelectedOrderId(item.record.orderId);
                        }}
                        getRoadName={getRoadName}
                        getTypeName={getTypeName}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto">
          {showSuccess ? (
            <SuccessBanner
              result={successResult!}
              record={successRecord || undefined}
              onViewHistory={() => {
                const last = successRecord;
                setShowSuccess(false);
                setActiveTab('history');
                if (last) {
                  setSelectedRecordId(last.id);
                  setSelectedOrderId(last.orderId);
                }
              }}
            />
          ) : selected ? (
            <div className="space-y-6 pb-8">
              {activeTab === 'pending' && selected.reworkCount > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-red-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200">
                        第 {selected.reworkCount + 1} 轮验收
                      </span>
                      <Badge variant="danger" size="sm">已返工 {selected.reworkCount} 次</Badge>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      本工单为<span className="font-medium text-red-600">返工验收</span>，前 {selected.reworkCount} 次验收未通过，请重点关注上次退回的问题是否已整改
                    </p>
                    {selected.reworkHistory && selected.reworkHistory.length > 0 && (() => {
                      const lastReject = selected.reworkHistory[selected.reworkHistory.length - 1];
                      return lastReject?.rejectReason ? (
                        <div className="mt-2 p-2.5 rounded-md bg-white/70 border border-amber-200 text-[11px] text-neutral-700">
                          <span className="font-semibold text-red-700 mr-1">上次退回原因：</span>
                          {lastReject.rejectReason}
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      {selected.disease && (
                        <>
                          <span className="text-primary-600">
                            {getTypeName(selected.disease.typeId)}
                          </span>
                          <span className="text-neutral-400">·</span>
                        </>
                      )}
                      <span>病害照片对比</span>
                      {activeTab === 'pending' && selected.reworkCount > 0 && (
                        <Badge variant="warning" size="sm" className="ml-2">
                          第 {selected.reworkCount + 1} 轮
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      左侧为病害发现时照片，右侧为维修完成后照片
                    </p>
                  </div>
                  {selected.disease && (
                    <Badge variant={selected.disease.levelId === 'critical' || selected.disease.levelId === 'severe' ? 'danger' : selected.disease.levelId === 'moderate' ? 'warning' : 'info'}>
                      {getLevelName(selected.disease.levelId)}
                    </Badge>
                  )}
                </div>
                <div className="p-6">
                  <PhotoCompare
                    photoBefore={selected.disease?.photoBefore || ''}
                    photoAfter={selected.review?.photoAfter || selected.review?.photoDuring || ''}
                    thumbnailsAfter={selected.review?.photoDuring && selected.review?.photoAfter ? [selected.review.photoDuring, selected.review.photoAfter] : undefined}
                  />
                </div>
              </div>

              {selected.disease && selected.review && (
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-primary-600" />
                      复核信息回顾
                    </h2>
                    {selected.allReviews && selected.allReviews.length > 0 && (
                      <Badge variant={selected.allReviews.length > 1 ? 'warning' : 'info'} size="sm">
                        共 {selected.allReviews.length} 轮复核
                      </Badge>
                    )}
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-6">
                    <InfoBlock
                      icon={Wrench}
                      title="处置措施"
                      color="text-blue-600"
                      bgColor="bg-blue-50"
                    >
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {selected.review.disposalMeasures}
                      </p>
                    </InfoBlock>

                    <InfoBlock
                      icon={Package}
                      title="使用材料"
                      color="text-emerald-600"
                      bgColor="bg-emerald-50"
                    >
                      <div className="space-y-1.5">
                        {selected.review.materials.length === 0 ? (
                          <p className="text-xs text-neutral-400">暂无材料记录</p>
                        ) : (
                          selected.review.materials.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-sm">
                              <span className="text-neutral-700">{m.materialName}</span>
                              <span className="text-neutral-500 tabular-nums">
                                {m.quantity} {m.unit}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </InfoBlock>

                    <InfoBlock
                      icon={ShieldAlert}
                      title="封路情况"
                      color="text-amber-600"
                      bgColor="bg-amber-50"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={selected.review.roadClosed ? 'warning' : 'success'} size="sm">
                            {selected.review.roadClosed ? '已封路' : '未封路'}
                          </Badge>
                          {selected.review.closurePeriod && (
                            <span className="text-neutral-500">{selected.review.closurePeriod}</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500">
                          交通疏导：{selected.review.trafficGuide}
                        </p>
                      </div>
                    </InfoBlock>

                    <InfoBlock
                      icon={MapPin}
                      title="位置信息"
                      color="text-violet-600"
                      bgColor="bg-violet-50"
                    >
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-neutral-700">{getRoadName(selected.disease.roadId)}</span>
                        </div>
                        <div className="text-neutral-500">
                          桩号 {selected.disease.stakeNo} · 面积 {formatArea(selected.disease.areaM2)}
                        </div>
                      </div>
                    </InfoBlock>
                  </div>
                </div>
              )}

              {selected.allReviews && selected.allReviews.length > 1 && (
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-100">
                    <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-amber-500" />
                      各轮复核追溯
                      <Badge variant="warning" size="sm" className="ml-1">
                        共 {selected.allReviews.length} 轮
                      </Badge>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      查看每一轮复核提交的现场照片、处置措施和使用材料
                    </p>
                  </div>
                  <div className="p-6 space-y-4">
                    {[...selected.allReviews]
                      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
                      .map((rv, idx) => {
                        const round = idx + 1;
                        const total = selected.allReviews!.length;
                        const isLatest = idx === total - 1;
                        const photoList = [rv.photoDuring, rv.photoAfter].filter(Boolean) as string[];
                        return (
                          <div
                            key={rv.id}
                            className={cn(
                              'rounded-lg border p-4 transition-all',
                              isLatest
                                ? 'border-amber-300 bg-gradient-to-br from-amber-50/50 to-white ring-1 ring-amber-200'
                                : 'border-neutral-200 bg-neutral-50/50'
                            )}
                          >
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={isLatest ? 'warning' : 'info'} size="sm">
                                  第 {round} 轮复核
                                </Badge>
                                {isLatest && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-medium">
                                    当前验收轮
                                  </span>
                                )}
                                {round <= (selected.reworkHistory?.length || 0) && (
                                  <Badge variant="danger" size="sm">对应第 {round} 轮验收退回</Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-500 tabular-nums flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  到场 {formatDateTime(rv.arrivedAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  完成 {formatDateTime(rv.completedAt)}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="text-[11px] font-medium text-neutral-500 mb-1.5 flex items-center gap-1">
                                  <Wrench className="w-3 h-3" /> 处置措施
                                </div>
                                <p className="text-xs text-neutral-700 leading-relaxed p-2 rounded bg-white border border-neutral-100">
                                  {rv.disposalMeasures}
                                </p>
                              </div>

                              <div>
                                <div className="text-[11px] font-medium text-neutral-500 mb-1.5 flex items-center gap-1">
                                  <Package className="w-3 h-3" /> 使用材料（{rv.materials.length}项）
                                </div>
                                <div className="p-2 rounded bg-white border border-neutral-100 space-y-1 max-h-24 overflow-y-auto">
                                  {rv.materials.length === 0 ? (
                                    <p className="text-[11px] text-neutral-400">未登记材料</p>
                                  ) : (
                                    rv.materials.map((m) => (
                                      <div key={m.id} className="flex items-center justify-between text-[11px]">
                                        <span className="text-neutral-700">{m.materialName}</span>
                                        <span className="text-neutral-500 tabular-nums">
                                          {m.quantity}{m.unit} · ¥{m.subtotal.toFixed(2)}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>

                            {photoList.length > 0 && (
                              <div className="mt-3">
                                <div className="text-[11px] font-medium text-neutral-500 mb-1.5 flex items-center gap-1">
                                  <Camera className="w-3 h-3" /> 现场照片（{photoList.length}张）
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {photoList.map((ph, i) => (
                                    <div key={i} className="aspect-video rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 relative group">
                                      <img src={ph} alt={`R${round}-${i + 1}`} className="w-full h-full object-cover" />
                                      <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/50 text-white text-[10px] font-medium">
                                        {i === 0 ? '处置中' : '处置后'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {selected.reworkHistory && selected.reworkHistory.length > 0 && (
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-danger-500" />
                    <h2 className="text-lg font-semibold text-neutral-900">退回记录</h2>
                    <Badge variant="danger" size="sm" className="ml-2">
                      {selected.reworkHistory.length} 次返工
                    </Badge>
                  </div>
                  <div className="p-6">
                    <ol className="relative border-l-2 border-danger-100 ml-3 space-y-6">
                      {selected.reworkHistory.map((record, idx) => (
                        <li key={record.id} className="ml-5">
                          <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-danger-500 border-2 border-white shadow-sm" />
                          <div className="bg-danger-50/50 border border-danger-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-danger-500" />
                                <span className="text-sm font-semibold text-danger-700">
                                  第 {idx + 1} 次退回
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDateTime(record.inspectedAt)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                              <User className="w-3.5 h-3.5" />
                              {record.inspector} · 评分 {record.qualityScore}分
                            </div>
                            {record.opinion && (
                              <p className="text-sm text-neutral-700 mb-2">
                                <span className="text-neutral-500">验收意见：</span>
                                {record.opinion}
                              </p>
                            )}
                            {record.rejectReason && (
                              <div className="bg-white rounded-md border border-danger-200 p-3">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-semibold text-danger-700 mb-1">退回原因</p>
                                    <p className="text-sm text-neutral-700">{record.rejectReason}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {activeTab === 'pending' && selected.orderId && !('acceptanceRecord' in selected) ? (
                <AcceptanceForm
                  orderId={selected.orderId}
                  onSuccess={handleAcceptanceSuccess}
                />
              ) : activeTab === 'history' && 'acceptanceRecord' in selected && selected.acceptanceRecord ? (
                <AcceptedRecordView record={selected.acceptanceRecord} />
              ) : null}
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-600">
                  {activeTab === 'pending' ? '请选择待验收工单' : '请选择历史记录'}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {activeTab === 'pending' ? '从左侧列表选择一个工单进行验收' : '从左侧列表查看验收详情'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function PendingListItem({
  item,
  selected,
  onClick,
  getRoadName,
  getLevelName,
  getTypeName,
}: {
  item: PendingItem;
  selected: boolean;
  onClick: () => void;
  getRoadName: (id: string) => string;
  getLevelName: (id: string) => string;
  getTypeName: (id: string) => string;
}) {
  const reworkCount = useAcceptanceStore.getState().getReworkCount(item.orderId);
  const acceptanceRound = reworkCount + 1;
  const levelVariant =
    item.disease?.levelId === 'critical' || item.disease?.levelId === 'severe'
      ? 'danger'
      : item.disease?.levelId === 'moderate'
        ? 'warning'
        : 'info';

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left p-4 transition-all duration-200 relative',
          'hover:bg-neutral-50',
          selected && 'bg-primary-50/80 hover:bg-primary-50'
        )}
      >
        {selected && (
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {item.disease ? getTypeName(item.disease.typeId) : '未知类型'}
              </span>
              <Badge variant={levelVariant} size="sm">
                {item.disease ? getLevelName(item.disease.levelId) : '--'}
              </Badge>
              <Badge variant={reworkCount > 0 ? 'warning' : 'info'} size="sm">
                第{acceptanceRound}轮验收
              </Badge>
              {reworkCount > 0 && (
                <Badge variant="danger" size="sm">
                  返工×{reworkCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {item.disease ? getRoadName(item.disease.roadId) : '--'}
                {item.disease?.stakeNo && ` · ${item.disease.stakeNo}`}
              </span>
            </div>
            <p className="text-xs text-neutral-600 line-clamp-2 mb-2">
              {item.disease?.description || '暂无描述'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>复核时间 {item.review ? relativeTime(item.review.completedAt) : '--'}</span>
            </div>
          </div>
          <ChevronRight
            className={cn(
              'w-4 h-4 flex-shrink-0 mt-1 transition-all duration-200',
              selected ? 'text-primary-600 translate-x-0.5' : 'text-neutral-300'
            )}
          />
        </div>
      </button>
    </li>
  );
}

function HistoryListItem({
  record,
  disease,
  selected,
  isJustSubmitted,
  onClick,
  getRoadName,
  getTypeName,
}: {
  record: AcceptanceRecord;
  disease: Disease | undefined;
  selected: boolean;
  isJustSubmitted?: boolean;
  onClick: () => void;
  getRoadName: (id: string) => string;
  getTypeName: (id: string) => string;
}) {
  return (
    <li className={cn(isJustSubmitted && 'animate-in fade-in slide-in-from-top-2 duration-500')}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left p-4 transition-all duration-200 relative',
          'hover:bg-neutral-50',
          selected && 'bg-primary-50/80 hover:bg-primary-50',
          isJustSubmitted && 'bg-amber-50/70 ring-1 ring-inset ring-amber-300'
        )}
      >
        {selected && (
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />
        )}
        {isJustSubmitted && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-medium">
            NEW
          </span>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-semibold text-neutral-900 truncate">
                {disease ? getTypeName(disease.typeId) : '未知类型'}
              </span>
              <Badge variant={record.result === 'passed' ? 'success' : 'danger'} size="sm">
                {record.result === 'passed' ? '通过' : '退回'}
              </Badge>
              <span className="text-xs font-medium text-neutral-500 tabular-nums">
                {record.qualityScore}分
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {disease ? getRoadName(disease.roadId) : '--'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 line-clamp-2 mb-2">
              {record.opinion || '暂无验收意见'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDateTime(record.inspectedAt)} · {record.inspector}</span>
            </div>
          </div>
          <ChevronRight
            className={cn(
              'w-4 h-4 flex-shrink-0 mt-1 transition-all duration-200',
              selected ? 'text-primary-600 translate-x-0.5' : 'text-neutral-300'
            )}
          />
        </div>
      </button>
    </li>
  );
}

function InfoBlock({
  icon: Icon,
  title,
  color,
  bgColor,
  children,
}: {
  icon: any;
  title: string;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
      </div>
      {children}
    </div>
  );
}

function AcceptedRecordView({ record }: { record: AcceptanceRecord }) {
  const isPassed = record.result === 'passed';
  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className={cn(
        'px-6 py-5 border-b flex items-center gap-4',
        isPassed ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'
      )}>
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          isPassed ? 'bg-green-500' : 'bg-red-500'
        )}>
          {isPassed ? (
            <ThumbsUp className="w-6 h-6 text-white" />
          ) : (
            <XCircle className="w-6 h-6 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            验收结果：{isPassed ? '验收通过' : '已退回'}
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            质量评分 <span className={cn('font-semibold', isPassed ? 'text-green-600' : 'text-red-600')}>
              {record.qualityScore}
            </span> 分 · 验收人 {record.inspector}
          </p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">验收意见</label>
          <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700 leading-relaxed">
            {record.opinion}
          </div>
        </div>
        {record.rejectReason && (
          <div className="bg-red-50/60 border border-red-100 rounded-lg p-4">
            <label className="block text-xs font-medium text-red-600 mb-1.5">退回原因</label>
            <p className="text-sm text-neutral-700 leading-relaxed">{record.rejectReason}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-500">
          <span>验收时间：{formatDateTime(record.inspectedAt)}</span>
          <span>工单编号：{record.orderId}</span>
        </div>
      </div>
    </div>
  );
}

function SuccessBanner({
  result,
  record,
  onViewHistory,
}: {
  result: 'passed' | 'rejected';
  record?: AcceptanceRecord;
  onViewHistory?: () => void;
}) {
  const isPassed = result === 'passed';
  return (
    <div className="h-full flex items-center justify-center py-10">
      <div className="text-center animate-in fade-in zoom-in duration-300 max-w-md mx-auto">
        <div className={cn(
          'w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg',
          isPassed ? 'bg-green-500' : 'bg-red-500'
        )}>
          {isPassed ? (
            <ThumbsUp className="w-12 h-12 text-white" />
          ) : (
            <RotateCcw className="w-12 h-12 text-white" />
          )}
        </div>
        <h2 className={cn('text-2xl font-bold mb-2', isPassed ? 'text-green-600' : 'text-red-600')}>
          {isPassed ? '验收通过！' : '已退回整改'}
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          {isPassed
            ? '该工单已完成验收流程，状态已更新为已完成'
            : '工单质量未达标，已退回整改流程，需重新派单处置后再次提交验收'}
        </p>

        {record && (
          <div className={cn(
            'text-left rounded-xl border p-5 mb-6',
            isPassed ? 'bg-green-50/60 border-green-200' : 'bg-red-50/60 border-red-200'
          )}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutral-500 block mb-1">质量评分</span>
                <span className={cn(
                  'text-2xl font-bold tabular-nums',
                  isPassed ? 'text-green-600' : 'text-red-600'
                )}>
                  {record.qualityScore}
                  <span className="text-sm font-normal text-neutral-500 ml-1">分</span>
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">验收人</span>
                <span className="font-medium text-neutral-800">{record.inspector}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">验收时间</span>
                <span className="tabular-nums text-neutral-700">{formatDateTime(record.inspectedAt)}</span>
              </div>
              <div>
                <span className="text-xs text-neutral-500 block mb-1">工单编号</span>
                <span className="font-mono text-neutral-700">{record.orderId}</span>
              </div>
            </div>
            {record.opinion && (
              <div className="mt-4 pt-3 border-t border-neutral-200/60">
                <span className="text-xs text-neutral-500 block mb-1">验收意见</span>
                <p className="text-sm text-neutral-700 leading-relaxed">{record.opinion}</p>
              </div>
            )}
            {record.rejectReason && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-red-700 block mb-1">退回原因（需返工处理）</span>
                    <p className="text-sm text-neutral-700 leading-relaxed">{record.rejectReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isPassed && onViewHistory && (
          <div className="space-y-2 text-left bg-white rounded-lg border border-neutral-200 p-4 mb-6">
            <h4 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <History className="w-4 h-4 text-neutral-500" />
              后续操作
            </h4>
            <ol className="space-y-1.5 text-xs text-neutral-600 list-decimal pl-4">
              <li>工单已自动进入<span className="text-red-600 font-medium">整改中</span>状态</li>
              <li>调度员在「工单调度 → 整改中」Tab 点击<span className="font-medium">重新派单</span></li>
              <li>班组整改完成后通过「现场复核」再次提交</li>
              <li>进入「维修验收」完成第二轮质量验收</li>
            </ol>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {onViewHistory && (
            <Button variant={isPassed ? 'secondary' : 'warning'} icon={History} onClick={onViewHistory}>
              {isPassed ? '查看验收记录' : '查看退回记录'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
