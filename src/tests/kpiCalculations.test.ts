import { describe, it, expect } from 'vitest';
import { calculateKpiMetrics } from '../utils/kpiCalculations';
import { parseAdsCsv } from '../services/parser';
import { FALLBACK_CSV_DATA } from '../services/fixtureData';
import { AdsDailyRecord } from '../types/ads';

describe('KPI Calculation Rules', () => {
  it('calculates expected KPI values for ScentPlus 9 Nov 2026 dataset', () => {
    const records = parseAdsCsv(FALLBACK_CSV_DATA);
    const kpis = calculateKpiMetrics(records);

    // Expected values from prompt section 8:
    expect(kpis.totalSpend).toBe(8182656);
    expect(kpis.totalRevenue).toBe(61010394);
    expect(kpis.totalOrders).toBe(304);

    // Blended ROAS: 61010394 / 8182656 = 7.45606...
    expect(kpis.blendedRoas).toBeCloseTo(7.456, 2);

    // Spend per Paid Order: 8182656 / 304 = 26916.63... (around Rp 26.917)
    expect(kpis.spendPerOrder).toBeCloseTo(26916.63, 1);

    // Data coverage: 1 of 4 records = 25%
    expect(kpis.dataCoverage).toBe(0.25);
    expect(kpis.validRecordsCount).toBe(1);
    expect(kpis.totalExpectedRecordsCount).toBe(4);
    expect(kpis.verifiedCount).toBe(1);
    expect(kpis.unavailableCount).toBe(3);
  });

  it('calculates Blended ROAS as SUM(Rev)/SUM(Spend) and NEVER as average of ROAS column', () => {
    // Example: Two channels with different spends and revenues
    // Channel A: Spend 1.000.000, Rev 10.000.000 (ROAS 10.0)
    // Channel B: Spend 9.000.000, Rev 18.000.000 (ROAS 2.0)
    // Average of ROAS column = (10 + 2) / 2 = 6.0
    // Real Blended ROAS = (10M + 18M) / (1M + 9M) = 28M / 10M = 2.80!
    const mockRecords: AdsDailyRecord[] = [
      {
        id: '1',
        reportDate: '2026-11-09',
        timezone: 'Asia/Jakarta',
        channel: 'Shopee',
        adType: 'Search',
        periodStart: null,
        periodEnd: null,
        cutoff: null,
        targetSpend: null,
        actualSpend: 1000000,
        targetRevenue: null,
        actualRevenue: 10000000,
        targetOrders: null,
        actualOrders: 50,
        sourceRoas: 10.0,
        status: 'verified',
        rawStatus: 'Terverifikasi',
        pic: null,
        issueNotes: null,
        metricSource: null,
        evidenceUrl: null,
        pulledAt: null,
      },
      {
        id: '2',
        reportDate: '2026-11-09',
        timezone: 'Asia/Jakarta',
        channel: 'Meta',
        adType: 'CPAS',
        periodStart: null,
        periodEnd: null,
        cutoff: null,
        targetSpend: null,
        actualSpend: 9000000,
        targetRevenue: null,
        actualRevenue: 18000000,
        targetOrders: null,
        actualOrders: 100,
        sourceRoas: 2.0,
        status: 'verified',
        rawStatus: 'Terverifikasi',
        pic: null,
        issueNotes: null,
        metricSource: null,
        evidenceUrl: null,
        pulledAt: null,
      },
    ];

    const kpis = calculateKpiMetrics(mockRecords);
    expect(kpis.blendedRoas).toBe(2.8); // NOT 6.0!
  });

  it('does NOT count missing channels as zero', () => {
    const mockRecords: AdsDailyRecord[] = [
      {
        id: '1',
        reportDate: '2026-11-09',
        timezone: 'Asia/Jakarta',
        channel: 'Shopee',
        adType: 'Search',
        periodStart: null,
        periodEnd: null,
        cutoff: null,
        targetSpend: null,
        actualSpend: 5000000,
        targetRevenue: null,
        actualRevenue: 25000000,
        targetOrders: null,
        actualOrders: 100,
        sourceRoas: 5.0,
        status: 'verified',
        rawStatus: 'Terverifikasi',
        pic: null,
        issueNotes: null,
        metricSource: null,
        evidenceUrl: null,
        pulledAt: null,
      },
      {
        id: '2',
        reportDate: '2026-11-09',
        timezone: 'Asia/Jakarta',
        channel: 'TikTok',
        adType: 'Live',
        periodStart: null,
        periodEnd: null,
        cutoff: null,
        targetSpend: null,
        actualSpend: null, // Missing!
        targetRevenue: null,
        actualRevenue: null, // Missing!
        targetOrders: null,
        actualOrders: null, // Missing!
        sourceRoas: null,
        status: 'unavailable',
        rawStatus: 'Tidak tersedia',
        pic: null,
        issueNotes: null,
        metricSource: null,
        evidenceUrl: null,
        pulledAt: null,
      },
    ];

    const kpis = calculateKpiMetrics(mockRecords);
    // Spend should be strictly 5.000.000, not divided or affected by TikTok
    expect(kpis.totalSpend).toBe(5000000);
    expect(kpis.totalRevenue).toBe(25000000);
    expect(kpis.totalOrders).toBe(100);
    expect(kpis.blendedRoas).toBe(5.0);
    expect(kpis.spendPerOrder).toBe(50000);
    expect(kpis.dataCoverage).toBe(0.5); // 1 of 2
  });

  it('handles empty records array gracefully returning nulls without crashing', () => {
    const kpis = calculateKpiMetrics([]);
    expect(kpis.totalSpend).toBeNull();
    expect(kpis.totalRevenue).toBeNull();
    expect(kpis.totalOrders).toBeNull();
    expect(kpis.blendedRoas).toBeNull();
    expect(kpis.spendPerOrder).toBeNull();
    expect(kpis.dataCoverage).toBe(0);
    expect(kpis.totalTargetSpend).toBeNull();
    expect(kpis.totalTargetRevenue).toBeNull();
    expect(kpis.totalTargetOrders).toBeNull();
    expect(kpis.spendAchievementPct).toBeNull();
    expect(kpis.revenueAchievementPct).toBeNull();
  });

  it('calculates target metrics and achievement percentages correctly when target data exists', () => {
    const mockRecords: AdsDailyRecord[] = [
      {
        id: '1',
        reportDate: '2026-11-01',
        timezone: 'Asia/Jakarta',
        channel: 'Shopee',
        adType: 'Shopee Ads',
        periodStart: null,
        periodEnd: null,
        cutoff: null,
        targetSpend: 6000000,
        actualSpend: 7500000,
        targetRevenue: 60000000,
        actualRevenue: 72000000,
        targetOrders: 200,
        actualOrders: 250,
        sourceRoas: 9.6,
        status: 'verified',
        rawStatus: 'Terverifikasi',
        pic: 'Performance Ads',
        issueNotes: null,
        metricSource: null,
        evidenceUrl: null,
        pulledAt: null,
      },
      {
        id: '2',
        reportDate: '2026-11-01',
        timezone: 'Asia/Jakarta',
        channel: 'TikTok Shop',
        adType: 'GMV Max',
        periodStart: null,
        periodEnd: null,
        cutoff: null,
        targetSpend: 4000000,
        actualSpend: 2500000,
        targetRevenue: 40000000,
        actualRevenue: 28000000,
        targetOrders: 100,
        actualOrders: 80,
        sourceRoas: 11.2,
        status: 'verified',
        rawStatus: 'Terverifikasi',
        pic: 'Marketplace',
        issueNotes: null,
        metricSource: null,
        evidenceUrl: null,
        pulledAt: null,
      },
    ];

    const kpis = calculateKpiMetrics(mockRecords);

    // Targets:
    // Total Target Spend = 6M + 4M = 10M
    expect(kpis.totalTargetSpend).toBe(10000000);
    // Total Target Revenue = 60M + 40M = 100M
    expect(kpis.totalTargetRevenue).toBe(100000000);
    // Total Target Orders = 200 + 100 = 300
    expect(kpis.totalTargetOrders).toBe(300);

    // Target Blended ROAS = 100M / 10M = 10.0
    expect(kpis.targetBlendedRoas).toBe(10.0);

    // Actuals:
    // Total Actual Spend = 7.5M + 2.5M = 10M
    expect(kpis.totalSpend).toBe(10000000);
    // Total Actual Revenue = 72M + 28M = 100M
    expect(kpis.totalRevenue).toBe(100000000);
    // Total Actual Orders = 250 + 80 = 330
    expect(kpis.totalOrders).toBe(330);

    // Achievements:
    // Spend: 10M / 10M = 100%
    expect(kpis.spendAchievementPct).toBe(100);
    // Revenue: 100M / 100M = 100%
    expect(kpis.revenueAchievementPct).toBe(100);
    // Orders: 330 / 300 = 110%
    expect(kpis.ordersAchievementPct).toBeCloseTo(110, 1);
  });
});

