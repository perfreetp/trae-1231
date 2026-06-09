import { useState } from 'react';
import { Layers, Trash2, ArrowUpDown, Square, SquareCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import type { DiseaseLevelCode } from '@/shared/types';

interface BatchActionBarProps {
  className?: string;
}

export default function BatchActionBar({ className }: BatchActionBarProps) {
  const {
    selectedIds,
    clearSelected,
    selectAllFiltered,
    batchChangeLevel,
    deleteDiseases,
    mergeDuplicates,
    getFilteredDiseases,
  } = useDiseaseStore();

  const { diseaseLevels } = useDictStore();

  const [levelValue, setLevelValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  const filtered = getFilteredDiseases();
  const allSelected = filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id));
  const hasSelection = selectedIds.length > 0;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      clearSelected();
    } else {
      selectAllFiltered();
    }
  };

  const handleBatchChangeLevel = () => {
    if (!levelValue || selectedIds.length === 0) return;
    batchChangeLevel(selectedIds, levelValue as DiseaseLevelCode);
    setLevelValue('');
  };

  const handleDelete = () => {
    deleteDiseases(selectedIds);
    setShowDeleteModal(false);
  };

  const handleMerge = () => {
    mergeDuplicates(selectedIds);
    setShowMergeModal(false);
  };

  if (!hasSelection) return null;

  const levelOptions = diseaseLevels.map((l) => ({
    label: l.name,
    value: l.id,
  }));

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
          'bg-white border border-neutral-200 rounded-xl shadow-lg',
          'px-4 py-3',
          'flex items-center gap-4 flex-wrap',
          'animate-in fade-in slide-in-from-bottom-4 duration-300',
          className
        )}
      >
        <div className="flex items-center gap-2 pr-4 border-r border-neutral-200">
          <span className="text-sm text-neutral-600">
            已选择 <span className="font-semibold text-primary-700">{selectedIds.length}</span> 项
          </span>
          <button
            onClick={handleToggleSelectAll}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md',
              'text-neutral-600 hover:bg-neutral-100 transition-colors'
            )}
          >
            {allSelected ? (
              <SquareCheck className="w-3.5 h-3.5 text-primary-600" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            {allSelected ? '取消全选' : '全选当前'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">变更等级：</span>
          <div className="w-28">
            <Select
              size="sm"
              value={levelValue}
              onChange={setLevelValue}
              options={levelOptions}
              placeholder="选择等级"
              clearable={true}
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={ArrowUpDown}
            disabled={!levelValue}
            onClick={handleBatchChangeLevel}
          >
            应用
          </Button>
        </div>

        <div className="w-px h-6 bg-neutral-200" />

        <Button
          size="sm"
          variant="secondary"
          icon={Layers}
          disabled={selectedIds.length < 2}
          onClick={() => setShowMergeModal(true)}
        >
          合并重复点
        </Button>

        <Button
          size="sm"
          variant="danger"
          icon={Trash2}
          onClick={() => setShowDeleteModal(true)}
        >
          批量删除
        </Button>

        <button
          onClick={clearSelected}
          className={cn(
            'text-xs text-neutral-400 hover:text-neutral-600',
            'transition-colors ml-2'
          )}
        >
          清空选择
        </button>
      </div>

      <Modal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedIds.length} 条病害记录吗？此操作不可恢复。`}
        onConfirm={handleDelete}
        confirmText="删除"
      />

      <Modal
        open={showMergeModal}
        onOpenChange={setShowMergeModal}
        title="合并重复点"
        description={`将 ${selectedIds.length} 个病害点合并为一个，保留最高等级并累加面积。确定继续吗？`}
        onConfirm={handleMerge}
        confirmText="合并"
      />
    </>
  );
}
