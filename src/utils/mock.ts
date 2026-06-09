import type {
  Road,
  Grid,
  Disease,
  DiseaseTypeCode,
  DiseaseLevelCode,
  DiseaseStatus,
  Team,
  WorkOrder,
  ReviewLog,
  AcceptanceRecord,
  MaterialDict,
  MaterialUsage,
} from '@/shared/types';
import { DISEASE_LEVELS } from './constants';
import { computeWarningFlag } from './warning';

const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const rndInt = (min: number, max: number) => Math.floor(rnd(min, max + 1));
const pick = <T>(arr: T[]): T => arr[rndInt(0, arr.length - 1)];
const photo = (seed: number, type: string) =>
  `https://picsum.photos/seed/road${type}${seed}/600/400`;

export const MOCK_ROADS: Road[] = [
  { id: 'r01', name: '人民大道', lengthKm: 8.5, startPoint: '环城路口', endPoint: '滨江大道', district: '中心区' },
  { id: 'r02', name: '建设大街', lengthKm: 6.2, startPoint: '火车站', endPoint: '开发区', district: '东区' },
  { id: 'r03', name: '中山北路', lengthKm: 4.3, startPoint: '中山路', endPoint: '三环北路', district: '北区' },
  { id: 'r04', name: '解放南路', lengthKm: 5.1, startPoint: '解放路', endPoint: '南环路', district: '南区' },
  { id: 'r05', name: '环城东路', lengthKm: 12.3, startPoint: '北环', endPoint: '南环', district: '东区' },
  { id: 'r06', name: '长江路', lengthKm: 9.7, startPoint: '河西', endPoint: '河东', district: '中心区' },
  { id: 'r07', name: '黄河路', lengthKm: 7.4, startPoint: '西环路', endPoint: '工业园', district: '西区' },
  { id: 'r08', name: '珠江路', lengthKm: 3.8, startPoint: '大学路', endPoint: '科学馆', district: '南区' },
  { id: 'r09', name: '黄河大街', lengthKm: 6.8, startPoint: '老城', endPoint: '新城', district: '西区' },
  { id: 'r10', name: '长江大道', lengthKm: 11.2, startPoint: '高铁站', endPoint: '机场', district: '东区' },
  { id: 'r11', name: '文化路', lengthKm: 4.5, startPoint: '人民广场', endPoint: '大学城', district: '北区' },
  { id: 'r12', name: '和平路', lengthKm: 3.1, startPoint: '商业街', endPoint: '体育中心', district: '中心区' },
  { id: 'r13', name: '友谊大街', lengthKm: 5.6, startPoint: '东环', endPoint: '西环', district: '中心区' },
  { id: 'r14', name: '科技路', lengthKm: 4.9, startPoint: '高新区东', endPoint: '高新区西', district: '南区' },
  { id: 'r15', name: '创业大道', lengthKm: 6.3, startPoint: '产业园', endPoint: '物流园', district: '西区' },
  { id: 'r16', name: '开发大道', lengthKm: 7.1, startPoint: '经开区北', endPoint: '经开区南', district: '东区' },
  { id: 'r17', name: '滨河路', lengthKm: 5.8, startPoint: '桥北', endPoint: '桥南', district: '北区' },
  { id: 'r18', name: '南山路', lengthKm: 4.2, startPoint: '山脚', endPoint: '山顶公园', district: '南区' },
  { id: 'r19', name: '北山路', lengthKm: 3.7, startPoint: '居民区', endPoint: '工业区', district: '北区' },
  { id: 'r20', name: '中央大道', lengthKm: 5.5, startPoint: '市政中心', endPoint: '会展中心', district: '中心区' },
];

export const MOCK_GRIDS: Grid[] = [
  { id: 'g01', code: 'G-01', name: '中心北片', manager: '张伟' },
  { id: 'g02', code: 'G-02', name: '中心南片', manager: '李娜' },
  { id: 'g03', code: 'G-03', name: '中心东片', manager: '王强' },
  { id: 'g04', code: 'G-04', name: '中心西片', manager: '刘洋' },
  { id: 'g05', code: 'G-05', name: '东北区', manager: '陈敏' },
  { id: 'g06', code: 'G-06', name: '东南区', manager: '杨帆' },
  { id: 'g07', code: 'G-07', name: '西北区', manager: '赵磊' },
  { id: 'g08', code: 'G-08', name: '西南区', manager: '孙丽' },
];

export const MOCK_TEAMS: Team[] = [
  { id: 't01', name: '一班', leader: '钱师傅', phone: '13800000001', members: ['钱峰', '吴涛', '郑勇'], workLoad: 0 },
  { id: 't02', name: '二班', leader: '孙师傅', phone: '13800000002', members: ['孙磊', '周明', '朱强'], workLoad: 0 },
  { id: 't03', name: '三班', leader: '李师傅', phone: '13800000003', members: ['李军', '王浩', '张波'], workLoad: 0 },
  { id: 't04', name: '四班', leader: '赵师傅', phone: '13800000004', members: ['赵勇', '黄鑫', '马超'], workLoad: 0 },
  { id: 't05', name: '五班', leader: '周师傅', phone: '13800000005', members: ['周辉', '刘强', '徐斌'], workLoad: 0 },
  { id: 't06', name: '六班', leader: '吴师傅', phone: '13800000006', members: ['吴迪', '郑凯', '何杰'], workLoad: 0 },
  { id: 't07', name: '应急班', leader: '王队长', phone: '13800000007', members: ['王伟', '陈军', '林波', '黄磊'], workLoad: 0 },
  { id: 't08', name: '专项班', leader: '张工', phone: '13800000008', members: ['张健', '秦亮', '尤志'], workLoad: 0 },
];

export const MOCK_MATERIALS: MaterialDict[] = [
  { id: 'm01', name: 'AC-13沥青混合料', unit: '吨', defaultPrice: 680 },
  { id: 'm02', name: 'AC-20沥青混合料', unit: '吨', defaultPrice: 620 },
  { id: 'm03', name: '乳化沥青', unit: '吨', defaultPrice: 3800 },
  { id: 'm04', name: 'SBS改性沥青', unit: '吨', defaultPrice: 5200 },
  { id: 'm05', name: '冷补料', unit: '袋', defaultPrice: 45 },
  { id: 'm06', name: '密封胶', unit: '箱', defaultPrice: 280 },
  { id: 'm07', name: '贴缝带', unit: '米', defaultPrice: 3.5 },
  { id: 'm08', name: '水泥', unit: '袋', defaultPrice: 28 },
  { id: 'm09', name: '砂石料', unit: '方', defaultPrice: 85 },
  { id: 'm10', name: '反光锥桶', unit: '个', defaultPrice: 35 },
];

const TYPES: DiseaseTypeCode[] = ['pothole', 'crack', 'subsidence', 'rut', 'bleeding', 'other'];
const LEVELS: DiseaseLevelCode[] = ['mild', 'moderate', 'severe', 'critical'];
const STATUSES: DiseaseStatus[] = ['pending', 'assigned', 'processing', 'reviewed', 'accepted', 'rejected'];
const LANES = ['1', '2', '3', '4', 'emergency', 'sidewalk'];
const REPORTERS = ['巡查员-张工', '巡查员-李工', '巡查员-王工', '巡查员-赵工', '市民上报', 'AI识别系统'];

export function genDiseases(count = 200): Disease[] {
  const result: Disease[] = [];
  for (let i = 1; i <= count; i++) {
    const road = pick(MOCK_ROADS);
    const level = pick(LEVELS);
    const levelCfg = DISEASE_LEVELS.find((l) => l.id === level)!;
    const statusesPool: DiseaseStatus[] =
      level === 'critical' || level === 'severe'
        ? ['processing', 'reviewed', 'accepted', 'rejected']
        : STATUSES;
    const status = pick(statusesPool);
    const reportedHoursAgo = rndInt(1, 360);
    const reportedAt = new Date(Date.now() - reportedHoursAgo * 3600000).toISOString();
    const deadlineAt = new Date(
      new Date(reportedAt).getTime() + levelCfg.deadlineHours * 3600000
    ).toISOString();
    result.push({
      id: `d${i.toString().padStart(3, '0')}`,
      roadId: road.id,
      gridId: pick(MOCK_GRIDS).id,
      typeId: pick(TYPES),
      levelId: level,
      stakeNo: `K${rndInt(0, Math.floor(road.lengthKm))}+${rndInt(10, 999)}`,
      lat: Number((30.2 + rnd(-0.3, 0.3)).toFixed(6)),
      lng: Number((120.1 + rnd(-0.3, 0.3)).toFixed(6)),
      areaM2: Number(rnd(0.2, 15).toFixed(2)),
      affectedLanes: Array.from({ length: rndInt(1, 2) }, () => pick(LANES)).filter(
        (v, i, a) => a.indexOf(v) === i
      ),
      photoBefore: photo(i, 'before'),
      description: pick([
        '路面存在明显病害，需及时处置',
        '病害范围较大，影响行车安全',
        '日常巡查发现，建议尽快安排维修',
        '市民电话投诉该路段存在安全隐患',
        'AI巡检系统自动识别上报',
        '已影响多个车道通行',
      ]),
      reporter: pick(REPORTERS),
      reportedAt,
      deadlineAt,
      status,
      warningFlag: computeWarningFlag(deadlineAt, status),
    });
  }
  return result;
}

export function genOrders(diseases: Disease[]): WorkOrder[] {
  const orders: WorkOrder[] = [];
  diseases.forEach((d, idx) => {
    if (d.status === 'pending') {
      orders.push({
        id: `o${idx.toString().padStart(3, '0')}`,
        diseaseId: d.id,
        teamId: '',
        status: 'unassigned',
        priority: d.levelId,
        assignedAt: null,
        plannedStart: null,
        plannedEnd: null,
        dispatcher: null,
        remark: null,
      });
      return;
    }
    const teamId = pick(MOCK_TEAMS).id;
    const assignedAt = new Date(new Date(d.reportedAt).getTime() + rndInt(30, 600) * 60000).toISOString();
    const plannedStart = new Date(new Date(assignedAt).getTime() + rndInt(30, 720) * 60000).toISOString();
    const plannedEnd = new Date(new Date(plannedStart).getTime() + rndInt(120, 1440) * 60000).toISOString();
    let status = d.status === 'accepted' ? 'accepted' : d.status;
    if (status === 'pending') status = 'assigned';
    orders.push({
      id: `o${idx.toString().padStart(3, '0')}`,
      diseaseId: d.id,
      teamId,
      status: status as any,
      priority: d.levelId,
      assignedAt,
      plannedStart,
      plannedEnd,
      dispatcher: pick(['调度-王主任', '调度-刘主任', '调度-陈主管']),
      remark: pick(['尽快处置', '注意安全防护', null, null]),
    });
  });
  return orders;
}

function genMaterials(seed: number): MaterialUsage[] {
  const count = rndInt(1, 4);
  const used = new Set<string>();
  const res: MaterialUsage[] = [];
  for (let i = 0; i < count; i++) {
    const mat = pick(MOCK_MATERIALS);
    if (used.has(mat.id)) continue;
    used.add(mat.id);
    const qty = Number(rnd(0.2, 12).toFixed(2));
    res.push({
      id: `mu${seed}-${i}`,
      materialName: mat.name,
      unit: mat.unit,
      quantity: qty,
      unitPrice: mat.defaultPrice,
      subtotal: Number((qty * mat.defaultPrice).toFixed(2)),
    });
  }
  return res;
}

export function genReviews(orders: WorkOrder[]): ReviewLog[] {
  const reviews: ReviewLog[] = [];
  orders.forEach((o, idx) => {
    if (!['processing', 'reviewed', 'accepted', 'rejected'].includes(o.status)) return;
    if (!o.assignedAt) return;
    const arrivedAt = new Date(new Date(o.assignedAt).getTime() + rndInt(30, 360) * 60000).toISOString();
    const completedAt = new Date(
      new Date(arrivedAt).getTime() + rndInt(60, 1440) * 60000
    ).toISOString();
    const team = MOCK_TEAMS.find((t) => t.id === o.teamId);
    reviews.push({
      id: `rv${idx.toString().padStart(3, '0')}`,
      orderId: o.id,
      arrivedAt,
      workers: team ? [...team.members.slice(0, 2)] : ['工人甲', '工人乙'],
      disposalMeasures: pick([
        '铣刨病害区域，喷洒粘层油，摊铺AC-13沥青混合料，碾压密实',
        '清理裂缝灰尘，灌注密封胶，表面撒沙防护',
        '挖除沉陷层，重新铺筑基层和面层',
        '使用冷补料临时修补坑槽，待天气好转后热补处理',
      ]),
      completedAt,
      roadClosed: Math.random() > 0.55,
      closurePeriod: '09:30-11:00',
      trafficGuide: pick(['cone', 'sign', 'person', 'none']),
      photoDuring: photo(idx * 2 + 100, 'during'),
      photoAfter: photo(idx * 3 + 200, 'after'),
      materials: genMaterials(idx),
    });
  });
  return reviews;
}

export function genAcceptances(orders: WorkOrder[], reviews: ReviewLog[]): AcceptanceRecord[] {
  const map = new Map(reviews.map((r) => [r.orderId, r]));
  return orders
    .filter((o) => ['accepted', 'rejected'].includes(o.status) && map.has(o.id))
    .map((o, idx) => {
      const isReject = o.status === 'rejected';
      const review = map.get(o.id)!;
      return {
        id: `a${idx.toString().padStart(3, '0')}`,
        orderId: o.id,
        result: isReject ? 'rejected' : 'passed',
        qualityScore: isReject ? rndInt(45, 68) : rndInt(75, 98),
        opinion: isReject
          ? '处置质量不合格，需重新返工'
          : pick(['处置合格，符合养护标准', '质量良好，路面平整', '验收通过，记录归档']),
        rejectReason: isReject ? pick(['碾压不密实，存在空隙', '色差明显，需重新摊铺', '范围未清理干净']) : null,
        inspector: pick(['验收-李工', '验收-王工', '验收-赵工']),
        inspectedAt: new Date(new Date(review.completedAt).getTime() + rndInt(60, 1440) * 60000).toISOString(),
        reworkCount: isReject ? rndInt(1, 2) : 0,
      };
    });
}

export function genAllMockData() {
  const diseases = genDiseases(200);
  const orders = genOrders(diseases);
  const reviews = genReviews(orders);
  const acceptances = genAcceptances(orders, reviews);
  return {
    roads: MOCK_ROADS,
    grids: MOCK_GRIDS,
    teams: MOCK_TEAMS,
    materials: MOCK_MATERIALS,
    diseases,
    orders,
    reviews,
    acceptances,
  };
}
