import React from 'react';
import { HelpCircle } from 'lucide-react';

export const AttributionNotice: React.FC = () => {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[#E2EBE0] text-xs text-slate-600 mb-6 shadow-2xs">
      <div className="w-7 h-7 rounded-xl bg-[#EAF2E8] text-[#133326] flex items-center justify-center flex-shrink-0">
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      </div>
      <div className="leading-relaxed">
        <span className="font-bold text-[#133326]">Catatan Model Atribusi: </span>
        GMV Ads dan ROAS mengikuti attribution model dari masing-masing platform. Perbandingan lintas kanal harus memperhatikan perbedaan attribution window dan definisi revenue.
        <span className="text-slate-500 ml-1">
          (Data Shopee saat ini menggunakan broad attribution 7-hari; direct attribution tercatat di memo internal).
        </span>
      </div>
    </div>
  );
};
