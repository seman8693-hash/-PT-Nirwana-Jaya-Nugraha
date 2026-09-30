import { PosProduct, UrgencyLevel } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Menghitung analisis restok cerdas berdasarkan rata-rata penjualan bulanan
 */
export function calculateSmartRestockMetrics(
  stock: number,
  monthlyAvgSales: number,
  leadTimeDays: number = 7
): {
  dailyAvgSales: number;
  estimatedDaysLeft: number;
  recommendedReorderQty: number;
  urgency: UrgencyLevel;
} {
  const daily = Math.max(0.1, monthlyAvgSales / 30);
  const daysLeft = Math.round(stock / daily);

  let urgency: UrgencyLevel = 'optimal';
  let recommended = 0;

  if (daysLeft <= 7) {
    urgency = 'critical';
    // Butuh stok untuk 30 hari ke depan ditambah safety buffer lead time
    recommended = Math.max(10, Math.ceil(monthlyAvgSales * 1.2 - stock));
  } else if (daysLeft <= 20) {
    urgency = 'warning';
    recommended = Math.max(5, Math.ceil(monthlyAvgSales - stock));
  } else if (daysLeft > 90) {
    urgency = 'surplus';
    recommended = 0;
  } else {
    urgency = 'optimal';
    recommended = 0;
  }

  return {
    dailyAvgSales: parseFloat(daily.toFixed(1)),
    estimatedDaysLeft: daysLeft,
    recommendedReorderQty: Math.max(0, recommended),
    urgency
  };
}
