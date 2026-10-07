"""Usta yazıları: kapak, dolap, defter, malzeme türü — ölçü satırı olmasa da reçeteye girer."""

from __future__ import annotations

import re
from typing import Any

from kenar_bant import bant_kodu_dogrula
from ogrenme_kurallari import kurallari_yukle

KATEGORI_ANAHTARLARI: dict[str, str] = {
    "kapak": "Kapak",
    "klapa": "Klapa",
    "aralık": "Aralık",
    "aralik": "Aralık",
    "dolap": "Gövde",
    "gövde": "Gövde",
    "govde": "Gövde",
    "kasa": "Gövde",
    "modül": "Gövde",
    "modul": "Gövde",
    "arkalık": "Arkalık",
    "arkalik": "Arkalık",
    "sırt": "Arkalık",
    "sirt": "Arkalık",
    "raf": "Gövde",
    "tabla": "Gövde",
    "dikme": "Gövde",
    "defter": "Defter",
    "sipariş": "Defter",
    "siparis": "Defter",
    "müşteri": "Defter",
    "musteri": "Defter",
}

MALZEME_TURLERI = (
    "mdflam", "mdf lam", "mdf", "sunta", "lamine", "lam", "lake", "akrilik",
    "high gloss", "highgloss", "membran", "lake boya", "lake",
    "mese", "antrasit", "gri", "siyah", "krem", "sonoma", "yıldız", "yildiz",
    "18mm", "18 mm", "8mm", "8 mm", "3mm", "3 mm", "4mm", "4 mm",
)

OLCU_IPUCU = re.compile(r"\d+(?:[.,]\d+)?\s*[xX×*]\s*\d+")
DEFTER_IPUCU = re.compile(
    r"(defter|sipariş|siparis|müşteri|musteri|telefon|adres|not\s*:)",
    re.IGNORECASE,
)


def _kategori_bul(metin: str) -> str | None:
    kucuk = metin.lower()
    for anahtar, kategori in KATEGORI_ANAHTARLARI.items():
        if anahtar in kucuk:
            return kategori
    return None


def _malzeme_bul(metin: str) -> str | None:
    kucuk = metin.lower().replace("ı", "i")
    kurallar = kurallari_yukle()
    adaylar = list(MALZEME_TURLERI) + [str(m).lower() for m in (kurallar.get("malzeme_kelimeleri") or [])]
    bulunan = [a for a in adaylar if a and a.replace("ı", "i") in kucuk]
    if not bulunan:
        return None
    bulunan.sort(key=len, reverse=True)
    return bulunan[0]


_BANT_GLIF = re.compile(r"^(?:[|│IİlLCcUu□■=∥‖]|\|\||II|ll)$")


def yazi_ayristir(metin: str, ocr_skoru: float = 1.0, kutu=None) -> dict[str, Any] | None:
    """Ölçü içermeyen usta yazısını kategori / malzeme / defter notu olarak etiketler."""
    ham = (metin or "").strip()
    if _BANT_GLIF.match(ham):
        return {
            "tur": "bant",
            "kategori": "",
            "malzeme": "",
            "metin": ham,
            "kutu": kutu,
            "guven": float(ocr_skoru),
        }
    if not ham or len(ham) < 2:
        return None
    if OLCU_IPUCU.search(ham) and not bant_kodu_dogrula(ham):
        return None

    kategori = _kategori_bul(ham)
    malzeme = _malzeme_bul(ham)
    defter = bool(DEFTER_IPUCU.search(ham)) or (kategori == "Defter")
    bant_mi = bool(
        bant_kodu_dogrula(ham)
        or "cumba" in ham.lower()
        or "bant" in ham.lower()
    )

    if bant_mi and not defter:
        return {
            "tur": "bant",
            "kategori": kategori or "",
            "malzeme": malzeme or "",
            "metin": ham,
            "guven": round(float(ocr_skoru), 3),
            "kutu": kutu,
        }

    if not kategori and not malzeme and not defter:
        if len(ham) < 4:
            return None
        return {
            "tur": "serbest",
            "kategori": "",
            "malzeme": "",
            "metin": ham,
            "guven": round(float(ocr_skoru) * 0.5, 3),
            "kutu": kutu,
        }

    tur = "defter" if defter else ("malzeme" if malzeme and not kategori else "kategori")
    return {
        "tur": tur,
        "kategori": kategori or "",
        "malzeme": malzeme or "",
        "metin": ham,
        "guven": round(float(ocr_skoru), 3),
        "kutu": kutu,
    }


def parcaya_kategori_yaz(parca: dict[str, Any], yazilar: list[dict[str, Any]]) -> None:
    if parca.get("kategori"):
        return
    ad = str(parca.get("parca_adi") or "")
    kategori = _kategori_bul(ad) or _kategori_bul(str(parca.get("not") or ""))
    if not kategori:
        for yazi in yazilar:
            if yazi.get("kategori"):
                kategori = yazi["kategori"]
                break
    if kategori:
        parca["kategori"] = kategori
    if not parca.get("malzeme"):
        malzeme = _malzeme_bul(ad) or _malzeme_bul(str(parca.get("not") or ""))
        if malzeme:
            parca["malzeme"] = malzeme


BASLIK_DESEN = re.compile(
    r"(?:(?P<mm>18|8|5|4|3)\s*mm\s*(?P<rol>kapak|klapa|gövde|govde|aralık|aralik|arkalık|arkalik))"
    r"|(?:(?P<rol2>kapak|klapa|gövde|govde|aralık|aralik|arkalık|arkalik)\s*(?P<mm2>18|8|5|4|3)\s*mm)",
    re.IGNORECASE,
)

_MALZEME_ETIKET = {
    "lake": "Lake boyama",
    "lake boya": "Lake boyama",
    "membran": "Membran kaplama",
    "memran": "Membran kaplama",
    "high gloss": "High Gloss",
    "highgloss": "High Gloss",
    "akrilik": "High Gloss",
}


def baslik_haritasi(metin: str) -> dict[str, float]:
    harita: dict[str, float] = {}
    for eslesme in BASLIK_DESEN.finditer(metin or ""):
        mm = eslesme.group("mm") or eslesme.group("mm2")
        rol = eslesme.group("rol") or eslesme.group("rol2")
        if mm and rol:
            harita[_kategori_bul(rol) or "Gövde"] = float(mm)
    return harita


def _havuz_metin(liste: list[dict[str, Any]], yazilar: list[dict[str, Any]]) -> str:
    parcalar = [str(y.get("metin") or "") for y in yazilar if isinstance(y, dict)]
    for parca in liste:
        if isinstance(parca, dict):
            parcalar.append(str(parca.get("parca_adi") or ""))
            parcalar.append(str(parca.get("not") or ""))
            parcalar.append(str(parca.get("kategori") or ""))
    return " ".join(parcalar)


def _malzeme_etiket(ham: str) -> str:
    if not ham:
        return "Standart gövde"
    kucuk = ham.lower()
    for anahtar, etiket in sorted(_MALZEME_ETIKET.items(), key=lambda x: len(x[0]), reverse=True):
        if anahtar in kucuk:
            return etiket
    return ham if ham else "Standart gövde"


def basliklari_uygula(sonuc: dict[str, Any], yazilar: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Açık başlıkları ayırır; yoksa 18 mm Gövde varsayar ve usta_onay üretir."""
    if not isinstance(sonuc, dict):
        return sonuc
    liste = sonuc.get("kesim_listesi")
    if not isinstance(liste, list):
        return sonuc
    yazilar = yazilar or []
    havuz = _havuz_metin(liste, yazilar)
    harita = baslik_haritasi(havuz)
    malzeme_ham = _malzeme_bul(havuz) or ""

    for parca in liste:
        if not isinstance(parca, dict):
            continue
        ad = str(parca.get("parca_adi") or "")
        kat = str(parca.get("kategori") or "") or (_kategori_bul(ad) or "")
        if kat in harita:
            parca["kategori"] = kat
            parca["kalinlik_mm"] = harita[kat]
            parca["onay_bekliyor"] = False
        elif harita and not kat:
            if len(harita) == 1:
                rol, mm = next(iter(harita.items()))
                parca["kategori"] = rol
                parca["kalinlik_mm"] = mm
                parca["onay_bekliyor"] = False
            else:
                parca["kategori"] = "Gövde"
                parca["kalinlik_mm"] = harita.get("Gövde", 18.0)
                parca["onay_bekliyor"] = True
        elif not kat:
            parca["kategori"] = "Gövde"
            if not parca.get("kalinlik_mm"):
                parca["kalinlik_mm"] = 18.0
            parca["onay_bekliyor"] = True
        else:
            parca["kategori"] = kat
            if kat in ("Aralık", "Arkalık") and not parca.get("kalinlik_mm"):
                parca["kalinlik_mm"] = 4.0
            elif not parca.get("kalinlik_mm"):
                parca["kalinlik_mm"] = 18.0
            parca["onay_bekliyor"] = False
        if malzeme_ham and not parca.get("malzeme"):
            parca["malzeme"] = malzeme_ham

    bekleyen = any(isinstance(p, dict) and p.get("onay_bekliyor") for p in liste)
    tek_rol = next(iter(harita.keys())) if len(harita) == 1 else "Gövde"
    tek_mm = next(iter(harita.values())) if len(harita) == 1 else 18.0
    sonuc["usta_onay"] = {
        "gerekli": bekleyen,
        "neden": (
            "Kâğıtta kalınlık veya cins başlığı net değil. Varsayılan 18 mm gövde; onaylayın."
            if not harita else
            "Bazı satırların cinsi veya kalınlığı belirsiz. Seçimi onaylayın."
        ),
        "kalinlik": tek_mm if harita else 18.0,
        "rol": tek_rol if harita else "Gövde",
        "malzeme": _malzeme_etiket(malzeme_ham),
    }
    return sonuc
