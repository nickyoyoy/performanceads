import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleSheetsAdsDataSource } from './services/GoogleSheetsAdsDataSource';
import { AdsDailyRecord, AdsFilters, DatePreset } from './types/ads';
import { AdsFetchResult } from './services/AdsDataSource';
import { calculateKpiMetrics } from './utils/kpiCalculations';
import { Header } from './components/Header';
import { FallbackIndicator } from './components/FallbackIndicator';
import { DataQualityBanner } from './components/DataQualityBanner';
import { AttributionNotice } from './components/AttributionNotice';
import { KpiSummary } from './components/KpiSummary';
import { PerformanceTrend, TrendHighlightsStrip } from './components/PerformanceTrend';
import { ChannelShareDonut } from './components/ChannelShareDonut';
import { ChannelTable } from './components/ChannelTable';
import { DetailDrawer } from './components/DetailDrawer';
import { DataHealthSection } from './components/DataHealthSection';
import { LoadingView, ErrorView, EmptyFilterView } from './components/StateViews';
import { formatDateWIB, formatPercent } from './utils/formatters';
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  AlertTriangle,
  Database,
  Layers,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export type MainTab = 'overview' | 'analytics' | 'health';

// Initialize data source instance once outside component render
const adsDataSource = new GoogleSheetsAdsDataSource('/api/sheets-csv');

export const App: React.FC = () => {
  // Active primary tab: 'overview' | 'analytics' | 'health'
  const [activeTab, setActiveTab] = useState<MainTab>('overview');

  // Read initial filters from URL query parameters if available, defaulting to 30d
  const [filters, setFilters] = useState<AdsFilters>(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = (params.get('preset') as DatePreset) || '30d';
    return {
      datePreset: preset,
      startDate: params.get('startDate') || undefined,
      endDate: params.get('endDate') || undefined,
      channel: params.get('channel') || 'all',
      status: params.get('status') || 'all',
    };
  });

  const [fetchResult, setFetchResult] = useState<AdsFetchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AdsDailyRecord | null>(null);

  // Sync filters to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.datePreset && filters.datePreset !== '30d') {
      params.set('preset', filters.datePreset);
    }
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.channel && filters.channel !== 'all')
      params.set('channel', filters.channel);
    if (filters.status && filters.status !== 'all')
      params.set('status', filters.status);

    const newUrl = `${window.location.pathname}${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  // Load data function
  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const result = await adsDataSource.getDailyPerformance(filters);
        setFetchResult(result);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memuat data.';
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Available unique channels
  const availableChannels = useMemo(() => {
    if (!fetchResult) return ['Shopee', 'TikTok Shop', 'Meta'];
    const set = new Set<string>();
    fetchResult.allRecords.forEach((r) => {
      if (r.channel) set.add(r.channel);
    });
    return Array.from(set);
  }, [fetchResult]);

  // Compute calculated KPI metrics for currently filtered records
  const kpiMetrics = useMemo(() => {
    return calculateKpiMetrics(fetchResult?.records || []);
  }, [fetchResult]);

  // Issue count for Data Health tab notification
  const issueSourcesCount = useMemo(() => {
    if (!fetchResult) return 0;
    return fetchResult.records.filter(
      (r) =>
        r.status === 'authentication_required' ||
        r.status === 'unavailable' ||
        r.status === 'api_error'
    ).length;
  }, [fetchResult]);

  // Human-readable active date range text
  const activeDateRangeText = useMemo(() => {
    if (!fetchResult || fetchResult.records.length === 0) return 'Tidak ada data';
    const dates = fetchResult.records
      .map((r) => r.reportDate)
      .filter(Boolean)
      .sort();
    if (dates.length === 0) return '—';
    const minD = dates[0];
    const maxD = dates[dates.length - 1];
    if (minD === maxD) return formatDateWIB(minD);
    return `${formatDateWIB(minD)} s/d ${formatDateWIB(maxD)}`;
  }, [fetchResult]);

  const handleResetFilters = () => {
    setFilters({
      datePreset: '30d',
      startDate: undefined,
      endDate: undefined,
      channel: 'all',
      status: 'all',
    });
  };

  const handleNavigateToHealth = () => {
    setActiveTab('health');
    setTimeout(() => {
      const el = document.getElementById('data-health');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#ECF2EB] text-[#133326] lg:p-3 lg:gap-3">
      {/* =================================================================== */}
      {/* LEFT SIDEBAR (COINEST Botanical Sage Navigation + Dark Forest Card) */}
      {/* =================================================================== */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between px-4 py-3 lg:py-5 lg:px-3">
        <div className="space-y-6">
          {/* Brand Identity (Clover Emblem + SCENTPLUS) */}
          <div className="flex items-center justify-between lg:justify-start gap-3 px-2">
            <div className="flex items-center gap-2.5">
              {/* Botanical 4-Leaf Clover Icon matching COINEST logo */}
              <div className="w-9 h-9 rounded-2xl bg-[#133326] flex items-center justify-center shadow-sm shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 fill-[#A7E97F]"
                  aria-hidden="true"
                >
                  <path d="M7.5 3C5.01 3 3 5.01 3 7.5C3 9.99 5.01 12 7.5 12H11V7.5C11 5.01 8.99 3 7.5 3ZM16.5 3C14.01 3 13 5.01 13 7.5V12H16.5C18.99 12 21 9.99 21 7.5C21 5.01 18.99 3 16.5 3ZM7.5 13C5.01 13 3 15.01 3 17.5C3 19.99 5.01 22 7.5 22C9.99 22 11 19.99 11 17.5V13H7.5ZM13 13V17.5C13 19.99 15.01 22 16.5 22C18.99 22 21 19.99 21 17.5C21 15.01 18.99 13 16.5 13H13Z" />
                </svg>
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-[#133326] block leading-none">
                  SCENTPLUS
                </span>
                <span className="text-3xs font-semibold uppercase tracking-widest text-slate-500 mt-0.5 block">
                  KPI Ads Suite
                </span>
              </div>
            </div>

            {/* Mobile Coverage Pill */}
            <span className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-[#D7F7C4] text-[#133326]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {formatPercent(kpiMetrics.dataCoverage)}
            </span>
          </div>

          {/* Primary Navigation Menu (Preserves exact button labels for tests/scripts) */}
          <nav
            aria-label="Navigasi Bagian Dashboard"
            className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0"
          >
            <div className="hidden lg:block text-3xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Menu Utama
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`inline-flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#A7E97F] text-[#133326] font-extrabold shadow-2xs'
                  : 'text-[#133326]/80 font-semibold hover:bg-[#DCE8DA]/70 hover:text-[#133326]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Ringkasan Eksekutif</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-[#A7E97F] text-[#133326] font-extrabold shadow-2xs'
                  : 'text-[#133326]/80 font-semibold hover:bg-[#DCE8DA]/70 hover:text-[#133326]'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Tren & Rincian Kanal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('health')}
              className={`inline-flex items-center justify-between gap-2 px-4 py-2.5 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${
                activeTab === 'health'
                  ? 'bg-[#A7E97F] text-[#133326] font-extrabold shadow-2xs'
                  : 'text-[#133326]/80 font-semibold hover:bg-[#DCE8DA]/70 hover:text-[#133326]'
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <Activity className="w-4 h-4 shrink-0" />
                <span>Data Health & Integrasi</span>
              </span>
              {issueSourcesCount > 0 && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-3xs font-extrabold rounded-full bg-rose-500 text-white">
                  {issueSourcesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Secondary Sidebar Section: Quick Channel Filter (Desktop) */}
          <div className="hidden lg:block space-y-1.5 pt-2 border-t border-[#DCE8DA]">
            <div className="text-3xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              Filter Cepat Kanal
            </div>
            <button
              type="button"
              onClick={() => setFilters({ ...filters, channel: 'all' })}
              className={`w-full flex items-center justify-between px-4 py-2 text-xs rounded-full transition-all ${
                !filters.channel || filters.channel === 'all'
                  ? 'bg-white text-[#133326] font-bold shadow-2xs border border-[#DCE8DA]'
                  : 'text-slate-600 font-medium hover:bg-[#DCE8DA]/50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-3.5 h-3.5 text-[#133326]" />
                <span>Semua Platform</span>
              </span>
              <span className="text-3xs font-mono bg-[#EAF2E8] text-[#133326] px-2 py-0.5 rounded-full font-bold">
                {availableChannels.length}
              </span>
            </button>

            {availableChannels.map((ch) => {
              const isSelected = filters.channel === ch;
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setFilters({ ...filters, channel: ch })}
                  className={`w-full flex items-center justify-between px-4 py-2 text-xs rounded-full transition-all ${
                    isSelected
                      ? 'bg-white text-[#133326] font-bold shadow-2xs border border-[#DCE8DA]'
                      : 'text-slate-600 font-medium hover:bg-[#DCE8DA]/50'
                  }`}
                >
                  <span className="truncate">{ch}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#133326]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Dark Forest Green Card (COINEST "Get Pro" Card Style) */}
        <div className="hidden lg:block mt-6 bg-[#133326] text-white rounded-2xl p-4 shadow-card relative overflow-hidden">
          {/* Decorative Clover Silhouette */}
          <div className="pointer-events-none absolute -right-4 -top-4 w-20 h-20 rounded-full bg-[#1E4A38]/60 blur-md" />
          <div className="relative z-10 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#A7E97F]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">
                Spreadsheet DB ADS Live
              </h4>
              <p className="text-2xs text-emerald-100/75 mt-1 leading-relaxed">
                Akses penuh metrik realisasi & target harian langsung dari Google Sheets ScentPlus.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-extrabold bg-[#A7E97F] hover:bg-[#95DF69] text-[#133326] rounded-full transition-all shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>{isRefreshing ? 'Sinkronisasi...' : 'Sinkronkan Data'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* MAIN CONTENT SHELL (Rounded Warm Alabaster Canvas)                  */}
      {/* =================================================================== */}
      <div className="flex-1 bg-[#F6F9F5] lg:rounded-3xl border border-[#DCE8DA] shadow-card flex flex-col min-w-0 overflow-hidden">
        {/* Top Header & Filters */}
        <Header
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          lastFetchedAt={fetchResult?.fetchedAt || null}
          isRefreshing={isRefreshing}
          onRefresh={() => loadData(true)}
          availableChannels={availableChannels}
          availableDates={fetchResult?.availableDates || []}
          activeDateRangeText={activeDateRangeText}
        />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Loading State */}
          {isLoading && !fetchResult && <LoadingView />}

          {/* Error State */}
          {error && !fetchResult && (
            <ErrorView message={error} onRetry={() => loadData(false)} />
          )}

          {/* Loaded Content */}
          {fetchResult && (
            <>
              {/* Fallback Warning if offline snapshot is active */}
              <FallbackIndicator
                isFallback={fetchResult.isFallback}
                sourceUrl={fetchResult.sourceUrl}
              />

              {/* Empty State when filters yield 0 records */}
              {fetchResult.records.length === 0 ? (
                <EmptyFilterView onReset={handleResetFilters} />
              ) : (
                <>
                  {/* ======================================================== */}
                  {/* TAB 1: RINGKASAN EKSEKUTIF (OVERVIEW)                     */}
                  {/* ======================================================== */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Data Quality Banner (if data coverage < 100%) */}
                      <DataQualityBanner
                        validCount={kpiMetrics.validRecordsCount}
                        totalCount={kpiMetrics.totalExpectedRecordsCount}
                        onScrollToHealth={handleNavigateToHealth}
                      />

                      {/* Attribution Notice */}
                      <AttributionNotice />

                      {/* Executive Hero Card + 6 Metric KPI Summary + Target Progress Tracker */}
                      <KpiSummary
                        metrics={kpiMetrics}
                        periodLabel={`Periode Aktif: ${activeDateRangeText}`}
                      />

                      {/* Full-Width 4 Strategic Trend Highlight Cards */}
                      <TrendHighlightsStrip records={fetchResult.records} />

                      {/* COINEST Middle Section: Cashflow Trend Chart + Statistic Donut Card */}
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch mb-6">
                        <div className="xl:col-span-8">
                          <PerformanceTrend
                            records={fetchResult.records}
                            hideHighlights={true}
                          />
                        </div>
                        <div className="xl:col-span-4">
                          <ChannelShareDonut
                            records={fetchResult.records}
                            onSelectChannel={setSelectedRecord}
                          />
                        </div>
                      </div>

                      {/* Channel Summary Table (Recent Transactions Style) */}
                      <ChannelTable
                        records={fetchResult.records}
                        onSelectRecord={setSelectedRecord}
                      />
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 2: TREN & RINCIAN KANAL (ANALYTICS DEEP DIVE)        */}
                  {/* ======================================================== */}
                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      <div className="bg-[#EAF2E8] border border-[#C8DAC4] rounded-2xl p-4 text-xs text-[#133326]">
                        <strong>Analisis Mendalam:</strong> Silakan telaah dinamika pergerakan belanja iklan, pendapatan GMV, serta fluktuasi ROAS harian lintas kanal. Anda dapat beralih antara grafik terpadu dan memeriksa tabel rincian harian hingga per tanggal.
                      </div>

                      {/* Full-Width 4 Strategic Trend Highlight Cards */}
                      <TrendHighlightsStrip records={fetchResult.records} />

                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch mb-6">
                        <div className="xl:col-span-8">
                          <PerformanceTrend
                            records={fetchResult.records}
                            hideHighlights={true}
                          />
                        </div>
                        <div className="xl:col-span-4">
                          <ChannelShareDonut
                            records={fetchResult.records}
                            onSelectChannel={setSelectedRecord}
                          />
                        </div>
                      </div>

                      {/* Channel Performance Table */}
                      <ChannelTable
                        records={fetchResult.records}
                        onSelectRecord={setSelectedRecord}
                      />
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 3: DATA HEALTH & INTEGRASI (OPERATIONAL DIAGNOSTIC)    */}
                  {/* ======================================================== */}
                  {activeTab === 'health' && (
                    <div className="space-y-6">
                      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Pusat Pemantauan Operasional (PIC & Data Integrator):</strong> Halaman ini memuat status otentikasi API resmi, sesi login Seller Center (kebutuhan OTP), serta kendala Ads Manager Meta CPAS untuk ditindaklanjuti PIC terkait.
                        </span>
                      </div>

                      {/* Operational Diagnostic Section */}
                      <DataHealthSection
                        records={fetchResult.records}
                        onSelectRecord={setSelectedRecord}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        {/* Slide-out Detail Drawer */}
        <DetailDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />

        {/* Footer (COINEST Clean Footer Bar) */}
        <footer className="border-t border-[#E2EBE0] bg-white/70 px-6 py-4 mt-auto text-xs text-slate-500">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#133326]">
                Copyright &copy; 2026 ScentPlus
              </span>
              <span className="text-slate-300">&bull;</span>
              <span>Enterprise Performance Marketing Suite</span>
            </div>
            <div className="flex items-center gap-4 text-2xs text-slate-400">
              <span>Google Sheets DB ADS Live</span>
              <span>&bull;</span>
              <span>Broad Attribution 7-Day</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
