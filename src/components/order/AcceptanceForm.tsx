import { useState } from 'react';
import { Check, X, Star, AlertTriangle, FileText, User, Send } from 'lucide-react';
import type { AcceptanceRecord, AcceptanceResult } from '@/shared/types';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import { cn } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface AcceptanceFormProps {
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const scoreColorClasses = [
  'bg-red-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-green-500',
  'bg-emerald-500',
];

const getScoreColor = (score: number) => {
  const idx = Math.min(10, Math.floor(score / 10));
  return scoreColorClasses[idx];
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return { text: '优秀', color: 'text-emerald-600' };
  if (score >= 80) return { text: '良好', color: 'text-green-600' };
  if (score >= 70) return { text: '合格', color: 'text-lime-600' };
  if (score >= 60) return { text: '基本合格', color: 'text-yellow-600' };
  return { text: '不合格', color: 'text-red-600' };
};

export default function AcceptanceForm({ orderId, onSuccess, onCancel, className }: AcceptanceFormProps) {
  const { addRecord, getReworkCount } = useAcceptanceStore();

  const [result, setResult] = useState<AcceptanceResult>('passed');
  const [qualityScore, setQualityScore] = useState(85);
  const [opinion, setOpinion] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [inspector, setInspector] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reworkCount = getReworkCount(orderId);
  const scoreLabel = getScoreLabel(qualityScore);

  const handleSubmit = async () => {
    if (!orderId || !inspector.trim() || !opinion.trim()) return;
    if (result === 'rejected' && !rejectReason.trim()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    const record: Omit<AcceptanceRecord, 'id'> = {
      orderId,
      result,
      qualityScore,
      opinion,
      rejectReason: result === 'rejected' ? rejectReason : null,
      inspector,
      inspectedAt: new Date().toISOString(),
      reworkCount,
    };

    addRecord(record);
    setSubmitting(false);
    onSuccess?.();
  };

  const canSubmit = inspector.trim() && opinion.trim() && (result === 'passed' || rejectReason.trim());

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200 p-6 max-w-2xl mx-auto', className)}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">质量验收</h2>
            <p className="text-xs text-neutral-500">工单 {orderId}{reworkCount > 0 && ` · 返工次数 ${reworkCount}`}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3 after:content-['*'] after:ml-0.5 after:text-danger-500">
            验收结论
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setResult('passed')}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200 text-left',
                result === 'passed'
                  ? 'border-green-500 bg-green-50/50 shadow-sm'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    result === 'passed' ? 'bg-green-500 text-white' : 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className={cn('text-sm font-semibold', result === 'passed' ? 'text-green-700' : 'text-neutral-700')}>
                    通过
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">质量达标，验收通过</div>
                </div>
              </div>
              {result === 'passed' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setResult('rejected')}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200 text-left',
                result === 'rejected'
                  ? 'border-red-500 bg-red-50/50 shadow-sm'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    result === 'rejected' ? 'bg-red-500 text-white' : 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <div className={cn('text-sm font-semibold', result === 'rejected' ? 'text-red-700' : 'text-neutral-700')}>
                    退回
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">质量不达标，需返工</div>
                </div>
              </div>
              {result === 'rejected' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-neutral-700 after:content-['*'] after:ml-0.5 after:text-danger-500">
              质量评分
            </label>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100', scoreLabel.color)}>
                {scoreLabel.text}
              </span>
              <span className={cn('text-2xl font-bold tabular-nums', scoreLabel.color)}>
                {qualityScore}
              </span>
            </div>
          </div>
          <div className="px-1">
            <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-300', getScoreColor(qualityScore))}
                style={{ width: `${qualityScore}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={qualityScore}
              onChange={(e) => setQualityScore(parseInt(e.target.value))}
              className="w-full mt-3 accent-primary-600"
            />
            <div className="flex justify-between mt-1 text-[10px] text-neutral-400 font-medium">
              <span>0</span>
              <span>20</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5 after:content-['*'] after:ml-0.5 after:text-danger-500">
            验收意见
          </label>
          <textarea
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            rows={3}
            placeholder={result === 'passed' ? '请描述验收情况、处置质量评价等...' : '请描述验收中发现的问题...'}
            className={cn(
              'w-full rounded-md border border-neutral-300 bg-white',
              'px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'transition-all duration-200 hover:border-neutral-400',
              'resize-none leading-relaxed'
            )}
          />
        </div>

        {result === 'rejected' && (
          <div className="p-4 bg-red-50/60 border border-red-100 rounded-lg space-y-0 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-600 font-medium">退回后工单将重新进入处置流程，请务必详细说明退回原因</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1.5 after:content-['*'] after:ml-0.5 after:text-danger-500">
                退回原因
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="请详细描述需要返工的具体问题，如：碾压不密实、色差明显、范围未清理干净等..."
                className={cn(
                  'w-full rounded-md border border-red-200 bg-white',
                  'px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400',
                  'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  'transition-all duration-200 hover:border-red-300',
                  'resize-none leading-relaxed'
                )}
              />
            </div>
          </div>
        )}

        <Input
          label="验收人"
          required
          value={inspector}
          onChange={(e) => setInspector(e.target.value)}
          placeholder="请输入验收人姓名"
          leftIcon={User}
        />
      </div>

      <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-neutral-200">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button
          variant={result === 'passed' ? 'primary' : 'danger'}
          icon={Send}
          loading={submitting}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {result === 'passed' ? '确认通过' : '确认退回'}
        </Button>
      </div>
    </div>
  );
}
