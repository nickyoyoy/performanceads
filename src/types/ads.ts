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

export interface AdsFilters {
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

export interface DataSourceResult {
  records: AdsDailyRecord[];
  isFallback: boolean;
  lastFetchedAt: string; // ISO or formatted
  rawRowCount: number;
}

