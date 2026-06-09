import { create } from 'zustand';
import type { AcceptanceRecord } from '@/shared/types';
import { genAcceptances } from '@/utils/mock';
import { useOrderStore } from './orderStore';
import { useReviewStore } from './reviewStore';

interface AcceptanceState {
  records: AcceptanceRecord[];
  selectedOrderId: string | null;
  _initialized: boolean;

  _ensureInit: () => void;
  setSelectedOrderId: (id: string | null) => void;
  addRecord: (record: Omit<AcceptanceRecord, 'id'>) => void;
  getPendingAcceptance: () => { orderId: string; diseaseId: string }[];
  getByOrderId: (orderId: string) => AcceptanceRecord | undefined;
  getAllByOrderId: (orderId: string) => AcceptanceRecord[];
  getReworkCount: (orderId: string) => number;
  getLastPassedAcceptance: (orderId: string) => AcceptanceRecord | undefined;
}

export const useAcceptanceStore = create<AcceptanceState>((set, get) => ({
  records: [],
  selectedOrderId: null,
  _initialized: false,

  _ensureInit: () => {
    if (get()._initialized) return;
    useOrderStore.getState()._ensureInit();
    useReviewStore.getState()._ensureInit();
    const { orders } = useOrderStore.getState();
    const { reviews } = useReviewStore.getState();
    set({ records: genAcceptances(orders, reviews), _initialized: true });
  },

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  addRecord: (record) => {
    get()._ensureInit();
    const r: AcceptanceRecord = {
      ...record,
      id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    };
    set((s) => ({ records: [...s.records, r] }));
    const { updateOrderStatus, orders } = useOrderStore.getState();
    if (record.result === 'passed') {
      updateOrderStatus(record.orderId, 'accepted');
    } else {
      const order = orders.find((o) => o.id === record.orderId);
      if (order && order.teamId) {
        updateOrderStatus(record.orderId, 'rejected');
      } else {
        updateOrderStatus(record.orderId, 'rejected');
      }
    }
  },

  getPendingAcceptance: () => {
    get()._ensureInit();
    const { orders } = useOrderStore.getState();
    const reviewedRecords = get().records;
    const acceptedOrderIds = new Set(
      reviewedRecords.filter((r) => r.result === 'passed').map((r) => r.orderId)
    );
    const rejectedOrderMap: Record<string, number> = {};
    reviewedRecords.forEach((r) => {
      if (r.result === 'rejected') rejectedOrderMap[r.orderId] = (rejectedOrderMap[r.orderId] || 0) + 1;
    });
    return orders
      .filter((o) => {
        if (o.status !== 'reviewed') return false;
        if (acceptedOrderIds.has(o.id)) return false;
        return true;
      })
      .map((o) => ({ orderId: o.id, diseaseId: o.diseaseId }));
  },

  getByOrderId: (orderId) => {
    get()._ensureInit();
    const list = get().records.filter((r) => r.orderId === orderId);
    if (list.length === 0) return undefined;
    return list[list.length - 1];
  },

  getAllByOrderId: (orderId) => {
    get()._ensureInit();
    return get().records.filter((r) => r.orderId === orderId);
  },

  getLastPassedAcceptance: (orderId) => {
    get()._ensureInit();
    const list = get().records
      .filter((r) => r.orderId === orderId && r.result === 'passed')
      .sort((a, b) => new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime());
    return list[0];
  },

  getReworkCount: (orderId) => {
    get()._ensureInit();
    return get().records.filter((r) => r.orderId === orderId && r.result === 'rejected').length;
  },
}));
