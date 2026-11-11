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
import { formatDateWIB } from './utils/formatters';
import { AlertTriangle } from 'lucide-react';

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
    <div className="min-h-screen bg-[#ECF2EB] text-[#133326] flex flex-col">
      {/* Unified Top Navigation Header & Filter Bar (Full-Width Desktop) */}
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        issueSourcesCount={issueSourcesCount}
        dataCoverage={kpiMetrics.dataCoverage}
      />

      {/* Main Content Area (Spacious Full-Width Container up to 1600px) */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
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
  );
};
