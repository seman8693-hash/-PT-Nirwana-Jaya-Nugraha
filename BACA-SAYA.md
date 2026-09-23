# EMAN Developer Center

Aplikasi web dashboard untuk mengelola proyek pengembangan software:
klien, proyek, permintaan fitur, development, testing, deployment,
aktivasi modul, backup, dan audit log. Semuanya dalam **satu file
HTML** tanpa instalasi.

## Cara menjalankan

**Cara biasa:** klik dua kali **`buka-aplikasi.bat`** (atau buka
`index.html` langsung di browser). Tidak perlu internet.

**Cara PWA (agar bisa dipasang di HP/laptop):**
1. Klik dua kali **`jalankan-server.bat`** (butuh Node.js)
2. Browser terbuka di `http://localhost:8080`
3. Di Chrome/Edge: klik ikon **"Install" / "Pasang"** di address bar

**Di HP (perlu hosting online):**
Deploy folder ini ke hosting gratis (mis. Firebase Hosting atau
GitHub Pages), buka alamatnya di HP Chrome, lalu menu browser →
**"Tambahkan ke layar utama"**.

## Di mana data disimpan?

- Semua data otomatis tersimpan di **browser** (localStorage,
  key: `eman_state_v2`) setiap kali Anda menekan tombol simpan.
- Data aman selama Anda memakai browser & komputer yang sama dan
  tidak menghapus data situs browser.

## Backup & pulihkan (data bisa terunduh)

1. Buka menu **Backup Center** → klik **Backup & Unduh**.
   Aplikasi akan mengunduh file `eman-backup-....json` berisi
   seluruh data Anda.
2. Untuk memuat kembali: klik **Pulihkan dari File**, pilih file
   backup JSON, dan konfirmasi.

Simpan file backup secara berkala (mis. mingguan) agar data tidak
hilang jika browser di-reset.

## Sinkronisasi cloud (opsional)

Secara default aplikasi berjalan **mode lokal**. Jika ingin data
sinkron antar perangkat:

1. Buat project di https://console.firebase.google.com (gratis)
2. Isi `firebase-config.js` sesuai petunjuk di dalamnya
3. Buka lagi aplikasi — status di pojok atas akan berubah
   menjadi "Firestore"

## Struktur folder

```
eman-developer-center/
├── index.html          <- seluruh aplikasi (HTML+CSS+JS)
├── firebase-config.js  <- konfigurasi cloud (opsional)
├── buka-aplikasi.bat   <- cara cepat membuka aplikasi
└── BACA-SAYA.md        <- file ini
```

## Portal Klien

Halaman `portal.html` khusus klien (buka lewat link **"Portal Klien ↗"**
di bawah sidebar, atau `http://localhost:8080/portal.html`):

1. Klien login dengan **kode akses** — kodenya adalah `key` klien yang
   terdaftar di aplikasi (contoh bawaan: `ihza`, `trens`, `pos`, `contoh`)
2. Klien hanya melihat **project & request miliknya sendiri**
3. Klien bisa **mengajukan request fitur baru** → otomatis tersimpan ke
   cloud dan langsung muncul di dashboard utama (status REQUESTED)
4. Status progres diperbarui otomatis (realtime) mengikuti alur kerja
   di dashboard utama

## Cara mengembangkan lebih lanjut

Seluruh kode ada di `index.html`:

- **Gaya/tampilan** → blok `<style>` di atas (design system
  dengan CSS variables, mendukung mode gelap/terang)
- **Halaman/menu** → cari `<section id="..." class="page">`
  (dashboard, projects, clients, requests, dst.)
- **Logika data** → blok `<script>` utama; state disimpan di
  variabel `state` dan otomatis dipersist ke localStorage
- **Menambah halaman baru**: buat `<section id="xxx" class="page">`,
  tambahkan tombol nav `data-page="xxx"`, lalu fungsi
  `renderXxx()` dan daftarkan di `renderAll()`
