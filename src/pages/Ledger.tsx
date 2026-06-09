import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Download,
  RotateCcw,
  AlertTriangle,
  Bell,
  BellOff,
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import DiseaseTable from '@/components/disease/DiseaseTable';
import DiseaseForm from '@/components/disease/DiseaseForm';
import DiseaseDetail from '@/components/disease/DiseaseDetail';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useOrderStore } from '@/store/orderStore';
import { useReviewStore } from '@/store/reviewStore';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_STATUS_MAP, DISEASE_LEVELS, DISEASE_TYPES } from '@/utils/constants';
import { exportToCSV } from '@/utils/export';
import { formatDateTime, formatArea } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Disease, DiseaseStatus, DiseaseLevelCode, DiseaseTypeCode } from '@/shared/types';

export default function Ledger() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    filters,
    setFilters,
    resetFilters,
    selectedIds,
    clearSelected,
    deleteDiseases,
    getFilteredDiseases,
  } = useDiseaseStore();

  const {
    roads,
    diseaseTypes,
    diseaseLevels,
    getRoadName,
    getTypeName,
    getLevelName,
  } = useDictStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState<Disease | null>(null);
  const [viewDisease, setViewDisease] = useState<Disease | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Disease | null>(null);
  const [batchMode, setBatchMode] = useState(false);

  useEffect(() => {
    useDiseaseStore.getState();
    useOrderStore.getState()._ensureInit();
    useReviewStore.getState()._ensureInit();
    useAcceptanceStore.getState()._ensureInit();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('editId');
    const viewId = searchParams.get('viewId');
    if (editId) {
      const d = useDiseaseStore.getState().diseases.find((x) => x.id === editId);
      if (d) {
        setEditingDisease(d);
        setFormOpen(true);
      }
      searchParams.delete('editId');
      setSearchParams(searchParams);
    }
    if (viewId) {
      const d = useDiseaseStore.getState().diseases.find((x) => x.id === viewId);
      if (d) {
        setViewDisease(d);
      }
      searchParams.delete('viewId');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleAdd = () => {
    setEditingDisease(null);
    setFormOpen(true);
  };

  const handleEdit = (disease: Disease) => {
    setEditingDisease(disease);
    setFormOpen(true);
  };

  const handleView = (disease: Disease) => {
    setViewDisease(disease);
  };

  const handleDelete = (disease: Disease) => {
    setDeleteTarget(disease);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteDiseases([deleteTarget.id]);
      setDeleteTarget(null);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length > 0) {
      deleteDiseases(selectedIds);
    }
  };

  const handleExport = () => {
    const filtered = getFilteredDiseases();
    const data = filtered.map((d) => ({
      ID: d.id,
      道路: getRoadName(d.roadId),
      桩号: d.stakeNo,
      类型: getTypeName(d.typeId),
      等级: getLevelName(d.levelId),
      面积_平方米: d.areaM2.toFixed(2),
      影响车道: d.affectedLanes.join('/'),
      状态: DISEASE_STATUS_MAP[d.status].label,
      预警:
        d.warningFlag === 'overdue' ? '已逾期' : d.warningFlag === 'approaching' ? '即将到期' : '正常',
      上报人: d.reporter,
      上报时间: formatDateTime(d.reportedAt),
      截止时间: formatDateTime(d.deadlineAt),
      描述: d.description,
    }));
    exportToCSV(data, `病害台账_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleReset = () => {
    resetFilters();
  };

  const roadOptions = roads.map((r) => ({ label: r.name, value: r.id }));
  const typeOptions = diseaseTypes.map((t) => ({
    label: t.name,
    value: t.id,
    icon: (
      <span
        className="w-2.5 h-2.5 rounded-full inline-block"
        style={{ backgroundColor: t.color }}
      />
    ),
  }));
  const levelOptions = diseaseLevels.map((l) => ({
    label: l.name,
    value: l.id,
    icon: (
      <span
        className="w-2.5 h-2.5 rounded-full inline-block"
        style={{ backgroundColor: l.color }}
      />
    ),
  }));
  const statusOptions = Object.entries(DISEASE_STATUS_MAP).map(([key, val]) => ({
    label: val.label,
    value: key,
  }));

  const hasSelection = selectedIds.length > 0;
  const filteredCount = useMemo(() => getFilteredDiseases().length, [getFilteredDiseases]);

  return (
    <PageContainer
      title="病害台账"
      subtitle="道路病害全生命周期管理与追溯"
      className="h-full"
    >
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-4 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-full sm:w-auto flex-1 min-w-[240px] max-w-md">
                <Input
                  placeholder="搜索道路、桩号、描述、ID..."
                  leftIcon={Search}
                  value={filters.keyword}
                  onChange={(e) => setFilters({ keyword: e.target.value })}
                  showClear
                  onClear={() => setFilters({ keyword: '' })}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                icon={Plus}
                onClick={handleAdd}
              >
                新增病害
              </Button>
              <Button
                variant={batchMode ? 'primary' : 'secondary'}
                onClick={() => {
                  setBatchMode(!batchMode);
                  if (batchMode) clearSelected();
                }}
              >
                批量操作
                {hasSelection && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/20 text-xs font-medium">
                    {selectedIds.length}
                  </span>
                )}
              </Button>
              <Button
                variant="secondary"
                icon={Download}
                onClick={handleExport}
              >
                导出 ({filteredCount})
              </Button>
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={handleReset}
              >
                重置筛选
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-100">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="w-full sm:w-44">
                <Select
                  size="sm"
                  value={filters.typeId || ''}
                  onChange={(v) => setFilters({ typeId: (v as DiseaseTypeCode) || null })}
                  options={typeOptions}
                  placeholder="全部类型"
                  clearable
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  size="sm"
                  value={filters.levelId || ''}
                  onChange={(v) => setFilters({ levelId: (v as DiseaseLevelCode) || null })}
                  options={levelOptions}
                  placeholder="全部等级"
                  clearable
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  size="sm"
                  value={filters.status || ''}
                  onChange={(v) => setFilters({ status: (v as DiseaseStatus) || null })}
                  options={statusOptions}
                  placeholder="全部状态"
                  clearable
                />
              </div>
              <div className="w-full sm:w-52">
                <Select
                  size="sm"
                  value={filters.roadId || ''}
                  onChange={(v) => setFilters({ roadId: v || null })}
                  options={roadOptions}
                  placeholder="全部道路"
                  clearable
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ warningOnly: !filters.warningOnly })}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 h-8 rounded-md border text-xs font-medium transition-all',
                  filters.warningOnly
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
                )}
              >
                {filters.warningOnly ? (
                  <Bell className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-neutral-400" />
                )}
                仅预警
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <DiseaseTable
            onEdit={handleEdit}
            onView={handleView}
          />
        </div>
      </div>

      <DiseaseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDisease(null);
        }}
        editingDisease={editingDisease}
      />

      <DiseaseDetail
        open={!!viewDisease}
        diseaseId={viewDisease?.id || null}
        onClose={() => setViewDisease(null)}
      />

      <Modal
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="确认删除"
        description={`确定要删除病害记录 ${deleteTarget?.id} 吗？此操作不可恢复。`}
        onConfirm={handleDeleteConfirm}
        confirmText="删除"
      />
    </PageContainer>
  );
}
