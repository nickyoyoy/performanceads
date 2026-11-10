import { AdsDailyRecord, AdsFilters } from '../types/ads';

export interface AdsFetchResult {
  records: AdsDailyRecord[];
  allRecords: AdsDailyRecord[];
  availableDates: string[];
  isFallback: boolean;
  sourceUrl: string;
  fetchedAt: Date;
  rawCount: number;
  errorMessage?: string;
}

export interface AdsDataSource {
  getDailyPerformance(filters?: AdsFilters): Promise<AdsFetchResult>;
}
