import { AdsDailyRecord, AdsFilters } from '../types/ads';
import { AdsDataSource, AdsFetchResult } from './AdsDataSource';
import { parseAdsCsv } from './parser';
import { FALLBACK_CSV_DATA } from './fixtureData';

export const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1PXarMDXbHSFtvAy1Luv1ch_A-vEZ0XngCHJ4cO0rzWk/export?format=csv&gid=0';

export class GoogleSheetsAdsDataSource implements AdsDataSource {
  private customProxyUrl: string | null;

  constructor(customProxyUrl: string | null = '/api/sheets-csv') {
    this.customProxyUrl = customProxyUrl;
  }

  /**
   * Fetches CSV from Google Sheets via Vite dev proxy or direct URL.
   * Falls back to local fixture if offline or fetch fails, explicitly setting isFallback.
   */
  async getDailyPerformance(filters?: AdsFilters): Promise<AdsFetchResult> {
    let csvData: string | null = null;
    let isFallback = false;
    let usedUrl = '';
    let errorMessage: string | undefined;

    // 1. Attempt dev proxy if configured
    if (this.customProxyUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(this.customProxyUrl, {
          signal: controller.signal,
          headers: { Accept: 'text/csv, text/plain, */*' },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text && text.includes('Tanggal WIB')) {
            csvData = text;
            usedUrl = this.customProxyUrl;
          }
        }
      } catch (err: unknown) {
        // Proxy attempt failed, will try direct next
        console.warn('Vite proxy fetch failed or not active, falling back to direct URL or fixture:', err);
      }
    }

    // 2. If proxy didn't work, attempt direct fetch from Google Sheets
    if (!csvData) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(GOOGLE_SHEET_CSV_URL, {
          signal: controller.signal,
          headers: { Accept: 'text/csv, text/plain, */*' },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const text = await res.text();
          if (text && text.includes('Tanggal WIB')) {
            csvData = text;
            usedUrl = GOOGLE_SHEET_CSV_URL;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network fetch failed';
        errorMessage = `Fetch error (${msg}). Menggunakan data fixture lokal development.`;
        console.warn(errorMessage);
      }
    }

    // 3. Fallback to local development fixture if all network attempts fail
    if (!csvData) {
      csvData = FALLBACK_CSV_DATA;
      isFallback = true;
      usedUrl = 'local://fixtureData.ts';
    }

    // 4. Parse CSV records
    const allRecords = parseAdsCsv(csvData);

    // 5. Apply filters
    const filteredRecords = this.applyFilters(allRecords, filters);

    return {
      records: filteredRecords,
      isFallback,
      sourceUrl: usedUrl,
      fetchedAt: new Date(),
      rawCount: allRecords.length,
      errorMessage,
    };
  }

  private applyFilters(records: AdsDailyRecord[], filters?: AdsFilters): AdsDailyRecord[] {
    if (!filters) return records;

    return records.filter(record => {
      // Date filter
      if (filters.startDate && record.reportDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && record.reportDate > filters.endDate) {
        return false;
      }

      // Channel filter
      if (filters.channel && filters.channel !== 'all' && record.channel.toLowerCase() !== filters.channel.toLowerCase()) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && record.status !== filters.status) {
        return false;
      }

      return true;
    });
  }
}

