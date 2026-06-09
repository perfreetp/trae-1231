import { useState, useEffect } from 'react';
import { Phone, User } from 'lucide-react';
import { useDictStore } from '@/store/dictStore';
import { useOrderStore } from '@/store/orderStore';
import { useDiseaseStore } from '@/store/diseaseStore';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Select, { type SelectOption } from '@/components/ui/Select';
import Input from '@/components/ui/Input';

interface AssignModalProps {
  open: boolean;
  orderId: string | null;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AssignModal({ open, orderId, onOpenChange, onSuccess }: AssignModalProps) {
  const { teams, getRoadName } = useDictStore();
  const { orders, assignOrder } = useOrderStore();
  const { diseases } = useDiseaseStore();

  const [teamId, setTeamId] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const order = orders.find((o) => o.id === orderId);
  const disease = order ? diseases.find((d) => d.id === order.diseaseId) : null;
  const selectedTeam = teams.find((t) => t.id === teamId);

  const teamOptions: SelectOption[] = teams.map((t) => ({
    value: t.id,
    label: `${t.name} - ${t.leader}`,
    description: `负载 ${t.workLoad}`,
  }));

  const resetForm = () => {
    setTeamId('');
    setPlannedStart('');
    setPlannedEnd('');
    setRemark('');
    setSubmitting(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!orderId || !teamId || !plannedStart || !plannedEnd) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    assignOrder(orderId, teamId, new Date(plannedStart).toISOString(), new Date(plannedEnd).toISOString(), remark || null);
    setSubmitting(false);
    onOpenChange?.(false);
    onSuccess?.();
  };

  const canConfirm = teamId && plannedStart && plannedEnd;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="工单派单"
      description={
        order && disease
          ? `${getRoadName(disease.roadId)} · ${disease.stakeNo} · ${order.id}`
          : undefined
      }
      size="md"
      confirmText="确认派单"
      confirmLoading={submitting}
      confirmDisabled={!canConfirm}
      onConfirm={handleConfirm}
    >
      <div className="space-y-5">
        <Select
          label="选择养护班组"
          required
          value={teamId}
          onChange={setTeamId}
          options={teamOptions}
          placeholder="请选择养护班组"
        />

        {selectedTeam && (
          <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200">
            <div className="text-xs font-medium text-neutral-700 mb-2">班组长信息</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <User className="w-4 h-4 text-neutral-400" />
                <span>{selectedTeam.leader}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span>{selectedTeam.phone}</span>
              </div>
              <div className="col-span-2 text-xs text-neutral-500 mt-1">
                成员：{selectedTeam.members.join('、')}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="计划开始时间"
            required
            type="datetime-local"
            value={plannedStart}
            onChange={(e) => setPlannedStart(e.target.value)}
          />
          <Input
            label="计划结束时间"
            required
            type="datetime-local"
            value={plannedEnd}
            onChange={(e) => setPlannedEnd(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            备注
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="请输入备注信息（选填）"
            className={cn(
              'w-full rounded-md border border-neutral-300 bg-white',
              'px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'transition-all duration-200',
              'hover:border-neutral-400',
              'resize-none'
            )}
          />
        </div>
      </div>
    </Modal>
  );
}
