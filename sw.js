/* ============================================================
   EMAN Developer Center — Service Worker (PWA)
   Menyimpan aset aplikasi agar bisa dipasang & dibuka offline.
   Data aplikasi TIDAK disimpan di sini (data ada di localStorage
   dan Firestore) — SW hanya menyimpan file aplikasi.
   ============================================================ */

const CACHE  = 'eman-pwa-v8';
const ASSETS = [
    './',
    './index.html',
    './portal.html',
    './manifest.webmanifest',
    './firebase-config.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', function(e){
    e.waitUntil(
        caches.open(CACHE)
            .then(function(c){ return c.addAll(ASSETS); })
            .then(function(){ return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function(e){
    e.waitUntil(
        caches.keys().then(function(keys){
            return Promise.all(
                keys.filter(function(k){ return k !== CACHE; })
                    .map(function(k){ return caches.delete(k); })
            );
        }).then(function(){ return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function(e){
    if(e.request.method !== 'GET'){ return; }

    /* Firebase SDK & Firestore selalu langsung ke jaringan. */
    if(e.request.url.indexOf('gstatic.com') !== -1 ||
       e.request.url.indexOf('googleapis.com') !== -1 ||
       e.request.url.indexOf('firebaseio.com') !== -1){
        return;
    }

    e.respondWith(
        caches.match(e.request).then(function(hit){
            if(hit){ return hit; }
            return fetch(e.request).then(function(res){
                const copy = res.clone();
                caches.open(CACHE).then(function(c){
                    c.put(e.request, copy);
                }).catch(function(){});
                return res;
            }).catch(function(){
                /* Offline & belum ada cache -> buka halaman utama */
                return caches.match('./index.html');
            });
        })
    );
});
