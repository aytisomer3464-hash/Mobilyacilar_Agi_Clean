"""Kara kutu: istisnaları çökertmeden veri/hatalar/hata_kayitlari.log dosyasına yazar."""

from __future__ import annotations

import os
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ogrenme_kurallari import veri_kok

HATA_ALT = "hatalar"
LOG_ADI = "hata_kayitlari.log"

OCR_YEREL = "OCR_YEREL"
GEMINI_API = "GEMINI_API"
ON_ISLEME = "ON_ISLEME"
BORU_HATTI = "BORU_HATTI"
DOSYA = "DOSYA"
ARSIV = "ARSIV"
KOTA = "KOTA"
SUNUCU = "SUNUCU"
OKUMA = "OKUMA"
USTA_GERI = "USTA_GERI"  # usta ses/metin notu; istisna değildir
SAGLIK = "SAGLIK"  # sağlık senkron imzası; çökme kaydı değildir


def hata_dizini() -> Path:
    yol = veri_kok() / HATA_ALT
    yol.mkdir(parents=True, exist_ok=True)
    return yol


def hata_log_yolu() -> Path:
    return hata_dizini() / LOG_ADI


def _satir(kod: str, aciklama: str, hata: BaseException | None) -> str:
    damga = datetime.now(timezone.utc).isoformat(timespec="seconds")
    parcalar = [damga, str(kod or "BILINMEYEN"), (aciklama or "").replace("\n", " ").strip()]
    if hata is not None:
        parcalar.append(f"{type(hata).__name__}: {hata}")
        iz = "".join(traceback.format_exception(type(hata), hata, hata.__traceback__))
        kisa = " | ".join(satir.strip() for satir in iz.splitlines() if satir.strip())[:800]
        if kisa:
            parcalar.append(kisa)
    return " | ".join(parcalar) + "\n"


def hata_yaz(kod: str, aciklama: str, hata: Any = None) -> None:
    """Zaman damgası, kod ve açıklama yazar; dosya hatasında da yükseltmez."""
    istisna = hata if isinstance(hata, BaseException) else None
    satir = _satir(kod, aciklama, istisna)
    try:
        yol = hata_log_yolu()
        with yol.open("a", encoding="utf-8") as dosya:
            dosya.write(satir)
            dosya.flush()
            try:
                os.fsync(dosya.fileno())
            except OSError:
                pass
    except Exception:
        try:
            sys.stderr.write(satir)
            sys.stderr.flush()
        except Exception:
            return
