import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Clock,
  Send,
  Wrench,
  CheckCircle2,
  CircleCheck,
  Search,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageContainer from '@/components/layout/PageContainer';
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import OrderCard from '@/components/order/OrderCard';
import TeamLoadBoard from '@/components/order/TeamLoadBoard';
import AssignModal from '@/components/order/AssignModal';
import StatCard from '@/components/charts/StatCard';
import Input from '@/components/ui/Input';
import Empty from '@/components/Empty';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useOrderStore } from '@/store/orderStore';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import type { OrderStatus, WorkOrder } from '@/shared/types';
import { ORDER_STATUS_MAP } from '@/utils/constants';

const tabItems: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'unassigned', label: '待派单' },
  { value: 'assigned', label: '已派单' },
  { value: 'processing', label: '处置中' },
  { value: 'reviewed', label: '待验收' },
  { value: 'accepted', label: '已完成' },
];

const statConfigs = [
  { key: 'all', label: '全部工单', icon: ClipboardList, iconBg: 'blue', color: 'blue' },
  { key: 'unassigned', label: '待派单', icon: Clock, iconBg: 'purple', color: 'purple' },
  { key: 'assigned', label: '已派单', icon: Send, iconBg: 'orange', color: 'orange' },
  { key: 'processing', label: '处置中', icon: Wrench, iconBg: 'cyan', color: 'cyan' },
  { key: 'reviewed', label: '待验收', icon: CheckCircle2, iconBg: 'green', color: 'green' },
  { key: 'accepted', label: '已完成', icon: CircleCheck, iconBg: 'green', color: 'green' },
];

export default function Dispatch() {
  const orders = useOrderStore((s) => s.orders);
  const activeTab = useOrderStore((s) => s.activeTab);
  const setActiveTab = useOrderStore((s) => s.setActiveTab);

  const diseases = useDiseaseStore((s) => s.diseases);
  const getRoadName = useDictStore((s) => s.getRoadName);
  const getTypeName = useDictStore((s) => s.getTypeName);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<WorkOrder | null>(null);

  const stats = useMemo(() => {
    const result: Record<string, number> = {
      all: orders.length,
      unassigned: 0,
      assigned: 0,
      processing: 0,
      reviewed: 0,
      accepted: 0,
    };
    orders.forEach((o) => {
      if (result[o.status] !== undefined) {
        result[o.status]++;
      }
    });
    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const list = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);
    if (!searchKeyword.trim()) return list;
    const kw = searchKeyword.toLowerCase();
    return list.filter((o) => {
      const disease = diseases.find((d) => d.id === o.diseaseId);
      if (!disease) return false;
      const roadName = getRoadName(disease.roadId);
      const typeName = getTypeName(disease.typeId);
      const text = `${roadName} ${disease.stakeNo} ${disease.description} ${typeName} ${o.id}`.toLowerCase();
      return text.includes(kw);
    });
  }, [activeTab, orders, searchKeyword, diseases, getRoadName, getTypeName]);

  const handleAssign = (orderId: string) => {
    setAssignOrderId(orderId);
    setAssignModalOpen(true);
  };

  const handleView = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) setViewOrder(order);
  };

  const renderViewDetail = () => {
    if (!viewOrder) return null;
    const disease = diseases.find((d) => d.id === viewOrder.diseaseId);
    if (!disease) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200"
        onClick={() => setViewOrder(null)}
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">工单详情</h3>
              <p className="mt-0.5 text-xs text-neutral-500">{viewOrder.id}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setViewOrder(null)}>
              关闭
            </Button>
          </div>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center justify-center h-5 px-2 text-[11px] font-medium rounded-md border',
                  ORDER_STATUS_MAP[viewOrder.status].color
                )}
              >
                {ORDER_STATUS_MAP[viewOrder.status].label}
              </span>
              <Badge variant={viewOrder.priority === 'critical' ? 'danger' : viewOrder.priority === 'severe' ? 'warning' : viewOrder.priority === 'moderate' ? 'warning' : 'success'} size="sm" dot>
                {useDictStore.getState().getLevelName(viewOrder.priority)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-neutral-500 mb-1">道路</div>
                <div className="font-medium text-neutral-900">{getRoadName(disease.roadId)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">桩号</div>
                <div className="font-medium text-neutral-900">{disease.stakeNo}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">病害类型</div>
                <div className="font-medium text-neutral-900">{getTypeName(disease.typeId)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">面积</div>
                <div className="font-medium text-neutral-900">{disease.areaM2} m²</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">病害描述</div>
              <div className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-md p-3">
                {disease.description}
              </div>
            </div>
            {viewOrder.remark && (
              <div>
                <div className="text-xs text-neutral-500 mb-1">派单备注</div>
                <div className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-md p-3">
                  {viewOrder.remark}
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-neutral-200 flex justify-end">
            <Button onClick={() => setViewOrder(null)}>确定</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageContainer title="工单调度" subtitle="统一管理养护工单的派发、跟踪与调度">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statConfigs.map((cfg) => (
            <StatCard
              key={cfg.key}
              title={cfg.label}
              value={stats[cfg.key] || 0}
              icon={cfg.icon}
              iconBg={cfg.iconBg}
              color={cfg.color}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as OrderStatus | 'all')}
              className="w-full lg:w-auto"
            >
              <TabsList className="w-full lg:w-auto overflow-x-auto">
                {tabItems.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                    <span
                      className={cn(
                        'ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1',
                        'text-[10px] font-medium rounded-full',
                        activeTab === tab.value
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-neutral-200 text-neutral-600'
                      )}
                    >
                      {stats[tab.value] || 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="w-full lg:w-72">
              <Input
                type="search"
                placeholder="搜索病害/道路关键词..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onClear={() => setSearchKeyword('')}
                showClear
                leftIcon={Search}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-700">
                  工单列表
                  <span className="ml-2 text-xs text-neutral-400 font-normal">
                    共 {filteredOrders.length} 条
                  </span>
                </h3>
              </div>
              {filteredOrders.length === 0 ? (
                <div className="h-64">
                  <Empty />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAssign={order.status === 'unassigned' ? handleAssign : undefined}
                      onView={handleView}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">班组负载看板</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                <TeamLoadBoard className="!grid-cols-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AssignModal
        open={assignModalOpen}
        orderId={assignOrderId}
        onOpenChange={setAssignModalOpen}
      />

      {renderViewDetail()}
    </PageContainer>
  );
}
