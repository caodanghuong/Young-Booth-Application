@echo off
rem Nhấp đúp file này để cài YoungBooth trên máy mới (tự xin quyền Administrator).
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0CAI-DAT.ps1\"'"
