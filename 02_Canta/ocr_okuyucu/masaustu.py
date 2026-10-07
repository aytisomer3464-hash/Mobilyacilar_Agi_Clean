"""Yerel HTTP vitrin: tarayıcı ve telefon aynı arayüzü kullanır.

Sunucuyu `sunucu.app` ile açar; OCR'yi kendisi çalıştırmaz.
Bu dosya `ocr_okuyucu/` içinde kalır; kök veya ana siteye taşınmaz.
"""

from __future__ import annotations

import os
import socket
import sys
import threading
import time
import traceback
import webbrowser
from pathlib import Path

# Konsolsuz .exe'de print çökmesin
_LOG_DIZIN = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
if getattr(sys, "frozen", False) and (sys.stdout is None or sys.stderr is None):
    _log = open(_LOG_DIZIN / "hata_log.txt", "a", buffering=1, encoding="utf-8")
    sys.stdout = _log
    sys.stderr = _log

if str(_LOG_DIZIN) not in sys.path:
    sys.path.insert(0, str(_LOG_DIZIN))

import tkinter as tk
import uvicorn

from sunucu import app, lan_adresleri, ortam_yukle, sabit_adres


def _host_port() -> tuple[str, int]:
    ortam_yukle()
    return "127.0.0.1", 8765


def sunucuyu_baslat(host: str, port: int) -> uvicorn.Server:
    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    sunucu = uvicorn.Server(config)
    thread = threading.Thread(target=sunucu.run, daemon=True)
    thread.start()
    return sunucu


def _port_acik(port: int, host: str = "127.0.0.1") -> bool:
    try:
        with socket.create_connection((host, port), timeout=0.2):
            return True
    except OSError:
        return False


def sunucu_hazir_olana_kadar(sunucu, port: int, zaman_asimi: float = 20.0, adim: float = 0.1) -> bool:
    """Uvicorn started veya TCP dinleme; tarayıcıyı servis yokken açmaz."""
    bitis = time.monotonic() + zaman_asimi
    while time.monotonic() < bitis:
        if getattr(sunucu, "started", False) or _port_acik(port):
            return True
        time.sleep(adim)
    return bool(getattr(sunucu, "started", False) or _port_acik(port))


def pencere_ac(port: int, sunucu: uvicorn.Server | None = None) -> None:
    adresler = lan_adresleri(port)
    yerel = f"http://127.0.0.1:{port}/"
    telefon = "\n".join(a for a in adresler if "127.0.0.1" not in a) or "(Wi-Fi IP bulunamadı)"
    sabit = sabit_adres()

    kok = tk.Tk()
    kok.title("Kesim OCR")
    kok.geometry("420x300")
    tk.Label(kok, text="Mobilyacılar Ağı çalışıyor", font=("Segoe UI", 14, "bold")).pack(pady=(16, 8))
    tk.Label(kok, text="Ana sayfa (bu bilgisayar):\n" + yerel, justify="left").pack(anchor="w", padx=16)
    tk.Label(kok, text="Okuyucu:\n" + yerel + "okuyucu", justify="left").pack(anchor="w", padx=16, pady=(4, 0))
    if sabit:
        tk.Label(kok, text="Sabit adres (tünel):\n" + sabit, justify="left").pack(anchor="w", padx=16, pady=(4, 0))
    tk.Label(kok, text="Telefondan (aynı Wi-Fi):\n" + telefon, justify="left").pack(anchor="w", padx=16, pady=8)
    tk.Label(
        kok,
        text="Harici arşiv: veri/arsiv/kayitlar/ klasörüne\nkroki + JSON bırakın; 25'te öğrenme çalışır.\nWindows Güvenlik Duvarı sorarsa özel ağa izin verin.",
        justify="left",
        fg="#555",
    ).pack(anchor="w", padx=16)

    def tarayici():
        webbrowser.open(yerel)

    tk.Button(kok, text="Tarayıcıyı aç", command=tarayici).pack(pady=12)

    def hazirda_ac():
        if sunucu is not None:
            sunucu_hazir_olana_kadar(sunucu, port)
        try:
            kok.after(0, tarayici)
        except Exception:
            tarayici()

    threading.Thread(target=hazirda_ac, daemon=True, name="tarayici-hazir").start()
    kok.mainloop()


def main() -> int:
    try:
        host, port = _host_port()
        sunucu = sunucuyu_baslat(host, port)
        pencere_ac(port, sunucu)
        return 0
    except Exception:
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
