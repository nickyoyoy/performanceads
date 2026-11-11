import React from 'react';
import { AdsFilters } from '../types/ads';
import {
  RefreshCw,
  RotateCcw,
  Calendar,
  Sparkles,
  LayoutDashboard,
  TrendingUp,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { formatDateWIB, formatPercent } from '../utils/formatters';
import { DateRangePicker } from './DateRangePicker';

export type MainTab = 'overview' | 'analytics' | 'health';

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
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  issueSourcesCount: number;
  dataCoverage: number;
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
  activeTab,
  onTabChange,
  issueSourcesCount,
  dataCoverage,
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
    <header className="bg-white/95 backdrop-blur-md border-b border-[#E2EBE0] sticky top-0 z-30 shadow-2xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* ================================================================= */}
        {/* ROW 1: Branding Identity (Left) & Live Sync / Status Bar (Right)  */}
        {/* ================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ECF2EB]">
          {/* Left: Brand Identity + Live Sync & Days Collected Badges */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Botanical 4-Leaf Clover Emblem */}
            <div className="w-9 h-9 rounded-2xl bg-[#133326] flex items-center justify-center shadow-sm shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-[#A7E97F]"
                aria-hidden="true"
              >
                <path d="M7.5 3C5.01 3 3 5.01 3 7.5C3 9.99 5.01 12 7.5 12H11V7.5C11 5.01 8.99 3 7.5 3ZM16.5 3C14.01 3 13 5.01 13 7.5V12H16.5C18.99 12 21 9.99 21 7.5C21 5.01 18.99 3 16.5 3ZM7.5 13C5.01 13 3 15.01 3 17.5C3 19.99 5.01 22 7.5 22C9.99 22 11 19.99 11 17.5V13H7.5ZM13 13V17.5C13 19.99 15.01 22 16.5 22C18.99 22 21 19.99 21 17.5C21 15.01 18.99 13 16.5 13H13Z" />
              </svg>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#133326] leading-none">
                  SCENTPLUS
                </span>
                <span className="text-3xs font-bold uppercase tracking-widest text-slate-400 hidden sm:inline">
                  KPI ADS SUITE
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider bg-[#D7F7C4] text-[#133326] rounded-full whitespace-nowrap shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  Live Sync
                </span>
                {availableDates.length > 1 && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 text-3xs font-bold bg-[#F6F9F5] text-[#133326] border border-[#E2EBE0] rounded-full whitespace-nowrap shrink-0">
                    <Calendar className="w-3 h-3 text-emerald-700" />
                    {availableDates.length} Hari Terkumpul
                  </span>
                )}
              </div>
              <p className="text-2xs text-slate-500 mt-0.5 truncate">
                Dashboard Performa Iklan — Monitoring realisasi, target belanja, & atribusi kanal
              </p>
            </div>
          </div>

          {/* Right: Coverage Pill + Single-Line Sync Timestamp + Refresh Action */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Data Coverage Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-2xs font-bold bg-[#EAF2E8] text-[#133326] border border-[#DCE8DA] whitespace-nowrap shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>
                Coverage: <strong>{formatPercent(dataCoverage)}</strong>
              </span>
            </span>

            {/* Single-Line Sync Timestamp (Never wraps WIB onto 2nd line) */}
            <div className="hidden sm:inline-flex items-center gap-1.5 text-2xs bg-[#F6F9F5] px-3 py-1.5 rounded-full border border-[#E2EBE0] text-slate-500 whitespace-nowrap shrink-0">
              <span className="text-slate-400">Sync:</span>
              <span className="font-mono text-[#133326] font-bold">
                {lastFetchedAt ? formatDateWIB(lastFetchedAt.toISOString()) : 'Memuat...'}
              </span>
            </div>

            {/* Refresh / Sync Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Segarkan data spreadsheet"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#133326] bg-[#A7E97F] hover:bg-[#95DF69] rounded-full transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 shrink-0 ${
                  isRefreshing ? 'animate-spin text-[#133326]' : 'text-[#133326]'
                }`}
              />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROW 2: Primary Navigation Tabs (Left) & Filter Controls (Right)   */}
        {/* ================================================================= */}
        <div className="pt-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: 3 Primary Navigation Tabs — Full unclipped room */}
          <nav
            aria-label="Navigasi Bagian Dashboard"
            className="flex items-center overflow-x-auto sm:overflow-visible no-scrollbar shrink-0"
          >
            <div className="inline-flex items-center gap-1 bg-[#ECF2EB] p-1 rounded-full border border-[#DCE8DA]">
              <button
                type="button"
                onClick={() => onTabChange('overview')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-full transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'overview'
                    ? 'bg-[#133326] text-[#A7E97F] font-extrabold shadow-sm'
                    : 'text-[#133326]/75 font-semibold hover:text-[#133326] hover:bg-white/60'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Ringkasan Eksekutif</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('analytics')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-full transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'analytics'
                    ? 'bg-[#133326] text-[#A7E97F] font-extrabold shadow-sm'
                    : 'text-[#133326]/75 font-semibold hover:text-[#133326] hover:bg-white/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Tren & Rincian Kanal</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('health')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-full transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'health'
                    ? 'bg-[#133326] text-[#A7E97F] font-extrabold shadow-sm'
                    : 'text-[#133326]/75 font-semibold hover:text-[#133326] hover:bg-white/60'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Data Health & Integrasi</span>
                {issueSourcesCount > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-3xs font-extrabold rounded-full bg-rose-500 text-white leading-none">
                    {issueSourcesCount}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Right: Streamlined Filter Bar (Periode, Kanal, Status, Reset Filter) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:justify-end">
            {/* Interactive Calendar Date Range Picker */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
              <label className="font-bold text-[#133326] whitespace-nowrap">Periode:</label>
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

            {/* Kanal filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
              <label htmlFor="filter-channel" className="font-bold text-[#133326] whitespace-nowrap">
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
            <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
              <label htmlFor="filter-status" className="font-bold text-[#133326] whitespace-nowrap">
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

            {/* Reset filter button — stays inline with filters */}
            {isFilterActive && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3 shrink-0" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
