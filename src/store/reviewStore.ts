import { create } from 'zustand';
import type { ReviewLog, MaterialUsage, AcceptanceRecord } from '@/shared/types';
import { genReviews } from '@/utils/mock';
import { useOrderStore } from './orderStore';
import { useAcceptanceStore } from './acceptanceStore';

interface ReviewState {
  reviews: ReviewLog[];
  selectedOrderId: string | null;
  _initialized: boolean;

  _ensureInit: () => void;
  setSelectedOrderId: (id: string | null) => void;
  addReview: (review: Omit<ReviewLog, 'id'>) => void;
  getReviewByOrderId: (id: string) => ReviewLog | undefined;
  getAllReviewsByOrderId: (id: string) => ReviewLog[];
  getPendingReviewOrders: () => { orderId: string; diseaseId: string }[];
  getTotalCost: (reviewId: string) => number;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  selectedOrderId: null,
  _initialized: false,

  _ensureInit: () => {
    if (get()._initialized) return;
    const { orders } = useOrderStore.getState();
    set({ reviews: genReviews(orders), _initialized: true });
  },

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  addReview: (review) => {
    get()._ensureInit();
    const newReview: ReviewLog = {
      ...review,
      id: 'rv' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    };
    set((s) => ({ reviews: [...s.reviews, newReview] }));
    const { updateOrderStatus } = useOrderStore.getState();
    updateOrderStatus(review.orderId, 'reviewed');
  },

  getReviewByOrderId: (id) => {
    get()._ensureInit();
    const list = get().reviews
      .filter((r) => r.orderId === id)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return list[0];
  },

  getAllReviewsByOrderId: (id) => {
    get()._ensureInit();
    return get()
      .reviews.filter((r) => r.orderId === id)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  },

  getPendingReviewOrders: () => {
    get()._ensureInit();
    useAcceptanceStore.getState()._ensureInit();
    const { orders } = useOrderStore.getState();
    const { records } = useAcceptanceStore.getState();
    const orderToReviews = get().reviews.reduce((acc, r) => {
      acc[r.orderId] = (acc[r.orderId] || []).concat(r);
      return acc;
    }, {} as Record<string, ReviewLog[]>);
    const orderToRejects = records.reduce((acc, r) => {
      if (r.result === 'rejected') {
        acc[r.orderId] = (acc[r.orderId] || []).concat(r);
      }
      return acc;
    }, {} as Record<string, AcceptanceRecord[]>);

    return orders
      .filter((o) => {
        if (!['assigned', 'processing'].includes(o.status)) return false;
        const reviews = orderToReviews[o.id] || [];
        const rejects = orderToRejects[o.id] || [];
        if (reviews.length === 0) return true;
        if (rejects.length >= reviews.length) return true;
        return false;
      })
      .map((o) => ({ orderId: o.id, diseaseId: o.diseaseId }));
  },

  getTotalCost: (reviewId) => {
    get()._ensureInit();
    const r = get().reviews.find((x) => x.id === reviewId);
    if (!r) return 0;
    return r.materials.reduce((s: number, m: MaterialUsage) => s + m.subtotal, 0);
  },
}));
