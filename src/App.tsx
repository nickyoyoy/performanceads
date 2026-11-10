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
import { PerformanceTrend } from './components/PerformanceTrend';
import { ChannelTable } from './components/ChannelTable';
import { DetailDrawer } from './components/DetailDrawer';
import { DataHealthSection } from './components/DataHealthSection';
import { LoadingView, ErrorView, EmptyFilterView } from './components/StateViews';
import { formatDateWIB } from './utils/formatters';
import { LayoutDashboard, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

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
    if (filters.channel && filters.channel !== 'all') params.set('channel', filters.channel);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  // Load data function
  const loadData = useCallback(async (isRefresh = false) => {
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
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Available unique channels
  const availableChannels = useMemo(() => {
    if (!fetchResult) return ['Shopee', 'TikTok Shop', 'Meta'];
    const set = new Set<string>();
    fetchResult.allRecords.forEach(r => {
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
      r => r.status === 'authentication_required' || r.status === 'unavailable' || r.status === 'api_error'
    ).length;
  }, [fetchResult]);

  // Human-readable active date range text
  const activeDateRangeText = useMemo(() => {
    if (!fetchResult || fetchResult.records.length === 0) return 'Tidak ada data';
    const dates = fetchResult.records.map(r => r.reportDate).filter(Boolean).sort();
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
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

      {/* Primary Section Navigation Tabs */}
      <nav
        aria-label="Navigasi Bagian Dashboard"
        className="bg-white border-b border-slate-200 sticky top-[95px] md:top-[85px] z-10 shadow-2xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Ringkasan Eksekutif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tren & Rincian Kanal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'health'
                ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Data Health & Integrasi</span>
            {issueSourcesCount > 0 && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-2xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>{issueSourcesCount} Isu</span>
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

                    {/* 6 Metric KPI Summary */}
                    <KpiSummary metrics={kpiMetrics} />

                    {/* Executive Trend Summary */}
                    <PerformanceTrend records={fetchResult.records} />

                    {/* Channel Summary Table (Executive Mode) */}
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
                    <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                      <strong>Analisis Mendalam:</strong> Silakan telaah dinamika pergerakan belanja iklan, pendapatan GMV, serta fluktuasi ROAS harian lintas kanal. Anda dapat beralih antara grafik terpadu dan memeriksa tabel rincian harian hingga per tanggal.
                    </div>

                    {/* Full Interactive Multi-Metric Chart */}
                    <PerformanceTrend records={fetchResult.records} />

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
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-950">
                      <strong>Pusat Pemantauan Operasional (PIC & Data Integrator):</strong> Halaman ini memuat status otentikasi API resmi, sesi login Seller Center (kebutuhan OTP), serta kendala Ads Manager Meta CPAS untuk ditindaklanjuti PIC terkait.
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <span>ScentPlus Performance Marketing Dashboard &bull; ScentPlus Internal Enterprise Monitoring &bull; 2026</span>
        </div>
      </footer>
    </div>
  );
};
