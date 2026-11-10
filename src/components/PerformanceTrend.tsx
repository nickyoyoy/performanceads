import React, { useState, useMemo } from 'react';
import { AdsDailyRecord } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
  formatDateWIB,
} from '../utils/formatters';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface PerformanceTrendProps {
  records: AdsDailyRecord[];
}

type TrendMetric = 'spend' | 'revenue' | 'orders' | 'roas';

export const PerformanceTrend: React.FC<PerformanceTrendProps> = ({ records }) => {
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('spend');

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
    { id: 'spend' as const, label: 'Spend' },
    { id: 'revenue' as const, label: 'GMV Ads' },
    { id: 'orders' as const, label: 'Paid Orders' },
    { id: 'roas' as const, label: 'ROAS' },
  ];

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
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              {distinctDatesCount} Hari Terkumpul
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis runtun waktu untuk memantau stabilitas spend dan perolehan GMV.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start sm:self-center">
          {metricTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedMetric(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedMetric === tab.id
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
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
              Data yang tersedia saat ini: <strong className="text-slate-700">9 November 2026</strong>. Menampilkan grafik garis dengan 1 titik data berpotensi menimbulkan interpretasi tren yang bias/keliru.
            </p>

            {/* Single point inspection badge */}
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

            <div className="mt-4 flex items-center justify-center gap-1.5 text-2xs text-slate-400">
              <AlertCircle className="w-3 h-3" />
              <span>Komponen siap menampilkan visualisasi tren lengkap otomatis saat data 30 hari diisi.</span>
            </div>
          </div>
        </div>
      ) : (
        /* Dynamic SVG Bar Chart for >= 2 days */
        <div className="mt-4">
          <div className="h-48 w-full flex items-end gap-2 pt-6 pb-2 border-b border-slate-200">
            {dailyData.map((d, idx) => {
              const val = d[selectedMetric];
              const maxVal = Math.max(...dailyData.map(item => item[selectedMetric])) || 1;
              const heightPercent = Math.max(8, (val / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-2xs font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded mb-1 shadow pointer-events-none whitespace-nowrap">
                    {selectedMetric === 'spend' && formatCurrencyIDR(val)}
                    {selectedMetric === 'revenue' && formatCurrencyIDR(val)}
                    {selectedMetric === 'orders' && formatNumber(val)}
                    {selectedMetric === 'roas' && formatRoas(val)}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[28px] bg-blue-600 rounded-t-sm group-hover:bg-blue-700 transition-colors"
                  />
                  <div className="text-2xs text-slate-400 mt-1 truncate max-w-full font-mono">
                    {d.date.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

