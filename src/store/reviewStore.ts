import { create } from 'zustand';
import type { ReviewLog, MaterialUsage } from '@/shared/types';
import { genReviews } from '@/utils/mock';
import { useOrderStore } from './orderStore';

interface ReviewState {
  reviews: ReviewLog[];
  selectedOrderId: string | null;

  setSelectedOrderId: (id: string | null) => void;
  addReview: (review: Omit<ReviewLog, 'id'>) => void;
  getReviewByOrderId: (id: string) => ReviewLog | undefined;
  getPendingReviewOrders: () => { orderId: string; diseaseId: string }[];
  getTotalCost: (reviewId: string) => number;
}

const initial = (): ReviewLog[] => {
  const { orders } = useOrderStore.getState();
  return genReviews(orders);
};

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: initial(),
  selectedOrderId: null,

  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  addReview: (review) => {
    const newReview: ReviewLog = {
      ...review,
      id: 'rv' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    };
    set((s) => ({ reviews: [...s.reviews, newReview] }));
    const { updateOrderStatus } = useOrderStore.getState();
    updateOrderStatus(review.orderId, 'reviewed');
  },

  getReviewByOrderId: (id) => get().reviews.find((r) => r.orderId === id),

  getPendingReviewOrders: () => {
    const { orders } = useOrderStore.getState();
    const reviewedIds = new Set(get().reviews.map((r) => r.orderId));
    return orders
      .filter((o) => ['assigned', 'processing'].includes(o.status) && !reviewedIds.has(o.id))
      .map((o) => ({ orderId: o.id, diseaseId: o.diseaseId }));
  },

  getTotalCost: (reviewId) => {
    const r = get().reviews.find((x) => x.id === reviewId);
    if (!r) return 0;
    return r.materials.reduce((s: number, m: MaterialUsage) => s + m.subtotal, 0);
  },
}));
