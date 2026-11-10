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
      totalTargetSpend: null,
      totalTargetRevenue: null,
      totalTargetOrders: null,
      targetBlendedRoas: null,
      targetSpendPerOrder: null,
      spendAchievementPct: null,
      revenueAchievementPct: null,
      ordersAchievementPct: null,
    };
  }

  let totalSpendSum = 0;
  let hasValidSpend = false;

  let totalRevenueSum = 0;
  let hasValidRevenue = false;

  let totalOrdersSum = 0;
  let hasValidOrders = false;

  // Target accumulators
  let totalTargetSpendSum = 0;
  let hasValidTargetSpend = false;

  let totalTargetRevenueSum = 0;
  let hasValidTargetRevenue = false;

  let totalTargetOrdersSum = 0;
  let hasValidTargetOrders = false;

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

    // Actual Spend
    if (record.actualSpend !== null && !isNaN(record.actualSpend)) {
      totalSpendSum += record.actualSpend;
      hasValidSpend = true;
    }

    // Actual Revenue
    if (record.actualRevenue !== null && !isNaN(record.actualRevenue)) {
      totalRevenueSum += record.actualRevenue;
      hasValidRevenue = true;
    }

    // Actual Orders
    if (record.actualOrders !== null && !isNaN(record.actualOrders)) {
      totalOrdersSum += record.actualOrders;
      hasValidOrders = true;
    }

    // Target Spend
    if (record.targetSpend !== null && !isNaN(record.targetSpend)) {
      totalTargetSpendSum += record.targetSpend;
      hasValidTargetSpend = true;
    }

    // Target Revenue
    if (record.targetRevenue !== null && !isNaN(record.targetRevenue)) {
      totalTargetRevenueSum += record.targetRevenue;
      hasValidTargetRevenue = true;
    }

    // Target Orders
    if (record.targetOrders !== null && !isNaN(record.targetOrders)) {
      totalTargetOrdersSum += record.targetOrders;
      hasValidTargetOrders = true;
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

  // Target Blended ROAS = totalTargetRevenue / totalTargetSpend
  let targetBlendedRoas: number | null = null;
  if (hasValidTargetRevenue && hasValidTargetSpend && totalTargetSpendSum > 0) {
    targetBlendedRoas = totalTargetRevenueSum / totalTargetSpendSum;
  }

  // Target Spend per Order = totalTargetSpend / totalTargetOrders
  let targetSpendPerOrder: number | null = null;
  if (hasValidTargetSpend && hasValidTargetOrders && totalTargetOrdersSum > 0) {
    targetSpendPerOrder = totalTargetSpendSum / totalTargetOrdersSum;
  }

  // Achievement Percentages (% Realisasi vs Target)
  const spendAchievementPct =
    hasValidSpend && hasValidTargetSpend && totalTargetSpendSum > 0
      ? (totalSpendSum / totalTargetSpendSum) * 100
      : null;

  const revenueAchievementPct =
    hasValidRevenue && hasValidTargetRevenue && totalTargetRevenueSum > 0
      ? (totalRevenueSum / totalTargetRevenueSum) * 100
      : null;

  const ordersAchievementPct =
    hasValidOrders && hasValidTargetOrders && totalTargetOrdersSum > 0
      ? (totalOrdersSum / totalTargetOrdersSum) * 100
      : null;

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
    totalTargetSpend: hasValidTargetSpend ? totalTargetSpendSum : null,
    totalTargetRevenue: hasValidTargetRevenue ? totalTargetRevenueSum : null,
    totalTargetOrders: hasValidTargetOrders ? totalTargetOrdersSum : null,
    targetBlendedRoas,
    targetSpendPerOrder,
    spendAchievementPct,
    revenueAchievementPct,
    ordersAchievementPct,
  };
}

