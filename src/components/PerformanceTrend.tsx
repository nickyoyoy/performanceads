import React, { useState, useMemo } from 'react';
import { AdsDailyRecord } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
  formatDateWIB,
} from '../utils/formatters';
import { TrendingUp, Calendar } from 'lucide-react';

interface PerformanceTrendProps {
  records: AdsDailyRecord[];
}

type TrendMetric = 'spend' | 'revenue' | 'orders' | 'roas';

export const PerformanceTrend: React.FC<PerformanceTrendProps> = ({ records }) => {
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('revenue');

  // Group records by reportDate
  const dailyData = useMemo(() => {
    const map = new Map<string, { spend: number; revenue: number; orders: number; hasValid: boolean }>();

    for (const r of records) {
      if (!r.reportDate) continue;
      const existing = map.get(r.reportDate) || { spend: 0, revenue: 0, orders: 0, hasValid: false };

      if (r.actualSpend !== null) {
        existing.spend += r.actualSpend;
        existing.hasValid = true;
      }
      if (r.actualRevenue !== null) {
        existing.revenue += r.actualRevenue;
        existing.hasValid = true;
      }
      if (r.actualOrders !== null) {
        existing.orders += r.actualOrders;
        existing.hasValid = true;
      }

      map.set(r.reportDate, existing);
    }

    return Array.from(map.entries())
      .map(([date, data]) => ({
        date,
        spend: data.hasValid ? data.spend : 0,
        revenue: data.hasValid ? data.revenue : 0,
        orders: data.hasValid ? data.orders : 0,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
        hasValid: data.hasValid,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  const distinctDatesCount = dailyData.length;

  const metricTabs = [
    { id: 'revenue' as const, label: 'GMV Ads' },
    { id: 'spend' as const, label: 'Spend' },
    { id: 'orders' as const, label: 'Paid Orders' },
    { id: 'roas' as const, label: 'ROAS' },
  ];

  // Overall metric totals in this trend period
  const trendSummary = useMemo(() => {
    const totalSpend = dailyData.reduce((acc, d) => acc + d.spend, 0);
    const totalRev = dailyData.reduce((acc, d) => acc + d.revenue, 0);
    const totalOrders = dailyData.reduce((acc, d) => acc + d.orders, 0);
    const blendedRoas = totalSpend > 0 ? totalRev / totalSpend : 0;
    return { totalSpend, totalRev, totalOrders, blendedRoas };
  }, [dailyData]);

  return (
    <section
      aria-label="Tren Performa"
      className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Tren Performa Harian
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono font-medium">
              {distinctDatesCount} Hari Observasi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis runtun waktu untuk memantau pergerakan spend, perolehan GMV, dan stabilitas ROAS harian.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start sm:self-center">
          {metricTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedMetric(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedMetric === tab.id
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {distinctDatesCount < 2 ? (
        /* Honest limited state: Single Day Observational View */
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 sm:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
            </div>

            <h3 className="text-sm font-semibold text-slate-900">
              Data tren membutuhkan minimal dua hari
            </h3>

            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Data yang tersedia pada filter saat ini hanya 1 hari observasi ({dailyData[0]?.date ? formatDateWIB(dailyData[0].date) : '—'}). Pilih periode <strong>30 Hari Terakhir</strong> pada filter di atas untuk melihat grafik tren.
            </p>

            {dailyData.length > 0 && (
              <div className="mt-5 inline-flex items-center gap-4 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs text-left">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatDateWIB(dailyData[0].date)}:</span>
                </div>
                <div className="text-sm font-bold text-slate-900 font-mono">
                  {selectedMetric === 'spend' && formatCurrencyIDR(dailyData[0].spend)}
                  {selectedMetric === 'revenue' && formatCurrencyIDR(dailyData[0].revenue)}
                  {selectedMetric === 'orders' && formatNumber(dailyData[0].orders)}
                  {selectedMetric === 'roas' && formatRoas(dailyData[0].roas)}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Multi-Day Interactive Bar Chart */
        <div>
          {/* Quick Period Summary Pills */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200">
            <div>
              <span className="text-slate-400">Total Spend: </span>
              <strong className="text-slate-900 font-mono">{formatCurrencyIDR(trendSummary.totalSpend)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Total GMV: </span>
              <strong className="text-slate-900 font-mono">{formatCurrencyIDR(trendSummary.totalRev)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Total Order: </span>
              <strong className="text-slate-900 font-mono">{formatNumber(trendSummary.totalOrders)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Blended ROAS: </span>
              <strong className="text-emerald-700 font-mono">{formatRoas(trendSummary.blendedRoas)}</strong>
            </div>
          </div>

          <div className="h-56 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 border-b border-slate-200 overflow-x-auto">
            {dailyData.map((d, idx) => {
              const val = d[selectedMetric];
              const maxVal = Math.max(...dailyData.map(item => item[selectedMetric])) || 1;
              const heightPercent = Math.max(6, Math.min(100, (val / maxVal) * 100));

              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[14px] sm:min-w-[18px] max-w-[32px] flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Floating tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 pointer-events-none bg-slate-900 text-white text-2xs p-2 rounded shadow-lg whitespace-nowrap font-mono flex flex-col gap-0.5">
                    <span className="font-semibold text-blue-300">{d.date}</span>
                    <span>Spend: {formatCurrencyIDR(d.spend)}</span>
                    <span>GMV: {formatCurrencyIDR(d.revenue)}</span>
                    <span>Order: {formatNumber(d.orders)}</span>
                    <span className="text-emerald-400 font-bold">ROAS: {formatRoas(d.roas)}</span>
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xs transition-all ${
                      selectedMetric === 'roas'
                        ? 'bg-emerald-500 group-hover:bg-emerald-600'
                        : selectedMetric === 'spend'
                        ? 'bg-amber-500 group-hover:bg-amber-600'
                        : 'bg-blue-600 group-hover:bg-blue-700'
                    }`}
                  />

                  {/* X Axis label every 5 days or hover */}
                  <div className="text-3xs text-slate-400 mt-1 truncate max-w-full font-mono">
                    {idx % 4 === 0 || idx === dailyData.length - 1 ? d.date.slice(8) : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between text-2xs text-slate-400">
            <span>{dailyData[0]?.date}</span>
            <span>Arahkan kursor ke bar untuk detail harian</span>
            <span>{dailyData[dailyData.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </section>
  );
};
