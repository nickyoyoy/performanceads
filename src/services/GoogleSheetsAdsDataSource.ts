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
   * Uses strict cache-busting timestamps to always retrieve live data.
   */
  async getDailyPerformance(filters?: AdsFilters): Promise<AdsFetchResult> {
    let csvData: string | null = null;
    let isFallback = false;
    let usedUrl = '';
    let errorMessage: string | undefined;

    const cacheBuster = `_t=${Date.now()}`;

    // 1. Attempt dev proxy if configured
    if (this.customProxyUrl) {
      try {
        const proxyUrlWithParam = this.customProxyUrl.includes('?')
          ? `${this.customProxyUrl}&${cacheBuster}`
          : `${this.customProxyUrl}?${cacheBuster}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(proxyUrlWithParam, {
          signal: controller.signal,
          headers: {
            Accept: 'text/csv, text/plain, */*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
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
        console.warn('Vite proxy fetch failed or not active, trying direct URL:', err);
      }
    }

    // 2. If proxy didn't work, attempt direct fetch from Google Sheets
    if (!csvData) {
      try {
        const directUrlWithParam = `${GOOGLE_SHEET_CSV_URL}&${cacheBuster}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);
        const res = await fetch(directUrlWithParam, {
          signal: controller.signal,
          headers: {
            Accept: 'text/csv, text/plain, */*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
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

    // Extract sorted unique dates from allRecords
    const dateSet = new Set<string>();
    allRecords.forEach(r => {
      if (r.reportDate && /^\d{4}-\d{2}-\d{2}$/.test(r.reportDate)) {
        dateSet.add(r.reportDate);
      }
    });
    const availableDates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

    // 5. Apply filters
    const filteredRecords = this.applyFilters(allRecords, availableDates, filters);

    return {
      records: filteredRecords,
      allRecords,
      availableDates,
      isFallback,
      sourceUrl: usedUrl,
      fetchedAt: new Date(),
      rawCount: allRecords.length,
      errorMessage,
    };
  }

  private applyFilters(
    allRecords: AdsDailyRecord[],
    availableDates: string[],
    filters?: AdsFilters
  ): AdsDailyRecord[] {
    if (!filters) return allRecords;

    let targetStartDate = filters.startDate;
    let targetEndDate = filters.endDate;

    // Resolve date presets if specified
    if (filters.datePreset) {
      if (filters.datePreset === 'all') {
        targetStartDate = undefined;
        targetEndDate = undefined;
      } else if (filters.datePreset === '30d') {
        // Last 30 dates in availableDates
        if (availableDates.length > 0) {
          const slice30 = availableDates.slice(-30);
          targetStartDate = slice30[0];
          targetEndDate = slice30[slice30.length - 1];
        }
      } else if (filters.datePreset === '7d') {
        // Last 7 dates
        if (availableDates.length > 0) {
          const slice7 = availableDates.slice(-7);
          targetStartDate = slice7[0];
          targetEndDate = slice7[slice7.length - 1];
        }
      } else if (filters.datePreset === 'mtd') {
        // Current month (November 2026)
        targetStartDate = '2026-11-01';
        targetEndDate = '2026-11-30';
      } else if (filters.datePreset === 'prev_month') {
        // Previous month (October 2026)
        targetStartDate = '2026-10-01';
        targetEndDate = '2026-10-31';
      } else if (filters.datePreset === '2026-11-09') {
        targetStartDate = '2026-11-09';
        targetEndDate = '2026-11-09';
      } else if (filters.datePreset === '2026-11-10') {
        targetStartDate = '2026-11-10';
        targetEndDate = '2026-11-10';
      }
    }

    return allRecords.filter(record => {
      // Date filtering
      if (targetStartDate && record.reportDate < targetStartDate) {
        return false;
      }
      if (targetEndDate && record.reportDate > targetEndDate) {
        return false;
      }

      // Channel filtering
      if (
        filters.channel &&
        filters.channel !== 'all' &&
        record.channel.toLowerCase() !== filters.channel.toLowerCase()
      ) {
        return false;
      }

      // Status filtering
      if (filters.status && filters.status !== 'all' && record.status !== filters.status) {
        return false;
      }

      return true;
    });
  }
}
