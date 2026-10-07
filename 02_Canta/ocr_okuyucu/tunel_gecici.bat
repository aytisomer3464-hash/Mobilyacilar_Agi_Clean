@echo off
setlocal
cd /d "%~dp0"
title Kesim OCR gecici tunel
if not exist ".venv\Scripts\python.exe" (
  echo Sanal ortam bulunamadi.
  pause
  exit /b 1
)
echo Once baslat.bat acik olsun. Token gerekmez.
".venv\Scripts\python.exe" tunel_gecici.py
pause
