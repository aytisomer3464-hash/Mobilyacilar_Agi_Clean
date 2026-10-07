"""Ustanın kaydettiği özel kenar bant kalınlıkları (standart 0.4/0.8/1/2 dışı)."""

from __future__ import annotations

from typing import Any

from arsiv import _dosya_kilidi
from ogrenme_kurallari import kurallari_kaydet, kurallari_yukle, ogrenme_dizini

STANDART_BANT = (0.4, 0.8, 1.0, 2.0)
MIN_MM = 0.2
MAKS_MM = 6.0


def _yuvarla(mm: float) -> float:
    return round(float(mm), 2)


def _standart_mi(mm: float) -> bool:
    return any(abs(mm - s) < 0.001 for s in STANDART_BANT)


def ozel_bant_oku() -> list[float]:
    ham = kurallari_yukle().get("ozel_bant_mm") or []
    liste: list[float] = []
    if not isinstance(ham, list):
        return liste
    for oge in ham:
        try:
            n = _yuvarla(float(oge))
        except (TypeError, ValueError):
            continue
        if n < MIN_MM or n > MAKS_MM or _standart_mi(n):
            continue
        if n not in liste:
            liste.append(n)
    return liste


def ozel_bant_ekle(mm: Any) -> list[float]:
    try:
        n = _yuvarla(float(str(mm).replace(",", ".")))
    except (TypeError, ValueError):
        raise ValueError("Geçerli bir milimetre girin") from None
    if n < MIN_MM or n > MAKS_MM:
        raise ValueError(f"Ölçü {MIN_MM:g}–{MAKS_MM:g} mm arasında olmalı")
    if _standart_mi(n):
        return ozel_bant_oku()
    with _dosya_kilidi(ogrenme_dizini() / "kurallar.lock"):
        kurallar = kurallari_yukle()
        mevcut = ozel_bant_oku()
        if n not in mevcut:
            mevcut.append(n)
            mevcut.sort()
        kurallar["ozel_bant_mm"] = mevcut
        kurallari_kaydet(kurallar)
        return mevcut


def ozel_bant_sil(mm: Any) -> list[float]:
    try:
        n = _yuvarla(float(str(mm).replace(",", ".")))
    except (TypeError, ValueError):
        raise ValueError("Geçerli bir milimetre girin") from None
    with _dosya_kilidi(ogrenme_dizini() / "kurallar.lock"):
        kurallar = kurallari_yukle()
        kalan = [x for x in ozel_bant_oku() if abs(x - n) >= 0.001]
        kurallar["ozel_bant_mm"] = kalan
        kurallari_kaydet(kurallar)
        return kalan
