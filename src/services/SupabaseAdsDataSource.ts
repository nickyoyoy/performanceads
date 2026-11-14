import { AdsDailyRecord, AdsFilters } from '../types/ads';
import { AdsDataSource, AdsFetchResult } from './AdsDataSource';
import { supabase } from './supabaseClient';
import {
  parseNumber,
  parseInteger,
  parseString,
  mapStatus,
  generateRecordId,
  parseAdsCsv,
} from './parser';
import { FALLBACK_CSV_DATA } from './fixtureData';

const DEFAULT_TABLE =
  import.meta.env.VITE_SUPABASE_TABLE || 'db_ads';

function getField(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null) {
      return row[alias];
    }
    const lowerAlias = alias.toLowerCase().replace(/[\s_\-]+/g, '');
    for (const key of Object.keys(row)) {
      const lowerKey = key.toLowerCase().replace(/[\s_\-]+/g, '');
      if (lowerKey === lowerAlias) {
        if (row[key] !== undefined && row[key] !== null) {
          return row[key];
        }
      }
    }
  }
  return undefined;
}

function normalizeDate(val: unknown): string {
  if (!val) return '1970-01-01';
  const str = String(val).trim();
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // If ISO datetime e.g. 2026-11-10T00:00:00.000Z
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str.slice(0, 10);
  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  return str;
}

export class SupabaseAdsDataSource implements AdsDataSource {
  private tableName: string;

  constructor(tableName: string = DEFAULT_TABLE) {
    this.tableName = tableName;
  }

  async getDailyPerformance(filters?: AdsFilters): Promise<AdsFetchResult> {
    let allRecords: AdsDailyRecord[] = [];
    let isFallback = false;
    let errorMessage: string | undefined;
    const usedUrl = `supabase://${this.tableName}`;

    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .limit(5000);

      if (error) {
        throw new Error(
          `${error.message}${error.hint ? ` (${error.hint})` : ''}`
        );
      }

      if (!data || data.length === 0) {
        throw new Error(`Tabel "${this.tableName}" di Supabase masih kosong.`);
      }

      // Map rows from Supabase to AdsDailyRecord
      allRecords = data.map((row: Record<string, unknown>) => {
        const reportDateRaw = getField(row, [
          'Tanggal WIB',
          'tanggal_wib',
          'tanggal',
          'report_date',
          'date',
        ]);
        const reportDate = normalizeDate(reportDateRaw);

        const channel =
          parseString(
            getField(row, ['Kanal', 'kanal', 'channel', 'platform'])
          ) || 'Unknown Channel';

        const adType =
          parseString(
            getField(row, [
              'Jenis iklan',
              'jenis_iklan',
              'ad_type',
              'campaign_type',
            ])
          ) || 'Unknown Ad Type';

        const periodStart = parseString(
          getField(row, [
            'Periode awal WIB',
            'periode_awal_wib',
            'period_start',
            'periode_awal',
          ])
        );

        const periodEnd = parseString(
          getField(row, [
            'Periode akhir WIB',
            'periode_akhir_wib',
            'period_end',
            'periode_akhir',
          ])
        );

        const cutoff = parseString(
          getField(row, ['Cutoff WIB', 'cutoff_wib', 'cutoff'])
        );

        const targetSpend = parseNumber(
          getField(row, [
            'Target Spend Rp',
            'target_spend_rp',
            'target_spend',
            'budget',
          ])
        );

        const actualSpend = parseNumber(
          getField(row, [
            'Realisasi Spend Rp',
            'realisasi_spend_rp',
            'actual_spend',
            'spend',
          ])
        );

        const targetRevenue = parseNumber(
          getField(row, [
            'Target GMV Ads Rp',
            'target_gmv_ads_rp',
            'target_gmv',
            'target_revenue',
          ])
        );

        const actualRevenue = parseNumber(
          getField(row, [
            'Realisasi GMV Ads Rp',
            'realisasi_gmv_ads_rp',
            'actual_revenue',
            'realisasi_gmv',
            'gmv',
            'revenue',
          ])
        );

        const targetOrders = parseInteger(
          getField(row, [
            'Target Paid Order',
            'target_paid_order',
            'target_orders',
          ])
        );

        const actualOrders = parseInteger(
          getField(row, [
            'Realisasi Paid Order',
            'realisasi_paid_order',
            'actual_orders',
            'orders',
          ])
        );

        const sourceRoas = parseNumber(
          getField(row, ['ROAS', 'roas', 'source_roas'])
        );

        const rawStatusVal = parseString(
          getField(row, ['Status data', 'status_data', 'status'])
        );

        const issueNotes = parseString(
          getField(row, [
            'Kendala / catatan',
            'kendala_catatan',
            'kendala',
            'catatan',
            'issue_notes',
            'notes',
          ])
        );

        let { status, rawStatus } = mapStatus(rawStatusVal, issueNotes);
        if (status === 'unknown') {
          if (actualSpend !== null && actualRevenue !== null) {
            status = 'verified';
          } else if (actualSpend !== null || actualRevenue !== null) {
            status = 'partial';
          } else if (targetSpend !== null || targetRevenue !== null) {
            status = 'pending';
          }
        }

        const pic = parseString(getField(row, ['PIC', 'pic', 'owner']));
        const metricSource = parseString(
          getField(row, ['Sumber metrik', 'sumber_metrik', 'metric_source'])
        );
        const evidenceUrl = parseString(
          getField(row, ['Link bukti', 'link_bukti', 'evidence_url'])
        );
        const pulledAt = parseString(
          getField(row, [
            'Waktu tarik WIB',
            'waktu_tarik_wib',
            'pulled_at',
            'waktu_tarik',
          ])
        );

        return {
          id: generateRecordId(reportDate, channel, adType),
          reportDate,
          timezone: 'Asia/Jakarta' as const,
          channel,
          adType,
          periodStart,
          periodEnd,
          cutoff,
          targetSpend,
          actualSpend,
          targetRevenue,
          actualRevenue,
          targetOrders,
          actualOrders,
          sourceRoas,
          status,
          rawStatus,
          pic,
          issueNotes,
          metricSource,
          evidenceUrl,
          pulledAt,
        };
      });

      // Sort by reportDate ascending
      allRecords.sort((a, b) => a.reportDate.localeCompare(b.reportDate));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi Supabase';
      errorMessage = `Supabase error (${msg}). Menggunakan data fallback lokal.`;
      console.warn(errorMessage);

      allRecords = parseAdsCsv(FALLBACK_CSV_DATA);
      isFallback = true;
    }

    // Extract sorted unique dates from allRecords
    const dateSet = new Set<string>();
    allRecords.forEach((r) => {
      if (r.reportDate && /^\d{4}-\d{2}-\d{2}$/.test(r.reportDate)) {
        dateSet.add(r.reportDate);
      }
    });
    const availableDates = Array.from(dateSet).sort((a, b) =>
      a.localeCompare(b)
    );

    // Apply filters
    const filteredRecords = this.applyFilters(
      allRecords,
      availableDates,
      filters
    );

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

    if (filters.datePreset) {
      if (filters.datePreset === 'all') {
        targetStartDate = undefined;
        targetEndDate = undefined;
      } else if (filters.datePreset === '30d') {
        if (availableDates.length > 0) {
          const slice30 = availableDates.slice(-30);
          targetStartDate = slice30[0];
          targetEndDate = slice30[slice30.length - 1];
        }
      } else if (filters.datePreset === '7d') {
        if (availableDates.length > 0) {
          const slice7 = availableDates.slice(-7);
          targetStartDate = slice7[0];
          targetEndDate = slice7[slice7.length - 1];
        }
      } else if (filters.datePreset === 'mtd') {
        targetStartDate = '2026-11-01';
        targetEndDate = '2026-11-30';
      } else if (filters.datePreset === 'prev_month') {
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

    return allRecords.filter((record) => {
      if (targetStartDate && record.reportDate < targetStartDate) {
        return false;
      }
      if (targetEndDate && record.reportDate > targetEndDate) {
        return false;
      }
      if (
        filters.channel &&
        filters.channel !== 'all' &&
        record.channel.toLowerCase() !== filters.channel.toLowerCase()
      ) {
        return false;
      }
      if (
        filters.status &&
        filters.status !== 'all' &&
        record.status !== filters.status
      ) {
        return false;
      }

      return true;
    });
  }
}

