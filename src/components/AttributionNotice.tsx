import React from 'react';
import { HelpCircle } from 'lucide-react';

export const AttributionNotice: React.FC = () => {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 mb-6">
      <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="leading-relaxed">
        <span className="font-semibold text-slate-900">Catatan Model Atribusi: </span>
        GMV Ads dan ROAS mengikuti attribution model dari masing-masing platform. Perbandingan lintas kanal harus memperhatikan perbedaan attribution window dan definisi revenue.
        <span className="text-slate-500 ml-1">
          (Data Shopee saat ini menggunakan broad attribution 7-hari; direct attribution tercatat di memo internal).
        </span>
      </div>
    </div>
  );
};

