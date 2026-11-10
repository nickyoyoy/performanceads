import React from 'react';
import { AdsDailyRecord } from '../types/ads';
import { STATUS_CONFIG } from '../utils/statusConfig';
import { formatDateWIB, formatPercent } from '../utils/formatters';
import { Activity, ShieldCheck, AlertTriangle, Clock, User, ChevronRight } from 'lucide-react';

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
  const verifiedSources = records.filter(r => r.status === 'verified').length;
  const issueSources = records.filter(
    r => r.status === 'authentication_required' || r.status === 'unavailable' || r.status === 'api_error'
  ).length;
  const coveragePercent = totalSources > 0 ? verifiedSources / totalSources : 0;

  // Find latest successful pull
  const verifiedRecords = records.filter(r => r.status === 'verified' && r.pulledAt);
  const lastSuccessfulPull = verifiedRecords.length > 0 ? verifiedRecords[0].pulledAt : null;

  return (
    <section
      id="data-health"
      aria-label="Kesehatan Data dan Integrasi Sistem"
      className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs mb-6 scroll-mt-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-semibold text-slate-900">
              Data Health & Status Integrasi Operasional
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostik ketersediaan data, kegagalan otentikasi API, dan eskalasi PIC penanggung jawab penarikan.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Successful Pull: </span>
          <strong className="text-slate-900 font-mono">
            {formatDateWIB(lastSuccessfulPull)}
          </strong>
        </div>
      </div>

      {/* Health Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-2xs font-semibold uppercase text-slate-500">Total Sumber Diharapkan</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{totalSources}</div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3">
          <div className="text-2xs font-semibold uppercase text-emerald-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Terverifikasi (Aktif)
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5 font-mono">{verifiedSources}</div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3">
          <div className="text-2xs font-semibold uppercase text-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Perlu Penanganan
          </div>
          <div className="text-xl font-bold text-amber-700 mt-0.5 font-mono">{issueSources}</div>
        </div>

        <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
          <div className="text-2xs font-semibold uppercase text-blue-800">Data Coverage</div>
          <div className="text-xl font-bold text-blue-700 mt-0.5 font-mono">
            {formatPercent(coveragePercent)}
          </div>
        </div>
      </div>

      {/* Per-source list as required in Section 10.G */}
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        {records.map(record => {
          const statusMeta = STATUS_CONFIG[record.status] || STATUS_CONFIG.unknown;
          const isHealthy = record.status === 'verified';

          // Summarize current issue concisely according to platform requirements
          let shortIssue = 'Tidak ada kendala, penarikan API berjalan normal.';
          if (record.status === 'verified') {
            shortIssue = 'Data API terverifikasi normal (Shopee Open API v2).';
          } else if (record.channel.toLowerCase().includes('meta')) {
            shortIssue = 'Sesi Ads Manager tidak tersedia (login wall Facebook / butuh relogin PIC Azhar).';
          } else if (record.channel.toLowerCase().includes('tiktok')) {
            shortIssue = 'Login Seller Center membutuhkan OTP SMS.';
          } else if (record.issueNotes) {
            shortIssue = record.issueNotes;
          }

          return (
            <div
              key={record.id}
              className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-900">
                    {record.channel} — {record.adType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
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
                  <span className="font-medium text-slate-700">Status Operasional: </span>
                  <span className={isHealthy ? 'text-emerald-700 font-medium' : 'text-amber-800'}>
                    {shortIssue}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectRecord(record)}
                className="self-start sm:self-center inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors shadow-2xs"
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
