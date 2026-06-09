import { create } from 'zustand';
import type { AcceptanceRecord } from '@/shared/types';
import { genAcceptances } from '@/utils/mock';
import { useOrderStore } from './orderStore';
import { useReviewStore } from './reviewStore';

interface AcceptanceState {
  records: AcceptanceRecord[];
  selectedOrderId: string | null;

  setSelectedOrderId: (id: string | null) => void;
  addRecord: (record: Omit<AcceptanceRecord, 'id'>) => void;
  getPendingAcceptance: () => { orderId: string; diseaseId: string }[];
  getByOrderId: (orderId: string) => AcceptanceRecord | undefined;
  getReworkCount: (orderId: string) => number;
}

const initial = (): AcceptanceRecord[] => {
  const { orders } = useOrderStore.getState();
  const { reviews } = useReviewStore.getState();
  return genAcceptances(orders, reviews);
};

export const useAcceptanceStore = create<AcceptanceState>((set, get) => ({
  records: initial(),
  selectedOrderId: null,

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  addRecord: (record) => {
    const r: AcceptanceRecord = {
      ...record,
      id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    };
    set((s) => ({ records: [...s.records, r] }));
    const { updateOrderStatus } = useOrderStore.getState();
    updateOrderStatus(record.orderId, record.result === 'passed' ? 'accepted' : 'rejected');
  },

  getPendingAcceptance: () => {
    const { orders } = useOrderStore.getState();
    const doneOrderIds = new Set(get().records.map((r) => r.orderId));
    return orders
      .filter((o) => o.status === 'reviewed' && !doneOrderIds.has(o.id))
      .map((o) => ({ orderId: o.id, diseaseId: o.diseaseId }));
  },

  getByOrderId: (orderId) => get().records.find((r) => r.orderId === orderId),

  getReworkCount: (orderId) =>
    get().records.filter((r) => r.orderId === orderId && r.result === 'rejected').length,
}));
