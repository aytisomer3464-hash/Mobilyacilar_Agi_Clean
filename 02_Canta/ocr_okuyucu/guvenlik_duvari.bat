@echo off
setlocal
cd /d "%~dp0"
title Kesim OCR - Guvenlik duvari

:: Telefon ayni Wi-Fi'den 8765'e ulassin diye Ozel profilde TCP izni.
:: Yonetici gerekir; reddedilirse sessizce cikilir. OCR motoruna dokunmaz.

net session >nul 2>&1
if errorlevel 1 (
  echo Yonetici izni isteniyor...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b 0
)

netsh advfirewall firewall delete rule name="Kesim OCR LAN 8765" >nul 2>&1
netsh advfirewall firewall add rule name="Kesim OCR LAN 8765" dir=in action=allow protocol=TCP localport=8765 profile=private
if errorlevel 1 (
  echo Kural eklenemedi.
  pause
  exit /b 1
)
echo Tamam: Ozel agda TCP 8765 acildi. Telefondan http://BILGISAYAR-IP:8765 acin.
pause
