"""Öğrenilmiş atölye kuralları: dosyadan okunur, kod içi varsayılanlarla birleşir."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

VARSAYILAN_KURALLAR: dict[str, Any] = {
    "surum": 1,
    "standart_kalinliklar": [18.0, 8.0, 4.0, 3.0],
    "kalinlik_yakinlik": 0.6,
    "boy_toleransi_mm": 2.0,
    "cm_mm_ust_sinir": 350.0,
    "standart_derinlikler": [300.0, 320.0, 350.0, 400.0, 450.0, 500.0, 560.0, 580.0, 600.0],
    "usta_olcu_tolerans_mm": 3.0,
    "kapak_bosluk_mm": 2.0,
    "malzeme_kelimeleri": [
        "mdflam", "mdf", "sunta", "beyaz", "ceviz", "lam", "lake", "akrilik",
        "meşe", "antrasit", "18 mm", "8 mm", "3 mm", "4 mm",
    ],
    "parca_kelimeleri": [
        "dikme", "tabla", "raf", "kapak", "klapa", "dolap", "defter",
        "arkalık", "arkalik", "gövde", "govde", "yan", "bağlantı", "baglanti",
        "çıta", "cita", "kasa", "çekmece", "cekmece",
    ],
    "parca_adi_esle": {},
    "modul_esle": {},
    "malzeme_esle": {},
    "gemini_notlari": [],
    "ozel_bant_mm": [],
}


def veri_kok() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent / "veri"
    return Path(__file__).resolve().parent / "veri"


def ogrenme_dizini() -> Path:
    yol = veri_kok() / "ogrenme"
    yol.mkdir(parents=True, exist_ok=True)
    return yol


def kurallar_yolu() -> Path:
    return ogrenme_dizini() / "kurallar.json"


def _birlestir(taban: dict[str, Any], uzerine: dict[str, Any]) -> dict[str, Any]:
    sonuc = dict(taban)
    for anahtar, deger in uzerine.items():
        if anahtar in sonuc and isinstance(sonuc[anahtar], dict) and isinstance(deger, dict):
            birlesik = dict(sonuc[anahtar])
            birlesik.update({str(k): v for k, v in deger.items()})
            sonuc[anahtar] = birlesik
        elif anahtar in sonuc and isinstance(sonuc[anahtar], list) and isinstance(deger, list):
            if anahtar in ("standart_kalinliklar", "ozel_bant_mm"):
                sayilar = []
                for oge in list(sonuc[anahtar]) + list(deger):
                    try:
                        sayi = float(oge)
                    except (TypeError, ValueError):
                        continue
                    if sayi not in sayilar:
                        sayilar.append(sayi)
                sonuc[anahtar] = sayilar
            else:
                gorulen = {str(x).lower() for x in sonuc[anahtar]}
                birlesik = list(sonuc[anahtar])
                for oge in deger:
                    if str(oge).lower() not in gorulen:
                        birlesik.append(oge)
                        gorulen.add(str(oge).lower())
                sonuc[anahtar] = birlesik
        else:
            sonuc[anahtar] = deger
    return sonuc


def kurallari_yukle() -> dict[str, Any]:
    yol = kurallar_yolu()
    if not yol.exists():
        return dict(VARSAYILAN_KURALLAR)
    try:
        ham = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return dict(VARSAYILAN_KURALLAR)
    if not isinstance(ham, dict):
        return dict(VARSAYILAN_KURALLAR)
    return _birlestir(VARSAYILAN_KURALLAR, ham)


def kurallari_kaydet(kurallar: dict[str, Any]) -> None:
    yol = kurallar_yolu()
    yol.parent.mkdir(parents=True, exist_ok=True)
    gecici = yol.with_suffix(".json.tmp")
    gecici.write_text(json.dumps(kurallar, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(gecici, yol)
