import React from 'react';
import { AdsDailyRecord } from '../types/ads';
import { STATUS_CONFIG } from '../utils/statusConfig';
import { formatDateWIB, formatPercent } from '../utils/formatters';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  ChevronRight,
} from 'lucide-react';

interface DataHealthSectionProps {
  records: AdsDailyRecord[];
  onSelectRecord: (record: AdsDailyRecord) => void;
}

export const DataHealthSection: React.FC<DataHealthSectionProps> = ({
  records,
  onSelectRecord,
}) => {
  // Aggregate operational health summary
  const totalSources = records.length;
  const verifiedSources = records.filter((r) => r.status === 'verified').length;
  const issueSources = records.filter(
    (r) =>
      r.status === 'authentication_required' ||
      r.status === 'unavailable' ||
      r.status === 'api_error'
  ).length;
  const coveragePercent = totalSources > 0 ? verifiedSources / totalSources : 0;

  // Find latest successful pull
  const verifiedRecords = records.filter(
    (r) => r.status === 'verified' && r.pulledAt
  );
  const lastSuccessfulPull =
    verifiedRecords.length > 0 ? verifiedRecords[0].pulledAt : null;

  return (
    <section
      id="data-health"
      aria-label="Kesehatan Data dan Integrasi Sistem"
      className="bg-white rounded-2xl border border-[#E2EBE0] p-5 sm:p-6 shadow-card mb-6 scroll-mt-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF2E8] text-[#133326] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#133326] tracking-tight">
              Data Health & Status Integrasi Operasional
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Diagnostik ketersediaan data, kegagalan otentikasi API, dan eskalasi PIC penanggung jawab penarikan.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#F6F9F5] border border-[#E2EBE0] px-3.5 py-2 rounded-full text-slate-600 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-[#133326]" />
          <span>Last Successful Pull: </span>
          <strong className="text-[#133326] font-mono">
            {formatDateWIB(lastSuccessfulPull)}
          </strong>
        </div>
      </div>

      {/* Health Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-[#F6F9F5] border border-[#E2EBE0] rounded-2xl p-4">
          <div className="text-2xs font-bold uppercase text-slate-500">
            Total Sumber Diharapkan
          </div>
          <div className="text-2xl font-extrabold text-[#133326] mt-1 font-mono">
            {totalSources}
          </div>
        </div>

        <div className="bg-[#E5F8D8]/60 border border-[#B9EB9B] rounded-2xl p-4">
          <div className="text-2xs font-bold uppercase text-[#133326] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Terverifikasi (Aktif)
          </div>
          <div className="text-2xl font-extrabold text-[#133326] mt-1 font-mono">
            {verifiedSources}
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
          <div className="text-2xs font-bold uppercase text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Perlu Penanganan
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1 font-mono">
            {issueSources}
          </div>
        </div>

        <div className="bg-[#EAF2E8] border border-[#DCE8DA] rounded-2xl p-4">
          <div className="text-2xs font-bold uppercase text-[#133326]">
            Data Coverage
          </div>
          <div className="text-2xl font-extrabold text-[#133326] mt-1 font-mono">
            {formatPercent(coveragePercent)}
          </div>
        </div>
      </div>

      {/* Per-source list */}
      <div className="divide-y divide-[#ECF2EB] border border-[#E2EBE0] rounded-2xl overflow-hidden">
        {records.map((record) => {
          const statusMeta =
            STATUS_CONFIG[record.status] || STATUS_CONFIG.unknown;
          const isHealthy = record.status === 'verified';

          let shortIssue = 'Tidak ada kendala, penarikan API berjalan normal.';
          if (record.status === 'verified') {
            shortIssue = 'Data API terverifikasi normal (Shopee Open API v2).';
          } else if (record.channel.toLowerCase().includes('meta')) {
            shortIssue =
              'Sesi Ads Manager tidak tersedia (login wall Facebook / butuh relogin PIC Azhar).';
          } else if (record.channel.toLowerCase().includes('tiktok')) {
            shortIssue = 'Login Seller Center membutuhkan OTP SMS.';
          } else if (record.issueNotes) {
            shortIssue = record.issueNotes;
          }

          return (
            <div
              key={record.id}
              className="p-4 hover:bg-[#F6F9F5] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-[#133326]">
                    {record.channel} — {record.adType}
                  </span>
                  <span className="text-2xs font-mono text-slate-400">
                    ({record.reportDate})
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`}
                    />
                    {statusMeta.label}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last Pull: {formatDateWIB(record.pulledAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 truncate max-w-sm">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">PIC: {record.pic || '—'}</span>
                  </div>
                </div>

                <div className="mt-2 text-xs">
                  <span className="font-bold text-[#133326]">
                    Status Operasional:{' '}
                  </span>
                  <span
                    className={
                      isHealthy
                        ? 'text-emerald-700 font-semibold'
                        : 'text-amber-800'
                    }
                  >
                    {shortIssue}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRecord(record)}
                className="self-start sm:self-center inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-[#133326] bg-[#EAF2E8] hover:bg-[#A7E97F] rounded-full transition-colors shrink-0"
              >
                <span>Periksa Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
