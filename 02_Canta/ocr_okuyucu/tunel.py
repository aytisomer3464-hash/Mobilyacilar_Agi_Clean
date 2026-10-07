"""Kalıcı Cloudflare named tunnel: geçici trycloudflare adresi üretmez."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

from dotenv import load_dotenv

from sunucu import VARSAYILAN_PORT, ortam_yukle


def kok() -> Path:
    return Path(__file__).resolve().parent


def cloudflared_yolu() -> str | None:
    yerel = kok() / "cloudflare" / "cloudflared.exe"
    if yerel.is_file():
        return str(yerel)
    return shutil.which("cloudflared")


def paylasim_adresini_yaz() -> None:
    """Named tunnel hostname; trycloudflare üretmez."""
    url = os.environ.get("OCR_PUBLIC_URL", "").strip().rstrip("/")
    if url:
        print(f"Dışarıdan paylaş: {url}")
        return
    print("Zero Trust hostname'i .env OCR_PUBLIC_URL'ye yazın.")


def main() -> int:
    ortam_yukle()
    load_dotenv(kok() / ".env")
    exe = cloudflared_yolu()
    if not exe:
        print("cloudflared bulunamadı. PATH'e ekleyin veya cloudflare/cloudflared.exe koyun.")
        print("Kurulum: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/")
        return 1
    token = os.environ.get("CLOUDFLARE_TUNNEL_TOKEN", "").strip()
    config = kok() / "cloudflare" / "config.yml"
    port = os.environ.get("OCR_PORT", str(VARSAYILAN_PORT))
    print(f"Yerel servis hedefi: http://127.0.0.1:{port}")
    if token:
        print("Named tunnel: CLOUDFLARE_TUNNEL_TOKEN ile çalışıyor (sabit hostname Zero Trust'ta).")
        paylasim_adresini_yaz()
        return subprocess.call([exe, "tunnel", "run", "--token", token])
    if config.is_file():
        print(f"Named tunnel: {config}")
        paylasim_adresini_yaz()
        return subprocess.call([exe, "tunnel", "--config", str(config), "run"])
    print("CLOUDFLARE_TUNNEL_TOKEN veya cloudflare/config.yml yok.")
    print("Zero Trust → Networks → Tunnels → named tunnel oluşturun; token'ı .env'ye yazın.")
    print("Geçici trycloudflare bu betikte yok. Token’suz link: tunel_gecici.bat")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
