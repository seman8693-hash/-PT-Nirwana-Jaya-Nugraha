/**
 * Fungsi Konversi Angka ke Huruf Terbilang Bahasa Indonesia
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */

export function terbilang(nominal: number): string {
  if (nominal === 0) return 'Nol Rupiah';
  if (nominal < 0) return `Minus ${terbilang(Math.abs(nominal))}`;

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas'
  ];

  function convert(n: number): string {
    if (n < 12) {
      return satuan[n];
    } else if (n < 20) {
      return `${convert(n - 10)} Belas`;
    } else if (n < 100) {
      return `${convert(Math.floor(n / 10))} Puluh ${convert(n % 10)}`.trim();
    } else if (n < 200) {
      return `Seratus ${convert(n - 100)}`.trim();
    } else if (n < 1000) {
      return `${convert(Math.floor(n / 100))} Ratus ${convert(n % 100)}`.trim();
    } else if (n < 2000) {
      return `Seribu ${convert(n - 1000)}`.trim();
    } else if (n < 1000000) {
      return `${convert(Math.floor(n / 1000))} Ribu ${convert(n % 1000)}`.trim();
    } else if (n < 1000000000) {
      return `${convert(Math.floor(n / 1000000))} Juta ${convert(n % 1000000)}`.trim();
    } else if (n < 1000000000000) {
      return `${convert(Math.floor(n / 1000000000))} Miliar ${convert(n % 1000000000)}`.trim();
    } else {
      return `${convert(Math.floor(n / 1000000000000))} Triliun ${convert(n % 1000000000000)}`.trim();
    }
  }

  const hasil = convert(Math.floor(nominal)).trim();
  return `${hasil} Rupiah`;
}
