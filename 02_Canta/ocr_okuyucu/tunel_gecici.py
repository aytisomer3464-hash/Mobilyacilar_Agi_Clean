"""Geçici trycloudflare tüneli: token / named tunnel istemez; her çalıştırmada yeni adres."""

from __future__ import annotations

import os
import re
import subprocess
import sys

from dotenv import load_dotenv

from sunucu import VARSAYILAN_PORT, ortam_yukle
from tunel import cloudflared_yolu, kok

TRYCLOUDFLARE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com", re.IGNORECASE)


def trycloudflare_adresi(satir: str) -> str | None:
    eslesme = TRYCLOUDFLARE.search(satir or "")
    if not eslesme:
        return None
    return eslesme.group(0).rstrip("/")


def adresi_yaz(adres: str) -> None:
    print(f"Dışarıdan paylaş: {adres}")
    print(f"Okuyucu: {adres}/okuyucu")
    sys.stdout.flush()


def ciktiyi_isle(satir: str, bulunan: list[str]) -> str | None:
    adres = trycloudflare_adresi(satir)
    if not adres or adres in bulunan:
        return None
    bulunan.append(adres)
    adresi_yaz(adres)
    return adres


def tunel_komutu(exe: str, port: str) -> list[str]:
    return [exe, "tunnel", "--no-autoupdate", "--url", f"http://127.0.0.1:{port}"]


def sureci_izle(surec: subprocess.Popen[str]) -> int:
    bulunan: list[str] = []
    cikti = surec.stdout
    if cikti is not None:
        for satir in cikti:
            ciktiyi_isle(satir, bulunan)
    kod = surec.wait()
    if not bulunan:
        print("trycloudflare adresi çıkmadı. Önce baslat.bat ile sunucuyu açın; cloudflared penceresini kapatmayın.")
    return kod


def main() -> int:
    ortam_yukle()
    load_dotenv(kok() / ".env")
    exe = cloudflared_yolu()
    if not exe:
        print("cloudflared bulunamadı. PATH'e ekleyin veya cloudflare/cloudflared.exe koyun.")
        print("Kurulum: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
        return 1
    port = os.environ.get("OCR_PORT", str(VARSAYILAN_PORT))
    print(f"Yerel servis hedefi: http://127.0.0.1:{port}")
    print("Geçici tünel (trycloudflare). Cloudflare token gerekmez. Pencere kapanınca link düşer.")
    print("Önce baslat.bat çalışıyor olsun. Link aşağıda görününce onu verin.")
    sys.stdout.flush()
    try:
        surec = subprocess.Popen(
            tunel_komutu(exe, port),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
    except OSError as hata:
        print(f"cloudflared başlatılamadı: {hata}")
        return 1
    try:
        return sureci_izle(surec)
    except KeyboardInterrupt:
        surec.terminate()
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
