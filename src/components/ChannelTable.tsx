import React, { useState, useMemo } from 'react';
import { AdsDailyRecord, ChannelAggregatedSummary } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
} from '../utils/formatters';
import { STATUS_CONFIG } from '../utils/statusConfig';
import { ChevronRight, Layers, Table as TableIcon } from 'lucide-react';

interface ChannelTableProps {
  records: AdsDailyRecord[];
  onSelectRecord: (record: AdsDailyRecord) => void;
}

export const ChannelTable: React.FC<ChannelTableProps> = ({
  records,
  onSelectRecord,
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'daily'>('summary');
  const [dailyFilter, setDailyFilter] = useState<string>('');

  // Compute aggregated summary per channel & adType
  const aggregatedSummaries: ChannelAggregatedSummary[] = useMemo(() => {
    const map = new Map<string, {
      channel: string;
      adType: string;
      spend: number;
      revenue: number;
      orders: number;
      hasSpend: boolean;
      hasRevenue: boolean;
      hasOrders: boolean;
      totalDays: number;
      verifiedDays: number;
      partialDays: number;
      issueDays: number;
      pic: string | null;
      latestRecord: AdsDailyRecord | null;
    }>();

    for (const r of records) {
      const key = `${r.channel}_${r.adType}`;
      const cur = map.get(key) || {
        channel: r.channel,
        adType: r.adType,
        spend: 0,
        revenue: 0,
        orders: 0,
        hasSpend: false,
        hasRevenue: false,
        hasOrders: false,
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

      if (!cur.latestRecord || r.reportDate > cur.latestRecord.reportDate) {
        cur.latestRecord = r;
      }

      map.set(key, cur);
    }

    return Array.from(map.values()).map(item => {
      const blendedRoas = item.hasSpend && item.spend > 0 ? item.revenue / item.spend : null;
      return {
        channel: item.channel,
        adType: item.adType,
        totalSpend: item.hasSpend ? item.spend : null,
        totalRevenue: item.hasRevenue ? item.revenue : null,
        totalOrders: item.hasOrders ? item.orders : null,
        blendedRoas,
        totalDays: item.totalDays,
        verifiedDays: item.verifiedDays,
        partialDays: item.partialDays,
        issueDays: item.issueDays,
        pic: item.latestRecord?.pic || item.pic || null,
        latestStatus: item.latestRecord?.status || 'unknown',
        latestPull: item.latestRecord?.pulledAt || null,
        latestNotes: item.latestRecord?.issueNotes || null,
      };
    });
  }, [records]);

  // Filtered daily records sorted newest to oldest
  const sortedDailyRecords = useMemo(() => {
    let list = [...records].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    if (dailyFilter) {
      const q = dailyFilter.toLowerCase();
      list = list.filter(
        r =>
          r.channel.toLowerCase().includes(q) ||
          r.adType.toLowerCase().includes(q) ||
          r.reportDate.includes(q)
      );
    }
    return list;
  }, [records, dailyFilter]);

  return (
    <section
      aria-label="Tabel Rincian Kanal Iklan"
      className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden mb-6"
    >
      {/* Table Header toolbar with View Mode Switcher */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">
              Performa per Kanal Iklan
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              {viewMode === 'summary' ? `${aggregatedSummaries.length} Kanal Aktif` : `${records.length} Baris Harian`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'summary'
              ? 'Akumulasi total belanja iklan, GMV atribusi, dan rasio ROAS terpadu untuk periode terpilih.'
              : 'Rincian data per tanggal penarikan harian.'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('summary')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'summary'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ringkasan Kanal</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Rincian Harian</span>
          </button>
        </div>
      </div>

      {viewMode === 'summary' ? (
        /* Summary View per Channel */
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Kanal</th>
                <th scope="col" className="px-4 py-3">Jenis Iklan</th>
                <th scope="col" className="px-4 py-3 text-right">Total Spend</th>
                <th scope="col" className="px-4 py-3 text-right">Total GMV Ads</th>
                <th scope="col" className="px-4 py-3 text-right">Paid Order</th>
                <th scope="col" className="px-4 py-3 text-right">Blended ROAS</th>
                <th scope="col" className="px-4 py-3">Kelengkapan Data</th>
                <th scope="col" className="px-4 py-3">Status Terkini</th>
                <th scope="col" className="px-4 py-3">PIC</th>
                <th scope="col" className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {aggregatedSummaries.map(item => {
                const statusMeta = STATUS_CONFIG[item.latestStatus] || STATUS_CONFIG.unknown;
                // Find a sample record for drawer inspection
                const sampleRecord = records.find(r => r.channel === item.channel && r.adType === item.adType);

                return (
                  <tr key={`${item.channel}_${item.adType}`} className="hover:bg-slate-50/70 transition-colors">
                    {/* Channel */}
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {item.channel}
                    </td>

                    {/* Ad Type */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[220px]">
                      {item.adType}
                    </td>

                    {/* Total Spend */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-slate-900 font-medium">
                      {item.totalSpend !== null ? (
                        formatCurrencyIDR(item.totalSpend)
                      ) : (
                        <span className="text-slate-400 font-sans">—</span>
                      )}
                    </td>

                    {/* Total GMV */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-slate-900 font-bold">
                      {item.totalRevenue !== null ? (
                        formatCurrencyIDR(item.totalRevenue)
                      ) : (
                        <span className="text-slate-400 font-sans font-normal">—</span>
                      )}
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-slate-900">
                      {item.totalOrders !== null ? (
                        formatNumber(item.totalOrders)
                      ) : (
                        <span className="text-slate-400 font-sans">—</span>
                      )}
                    </td>

                    {/* Blended ROAS */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums font-bold">
                      {item.blendedRoas !== null ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {formatRoas(item.blendedRoas)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans font-normal">—</span>
                      )}
                    </td>

                    {/* Coverage Days */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-semibold text-slate-900">{item.verifiedDays}</span>
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
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* PIC */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[140px] truncate" title={item.pic || '—'}>
                      {item.pic || '—'}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => sampleRecord && onSelectRecord(sampleRecord)}
                        aria-label={`Lihat detail kanal ${item.channel}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors"
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
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <input
              type="text"
              placeholder="Cari tanggal (misal 2026-10-15) atau kanal..."
              value={dailyFilter}
              onChange={e => setDailyFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded px-3 py-1.5 w-72 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="text-xs text-slate-500">
              Menampilkan {sortedDailyRecords.length} baris
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Tanggal</th>
                  <th scope="col" className="px-4 py-2.5">Kanal</th>
                  <th scope="col" className="px-4 py-2.5">Jenis Iklan</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Spend</th>
                  <th scope="col" className="px-4 py-2.5 text-right">GMV Ads</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Order</th>
                  <th scope="col" className="px-4 py-2.5 text-right">ROAS</th>
                  <th scope="col" className="px-4 py-2.5">Status Data</th>
                  <th scope="col" className="px-4 py-2.5">PIC</th>
                  <th scope="col" className="px-4 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedDailyRecords.slice(0, 100).map(record => {
                  const statusMeta = STATUS_CONFIG[record.status] || STATUS_CONFIG.unknown;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs text-slate-800">
                        {record.reportDate}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900 text-xs">
                        {record.channel}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[180px] truncate" title={record.adType}>
                        {record.adType}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right font-mono tabular-nums text-xs text-slate-900">
                        {record.actualSpend !== null ? formatCurrencyIDR(record.actualSpend) : '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right font-mono tabular-nums text-xs font-semibold text-slate-900">
                        {record.actualRevenue !== null ? formatCurrencyIDR(record.actualRevenue) : '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right font-mono tabular-nums text-xs text-slate-900">
                        {record.actualOrders !== null ? formatNumber(record.actualOrders) : '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right font-mono tabular-nums text-xs font-semibold text-emerald-700">
                        {record.sourceRoas !== null ? formatRoas(record.sourceRoas) : '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[120px] truncate" title={record.pic || ''}>
                        {record.pic || '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => onSelectRecord(record)}
                          className="px-2 py-0.5 text-2xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded"
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
