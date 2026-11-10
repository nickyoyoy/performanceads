import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

interface FallbackIndicatorProps {
  isFallback: boolean;
  sourceUrl: string;
}

export const FallbackIndicator: React.FC<FallbackIndicatorProps> = ({ isFallback, sourceUrl }) => {
  if (!isFallback) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md text-amber-900 shadow-sm mb-6 transition-all"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-xs tracking-wider uppercase">
              Demo Fallback Data
            </span>
            <span className="text-amber-800 font-medium">
              Mode Offline / Local Snapshot Aktif
            </span>
          </div>
          <p className="mt-1 text-amber-800 leading-relaxed">
            Koneksi live ke Google Sheets tidak dapat diakses (misal pembatasan jaringan sandbox atau timeout). Sistem menggunakan fixture data lokal terpisah (<code className="bg-amber-100 px-1 py-0.5 rounded text-xs font-mono">{sourceUrl}</code>) agar dashboard tetap dapat ditinjau.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full">
          <Database className="w-3.5 h-3.5" />
          <span>Local Fixture Active</span>
        </div>
      </div>
    </div>
  );
};

