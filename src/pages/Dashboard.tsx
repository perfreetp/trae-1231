import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  Hammer,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import StatCard from '@/components/charts/StatCard';
import DiseaseMap from '@/components/map/DiseaseMap';
import RankingList from '@/components/charts/RankingList';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import type { Disease } from '@/shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { diseases, getStats } = useDiseaseStore();
  const { getRoadName, getTypeName, getLevelName } = useDictStore();

  const stats = useMemo(() => getStats(), [getStats]);

  const todayNewItems = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todays = diseases.filter((d) => d.reportedAt.split('T')[0] === todayStr);
    return todays.slice(0, 10).map((d) => ({
      label: `${getRoadName(d.roadId)} ${d.stakeNo}`,
      value: d.areaM2,
      type: getTypeName(d.typeId),
      level: getLevelName(d.levelId),
      road: getRoadName(d.roadId),
      stakeNo: d.stakeNo,
      disease: d,
    }));
  }, [diseases, getRoadName, getTypeName, getLevelName]);

  const overdueItems = useMemo(() => {
    const overdues = diseases.filter((d) => d.warningFlag === 'overdue');
    return overdues.slice(0, 10).map((d) => ({
      label: `${getRoadName(d.roadId)} ${d.stakeNo}`,
      value: d.areaM2,
      type: getTypeName(d.typeId),
      level: getLevelName(d.levelId),
      road: getRoadName(d.roadId),
      stakeNo: d.stakeNo,
      disease: d,
    }));
  }, [diseases, getRoadName, getTypeName, getLevelName]);

  const handleEditDisease = (disease: Disease) => {
    navigate(`/diseases?editId=${disease.id}`);
  };

  const handleViewDisease = (disease: Disease) => {
    navigate(`/diseases?viewId=${disease.id}`);
  };

  const handleCreateOrder = (disease: Disease) => {
    navigate(`/orders?diseaseId=${disease.id}`);
  };

  return (
    <PageContainer
      title="地图总览"
      subtitle="全区域病害分布与处置态势一图感知"
      className="h-full"
    >
      <div className="flex flex-col gap-6 h-full min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-shrink-0">
          <StatCard
            title="病害总数"
            value={stats.total}
            icon={LayoutDashboard}
            iconBg="blue"
            color="blue"
            trend={12}
            trendUp={false}
          />
          <StatCard
            title="待处置"
            value={stats.pending}
            icon={Clock}
            iconBg="orange"
            color="orange"
            trend={8}
            trendUp={true}
          />
          <StatCard
            title="处置中"
            value={stats.processing}
            icon={Hammer}
            iconBg="cyan"
            color="cyan"
            trend={3}
            trendUp={false}
          />
          <StatCard
            title="已验收"
            value={stats.accepted}
            icon={CheckCircle2}
            iconBg="green"
            color="green"
            trend={15}
            trendUp={true}
          />
          <StatCard
            title="超期预警"
            value={stats.overdue}
            icon={AlertTriangle}
            iconBg="red"
            color="red"
            trend={22}
            trendUp={true}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
          <div className="xl:col-span-3 min-h-0 flex flex-col">
            <div className="flex-1 min-h-[520px]">
              <DiseaseMap
                onEditDisease={handleEditDisease}
                onViewDisease={handleViewDisease}
                onCreateOrder={handleCreateOrder}
              />
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
            <RankingList
              title="今日新增病害"
              description="24小时内巡查上报"
              items={todayNewItems}
              unit="㎡"
              maxItems={8}
              barColor="blue"
              className="flex-shrink-0"
            />
            <RankingList
              title="超期病害预警"
              description="处置时限已超期"
              items={overdueItems}
              unit="㎡"
              maxItems={8}
              barColor="red"
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
