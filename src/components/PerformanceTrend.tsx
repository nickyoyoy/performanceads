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
  targetSpend: number;
  targetRevenue: number;
  targetOrders: number;
  hasValid: boolean;
  hasTarget: boolean;
}

export const PerformanceTrend: React.FC<PerformanceTrendProps> = ({ records }) => {
  const [chartView, setChartView] = useState<ChartViewType>('combined');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group records by reportDate
  const dailyData: DailyAggregatedData[] = useMemo(() => {
    const map = new Map<
      string,
      {
        spend: number;
        revenue: number;
        orders: number;
        targetSpend: number;
        targetRevenue: number;
        targetOrders: number;
        hasValid: boolean;
        hasTarget: boolean;
      }
    >();

    for (const r of records) {
      if (!r.reportDate) continue;
      const existing = map.get(r.reportDate) || {
        spend: 0,
        revenue: 0,
        orders: 0,
        targetSpend: 0,
        targetRevenue: 0,
        targetOrders: 0,
        hasValid: false,
        hasTarget: false,
      };

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

      if (r.targetSpend !== null) {
        existing.targetSpend += r.targetSpend;
        existing.hasTarget = true;
      }
      if (r.targetRevenue !== null) {
        existing.targetRevenue += r.targetRevenue;
        existing.hasTarget = true;
      }
      if (r.targetOrders !== null) {
        existing.targetOrders += r.targetOrders;
        existing.hasTarget = true;
      }

      map.set(r.reportDate, existing);
    }

    return Array.from(map.entries())
      .map(([date, data]) => {
        const roas = data.hasValid && data.spend > 0 ? data.revenue / data.spend : 0;
        const spendPerOrder =
          data.hasValid && data.orders > 0 ? data.spend / data.orders : 0;
        return {
          date,
          spend: data.hasValid ? data.spend : 0,
          revenue: data.hasValid ? data.revenue : 0,
          orders: data.hasValid ? data.orders : 0,
          targetSpend: data.hasTarget ? data.targetSpend : 0,
          targetRevenue: data.hasTarget ? data.targetRevenue : 0,
          targetOrders: data.hasTarget ? data.targetOrders : 0,
          roas,
          spendPerOrder,
          hasValid: data.hasValid,
          hasTarget: data.hasTarget,
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
        if (d.roas > peakRoasDay.roas && d.spend >= 1000000) peakRoasDay = d;
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
    const maxRev = Math.max(...dailyData.map((d) => d.revenue), 1000000);
    const maxSpend = Math.max(...dailyData.map((d) => d.spend), 500000);
    const maxCombined = Math.max(maxRev, maxSpend * 1.2);
    const maxRoas = Math.max(...dailyData.map((d) => d.roas), 15);
    const maxOrders = Math.max(...dailyData.map((d) => d.orders), 100);

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
      const roasMax = Math.max(...dailyData.map((item) => item.roas), 15);
      const ratio = Math.min(1, d.roas / roasMax);
      const y = padding.top + innerHeight - ratio * innerHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [dailyData, innerWidth, innerHeight, padding.left, padding.top]);

  return (
    <div className="space-y-4 mb-6">
      {/* Strategic Highlights Banner Strip (All 4 Cards Preserved) */}
      {highlights && distinctDatesCount >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5">
          {/* Best ROAS Day */}
          <div className="bg-white border border-[#E2EBE0] rounded-2xl p-4 shadow-card overflow-hidden min-w-0">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-[#133326]">
              <span className="w-6 h-6 rounded-lg bg-[#D7F7C4] text-[#133326] flex items-center justify-center shrink-0">
                <Award className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">ROAS Tertinggi</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 truncate">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-[#133326]">
                {formatRoas(highlights.peakRoasDay.roas)}
              </span>
              <span className="text-2xs text-slate-500 font-mono truncate">
                ({formatDateWIB(highlights.peakRoasDay.date)})
              </span>
            </div>
            <div className="text-2xs text-slate-500 mt-0.5 truncate">
              GMV {formatCurrencyIDR(highlights.peakRoasDay.revenue)} &bull; Spend{' '}
              {formatCurrencyIDR(highlights.peakRoasDay.spend)}
            </div>
          </div>

          {/* Peak GMV Day */}
          <div className="bg-white border border-[#E2EBE0] rounded-2xl p-4 shadow-card overflow-hidden min-w-0">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-[#133326]">
              <span className="w-6 h-6 rounded-lg bg-[#EAF2E8] text-[#133326] flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">Peak GMV Ads</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 truncate">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-[#133326] truncate">
                {formatCurrencyIDR(highlights.peakGmvDay.revenue)}
              </span>
            </div>
            <div className="text-2xs text-slate-500 mt-0.5 truncate">
              {formatDateWIB(highlights.peakGmvDay.date)} &bull;{' '}
              {formatNumber(highlights.peakGmvDay.orders)} order
            </div>
          </div>

          {/* Average Daily Spend */}
          <div className="bg-white border border-[#E2EBE0] rounded-2xl p-4 shadow-card overflow-hidden min-w-0">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Rata-rata Spend / Hari
            </div>
            <div className="text-lg sm:text-xl font-extrabold font-mono text-[#133326] mt-2 truncate">
              {formatCurrencyIDR(highlights.avgSpend)}
            </div>
            <div className="text-2xs text-slate-500 mt-0.5 truncate">
              Total {formatCurrencyIDR(highlights.totalSpend)} ({highlights.validDays} hari aktif)
            </div>
          </div>

          {/* Average Daily GMV */}
          <div className="bg-white border border-[#E2EBE0] rounded-2xl p-4 shadow-card overflow-hidden min-w-0">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 truncate">
              Rata-rata GMV / Hari
            </div>
            <div className="text-lg sm:text-xl font-extrabold font-mono text-[#133326] mt-2 truncate">
              {formatCurrencyIDR(highlights.avgRevenue)}
            </div>
            <div className="text-2xs text-slate-500 mt-0.5 truncate">
              Blended ROAS:{' '}
              <strong className="text-emerald-700">
                {formatRoas(highlights.blendedRoas)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart Container Card (COINEST "Cashflow" Card Aesthetic) */}
      <section
        aria-label="Grafik Tren Performa Iklan"
        className="bg-white rounded-2xl border border-[#E2EBE0] p-5 sm:p-6 shadow-card"
      >
        {/* Chart Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF2E8] text-[#133326] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#133326] tracking-tight">
                Cashflow & Analisis Tren Harian
              </h2>
              <span className="text-2xs bg-[#EAF2E8] text-[#133326] px-2.5 py-0.5 rounded-full font-mono font-bold">
                {distinctDatesCount} Hari
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualisasi runtun waktu metrik pendapatan (GMV Ads), belanja iklan (Spend), dan efisiensi ROAS.
            </p>
          </div>

          {/* View Mode Selector Tabs */}
          <div className="inline-flex flex-wrap rounded-full border border-[#E2EBE0] p-1 bg-[#F6F9F5] self-start xl:self-center gap-0.5">
            <button
              type="button"
              onClick={() => setChartView('combined')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                chartView === 'combined'
                  ? 'bg-[#133326] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#133326]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>GMV & Spend Terpadu</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('revenue')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                chartView === 'revenue'
                  ? 'bg-[#133326] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#133326]'
              }`}
            >
              GMV Ads
            </button>
            <button
              type="button"
              onClick={() => setChartView('spend')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                chartView === 'spend'
                  ? 'bg-[#133326] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#133326]'
              }`}
            >
              Spend
            </button>
            <button
              type="button"
              onClick={() => setChartView('roas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                chartView === 'roas'
                  ? 'bg-[#133326] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#133326]'
              }`}
            >
              ROAS
            </button>
            <button
              type="button"
              onClick={() => setChartView('orders')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
                chartView === 'orders'
                  ? 'bg-[#133326] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#133326]'
              }`}
            >
              Order
            </button>
          </div>
        </div>

        {/* COINEST Total Balance + Legend Row */}
        {distinctDatesCount >= 2 && highlights && (
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 mb-4 border-b border-[#ECF2EB] pb-3.5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-xs text-slate-500 font-medium">Total GMV Periode:</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#133326] tabular-nums">
                {formatCurrencyIDR(highlights.totalRevenue)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              {chartView === 'combined' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#133326] inline-block" />
                    <span className="font-semibold text-[#133326]">GMV Ads (Income)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#94E169] inline-block" />
                    <span className="font-semibold text-[#133326]">Spend (Expense)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-emerald-600 inline-block" />
                    <span className="font-semibold text-[#133326]">ROAS (Garis Tren)</span>
                  </div>
                </>
              )}
              {chartView === 'revenue' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#133326] inline-block" />
                  <span className="font-semibold text-[#133326]">Realisasi GMV Ads</span>
                </div>
              )}
              {chartView === 'spend' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#94E169] inline-block" />
                  <span className="font-semibold text-[#133326]">Realisasi Spend Iklan</span>
                </div>
              )}
              {chartView === 'roas' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#1E4A38] inline-block" />
                  <span className="font-semibold text-[#133326]">Return on Ad Spend (ROAS)</span>
                </div>
              )}
              {chartView === 'orders' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#133326] inline-block" />
                  <span className="font-semibold text-[#133326]">Total Paid Order</span>
                </div>
              )}
            </div>
          </div>
        )}

        {distinctDatesCount < 2 ? (
          /* Limited State for single day */
          <div className="rounded-2xl border border-dashed border-[#DCE8DA] bg-[#F6F9F5] p-6 sm:p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-10 h-10 rounded-full bg-[#EAF2E8] text-[#133326] flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold text-[#133326]">
                Data tren membutuhkan minimal dua hari
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Filter saat ini hanya mencakup 1 hari (
                {dailyData[0]?.date ? formatDateWIB(dailyData[0].date) : '—'}). Pilih periode{' '}
                <strong>30 Hari Terakhir</strong> pada filter di atas untuk visualisasi tren lengkap.
              </p>
              {dailyData.length > 0 && (
                <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 bg-white border border-[#E2EBE0] rounded-xl text-xs font-mono">
                  <Calendar className="w-4 h-4 text-[#133326]" />
                  <span>{formatDateWIB(dailyData[0].date)}:</span>
                  <strong className="text-[#133326]">
                    {formatCurrencyIDR(dailyData[0].revenue)} GMV
                  </strong>
                  <span className="text-slate-400">|</span>
                  <strong className="text-emerald-700">
                    {formatRoas(dailyData[0].roas)}
                  </strong>
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
                      stroke="#E2EBE0"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? undefined : '4,4'}
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
                const barWidth = Math.max(4, Math.min(18, slotWidth * 0.42));

                // Height calculations
                const revHeight = Math.max(3, (d.revenue / yMax) * innerHeight);
                const spendHeight = Math.max(3, (d.spend / yMax) * innerHeight);
                const ordersHeight = Math.max(3, (d.orders / yMax) * innerHeight);
                const roasHeight = Math.max(3, (d.roas / yMax) * innerHeight);

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

                    {/* Active hover highlight column */}
                    {isHovered && (
                      <rect
                        x={padding.left + i * slotWidth + 2}
                        y={padding.top}
                        width={Math.max(4, slotWidth - 4)}
                        height={innerHeight}
                        rx="6"
                        fill="#EAF2E8"
                        opacity="0.65"
                      />
                    )}

                    {/* Chart View Modes */}
                    {chartView === 'combined' && (
                      <>
                        {/* GMV Bar (Deep Forest Green) */}
                        <rect
                          x={slotCenterX - barWidth - 1}
                          y={padding.top + innerHeight - revHeight}
                          width={barWidth}
                          height={revHeight}
                          rx="3.5"
                          fill="#133326"
                          opacity={isHovered ? '1' : '0.92'}
                        />
                        {/* Spend Bar (Fresh Mint Lime) */}
                        <rect
                          x={slotCenterX + 1}
                          y={padding.top + innerHeight - spendHeight}
                          width={barWidth}
                          height={spendHeight}
                          rx="3.5"
                          fill="#94E169"
                          opacity={isHovered ? '1' : '0.92'}
                        />
                      </>
                    )}

                    {chartView === 'revenue' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - revHeight}
                        width={barWidth * 1.6}
                        height={revHeight}
                        rx="4"
                        fill="#133326"
                        opacity={isHovered ? '1' : '0.9'}
                      />
                    )}

                    {chartView === 'spend' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - spendHeight}
                        width={barWidth * 1.6}
                        height={spendHeight}
                        rx="4"
                        fill="#94E169"
                        opacity={isHovered ? '1' : '0.95'}
                      />
                    )}

                    {chartView === 'orders' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - ordersHeight}
                        width={barWidth * 1.6}
                        height={ordersHeight}
                        rx="4"
                        fill="#1E4A38"
                        opacity={isHovered ? '1' : '0.9'}
                      />
                    )}

                    {chartView === 'roas' && (
                      <rect
                        x={slotCenterX - barWidth * 0.8}
                        y={padding.top + innerHeight - roasHeight}
                        width={barWidth * 1.6}
                        height={roasHeight}
                        rx="4"
                        fill="#133326"
                        opacity={isHovered ? '1' : '0.9'}
                      />
                    )}

                    {/* X-Axis date label ticks */}
                    {(i % Math.ceil(dailyData.length / 8) === 0 ||
                      i === dailyData.length - 1) && (
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
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {/* COINEST Floating White Card Tooltip */}
            {hoveredIndex !== null && dailyData[hoveredIndex] && (
              <div
                className="absolute z-30 pointer-events-none bg-white text-[#133326] p-3.5 rounded-2xl shadow-xl text-xs font-sans border border-[#DCE8DA] min-w-[220px]"
                style={{
                  top: '12px',
                  left: `${Math.min(
                    75,
                    Math.max(12, (hoveredIndex / (dailyData.length - 1)) * 100)
                  )}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="flex items-center justify-between border-b border-[#ECF2EB] pb-2 mb-2">
                  <span className="font-bold text-[#133326]">
                    {formatDateWIB(dailyData[hoveredIndex].date)}
                  </span>
                  <span className="font-mono text-2xs bg-[#D7F7C4] px-2 py-0.5 rounded-full text-[#133326] font-bold">
                    ROAS {formatRoas(dailyData[hoveredIndex].roas)}
                  </span>
                </div>
                <div className="space-y-1.5 font-mono text-2xs">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#133326]" />
                        GMV Ads:
                      </span>
                      <strong className="text-[#133326]">
                        {formatCurrencyIDR(dailyData[hoveredIndex].revenue)}
                      </strong>
                    </div>
                    {dailyData[hoveredIndex].hasTarget &&
                      dailyData[hoveredIndex].targetRevenue > 0 && (
                        <div className="flex justify-between text-emerald-700 font-sans text-3xs pl-3.5">
                          <span>
                            Target: {formatCurrencyIDR(dailyData[hoveredIndex].targetRevenue)}
                          </span>
                          <span className="font-bold">
                            {(
                              (dailyData[hoveredIndex].revenue /
                                dailyData[hoveredIndex].targetRevenue) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#94E169]" />
                        Spend:
                      </span>
                      <strong className="text-[#133326]">
                        {formatCurrencyIDR(dailyData[hoveredIndex].spend)}
                      </strong>
                    </div>
                    {dailyData[hoveredIndex].hasTarget &&
                      dailyData[hoveredIndex].targetSpend > 0 && (
                        <div className="flex justify-between text-slate-500 font-sans text-3xs pl-3.5">
                          <span>
                            Target: {formatCurrencyIDR(dailyData[hoveredIndex].targetSpend)}
                          </span>
                          <span className="font-bold">
                            {(
                              (dailyData[hoveredIndex].spend /
                                dailyData[hoveredIndex].targetSpend) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Paid Order:</span>
                      <strong className="text-[#133326]">
                        {formatNumber(dailyData[hoveredIndex].orders)}
                      </strong>
                    </div>
                    {dailyData[hoveredIndex].hasTarget &&
                      dailyData[hoveredIndex].targetOrders > 0 && (
                        <div className="flex justify-between text-slate-500 font-sans text-3xs">
                          <span>
                            Target: {formatNumber(dailyData[hoveredIndex].targetOrders)}
                          </span>
                          <span className="font-bold">
                            {(
                              (dailyData[hoveredIndex].orders /
                                dailyData[hoveredIndex].targetOrders) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="flex justify-between border-t border-[#ECF2EB] pt-1.5 mt-1">
                    <span className="text-slate-500">Spend / Order:</span>
                    <strong className="text-slate-700">
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
