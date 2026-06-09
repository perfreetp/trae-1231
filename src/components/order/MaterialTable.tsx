import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import type { MaterialUsage, MaterialDict } from '@/shared/types';
import { useDictStore } from '@/store/dictStore';
import { formatMoney, genId } from '@/utils/format';
import { cn } from '@/lib/utils';
import Select, { type SelectOption } from '@/components/ui/Select';
import Button from '@/components/ui/Button';

interface MaterialTableProps {
  value?: MaterialUsage[];
  onChange?: (materials: MaterialUsage[]) => void;
  className?: string;
}

const createEmptyRow = (id?: string): MaterialUsage => ({
  id: id || genId('mu'),
  materialName: '',
  unit: '',
  quantity: 0,
  unitPrice: 0,
  subtotal: 0,
});

export default function MaterialTable({ value, onChange, className }: MaterialTableProps) {
  const { materials: materialDict } = useDictStore();
  const [rows, setRows] = useState<MaterialUsage[]>(value?.length ? value : [createEmptyRow()]);

  useEffect(() => {
    onChange?.(rows.filter((r) => r.materialName && r.quantity > 0));
  }, [rows]);

  const materialOptions: SelectOption[] = materialDict.map((m) => ({
    value: m.id,
    label: m.name,
    description: `${m.unit} · ¥${m.defaultPrice}`,
  }));

  const findMaterialById = (id: string): MaterialDict | undefined =>
    materialDict.find((m) => m.id === id);

  const findMaterialByName = (name: string): MaterialDict | undefined =>
    materialDict.find((m) => m.name === name);

  const updateRow = (rowId: string, patch: Partial<MaterialUsage>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updated = { ...r, ...patch };
        if ('quantity' in patch || 'unitPrice' in patch) {
          updated.subtotal = Number((updated.quantity * updated.unitPrice).toFixed(2));
        }
        return updated;
      })
    );
  };

  const handleMaterialSelect = (rowId: string, materialId: string) => {
    const mat = findMaterialById(materialId);
    if (!mat) {
      updateRow(rowId, {
        materialName: '',
        unit: '',
        unitPrice: 0,
        quantity: 0,
        subtotal: 0,
      });
      return;
    }
    updateRow(rowId, {
      materialName: mat.name,
      unit: mat.unit,
      unitPrice: mat.defaultPrice,
    });
  };

  const handleQuantityChange = (rowId: string, quantityStr: string) => {
    const qty = quantityStr === '' ? 0 : parseFloat(quantityStr);
    const quantity = isNaN(qty) ? 0 : Math.max(0, qty);
    updateRow(rowId, { quantity });
  };

  const handleUnitPriceChange = (rowId: string, priceStr: string) => {
    const p = priceStr === '' ? 0 : parseFloat(priceStr);
    const unitPrice = isNaN(p) ? 0 : Math.max(0, p);
    updateRow(rowId, { unitPrice });
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return [createEmptyRow()];
      return prev.filter((r) => r.id !== rowId);
    });
  };

  const totalAmount = rows.reduce((sum, r) => sum + r.subtotal, 0);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left text-neutral-600">
              <th className="px-4 py-3 font-medium w-10 text-center">#</th>
              <th className="px-4 py-3 font-medium min-w-[200px]">材料名称</th>
              <th className="px-4 py-3 font-medium w-24">单位</th>
              <th className="px-4 py-3 font-medium w-28">数量</th>
              <th className="px-4 py-3 font-medium w-32">单价(元)</th>
              <th className="px-4 py-3 font-medium w-32">小计(元)</th>
              <th className="px-4 py-3 font-medium w-16 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-neutral-50/50">
                <td className="px-4 py-3 text-center text-neutral-400">{idx + 1}</td>
                <td className="px-4 py-3">
                  <Select
                    size="sm"
                    value={findMaterialByName(row.materialName)?.id || ''}
                    onChange={(v) => handleMaterialSelect(row.id, v)}
                    options={materialOptions}
                    placeholder="选择材料"
                    clearable={false}
                  />
                </td>
                <td className="px-4 py-3 text-neutral-600">{row.unit || '-'}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.quantity === 0 ? '' : row.quantity}
                    onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                    className={cn(
                      'w-full h-8 px-2 text-sm rounded-md border border-neutral-300',
                      'bg-white text-neutral-900 placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      'transition-all duration-200 hover:border-neutral-400'
                    )}
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.unitPrice === 0 ? '' : row.unitPrice}
                    onChange={(e) => handleUnitPriceChange(row.id, e.target.value)}
                    className={cn(
                      'w-full h-8 px-2 text-sm rounded-md border border-neutral-300',
                      'bg-white text-neutral-900 placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      'transition-all duration-200 hover:border-neutral-400'
                    )}
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {formatMoney(row.subtotal)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className={cn(
                      'w-7 h-7 inline-flex items-center justify-center rounded-md',
                      'text-neutral-400 hover:text-danger-600 hover:bg-danger-50',
                      'transition-colors duration-200'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-neutral-50 font-medium">
              <td colSpan={5} className="px-4 py-3 text-right text-neutral-600 flex items-center justify-end gap-2">
                <Calculator className="w-4 h-4" />
                合计金额
              </td>
              <td className="px-4 py-3 text-primary-700 text-base font-semibold">
                {formatMoney(totalAmount)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-start">
        <Button size="sm" variant="secondary" icon={Plus} onClick={addRow}>
          新增材料行
        </Button>
      </div>
    </div>
  );
}
