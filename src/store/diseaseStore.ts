import { create } from 'zustand';
import type { Disease, DiseaseLevelCode, DiseaseStatus, DiseaseTypeCode } from '@/shared/types';
import { genDiseases } from '@/utils/mock';
import { refreshWarningFlags } from '@/utils/warning';
import { genId } from '@/utils/format';
import { useDictStore } from './dictStore';
import { useOrderStore } from './orderStore';

export interface DiseaseFilters {
  keyword: string;
  typeId: DiseaseTypeCode | null;
  levelId: DiseaseLevelCode | null;
  status: DiseaseStatus | null;
  roadId: string | null;
  warningOnly: boolean;
}

interface DiseaseState {
  diseases: Disease[];
  filters: DiseaseFilters;
  selectedIds: string[];
  page: number;
  pageSize: number;

  setFilters: (f: Partial<DiseaseFilters>) => void;
  resetFilters: () => void;
  setPage: (p: number) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  selectAllFiltered: () => void;
  clearSelected: () => void;

  addDisease: (d: Omit<Disease, 'id' | 'reportedAt' | 'deadlineAt' | 'status' | 'warningFlag' | 'reporter'>) => void;
  updateDisease: (id: string, patch: Partial<Disease>) => void;
  deleteDiseases: (ids: string[]) => void;
  batchChangeLevel: (ids: string[], levelId: DiseaseLevelCode) => void;
  mergeDuplicates: (ids: string[]) => void;
  refreshWarnings: () => void;

  getFilteredDiseases: () => Disease[];
  getStats: () => { total: number; pending: number; processing: number; accepted: number; overdue: number };
}

const initial = (): Disease[] => {
  const data = genDiseases(200);
  return refreshWarningFlags(data);
};

export const useDiseaseStore = create<DiseaseState>((set, get) => ({
  diseases: initial(),
  filters: {
    keyword: '',
    typeId: null,
    levelId: null,
    status: null,
    roadId: null,
    warningOnly: false,
  },
  selectedIds: [],
  page: 1,
  pageSize: 20,

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f }, page: 1 })),
  resetFilters: () =>
    set({
      filters: {
        keyword: '',
        typeId: null,
        levelId: null,
        status: null,
        roadId: null,
        warningOnly: false,
      },
      page: 1,
    }),
  setPage: (p) => set({ page: p }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelect: (id) =>
    set((s) =>
      s.selectedIds.includes(id)
        ? { selectedIds: s.selectedIds.filter((i) => i !== id) }
        : { selectedIds: [...s.selectedIds, id] }
    ),
  selectAllFiltered: () =>
    set((s) => ({ selectedIds: get().getFilteredDiseases().map((d) => d.id) })),
  clearSelected: () => set({ selectedIds: [] }),

  addDisease: (d) => {
    const { diseaseLevels } = useDictStore.getState();
    const dl = diseaseLevels.find((l) => l.id === d.levelId);
    const now = new Date();
    const deadline = dl
      ? new Date(now.getTime() + dl.deadlineHours * 3600000)
      : new Date(now.getTime() + 72 * 3600000);
    const newD: Disease = {
      ...d,
      id: genId('d'),
      reporter: '调度员',
      reportedAt: now.toISOString(),
      deadlineAt: deadline.toISOString(),
      status: 'pending',
      warningFlag: 'none',
    };
    set((s) => ({ diseases: [newD, ...s.diseases] }));
    useOrderStore.getState().addWorkOrder(newD.id, newD.levelId);
  },

  updateDisease: (id, patch) =>
    set((s) => ({
      diseases: s.diseases.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })),

  deleteDiseases: (ids) =>
    set((s) => ({
      diseases: s.diseases.filter((d) => !ids.includes(d.id)),
      selectedIds: s.selectedIds.filter((i) => !ids.includes(i)),
    })),

  batchChangeLevel: (ids, levelId) => {
    const { diseaseLevels } = useDictStore.getState();
    const dl = diseaseLevels.find((l) => l.id === levelId);
    set((s) => ({
      diseases: s.diseases.map((d) => {
        if (!ids.includes(d.id)) return d;
        const deadline = dl
          ? new Date(new Date(d.reportedAt).getTime() + dl.deadlineHours * 3600000).toISOString()
          : d.deadlineAt;
        return { ...d, levelId, deadlineAt: deadline, warningFlag: refreshWarningFlags([{ ...d, levelId, deadlineAt: deadline }])[0].warningFlag };
      }),
    }));
  },

  mergeDuplicates: (ids) => {
    if (ids.length < 2) return;
    const list = get().diseases;
    const targets = list.filter((d) => ids.includes(d.id));
    targets.sort((a, b) => (a.levelId < b.levelId ? 1 : -1));
    const main = targets[0];
    const merged = {
      ...main,
      areaM2: targets.reduce((s, t) => s + t.areaM2, 0),
      description: main.description + '（合并）',
      mergedIds: targets.slice(1).map((t) => t.id),
    };
    const keepIds = [main.id];
    set((s) => ({
      diseases: s.diseases
        .filter((d) => !ids.includes(d.id) || keepIds.includes(d.id))
        .map((d) => (d.id === main.id ? merged : d)),
      selectedIds: [],
    }));
  },

  refreshWarnings: () => set((s) => ({ diseases: refreshWarningFlags(s.diseases) })),

  getFilteredDiseases: () => {
    const { diseases, filters } = get();
    const { roads } = useDictStore.getState();
    return diseases.filter((d) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const road = roads.find((r) => r.id === d.roadId)?.name || '';
        const text = `${road} ${d.stakeNo} ${d.description} ${d.id}`.toLowerCase();
        if (!text.includes(kw)) return false;
      }
      if (filters.typeId && d.typeId !== filters.typeId) return false;
      if (filters.levelId && d.levelId !== filters.levelId) return false;
      if (filters.status && d.status !== filters.status) return false;
      if (filters.roadId && d.roadId !== filters.roadId) return false;
      if (filters.warningOnly && d.warningFlag === 'none') return false;
      return true;
    });
  },

  getStats: () => {
    const { diseases } = get();
    let pending = 0, processing = 0, accepted = 0, overdue = 0;
    diseases.forEach((d) => {
      if (d.status === 'pending' || d.status === 'assigned') pending++;
      if (d.status === 'processing') processing++;
      if (d.status === 'accepted') accepted++;
      if (d.warningFlag === 'overdue') overdue++;
    });
    return { total: diseases.length, pending, processing, accepted, overdue };
  },
}));
