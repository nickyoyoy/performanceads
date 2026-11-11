import React from 'react';
import { HelpCircle } from 'lucide-react';

export const AttributionNotice: React.FC = () => {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E2EBE0] text-2xs text-slate-600 shadow-2xs">
      <div className="w-6 h-6 rounded-lg bg-[#EAF2E8] text-[#133326] flex items-center justify-center flex-shrink-0 mt-0.5">
        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
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
