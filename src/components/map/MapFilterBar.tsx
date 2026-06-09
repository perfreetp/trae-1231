import { useState } from 'react';
import { Search, Filter, X, Calendar, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_TYPES, DISEASE_LEVELS } from '@/utils/constants';
import type { DiseaseLevelCode, DiseaseTypeCode } from '@/shared/types';

export interface MapFilterState {
  keyword: string;
  typeIds: DiseaseTypeCode[];
  levelIds: DiseaseLevelCode[];
  roadId: string;
  dateFrom: string;
  dateTo: string;
}

interface MapFilterBarProps {
  filters: MapFilterState;
  onChange: (filters: MapFilterState) => void;
  className?: string;
}

const initialFilters: MapFilterState = {
  keyword: '',
  typeIds: [],
  levelIds: [],
  roadId: '',
  dateFrom: '',
  dateTo: '',
};

export default function MapFilterBar({ filters, onChange, className }: MapFilterBarProps) {
  const { roads } = useDictStore();
  const [showDatePanel, setShowDatePanel] = useState(false);

  const updateField = <K extends keyof MapFilterState>(key: K, value: MapFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleType = (typeId: DiseaseTypeCode) => {
    updateField(
      'typeIds',
      filters.typeIds.includes(typeId)
        ? filters.typeIds.filter((t) => t !== typeId)
        : [...filters.typeIds, typeId]
    );
  };

  const toggleLevel = (levelId: DiseaseLevelCode) => {
    updateField(
      'levelIds',
      filters.levelIds.includes(levelId)
        ? filters.levelIds.filter((l) => l !== levelId)
        : [...filters.levelIds, levelId]
    );
  };

  const handleReset = () => {
    onChange(initialFilters);
  };

  const roadOptions = roads.map((r) => ({ label: r.name, value: r.id }));

  const hasActiveFilters =
    filters.keyword ||
    filters.typeIds.length > 0 ||
    filters.levelIds.length > 0 ||
    filters.roadId ||
    filters.dateFrom ||
    filters.dateTo;

  const activeCount =
    (filters.keyword ? 1 : 0) +
    filters.typeIds.length +
    filters.levelIds.length +
    (filters.roadId ? 1 : 0) +
    ((filters.dateFrom || filters.dateTo) ? 1 : 0);

  return (
    <div
      className={cn(
        'bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-md',
        'p-4 space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-semibold text-neutral-800">地图筛选</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className={cn(
            'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md',
            'text-neutral-500 hover:text-primary-600 hover:bg-primary-50',
            'transition-colors'
          )}
        >
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
      </div>

      <div className="relative">
        <Input
          value={filters.keyword}
          onChange={(e) => updateField('keyword', e.target.value)}
          placeholder="搜索道路、桩号、描述..."
          leftIcon={Search}
          showClear
          onClear={() => updateField('keyword', '')}
          size="sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-600">病害类型</span>
          {filters.typeIds.length > 0 && (
            <button
              onClick={() => updateField('typeIds', [])}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 inline-flex items-center gap-0.5"
            >
              <X className="w-3 h-3" />清除
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DISEASE_TYPES.map((t) => {
            const active = filters.typeIds.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleType(t.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                  active
                    ? 'border-transparent shadow-sm text-white'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                )}
                style={active ? { backgroundColor: t.color } : {}}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    active && 'bg-white/80'
                  )}
                  style={!active ? { backgroundColor: t.color } : {}}
                />
                {t.name}
                {active && (
                  <X className="w-2.5 h-2.5 opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-600">病害等级</span>
          {filters.levelIds.length > 0 && (
            <button
              onClick={() => updateField('levelIds', [])}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 inline-flex items-center gap-0.5"
            >
              <X className="w-3 h-3" />清除
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DISEASE_LEVELS.map((l) => {
            const active = filters.levelIds.includes(l.id);
            return (
              <button
                key={l.id}
                onClick={() => toggleLevel(l.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                  active
                    ? 'border-transparent shadow-sm text-white'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                )}
                style={active ? { backgroundColor: l.color } : {}}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    active && 'bg-white/80'
                  )}
                  style={!active ? { backgroundColor: l.color } : {}}
                />
                {l.name}
                {active && (
                  <X className="w-2.5 h-2.5 opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Select
        size="sm"
        label="所属道路"
        value={filters.roadId}
        onChange={(v) => updateField('roadId', v)}
        options={roadOptions}
        placeholder="全部道路"
        clearable={true}
      />

      <div className="relative">
        <button
          onClick={() => setShowDatePanel(!showDatePanel)}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 h-8 rounded-md border text-left text-xs',
            'bg-white transition-all',
            (filters.dateFrom || filters.dateTo)
              ? 'border-primary-300 text-neutral-900'
              : 'border-neutral-300 text-neutral-400 hover:border-neutral-400'
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            {filters.dateFrom || filters.dateTo
              ? `${filters.dateFrom || '开始'} ~ ${filters.dateTo || '结束'}`
              : '时间范围'}
          </span>
          {(filters.dateFrom || filters.dateTo) && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                updateField('dateFrom', '');
                updateField('dateTo', '');
              }}
              className="w-4 h-4 flex items-center justify-center rounded-sm text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
            >
              <X className="w-3 h-3" />
            </span>
          )}
        </button>

        {showDatePanel && (
          <div
            className={cn(
              'absolute top-full left-0 right-0 z-20 mt-1.5',
              'bg-white border border-neutral-200 rounded-md shadow-lg',
              'p-3 space-y-2',
              'animate-in fade-in slide-in-from-top-2 duration-150'
            )}
          >
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-500">开始日期</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateField('dateFrom', e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-neutral-500">结束日期</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateField('dateTo', e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="secondary"
                block
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  updateField('dateFrom', d.toISOString().split('T')[0]);
                  updateField('dateTo', new Date().toISOString().split('T')[0]);
                }}
              >
                近7天
              </Button>
              <Button
                size="sm"
                variant="primary"
                block
                onClick={() => setShowDatePanel(false)}
              >
                确定
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
