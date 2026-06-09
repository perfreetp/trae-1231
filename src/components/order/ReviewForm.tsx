import { useState, useEffect } from 'react';
import {
  MapPin,
  ClipboardList,
  Package,
  Car,
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import type { MaterialUsage, ReviewLog, WorkOrder } from '@/shared/types';
import { useDictStore } from '@/store/dictStore';
import { useOrderStore } from '@/store/orderStore';
import { useReviewStore } from '@/store/reviewStore';
import { TRAFFIC_GUIDE_OPTIONS } from '@/utils/constants';
import { cn } from '@/lib/utils';
import Select, { type SelectOption } from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import MaterialTable from './MaterialTable';

interface ReviewFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  reviewRound?: number;
  lastRejectReason?: string | null;
  lastRejectScore?: number | null;
  lastRejectOpinion?: string | null;
}

const steps = [
  { key: 'arrival', label: '到场登记', icon: MapPin },
  { key: 'disposal', label: '处置详情', icon: ClipboardList },
  { key: 'material', label: '材料用量', icon: Package },
  { key: 'traffic', label: '封路信息', icon: Car },
  { key: 'photo', label: '现场照片', icon: Camera },
];

export default function ReviewForm({ orderId, onSuccess, onCancel, className, reviewRound = 1, lastRejectReason, lastRejectScore, lastRejectOpinion }: ReviewFormProps) {
  const { teams, getRoadName } = useDictStore();
  const { orders } = useOrderStore();
  const { addReview } = useReviewStore();
  const isRework = reviewRound > 1;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<MaterialUsage[]>([]);

  const [arrivedAt, setArrivedAt] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [workerDropdownOpen, setWorkerDropdownOpen] = useState(false);

  const [disposalMeasures, setDisposalMeasures] = useState('');
  const [completedAt, setCompletedAt] = useState('');

  const [roadClosed, setRoadClosed] = useState(false);
  const [closurePeriod, setClosurePeriod] = useState('');
  const [trafficGuide, setTrafficGuide] = useState('');

  const [photoDuring, setPhotoDuring] = useState('');
  const [photoDuringList, setPhotoDuringList] = useState<string[]>([]);
  const [photoAfter, setPhotoAfter] = useState('');
  const [photoAfterList, setPhotoAfterList] = useState<string[]>([]);

  const order = orders.find((o) => o.id === orderId);
  const team = teams.find((t) => t.id === order?.teamId);
  const workers: SelectOption[] = (team?.members || []).map((m) => ({
    value: m,
    label: m,
  }));

  useEffect(() => {
    return () => setWorkerDropdownOpen(false);
  }, []);

  const toggleWorker = (worker: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(worker) ? prev.filter((w) => w !== worker) : [...prev, worker]
    );
  };

  const addPhotoDuring = () => {
    if (photoDuring.trim()) {
      setPhotoDuringList((prev) => [...prev, photoDuring.trim()]);
      setPhotoDuring('');
    }
  };

  const removePhotoDuring = (idx: number) => {
    setPhotoDuringList((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPhotoAfter = () => {
    if (photoAfter.trim()) {
      setPhotoAfterList((prev) => [...prev, photoAfter.trim()]);
      setPhotoAfter('');
    }
  };

  const removePhotoAfter = (idx: number) => {
    setPhotoAfterList((prev) => prev.filter((_, i) => i !== idx));
  };

  const [stepError, setStepError] = useState<string | null>(null);

  const getStepRequirements = (step: number): { ok: boolean; message?: string } => {
    switch (step) {
      case 0:
        if (!arrivedAt) return { ok: false, message: '请先选择到场时间' };
        if (selectedWorkers.length === 0) return { ok: false, message: '请至少选择一名到场人员' };
        return { ok: true };
      case 1:
        if (!arrivedAt || selectedWorkers.length === 0) return { ok: false, message: '请先完成「到场登记」步骤填写' };
        if (!disposalMeasures.trim()) return { ok: false, message: '请填写处置措施' };
        if (!completedAt) return { ok: false, message: '请选择处置完成时间' };
        if (arrivedAt && completedAt && new Date(completedAt).getTime() < new Date(arrivedAt).getTime()) {
          return { ok: false, message: '完成时间不能早于到场时间' };
        }
        return { ok: true };
      case 2:
        if (!disposalMeasures.trim() || !completedAt) return { ok: false, message: '请先完成「处置详情」步骤填写' };
        return { ok: true };
      case 3:
      case 4:
        if (!disposalMeasures.trim() || !completedAt) return { ok: false, message: '请先完成「处置详情」步骤填写' };
        if (roadClosed && (!closurePeriod.trim() || !trafficGuide)) {
          return { ok: false, message: '封路信息下「封路时段」和「交通引导」为必填' };
        }
        return { ok: true };
      default:
        return { ok: true };
    }
  };

  const goToStep = (step: number) => {
    if (step < 0 || step >= steps.length) return;
    if (step > currentStep) {
      for (let s = currentStep; s < step; s++) {
        const req = getStepRequirements(s);
        if (!req.ok) {
          setStepError(`第 ${s + 1} 步（${steps[s].label}）：${req.message}`);
          setCurrentStep(s);
          return;
        }
      }
    }
    setStepError(null);
    setCurrentStep(step);
  };

  const canNext = () => {
    switch (currentStep) {
      case 0:
        return arrivedAt && selectedWorkers.length > 0;
      case 1:
        return disposalMeasures.trim() && completedAt;
      case 2:
        return true;
      case 3:
        return !roadClosed || (closurePeriod.trim() && trafficGuide);
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!orderId) return;
    for (let s = 0; s < steps.length; s++) {
      const req = getStepRequirements(s);
      if (!req.ok) {
        setStepError(`第 ${s + 1} 步（${steps[s].label}）：${req.message}`);
        setCurrentStep(s);
        return;
      }
    }
    setStepError(null);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    const review: Omit<ReviewLog, 'id'> = {
      orderId,
      arrivedAt: new Date(arrivedAt).toISOString(),
      workers: selectedWorkers,
      disposalMeasures,
      completedAt: new Date(completedAt).toISOString(),
      roadClosed,
      closurePeriod,
      trafficGuide,
      photoDuring: photoDuringList[0] || '',
      photoAfter: photoAfterList[0] || '',
      materials,
    };

    addReview(review);
    setSubmitting(false);
    onSuccess?.();
  };

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200 p-6', className)}>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 flex-wrap">
              现场复核登记
              <Badge variant={isRework ? 'warning' : 'info'} size="sm">
                第{reviewRound}轮复核
              </Badge>
              {isRework && (
                <Badge variant="danger" size="sm">返工验收退回单</Badge>
              )}
            </h2>
            {order && (
              <p className="mt-1 text-sm text-neutral-500">
                工单 {order.id} · {team?.name}
              </p>
            )}
          </div>
        </div>

        {isRework && lastRejectReason && (
          <div className="mb-6 p-4 rounded-lg bg-red-50/60 border border-red-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-800">
                上一轮（第{reviewRound - 1}轮）验收退回原因与整改重点
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              <div>
                <div className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  退回原因（需整改项）
                </div>
                <p className="text-sm text-neutral-800 font-medium bg-white rounded p-2 border border-red-100 leading-relaxed">
                  {lastRejectReason}
                </p>
              </div>
              <div>
                <div className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  上次验收意见 / 评分
                </div>
                <p className="text-sm text-neutral-700 bg-white rounded p-2 border border-neutral-100 leading-relaxed">
                  {lastRejectScore != null && (
                    <span className="inline-block mr-2 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[11px] font-semibold">
                      {lastRejectScore}分
                    </span>
                  )}
                  {lastRejectOpinion || '--'}
                </p>
              </div>
            </div>
            <div className="pl-6 text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              提示：本次复核需在「处置措施」中说明上述问题的整改情况，否则验收环节可能再次退回
            </div>
          </div>
        )}

        <div className="relative">
          <div className="flex items-start justify-between">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                {idx > 0 && (
                  <div
                    className={cn(
                      'absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2',
                      idx <= currentStep ? 'bg-primary-600' : 'bg-neutral-200'
                    )}
                  />
                )}
                <button
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                    idx < currentStep
                      ? 'bg-primary-600 text-white'
                      : idx === currentStep
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                      : 'bg-neutral-100 text-neutral-500'
                  )}
                >
                  {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
                </button>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    idx === currentStep ? 'text-primary-700' : 'text-neutral-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {stepError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-red-700 mb-0.5">步骤未完成</div>
              <p className="text-xs text-red-800 leading-relaxed">{stepError}</p>
            </div>
          </div>
        )}
      </div>

      <div className="min-h-[320px] mb-6">
        {currentStep === 0 && (
          <div className="space-y-5">
            <Input
              label="到场时间"
              required
              type="datetime-local"
              value={arrivedAt}
              onChange={(e) => setArrivedAt(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5 after:content-['*'] after:ml-0.5 after:text-danger-500">
                处置人员（多选）
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWorkerDropdownOpen((v) => !v)}
                  className={cn(
                    'w-full min-h-[38px] px-3 py-1.5 flex flex-wrap gap-1.5 items-center',
                    'rounded-md border border-neutral-300 bg-white text-left',
                    'transition-all duration-200 hover:border-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    workerDropdownOpen && 'ring-2 ring-primary-500 border-primary-500'
                  )}
                >
                  {selectedWorkers.length === 0 ? (
                    <span className="text-sm text-neutral-400">请选择处置人员</span>
                  ) : (
                    selectedWorkers.map((w) => (
                      <span
                        key={w}
                        className={cn(
                          'inline-flex items-center gap-1 h-6 px-2 rounded-md',
                          'bg-primary-50 text-primary-700 text-xs font-medium border border-primary-200'
                        )}
                      >
                        {w}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-primary-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorker(w);
                          }}
                        />
                      </span>
                    ))
                  )}
                </button>
                {workerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1.5 bg-white border border-neutral-200 rounded-md shadow-lg py-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                    {workers.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-center text-neutral-400">
                        无人员可选，请先选择班组
                      </div>
                    ) : (
                      workers.map((opt) => {
                        const checked = selectedWorkers.includes(opt.value);
                        return (
                          <div
                            key={opt.value}
                            onClick={() => toggleWorker(opt.value)}
                            className={cn(
                              'flex items-center gap-3 px-3.5 py-2.5 cursor-pointer text-sm transition-colors duration-150',
                              checked ? 'bg-primary-50 text-primary-800' : 'text-neutral-700 hover:bg-neutral-50'
                            )}
                          >
                            <div
                              className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                                checked
                                  ? 'bg-primary-600 border-primary-600'
                                  : 'border-neutral-300 bg-white'
                              )}
                            >
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{opt.label}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5 after:content-['*'] after:ml-0.5 after:text-danger-500">
                处置措施
              </label>
              <textarea
                value={disposalMeasures}
                onChange={(e) => setDisposalMeasures(e.target.value)}
                rows={5}
                placeholder="请详细描述病害处置过程、采用的工艺、关键技术参数等..."
                className={cn(
                  'w-full rounded-md border border-neutral-300 bg-white',
                  'px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  'transition-all duration-200 hover:border-neutral-400',
                  'resize-none leading-relaxed'
                )}
              />
            </div>
            <Input
              label="完成时间"
              required
              type="datetime-local"
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
            />
          </div>
        )}

        {currentStep === 2 && (
          <MaterialTable value={materials} onChange={setMaterials} />
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <div className="text-sm font-medium text-neutral-900">是否封路</div>
                <div className="text-xs text-neutral-500 mt-0.5">作业期间是否需要封闭车道进行交通管制</div>
              </div>
              <button
                type="button"
                onClick={() => setRoadClosed((v) => !v)}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
                  roadClosed ? 'bg-primary-600' : 'bg-neutral-300'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                    roadClosed ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>

            {roadClosed && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5 after:content-['*'] after:ml-0.5 after:text-danger-500">
                    封路时段
                  </label>
                  <input
                    type="text"
                    value={closurePeriod}
                    onChange={(e) => setClosurePeriod(e.target.value)}
                    placeholder="如：09:30-11:00"
                    className={cn(
                      'w-full h-9 rounded-md border border-neutral-300 bg-white',
                      'px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      'transition-all duration-200 hover:border-neutral-400'
                    )}
                  />
                </div>
                <Select
                  label="交通疏导方式"
                  required
                  value={trafficGuide}
                  onChange={setTrafficGuide}
                  options={TRAFFIC_GUIDE_OPTIONS}
                  placeholder="请选择疏导方式"
                />
              </>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                处置中照片（可多张）
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={photoDuring}
                  onChange={(e) => setPhotoDuring(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhotoDuring())}
                  placeholder="请输入图片URL，按回车添加"
                  className={cn(
                    'flex-1 h-9 rounded-md border border-neutral-300 bg-white',
                    'px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    'transition-all duration-200 hover:border-neutral-400'
                  )}
                />
                <Button size="md" variant="secondary" icon={Plus} onClick={addPhotoDuring}>
                  添加
                </Button>
              </div>
              {photoDuringList.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photoDuringList.map((url, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-md overflow-hidden border border-neutral-200 bg-neutral-50">
                      <img src={url} alt={`处置中-${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhotoDuring(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                处置后照片（可多张）
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={photoAfter}
                  onChange={(e) => setPhotoAfter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhotoAfter())}
                  placeholder="请输入图片URL，按回车添加"
                  className={cn(
                    'flex-1 h-9 rounded-md border border-neutral-300 bg-white',
                    'px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                    'transition-all duration-200 hover:border-neutral-400'
                  )}
                />
                <Button size="md" variant="secondary" icon={Plus} onClick={addPhotoAfter}>
                  添加
                </Button>
              </div>
              {photoAfterList.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photoAfterList.map((url, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-md overflow-hidden border border-neutral-200 bg-neutral-50">
                      <img src={url} alt={`处置后-${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhotoAfter(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-neutral-200">
        <div>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              取消
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button variant="secondary" icon={ChevronLeft} onClick={() => goToStep(currentStep - 1)}>
              上一步
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button
              variant="primary"
              iconPosition="right"
              icon={ChevronRight}
              disabled={!canNext()}
              onClick={() => goToStep(currentStep + 1)}
            >
              下一步
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={Check}
              loading={submitting}
              disabled={!canNext()}
              onClick={handleSubmit}
            >
              提交复核
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
