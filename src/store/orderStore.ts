import { create } from 'zustand';
import type { WorkOrder, OrderStatus, DiseaseLevelCode } from '@/shared/types';
import { genOrders } from '@/utils/mock';
import { useDiseaseStore } from './diseaseStore';
import { genId } from '@/utils/format';

interface OrderState {
  orders: WorkOrder[];
  activeTab: OrderStatus | 'all';
  setActiveTab: (t: OrderStatus | 'all') => void;

  assignOrder: (orderId: string, teamId: string, plannedStart: string, plannedEnd: string, remark: string | null) => void;
  getOrdersByStatus: () => WorkOrder[];
  getOrderByDiseaseId: (id: string) => WorkOrder | undefined;
  getTeamLoad: () => Record<string, number>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const initial = (): WorkOrder[] => {
  const { diseases } = useDiseaseStore.getState();
  return genOrders(diseases);
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: initial(),
  activeTab: 'all',

  setActiveTab: (t) => set({ activeTab: t }),

  assignOrder: (orderId, teamId, plannedStart, plannedEnd, remark) => {
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
    const { orders, activeTab } = get();
    if (activeTab === 'all') return orders;
    return orders.filter((o) => o.status === activeTab);
  },

  getOrderByDiseaseId: (id) => get().orders.find((o) => o.diseaseId === id),

  getTeamLoad: () => {
    const load: Record<string, number> = {};
    get()
      .orders.filter((o) => ['assigned', 'processing', 'reviewed'].includes(o.status))
      .forEach((o) => {
        load[o.teamId] = (load[o.teamId] || 0) + 1;
      });
    return load;
  },

  updateOrderStatus: (orderId, status) => {
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
