import React from 'react';
import { AdsFilters } from '../types/ads';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { formatDateWIB } from '../utils/formatters';

interface HeaderProps {
  filters: AdsFilters;
  onFilterChange: (filters: AdsFilters) => void;
  onResetFilters: () => void;
  lastFetchedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  availableChannels: string[];
}

export const Header: React.FC<HeaderProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  lastFetchedAt,
  isRefreshing,
  onRefresh,
  availableChannels,
}) => {
  const isFilterActive =
    (filters.channel && filters.channel !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    Boolean(filters.startDate && filters.startDate !== '2026-11-09');

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, channel: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all_30') {
      onFilterChange({ ...filters, startDate: '2026-10-11', endDate: '2026-11-09' });
    } else {
      onFilterChange({ ...filters, startDate: val, endDate: val });
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top bar: Brand + Title + Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0B192C] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm flex-shrink-0">
              SC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Ads Performance
                </h1>
                <span className="px-2 py-0.5 text-2xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  Prototype MVP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring performa iklan dan ketersediaan data per kanal — ScentPlus
              </p>
            </div>
          </div>

          {/* Right action: Last Pull & Refresh */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="text-right text-xs text-slate-500 hidden sm:block">
              <div>Pembaruan Terakhir:</div>
              <div className="font-mono text-slate-800 font-medium">
                {lastFetchedAt ? formatDateWIB(lastFetchedAt.toISOString()) : 'Memuat...'}
              </div>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Segarkan data spreadsheet"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Periode filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label htmlFor="filter-date" className="font-medium text-slate-700">
                Periode:
              </label>
              <select
                id="filter-date"
                value={filters.startDate || '2026-11-09'}
                onChange={handleDateChange}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
              >
                <option value="2026-11-09">9 November 2026 (Aktif)</option>
                <option value="all_30" disabled title="Menunggu injeksi data 30-hari dari AI Agent">
                  30 Hari Terakhir (Siap Digunakan)
                </option>
              </select>
            </div>

            {/* Kanal filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label htmlFor="filter-channel" className="font-medium text-slate-700">
                Kanal:
              </label>
              <select
                id="filter-channel"
                value={filters.channel || 'all'}
                onChange={handleChannelChange}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua Kanal</option>
                {availableChannels.map(ch => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            {/* Status data filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label htmlFor="filter-status" className="font-medium text-slate-700">
                Status:
              </label>
              <select
                id="filter-status"
                value={filters.status || 'all'}
                onChange={handleStatusChange}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="verified">Terverifikasi (Verified)</option>
                <option value="authentication_required">Autentikasi Diperlukan</option>
                <option value="unavailable">Tidak Tersedia</option>
                <option value="partial">Sebagian (Partial)</option>
                <option value="pending">Menunggu (Pending)</option>
              </select>
            </div>
          </div>

          {/* Reset filter button */}
          {isFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

