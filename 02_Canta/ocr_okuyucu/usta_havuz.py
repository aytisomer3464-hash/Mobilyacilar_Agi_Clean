"""Ortak usta havuzu: arşivdeki onaylı kesim kalıplarıyla ölçü eşleştirme."""

from __future__ import annotations

import json
import threading
from collections import Counter
from pathlib import Path
from typing import Any

from arsiv import arsiv_kok
from hata_kayit import ARSIV, hata_yaz

MIN_PARCA = 3
ESLESME_ORAN = 0.85
TOLERANS_MM = 2.0
MAKS_KAYIT = 48

_ONBELLEK_KILIT = threading.Lock()
_onbellek_damga: tuple | None = None
_onbellek_kaliplar: list[list[dict[str, Any]]] = []


def _sayi(deger: Any) -> float | None:
    try:
        n = float(deger)
    except (TypeError, ValueError):
        return None
    if n != n:  # NaN
        return None
    return n


def olcu_anahtari(parca: dict[str, Any]) -> tuple[int, int, int] | None:
    boy = _sayi(parca.get("uzunluk_mm"))
    en = _sayi(parca.get("genislik_mm"))
    if boy is None or en is None:
        return None
    adet = parca.get("adet")
    try:
        adet_n = int(adet)
    except (TypeError, ValueError):
        adet_n = 1
    if adet_n < 1:
        adet_n = 1
    adim = int(TOLERANS_MM) or 2
    return (int(round(boy / adim) * adim), int(round(en / adim) * adim), adet_n)


def liste_imzasi(liste: list[dict[str, Any]]) -> Counter:
    sayac: Counter = Counter()
    for parca in liste:
        if not isinstance(parca, dict):
            continue
        anahtar = olcu_anahtari(parca)
        if anahtar:
            sayac[anahtar] += 1
    return sayac


def imza_benzerlik(aday: Counter, kalip: Counter) -> float:
    if not aday or not kalip:
        return 0.0
    ortak = sum((aday & kalip).values())
    tavan = max(sum(aday.values()), sum(kalip.values()), 1)
    return ortak / tavan


def _liste_oku(yol) -> list[dict[str, Any]]:
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, TypeError):
        return []
    if not isinstance(veri, dict):
        return []
    liste = veri.get("kesim_listesi")
    if not isinstance(liste, list):
        return []
    return [p for p in liste if isinstance(p, dict)]


def _dosya_damgasi(yol: Path) -> int | None:
    try:
        return yol.stat().st_mtime_ns
    except OSError:
        return None


def havuz_kaliplari() -> list[list[dict[str, Any]]]:
    """Kalıplar RAM'de; arşivdeki klasör adı veya JSON tarihi değişince yeniden okunur."""
    global _onbellek_damga, _onbellek_kaliplar
    try:
        kok = arsiv_kok()
        klasorler = sorted((p for p in kok.iterdir() if p.is_dir()), key=lambda p: p.name, reverse=True)
    except OSError as hata:
        hata_yaz(ARSIV, "Usta havuzu klasörü okunamadı", hata)
        return []
    klasorler = klasorler[:MAKS_KAYIT]
    damga = tuple(
        (k.name, _dosya_damgasi(k / "duzeltilmis.json"), _dosya_damgasi(k / "ham.json")) for k in klasorler
    )
    with _ONBELLEK_KILIT:
        if damga == _onbellek_damga:
            return list(_onbellek_kaliplar)
        kaliplar: list[list[dict[str, Any]]] = []
        for klasor in klasorler:
            liste = _liste_oku(klasor / "duzeltilmis.json") or _liste_oku(klasor / "ham.json")
            if len(liste_imzasi(liste)) >= MIN_PARCA:
                kaliplar.append(liste)
        _onbellek_damga = damga
        _onbellek_kaliplar = kaliplar
        return list(kaliplar)


def kalip_bul(aday_parcalar: list[dict[str, Any]]) -> list[dict[str, Any]] | None:
    """Net ölçü eşleşmesinde arşiv kalıbını döndürür; aksi halde None (Gemini'ye gidilir)."""
    try:
        aday = [p for p in aday_parcalar if isinstance(p, dict)]
        imza = liste_imzasi(aday)
        if sum(imza.values()) < MIN_PARCA:
            return None
        en_iyi: list[dict[str, Any]] | None = None
        en_skor = 0.0
        for kalip in havuz_kaliplari():
            skor = imza_benzerlik(imza, liste_imzasi(kalip))
            if skor > en_skor:
                en_skor = skor
                en_iyi = kalip
        if en_iyi is not None and en_skor >= ESLESME_ORAN:
            return [dict(p) for p in en_iyi]
    except Exception as hata:
        hata_yaz(ARSIV, "Usta havuzu eşleşmesi başarısız, Gemini yolu açık", hata)
    return None
