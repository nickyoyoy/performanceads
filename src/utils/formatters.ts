/**
 * Enterprise number and date formatters for ScentPlus KPI Ads Dashboard.
 * All functions return "—" for null or undefined values to avoid confusing nulls with 0.
 */

export function formatCurrencyIDR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  // Format as Indonesian Rupiah: Rp8.182.656
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);

  // Normalizing non-breaking spaces
  return formatted.replace(/\s+/g, '');
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  return new Intl.NumberFormat('id-ID').format(val);
}

export function formatRoas(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  // 7,46x
  const str = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
  return `${str}x`;
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  return `${Math.round(val * 100)}%`;
}

export function formatRatioPercent(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val)}%`;
}

export function formatDateWIB(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === 'N/A') return '—';

  // Check if string matches "YYYY-MM-DD"
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;

  const [, year, month, day] = match;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const mIndex = parseInt(month, 10) - 1;
  const mName = monthNames[mIndex] || month;

  // If time is included, e.g. "2026-11-10 06:08"
  const timeMatch = dateStr.match(/(\d{2}):(\d{2})/);
  if (timeMatch) {
    return `${parseInt(day, 10)} ${mName} ${year}, ${timeMatch[1]}:${timeMatch[2]} WIB`;
  }

  return `${parseInt(day, 10)} ${mName} ${year}`;
}

