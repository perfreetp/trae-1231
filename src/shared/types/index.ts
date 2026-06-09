export type DiseaseStatus = 'pending' | 'assigned' | 'processing' | 'reviewed' | 'accepted' | 'rejected';
export type DiseaseTypeCode = 'pothole' | 'crack' | 'subsidence' | 'rut' | 'bleeding' | 'other';
export type DiseaseLevelCode = 'mild' | 'moderate' | 'severe' | 'critical';
export type OrderStatus = 'unassigned' | 'assigned' | 'processing' | 'reviewed' | 'accepted' | 'rejected';
export type AcceptanceResult = 'passed' | 'rejected';
export type Role = 'admin' | 'dispatcher' | 'foreman' | 'inspector';

export interface Road {
  id: string;
  name: string;
  lengthKm: number;
  startPoint: string;
  endPoint: string;
  district: string;
}

export interface Grid {
  id: string;
  code: string;
  name: string;
  manager: string;
}

export interface DiseaseType {
  id: DiseaseTypeCode;
  name: string;
  color: string;
  icon: string;
}

export interface DiseaseLevel {
  id: DiseaseLevelCode;
  name: string;
  priority: number;
  deadlineHours: number;
  color: string;
}

export interface Disease {
  id: string;
  roadId: string;
  gridId: string;
  typeId: DiseaseTypeCode;
  levelId: DiseaseLevelCode;
  stakeNo: string;
  lat: number;
  lng: number;
  areaM2: number;
  affectedLanes: string[];
  photoBefore: string;
  description: string;
  reporter: string;
  reportedAt: string;
  status: DiseaseStatus;
  deadlineAt: string;
  warningFlag: 'none' | 'approaching' | 'overdue';
  mergedIds?: string[];
}

export interface Team {
  id: string;
  name: string;
  leader: string;
  phone: string;
  members: string[];
  workLoad: number;
}

export interface DispatchRecord {
  round: number;
  teamId: string;
  assignedAt: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  dispatcher: string | null;
  remark: string | null;
}

export interface WorkOrder {
  id: string;
  diseaseId: string;
  teamId: string;
  status: OrderStatus;
  priority: DiseaseLevelCode;
  assignedAt: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  dispatcher: string | null;
  remark: string | null;
  dispatchHistory: DispatchRecord[];
}

export interface MaterialUsage {
  id: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReviewLog {
  id: string;
  orderId: string;
  arrivedAt: string;
  workers: string[];
  disposalMeasures: string;
  completedAt: string;
  roadClosed: boolean;
  closurePeriod: string;
  trafficGuide: string;
  photoDuring: string;
  photoAfter: string;
  materials: MaterialUsage[];
}

export interface AcceptanceRecord {
  id: string;
  orderId: string;
  result: AcceptanceResult;
  qualityScore: number;
  opinion: string;
  rejectReason: string | null;
  inspector: string;
  inspectedAt: string;
  reworkCount: number;
}

export interface MaterialDict {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
}
