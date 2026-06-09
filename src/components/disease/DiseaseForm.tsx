import { useEffect, useState } from 'react';
import {
  Upload,
  X,
  MapPin,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useDiseaseStore } from '@/store/diseaseStore';
import { useDictStore } from '@/store/dictStore';
import { DISEASE_TYPES, DISEASE_LEVELS, LANE_OPTIONS } from '@/utils/constants';
import type { Disease, DiseaseLevelCode, DiseaseTypeCode } from '@/shared/types';

interface DiseaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDisease?: Disease | null;
}

interface FormState {
  typeId: DiseaseTypeCode | '';
  levelId: DiseaseLevelCode | '';
  areaM2: string;
  affectedLanes: string[];
  roadId: string;
  stakeNo: string;
  gridId: string;
  photoBefore: string;
  description: string;
  lat: string;
  lng: string;
}

const initialForm: FormState = {
  typeId: '',
  levelId: '',
  areaM2: '',
  affectedLanes: [],
  roadId: '',
  stakeNo: '',
  gridId: '',
  photoBefore: '',
  description: '',
  lat: '',
  lng: '',
};

export default function DiseaseForm({ open, onOpenChange, editingDisease }: DiseaseFormProps) {
  const { addDisease, updateDisease } = useDiseaseStore();
  const { roads, grids, diseaseTypes, diseaseLevels } = useDictStore();

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editingDisease;

  useEffect(() => {
    if (open) {
      if (editingDisease) {
        setForm({
          typeId: editingDisease.typeId,
          levelId: editingDisease.levelId,
          areaM2: String(editingDisease.areaM2),
          affectedLanes: [...editingDisease.affectedLanes],
          roadId: editingDisease.roadId,
          stakeNo: editingDisease.stakeNo,
          gridId: editingDisease.gridId,
          photoBefore: editingDisease.photoBefore,
          description: editingDisease.description,
          lat: String(editingDisease.lat),
          lng: String(editingDisease.lng),
        });
      } else {
        setForm(initialForm);
      }
      setErrors({});
    }
  }, [open, editingDisease]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleLane = (value: string) => {
    setField(
      'affectedLanes',
      form.affectedLanes.includes(value)
        ? form.affectedLanes.filter((l) => l !== value)
        : [...form.affectedLanes, value]
    );
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.typeId) nextErrors.typeId = '请选择病害类型';
    if (!form.levelId) nextErrors.levelId = '请选择病害等级';
    if (!form.areaM2) nextErrors.areaM2 = '请输入面积';
    else if (parseFloat(form.areaM2) <= 0) nextErrors.areaM2 = '面积必须大于0';
    if (form.affectedLanes.length === 0) nextErrors.affectedLanes = '请至少选择一个车道';
    if (!form.roadId) nextErrors.roadId = '请选择道路';
    if (!form.stakeNo.trim()) nextErrors.stakeNo = '请输入桩号';
    if (!form.gridId) nextErrors.gridId = '请选择网格';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        typeId: form.typeId as DiseaseTypeCode,
        levelId: form.levelId as DiseaseLevelCode,
        areaM2: parseFloat(form.areaM2),
        affectedLanes: form.affectedLanes,
        roadId: form.roadId,
        stakeNo: form.stakeNo.trim(),
        gridId: form.gridId,
        photoBefore: form.photoBefore || `https://picsum.photos/seed/${Date.now()}/600/400`,
        description: form.description.trim(),
        lat: parseFloat(form.lat) || 30.25,
        lng: parseFloat(form.lng) || 120.15,
      };
      if (isEdit && editingDisease) {
        updateDisease(editingDisease.id, payload);
      } else {
        addDisease(payload);
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = () => {
    const seed = Math.random().toString(36).slice(2, 8);
    setField('photoBefore', `https://picsum.photos/seed/${seed}/600/400`);
  };

  const roadOptions = roads.map((r) => ({ label: r.name, value: r.id }));
  const gridOptions = grids.map((g) => ({ label: `${g.code} ${g.name}`, value: g.id }));
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

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? '编辑病害' : '新增病害'}
      description={isEdit ? '修改病害记录信息' : '录入新的病害巡查记录'}
      size="xl"
      onConfirm={handleSubmit}
      confirmLoading={submitting}
      confirmText={isEdit ? '保存修改' : '提交'}
    >
      <div className="space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary-600 rounded-full" />
            <h3 className="text-sm font-semibold text-neutral-800">基础信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="病害类型"
              required
              value={form.typeId}
              onChange={(v) => setField('typeId', v as DiseaseTypeCode)}
              options={typeOptions}
              placeholder="请选择病害类型"
              error={errors.typeId}
            />
            <Select
              label="病害等级"
              required
              value={form.levelId}
              onChange={(v) => setField('levelId', v as DiseaseLevelCode)}
              options={levelOptions}
              placeholder="请选择病害等级"
              error={errors.levelId}
            />
            <Input
              label="面积 (m²)"
              required
              type="number"
              step="0.01"
              min="0"
              value={form.areaM2}
              onChange={(e) => setField('areaM2', e.target.value)}
              placeholder="请输入病害面积"
              error={errors.areaM2}
            />
            <div className="space-y-1.5">
              <label
                className={cn(
                  'block text-sm font-medium text-neutral-700',
                  "after:content-['*'] after:ml-0.5 after:text-danger-500"
                )}
              >
                影响车道
              </label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-white">
                {LANE_OPTIONS.map((opt) => {
                  const active = form.affectedLanes.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleLane(opt.value)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
                        active
                          ? 'bg-primary-50 text-primary-700 border-primary-200'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {errors.affectedLanes && (
                <p className="text-xs text-danger-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.affectedLanes}
                </p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary-600 rounded-full" />
            <h3 className="text-sm font-semibold text-neutral-800">位置信息</h3>
            <Badge variant="neutral" size="sm" dot icon={<MapPin className="w-3 h-3" />}>
              GPS
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="所属道路"
              required
              value={form.roadId}
              onChange={(v) => setField('roadId', v)}
              options={roadOptions}
              placeholder="请选择道路"
              error={errors.roadId}
            />
            <Select
              label="所属网格"
              required
              value={form.gridId}
              onChange={(v) => setField('gridId', v)}
              options={gridOptions}
              placeholder="请选择网格"
              error={errors.gridId}
            />
            <Input
              label="桩号"
              required
              value={form.stakeNo}
              onChange={(e) => setField('stakeNo', e.target.value)}
              placeholder="例如：K12+345"
              error={errors.stakeNo}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="纬度"
                type="number"
                step="0.000001"
                value={form.lat}
                onChange={(e) => setField('lat', e.target.value)}
                placeholder="例：30.251234"
              />
              <Input
                label="经度"
                type="number"
                step="0.000001"
                value={form.lng}
                onChange={(e) => setField('lng', e.target.value)}
                placeholder="例：120.156789"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary-600 rounded-full" />
            <h3 className="text-sm font-semibold text-neutral-800">附件信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">病害照片</label>
              {form.photoBefore ? (
                <div className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                  <img
                    src={form.photoBefore}
                    alt="病害照片"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Upload}
                      onClick={handlePhotoUpload}
                    >
                      重新上传
                    </Button>
                    <button
                      type="button"
                      onClick={() => setField('photoBefore', '')}
                      className="w-8 h-8 rounded-md bg-white/90 text-neutral-600 hover:bg-white flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePhotoUpload}
                  className={cn(
                    'w-full aspect-video rounded-lg border-2 border-dashed',
                    'flex flex-col items-center justify-center gap-2',
                    'text-neutral-400 hover:text-primary-600',
                    'border-neutral-300 hover:border-primary-400 hover:bg-primary-50/30',
                    'transition-colors cursor-pointer'
                  )}
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">点击上传照片</span>
                  <span className="text-xs">支持 JPG、PNG 格式</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">照片预览占位</label>
              <div className="aspect-video rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-50 flex flex-col items-center justify-center text-neutral-400 gap-2">
                <ImageIcon className="w-10 h-10 opacity-50" />
                <span className="text-xs">照片将在此区域显示</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary-600 rounded-full" />
            <h3 className="text-sm font-semibold text-neutral-800">描述信息</h3>
          </div>
          <div>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="请详细描述病害情况，包括位置特点、对交通的影响程度等..."
              rows={4}
              className={cn(
                'w-full rounded-md border border-neutral-300 bg-white',
                'px-3.5 py-2.5 text-sm text-neutral-900',
                'placeholder:text-neutral-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'hover:border-neutral-400 transition-colors',
                'resize-none'
              )}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}
