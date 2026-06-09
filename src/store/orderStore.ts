import { create } from 'zustand';
import type { WorkOrder, OrderStatus, DiseaseLevelCode } from '@/shared/types';
import { genOrders } from '@/utils/mock';
import { genId } from '@/utils/format';
import { useDiseaseStore } from './diseaseStore';

interface OrderState {
  orders: WorkOrder[];
  activeTab: OrderStatus | 'all';
  _initialized: boolean;
  setActiveTab: (t: OrderStatus | 'all') => void;

  _ensureInit: () => void;
  addWorkOrder: (diseaseId: string, priority: DiseaseLevelCode) => WorkOrder | null;
  assignOrder: (orderId: string, teamId: string, plannedStart: string, plannedEnd: string, remark: string | null) => void;
  getOrdersByStatus: () => WorkOrder[];
  getOrderByDiseaseId: (id: string) => WorkOrder | undefined;
  getTeamLoad: () => Record<string, number>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeTab: 'all',
  _initialized: false,

  setActiveTab: (t) => set({ activeTab: t }),

  _ensureInit: () => {
    if (get()._initialized) return;
    const { diseases } = useDiseaseStore.getState();
    set({ orders: genOrders(diseases), _initialized: true });
  },

  addWorkOrder: (diseaseId, priority) => {
    get()._ensureInit();
    if (get().orders.some((o) => o.diseaseId === diseaseId)) {
      return null;
    }
    const newOrder: WorkOrder = {
      id: genId('o'),
      diseaseId,
      teamId: '',
      status: 'unassigned',
      priority,
      assignedAt: null,
      plannedStart: null,
      plannedEnd: null,
      dispatcher: null,
      remark: null,
    };
    set((s) => ({ orders: [newOrder, ...s.orders] }));
    return newOrder;
  },

  assignOrder: (orderId, teamId, plannedStart, plannedEnd, remark) => {
    get()._ensureInit();
    const { updateDisease } = useDiseaseStore.getState();
    const order = get().orders.find((o) => o.id === orderId);
    if (order) {
      updateDisease(order.diseaseId, { status: 'assigned' });
    }
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              teamId,
              status: 'assigned',
              assignedAt: new Date().toISOString(),
              plannedStart,
              plannedEnd,
              dispatcher: '调度员',
              remark,
            }
          : o
      ),
    }));
  },

  getOrdersByStatus: () => {
    get()._ensureInit();
    const { orders, activeTab } = get();
    if (activeTab === 'all') return orders;
    return orders.filter((o) => o.status === activeTab);
  },

  getOrderByDiseaseId: (id) => {
    get()._ensureInit();
    return get().orders.find((o) => o.diseaseId === id);
  },

  getTeamLoad: () => {
    get()._ensureInit();
    const load: Record<string, number> = {};
    get()
      .orders.filter((o) => ['assigned', 'processing', 'reviewed'].includes(o.status))
      .forEach((o) => {
        load[o.teamId] = (load[o.teamId] || 0) + 1;
      });
    return load;
  },

  updateOrderStatus: (orderId, status) => {
    get()._ensureInit();
    set((s) => ({
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    }));
    const order = get().orders.find((o) => o.id === orderId);
    if (order) {
      const { updateDisease } = useDiseaseStore.getState();
      updateDisease(order.diseaseId, { status: diseaseStatusMap[status] });
    }
  },
}));

const diseaseStatusMap: Record<OrderStatus, any> = {
  unassigned: 'pending',
  assigned: 'assigned',
  processing: 'processing',
  reviewed: 'reviewed',
  accepted: 'accepted',
  rejected: 'rejected',
};
