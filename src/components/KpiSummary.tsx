import React, { useState } from 'react';
import { KpiSummaryMetrics } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
  formatPercent,
} from '../utils/formatters';
import { HelpCircle, AlertCircle } from 'lucide-react';

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
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ metrics }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isPartial = metrics.validRecordsCount < metrics.totalExpectedRecordsCount && metrics.totalExpectedRecordsCount > 0;

  // Grouped logically: Row 1 = Financials (Spend, GMV, ROAS); Row 2 = Volume & Operations (Orders, CPO, Coverage)
  const cards: KpiCardItem[] = [
    {
      id: 'spend',
      label: 'Total Spend',
      value: formatCurrencyIDR(metrics.totalSpend),
      subtitle: isPartial ? 'Belanja iklan terverifikasi' : 'Total biaya iklan',
      tooltip: 'Akumulasi pengeluaran iklan aktual dari kanal dengan status terverifikasi. Tidak menghitung kanal bermasalah sebagai Rp 0.',
      hasWarning: isPartial,
    },
    {
      id: 'gmv',
      label: 'GMV Ads',
      value: formatCurrencyIDR(metrics.totalRevenue),
      subtitle: 'Gross Merchandise Value',
      tooltip: 'Realisasi pendapatan penjualan kotor yang diatribusikan ke iklan berbayar sesuai model atribusi platform masing-masing.',
      hasWarning: isPartial,
    },
    {
      id: 'roas',
      label: 'Blended ROAS',
      value: formatRoas(metrics.blendedRoas),
      subtitle: 'SUM(GMV) / SUM(Spend)',
      tooltip: 'Pengembalian riil belanja iklan terpadu (Total GMV / Total Spend). Bukan rata-rata angka ROAS masing-masing baris.',
    },
    {
      id: 'orders',
      label: 'Paid Orders',
      value: formatNumber(metrics.totalOrders),
      subtitle: 'Volume pesanan berbayar',
      tooltip: 'Total volume pesanan berbayar yang dihasilkan langsung melalui kampanye iklan berbayar.',
      hasWarning: isPartial,
    },
    {
      id: 'cpo',
      label: 'Spend per Order',
      value: formatCurrencyIDR(metrics.spendPerOrder),
      subtitle: 'Biaya akuisisi per pesanan',
      tooltip: 'Rata-rata biaya belanja iklan untuk setiap pesanan berbayar (Total Spend / Total Paid Orders).',
    },
    {
      id: 'coverage',
      label: 'Data Coverage',
      value: formatPercent(metrics.dataCoverage),
      subtitle: `${metrics.validRecordsCount} dari ${metrics.totalExpectedRecordsCount} slot data terverifikasi`,
      tooltip: 'Rasio kelengkapan data aktual dari seluruh kanal dan tanggal penarikan yang diharapkan.',
      hasWarning: metrics.dataCoverage < 1,
    },
  ];

  return (
    <section aria-label="Ringkasan Indikator Kinerja Utama (KPI)" className="mb-6">
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
              <div className="flex items-center justify-between gap-1 text-slate-500 mb-2">
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
    </section>
  );
};
