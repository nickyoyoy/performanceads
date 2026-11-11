import React, { useState, useMemo } from 'react';
import { AdsDailyRecord, ChannelAggregatedSummary, AdsDataStatus } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
} from '../utils/formatters';
import { STATUS_CONFIG } from '../utils/statusConfig';
import {
  ChevronRight,
  Layers,
  Table as TableIcon,
  Search,
} from 'lucide-react';

interface ChannelTableProps {
  records: AdsDailyRecord[];
  onSelectRecord: (record: AdsDailyRecord) => void;
  defaultView?: 'summary' | 'daily';
}

export const ChannelTable: React.FC<ChannelTableProps> = ({
  records,
  onSelectRecord,
  defaultView = 'summary',
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'daily'>(defaultView);
  const [dailyFilter, setDailyFilter] = useState<string>('');

  // Aggregated data per channel + adType across selected period
  const aggregatedSummaries: ChannelAggregatedSummary[] = useMemo(() => {
    const map = new Map<
      string,
      {
        channel: string;
        adType: string;
        spend: number;
        revenue: number;
        orders: number;
        targetSpend: number;
        targetRevenue: number;
        targetOrders: number;
        hasSpend: boolean;
        hasRevenue: boolean;
        hasOrders: boolean;
        hasTargetSpend: boolean;
        hasTargetRevenue: boolean;
        hasTargetOrders: boolean;
        totalDays: number;
        verifiedDays: number;
        partialDays: number;
        issueDays: number;
        pic: string | null;
        latestRecord: AdsDailyRecord | null;
      }
    >();

    for (const r of records) {
      const key = `${r.channel}_${r.adType}`;
      const cur = map.get(key) || {
        channel: r.channel,
        adType: r.adType,
        spend: 0,
        revenue: 0,
        orders: 0,
        targetSpend: 0,
        targetRevenue: 0,
        targetOrders: 0,
        hasSpend: false,
        hasRevenue: false,
        hasOrders: false,
        hasTargetSpend: false,
        hasTargetRevenue: false,
        hasTargetOrders: false,
        totalDays: 0,
        verifiedDays: 0,
        partialDays: 0,
        issueDays: 0,
        pic: r.pic,
        latestRecord: null,
      };

      cur.totalDays++;
      if (r.status === 'verified') cur.verifiedDays++;
      else if (r.status === 'partial') cur.partialDays++;
      else cur.issueDays++;

      // Actuals
      if (r.actualSpend !== null) {
        cur.spend += r.actualSpend;
        cur.hasSpend = true;
      }
      if (r.actualRevenue !== null) {
        cur.revenue += r.actualRevenue;
        cur.hasRevenue = true;
      }
      if (r.actualOrders !== null) {
        cur.orders += r.actualOrders;
        cur.hasOrders = true;
      }

      // Targets
      if (r.targetSpend !== null) {
        cur.targetSpend += r.targetSpend;
        cur.hasTargetSpend = true;
      }
      if (r.targetRevenue !== null) {
        cur.targetRevenue += r.targetRevenue;
        cur.hasTargetRevenue = true;
      }
      if (r.targetOrders !== null) {
        cur.targetOrders += r.targetOrders;
        cur.hasTargetOrders = true;
      }

      const isEvaluatedRow =
        r.actualSpend !== null ||
        r.actualRevenue !== null ||
        r.pulledAt !== null ||
        (r.status !== 'unknown' && r.status !== 'pending');
      const curIsEvaluated =
        cur.latestRecord &&
        (cur.latestRecord.actualSpend !== null ||
          cur.latestRecord.actualRevenue !== null ||
          cur.latestRecord.pulledAt !== null ||
          (cur.latestRecord.status !== 'unknown' &&
            cur.latestRecord.status !== 'pending'));

      if (
        !cur.latestRecord ||
        (isEvaluatedRow && !curIsEvaluated) ||
        (isEvaluatedRow === Boolean(curIsEvaluated) &&
          r.reportDate >= cur.latestRecord.reportDate)
      ) {
        cur.latestRecord = r;
      }

      map.set(key, cur);
    }

    const totalPeriodSpend = Array.from(map.values()).reduce(
      (acc, cur) => acc + (cur.hasSpend ? cur.spend : 0),
      0
    );
    const totalPeriodRevenue = Array.from(map.values()).reduce(
      (acc, cur) => acc + (cur.hasRevenue ? cur.revenue : 0),
      0
    );

    return Array.from(map.values()).map((item) => {
      const blendedRoas =
        item.hasSpend && item.spend > 0 ? item.revenue / item.spend : null;
      const targetRoas =
        item.hasTargetSpend && item.targetSpend > 0
          ? item.targetRevenue / item.targetSpend
          : null;
      const spendShare =
        totalPeriodSpend > 0 && item.hasSpend
          ? (item.spend / totalPeriodSpend) * 100
          : 0;
      const revenueShare =
        totalPeriodRevenue > 0 && item.hasRevenue
          ? (item.revenue / totalPeriodRevenue) * 100
          : 0;

      const spendAchievementPct =
        item.hasSpend && item.hasTargetSpend && item.targetSpend > 0
          ? (item.spend / item.targetSpend) * 100
          : null;
      const revenueAchievementPct =
        item.hasRevenue && item.hasTargetRevenue && item.targetRevenue > 0
          ? (item.revenue / item.targetRevenue) * 100
          : null;
      const ordersAchievementPct =
        item.hasOrders && item.hasTargetOrders && item.targetOrders > 0
          ? (item.orders / item.targetOrders) * 100
          : null;

      return {
        channel: item.channel,
        adType: item.adType,
        totalSpend: item.hasSpend ? item.spend : null,
        totalTargetSpend: item.hasTargetSpend ? item.targetSpend : null,
        spendAchievementPct,
        totalRevenue: item.hasRevenue ? item.revenue : null,
        totalTargetRevenue: item.hasTargetRevenue ? item.targetRevenue : null,
        revenueAchievementPct,
        totalOrders: item.hasOrders ? item.orders : null,
        totalTargetOrders: item.hasTargetOrders ? item.targetOrders : null,
        ordersAchievementPct,
        blendedRoas,
        targetRoas,
        spendShare,
        revenueShare,
        totalDays: item.totalDays,
        verifiedDays: item.verifiedDays,
        partialDays: item.partialDays,
        issueDays: item.issueDays,
        pic: item.latestRecord?.pic || item.pic || null,
        latestStatus: (item.latestRecord?.status || 'unknown') as AdsDataStatus,
        latestPull: item.latestRecord?.pulledAt || null,
        latestNotes: item.latestRecord?.issueNotes || null,
      };
    });
  }, [records]);

  // Filtered daily records sorted newest to oldest
  const sortedDailyRecords = useMemo(() => {
    let list = [...records].sort((a, b) =>
      b.reportDate.localeCompare(a.reportDate)
    );
    if (dailyFilter) {
      const q = dailyFilter.toLowerCase();
      list = list.filter(
        (r) =>
          r.channel.toLowerCase().includes(q) ||
          r.adType.toLowerCase().includes(q) ||
          r.reportDate.includes(q) ||
          (r.pic && r.pic.toLowerCase().includes(q))
      );
    }
    return list;
  }, [records, dailyFilter]);

  return (
    <section
      aria-label="Tabel Rincian Kanal Iklan"
      className="bg-white rounded-2xl border border-[#E2EBE0] shadow-card overflow-hidden mb-6"
    >
      {/* Table Header toolbar with View Mode Switcher (COINEST "Recent Transactions" style) */}
      <div className="p-5 border-b border-[#ECF2EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-[#133326] tracking-tight">
              Performa per Kanal Iklan
            </h2>
            <span className="text-2xs bg-[#EAF2E8] text-[#133326] px-2.5 py-0.5 rounded-full font-mono font-bold">
              {aggregatedSummaries.length} Kanal Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan realisasi dan target spend, revenue GMV, volume order, serta blended ROAS.
          </p>
        </div>

        {/* View Switcher: Summary vs Daily Breakdown */}
        <div className="inline-flex rounded-full border border-[#E2EBE0] p-1 bg-[#F6F9F5] self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('summary')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
              viewMode === 'summary'
                ? 'bg-[#133326] text-white shadow-2xs'
                : 'text-slate-600 hover:text-[#133326]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ringkasan Kanal</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all ${
              viewMode === 'daily'
                ? 'bg-[#133326] text-white shadow-2xs'
                : 'text-slate-600 hover:text-[#133326]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Rincian Harian ({records.length})</span>
          </button>
        </div>
      </div>

      {viewMode === 'summary' ? (
        /* Summary View per Channel & Ad Type */
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#ECF2EB] text-left text-sm">
            {/* COINEST Signature Soft Sage Green Table Header */}
            <thead className="bg-[#EAF2E8] text-[#133326] font-bold text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-3.5 py-3.5">
                  Kanal
                </th>
                <th scope="col" className="px-3.5 py-3.5">
                  Jenis Iklan
                </th>
                <th scope="col" className="px-3.5 py-3.5 text-right">
                  Realisasi & Target Spend
                </th>
                <th scope="col" className="px-3.5 py-3.5 text-right">
                  Realisasi & Target GMV
                </th>
                <th scope="col" className="px-3.5 py-3.5 text-right">
                  Paid Order
                </th>
                <th scope="col" className="px-3.5 py-3.5 text-right">
                  Blended ROAS
                </th>
                <th scope="col" className="px-3.5 py-3.5">
                  Kelengkapan Data
                </th>
                <th scope="col" className="px-3.5 py-3.5">
                  Status Terkini
                </th>
                <th scope="col" className="px-3.5 py-3.5">
                  PIC
                </th>
                <th scope="col" className="px-3.5 py-3.5 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECF2EB] bg-white">
              {aggregatedSummaries.map((item) => {
                const statusMeta =
                  STATUS_CONFIG[item.latestStatus] || STATUS_CONFIG.unknown;
                const matchingRecords = records
                  .filter(
                    (r) =>
                      r.channel === item.channel && r.adType === item.adType
                  )
                  .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
                const sampleRecord =
                  matchingRecords.find(
                    (r) => r.actualSpend !== null || r.actualRevenue !== null
                  ) || matchingRecords[0];

                return (
                  <tr
                    key={`${item.channel}_${item.adType}`}
                    className="hover:bg-[#F6F9F5] transition-colors"
                  >
                    {/* Channel */}
                    <td className="px-3.5 py-3.5 font-bold text-[#133326] whitespace-nowrap">
                      {item.channel}
                    </td>

                    {/* Ad Type */}
                    <td className="px-3.5 py-3.5 text-xs text-slate-600 max-w-[180px]">
                      {item.adType}
                    </td>

                    {/* Total Spend */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-[#133326] font-medium">
                      {item.totalSpend !== null ? (
                        <div>
                          <div>{formatCurrencyIDR(item.totalSpend)}</div>
                          <div className="flex items-center justify-end gap-1 text-3xs text-slate-500 font-sans font-normal">
                            <span>{item.spendShare.toFixed(1)}% porsi</span>
                            {item.totalTargetSpend !== null && (
                              <>
                                <span>&bull;</span>
                                <span
                                  className={
                                    item.spendAchievementPct &&
                                    item.spendAchievementPct > 105
                                      ? 'text-amber-700 font-semibold'
                                      : 'text-slate-600'
                                  }
                                >
                                  Tgt: {formatCurrencyIDR(item.totalTargetSpend)} (
                                  {item.spendAchievementPct?.toFixed(0)}%)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 font-sans">—</span>
                          {item.totalTargetSpend !== null && (
                            <div className="text-3xs text-slate-400 font-sans">
                              Tgt: {formatCurrencyIDR(item.totalTargetSpend)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Total GMV */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-[#133326] font-bold">
                      {item.totalRevenue !== null ? (
                        <div>
                          <div>{formatCurrencyIDR(item.totalRevenue)}</div>
                          <div className="flex items-center justify-end gap-1 text-3xs font-sans">
                            <span className="text-emerald-700 font-semibold">
                              {item.revenueShare.toFixed(1)}% porsi
                            </span>
                            {item.totalTargetRevenue !== null && (
                              <>
                                <span className="text-slate-300">&bull;</span>
                                <span
                                  className={`font-semibold ${
                                    item.revenueAchievementPct &&
                                    item.revenueAchievementPct >= 100
                                      ? 'text-emerald-700'
                                      : 'text-[#133326]'
                                  }`}
                                >
                                  Tgt: {formatCurrencyIDR(item.totalTargetRevenue)} (
                                  {item.revenueAchievementPct?.toFixed(0)}%)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 font-sans font-normal">
                            —
                          </span>
                          {item.totalTargetRevenue !== null && (
                            <div className="text-3xs text-slate-400 font-sans">
                              Tgt: {formatCurrencyIDR(item.totalTargetRevenue)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Orders */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-[#133326]">
                      {item.totalOrders !== null ? (
                        <div>
                          <div>{formatNumber(item.totalOrders)}</div>
                          {item.totalTargetOrders !== null && (
                            <div className="text-3xs text-slate-500 font-sans font-normal">
                              Tgt: {formatNumber(item.totalTargetOrders)} (
                              {item.ordersAchievementPct?.toFixed(0)}%)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 font-sans">—</span>
                          {item.totalTargetOrders !== null && (
                            <div className="text-3xs text-slate-400 font-sans">
                              Tgt: {formatNumber(item.totalTargetOrders)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Blended ROAS */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-right font-mono tabular-nums font-bold">
                      {item.blendedRoas !== null ? (
                        <div>
                          <span className="text-[#133326] bg-[#D7F7C4] px-2.5 py-0.5 rounded-full text-xs">
                            {formatRoas(item.blendedRoas)}
                          </span>
                          {item.targetRoas !== null && (
                            <div className="text-3xs text-slate-500 font-sans font-normal mt-1">
                              Tgt: {formatRoas(item.targetRoas)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-slate-400 font-sans font-normal">
                            —
                          </span>
                          {item.targetRoas !== null && (
                            <div className="text-3xs text-slate-500 font-sans font-normal mt-0.5">
                              Tgt: {formatRoas(item.targetRoas)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Coverage Days */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-mono">
                        <span className="font-bold text-[#133326]">
                          {item.verifiedDays}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span>{item.totalDays} hari</span>
                      </div>
                      {item.issueDays > 0 && (
                        <div className="text-2xs text-amber-700 mt-0.5">
                          {item.issueDays} hari terkendala
                        </div>
                      )}
                    </td>

                    {/* Latest Status */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`}
                        />
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* PIC */}
                    <td
                      className="px-3.5 py-3.5 text-xs text-slate-600 max-w-[120px] truncate"
                      title={item.pic || '—'}
                    >
                      {item.pic || '—'}
                    </td>

                    {/* Action */}
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() =>
                          sampleRecord && onSelectRecord(sampleRecord)
                        }
                        aria-label={`Lihat detail kanal ${item.channel}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#133326] bg-[#EAF2E8] hover:bg-[#A7E97F] rounded-full transition-colors"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Daily Breakdown View */
        <div>
          <div className="p-3.5 bg-[#F6F9F5] border-b border-[#E2EBE0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari tanggal (2026-11-05), kanal, atau PIC..."
                value={dailyFilter}
                onChange={(e) => setDailyFilter(e.target.value)}
                className="w-full text-xs bg-white border border-[#DCE8DA] rounded-full pl-9 pr-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#133326]"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan {sortedDailyRecords.length} baris data
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-[#ECF2EB] text-left text-sm">
              <thead className="bg-[#EAF2E8] text-[#133326] font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Tanggal
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Kanal
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Jenis Iklan
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Spend
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    GMV Ads
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    ROAS
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status Data
                  </th>
                  <th scope="col" className="px-4 py-3">
                    PIC
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF2EB] bg-white">
                {sortedDailyRecords.slice(0, 100).map((record) => {
                  const statusMeta =
                    STATUS_CONFIG[record.status] || STATUS_CONFIG.unknown;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-[#F6F9F5] transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[#133326] font-medium">
                        {record.reportDate}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#133326] text-xs whitespace-nowrap">
                        {record.channel}
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate"
                        title={record.adType}
                      >
                        {record.adType}
                      </td>

                      {/* Spend */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums text-xs text-[#133326]">
                        {record.actualSpend !== null ? (
                          <div>
                            <div>{formatCurrencyIDR(record.actualSpend)}</div>
                            {record.targetSpend !== null && (
                              <div className="text-3xs text-slate-400 font-sans">
                                Tgt: {formatCurrencyIDR(record.targetSpend)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-sans">—</span>
                            {record.targetSpend !== null && (
                              <div className="text-3xs text-slate-400 font-sans">
                                Tgt: {formatCurrencyIDR(record.targetSpend)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* GMV Ads */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums text-xs font-bold text-[#133326]">
                        {record.actualRevenue !== null ? (
                          <div>
                            <div>{formatCurrencyIDR(record.actualRevenue)}</div>
                            {record.targetRevenue !== null && (
                              <div className="text-3xs text-emerald-700 font-sans font-medium">
                                Tgt: {formatCurrencyIDR(record.targetRevenue)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-sans font-normal">
                              —
                            </span>
                            {record.targetRevenue !== null && (
                              <div className="text-3xs text-slate-400 font-sans">
                                Tgt: {formatCurrencyIDR(record.targetRevenue)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums text-xs text-[#133326]">
                        {record.actualOrders !== null ? (
                          <div>
                            <div>{formatNumber(record.actualOrders)}</div>
                            {record.targetOrders !== null && (
                              <div className="text-3xs text-slate-400 font-sans">
                                Tgt: {formatNumber(record.targetOrders)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 font-sans">—</span>
                            {record.targetOrders !== null && (
                              <div className="text-3xs text-slate-400 font-sans">
                                Tgt: {formatNumber(record.targetOrders)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* ROAS */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-mono tabular-nums text-xs font-bold text-emerald-700">
                        {record.sourceRoas !== null
                          ? formatRoas(record.sourceRoas)
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`}
                          />
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* PIC */}
                      <td
                        className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate"
                        title={record.pic || ''}
                      >
                        {record.pic || '—'}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(record)}
                          aria-label={`Rincian data ${record.channel} ${record.reportDate}`}
                          className="px-2.5 py-1 text-xs text-[#133326] bg-[#EAF2E8] hover:bg-[#A7E97F] rounded-full font-bold transition-colors"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
