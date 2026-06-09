import { create } from 'zustand';
import type { Road, Grid, Team, MaterialDict, DiseaseType, DiseaseLevel } from '@/shared/types';
import { MOCK_ROADS, MOCK_GRIDS, MOCK_TEAMS, MOCK_MATERIALS } from '@/utils/mock';
import { DISEASE_TYPES, DISEASE_LEVELS } from '@/utils/constants';

interface DictState {
  roads: Road[];
  grids: Grid[];
  teams: Team[];
  materials: MaterialDict[];
  diseaseTypes: DiseaseType[];
  diseaseLevels: DiseaseLevel[];
  getRoadName: (id: string) => string;
  getGridName: (id: string) => string;
  getTeamName: (id: string) => string;
  getTypeName: (id: string) => string;
  getLevelName: (id: string) => string;
}

export const useDictStore = create<DictState>((set, get) => ({
  roads: MOCK_ROADS,
  grids: MOCK_GRIDS,
  teams: MOCK_TEAMS,
  materials: MOCK_MATERIALS,
  diseaseTypes: DISEASE_TYPES,
  diseaseLevels: DISEASE_LEVELS,

  getRoadName: (id) => get().roads.find((r) => r.id === id)?.name || '--',
  getGridName: (id) => get().grids.find((g) => g.id === id)?.name || '--',
  getTeamName: (id) => get().teams.find((t) => t.id === id)?.name || '--',
  getTypeName: (id) => get().diseaseTypes.find((t) => t.id === id)?.name || '--',
  getLevelName: (id) => get().diseaseLevels.find((l) => l.id === id)?.name || '--',
}));
