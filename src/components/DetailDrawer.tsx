import React, { useEffect, useRef } from 'react';
import { AdsDailyRecord } from '../types/ads';
import {
  formatCurrencyIDR,
  formatNumber,
  formatRoas,
  formatDateWIB,
} from '../utils/formatters';
import { STATUS_CONFIG } from '../utils/statusConfig';
import { X, ExternalLink, ShieldCheck, AlertTriangle, Clock, User, Layers, FileText } from 'lucide-react';

interface DetailDrawerProps {
  record: AdsDailyRecord | null;
  onClose: () => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({ record, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (record) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [record, onClose]);

  if (!record) return null;

  const statusMeta = STATUS_CONFIG[record.status] || STATUS_CONFIG.unknown;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                  {record.channel}
                </span>
                <h3 id="drawer-title" className="text-lg font-bold text-slate-900 mt-0.5">
                  {record.adType}
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Tutup panel rincian"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                {statusMeta.label}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ID: {record.id}
              </span>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="p-6 space-y-6 flex-1 text-sm text-slate-700">
            {/* Metric Overview Grid: Realisasi vs Target */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Perbandingan Realisasi & Target Metrik
                </h4>
                <span className="text-2xs text-slate-400 font-mono">
                  Sumber: Spreadsheet DB ADS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {/* Spend */}
                <div className="bg-white p-3 rounded-md border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-2xs font-semibold uppercase text-slate-500">
                    <span>Spend Iklan</span>
                    {record.actualSpend !== null && record.targetSpend !== null && record.targetSpend > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-3xs font-bold ${
                        (record.actualSpend / record.targetSpend) > 1.05
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {((record.actualSpend / record.targetSpend) * 100).toFixed(0)}% budget
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {formatCurrencyIDR(record.actualSpend)}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400">Target:</span>
                    <span className="font-semibold text-slate-700">
                      {record.targetSpend !== null ? formatCurrencyIDR(record.targetSpend) : '—'}
                    </span>
                  </div>
                </div>

                {/* GMV Ads */}
                <div className="bg-white p-3 rounded-md border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-2xs font-semibold uppercase text-slate-500">
                    <span>GMV Ads</span>
                    {record.actualRevenue !== null && record.targetRevenue !== null && record.targetRevenue > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-3xs font-bold ${
                        (record.actualRevenue / record.targetRevenue) >= 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {((record.actualRevenue / record.targetRevenue) * 100).toFixed(0)}% tercapai
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {formatCurrencyIDR(record.actualRevenue)}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400">Target:</span>
                    <span className="font-semibold text-slate-700">
                      {record.targetRevenue !== null ? formatCurrencyIDR(record.targetRevenue) : '—'}
                    </span>
                  </div>
                </div>

                {/* Paid Order */}
                <div className="bg-white p-3 rounded-md border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-2xs font-semibold uppercase text-slate-500">
                    <span>Paid Order</span>
                    {record.actualOrders !== null && record.targetOrders !== null && record.targetOrders > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-3xs font-bold ${
                        (record.actualOrders / record.targetOrders) >= 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {((record.actualOrders / record.targetOrders) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono tabular-nums mt-1">
                    {formatNumber(record.actualOrders)}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400">Target:</span>
                    <span className="font-semibold text-slate-700">
                      {record.targetOrders !== null ? `${formatNumber(record.targetOrders)} order` : '—'}
                    </span>
                  </div>
                </div>

                {/* ROAS */}
                <div className="bg-white p-3 rounded-md border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-2xs font-semibold uppercase text-slate-500">
                    <span>Blended ROAS</span>
                    {record.sourceRoas !== null && record.targetRevenue !== null && record.targetSpend !== null && record.targetSpend > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-3xs font-bold ${
                        record.sourceRoas >= (record.targetRevenue / record.targetSpend)
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.sourceRoas >= (record.targetRevenue / record.targetSpend) ? 'Tercapai' : 'Di bawah'}
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold text-emerald-700 font-mono tabular-nums mt-1">
                    {formatRoas(record.sourceRoas)}
                  </div>
                  <div className="text-2xs text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400">Target:</span>
                    <span className="font-semibold text-slate-700">
                      {
                        record.targetRevenue !== null && record.targetSpend !== null && record.targetSpend > 0
                          ? formatRoas(record.targetRevenue / record.targetSpend)
                          : '—'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Informasi Penarikan & Periode
              </h4>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Waktu Tarik Data</div>
                  <div className="font-medium text-slate-800">
                    {formatDateWIB(record.pulledAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Periode Observasi & Cutoff</div>
                  <div className="font-medium text-slate-800">
                    {record.periodStart || '—'} s/d {record.periodEnd || '—'}
                  </div>
                  {record.cutoff && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Cutoff: {record.cutoff}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">PIC Penanggung Jawab</div>
                  <div className="font-medium text-slate-800">
                    {record.pic || 'Belum ditugaskan'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sumber Metrik */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Sumber Metrik
              </h4>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-800 leading-relaxed font-mono">
                {record.metricSource || 'Sumber belum tercatat'}
              </div>
            </div>

            {/* Kendala / Catatan */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                {record.status === 'verified' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                )}
                Kendala / Catatan Operasional
              </h4>
              <div className="p-3 bg-amber-50/60 rounded-md border border-amber-200 text-xs text-slate-800 leading-relaxed">
                {record.issueNotes || 'Tidak ada catatan atau kendala tercatat.'}
              </div>
            </div>

            {/* Internal Evidence */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Internal Evidence
                </h4>
                <span className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                  ScentPlus Internal
                </span>
              </div>

              {record.evidenceUrl ? (
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs break-all">
                  <div className="text-slate-500 mb-1">Bukti Log / Tautan:</div>
                  <div className="font-mono text-slate-800 select-all">
                    {record.evidenceUrl.startsWith('http') ? (
                      <a
                        href={record.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Buka Tautan Bukti</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span>{record.evidenceUrl}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-400 italic">
                  Tidak ada tautan atau bukti log publik yang disertakan.
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

