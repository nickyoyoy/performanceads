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
  Wallet,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Coins,
  Radio,
} from 'lucide-react';

interface KpiSummaryProps {
  metrics: KpiSummaryMetrics;
  periodLabel?: string;
}

interface KpiCardItem {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  tooltip: string;
  icon: React.ReactNode;
  hasWarning?: boolean;
  targetLabel?: string;
  targetValue?: string | null;
  achievementText?: string | null;
  achievementTooltip?: string | null;
  achievementStatus?: 'success' | 'warning' | 'info' | 'neutral';
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ metrics, periodLabel }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isPartial =
    metrics.validRecordsCount < metrics.totalExpectedRecordsCount &&
    metrics.totalExpectedRecordsCount > 0;
  const hasTargetData =
    metrics.totalTargetSpend !== null ||
    metrics.totalTargetRevenue !== null ||
    metrics.totalTargetOrders !== null;

  // ROAS difference
  const roasDiff =
    metrics.blendedRoas !== null && metrics.targetBlendedRoas !== null
      ? metrics.blendedRoas - metrics.targetBlendedRoas
      : null;

  // All 6 existing KPI cards preserved 100%
  const cards: KpiCardItem[] = [
    {
      id: 'spend',
      label: 'Total Spend',
      value: formatCurrencyIDR(metrics.totalSpend),
      subtitle: isPartial ? 'Belanja iklan terverifikasi' : 'Total biaya iklan',
      tooltip:
        'Akumulasi pengeluaran iklan aktual dari kanal dengan status terverifikasi. Tidak menghitung kanal bermasalah sebagai Rp 0.',
      icon: <Wallet className="w-3.5 h-3.5" />,
      hasWarning: isPartial,
      targetLabel: 'Target Budget',
      targetValue:
        metrics.totalTargetSpend !== null
          ? formatCurrencyIDR(metrics.totalTargetSpend)
          : null,
      achievementText:
        metrics.spendAchievementPct !== null
          ? formatRatioPercent(metrics.spendAchievementPct)
          : null,
      achievementTooltip:
        metrics.spendAchievementPct !== null
          ? `${formatRatioPercent(metrics.spendAchievementPct)} dari target budget`
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
      tooltip:
        'Realisasi pendapatan penjualan kotor yang diatribusikan ke iklan berbayar sesuai model atribusi platform masing-masing.',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      hasWarning: isPartial,
      targetLabel: 'Target GMV',
      targetValue:
        metrics.totalTargetRevenue !== null
          ? formatCurrencyIDR(metrics.totalTargetRevenue)
          : null,
      achievementText:
        metrics.revenueAchievementPct !== null
          ? formatRatioPercent(metrics.revenueAchievementPct)
          : null,
      achievementTooltip:
        metrics.revenueAchievementPct !== null
          ? `${formatRatioPercent(metrics.revenueAchievementPct)} dari target GMV tercapai`
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
      tooltip:
        'Pengembalian riil belanja iklan terpadu (Total GMV / Total Spend). Bukan rata-rata angka ROAS masing-masing baris.',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      targetLabel: 'Target ROAS',
      targetValue:
        metrics.targetBlendedRoas !== null
          ? formatRoas(metrics.targetBlendedRoas)
          : null,
      achievementText:
        roasDiff !== null
          ? `${roasDiff >= 0 ? '+' : ''}${roasDiff.toFixed(2)}x`
          : null,
      achievementTooltip:
        roasDiff !== null
          ? `${roasDiff >= 0 ? '+' : ''}${roasDiff.toFixed(2)}x vs target ROAS`
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
      tooltip:
        'Total volume pesanan berbayar yang dihasilkan langsung melalui kampanye iklan berbayar.',
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
      hasWarning: isPartial,
      targetLabel: 'Target Orders',
      targetValue:
        metrics.totalTargetOrders !== null
          ? `${formatNumber(metrics.totalTargetOrders)} order`
          : null,
      achievementText:
        metrics.ordersAchievementPct !== null
          ? formatRatioPercent(metrics.ordersAchievementPct)
          : null,
      achievementTooltip:
        metrics.ordersAchievementPct !== null
          ? `${formatRatioPercent(metrics.ordersAchievementPct)} dari target orders tercapai`
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
      tooltip:
        'Rata-rata biaya belanja iklan untuk setiap pesanan berbayar (Total Spend / Total Paid Orders).',
      icon: <Coins className="w-3.5 h-3.5" />,
      targetLabel: 'Target CPO',
      targetValue:
        metrics.targetSpendPerOrder !== null
          ? formatCurrencyIDR(metrics.targetSpendPerOrder)
          : null,
      achievementText:
        metrics.spendPerOrder !== null && metrics.targetSpendPerOrder !== null
          ? metrics.spendPerOrder <= metrics.targetSpendPerOrder
            ? 'Efisien'
            : `+${formatRatioPercent(
                (metrics.spendPerOrder / metrics.targetSpendPerOrder - 1) * 100
              )}`
          : null,
      achievementTooltip:
        metrics.spendPerOrder !== null && metrics.targetSpendPerOrder !== null
          ? metrics.spendPerOrder <= metrics.targetSpendPerOrder
            ? 'Biaya akuisisi lebih efisien dari target CPO'
            : `Biaya akuisisi +${formatRatioPercent(
                (metrics.spendPerOrder / metrics.targetSpendPerOrder - 1) * 100
              )} di atas target CPO`
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
      tooltip:
        'Rasio kelengkapan data aktual dari seluruh kanal dan tanggal penarikan yang diharapkan.',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      hasWarning: metrics.dataCoverage < 1,
      targetLabel: 'Target SLA',
      targetValue: '100% (4 Kanal)',
      achievementText: metrics.dataCoverage === 1 ? '100%' : 'Parsial',
      achievementTooltip:
        metrics.dataCoverage === 1
          ? '100% data lengkap dan terverifikasi'
          : 'Sebagian data kanal belum terverifikasi',
      achievementStatus: metrics.dataCoverage === 1 ? 'success' : 'warning',
    },
  ];

  return (
    <section
      aria-label="Ringkasan Indikator Kinerja Utama (KPI)"
      className="space-y-4"
    >
      {/* Top Executive Hero Banner (COINEST Dark Forest Green Card Style) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#133326] text-white p-4 sm:p-5 shadow-card border border-[#1E4A38]">
        {/* Decorative Botanical Clover Pattern */}
        <div className="pointer-events-none select-none absolute -right-8 -top-8 w-44 h-44 rounded-full bg-[#1E4A38]/40 blur-2xl" />
        <div className="pointer-events-none select-none absolute right-24 -bottom-10 w-36 h-36 rounded-full bg-[#A7E97F]/10 blur-xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Brand Card Identity & Total GMV Realization */}
          <div className="space-y-2 sm:space-y-2.5">
            <div className="flex items-center gap-2">
              {/* Clover emblem */}
              <div className="w-7 h-7 rounded-lg bg-[#A7E97F]/20 border border-[#A7E97F]/40 flex items-center justify-center text-[#A7E97F] shrink-0">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-[#A7E97F]">
                  ScentPlus Executive Ads Card
                </span>
                {periodLabel && (
                  <p className="text-3xs text-emerald-100/75">{periodLabel}</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-2xs text-emerald-100/75 font-medium">
                Total Realisasi GMV Ads Terverifikasi
              </p>
              <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                <span className="text-xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-white">
                  {formatCurrencyIDR(metrics.totalRevenue)}
                </span>
                {metrics.revenueAchievementPct !== null && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-[#A7E97F] text-[#133326]">
                    {formatRatioPercent(metrics.revenueAchievementPct)} dari Target GMV
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Key Balance Metrics in a Balanced 2x2 Grid (Zero Overflow, Perfect Symmetry) */}
          <div className="grid grid-cols-2 gap-2.5 w-full lg:w-[410px] xl:w-[450px] shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-white/10">
            <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10 flex flex-col justify-between">
              <span className="text-3xs font-semibold uppercase tracking-wider text-emerald-100/70 block whitespace-nowrap">
                Total Spend
              </span>
              <span className="text-sm sm:text-base font-extrabold text-white tabular-nums mt-0.5 block whitespace-nowrap">
                {formatCurrencyIDR(metrics.totalSpend)}
              </span>
            </div>

            <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10 flex flex-col justify-between">
              <span className="text-3xs font-semibold uppercase tracking-wider text-emerald-100/70 block whitespace-nowrap">
                Blended ROAS
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold text-[#A7E97F] tabular-nums whitespace-nowrap">
                  {formatRoas(metrics.blendedRoas)}
                </span>
                {metrics.targetBlendedRoas !== null && (
                  <span className="text-3xs text-emerald-100/60 font-mono whitespace-nowrap">
                    / Tgt {formatRoas(metrics.targetBlendedRoas)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10 flex flex-col justify-between">
              <span className="text-3xs font-semibold uppercase tracking-wider text-emerald-100/70 block whitespace-nowrap">
                Paid Orders
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold text-white tabular-nums whitespace-nowrap">
                  {formatNumber(metrics.totalOrders)}
                </span>
                <span className="text-3xs text-emerald-100/60 font-medium whitespace-nowrap">
                  pesanan
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl px-3.5 py-2.5 border border-white/10 flex flex-col justify-between">
              <span className="text-3xs font-semibold uppercase tracking-wider text-emerald-100/70 block whitespace-nowrap">
                Data Coverage
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold text-[#A7E97F] tabular-nums whitespace-nowrap">
                  {formatPercent(metrics.dataCoverage)}
                </span>
                <span className="text-3xs text-emerald-100/75 font-mono whitespace-nowrap">
                  ({metrics.validRecordsCount}/{metrics.totalExpectedRecordsCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Column Compact Grid (Option 1: 1 horizontal row on desktop xl) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2.5 2xl:gap-3">
        {cards.map((card) => {
          const isTooltipOpen =
            activeTooltip === card.id || activeTooltip === `${card.id}-warn`;
          return (
            <div
              key={card.id}
              className={`relative bg-white rounded-xl border p-2.5 2xl:p-3 shadow-card transition-all hover:shadow-card-hover flex flex-col justify-between overflow-visible min-h-[88px] sm:min-h-[92px] ${
                isTooltipOpen ? 'z-30' : 'z-10'
              } ${card.hasWarning ? 'border-amber-200/90' : 'border-[#E2EBE0]'}`}
            >
              <div>
                {/* Header: Icon + Title + Tooltips */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-[#EAF2E8] text-[#133326] flex items-center justify-center shrink-0">
                      {card.icon}
                    </div>
                    <span
                      className="text-2xs font-bold text-slate-700 truncate"
                      title={card.label}
                    >
                      {card.label}
                    </span>

                    {card.hasWarning && (
                      <div className="relative inline-block shrink-0">
                        <button
                          type="button"
                          aria-label={`Peringatan data parsial untuk ${card.label}`}
                          onMouseEnter={() => setActiveTooltip(`${card.id}-warn`)}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() =>
                            setActiveTooltip(
                              activeTooltip === `${card.id}-warn` ? null : `${card.id}-warn`
                            )
                          }
                          className="p-0.5 rounded text-amber-500 hover:text-amber-600 hover:bg-amber-50 focus:outline-none transition-colors"
                        >
                          <AlertCircle className="w-3 h-3" />
                        </button>
                        {activeTooltip === `${card.id}-warn` && (
                          <div
                            role="tooltip"
                            className="absolute z-50 bottom-full left-0 mb-1.5 w-56 p-2.5 bg-[#133326] text-white text-xs rounded-xl shadow-2xl border border-amber-400/40 leading-relaxed pointer-events-none"
                          >
                            <div className="text-2xs font-extrabold uppercase tracking-wider text-amber-300 mb-0.5">
                              Data Parsial
                            </div>
                            <div className="text-emerald-50/95 font-normal text-3xs">
                              Sebagian kanal belum terverifikasi pada periode ini. Angka hanya menjumlahkan kanal dengan data valid.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative inline-block shrink-0">
                    <button
                      type="button"
                      aria-label={`Informasi untuk ${card.label}`}
                      onClick={() =>
                        setActiveTooltip(activeTooltip === card.id ? null : card.id)
                      }
                      onMouseEnter={() => setActiveTooltip(card.id)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      className="p-0.5 rounded text-slate-400 hover:text-[#133326] hover:bg-[#EAF2E8] focus:outline-none transition-colors"
                    >
                      <HelpCircle className="w-3 h-3" />
                    </button>

                    {activeTooltip === card.id && (
                      <div
                        role="tooltip"
                        className="absolute z-50 top-full right-0 mt-1.5 w-60 p-3 bg-[#133326] text-white text-xs rounded-xl shadow-2xl border border-[#2C5E4A] leading-relaxed pointer-events-none"
                      >
                        <div className="text-2xs font-extrabold uppercase tracking-wider text-[#A7E97F] mb-1">
                          {card.label}
                        </div>
                        <div className="text-emerald-50/95 font-normal text-3xs mb-1.5">
                          {card.tooltip}
                        </div>
                        {card.subtitle && (
                          <div className="pt-1.5 border-t border-[#1E4A38] text-3xs text-emerald-200/75 font-mono">
                            {card.subtitle}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metric Value & Performance Badge */}
                <div className="flex items-baseline justify-between gap-1 my-0.5">
                  <div
                    className="text-sm sm:text-[15px] xl:text-[14px] 2xl:text-base font-black text-[#133326] tracking-tight font-sans tabular-nums select-all truncate"
                    title={`${card.label}: ${card.value}`}
                  >
                    {card.value}
                  </div>

                  {card.achievementText && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs font-extrabold shrink-0 whitespace-nowrap ${
                        card.achievementStatus === 'success'
                          ? 'bg-[#D7F7C4] text-[#133326]'
                          : card.achievementStatus === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#EAF2E8] text-[#1E4A38]'
                      }`}
                      title={card.achievementTooltip || card.achievementText}
                    >
                      {card.achievementText}
                    </span>
                  )}
                </div>
              </div>

              {/* Inline Target Subline (High-density, replaces bulky grey box) */}
              <div className="pt-1 mt-1 border-t border-[#ECF2EB] flex items-center justify-between text-3xs font-mono text-slate-500">
                <div className="flex items-center gap-1 min-w-0 text-slate-400">
                  <Target className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span className="font-sans truncate">
                    {card.targetLabel ? card.targetLabel.replace('Target ', 'Tgt ') : 'Target'}:
                  </span>
                </div>
                <span className="font-bold text-[#133326] tabular-nums truncate ml-1 shrink-0">
                  {card.targetValue ? card.targetValue : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Progress Tracker (Styled like COINEST "Saving Plans" & "Daily Limit") */}
      {hasTargetData ? (
        <div className="bg-white rounded-xl border border-[#E2EBE0] p-3.5 sm:p-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#ECF2EB] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EAF2E8] text-[#133326] flex items-center justify-center flex-shrink-0">
                <Target className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#133326]">
                  Pencapaian Target vs Realisasi (Spreadsheet DB ADS)
                </h3>
                <p className="text-3xs text-slate-400">
                  Target operasional iklan berbayar sesuai filter periode yang dipilih
                </p>
              </div>
            </div>

            {metrics.targetBlendedRoas !== null && (
              <div className="flex items-center gap-2 bg-[#F6F9F5] px-3 py-1.5 rounded-lg border border-[#E2EBE0] self-start sm:self-auto text-2xs">
                <span className="text-slate-500 font-medium">Target ROAS:</span>
                <span className="font-mono font-bold text-[#133326]">
                  {formatRoas(metrics.targetBlendedRoas)}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-medium">Realisasi:</span>
                <span className="font-mono font-extrabold text-emerald-700">
                  {formatRoas(metrics.blendedRoas)}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. GMV Ads Progress (COINEST Saving Plan Card Style) */}
            <div className="bg-[#F6F9F5] rounded-xl p-3 border border-[#E2EBE0]">
              <div className="flex items-center justify-between text-2xs mb-2">
                <span className="font-bold text-[#133326] flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-[#EAF2E8] text-[#133326] flex items-center justify-center">
                    <TrendingUp className="w-3 h-3" />
                  </span>
                  GMV Ads
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs font-bold bg-[#D7F7C4] text-[#133326] font-mono">
                  {metrics.revenueAchievementPct !== null
                    ? formatRatioPercent(metrics.revenueAchievementPct)
                    : '—'}
                </span>
              </div>
              {/* COINEST Dual-Tone Progress Bar: Dark Forest on Mint Lime Track */}
              <div className="w-full bg-[#D7F7C4] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-[#133326]"
                  style={{
                    width: `${Math.min(metrics.revenueAchievementPct || 0, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-3xs text-slate-500 mt-2 font-mono">
                <span className="font-bold text-[#133326]">
                  Realisasi: {formatCurrencyIDR(metrics.totalRevenue)}
                </span>
                <span className="text-slate-400">
                  Target: {formatCurrencyIDR(metrics.totalTargetRevenue)}
                </span>
              </div>
            </div>

            {/* 2. Spend Budget Progress */}
            <div className="bg-[#F6F9F5] rounded-xl p-3 border border-[#E2EBE0]">
              <div className="flex items-center justify-between text-2xs mb-2">
                <span className="font-bold text-[#133326] flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-[#EAF2E8] text-[#133326] flex items-center justify-center">
                    <Wallet className="w-3 h-3" />
                  </span>
                  Spend Budget
                </span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs font-bold font-mono ${
                    (metrics.spendAchievementPct || 0) > 105
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#D7F7C4] text-[#133326]'
                  }`}
                >
                  {metrics.spendAchievementPct !== null
                    ? formatRatioPercent(metrics.spendAchievementPct)
                    : '—'}
                </span>
              </div>
              <div className="w-full bg-[#D7F7C4] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (metrics.spendAchievementPct || 0) > 105
                      ? 'bg-amber-600'
                      : 'bg-[#133326]'
                  }`}
                  style={{
                    width: `${Math.min(metrics.spendAchievementPct || 0, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-3xs text-slate-500 mt-2 font-mono">
                <span className="font-bold text-[#133326]">
                  Realisasi: {formatCurrencyIDR(metrics.totalSpend)}
                </span>
                <span className="text-slate-400">
                  Target: {formatCurrencyIDR(metrics.totalTargetSpend)}
                </span>
              </div>
            </div>

            {/* 3. Paid Orders Progress */}
            <div className="bg-[#F6F9F5] rounded-xl p-3 border border-[#E2EBE0]">
              <div className="flex items-center justify-between text-2xs mb-2">
                <span className="font-bold text-[#133326] flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-md bg-[#EAF2E8] text-[#133326] flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                  Paid Orders
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-3xs font-bold bg-[#D7F7C4] text-[#133326] font-mono">
                  {metrics.ordersAchievementPct !== null
                    ? formatRatioPercent(metrics.ordersAchievementPct)
                    : '—'}
                </span>
              </div>
              <div className="w-full bg-[#D7F7C4] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-[#133326]"
                  style={{
                    width: `${Math.min(metrics.ordersAchievementPct || 0, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-3xs text-slate-500 mt-2 font-mono">
                <span className="font-bold text-[#133326]">
                  Realisasi: {formatNumber(metrics.totalOrders)} order
                </span>
                <span className="text-slate-400">
                  Target: {formatNumber(metrics.totalTargetOrders)} order
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2EBE0] px-3.5 py-2.5 text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs">
          <div className="w-6 h-6 rounded-lg bg-[#EAF2E8] text-[#133326] flex items-center justify-center shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xs">
            <strong className="text-[#133326]">Catatan Target:</strong> Kolom target belum diisi pada spreadsheet untuk rentang ini. Target aktif tercatat mulai <strong>November 2026</strong>.
          </span>
        </div>
      )}
    </section>
  );
};
