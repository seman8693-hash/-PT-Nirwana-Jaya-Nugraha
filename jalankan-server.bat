@echo off
title EMAN Developer Center - Server
cd /d "%~dp0"
start "" "http://localhost:8080/index.html"
node server.js
pause
