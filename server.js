/* Server lokal sederhana untuk EMAN Developer Center (PWA).
   Jalankan: node server.js  (atau klik dua kali jalankan-server.bat) */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;

const MIME = {
    '.html'       : 'text/html; charset=utf-8',
    '.js'         : 'text/javascript; charset=utf-8',
    '.css'        : 'text/css; charset=utf-8',
    '.json'       : 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.png'        : 'image/png',
    '.jpg'        : 'image/jpeg',
    '.svg'        : 'image/svg+xml',
    '.ico'        : 'image/x-icon'
};

http.createServer(function(req, res){
    let urlPath;
    try{
        urlPath = decodeURIComponent(req.url.split('?')[0]);
    }catch(err){
        res.writeHead(400); return res.end('Bad request');
    }

    if(urlPath === '/'){ urlPath = '/index.html'; }

    const file = path.normalize(path.join(ROOT, urlPath));
    if(!file.startsWith(ROOT)){
        res.writeHead(403); return res.end('Forbidden');
    }

    fs.readFile(file, function(err, data){
        if(err){
            res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
            return res.end('404 - Tidak ditemukan: ' + urlPath);
        }
        res.writeHead(200, {
            'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream'
        });
        res.end(data);
    });

}).listen(PORT, function(){
    console.log('');
    console.log('  EMAN Developer Center berjalan di:');
    console.log('  http://localhost:' + PORT);
    console.log('');
    console.log('  (Ctrl+C untuk berhenti)');
});
