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
      className="bg-[#EAF2E8] border border-[#C8DAC4] rounded-xl p-3 sm:p-3.5 transition-all shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#133326] rounded-xl text-[#A7E97F] flex-shrink-0 mt-0.5 sm:mt-0">
            <Info className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-[#133326]">
                Data Belum Lengkap
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-2xs font-bold bg-[#D7F7C4] text-[#133326] rounded-full">
                <ShieldAlert className="w-3 h-3" />
                {validCount} dari {totalCount} sumber tersedia
              </span>
            </div>
            <p className="text-xs text-[#1E4A38] mt-1 leading-relaxed">
              Metrik total dan ROAS hanya menghitung kanal dengan data valid terverifikasi (Shopee). Kanal yang gagal otentikasi (TikTok & Meta) tidak dihitung sebagai nol.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onScrollToHealth}
          className="inline-flex items-center gap-1.5 self-start sm:self-center px-3.5 py-1.5 text-xs font-bold text-[#133326] bg-white hover:bg-[#D7F7C4] border border-[#C8DAC4] rounded-full transition-colors shadow-2xs shrink-0"
        >
          <span>Lihat kendala data</span>
          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
