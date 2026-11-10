import React, { useState } from 'react';
import { KpiSummaryMetrics } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
  formatPercent,
  formatRatioPercent,
} from '../utils/formatters';
import {
  HelpCircle,
  AlertCircle,
  Target,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface KpiSummaryProps {
  metrics: KpiSummaryMetrics;
}

interface KpiCardItem {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  tooltip: string;
  hasWarning?: boolean;
  targetLabel?: string;
  targetValue?: string | null;
  achievementText?: string | null;
  achievementStatus?: 'success' | 'warning' | 'info' | 'neutral';
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ metrics }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isPartial = metrics.validRecordsCount < metrics.totalExpectedRecordsCount && metrics.totalExpectedRecordsCount > 0;
  const hasTargetData = metrics.totalTargetSpend !== null || metrics.totalTargetRevenue !== null || metrics.totalTargetOrders !== null;

  // ROAS difference
  const roasDiff =
    metrics.blendedRoas !== null && metrics.targetBlendedRoas !== null
      ? metrics.blendedRoas - metrics.targetBlendedRoas
      : null;

  // Grouped logically: Row 1 = Financials (Spend, GMV, ROAS); Row 2 = Volume & Operations (Orders, CPO, Coverage)
  const cards: KpiCardItem[] = [
    {
      id: 'spend',
      label: 'Total Spend',
      value: formatCurrencyIDR(metrics.totalSpend),
      subtitle: isPartial ? 'Belanja iklan terverifikasi' : 'Total biaya iklan',
      tooltip: 'Akumulasi pengeluaran iklan aktual dari kanal dengan status terverifikasi. Tidak menghitung kanal bermasalah sebagai Rp 0.',
      hasWarning: isPartial,
      targetLabel: 'Target Budget',
      targetValue: metrics.totalTargetSpend !== null ? formatCurrencyIDR(metrics.totalTargetSpend) : null,
      achievementText:
        metrics.spendAchievementPct !== null
          ? `${formatRatioPercent(metrics.spendAchievementPct)} budget`
          : null,
      achievementStatus:
        metrics.spendAchievementPct !== null
          ? metrics.spendAchievementPct > 105
            ? 'warning'
            : metrics.spendAchievementPct >= 90
            ? 'success'
            : 'info'
          : 'neutral',
    },
    {
      id: 'gmv',
      label: 'GMV Ads',
      value: formatCurrencyIDR(metrics.totalRevenue),
      subtitle: 'Gross Merchandise Value',
      tooltip: 'Realisasi pendapatan penjualan kotor yang diatribusikan ke iklan berbayar sesuai model atribusi platform masing-masing.',
      hasWarning: isPartial,
      targetLabel: 'Target GMV',
      targetValue: metrics.totalTargetRevenue !== null ? formatCurrencyIDR(metrics.totalTargetRevenue) : null,
      achievementText:
        metrics.revenueAchievementPct !== null
          ? `${formatRatioPercent(metrics.revenueAchievementPct)} tercapai`
          : null,
      achievementStatus:
        metrics.revenueAchievementPct !== null
          ? metrics.revenueAchievementPct >= 100
            ? 'success'
            : metrics.revenueAchievementPct >= 80
            ? 'info'
            : 'warning'
          : 'neutral',
    },
    {
      id: 'roas',
      label: 'Blended ROAS',
      value: formatRoas(metrics.blendedRoas),
      subtitle: 'SUM(GMV) / SUM(Spend)',
      tooltip: 'Pengembalian riil belanja iklan terpadu (Total GMV / Total Spend). Bukan rata-rata angka ROAS masing-masing baris.',
      targetLabel: 'Target ROAS',
      targetValue: metrics.targetBlendedRoas !== null ? formatRoas(metrics.targetBlendedRoas) : null,
      achievementText:
        roasDiff !== null
          ? `${roasDiff >= 0 ? '+' : ''}${roasDiff.toFixed(2)}x vs target`
          : null,
      achievementStatus:
        roasDiff !== null
          ? roasDiff >= 0
            ? 'success'
            : roasDiff >= -1.0
            ? 'info'
            : 'warning'
          : 'neutral',
    },
    {
      id: 'orders',
      label: 'Paid Orders',
      value: formatNumber(metrics.totalOrders),
      subtitle: 'Volume pesanan berbayar',
      tooltip: 'Total volume pesanan berbayar yang dihasilkan langsung melalui kampanye iklan berbayar.',
      hasWarning: isPartial,
      targetLabel: 'Target Orders',
      targetValue: metrics.totalTargetOrders !== null ? `${formatNumber(metrics.totalTargetOrders)} order` : null,
      achievementText:
        metrics.ordersAchievementPct !== null
          ? `${formatRatioPercent(metrics.ordersAchievementPct)} tercapai`
          : null,
      achievementStatus:
        metrics.ordersAchievementPct !== null
          ? metrics.ordersAchievementPct >= 100
            ? 'success'
            : metrics.ordersAchievementPct >= 80
            ? 'info'
            : 'warning'
          : 'neutral',
    },
    {
      id: 'cpo',
      label: 'Spend per Order',
      value: formatCurrencyIDR(metrics.spendPerOrder),
      subtitle: 'Biaya akuisisi per pesanan',
      tooltip: 'Rata-rata biaya belanja iklan untuk setiap pesanan berbayar (Total Spend / Total Paid Orders).',
      targetLabel: 'Target CPO',
      targetValue: metrics.targetSpendPerOrder !== null ? formatCurrencyIDR(metrics.targetSpendPerOrder) : null,
      achievementText:
        metrics.spendPerOrder !== null && metrics.targetSpendPerOrder !== null
          ? metrics.spendPerOrder <= metrics.targetSpendPerOrder
            ? 'Efisien (di bawah target)'
            : `+${formatRatioPercent(((metrics.spendPerOrder / metrics.targetSpendPerOrder) - 1) * 100)} CPO`
          : null,
      achievementStatus:
        metrics.spendPerOrder !== null && metrics.targetSpendPerOrder !== null
          ? metrics.spendPerOrder <= metrics.targetSpendPerOrder
            ? 'success'
            : 'warning'
          : 'neutral',
    },
    {
      id: 'coverage',
      label: 'Data Coverage',
      value: formatPercent(metrics.dataCoverage),
      subtitle: `${metrics.validRecordsCount} dari ${metrics.totalExpectedRecordsCount} slot data terverifikasi`,
      tooltip: 'Rasio kelengkapan data aktual dari seluruh kanal dan tanggal penarikan yang diharapkan.',
      hasWarning: metrics.dataCoverage < 1,
      targetLabel: 'Target SLA',
      targetValue: '100% (4 Kanal)',
      achievementText: metrics.dataCoverage === 1 ? '100% lengkap' : 'Parsial',
      achievementStatus: metrics.dataCoverage === 1 ? 'success' : 'warning',
    },
  ];

  return (
    <section aria-label="Ringkasan Indikator Kinerja Utama (KPI)" className="mb-6 space-y-4">
      {/* 3-Column spacious grid (2 rows of 3) ensuring full unclipped numbers across all screen sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div
            key={card.id}
            className={`relative bg-white rounded-lg border p-4 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between overflow-hidden ${
              card.hasWarning ? 'border-amber-200/90' : 'border-slate-200'
            }`}
          >
            <div>
              {/* Header Label + Info Tooltip */}
              <div className="flex items-center justify-between gap-1 text-slate-500 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {card.label}
                </span>

                <div className="relative inline-block flex-shrink-0">
                  <button
                    type="button"
                    aria-label={`Informasi untuk ${card.label}`}
                    onClick={() =>
                      setActiveTooltip(activeTooltip === card.id ? null : card.id)
                    }
                    onMouseEnter={() => setActiveTooltip(card.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onFocus={() => setActiveTooltip(card.id)}
                    onBlur={() => setActiveTooltip(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>

                  {activeTooltip === card.id && (
                    <div
                      role="tooltip"
                      className="absolute z-30 bottom-full right-0 mb-2 w-56 p-2.5 bg-slate-900 text-white text-xs rounded-md shadow-xl leading-normal pointer-events-none"
                    >
                      {card.tooltip}
                    </div>
                  )}
                </div>
              </div>

              {/* Metric Value: Full unclipped number with optimal typography */}
              <div
                className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans tabular-nums py-0.5 select-all"
                title={card.value}
              >
                {card.value}
              </div>

              {/* Target Comparison Row */}
              {card.targetValue ? (
                <div className="mt-2.5 flex items-center justify-between gap-1.5 bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-200/70 text-xs">
                  <div className="flex items-center gap-1.5 truncate text-slate-600">
                    <Target className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="text-2xs font-medium uppercase text-slate-500">{card.targetLabel}:</span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums truncate">
                      {card.targetValue}
                    </span>
                  </div>

                  {card.achievementText && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold flex-shrink-0 border ${
                        card.achievementStatus === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : card.achievementStatus === 'warning'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {card.achievementText}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-2.5 flex items-center gap-1.5 text-2xs text-slate-400 px-1 py-1">
                  <Target className="w-3 h-3 text-slate-300" />
                  <span>Target: <em className="not-italic text-slate-500">Belum diatur</em></span>
                </div>
              )}
            </div>

            {/* Subtitle Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate pr-1" title={card.subtitle}>
                {card.subtitle}
              </span>
              {card.hasWarning && (
                <span
                  title="Data parsial: sebagian sumber data belum tersedia"
                  className="text-amber-600 flex-shrink-0"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Target Progress Tracker (Progress Pacing Bar) */}
      {hasTargetData ? (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pencapaian Target vs Realisasi (Spreadsheet DB ADS)
                </h3>
                <p className="text-2xs text-slate-500">
                  Target operasional iklan berbayar sesuai filter periode yang dipilih
                </p>
              </div>
            </div>

            {metrics.targetBlendedRoas !== null && (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto text-xs">
                <span className="text-slate-500">Target ROAS:</span>
                <span className="font-mono font-bold text-slate-900">{formatRoas(metrics.targetBlendedRoas)}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Realisasi:</span>
                <span className="font-mono font-bold text-emerald-700">{formatRoas(metrics.blendedRoas)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 1. GMV Ads Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  GMV Ads
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {metrics.revenueAchievementPct !== null ? formatRatioPercent(metrics.revenueAchievementPct) : '—'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (metrics.revenueAchievementPct || 0) >= 100 ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(metrics.revenueAchievementPct || 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-2xs text-slate-500 mt-1.5 font-mono">
                <span>Realisasi: {formatCurrencyIDR(metrics.totalRevenue)}</span>
                <span>Tgt: {formatCurrencyIDR(metrics.totalTargetRevenue)}</span>
              </div>
            </div>

            {/* 2. Spend Budget Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-600" />
                  Spend Budget
                </span>
                <span className={`font-mono font-bold ${
                  (metrics.spendAchievementPct || 0) > 105 ? 'text-amber-700' : 'text-slate-700'
                }`}>
                  {metrics.spendAchievementPct !== null ? formatRatioPercent(metrics.spendAchievementPct) : '—'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (metrics.spendAchievementPct || 0) > 105
                      ? 'bg-amber-500'
                      : (metrics.spendAchievementPct || 0) >= 90
                      ? 'bg-emerald-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(metrics.spendAchievementPct || 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-2xs text-slate-500 mt-1.5 font-mono">
                <span>Realisasi: {formatCurrencyIDR(metrics.totalSpend)}</span>
                <span>Tgt: {formatCurrencyIDR(metrics.totalTargetSpend)}</span>
              </div>
            </div>

            {/* 3. Paid Orders Progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  Paid Orders
                </span>
                <span className="font-mono font-bold text-indigo-700">
                  {metrics.ordersAchievementPct !== null ? formatRatioPercent(metrics.ordersAchievementPct) : '—'}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (metrics.ordersAchievementPct || 0) >= 100 ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(metrics.ordersAchievementPct || 0, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-2xs text-slate-500 mt-1.5 font-mono">
                <span>Realisasi: {formatNumber(metrics.totalOrders)} order</span>
                <span>Tgt: {formatNumber(metrics.totalTargetOrders)} order</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50/70 rounded-lg border border-slate-200/80 px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>
            <strong>Catatan Target:</strong> Kolom target (Target Spend, Target GMV, Target Order) belum diisi pada spreadsheet untuk periode tanggal yang dipilih. Target aktif tercatat mulai data <strong>November 2026</strong>.
          </span>
        </div>
      )}
    </section>
  );
};