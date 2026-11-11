import React from 'react';
import { AdsFilters } from '../types/ads';
import { RefreshCw, RotateCcw, Calendar, Sparkles } from 'lucide-react';
import { formatDateWIB } from '../utils/formatters';
import { DateRangePicker } from './DateRangePicker';

interface HeaderProps {
  filters: AdsFilters;
  onFilterChange: (filters: AdsFilters) => void;
  onResetFilters: () => void;
  lastFetchedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  availableChannels: string[];
  availableDates: string[];
  activeDateRangeText: string;
}

export const Header: React.FC<HeaderProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  lastFetchedAt,
  isRefreshing,
  onRefresh,
  availableChannels,
  availableDates,
  activeDateRangeText,
}) => {
  const isFilterActive =
    (filters.channel && filters.channel !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.datePreset && filters.datePreset !== '30d') ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, channel: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-[#E2EBE0] sticky top-0 z-20 lg:rounded-t-3xl">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Top bar: Title + Live Sync + Profile/Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#133326] flex items-center justify-center text-[#A7E97F] font-extrabold text-xs tracking-wider shadow-sm flex-shrink-0 lg:hidden">
              SC
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#133326] tracking-tight">
                  Dashboard Performa Iklan
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider bg-[#D7F7C4] text-[#133326] rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Live Sync
                </span>
                {availableDates.length > 1 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 text-2xs font-bold bg-[#EAF2E8] text-[#133326] rounded-full">
                    <Calendar className="w-3 h-3" />
                    {availableDates.length} Hari Terkumpul
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring realisasi, target belanja iklan, dan atribusi pendapatan per kanal — ScentPlus
              </p>
            </div>
          </div>

          {/* Right action: Last Pull & Refresh (COINEST Top-Right Action Pill Style) */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="text-right text-xs text-slate-500 hidden sm:block bg-[#F6F9F5] px-3.5 py-1.5 rounded-full border border-[#E2EBE0]">
              <span className="text-2xs text-slate-400 mr-1.5">Sync:</span>
              <span className="font-mono text-[#133326] font-bold">
                {lastFetchedAt ? formatDateWIB(lastFetchedAt.toISOString()) : 'Memuat...'}
              </span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Segarkan data spreadsheet"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#133326] bg-[#A7E97F] hover:bg-[#95DF69] rounded-full transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing ? 'animate-spin text-[#133326]' : 'text-[#133326]'
                }`}
              />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-3.5 pt-3 border-t border-[#ECF2EB] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Interactive Calendar Date Range Picker */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label className="font-bold text-[#133326]">Periode:</label>
              <DateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                datePreset={filters.datePreset}
                availableDates={availableDates}
                activeDateRangeText={activeDateRangeText}
                onApply={(start, end, preset) => {
                  onFilterChange({
                    ...filters,
                    datePreset: preset,
                    startDate: start,
                    endDate: end,
                  });
                }}
              />
            </div>

            {/* Active Range Pill */}
            <div className="hidden xl:flex items-center gap-1.5 text-2xs bg-[#EAF2E8] text-[#133326] px-3 py-1.5 rounded-full font-mono">
              <span>Jangkauan:</span>
              <strong className="text-[#133326]">{activeDateRangeText}</strong>
            </div>

            {/* Kanal filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label htmlFor="filter-channel" className="font-bold text-[#133326]">
                Kanal:
              </label>
              <select
                id="filter-channel"
                value={filters.channel || 'all'}
                onChange={handleChannelChange}
                className="bg-[#F6F9F5] border border-[#DCE8DA] text-[#133326] font-semibold text-xs rounded-full px-3 py-1.5 focus:ring-2 focus:ring-[#133326] focus:border-[#133326]"
              >
                <option value="all">Semua Kanal</option>
                {availableChannels.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            {/* Status data filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <label htmlFor="filter-status" className="font-bold text-[#133326]">
                Status:
              </label>
              <select
                id="filter-status"
                value={filters.status || 'all'}
                onChange={handleStatusChange}
                className="bg-[#F6F9F5] border border-[#DCE8DA] text-[#133326] font-semibold text-xs rounded-full px-3 py-1.5 focus:ring-2 focus:ring-[#133326] focus:border-[#133326]"
              >
                <option value="all">Semua Status</option>
                <option value="verified">Terverifikasi (Verified)</option>
                <option value="partial">Sebagian (Partial)</option>
                <option value="authentication_required">Autentikasi Diperlukan</option>
                <option value="unavailable">Tidak Tersedia</option>
              </select>
            </div>
          </div>

          {/* Reset filter button */}
          {isFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-full transition-colors"
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
