# ScentPlus — Ads Performance Monitoring Dashboard (MVP)

Prototype operasional dan monitoring dashboard KPI Ads internal untuk ScentPlus. Dashboard ini dirancang untuk menguji struktur informasi, alur pengambilan data dari Google Sheets, normalisasi data, integritas perhitungan KPI, data availability, serta kesiapan menerima dataset 30 hari tanpa perombakan arsitektur.

---

## 1. Fitur Utama & Struktur Informasi

- **Glanceability & Enterprise Hierarchy**: Fokus pada keterbacaan angka metrik dan status operasional (bukan landing page marketing).
- **Tabular Numerics**: Penggunaan font tabular (`tabular-nums`) untuk memastikan angka finansial dan volume order terbaca rapi.
- **KPI Summary Terverifikasi**:
  - **Total Spend**: `SUM(actualSpend)` hanya dari baris dengan data valid (Rp8.182.656).
  - **Total GMV Ads**: `SUM(actualRevenue)` platform attribution (Rp61.010.394).
  - **Total Paid Orders**: `SUM(actualOrders)` (304 order).
  - **Blended ROAS**: Dihitung dari `SUM(GMV) / SUM(Spend)` = 7,46x. *(Bukan rata-rata kolom ROAS)*.
  - **Spend per Paid Order**: `SUM(Spend) / SUM(Orders)` ≈ Rp26.917.
  - **Data Coverage**: 25% (1 dari 4 sumber data tersedia).
- **Penanganan Missing Data yang Benar**: Kanal yang mengalami kendala otentikasi (TikTok Shop & Meta CPAS) bernilai `null` dan ditampilkan sebagai tanda strip (`—`), **TIDAK** dipaksa menjadi `Rp0` atau `0,00x` yang dapat merusak analisis finansial.
- **Data Quality Banner**: Informasi transparan kelengkapan data (1/4 aktif) dengan CTA navigasi instan ke panel diagnostik.
- **Attribution Warning Notice**: Pengingat model atribusi Shopee (broad attribution 7-hari) vs direct atribusi.
- **Performance Trend Jujur**: Menampilkan 1-titik observasi secara jujur tanpa menggambar garis tren palsu, serta otomatis menampilkan grafik bar ketika dataset $\ge 2$ hari telah diinjeksi.
- **Channel Performance Table**: Tabel semantik dengan badge status operasional (Verified, Authentication required, dll.).
- **Detail Slide-over Drawer**: Rincian teknis per baris data, cutoff waktu, PIC penanggung jawab, catatan kendala, dan tautan internal log.
- **Data Health & Integration Section**: Monitoring operasional untuk PIC integrasi:
  - **Shopee**: Terverifikasi via Shopee Open API v2.
  - **TikTok Product Ads**: Autentikasi diperlukan (membutuhkan OTP SMS Seller Center).
  - **TikTok LIVE Ads**: Autentikasi diperlukan (membutuhkan OTP SMS Seller Center).
  - **Meta CPAS**: Autentikasi diperlukan (sesi Ads Manager login wall, butuh relogin PIC Azhar).

---

## 2. Struktur Proyek

```
dashboard KPI Ads/
├── package.json                          # Metadata dependensi & npm scripts
├── vite.config.ts                        # Bundler Vite & dev proxy (/api/sheets-csv)
├── tsconfig.json                         # Konfigurasi TypeScript compiler
├── tailwind.config.js                    # Enterprise design tokens (ScentPlus Navy/Slate)
├── src/
│   ├── types/
│   │   └── ads.ts                       # Tipe data AdsDailyRecord, AdsDataStatus, AdsFilters
│   ├── services/
│   │   ├── AdsDataSource.ts             # Interface data layer kontrak
│   │   ├── GoogleSheetsAdsDataSource.ts # Adapter fetcher Google Sheets & fallback
│   │   ├── parser.ts                    # Dynamic header mapping & normalizer
│   │   └── fixtureData.ts               # Local development fallback snapshot
│   ├── utils/
│   │   ├── kpiCalculations.ts           # Logika perhitungan matematis KPI & coverage
│   │   ├── formatters.ts                # Formatter mata uang IDR, angka, dan tanggal WIB
│   │   └── statusConfig.ts              # Konfigurasi label, badge, dan palet status
│   ├── components/
│   │   ├── Header.tsx                   # Top header & filter toolbar (Date, Channel, Status)
│   │   ├── FallbackIndicator.tsx        # Banner transparan mode offline aktif
│   │   ├── DataQualityBanner.tsx        # Peringatan informatif kelengkapan sumber
│   │   ├── AttributionNotice.tsx        # Catatan peringatan attribution window
│   │   ├── KpiSummary.tsx               # 6 KPI cards tabular
│   │   ├── PerformanceTrend.tsx         # Area tren adaptif
│   │   ├── ChannelTable.tsx             # Tabel performa kanal iklan
│   │   ├── DetailDrawer.tsx             # Slide-over drawer rincian internal
│   │   ├── DataHealthSection.tsx        # Diagnostik kesehatan integrasi & eskalasi PIC
│   │   └── StateViews.tsx               # Loading, Error, dan Empty filter state
│   ├── tests/
│   │   ├── parser.test.ts               # Unit test normalisasi parser
│   │   ├── kpiCalculations.test.ts      # Unit test perhitungan Blended ROAS
│   │   └── uiStatesAndFilters.test.ts   # Unit test multi-state, edge cases, 30-hari simulation
│   ├── App.tsx                          # Integrasi aplikasi & sinkronisasi URL state
│   └── main.tsx                         # Entry point
└── scripts/
    └── capture-screenshots.js           # Otomatisasi screenshot Playwright multi-viewport
```

---

## 3. Menjalankan Dashboard

### Prasyarat
- Node.js versi 18+ (direkomendasikan v20+)
- npm atau pnpm

### Langkah Menjalankan:
1. **Instal dependensi**:
   ```powershell
   npm install
   ```
2. **Jalankan development server**:
   ```powershell
   npm run dev
   ```
   Buka browser pada: [http://localhost:3000](http://localhost:3000)

3. **Menjalankan Unit Tests**:
   ```powershell
   npm test
   ```
   *(Menjalankan 18 pengujian integritas matematis dan parser via Vitest)*

4. **Menjalankan Type-Check**:
   ```powershell
   npm run lint
   ```

5. **Build untuk Produksi**:
   ```powershell
   npm run build
   ```

---

## 4. Sumber Data & Alur Penarikan (Data Flow)

- **Workbook Google Sheets**: `PERFORMANCE DATA SCETPLUS`
- **Sheet**: `DB ADS`
- **CSV Export Endpoint**:
  `https://docs.google.com/spreadsheets/d/1PXarMDXbHSFtvAy1Luv1ch_A-vEZ0XngCHJ4cO0rzWk/export?format=csv&gid=0`

### Resilience & Fallback Hierarchy:
1. **Vite Proxy (`/api/sheets-csv`)**: Mengambil data Google Sheets melalui backend server dev untuk menghindari kendala CORS browser.
2. **Direct Fetch**: Mencoba koneksi langsung ke Google Sheets jika proxy tidak tersedia.
3. **Local Development Fixture (`fixtureData.ts`)**: Jika perangkat sedang offline atau akses jaringan dibatasi sandbox, aplikasi otomatis menggunakan snapshot lokal dan menampilkan label transparan **"Demo Fallback Data"**.

---

## 5. Kesiapan Menerima Injeksi Data 30 Hari

Dashboard ini telah dirancang untuk siap menerima injeksi data otomatis dari AI agent:
- **Tahan Perubahan Urutan Kolom**: Menggunakan algoritma *Dynamic Header Mapping* berbasis nama kolom (bukan nomor indeks).
- **Visualisasi Dinamis**: Komponen grafik tren secara otomatis berubah menjadi grafik bar interaktif ketika tanggal observasi bertambah menjadi $\ge 2$ hari.
- **Normalisasi Nilai**: Tanggal dibaca konsisten dalam zona waktu `Asia/Jakarta` (WIB) dan format ribuan / desimal dikonversi otomatis tanpa potensi crash.

