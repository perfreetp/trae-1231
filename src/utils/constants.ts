import type { DiseaseStatus, DiseaseTypeCode, DiseaseLevelCode, OrderStatus, DiseaseType, DiseaseLevel } from '@/shared/types';

export const DISEASE_TYPES: DiseaseType[] = [
  { id: 'pothole', name: '坑槽', color: '#DC2626', icon: 'CircleDot' },
  { id: 'crack', name: '裂缝', color: '#F97316', icon: 'Minus' },
  { id: 'subsidence', name: '沉陷', color: '#EAB308', icon: 'ArrowDown' },
  { id: 'rut', name: '车辙', color: '#16A34A', icon: 'AlignLeft' },
  { id: 'bleeding', name: '泛油', color: '#0891B2', icon: 'Droplets' },
  { id: 'other', name: '其他', color: '#6B7280', icon: 'MoreHorizontal' },
];

export const DISEASE_LEVELS: DiseaseLevel[] = [
  { id: 'mild', name: '轻微', priority: 1, deadlineHours: 168, color: '#16A34A' },
  { id: 'moderate', name: '一般', priority: 2, deadlineHours: 72, color: '#EAB308' },
  { id: 'severe', name: '严重', priority: 3, deadlineHours: 24, color: '#F97316' },
  { id: 'critical', name: '紧急', priority: 4, deadlineHours: 4, color: '#DC2626' },
];

export const DISEASE_STATUS_MAP: Record<DiseaseStatus, { label: string; color: string }> = {
  pending: { label: '待派单', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  assigned: { label: '已派单', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: '处置中', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewed: { label: '待验收', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  accepted: { label: '已验收', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: '已退回', color: 'bg-red-50 text-red-700 border-red-200' },
};

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  unassigned: { label: '待派单', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  assigned: { label: '已派单', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: '处置中', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewed: { label: '待验收', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  accepted: { label: '已完成', color: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: '已退回', color: 'bg-red-50 text-red-700 border-red-200' },
};

export const DISEASE_TYPE_MAP: Record<DiseaseTypeCode, string> = {
  pothole: '坑槽',
  crack: '裂缝',
  subsidence: '沉陷',
  rut: '车辙',
  bleeding: '泛油',
  other: '其他',
};

export const DISEASE_LEVEL_MAP: Record<DiseaseLevelCode, string> = {
  mild: '轻微',
  moderate: '一般',
  severe: '严重',
  critical: '紧急',
};

export const LANE_OPTIONS = [
  { value: '1', label: '第1车道' },
  { value: '2', label: '第2车道' },
  { value: '3', label: '第3车道' },
  { value: '4', label: '第4车道' },
  { value: 'emergency', label: '应急车道' },
  { value: 'sidewalk', label: '人行道' },
];

export const TRAFFIC_GUIDE_OPTIONS = [
  { value: 'none', label: '无需疏导' },
  { value: 'cone', label: '锥桶引导' },
  { value: 'sign', label: '警示牌' },
  { value: 'person', label: '人员指挥' },
  { value: 'full_close', label: '全封闭' },
];
