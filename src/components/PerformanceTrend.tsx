import React, { useState, useMemo, useRef } from 'react';
import { AdsDailyRecord } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
  formatDateWIB,
} from '../utils/formatters';
import {
  TrendingUp,
  Calendar,
  Layers,
  Award,
  Zap,
} from 'lucide-react';

interface PerformanceTrendProps {
  records: AdsDailyRecord[];
}

type ChartViewType = 'combined' | 'revenue' | 'spend' | 'roas' | 'orders';

interface DailyAggregatedData {
  date: string;
  spend: number;
  revenue: number;
  orders: number;
  roas: number;
  spendPerOrder: number;
  hasValid: boolean;
}

export const PerformanceTrend: React.FC<PerformanceTrendProps> = ({ records }) => {
  const [chartView, setChartView] = useState<ChartViewType>('combined');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group records by reportDate
  const dailyData: DailyAggregatedData[] = useMemo(() => {
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
      .map(([date, data]) => {
        const roas = data.hasValid && data.spend > 0 ? data.revenue / data.spend : 0;
        const spendPerOrder = data.hasValid && data.orders > 0 ? data.spend / data.orders : 0;
        return {
          date,
          spend: data.hasValid ? data.spend : 0,
          revenue: data.hasValid ? data.revenue : 0,
          orders: data.hasValid ? data.orders : 0,
          roas,
          spendPerOrder,
          hasValid: data.hasValid,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);

  const distinctDatesCount = dailyData.length;

  // Trend Highlights & Summary Calculations
  const highlights = useMemo(() => {
    if (dailyData.length === 0) return null;

    let peakGmvDay = dailyData[0];
    let peakRoasDay = dailyData[0];
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalOrders = 0;
    let validDays = 0;

    for (const d of dailyData) {
      if (d.hasValid) {
        totalSpend += d.spend;
        totalRevenue += d.revenue;
        totalOrders += d.orders;
        validDays++;
        if (d.revenue > peakGmvDay.revenue) peakGmvDay = d;
        if (d.roas > peakRoasDay.roas && d.spend >= 1000000) peakRoasDay = d; // Min spend threshold for meaningful peak ROAS
      }
    }

    const avgSpend = validDays > 0 ? totalSpend / validDays : 0;
    const avgRevenue = validDays > 0 ? totalRevenue / validDays : 0;
    const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
      peakGmvDay,
      peakRoasDay,
      totalSpend,
      totalRevenue,
      totalOrders,
      avgSpend,
      avgRevenue,
      blendedRoas,
      validDays,
    };
  }, [dailyData]);

  // Chart coordinate mapping
  const chartWidth = 980;
  const chartHeight = 280;
  const padding = { top: 25, right: 25, bottom: 40, left: 90 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Determine Max Y Scale
  const maxValues = useMemo(() => {
    const maxRev = Math.max(...dailyData.map(d => d.revenue), 1000000);
    const maxSpend = Math.max(...dailyData.map(d => d.spend), 500000);
    const maxCombined = Math.max(maxRev, maxSpend * 1.2);
    const maxRoas = Math.max(...dailyData.map(d => d.roas), 15);
    const maxOrders = Math.max(...dailyData.map(d => d.orders), 100);

    return { maxRev, maxSpend, maxCombined, maxRoas, maxOrders };
  }, [dailyData]);

  const getYScaleMax = () => {
    switch (chartView) {
      case 'combined':
        return maxValues.maxCombined;
      case 'revenue':
        return maxValues.maxRev;
      case 'spend':
        return maxValues.maxSpend;
      case 'roas':
        return Math.ceil(maxValues.maxRoas * 1.15);
      case 'orders':
        return Math.ceil(maxValues.maxOrders * 1.15);
    }
  };

  const yMax = getYScaleMax();

  // Y-axis grid ticks (4 intervals)
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const formatYTick = (val: number) => {
    if (chartView === 'roas') {
      return `${val.toFixed(1)}x`;
    }
    if (chartView === 'orders') {
      return formatNumber(Math.round(val));
    }
    // Currency in Millions (Jt)
    if (val >= 1000000000) {
      return `Rp${(val / 1000000000).toFixed(1)} M`;
    }
    if (val >= 1000000) {
      return `Rp${(val / 1000000).toFixed(0)} Jt`;
    }
    if (val === 0) return 'Rp0';
    return `Rp${Math.round(val)}`;
  };

  // Generate ROAS line path for combined & roas mode
  const roasLinePath = useMemo(() => {
    if (dailyData.length < 2) return '';
    const points = dailyData.map((d, i) => {
      const x = padding.left + (i / (dailyData.length - 1)) * innerWidth;
      // In combined view, normalize ROAS against max ROAS
      const roasMax = Math.max(...dailyData.map(item => item.roas), 15);
      const ratio = Math.min(1, d.roas / roasMax);
      const y = padding.top + innerHeight - ratio * innerHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [dailyData, innerWidth, innerHeight, padding.left, padding.top]);

  return (
    <div className="space-y-4 mb-6">
      {/* Strategic Highlights Banner Strip */}
      {highlights && distinctDatesCount >= 2 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Best ROAS Day */}
          <div className="bg-white border border-emerald-200/80 rounded-lg p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-emerald-800">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>ROAS Tertinggi</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-700">
                {formatRoas(highlights.peakRoasDay.roas)}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({formatDateWIB(highlights.peakRoasDay.date)})
              </span>
            </div>
            <div className="text-2xs text-slate-500 mt-0.5">
              GMV {formatCurrencyIDR(highlights.peakRoasDay.revenue)} &bull; Spend {formatCurrencyIDR(highlights.peakRoasDay.spend)}
            </div>
          </div>

          {/* Peak GMV Day */}
          <div className="bg-white border border-blue-200/80 rounded-lg p-3.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-blue-800">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Peak GMV Ads</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-blue-900">
                {formatCurrencyIDR(highlights.peakGmvDay.revenue)}
              </span>
            </div>
            <div className="text-2xs text-slate-500 mt-0.5">
              {formatDateWIB(highlights.peakGmvDay.date)} &bull; {formatNumber(highlights.peakGmvDay.orders)} order
            </div>
          </div>

          {/* Average Daily Spend */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Spend / Hari
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {formatCurrencyIDR(highlights.avgSpend)}
            </div>
            <div className="text-2xs text-slate-500 mt-0.5">
              Total {formatCurrencyIDR(highlights.totalSpend)} ({highlights.validDays} hari aktif)
            </div>
          </div>

          {/* Average Daily GMV */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata GMV / Hari
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {formatCurrencyIDR(highlights.avgRevenue)}
            </div>
            <div className="text-2xs text-slate-500 mt-0.5">
              Blended ROAS periode: <strong className="text-emerald-700">{formatRoas(highlights.blendedRoas)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Container Card */}
      <section
        aria-label="Grafik Tren Performa Iklan"
        className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs"
      >
        {/* Chart Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">
                Grafik Analisis Tren Harian
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                {distinctDatesCount} Hari
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi runtun waktu metrik pendapatan, belanja iklan, dan efisiensi ROAS.
            </p>
          </div>

          {/* View Mode Selector Tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setChartView('combined')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartView === 'combined'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>GMV & Spend Terpadu</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('revenue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartView === 'revenue'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GMV Ads
            </button>
            <button
              type="button"
              onClick={() => setChartView('spend')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartView === 'spend'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Spend
            </button>
            <button
              type="button"
              onClick={() => setChartView('roas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartView === 'roas'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ROAS
            </button>
            <button
              type="button"
              onClick={() => setChartView('orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartView === 'orders'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order
            </button>
          </div>
        </div>

        {/* Legend */}
        {distinctDatesCount >= 2 && (
          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 mb-3 border-b border-slate-100 pb-2.5">
            {chartView === 'combined' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
                  <span className="font-medium text-slate-800">GMV Ads (Bar)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
                  <span className="font-medium text-slate-800">Spend (Bar)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-emerald-600 inline-block" />
                  <span className="font-medium text-slate-800">ROAS (Garis Tren)</span>
                </div>
              </>
            )}
            {chartView === 'revenue' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
                <span className="font-medium text-slate-800">Realisasi GMV Ads</span>
              </div>
            )}
            {chartView === 'spend' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
                <span className="font-medium text-slate-800">Realisasi Spend Iklan</span>
              </div>
            )}
            {chartView === 'roas' && (
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-600 inline-block" />
                <span className="font-medium text-slate-800">Return on Ad Spend (ROAS)</span>
              </div>
            )}
            {chartView === 'orders' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" />
                <span className="font-medium text-slate-800">Total Paid Order</span>
              </div>
            )}
            <div className="ml-auto text-2xs text-slate-400">
              *Arahkan kursor ke grafik untuk inspeksi detail per hari
            </div>
          </div>
        )}

        {distinctDatesCount < 2 ? (
          /* Limited State for single day */
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 sm:p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                Data tren membutuhkan minimal dua hari
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Filter saat ini hanya mencakup 1 hari ({dailyData[0]?.date ? formatDateWIB(dailyData[0].date) : '—'}). Pilih periode <strong>30 Hari Terakhir</strong> pada filter di atas untuk visualisasi tren lengkap.
              </p>
              {dailyData.length > 0 && (
                <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatDateWIB(dailyData[0].date)}:</span>
                  <strong className="text-slate-900">{formatCurrencyIDR(dailyData[0].revenue)} GMV</strong>
                  <span className="text-slate-400">|</span>
                  <strong className="text-emerald-700">{formatRoas(dailyData[0].roas)}</strong>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* High-Definition Responsive SVG Chart */
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible font-sans"
            >
              {/* Horizontal Gridlines & Y-Axis Labels */}
              {yTicks.map((tick, i) => {
                const ratio = tick / yMax;
                const y = padding.top + innerHeight - ratio * innerHeight;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? undefined : '3,3'}
                    />
                    <text
                      x={padding.left - 12}
                      y={y + 4}
                      textAnchor="end"
                      className="text-3xs fill-slate-400 font-mono font-medium"
                    >
                      {formatYTick(tick)}
                    </text>
                  </g>
                );
              })}

              {/* Data Rendering */}
              {dailyData.map((d, i) => {
                const slotWidth = innerWidth / dailyData.length;
                const slotCenterX = padding.left + i * slotWidth + slotWidth / 2;
                const barWidth = Math.max(3, Math.min(18, slotWidth * 0.42));

                // Height calculations
                const revHeight = Math.max(2, (d.revenue / yMax) * innerHeight);
                const spendHeight = Math.max(2, (d.spend / yMax) * innerHeight);
                const ordersHeight = Math.max(2, (d.orders / yMax) * innerHeight);
                const roasHeight = Math.max(2, (d.roas / yMax) * innerHeight);

                const isHovered = hoveredIndex === i;

                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                  >
                    {/* Invisible hover detection strip */}
                    <rect
                      x={padding.left + i * slotWidth}
                      y={padding.top}
                      width={slotWidth}
                      height={innerHeight}
                      fill="transparent"
                    />

                    {/* Active hover vertical guide */}
                    {isHovered && (
                      <line
                        x1={slotCenterX}
                        y1={padding.top}
                        x2={slotCenterX}
                        y2={padding.top + innerHeight}
                        stroke="#3B82F6"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                        opacity="0.8"
                      />
                    )}

                    {/* Chart View Modes */}
                    {chartView === 'combined' && (
                      <>
                        {/* GMV Bar */}
                        <rect
                          x={slotCenterX - barWidth - 1}
                          y={padding.top + innerHeight - revHeight}
                          width={barWidth}
                          height={revHeight}
                          rx="2"
                          fill="#2563EB"
                          opacity={isHovered ? '1' : '0.85'}
                        />
                        {/* Spend Bar */}
                        <rect
                          x={slotCenterX + 1}
                          y={padding.top + innerHeight - spendHeight}
                          width={barWidth}
                          height={spendHeight}
                          rx="2"
                          fill="#F59E0B"
                          opacity={isHovered ? '1' : '0.85'}
                        />
                      </>
                    )}

                    {chartView === 'revenue' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - revHeight}
                        width={barWidth * 1.6}
                        height={revHeight}
                        rx="2"
                        fill="#2563EB"
                        opacity={isHovered ? '1' : '0.85'}
                      />
                    )}

                    {chartView === 'spend' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - spendHeight}
                        width={barWidth * 1.6}
                        height={spendHeight}
                        rx="2"
                        fill="#F59E0B"
                        opacity={isHovered ? '1' : '0.85'}
                      />
                    )}

                    {chartView === 'orders' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - ordersHeight}
                        width={barWidth * 1.6}
                        height={ordersHeight}
                        rx="2"
                        fill="#4F46E5"
                        opacity={isHovered ? '1' : '0.85'}
                      />
                    )}

                    {chartView === 'roas' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - roasHeight}
                        width={barWidth * 1.6}
                        height={roasHeight}
                        rx="2"
                        fill="#10B981"
                        opacity={isHovered ? '1' : '0.85'}
                      />
                    )}

                    {/* X-Axis date label ticks (sample periodically) */}
                    {(i % Math.ceil(dailyData.length / 8) === 0 || i === dailyData.length - 1) && (
                      <text
                        x={slotCenterX}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        className="text-3xs fill-slate-500 font-mono font-medium"
                      >
                        {d.date.slice(5).replace('-', '/')}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ROAS Trend Overlay Curve for Combined Mode */}
              {chartView === 'combined' && (
                <path
                  d={roasLinePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* Hover Tooltip Popup Card */}
            {hoveredIndex !== null && dailyData[hoveredIndex] && (
              <div
                className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3 rounded-lg shadow-xl text-xs font-sans border border-slate-700 min-w-[210px] backdrop-blur-xs"
                style={{
                  top: '15px',
                  left: `${Math.min(
                    75,
                    Math.max(
                      10,
                      ((hoveredIndex / (dailyData.length - 1)) * 100)
                    )
                  )}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
                  <span className="font-bold text-sky-300">
                    {formatDateWIB(dailyData[hoveredIndex].date)}
                  </span>
                  <span className="font-mono text-2xs bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 font-semibold">
                    ROAS {formatRoas(dailyData[hoveredIndex].roas)}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">GMV Ads:</span>
                    <strong className="text-white">
                      {formatCurrencyIDR(dailyData[hoveredIndex].revenue)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Spend:</span>
                    <strong className="text-amber-400">
                      {formatCurrencyIDR(dailyData[hoveredIndex].spend)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paid Order:</span>
                    <strong className="text-white">
                      {formatNumber(dailyData[hoveredIndex].orders)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                    <span className="text-slate-400">Spend / Order:</span>
                    <strong className="text-slate-300">
                      {formatCurrencyIDR(dailyData[hoveredIndex].spendPerOrder)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
