@echo off
title Confection3D Server Loader
echo Starting local web server for Confection3D...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
