import React from 'react';
import { Info, ArrowDown, ShieldAlert } from 'lucide-react';

interface DataQualityBannerProps {
  validCount: number;
  totalCount: number;
  onScrollToHealth: () => void;
}

export const DataQualityBanner: React.FC<DataQualityBannerProps> = ({
  validCount,
  totalCount,
  onScrollToHealth,
}) => {
  if (totalCount === 0 || validCount === totalCount) {
    return null;
  }

  return (
    <section
      aria-label="Status Kualitas Data"
      className="bg-sky-50/80 border border-sky-200 rounded-lg p-4 mb-6 transition-all shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-sky-100 rounded-lg text-sky-700 flex-shrink-0 mt-0.5 sm:mt-0">
            <Info className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-sky-950">
                Data Belum Lengkap
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-sky-200 text-sky-900 rounded-full">
                <ShieldAlert className="w-3 h-3" />
                {validCount} dari {totalCount} sumber tersedia
              </span>
            </div>
            <p className="text-xs text-sky-800 mt-0.5 leading-relaxed">
              Metrik total dan ROAS hanya menghitung kanal dengan data valid terverifikasi (Shopee). Kanal yang gagal otentikasi (TikTok & Meta) tidak dihitung sebagai nol.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onScrollToHealth}
          className="inline-flex items-center gap-1.5 self-start sm:self-center px-3.5 py-1.5 text-xs font-semibold text-sky-800 bg-white hover:bg-sky-100 border border-sky-300 rounded-md transition-colors shadow-2xs hover:text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
        >
          <span>Lihat kendala data</span>
          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

