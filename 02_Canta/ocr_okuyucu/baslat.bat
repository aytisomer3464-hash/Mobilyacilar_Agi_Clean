@echo off
setlocal
cd /d "%~dp0"
title Kesim OCR

if not exist ".venv\Scripts\python.exe" (
    echo Sanal ortam olusturuluyor...
    python -m venv .venv
)

call .venv\Scripts\activate

echo Gereksinimler kontrol ediliyor ve yukleniyor...
pip install -r requirements.txt --quiet

:: Yalniz bu makine: 127.0.0.1:8765 (harici/LAN bind yok)
start "" powershell -NoProfile -WindowStyle Hidden -Command "$u='http://127.0.0.1:8765/'; for($i=0;$i -lt 40;$i++) { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 -Uri ($u+'favicon.ico') | Out-Null; break } catch { Start-Sleep -Milliseconds 250 } }; Start-Process $u"

python -m uvicorn sunucu:app --host 127.0.0.1 --port 8765
pause