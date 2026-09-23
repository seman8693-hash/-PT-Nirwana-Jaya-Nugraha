/* ============================================================
   EMAN DEVELOPER CENTER — Konfigurasi Firebase (opsional)

   Aplikasi ini BERJALAN TANPA file ini pun:
   semua data otomatis disimpan di browser (localStorage).

   Isi file ini HANYA jika Anda ingin data tersinkron ke cloud
   (Firestore), sehingga bisa dipakai dari banyak perangkat.

   Cara mengisi:
     1. Buka https://console.firebase.google.com
     2. Buat project baru (mis. "eman-developer-center")
     3. Tambahkan Web App, lalu salin nilai di bawah ini
        dari konfigurasi yang Firebase berikan.
     4. Aktifkan Cloud Firestore di console Firebase.

   Selama projectId masih kosong, aplikasi jalan dalam
   "Mode lokal" (data hanya di browser ini).
   ============================================================ */

window.EMAN_FIREBASE = {
    projectId : 'eman-developer-center',
    apiKey    : 'AIzaSyARgl5DLexXHlmiFAQYfrCHXcDjftSr4q4',
    authDomain: 'eman-developer-center.firebaseapp.com',
    appId     : '1:659789345574:web:fa38f01606324c2fab47e7',
    useEmulator: false       // true = pakai emulator Firestore lokal
};

/* Nama koleksi Firestore (biarkan seperti ini). */
window.EMAN_COLLECTIONS = {
    clients    : 'clients',
    projects   : 'projects',
    requests   : 'requests',
    tasks      : 'tasks',
    deployments: 'deployments',
    features   : 'features',
    audit      : 'audit',
    meta       : 'meta'
};
