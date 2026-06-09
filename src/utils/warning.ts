import type { Disease } from '@/shared/types';

export function computeWarningFlag(deadlineAt: string, status: string): Disease['warningFlag'] {
  if (['accepted', 'reviewed'].includes(status)) return 'none';
  const now = Date.now();
  const deadline = new Date(deadlineAt).getTime();
  const remainingMs = deadline - now;
  const remainingHours = remainingMs / 3600000;
  if (remainingHours <= 0) return 'overdue';
  if (remainingHours <= 12) return 'approaching';
  return 'none';
}

export function refreshWarningFlags(diseases: Disease[]): Disease[] {
  return diseases.map((d) => ({ ...d, warningFlag: computeWarningFlag(d.deadlineAt, d.status) }));
}
