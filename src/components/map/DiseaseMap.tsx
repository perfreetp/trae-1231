import { useMemo, useRef, useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Locate,
  X,
  MapPin,
  FileText,
  Edit3,
  AlertTriangle,
  Clock,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import MapFilterBar, { type MapFilterState } from './MapFilterBar';
import MapLegend from './MapLegend';
import WarningBadge from '../disease/WarningBadge';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_STATUS_MAP } from '@/utils/constants';
import { formatDateTime, formatArea } from '@/utils/format';
import type { Disease, DiseaseTypeCode } from '@/shared/types';

interface DiseaseMapProps {
  onEditDisease?: (disease: Disease) => void;
  onViewDisease?: (disease: Disease) => void;
  onCreateOrder?: (disease: Disease) => void;
  className?: string;
}

const MAP_LAT_MIN = 29.9;
const MAP_LAT_MAX = 30.5;
const MAP_LNG_MIN = 119.8;
const MAP_LNG_MAX = 120.4;

const GRID_ROWS = 4;
const GRID_COLS = 4;

const initialFilters: MapFilterState = {
  keyword: '',
  typeIds: [],
  levelIds: [],
  roadId: '',
  dateFrom: '',
  dateTo: '',
};

export default function DiseaseMap({
  onEditDisease,
  onViewDisease,
  onCreateOrder,
  className,
}: DiseaseMapProps) {
  const { diseases } = useDiseaseStore();
  const { roads, grids, diseaseTypes, getRoadName, getGridName, getTypeName, getLevelName } = useDictStore();

  const [filters, setFilters] = useState<MapFilterState>(initialFilters);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const filteredDiseases = useMemo(() => {
    return diseases.filter((d) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const road = getRoadName(d.roadId);
        const grid = getGridName(d.gridId);
        const text = `${road} ${grid} ${d.stakeNo} ${d.description} ${d.id}`.toLowerCase();
        if (!text.includes(kw)) return false;
      }
      if (filters.typeIds.length > 0 && !filters.typeIds.includes(d.typeId)) return false;
      if (filters.levelIds.length > 0 && !filters.levelIds.includes(d.levelId)) return false;
      if (filters.roadId && d.roadId !== filters.roadId) return false;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom).getTime();
        if (new Date(d.reportedAt).getTime() < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo).getTime() + 86400000;
        if (new Date(d.reportedAt).getTime() > to) return false;
      }
      return true;
    });
  }, [diseases, filters, getRoadName, getGridName]);

  const mapToPixel = (lat: number, lng: number) => {
    const x = ((lng - MAP_LNG_MIN) / (MAP_LNG_MAX - MAP_LNG_MIN)) * 100;
    const y = ((MAP_LAT_MAX - lat) / (MAP_LAT_MAX - MAP_LAT_MIN)) * 100;
    return { x, y };
  };

  const getTypeColor = (typeId: DiseaseTypeCode) => {
    const t = diseaseTypes.find((x) => x.id === typeId);
    return t?.color || '#6B7280';
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-point]')) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: dragStart.current.panX + dx,
      y: dragStart.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handlePointHover = (disease: Disease, e: React.MouseEvent) => {
    setHoveredId(disease.id);
    const rect = mapRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handlePointLeave = () => {
    setHoveredId(null);
    setTooltipPos(null);
  };

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => window.removeEventListener('mouseup', handleGlobalUp);
  }, []);

  const gridColors = [
    'rgba(59,130,246,0.05)', 'rgba(34,197,94,0.05)', 'rgba(249,115,22,0.05)', 'rgba(139,92,246,0.05)',
    'rgba(236,72,153,0.05)', 'rgba(20,184,166,0.05)', 'rgba(234,179,8,0.05)', 'rgba(168,85,247,0.05)',
    'rgba(6,182,212,0.05)', 'rgba(16,185,129,0.05)', 'rgba(251,146,60,0.05)', 'rgba(99,102,241,0.05)',
    'rgba(244,114,182,0.05)', 'rgba(45,212,191,0.05)', 'rgba(252,211,77,0.05)', 'rgba(192,132,252,0.05)',
  ];

  const hoveredDisease = hoveredId ? filteredDiseases.find((d) => d.id === hoveredId) : null;

  return (
    <div
      className={cn(
        'relative w-full h-full bg-white rounded-lg border border-neutral-200 overflow-hidden',
        className
      )}
    >
      <div
        ref={mapRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          'absolute inset-0 cursor-grab select-none',
          isDragging && 'cursor-grabbing'
        )}
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #E0F2FE 0%, #DCFCE7 25%, #FEF3C7 50%, #FCE7F3 75%, #E0E7FF 100%)',
            }}
          />

          <svg className="absolute inset-0 w-full h-full opacity-30">
            <defs>
              <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94A3B8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
          </svg>

          {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, idx) => {
            const row = Math.floor(idx / GRID_COLS);
            const col = idx % GRID_COLS;
            const gridInfo = grids[idx % grids.length];
            return (
              <div
                key={idx}
                className="absolute border border-white/40 flex items-start justify-start p-1"
                style={{
                  left: `${(col / GRID_COLS) * 100}%`,
                  top: `${(row / GRID_ROWS) * 100}%`,
                  width: `${100 / GRID_COLS}%`,
                  height: `${100 / GRID_ROWS}%`,
                  backgroundColor: gridColors[idx],
                }}
              >
                <div className="text-[10px] text-neutral-500 font-medium bg-white/70 px-1 rounded backdrop-blur-sm">
                  {gridInfo?.code || `G-${idx + 1}`}
                </div>
              </div>
            );
          })}

          {roads.slice(0, 8).map((road, idx) => {
            const startX = 5 + (idx * 11) % 90;
            const startY = 10 + (idx * 13) % 80;
            const endX = 20 + (idx * 17) % 70;
            const endY = 85 - (idx * 7) % 60;
            const isMain = idx < 3;
            return (
              <svg
                key={road.id}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible' }}
              >
                <line
                  x1={`${startX}%`}
                  y1={`${startY}%`}
                  x2={`${endX}%`}
                  y2={`${endY}%`}
                  stroke={isMain ? '#64748B' : '#94A3B8'}
                  strokeWidth={isMain ? 3 : 2}
                  strokeLinecap="round"
                  opacity={0.6}
                />
                <text
                  x={`${(startX + endX) / 2}%`}
                  y={`${(startY + endY) / 2}%`}
                  fill="#475569"
                  fontSize="10"
                  textAnchor="middle"
                  className="select-none"
                  style={{ transform: `translateY(-4px)` }}
                >
                  {road.name}
                </text>
              </svg>
            );
          })}

          {filteredDiseases.map((d) => {
            const pos = mapToPixel(d.lat, d.lng);
            const isHovered = hoveredId === d.id;
            const isSelected = selectedDisease?.id === d.id;
            const size = isHovered || isSelected ? 28 : 20;
            const color = getTypeColor(d.typeId);
            const hasWarning = d.warningFlag !== 'none';
            const isOverdue = d.warningFlag === 'overdue';

            return (
              <div
                key={d.id}
                data-point
                className="absolute -translate-x-1/2 -translate-y-full z-10 cursor-pointer group"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                }}
                onMouseEnter={(e) => handlePointHover(d, e)}
                onMouseMove={(e) => handlePointHover(d, e)}
                onMouseLeave={handlePointLeave}
                onClick={() => setSelectedDisease(d)}
              >
                <div className="relative flex flex-col items-center">
                  {isOverdue && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-ping opacity-75"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <div
                    className={cn(
                      'rounded-full flex items-center justify-center shadow-md transition-all duration-200 border-2 border-white',
                      hasWarning && 'ring-2 ring-offset-1',
                      isOverdue && 'ring-red-400',
                      d.warningFlag === 'approaching' && 'ring-orange-400'
                    )}
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: color,
                      transform: isHovered || isSelected ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <MapPin className="w-3 h-3 text-white drop-shadow-sm" />
                  </div>
                  <div
                    className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"
                    style={{ borderTopColor: color }}
                  />
                  {(isHovered || isSelected) && (
                    <div className="absolute top-full mt-1.5 whitespace-nowrap bg-neutral-900/90 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {d.stakeNo}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hoveredDisease && tooltipPos && !selectedDisease && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: tooltipPos.x + 14,
            top: tooltipPos.y + 14,
          }}
        >
          <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 min-w-[220px]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getTypeColor(hoveredDisease.typeId) }}
                />
                <span className="text-sm font-semibold text-neutral-800">
                  {getTypeName(hoveredDisease.typeId)}
                </span>
              </div>
              <WarningBadge warningFlag={hoveredDisease.warningFlag} showText={false} />
            </div>
            <div className="space-y-1 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span className="text-neutral-400">道路</span>
                <span>{getRoadName(hoveredDisease.roadId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">桩号</span>
                <span className="font-mono">{hoveredDisease.stakeNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">等级</span>
                <span>{getLevelName(hoveredDisease.levelId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">面积</span>
                <span>{formatArea(hoveredDisease.areaM2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">上报</span>
                <span className="tabular-nums">{formatDateTime(hoveredDisease.reportedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-20 space-y-3 w-72 max-h-[calc(100%-2rem)] overflow-y-auto pr-1">
        <MapFilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="absolute top-4 right-4 z-20 space-y-3 w-56">
        <MapLegend />
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            title="放大"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-md overflow-hidden">
          <button
            onClick={handleResetView}
            className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            title="重置视图"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (filteredDiseases.length > 0) {
                setSelectedDisease(filteredDiseases[0]);
              }
            }}
            className="w-10 h-10 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
            title="定位病害"
          >
            <Locate className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-md shadow-md px-2.5 py-1.5 text-center">
          <span className="text-[11px] text-neutral-500 tabular-nums">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-md px-3 py-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-neutral-500">病害点</span>
          <span className="font-semibold text-neutral-800 tabular-nums">{filteredDiseases.length}</span>
          <span className="text-neutral-300">|</span>
          <span className="text-neutral-500">逾期</span>
          <span className="font-semibold text-red-600 tabular-nums">
            {filteredDiseases.filter((d) => d.warningFlag === 'overdue').length}
          </span>
        </div>
      </div>

      {selectedDisease && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[420px] max-w-[90vw]">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div
              className="h-1.5"
              style={{ backgroundColor: getTypeColor(selectedDisease.typeId) }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getTypeColor(selectedDisease.typeId) }}
                    />
                    <h3 className="text-base font-semibold text-neutral-900">
                      {getTypeName(selectedDisease.typeId)}
                    </h3>
                    <Badge
                      className={cn(
                        DISEASE_STATUS_MAP[selectedDisease.status].color,
                        'border'
                      )}
                      size="sm"
                    >
                      {DISEASE_STATUS_MAP[selectedDisease.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="font-mono">{selectedDisease.id}</span>
                    <WarningBadge warningFlag={selectedDisease.warningFlag} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDisease(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDisease.photoBefore && (
                <div className="mb-4 rounded-lg overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                  <img
                    src={selectedDisease.photoBefore}
                    alt="病害照片"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div>
                  <span className="text-xs text-neutral-400 block">道路</span>
                  <span className="text-neutral-800 font-medium">{getRoadName(selectedDisease.roadId)}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">桩号</span>
                  <span className="text-neutral-800 font-mono">{selectedDisease.stakeNo}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">网格</span>
                  <span className="text-neutral-800">{getGridName(selectedDisease.gridId)}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">等级</span>
                  <span className="text-neutral-800">{getLevelName(selectedDisease.levelId)}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">面积</span>
                  <span className="text-neutral-800 tabular-nums">{formatArea(selectedDisease.areaM2)}</span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">影响车道</span>
                  <span className="text-neutral-800">
                    {selectedDisease.affectedLanes.length > 0
                      ? selectedDisease.affectedLanes.join('、')
                      : '--'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    上报时间
                  </span>
                  <span className="text-neutral-800 tabular-nums">
                    {formatDateTime(selectedDisease.reportedAt)}
                  </span>
                </div>
              </div>

              {selectedDisease.description && (
                <div className="mb-4 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600 border border-neutral-100">
                  {selectedDisease.description}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={FileText}
                  onClick={() => onCreateOrder?.(selectedDisease)}
                  block
                >
                  创建工单
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => onViewDisease?.(selectedDisease)}
                  className="flex-1"
                >
                  查看
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Edit3}
                  onClick={() => onEditDisease?.(selectedDisease)}
                  className="flex-1"
                >
                  编辑
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
