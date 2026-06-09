export function formatDateTime(iso: string | null): string {
  if (!iso) return '--';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '--';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatArea(m2: number): string {
  if (m2 < 1) return `${Math.round(m2 * 100) / 100} m²`;
  return `${Math.round(m2 * 10) / 10} m²`;
}

export function formatMoney(amount: number): string {
  return `¥ ${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} 分钟`;
  if (hours < 24) return `${Math.round(hours * 10) / 10} 小时`;
  const days = Math.floor(hours / 24);
  const remain = Math.round(hours - days * 24);
  return remain > 0 ? `${days} 天 ${remain} 小时` : `${days} 天`;
}

export function formatKm(km: number): string {
  return `${Math.round(km * 100) / 100} km`;
}

export function relativeTime(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diffMs = now - target;
  const absMs = Math.abs(diffMs);
  const sign = diffMs >= 0 ? '前' : '后';
  const secs = Math.floor(absMs / 1000);
  if (secs < 60) return `${secs} 秒${sign}`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} 分钟${sign}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时${sign}`;
  const days = Math.floor(hrs / 24);
  return `${days} 天${sign}`;
}

export function hoursBetween(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3600000);
}

export function genId(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
