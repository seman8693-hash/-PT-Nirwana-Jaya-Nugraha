import { LicenseInfo } from '../types';

/**
 * Utilitas Manajemen Lisensi & Masa Berlaku ERP
 * Toko Nirwana Jaya Nugraha (Owner: Rudi Ruhdiana)
 */

export function calculateDaysRemaining(validUntilStr: string): number {
  if (!validUntilStr) return 0;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parsing YYYY-MM-DD
    const parts = validUntilStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const target = new Date(year, month, day);
      target.setHours(0, 0, 0, 0);

      const diffMs = target.getTime() - today.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    const target = new Date(validUntilStr);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function formatDaysRemainingText(days: number): {
  text: string;
  badgeClass: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  if (days < 0) {
    return {
      text: `Masa Berlaku Habis (${Math.abs(days)} hari lalu)`,
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      isUrgent: true,
      isExpired: true
    };
  }
  if (days === 0) {
    return {
      text: 'Berakhir Hari Ini',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
      isUrgent: true,
      isExpired: false
    };
  }
  if (days <= 7) {
    return {
      text: `sisa ${days} hari`,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      isUrgent: true,
      isExpired: false
    };
  }
  if (days <= 30) {
    return {
      text: `sisa ${days} hari`,
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      isUrgent: false,
      isExpired: false
    };
  }
  return {
    text: `sisa ${days} hari`,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    isUrgent: false,
    isExpired: false
  };
}

export function addDaysToDate(baseDateStr: string, daysToAdd: number): string {
  try {
    let baseDate: Date;
    if (baseDateStr && baseDateStr.includes('-')) {
      const parts = baseDateStr.split('-');
      baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      baseDate = new Date();
    }

    // Jika baseDate sudah lewat dari hari ini, perpanjang dari hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (baseDate.getTime() < today.getTime()) {
      baseDate = new Date(today);
    }

    baseDate.setDate(baseDate.getDate() + daysToAdd);

    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + daysToAdd);
    return fallback.toISOString().split('T')[0];
  }
}

export function generateLicenseKey(ownerInitials = 'RR'): string {
  const currentYear = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NJN-ERP-${currentYear}-${ownerInitials}-${rand}`;
}
