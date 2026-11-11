import Papa from 'papaparse';
import { AdsDailyRecord, AdsDataStatus } from '../types/ads';

export interface ColumnMapping {
  reportDate: string;
  channel: string;
  adType: string;
  periodStart: string;
  periodEnd: string;
  cutoff: string;
  targetSpend: string;
  actualSpend: string;
  targetRevenue: string;
  actualRevenue: string;
  targetOrders: string;
  actualOrders: string;
  roas: string;
  status: string;
  pic: string;
  issueNotes: string;
  metricSource: string;
  evidenceUrl: string;
  pulledAt: string;
}

// Canonical header keywords for flexible column detection
const HEADER_KEYS: Record<keyof ColumnMapping, string[]> = {
  reportDate: ['tanggal wib', 'tanggal', 'date', 'report date'],
  channel: ['kanal', 'channel', 'platform'],
  adType: ['jenis iklan', 'ad type', 'tipe iklan', 'campaign type'],
  periodStart: ['periode awal wib', 'periode awal', 'start period'],
  periodEnd: ['periode akhir wib', 'periode akhir', 'end period'],
  cutoff: ['cutoff wib', 'cutoff', 'cut off'],
  targetSpend: ['target spend rp', 'target spend', 'budget'],
  actualSpend: ['realisasi spend rp', 'realisasi spend', 'actual spend', 'spend'],
  targetRevenue: ['target gmv ads rp', 'target gmv', 'target revenue'],
  actualRevenue: ['realisasi gmv ads rp', 'realisasi gmv', 'actual revenue', 'actual gmv'],
  targetOrders: ['target paid order', 'target order', 'target orders'],
  actualOrders: ['realisasi paid order', 'realisasi order', 'actual orders', 'paid order', 'orders'],
  roas: ['roas', 'return on ad spend'],
  status: ['status data', 'status'],
  pic: ['pic', 'person in charge', 'owner'],
  issueNotes: ['kendala / catatan', 'kendala', 'catatan', 'notes', 'issue'],
  metricSource: ['sumber metrik', 'sumber data', 'metric source', 'source'],
  evidenceUrl: ['link bukti', 'bukti', 'evidence', 'screenshot'],
  pulledAt: ['waktu tarik wib', 'waktu tarik', 'pulled at', 'fetch time'],
};

/**
 * Matches actual CSV headers to our canonical fields, regardless of order.
 */
export function buildHeaderMapping(headers: string[]): Partial<Record<keyof ColumnMapping, number>> {
  const mapping: Partial<Record<keyof ColumnMapping, number>> = {};
  const normalizedHeaders = headers.map(h => (h || '').trim().toLowerCase());

  for (const [key, aliases] of Object.entries(HEADER_KEYS) as [keyof ColumnMapping, string[]][]) {
    for (const alias of aliases) {
      const idx = normalizedHeaders.findIndex(h => h === alias || h.includes(alias));
      if (idx !== -1) {
        mapping[key] = idx;
        break;
      }
    }
  }

  return mapping;
}

/**
 * Parses numeric strings into numbers or null.
 * Handles "N/A", "Rp 8.182.656", comma decimals ("7,46"), dots ("8.182.656").
 * Returns null for invalid or missing values. NEVER returns 0 for missing values.
 */
export function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === 'N/A' || s === 'n/a' || s === '-' || s === '--' || s === 'null') {
    return null;
  }

  // Remove "Rp", whitespace, and non-numeric chars except digits, comma, period, minus
  let clean = s.replace(/^[Rr][Pp]\s*/, '').trim();

  // If format is Indonesian/European like "8.182.656" (thousands separated by dot, no decimal)
  // or "7,46" (comma as decimal)
  if (/^-?\d{1,3}(\.\d{3})+$/.test(clean)) {
    // Pure dot thousand separators: 8.182.656 -> 8182656
    clean = clean.replace(/\./g, '');
  } else if (/^-?\d+,\d+$/.test(clean)) {
    // Pure comma decimal: 7,46 -> 7.46
    clean = clean.replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})*,\d+$/.test(clean)) {
    // Mixed: 8.182.656,50 -> 8182656.50
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    // Standard format or already clean "8182656" or "7.46"
    clean = clean.replace(/,/g, '');
  }

  const num = Number(clean);
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  return num;
}

/**
 * Parses integer strings into integer or null.
 */
export function parseInteger(val: unknown): number | null {
  const n = parseNumber(val);
  if (n === null) return null;
  return Math.round(n);
}

/**
 * Normalizes text: trims, turns "N/A" and empty strings to null.
 */
export function parseString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === 'N/A' || s === 'n/a' || s === '-' || s === '--' || s === 'null') {
    return null;
  }
  return s;
}

/**
 * Maps raw status strings and issue notes into structured AdsDataStatus.
 */
export function mapStatus(rawStatusStr: string | null, issueNotesStr: string | null): { status: AdsDataStatus; rawStatus: string } {
  const rawStatus = rawStatusStr || 'Unknown';
  const lowerStatus = rawStatus.toLowerCase();
  const lowerNotes = (issueNotesStr || '').toLowerCase();

  if (lowerStatus.includes('terverifikasi') || lowerStatus.includes('verified')) {
    return { status: 'verified', rawStatus };
  }
  if (lowerStatus.includes('partial') || lowerStatus.includes('sebagian')) {
    return { status: 'partial', rawStatus };
  }
  if (
    lowerStatus.includes('pending') ||
    lowerStatus.includes('menunggu') ||
    lowerStatus.includes('belum ditarik') ||
    lowerStatus.includes('scheduled')
  ) {
    return { status: 'pending', rawStatus };
  }
  if (lowerStatus.includes('stale') || lowerStatus.includes('kadaluarsa')) {
    return { status: 'stale', rawStatus };
  }
  if (lowerStatus.includes('api error') || lowerStatus.includes('error')) {
    return { status: 'api_error', rawStatus };
  }

  // Check for authentication required in status or notes
  if (
    lowerStatus.includes('auth') ||
    lowerStatus.includes('otp') ||
    lowerNotes.includes('otp') ||
    lowerNotes.includes('login') ||
    lowerNotes.includes('logout') ||
    lowerNotes.includes('login wall') ||
    lowerNotes.includes('sesi') ||
    lowerNotes.includes('authorize')
  ) {
    return { status: 'authentication_required', rawStatus };
  }

  if (lowerStatus.includes('tidak tersedia') || lowerStatus.includes('unavailable')) {
    return { status: 'unavailable', rawStatus };
  }

  return { status: 'unknown', rawStatus };
}

/**
 * Generates a stable deterministic ID from reportDate + channel + adType.
 */
export function generateRecordId(reportDate: string, channel: string, adType: string): string {
  const sanitize = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `${sanitize(reportDate)}_${sanitize(channel)}_${sanitize(adType)}`;
}

/**
 * Parses raw CSV text into validated AdsDailyRecord array.
 * Resilient to missing columns, empty rows, and malformed fields.
 */
export function parseAdsCsv(csvContent: string): AdsDailyRecord[] {
  if (!csvContent || !csvContent.trim()) {
    return [];
  }

  const parsed = Papa.parse<string[]>(csvContent.trim(), {
    skipEmptyLines: 'greedy',
  });

  if (!parsed.data || parsed.data.length < 2) {
    return [];
  }

  const headers = parsed.data[0];
  const rows = parsed.data.slice(1);
  const mapping = buildHeaderMapping(headers);

  const records: AdsDailyRecord[] = [];

  for (const row of rows) {
    // If row is completely empty or has fewer than 2 populated cells, skip
    const populatedCells = row.filter(cell => cell && String(cell).trim().length > 0);
    if (populatedCells.length < 2) {
      continue;
    }

    const getCell = (key: keyof ColumnMapping): string | null => {
      const colIdx = mapping[key];
      if (colIdx === undefined || colIdx >= row.length) {
        return null;
      }
      return row[colIdx];
    };

    const reportDateRaw = parseString(getCell('reportDate'));
    const channelRaw = parseString(getCell('channel'));
    const adTypeRaw = parseString(getCell('adType'));

    // Skip corrupted row that has neither date nor channel
    if (!reportDateRaw && !channelRaw) {
      continue;
    }

    const reportDate = reportDateRaw || '1970-01-01';
    const channel = channelRaw || 'Unknown Channel';
    const adType = adTypeRaw || 'Unknown Ad Type';

    const rawStatusVal = parseString(getCell('status'));
    const issueNotes = parseString(getCell('issueNotes'));
    const actualSpendVal = parseNumber(getCell('actualSpend'));
    const actualRevenueVal = parseNumber(getCell('actualRevenue'));
    const targetSpendVal = parseNumber(getCell('targetSpend'));
    const targetRevenueVal = parseNumber(getCell('targetRevenue'));

    let { status, rawStatus } = mapStatus(rawStatusVal, issueNotes);
    if (status === 'unknown') {
      if (actualSpendVal !== null && actualRevenueVal !== null) {
        status = 'verified';
      } else if (actualSpendVal !== null || actualRevenueVal !== null) {
        status = 'partial';
      } else if (targetSpendVal !== null || targetRevenueVal !== null) {
        status = 'pending';
      }
    }

    const record: AdsDailyRecord = {
      id: generateRecordId(reportDate, channel, adType),
      reportDate,
      timezone: 'Asia/Jakarta',
      channel,
      adType,
      periodStart: parseString(getCell('periodStart')),
      periodEnd: parseString(getCell('periodEnd')),
      cutoff: parseString(getCell('cutoff')),
      targetSpend: targetSpendVal,
      actualSpend: actualSpendVal,
      targetRevenue: targetRevenueVal,
      actualRevenue: actualRevenueVal,
      targetOrders: parseInteger(getCell('targetOrders')),
      actualOrders: parseInteger(getCell('actualOrders')),
      sourceRoas: parseNumber(getCell('roas')),
      status,
      rawStatus,
      pic: parseString(getCell('pic')),
      issueNotes,
      metricSource: parseString(getCell('metricSource')),
      evidenceUrl: parseString(getCell('evidenceUrl')),
      pulledAt: parseString(getCell('pulledAt')),
    };

    records.push(record);
  }

  return records;
}
