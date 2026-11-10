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
  isCoverage?: boolean;
  hasWarning?: boolean;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ metrics }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isPartial = metrics.validRecordsCount < metrics.totalExpectedRecordsCount && metrics.totalExpectedRecordsCount > 0;

  const cards: KpiCardItem[] = [
    {
      id: 'spend',
      label: 'Total Spend',
      value: formatCurrencyIDR(metrics.totalSpend),
      subtitle: isPartial ? `Dari ${metrics.validRecordsCount} kanal aktif` : 'Total belanja iklan',
      tooltip: 'Akumulasi pengeluaran iklan aktual dari kanal dengan status terverifikasi. Tidak menghitung kanal bermasalah sebagai Rp 0.',
      hasWarning: isPartial,
    },
    {
      id: 'gmv',
      label: 'GMV Ads',
      value: formatCurrencyIDR(metrics.totalRevenue),
      subtitle: isPartial ? 'Broad attribution (Shopee)' : 'Gross Merchandise Value',
      tooltip: 'Realisasi pendapatan penjualan kotor yang diatribusikan ke iklan berbayar sesuai model atribusi platform masing-masing.',
      hasWarning: isPartial,
    },
    {
      id: 'orders',
      label: 'Paid Orders',
      value: formatNumber(metrics.totalOrders),
      subtitle: isPartial ? `${metrics.validRecordsCount} kanal tersedia` : 'Total pesanan iklan',
      tooltip: 'Total volume pesanan berbayar yang dihasilkan langsung melalui kampanye iklan berbayar.',
      hasWarning: isPartial,
    },
    {
      id: 'roas',
      label: 'Blended ROAS',
      value: formatRoas(metrics.blendedRoas),
      subtitle: 'SUM(Rev) / SUM(Spend)',
      tooltip: 'Pengembalian riil belanja iklan terpadu (Total GMV / Total Spend). Bukan rata-rata angka ROAS masing-masing baris.',
    },
    {
      id: 'cpo',
      label: 'Spend per Order',
      value: formatCurrencyIDR(metrics.spendPerOrder),
      subtitle: 'Biaya per paid order',
      tooltip: 'Rata-rata biaya akuisisi belanja iklan untuk setiap pesanan berbayar (Total Spend / Total Paid Orders).',
    },
    {
      id: 'coverage',
      label: 'Data Coverage',
      value: formatPercent(metrics.dataCoverage),
      subtitle: `${metrics.validRecordsCount} dari ${metrics.totalExpectedRecordsCount} sumber`,
      tooltip: 'Rasio kelengkapan data aktual dari kanal yang diharapkan terhubung pada periode aktif.',
      isCoverage: true,
      hasWarning: metrics.dataCoverage < 1,
    },
  ];

  return (
    <section aria-label="Ringkasan Indikator Kinerja Utama (KPI)" className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {cards.map(card => (
          <div
            key={card.id}
            className={`relative bg-white rounded-lg border p-4 shadow-2xs transition-shadow hover:shadow-xs flex flex-col justify-between ${
              card.hasWarning ? 'border-amber-200' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 text-slate-500 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 truncate">
                  {card.label}
                </span>

                <div className="relative inline-block">
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
                      className="absolute z-30 bottom-full right-0 mb-2 w-48 p-2.5 bg-slate-900 text-white text-xs rounded-md shadow-lg leading-normal pointer-events-none"
                    >
                      {card.tooltip}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans tabular-nums py-0.5">
                {card.value}
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
              <span className="truncate">{card.subtitle}</span>
              {card.hasWarning && (
                <span
                  title="Data parsial: sebagian sumber belum tersedia"
                  className="text-amber-600 flex-shrink-0"
                >
                  <AlertCircle className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

