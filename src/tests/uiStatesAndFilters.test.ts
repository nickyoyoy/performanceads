import { describe, it, expect } from 'vitest';
import { parseAdsCsv } from '../services/parser';
import { calculateKpiMetrics } from '../utils/kpiCalculations';
import { GoogleSheetsAdsDataSource } from '../services/GoogleSheetsAdsDataSource';
import { AdsDailyRecord } from '../types/ads';

describe('UI States and Edge Cases Verification', () => {
  it('handles completely empty spreadsheet without throwing errors', () => {
    const emptyResult = parseAdsCsv('');
    expect(emptyResult).toEqual([]);

    const whitespaceResult = parseAdsCsv('   \n  \n\t  ');
    expect(whitespaceResult).toEqual([]);

    const onlyHeadersResult = parseAdsCsv('Tanggal WIB,Kanal,Jenis iklan,Realisasi Spend Rp\n');
    expect(onlyHeadersResult).toEqual([]);

    const kpis = calculateKpiMetrics(onlyHeadersResult);
    expect(kpis.totalSpend).toBeNull();
    expect(kpis.totalRevenue).toBeNull();
    expect(kpis.totalOrders).toBeNull();
    expect(kpis.blendedRoas).toBeNull();
    expect(kpis.spendPerOrder).toBeNull();
    expect(kpis.dataCoverage).toBe(0);
  });

  it('handles spreadsheet where all channels fail / authentication required (0% coverage)', () => {
    const allUnavailableCsv = `Tanggal WIB,Kanal,Jenis iklan,Realisasi Spend Rp,Realisasi GMV Ads Rp,Status data,Kendala / catatan
2026-11-09,Shopee,Ads,N/A,N/A,Tidak tersedia,API down
2026-11-09,TikTok,Product,N/A,N/A,Tidak tersedia,OTP required
2026-11-09,Meta,CPAS,N/A,N/A,Tidak tersedia,Login wall`;

    const records = parseAdsCsv(allUnavailableCsv);
    expect(records.length).toBe(3);

    const kpis = calculateKpiMetrics(records);
    expect(kpis.totalSpend).toBeNull();
    expect(kpis.totalRevenue).toBeNull();
    expect(kpis.blendedRoas).toBeNull();
    expect(kpis.dataCoverage).toBe(0);
    expect(kpis.validRecordsCount).toBe(0);
    expect(kpis.totalExpectedRecordsCount).toBe(3);
    expect(kpis.unavailableCount).toBe(3);
  });

  it('handles scenario when all channels are fully verified (100% coverage)', () => {
    const allHealthyCsv = `Tanggal WIB,Kanal,Jenis iklan,Realisasi Spend Rp,Realisasi GMV Ads Rp,Realisasi Paid Order,Status data
2026-11-09,Shopee,Shopee Ads,8000000,56000000,280,Terverifikasi
2026-11-09,TikTok Shop,TikTok Product Ads,4000000,24000000,120,Terverifikasi
2026-11-09,TikTok Shop,TikTok LIVE Ads,3000000,18000000,90,Terverifikasi
2026-11-09,Meta,Meta CPAS,5000000,30000000,150,Terverifikasi`;

    const records = parseAdsCsv(allHealthyCsv);
    expect(records.length).toBe(4);

    const kpis = calculateKpiMetrics(records);
    // Total spend = 8 + 4 + 3 + 5 = 20.000.000
    expect(kpis.totalSpend).toBe(20000000);
    // Total GMV = 56 + 24 + 18 + 30 = 128.000.000
    expect(kpis.totalRevenue).toBe(128000000);
    // Total orders = 280 + 120 + 90 + 150 = 640
    expect(kpis.totalOrders).toBe(640);
    // Blended ROAS = 128.000.000 / 20.000.000 = 6.4x
    expect(kpis.blendedRoas).toBe(6.4);
    // Spend per order = 20.000.000 / 640 = 31.250
    expect(kpis.spendPerOrder).toBe(31250);
    // Coverage = 4 / 4 = 100%
    expect(kpis.dataCoverage).toBe(1.0);
    expect(kpis.validRecordsCount).toBe(4);
    expect(kpis.verifiedCount).toBe(4);
    expect(kpis.unavailableCount).toBe(0);
  });

  it('handles 30-day multi-day dataset simulation without precision breakdown or errors', () => {
    // Generate 30 days of mock records
    const simulatedRecords: AdsDailyRecord[] = [];
    const startDate = new Date('2026-10-11');

    for (let day = 0; day < 30; day++) {
      const curDate = new Date(startDate);
      curDate.setDate(curDate.getDate() + day);
      const dateStr = curDate.toISOString().slice(0, 10);

      // Shopee: active daily
      simulatedRecords.push({
        id: `${dateStr}_shopee_ads`,
        reportDate: dateStr,
        timezone: 'Asia/Jakarta',
        channel: 'Shopee',
        adType: 'Shopee Ads',
        periodStart: `${dateStr} 00:00`,
        periodEnd: `${dateStr} 23:59`,
        cutoff: 'Full day',
        targetSpend: null,
        actualSpend: 8000000 + (day % 5) * 200000,
        targetRevenue: null,
        actualRevenue: 56000000 + (day % 5) * 1500000,
        targetOrders: null,
        actualOrders: 280 + (day % 5) * 10,
        sourceRoas: 7.0,
        status: 'verified',
        rawStatus: 'Terverifikasi',
        pic: 'Marketplace - Scentplus',
        issueNotes: null,
        metricSource: 'Shopee Open API v2',
        evidenceUrl: null,
        pulledAt: `${dateStr} 06:00`,
      });
    }

    expect(simulatedRecords.length).toBe(30);
    const kpis = calculateKpiMetrics(simulatedRecords);
    expect(kpis.validRecordsCount).toBe(30);
    expect(kpis.dataCoverage).toBe(1.0);
    expect(kpis.totalSpend).toBeGreaterThan(240000000); // > 240M
    expect(kpis.blendedRoas).toBeGreaterThan(6.0);
    expect(kpis.blendedRoas).toBeLessThan(8.0);
  });

  it('filters by channel, date, and status correctly through data source adapter', async () => {
    const dataSource = new GoogleSheetsAdsDataSource(null); // Bypass proxy to test local adapter logic

    // Filter by channel = Shopee
    const shopeeOnly = await dataSource.getDailyPerformance({ channel: 'Shopee' });
    expect(shopeeOnly.records.every(r => r.channel.toLowerCase() === 'shopee')).toBe(true);
    expect(shopeeOnly.records.length).toBe(1);

    // Filter by status = authentication_required
    const authOnly = await dataSource.getDailyPerformance({ status: 'authentication_required' });
    expect(authOnly.records.every(r => r.status === 'authentication_required')).toBe(true);
    expect(authOnly.records.length).toBe(3);

    // Filter by date range outside available date -> 0 records
    const outOfRange = await dataSource.getDailyPerformance({
      startDate: '2026-01-01',
      endDate: '2026-01-02',
    });
    expect(outOfRange.records.length).toBe(0);
  });
});

