import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface PhotoCompareProps {
  photoBefore: string;
  photoAfter: string;
  labelBefore?: string;
  labelAfter?: string;
  thumbnailsBefore?: string[];
  thumbnailsAfter?: string[];
  className?: string;
}

export default function PhotoCompare({
  photoBefore,
  photoAfter,
  labelBefore = '病害发现时',
  labelAfter = '维修完成后',
  thumbnailsBefore,
  thumbnailsAfter,
  className,
}: PhotoCompareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedBefore, setSelectedBefore] = useState(0);
  const [selectedAfter, setSelectedAfter] = useState(0);

  const beforeList = thumbnailsBefore?.length ? thumbnailsBefore : [photoBefore];
  const afterList = thumbnailsAfter?.length ? thumbnailsAfter : [photoAfter];

  const currentBefore = beforeList[selectedBefore] || photoBefore;
  const currentAfter = afterList[selectedAfter] || photoAfter;

  const updateSliderFromEvent = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percent)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderFromEvent(e.clientX);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      updateSliderFromEvent(e.clientX);
    },
    [isDragging, updateSliderFromEvent]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderFromEvent(e.touches[0].clientX);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      updateSliderFromEvent(e.touches[0].clientX);
    },
    [isDragging, updateSliderFromEvent]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (!currentBefore && !currentAfter) {
    return (
      <div className={cn('py-12', className)}>
        <div className="flex h-full items-center justify-center text-neutral-400 text-sm py-12">
          暂无照片数据
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-red-50/60 border border-red-100 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-700 mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {labelBefore}
          </div>
          <div className="text-xs text-red-500">拖动中间分隔线查看对比效果</div>
        </div>
        <div className="p-3 bg-green-50/60 border border-green-100 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 mb-1">
            <ZoomIn className="w-3.5 h-3.5" />
            {labelAfter}
          </div>
          <div className="text-xs text-green-500">维修处置完成后的状态</div>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          'relative select-none overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100',
          'aspect-video cursor-ew-resize',
          isDragging && 'cursor-col-resize'
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute inset-0">
          {currentAfter ? (
            <img
              src={currentAfter}
              alt={labelAfter}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-400 text-sm">
              暂无维修后照片
            </div>
          )}
        </div>

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          {currentBefore ? (
            <img
              src={currentBefore}
              alt={labelBefore}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ width: `${containerRef.current?.clientWidth || 100}px`, maxWidth: 'none' }}
              draggable={false}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-neutral-50 text-neutral-400 text-sm"
              style={{ width: `${containerRef.current?.clientWidth || 100}px`, maxWidth: 'none' }}
            >
              暂无病害发现时照片
            </div>
          )}
        </div>

        <div
          className={cn(
            'absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none',
            'transition-transform duration-75',
            isDragging && 'scale-x-150'
          )}
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div
            className={cn(
              'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-10 h-10 rounded-full bg-white shadow-lg border border-neutral-200',
              'flex items-center justify-center gap-0.5',
              'pointer-events-auto cursor-col-resize'
            )}
          >
            <ChevronLeft className="w-4 h-4 text-neutral-500 -ml-0.5" />
            <ChevronRight className="w-4 h-4 text-neutral-500 -mr-0.5" />
          </div>
        </div>

        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
          {labelBefore}
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
          {labelAfter}
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm">
          对比 {Math.round(sliderPosition)}%
        </div>
      </div>

      {(beforeList.length > 1 || afterList.length > 1) && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-neutral-600 mb-2">{labelBefore}缩略图</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {beforeList.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedBefore(idx)}
                  className={cn(
                    'flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all duration-200',
                    selectedBefore === idx
                      ? 'border-primary-600 ring-2 ring-primary-200'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-600 mb-2">{labelAfter}缩略图</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {afterList.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAfter(idx)}
                  className={cn(
                    'flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all duration-200',
                    selectedAfter === idx
                      ? 'border-primary-600 ring-2 ring-primary-200'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
