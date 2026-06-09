import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Square,
  SquareCheck,
  SquareMinus,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Edit3,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import WarningBadge from './WarningBadge';
import BatchActionBar from './BatchActionBar';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_STATUS_MAP, DISEASE_LEVELS } from '@/utils/constants';
import { formatDateTime, formatArea } from '@/utils/format';
import type { Disease, DiseaseLevelCode, DiseaseTypeCode } from '@/shared/types';

type SortKey = 'id' | 'stakeNo' | 'areaM2' | 'reportedAt' | 'levelPriority';
type SortOrder = 'asc' | 'desc';

interface DiseaseTableProps {
  onEdit?: (disease: Disease) => void;
  onView?: (disease: Disease) => void;
  className?: string;
}

export default function DiseaseTable({ onEdit, onView, className }: DiseaseTableProps) {
  const navigate = useNavigate();
  const {
    diseases,
    page,
    pageSize,
    setPage,
    selectedIds,
    toggleSelect,
    clearSelected,
    selectAllFiltered,
    deleteDiseases,
    getFilteredDiseases,
  } = useDiseaseStore();

  const { getRoadName, getTypeName, getLevelName, diseaseTypes, diseaseLevels } = useDictStore();

  const [sortKey, setSortKey] = useState<SortKey>('reportedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Disease | null>(null);

  const filtered = useMemo(() => getFilteredDiseases(), [getFilteredDiseases]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const levelPriorityMap: Record<DiseaseLevelCode, number> = {} as Record<DiseaseLevelCode, number>;
    diseaseLevels.forEach((l) => {
      levelPriorityMap[l.id] = l.priority;
    });

    list.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      switch (sortKey) {
        case 'id':
          av = a.id; bv = b.id; break;
        case 'stakeNo':
          av = a.stakeNo; bv = b.stakeNo; break;
        case 'areaM2':
          av = a.areaM2; bv = b.areaM2; break;
        case 'reportedAt':
          av = new Date(a.reportedAt).getTime();
          bv = new Date(b.reportedAt).getTime();
          break;
        case 'levelPriority':
          av = levelPriorityMap[a.levelId] || 0;
          bv = levelPriorityMap[b.levelId] || 0;
          break;
      }
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortOrder, diseaseLevels]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allSelectedOnPage = pageData.length > 0 && pageData.every((d) => selectedIds.includes(d.id));
  const someSelectedOnPage = pageData.some((d) => selectedIds.includes(d.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const handleTogglePageAll = () => {
    if (allSelectedOnPage) {
      const pageIds = pageData.map((d) => d.id);
      const newSelected = selectedIds.filter((id) => !pageIds.includes(id));
      useDiseaseStore.getState().setSelectedIds(newSelected);
    } else {
      const pageIds = pageData.map((d) => d.id);
      const merged = Array.from(new Set([...selectedIds, ...pageIds]));
      useDiseaseStore.getState().setSelectedIds(merged);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteDiseases([deleteTarget.id]);
      setDeleteTarget(null);
    }
  };

  const handleCreateOrder = (disease: Disease) => {
    navigate(`/orders?diseaseId=${disease.id}`);
  };

  const getTypeColor = (typeId: DiseaseTypeCode) => {
    const t = diseaseTypes.find((x) => x.id === typeId);
    return t?.color || '#6B7280';
  };

  const getLevelColor = (levelId: DiseaseLevelCode) => {
    const l = diseaseLevels.find((x) => x.id === levelId);
    return l?.color || '#6B7280';
  };

  const SortHeader = ({ label, sortKeyName, align = 'left' }: { label: string; sortKeyName: SortKey; align?: 'left' | 'right' | 'center' }) => (
    <th
      onClick={() => handleSort(sortKeyName)}
      className={cn(
        'px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider cursor-pointer select-none',
        'hover:bg-neutral-50 transition-colors',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center'
      )}
    >
      <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
        {label}
        {sortKey === sortKeyName ? (
          sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary-600" /> : <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
        )}
      </span>
    </th>
  );

  return (
    <div className={cn('flex flex-col h-full bg-white rounded-lg border border-neutral-200 overflow-hidden', className)}>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50/80 border-b border-neutral-200 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <button
                  onClick={handleTogglePageAll}
                  className={cn(
                    'w-5 h-5 flex items-center justify-center rounded',
                    'hover:bg-neutral-100 transition-colors'
                  )}
                  title={allFilteredSelected ? '取消全选' : '选择本页全部'}
                >
                  {allSelectedOnPage ? (
                    <SquareCheck className="w-4.5 h-4.5 text-primary-600" />
                  ) : someSelectedOnPage ? (
                    <SquareMinus className="w-4.5 h-4.5 text-primary-600" />
                  ) : (
                    <Square className="w-4.5 h-4.5 text-neutral-400" />
                  )}
                </button>
              </th>
              <SortHeader label="ID" sortKeyName="id" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">道路名</th>
              <SortHeader label="桩号" sortKeyName="stakeNo" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">病害类型</th>
              <SortHeader label="等级" sortKeyName="levelPriority" />
              <SortHeader label="面积" sortKeyName="areaM2" align="right" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">影响车道</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">状态</th>
              <SortHeader label="上报时间" sortKeyName="reportedAt" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">预警</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider w-40">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-20 text-center text-neutral-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-neutral-300" />
                    </div>
                    <p>暂无病害数据</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((d) => {
                const isSelected = selectedIds.includes(d.id);
                const statusCfg = DISEASE_STATUS_MAP[d.status];
                return (
                  <tr
                    key={d.id}
                    className={cn(
                      'transition-colors',
                      isSelected ? 'bg-primary-50/60' : 'hover:bg-neutral-50/60',
                      d.warningFlag === 'overdue' && !isSelected && 'bg-red-50/30'
                    )}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(d.id)}
                        className={cn(
                          'w-5 h-5 flex items-center justify-center rounded',
                          'hover:bg-neutral-100 transition-colors'
                        )}
                      >
                        {isSelected ? (
                          <SquareCheck className="w-4.5 h-4.5 text-primary-600" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{d.id}</td>
                    <td className="px-4 py-3 font-medium text-neutral-800">{getRoadName(d.roadId)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-700">{d.stakeNo}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: getTypeColor(d.typeId) }}
                        />
                        <span className="text-neutral-700">{getTypeName(d.typeId)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${getLevelColor(d.levelId)}15`,
                          color: getLevelColor(d.levelId),
                        }}
                      >
                        {getLevelName(d.levelId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-700">{formatArea(d.areaM2)}</td>
                    <td className="px-4 py-3 text-neutral-600 text-xs">
                      {d.affectedLanes.length > 0 ? d.affectedLanes.join('、') : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn(statusCfg.color, 'border')}>
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 tabular-nums">{formatDateTime(d.reportedAt)}</td>
                    <td className="px-4 py-3">
                      <WarningBadge warningFlag={d.warningFlag} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Eye}
                          onClick={() => onView?.(d)}
                          className="h-7 w-7 p-0"
                          title="查看"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Edit3}
                          onClick={() => onEdit?.(d)}
                          className="h-7 w-7 p-0"
                          title="编辑"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={FileText}
                          onClick={() => handleCreateOrder(d)}
                          className="h-7 w-7 p-0 text-primary-600 hover:text-primary-700"
                          title="创建工单"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Trash2}
                          onClick={() => setDeleteTarget(d)}
                          className="h-7 w-7 p-0 text-danger-500 hover:text-danger-600"
                          title="删除"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-neutral-200 px-4 py-3 bg-neutral-50/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span>
            共 <span className="font-semibold text-neutral-700">{sorted.length}</span> 条
          </span>
          {selectedIds.length > 0 && (
            <span>
              已选 <span className="font-semibold text-primary-600">{selectedIds.length}</span> 条
            </span>
          )}
          <button
            onClick={allFilteredSelected ? clearSelected : selectAllFiltered}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {allFilteredSelected ? '取消全选' : '全选筛选结果'}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            icon={ChevronsLeft}
            disabled={safePage <= 1}
            onClick={() => setPage(1)}
            className="h-8 w-8 p-0"
          />
          <Button
            size="sm"
            variant="secondary"
            icon={ChevronLeft}
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="h-8 w-8 p-0"
          />
          <span className="px-3 text-sm text-neutral-600 tabular-nums">
            {safePage} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            icon={ChevronRight}
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="h-8 w-8 p-0"
          />
          <Button
            size="sm"
            variant="secondary"
            icon={ChevronsRight}
            disabled={safePage >= totalPages}
            onClick={() => setPage(totalPages)}
            className="h-8 w-8 p-0"
          />
        </div>
      </div>

      <BatchActionBar />

      <Modal
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="确认删除"
        description={`确定要删除病害记录 ${deleteTarget?.id} 吗？此操作不可恢复。`}
        onConfirm={handleDeleteConfirm}
        confirmText="删除"
      />
    </div>
  );
}
