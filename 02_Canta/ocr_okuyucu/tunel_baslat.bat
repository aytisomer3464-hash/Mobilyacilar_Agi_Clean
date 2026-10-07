@echo off
setlocal
cd /d "%~dp0"
title Kesim OCR kalici tunel
if not exist ".venv\Scripts\python.exe" (
  echo Sanal ortam bulunamadi.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" tunel.py
pause
