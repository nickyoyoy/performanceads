import { AdsDailyRecord, KpiSummaryMetrics } from '../types/ads';

/**
 * Calculates aggregated KPI metrics from daily ads records.
 * Strictly adheres to enterprise attribution & calculation rules:
 * - Calculates ONLY from records with valid actual values.
 * - Does NOT convert nulls into 0.
 * - Blended ROAS = SUM(actualRevenue) / SUM(actualSpend), never an average of ROAS column.
 * - Spend per Paid Order = SUM(actualSpend) / SUM(actualOrders).
 * - Coverage = valid records count / total expected records count.
 */
export function calculateKpiMetrics(records: AdsDailyRecord[]): KpiSummaryMetrics {
  if (!records || records.length === 0) {
    return {
      totalSpend: null,
      totalRevenue: null,
      totalOrders: null,
      blendedRoas: null,
      spendPerOrder: null,
      dataCoverage: 0,
      validRecordsCount: 0,
      totalExpectedRecordsCount: 0,
      verifiedCount: 0,
      unavailableCount: 0,
      partialCount: 0,
      pendingCount: 0,
    };
  }

  let totalSpendSum = 0;
  let hasValidSpend = false;

  let totalRevenueSum = 0;
  let hasValidRevenue = false;

  let totalOrdersSum = 0;
  let hasValidOrders = false;

  let validRecordsCount = 0;
  let verifiedCount = 0;
  let unavailableCount = 0;
  let partialCount = 0;
  let pendingCount = 0;

  for (const record of records) {
    // Status counts
    if (record.status === 'verified') {
      verifiedCount++;
    } else if (record.status === 'unavailable' || record.status === 'authentication_required' || record.status === 'api_error') {
      unavailableCount++;
    } else if (record.status === 'partial') {
      partialCount++;
    } else if (record.status === 'pending') {
      pendingCount++;
    }

    // Check if record has valid actual metrics (not null and not undefined)
    const hasMetrics = record.actualSpend !== null || record.actualRevenue !== null || record.actualOrders !== null;
    if (hasMetrics && record.status === 'verified') {
      validRecordsCount++;
    } else if (hasMetrics && record.actualSpend !== null && record.actualSpend > 0) {
      // In case a partial record has spend
      validRecordsCount++;
    }

    if (record.actualSpend !== null && !isNaN(record.actualSpend)) {
      totalSpendSum += record.actualSpend;
      hasValidSpend = true;
    }

    if (record.actualRevenue !== null && !isNaN(record.actualRevenue)) {
      totalRevenueSum += record.actualRevenue;
      hasValidRevenue = true;
    }

    if (record.actualOrders !== null && !isNaN(record.actualOrders)) {
      totalOrdersSum += record.actualOrders;
      hasValidOrders = true;
    }
  }

  const totalExpectedRecordsCount = records.length;
  const dataCoverage = totalExpectedRecordsCount > 0 ? validRecordsCount / totalExpectedRecordsCount : 0;

  // Blended ROAS = totalRevenue / totalSpend
  let blendedRoas: number | null = null;
  if (hasValidRevenue && hasValidSpend && totalSpendSum > 0) {
    blendedRoas = totalRevenueSum / totalSpendSum;
  }

  // Spend per Paid Order = totalSpend / totalOrders
  let spendPerOrder: number | null = null;
  if (hasValidSpend && hasValidOrders && totalOrdersSum > 0) {
    spendPerOrder = totalSpendSum / totalOrdersSum;
  }

  return {
    totalSpend: hasValidSpend ? totalSpendSum : null,
    totalRevenue: hasValidRevenue ? totalRevenueSum : null,
    totalOrders: hasValidOrders ? totalOrdersSum : null,
    blendedRoas,
    spendPerOrder,
    dataCoverage,
    validRecordsCount,
    totalExpectedRecordsCount,
    verifiedCount,
    unavailableCount,
    partialCount,
    pendingCount,
  };
}

