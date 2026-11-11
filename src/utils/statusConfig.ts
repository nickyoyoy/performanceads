import { AdsDataStatus } from '../types/ads';

export interface StatusMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const STATUS_CONFIG: Record<AdsDataStatus, StatusMeta> = {
  verified: {
    label: 'Terverifikasi',
    badgeBg: 'bg-[#D7F7C4]',
    badgeText: 'text-[#133326]',
    badgeBorder: 'border-[#B9EB9B]',
    dotColor: 'bg-[#133326]',
    description: 'Data aktual berhasil ditarik dan terverifikasi dari sumber API/dasbor.',
  },
  partial: {
    label: 'Sebagian (Partial)',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Sebagian metrik tersedia atau waktu penarikan belum mencakup 24 jam penuh.',
  },
  authentication_required: {
    label: 'Autentikasi Diperlukan',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    dotColor: 'bg-orange-500',
    description: 'Sesi login kadaluarsa, butuh verifikasi OTP SMS, atau kredensial API belum diotorisasi.',
  },
  unavailable: {
    label: 'Tidak Tersedia',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
    description: 'Kanal atau akun iklan belum memiliki akses data aktif untuk periode ini.',
  },
  api_error: {
    label: 'API Error',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
    dotColor: 'bg-red-500',
    description: 'Terjadi kegagalan komunikasi HTTP/API pada gateway platform iklan.',
  },
  pending: {
    label: 'Menunggu (Pending)',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-400',
    description: 'Penarikan data terjadwal sedang dalam antrean eksekusi sistem.',
  },
  stale: {
    label: 'Kadaluarsa (Stale)',
    badgeBg: 'bg-yellow-50',
    badgeText: 'text-yellow-800',
    badgeBorder: 'border-yellow-200',
    dotColor: 'bg-yellow-500',
    description: 'Data belum diperbarui lebih dari 24 jam dari jadwal cutoff operasional.',
  },
  unknown: {
    label: 'Status Tidak Dikenal',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    badgeBorder: 'border-gray-200',
    dotColor: 'bg-gray-400',
    description: 'Status data belum teridentifikasi secara baku dalam skema.',
  },
};

