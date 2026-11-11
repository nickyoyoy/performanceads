import React, { useMemo, useState } from 'react';
import { AdsDailyRecord } from '../types/ads';
import { formatCurrencyIDR, formatRoas } from '../utils/formatters';
import { PieChart, ArrowUpRight } from 'lucide-react';

interface ChannelShareDonutProps {
  records: AdsDailyRecord[];
  onSelectChannel?: (record: AdsDailyRecord) => void;
}

type DonutMetricMode = 'revenue' | 'spend';

const SEGMENT_STYLES = [
  {
    stroke: '#133326', // Deep Forest Green
    pillBg: 'bg-[#133326]',
    pillText: 'text-white',
    dotBg: 'bg-[#133326]',
  },
  {
    stroke: '#94E169', // Fresh Mint Lime
    pillBg: 'bg-[#A7E97F]',
    pillText: 'text-[#133326]',
    dotBg: 'bg-[#94E169]',
  },
  {
    stroke: '#C7F2AE', // Soft Botanical Mint
    pillBg: 'bg-[#D7F7C4]',
    pillText: 'text-[#133326]',
    dotBg: 'bg-[#C7F2AE]',
  },
  {
    stroke: '#DCE8DA', // Sage Grey-Green
    pillBg: 'bg-[#E5EEE3]',
    pillText: 'text-[#1E4A38]',
    dotBg: 'bg-[#DCE8DA]',
  },
  {
    stroke: '#BCC9BA', // Muted Sage
    pillBg: 'bg-[#D5DFD3]',
    pillText: 'text-[#133326]',
    dotBg: 'bg-[#BCC9BA]',
  },
];

function formatCompactMillions(val: number | null): string {
  if (val === null || isNaN(val)) return '—';
  if (val >= 1_000_000_000) {
    return `Rp${(val / 1_000_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} M`;
  }
  if (val >= 1_000_000) {
    return `Rp${(val / 1_000_000).toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} Jt`;
  }
  return formatCurrencyIDR(val);
}

export const ChannelShareDonut: React.FC<ChannelShareDonutProps> = ({
  records,
  onSelectChannel,
}) => {
  const [mode, setMode] = useState<DonutMetricMode>('revenue');
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  const channelBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        channel: string;
        adType: string;
        spend: number;
        revenue: number;
        orders: number;
        representativeRecord: AdsDailyRecord;
      }
    >();

    for (const r of records) {
      const key = `${r.channel}_${r.adType}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          channel: r.channel,
          adType: r.adType,
          spend: r.actualSpend ?? 0,
          revenue: r.actualRevenue ?? 0,
          orders: r.actualOrders ?? 0,
          representativeRecord: r,
        });
      } else {
        existing.spend += r.actualSpend ?? 0;
        existing.revenue += r.actualRevenue ?? 0;
        existing.orders += r.actualOrders ?? 0;
        if (
          r.reportDate > existing.representativeRecord.reportDate &&
          r.actualSpend !== null
        ) {
          existing.representativeRecord = r;
        }
      }
    }

    const totalRevenue = Array.from(map.values()).reduce((acc, c) => acc + c.revenue, 0);
    const totalSpend = Array.from(map.values()).reduce((acc, c) => acc + c.spend, 0);

    const items = Array.from(map.values())
      .map((item) => {
        const value = mode === 'revenue' ? item.revenue : item.spend;
        const total = mode === 'revenue' ? totalRevenue : totalSpend;
        const sharePct = total > 0 ? (value / total) * 100 : 0;
        const roas = item.spend > 0 && item.revenue > 0 ? item.revenue / item.spend : null;
        return {
          ...item,
          value,
          sharePct,
          roas,
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      items,
      totalRevenue,
      totalSpend,
      activeTotal: mode === 'revenue' ? totalRevenue : totalSpend,
    };
  }, [records, mode]);

  // SVG Donut ring geometry
  const size = 196;
  const strokeWidth = 26;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const segments = channelBreakdown.items
    .filter((item) => item.sharePct > 0)
    .map((item, idx) => {
      const style = SEGMENT_STYLES[idx % SEGMENT_STYLES.length];
      const pct = item.sharePct / 100;
      const gapAngle = channelBreakdown.items.filter((i) => i.sharePct > 0).length > 1 ? 3 : 0;
      const dashLength = Math.max(0, pct * circumference - gapAngle);
      const dashOffset = -cumulativePercent * circumference;
      cumulativePercent += pct;
      return {
        ...item,
        style,
        dashArray: `${dashLength} ${circumference}`,
        dashOffset,
      };
    });

  const activeHoveredItem = hoveredChannel
    ? channelBreakdown.items.find((i) => i.key === hoveredChannel)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-[#E2EBE0] shadow-card p-5 flex flex-col justify-between h-full">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EAF2E8] flex items-center justify-center text-[#133326]">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#133326] tracking-tight">
                Statistik Kanal
              </h3>
              <p className="text-2xs text-slate-500">Distribusi porsi per jenis iklan</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-semibold bg-[#EAF2E8] text-[#133326]">
            {channelBreakdown.items.length} Kanal
          </span>
        </div>

        {/* COINEST-style Dual Metric Tabs */}
        <div className="grid grid-cols-2 border-b border-[#E2EBE0] mb-5">
          <button
            type="button"
            onClick={() => setMode('revenue')}
            className={`pb-2.5 text-xs font-semibold transition-all text-center border-b-2 ${
              mode === 'revenue'
                ? 'border-[#133326] text-[#133326]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            GMV Ads ({formatCompactMillions(channelBreakdown.totalRevenue)})
          </button>
          <button
            type="button"
            onClick={() => setMode('spend')}
            className={`pb-2.5 text-xs font-semibold transition-all text-center border-b-2 ${
              mode === 'spend'
                ? 'border-[#133326] text-[#133326]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Spend ({formatCompactMillions(channelBreakdown.totalSpend)})
          </button>
        </div>

        {/* Center SVG Donut Ring */}
        <div className="relative flex items-center justify-center my-2">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#ECF2EB"
              strokeWidth={strokeWidth}
            />
            {segments.map((seg) => {
              const isHovered = hoveredChannel === seg.key;
              return (
                <circle
                  key={seg.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={seg.style.stroke}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="butt"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredChannel(seg.key)}
                  onMouseLeave={() => setHoveredChannel(null)}
                  onClick={() => onSelectChannel?.(seg.representativeRecord)}
                />
              );
            })}
          </svg>

          {/* Center Total Label inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
            <span className="text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5 truncate max-w-[115px]">
              {activeHoveredItem
                ? activeHoveredItem.adType.split('(')[0].trim()
                : mode === 'revenue'
                ? 'Total GMV Ads'
                : 'Total Spend'}
            </span>
            <span className="text-lg font-extrabold text-[#133326] tabular-nums leading-tight">
              {activeHoveredItem
                ? formatCompactMillions(activeHoveredItem.value)
                : formatCompactMillions(channelBreakdown.activeTotal)}
            </span>
            <span className="text-3xs font-semibold text-emerald-700 mt-0.5 tabular-nums">
              {activeHoveredItem
                ? `${Math.round(activeHoveredItem.sharePct)}% porsi`
                : '100% teralokasi'}
            </span>
          </div>
        </div>
      </div>

      {/* COINEST-style Percentage Pill Breakdown List */}
      <div className="space-y-2.5 mt-3 pt-3 border-t border-[#ECF2EB]">
        {channelBreakdown.items.map((item, idx) => {
          const style = SEGMENT_STYLES[idx % SEGMENT_STYLES.length];
          const pctRounded = Math.round(item.sharePct);
          const isHovered = hoveredChannel === item.key;
          const shortAdType = item.adType.split('(')[0].trim();

          return (
            <div
              key={item.key}
              title={item.adType}
              onMouseEnter={() => setHoveredChannel(item.key)}
              onMouseLeave={() => setHoveredChannel(null)}
              onClick={() => onSelectChannel?.(item.representativeRecord)}
              className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                isHovered ? 'bg-[#F6F9F5] ring-1 ring-[#DCE8DA]' : 'hover:bg-[#F6F9F5]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`inline-flex items-center justify-center min-w-[42px] px-2 py-1 rounded-lg text-xs font-bold tabular-nums shrink-0 ${style.pillBg} ${style.pillText}`}
                >
                  {pctRounded}%
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-[#133326] truncate">
                      {shortAdType}
                    </p>
                    {onSelectChannel && (
                      <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-3xs text-slate-500 tabular-nums">
                    {item.channel} • ROAS {formatRoas(item.roas)}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-[#133326] tabular-nums">
                  {formatCurrencyIDR(item.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
