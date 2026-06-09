export function exportToCSV(data: Record<string, any>[], filename = 'export.csv'): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  const bodyRows = data.map((row) =>
    headers
      .map((h) => {
        let val = row[h];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const s = String(val).replace(/"/g, '""');
        return /[",\n]/.test(s) ? `"${s}"` : s;
      })
      .join(',')
  );
  const csv = '\ufeff' + [headerRow, ...bodyRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
