import { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Timer,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import PageContainer from '@/components/layout/PageContainer';
import Select from '@/components/ui/Select';
import StatCard from '@/components/charts/StatCard';
import BarChartCard from '@/components/charts/BarChartCard';
import PieChartCard from '@/components/charts/PieChartCard';
import LineChartCard from '@/components/charts/LineChartCard';
import RankingList from '@/components/charts/RankingList';
import { cn } from '@/lib/utils';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useOrderStore } from '@/store/orderStore';
import { useReviewStore } from '@/store/reviewStore';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_TYPES, DISEASE_LEVELS } from '@/utils/constants';
import { formatMoney, formatDuration, hoursBetween } from '@/utils/format';
import type { MaterialUsage } from '@/shared/types';

type TimeRange = 'month' | 'quarter' | 'year' | 'custom';

const TIME_RANGE_OPTIONS = [
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年', value: 'year' },
  { label: '自定义', value: 'custom' },
];

function getDateRange(range: TimeRange): { start: number; end: number } {
  const now = new Date();
  const end = now.getTime();

  switch (range) {
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { start, end };
    }
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1).getTime();
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1).getTime();
      return { start, end };
    }
    case 'custom':
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return { start, end };
    }
  }
}

function formatDateLabel(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const LEVEL_COLORS = {
  '待处置': '#F59E0B',
  '处置中': '#3B82F6',
  '已完成': '#22C55E',
};

const LEVEL_KEYS = ['待处置', '处置中', '已完成'];

function StackedLevelChart({
  title,
  description,
  data,
  height,
  className,
}: {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-neutral-200',
        'p-5',
        'transition-all duration-300',
        'hover:shadow-md',
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>

      <div style={{ width: '100%', height: height || 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="rect"
              iconSize={10}
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            {LEVEL_KEYS.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={(LEVEL_COLORS as any)[key]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Reports() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const diseases = useDiseaseStore((s) => s.diseases);
  const orders = useOrderStore((s) => s.orders);
  const reviews = useReviewStore((s) => s.reviews);
  const records = useAcceptanceStore((s) => s.records);
  const roads = useDictStore((s) => s.roads);
  const teams = useDictStore((s) => s.teams);
  const getRoadName = useDictStore((s) => s.getRoadName);
  const getTeamName = useDictStore((s) => s.getTeamName);
  const getTypeName = useDictStore((s) => s.getTypeName);
  const getLevelName = useDictStore((s) => s.getLevelName);

  const dateRange = useMemo(() => getDateRange(timeRange), [timeRange]);

  const filteredDiseases = useMemo(() => {
    return diseases.filter((d) => {
      const t = new Date(d.reportedAt).getTime();
      return t >= dateRange.start && t <= dateRange.end;
    });
  }, [diseases, dateRange]);

  const stats = useMemo(() => {
    const total = filteredDiseases.length;
    let completed = 0;
    let processing = 0;
    let uncompleted = 0;
    let totalCost = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let onTimeCount = 0;
    let acceptedCount = 0;

    const orderMap = new Map(orders.map((o) => [o.diseaseId, o]));
    const reviewMap = new Map(reviews.map((r) => [r.orderId, r]));
    const acceptanceMap = new Map(records.map((r) => [r.orderId, r]));

    filteredDiseases.forEach((d) => {
      const order = orderMap.get(d.id);
      const review = order ? reviewMap.get(order.id) : null;
      const acceptance = order ? acceptanceMap.get(order.id) : null;

      if (d.status === 'accepted') {
        completed++;
      } else if (d.status === 'pending' || d.status === 'assigned' || d.status === 'processing' || d.status === 'reviewed' || d.status === 'rejected') {
        uncompleted++;
        if (d.status === 'processing' || d.status === 'assigned') processing++;
      }

      if (review) {
        review.materials.forEach((m: MaterialUsage) => {
          totalCost += m.subtotal;
        });

        if (acceptance) {
          const dur = hoursBetween(d.reportedAt, acceptance.inspectedAt);
          totalDuration += dur;
          durationCount++;
          acceptedCount++;

          const deadline = new Date(d.deadlineAt).getTime();
          const inspected = new Date(acceptance.inspectedAt).getTime();
          if (inspected <= deadline) onTimeCount++;
        }
      }
    });

    const avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;
    const onTimeRate = acceptedCount > 0 ? (onTimeCount / acceptedCount) * 100 : 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthlyNew = diseases.filter((d) => {
      const t = new Date(d.reportedAt).getTime();
      return t >= startOfMonth && t <= dateRange.end;
    }).length;

    return {
      total,
      completed,
      processing,
      uncompleted,
      totalCost,
      avgDuration,
      onTimeRate,
      monthlyNew,
    };
  }, [filteredDiseases, orders, reviews, records, dateRange]);

  const topRoadsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDiseases.forEach((d) => {
      counts[d.roadId] = (counts[d.roadId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([roadId, value]) => ({
        name: getRoadName(roadId),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredDiseases, getRoadName]);

  const typeDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDiseases.forEach((d) => {
      counts[d.typeId] = (counts[d.typeId] || 0) + 1;
    });
    return DISEASE_TYPES
      .map((t) => ({
        name: t.name,
        value: counts[t.id] || 0,
      }))
      .filter((d) => d.value > 0);
  }, [filteredDiseases]);

  const levelDistributionData = useMemo(() => {
    const levels = DISEASE_LEVELS.map((l) => l.id);
    const statuses: Array<'pending' | 'processing' | 'completed'> = ['pending', 'processing', 'completed'];

    const data: Array<Record<string, string | number>> = [];

    DISEASE_LEVELS.forEach((level) => {
      const item: Record<string, string | number> = { name: level.name };
      let pending = 0, processing = 0, completed = 0;

      filteredDiseases.forEach((d) => {
        if (d.levelId !== level.id) return;
        if (d.status === 'accepted') completed++;
        else if (d.status === 'processing' || d.status === 'assigned') processing++;
        else pending++;
      });

      item['待处置'] = pending;
      item['处置中'] = processing;
      item['已完成'] = completed;
      data.push(item);
    });

    return data;
  }, [filteredDiseases]);

  const durationTrendData = useMemo(() => {
    const days = 30;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const result: Array<{ name: string; avgDuration: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const dayEnd = dayStart + 24 * 3600 * 1000 - 1;

      const orderMap = new Map(orders.map((o) => [o.diseaseId, o]));
      const acceptanceMap = new Map(records.map((r) => [r.orderId, r]));

      let totalDur = 0;
      let count = 0;

      diseases.forEach((d) => {
        const order = orderMap.get(d.id);
        if (!order) return;
        const acceptance = acceptanceMap.get(order.id);
        if (!acceptance) return;

        const inspectedTime = new Date(acceptance.inspectedAt).getTime();
        if (inspectedTime < dayStart || inspectedTime > dayEnd) return;

        totalDur += hoursBetween(d.reportedAt, acceptance.inspectedAt);
        count++;
      });

      result.push({
        name: `${day.getMonth() + 1}/${day.getDate()}`,
        avgDuration: count > 0 ? Math.round((totalDur / count) * 10) / 10 : 0,
      });
    }

    return result;
  }, [diseases, orders, records]);

  const costByTeamData = useMemo(() => {
    const reviewMap = new Map(reviews.map((r) => [r.orderId, r]));
    const teamCosts: Record<string, number> = {};

    orders.forEach((order) => {
      const review = reviewMap.get(order.id);
      if (!review) return;

      const inspectedTime = review.completedAt ? new Date(review.completedAt).getTime() : 0;
      if (inspectedTime < dateRange.start || inspectedTime > dateRange.end) return;

      const cost = review.materials.reduce((s: number, m: MaterialUsage) => s + m.subtotal, 0);
      teamCosts[order.teamId] = (teamCosts[order.teamId] || 0) + cost;
    });

    return teams
      .map((t) => ({
        name: t.name,
        value: Math.round(teamCosts[t.id] || 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [orders, reviews, teams, dateRange]);

  const uncompletedRankingData = useMemo(() => {
    const orderMap = new Map(orders.map((o) => [o.diseaseId, o]));
    const teamCounts: Record<string, number> = {};

    filteredDiseases.forEach((d) => {
      if (d.status === 'accepted') return;
      const order = orderMap.get(d.id);
      if (!order) return;
      teamCounts[order.teamId] = (teamCounts[order.teamId] || 0) + 1;
    });

    return teams
      .map((t) => ({
        label: t.name,
        value: teamCounts[t.id] || 0,
      }))
      .filter((d) => d.value > 0);
  }, [filteredDiseases, orders, teams]);

  return (
    <PageContainer
      title="统计报表"
      subtitle="多维度数据统计和可视化分析，辅助决策管理"
      actions={
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onChange={(v) => setTimeRange(v as TimeRange)}
            options={TIME_RANGE_OPTIONS}
            size="sm"
            className="w-36"
          />
          <div className="text-xs text-neutral-500">
            {formatDateLabel(dateRange.start)} - {formatDateLabel(dateRange.end)}
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="病害总数"
            value={stats.total}
            icon={Activity}
            iconBg="blue"
            color="blue"
            trend={8}
            trendUp
          />
          <StatCard
            title="已完成"
            value={stats.completed}
            icon={CheckCircle2}
            iconBg="green"
            color="green"
            trend={12}
            trendUp
          />
          <StatCard
            title="处置中"
            value={stats.processing}
            icon={Clock}
            iconBg="orange"
            color="orange"
            trend={-5}
          />
          <StatCard
            title="未完成"
            value={stats.uncompleted}
            icon={AlertCircle}
            iconBg="red"
            color="red"
          />
          <StatCard
            title="总费用"
            value={formatMoney(stats.totalCost)}
            icon={DollarSign}
            iconBg="purple"
            color="purple"
            trend={6}
            trendUp
          />
          <StatCard
            title="平均时长"
            value={formatDuration(stats.avgDuration)}
            icon={Timer}
            iconBg="cyan"
            color="cyan"
            trend={-10}
          />
          <StatCard
            title="按期率"
            value={`${Math.round(stats.onTimeRate)}%`}
            icon={Target}
            iconBg="green"
            color="green"
            trend={3}
            trendUp
          />
          <StatCard
            title="本月新增"
            value={stats.monthlyNew}
            icon={TrendingUp}
            iconBg="blue"
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BarChartCard
            title="高发路段 TOP10"
            description="按路段统计病害数量"
            data={topRoadsData}
            color="blue"
            height={300}
          />
          <PieChartCard
            title="病害类型分布"
            description="各类型病害占比"
            data={typeDistributionData}
            colors={DISEASE_TYPES.map((t) => t.color)}
            height={300}
            centerLabel="病害数"
          />
          <StackedLevelChart
            title="等级分布"
            description="各等级病害处置进度"
            data={levelDistributionData}
            height={300}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LineChartCard
            title="处置时长趋势"
            description="近30天平均处置时长（小时）"
            data={durationTrendData}
            dataKeys={[{ key: 'avgDuration', label: '平均时长(h)' }]}
            height={300}
            showArea
            showLegend
          />
          <BarChartCard
            title="费用估算统计"
            description="按班组统计费用"
            data={costByTeamData}
            color="purple"
            height={300}
          />
          <RankingList
            title="未完成工单排行"
            description="按班组统计未完成数量"
            items={uncompletedRankingData}
            unit="单"
            barColor="orange"
          />
        </div>
      </div>
    </PageContainer>
  );
}
