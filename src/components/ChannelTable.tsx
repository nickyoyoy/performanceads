import React from 'react';
import { AdsDailyRecord } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
  formatDateWIB,
} from '../utils/formatters';
import { STATUS_CONFIG } from '../utils/statusConfig';
import { ChevronRight } from 'lucide-react';

interface ChannelTableProps {
  records: AdsDailyRecord[];
  onSelectRecord: (record: AdsDailyRecord) => void;
}

export const ChannelTable: React.FC<ChannelTableProps> = ({
  records,
  onSelectRecord,
}) => {
  return (
    <section
      aria-label="Tabel Rincian Kanal Iklan"
      className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden mb-6"
    >
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Performa per Kanal Iklan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rincian realisasi metrik belanja, perolehan pesanan, dan status operasional integrasi.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Menampilkan <span className="font-semibold text-slate-900">{records.length}</span> baris
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-4 py-3">Kanal</th>
              <th scope="col" className="px-4 py-3">Jenis Iklan</th>
              <th scope="col" className="px-4 py-3 text-right">Spend</th>
              <th scope="col" className="px-4 py-3 text-right">GMV Ads</th>
              <th scope="col" className="px-4 py-3 text-right">Paid Order</th>
              <th scope="col" className="px-4 py-3 text-right">ROAS</th>
              <th scope="col" className="px-4 py-3">Status Data</th>
              <th scope="col" className="px-4 py-3">Waktu Tarik</th>
              <th scope="col" className="px-4 py-3">PIC</th>
              <th scope="col" className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {records.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Tidak ada data yang sesuai dengan filter yang dipilih.
                </td>
              </tr>
            ) : (
              records.map(record => {
                const statusMeta = STATUS_CONFIG[record.status] || STATUS_CONFIG.unknown;

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/70 transition-colors focus-within:bg-slate-50"
                  >
                    {/* Channel */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-900">
                      {record.channel}
                    </td>

                    {/* Ad Type */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[200px] truncate" title={record.adType}>
                      {record.adType}
                    </td>

                    {/* Spend */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-slate-900">
                      {record.actualSpend !== null ? (
                        formatCurrencyIDR(record.actualSpend)
                      ) : (
                        <span className="text-slate-400 font-sans" title="Data tidak tersedia">—</span>
                      )}
                    </td>

                    {/* GMV Ads */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-slate-900 font-semibold">
                      {record.actualRevenue !== null ? (
                        formatCurrencyIDR(record.actualRevenue)
                      ) : (
                        <span className="text-slate-400 font-sans font-normal" title="Data tidak tersedia">—</span>
                      )}
                    </td>

                    {/* Paid Orders */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums text-slate-900">
                      {record.actualOrders !== null ? (
                        formatNumber(record.actualOrders)
                      ) : (
                        <span className="text-slate-400 font-sans" title="Data tidak tersedia">—</span>
                      )}
                    </td>

                    {/* ROAS */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono tabular-nums font-semibold">
                      {record.sourceRoas !== null ? (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {formatRoas(record.sourceRoas)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans font-normal" title="Data tidak tersedia">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Last Pull */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {formatDateWIB(record.pulledAt)}
                    </td>

                    {/* PIC */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[140px] truncate" title={record.pic || '—'}>
                      {record.pic || '—'}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => onSelectRecord(record)}
                        aria-label={`Lihat detail untuk kanal ${record.channel} ${record.adType}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

