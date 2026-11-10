export type AdsDataStatus =
  | "verified"
  | "partial"
  | "pending"
  | "unavailable"
  | "authentication_required"
  | "api_error"
  | "stale"
  | "unknown";

export interface AdsDailyRecord {
  id: string;
  reportDate: string;
  timezone: "Asia/Jakarta";
  channel: string;
  adType: string;

  periodStart: string | null;
  periodEnd: string | null;
  cutoff: string | null;

  targetSpend: number | null;
  actualSpend: number | null;

  targetRevenue: number | null;
  actualRevenue: number | null;

  targetOrders: number | null;
  actualOrders: number | null;

  sourceRoas: number | null;

  status: AdsDataStatus;
  rawStatus: string;

  pic: string | null;
  issueNotes: string | null;
  metricSource: string | null;
  evidenceUrl: string | null;
  pulledAt: string | null;
}

export type DatePreset = '30d' | 'all' | '7d' | 'mtd' | 'prev_month' | '2026-11-09' | '2026-11-10' | 'custom';

export interface AdsFilters {
  datePreset?: DatePreset;
  startDate?: string;
  endDate?: string;
  channel?: string;
  status?: string;
}

export interface KpiSummaryMetrics {
  totalSpend: number | null;
  totalRevenue: number | null;
  totalOrders: number | null;
  blendedRoas: number | null;
  spendPerOrder: number | null;
  dataCoverage: number; // 0 to 1
  validRecordsCount: number;
  totalExpectedRecordsCount: number;
  verifiedCount: number;
  unavailableCount: number;
  partialCount: number;
  pendingCount: number;
}

export interface ChannelAggregatedSummary {
  channel: string;
  adType: string;
  totalSpend: number | null;
  totalRevenue: number | null;
  totalOrders: number | null;
  blendedRoas: number | null;
  spendShare: number;
  revenueShare: number;
  totalDays: number;
  verifiedDays: number;
  partialDays: number;
  issueDays: number;
  pic: string | null;
  latestStatus: AdsDataStatus;
  latestPull: string | null;
  latestNotes: string | null;
}

export interface DataSourceResult {
  records: AdsDailyRecord[];
  allRecords: AdsDailyRecord[];
  availableDates: string[];
  isFallback: boolean;
  lastFetchedAt: string;
  rawRowCount: number;
}
