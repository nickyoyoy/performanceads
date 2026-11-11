import React from 'react';
import { Loader2, AlertCircle, FilterX, RefreshCw } from 'lucide-react';

export const LoadingView: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center"
    >
      <Loader2 className="w-10 h-10 text-[#133326] animate-spin mb-4" />
      <h2 className="text-base font-bold text-[#133326]">
        Menghubungkan ke Sumber Data Ads...
      </h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        Mengambil dan menormalkan data performa iklan dari Google Sheets ScentPlus.
      </p>
      <span className="sr-only">Sedang memuat data KPI Ads...</span>
    </div>
  );
};

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry }) => {
  return (
    <div
      role="alert"
      className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-base font-bold text-[#133326]">
        Gagal Memuat Sumber Data
      </h2>
      <p className="text-xs text-slate-600 mt-1.5 max-w-md leading-relaxed bg-white border border-[#E2EBE0] p-3 rounded-xl font-mono">
        {message}
      </p>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#133326] hover:bg-[#1E4A38] rounded-full transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Coba Ambil Ulang</span>
        </button>
      </div>
    </div>
  );
};

interface EmptyFilterViewProps {
  onReset: () => void;
}

export const EmptyFilterView: React.FC<EmptyFilterViewProps> = ({ onReset }) => {
  return (
    <div className="bg-white border border-[#E2EBE0] rounded-2xl p-10 text-center my-6 shadow-card">
      <div className="w-10 h-10 rounded-full bg-[#EAF2E8] text-[#133326] flex items-center justify-center mx-auto mb-3">
        <FilterX className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-[#133326]">
        Tidak Ada Rekaman Data Ditemukan
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
        Kombinasi filter periode, kanal, atau status yang Anda tentukan tidak menghasilkan rekaman iklan yang cocok.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 px-4 py-2 text-xs font-bold text-[#133326] bg-[#A7E97F] hover:bg-[#95DF69] rounded-full transition-colors"
      >
        Reset Semua Filter
      </button>
    </div>
  );
};
