"""Yerel OCR (RapidOCR) ve kesim satırı ayrıştırması."""

from __future__ import annotations

import re
from typing import Any

import cv2
import numpy as np
from PIL import Image

from kenar_bant import parcaya_bant_yaz
from hata_kayit import OKUMA, hata_yaz
from metin_yazilar import parcaya_kategori_yaz, yazi_ayristir
from ogrenme_hafiza import hafizadan_doldur, hafizadan_satir, okunan_kopya
from ogrenme_kurallari import kurallari_yukle
from usta_mantik import OLCU_TOKEN, cm_mm_guvenli

YUKSEK_GUVEN = 0.72
MIN_YUKSEK_PARCA = 3
ORTALAMA_GUVEN_ESIK = 0.78

ADET_DESENI = re.compile(r"(?:adet|ad\.?)\s*[:\-]?\s*(\d+)", re.IGNORECASE)
ADET_SON_SAYI = re.compile(r"\b(\d{1,3})\s*(?:adet|ad\.?|pcs)?\s*$", re.IGNORECASE)
MODUL_DESENI = re.compile(r"\b(M\d+)\b", re.IGNORECASE)
MALZEME_DESENI = re.compile(
    r"(mdflam|mdf|sunta|beyaz|ceviz|lam|18\s*mm|8\s*mm|3\s*mm|4\s*mm)",
    re.IGNORECASE,
)
PARCA_DESENI = re.compile(
    r"(dikme|tabla|raf|kapak|klapa|dolap|defter|arkalık|arkalik|gövde|govde|"
    r"yan|bağlantı|baglanti|çıta|cita|kasa|çekmece|cekmece)",
    re.IGNORECASE,
)


_ocr_ornek = None
_ocr_denendi = False


def _ocr_motoru():
    """Başarılı motoru saklar; yükleme başarısızsa sonraki çağrıda yeniden dener."""
    global _ocr_ornek, _ocr_denendi
    if _ocr_ornek is not None:
        return _ocr_ornek
    try:
        from rapidocr_onnxruntime import RapidOCR
        _ocr_ornek = RapidOCR()
        return _ocr_ornek
    except Exception:
        try:
            from rapidocr import RapidOCR
            _ocr_ornek = RapidOCR()
            return _ocr_ornek
        except Exception as hata:
            if not _ocr_denendi:
                hata_yaz("OCR_YEREL", "RapidOCR yüklenemedi, yerel okuma atlanacak", hata)
                print(f"Uyarı: RapidOCR yüklenemedi, yerel okuma atlanacak: {hata}")
                _ocr_denendi = True
            return None


def ocr_icin_gorsel(gorsel: Image.Image) -> Image.Image:
    """Tek RapidOCR geçişi için kontrast + uyarlamalı eşik; ikinci OCR yok."""
    try:
        rgb = np.asarray(gorsel.convert("RGB"))
        if rgb.size == 0:
            return gorsel
        gri = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8))
        guc = clahe.apply(gri)
        blok = max(15, (min(guc.shape) // 24) | 1)
        if blok % 2 == 0:
            blok += 1
        esik = cv2.adaptiveThreshold(
            guc, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, blok, 7,
        )
        karisim = cv2.addWeighted(guc, 0.55, esik, 0.45, 0)
        uc = cv2.cvtColor(karisim, cv2.COLOR_GRAY2RGB)
        return Image.fromarray(uc)
    except Exception as hata:
        hata_yaz("OCR_YEREL", "OCR ön-kontrast başarısız, ham görsel kullanılacak", hata)
        return gorsel


def _desenler():
    kurallar = kurallari_yukle()
    malzemeler = [str(m) for m in kurallar.get("malzeme_kelimeleri") or []]
    parcalar = [str(p) for p in kurallar.get("parca_kelimeleri") or []]
    malzeme = "|".join(re.escape(m) for m in malzemeler if m)
    parca = "|".join(re.escape(p) for p in parcalar if p)
    malzeme_desen = re.compile(rf"({malzeme})", re.IGNORECASE) if malzeme else MALZEME_DESENI
    parca_desen = re.compile(rf"({parca})", re.IGNORECASE) if parca else PARCA_DESENI
    return malzeme_desen, parca_desen


def cm_mm_cevir(deger: float, ham: str | None = None) -> float:
    """Atölye kâğıdındaki cm ölçülerini mm'ye çevirir; 69.4 → 694 basamak kaydırması."""
    return cm_mm_guvenli(deger, ham)


def _sayi_oku(metin: str) -> float | None:
    try:
        return float(metin.replace(",", "."))
    except ValueError:
        return None


def satir_ayristir(metin: str, ocr_skoru: float = 1.0, kutu=None) -> dict[str, Any] | None:
    ham = (metin or "").strip()
    if not ham:
        return None

    olcu = OLCU_TOKEN.search(ham)
    if not olcu:
        return None

    boy = _sayi_oku(olcu.group("boy"))
    en = _sayi_oku(olcu.group("en"))
    if boy is None or en is None:
        return None

    kalinlik_ham = olcu.group("kalinlik")
    kalinlik = _sayi_oku(kalinlik_ham) if kalinlik_ham else 18.0
    if kalinlik is not None and kalinlik <= 40:
        pass
    elif kalinlik is not None:
        kalinlik = cm_mm_cevir(kalinlik, kalinlik_ham)

    uzunluk_mm = cm_mm_cevir(boy, olcu.group("boy"))
    genislik_mm = cm_mm_cevir(en, olcu.group("en"))

    adet = 1
    adet_eslesme = ADET_DESENI.search(ham)
    if adet_eslesme:
        adet = int(adet_eslesme.group(1))
    else:
        son = ADET_SON_SAYI.search(ham[olcu.end():] if olcu.end() < len(ham) else ham)
        if son and int(son.group(1)) <= 100:
            adet = int(son.group(1))

    modul = "GENEL"
    modul_eslesme = MODUL_DESENI.search(ham)
    if modul_eslesme:
        modul = modul_eslesme.group(1).upper()

    malzeme_desen, parca_desen = _desenler()
    malzeme_eslesme = malzeme_desen.search(ham)
    malzeme = malzeme_eslesme.group(1) if malzeme_eslesme else ""

    parca_eslesme = parca_desen.search(ham)
    parca_adi = parca_eslesme.group(1).title() if parca_eslesme else ham[:80]

    dolu = 3  # boy, en, adet her zaman doldurulur ölçü varsa
    if malzeme:
        dolu += 0.5
    if parca_eslesme:
        dolu += 0.5
    guven = float(ocr_skoru) * min(1.0, dolu / 3.5)

    kayit = {
        "modul_kodu": modul,
        "parca_adi": parca_adi,
        "uzunluk_mm": uzunluk_mm,
        "genislik_mm": genislik_mm,
        "kalinlik_mm": 18.0 if kalinlik is None else float(kalinlik),
        "adet": adet,
        "malzeme": malzeme,
        "not": ham,
        "supheli": guven < YUKSEK_GUVEN,
        "suphe_seviye": "kirmizi" if guven < 0.45 else ("sari" if guven < YUKSEK_GUVEN else ""),
        "guven": round(guven, 3),
        "kutu": kutu,
        "ham_metin": ham,
    }
    kayit["okunan"] = okunan_kopya(kayit)
    hafizadan_doldur(kayit)
    parcaya_kategori_yaz(kayit, [])
    return kayit


def satir_giris(
    metin: str, ocr_skoru: float = 1.0, kutu=None
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """Tek satır kapısı: ölçü, yoksa hafıza, yoksa usta yazısı. İkisi birden yok."""
    parca = satir_ayristir(metin, ocr_skoru, kutu)
    if not parca:
        parca = hafizadan_satir(metin, ocr_skoru, kutu)
    if parca:
        return parca, None
    return None, yazi_ayristir(metin, ocr_skoru, kutu)


def _ocr_liste(deger) -> list:
    """RapidOCR 3 numpy dizilerini güvenli listeye çevirir; `or []` kullanmaz."""
    if deger is None:
        return []
    if isinstance(deger, (list, tuple)):
        return list(deger)
    try:
        uzunluk = len(deger)
    except TypeError:
        return [deger]
    if uzunluk == 0:
        return []
    return list(deger)


def _rapidocr_satirlari(sonuc) -> list[tuple[Any, str, float]]:
    satirlar: list[tuple[Any, str, float]] = []
    if sonuc is None:
        return satirlar

    if hasattr(sonuc, "boxes") and hasattr(sonuc, "txts"):
        kutular = _ocr_liste(sonuc.boxes)
        metinler = _ocr_liste(sonuc.txts)
        skorlar = _ocr_liste(getattr(sonuc, "scores", None))
        if not skorlar:
            skorlar = [1.0] * len(metinler)
        for kutu, metin, skor in zip(kutular, metinler, skorlar):
            try:
                skor_sayi = float(skor)
            except (TypeError, ValueError):
                skor_sayi = 1.0
            satirlar.append((kutu, str(metin), skor_sayi))
        return satirlar

    if isinstance(sonuc, tuple):
        sonuc = sonuc[0] if sonuc else None
    ogeler = _ocr_liste(sonuc)
    for oge in ogeler:
        parca = _ocr_liste(oge)
        if not parca:
            continue
        if len(parca) >= 3:
            try:
                skor_sayi = float(parca[2])
            except (TypeError, ValueError):
                skor_sayi = 1.0
            satirlar.append((parca[0], str(parca[1]), skor_sayi))
        elif len(parca) == 2:
            satirlar.append((parca[0], str(parca[1]), 1.0))
    return satirlar


def ocr_okuma(gorsel: Image.Image) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Tek OCR geçişi: ölçü satırları + kapak/dolap/defter/malzeme yazıları."""
    motor = _ocr_motoru()
    if motor is None:
        return [], []
    try:
        np_gorsel = np.asarray(ocr_icin_gorsel(gorsel).convert("RGB"))
        # Tek tam OCR. Ölçü yoksa ikinci RapidOCR çağrısı yok (atölye gecikmesi).
        ham = motor(np_gorsel)
        satirlar = _rapidocr_satirlari(ham)
        if not satirlar:
            hata_yaz("OCR_YEREL", "Yerel OCR satır döndürmedi (boş aday)")
    except Exception as hata:
        hata_yaz("OCR_YEREL", "Yerel OCR çalışmadı", hata)
        print(f"Uyarı: Yerel OCR çalışmadı: {hata}")
        return [], []

    parcalar: list[dict[str, Any]] = []
    yazilar: list[dict[str, Any]] = []
    ham_kutular = [{"metin": metin, "kutu": kutu} for kutu, metin, _skor in satirlar]
    for kutu, metin, skor in satirlar:
        parca, yazi = satir_giris(metin, skor, kutu)
        if parca:
            parcalar.append(parca)
        elif yazi:
            yazilar.append(yazi)
    for parca in parcalar:
        parcaya_kategori_yaz(parca, yazilar)
        if parca.get("hafiza_vurus"):
            continue
        parcaya_bant_yaz(parca, yazilar, ham_kutular, gorsel=gorsel)
    if satirlar and not parcalar:
        hata_yaz(
            OKUMA,
            f"OCR {len(satirlar)} satır okudu ama ölçü deseni yok; yazı={len(yazilar)}",
        )
    return parcalar, yazilar


def ocr_satirlari(gorsel: Image.Image) -> list[dict[str, Any]]:
    """Eski ad: ocr_okuma ile aynı tek geçiş; yeniden OCR yok."""
    parcalar, _ = ocr_okuma(gorsel)
    return parcalar


def yerel_yeterli_mi(parcalar: list[dict[str, Any]]) -> bool:
    if not parcalar:
        return False
    yuksek = [p for p in parcalar if p.get("guven", 0) >= YUKSEK_GUVEN and not p.get("supheli")]
    if len(yuksek) >= MIN_YUKSEK_PARCA:
        ortalama = sum(p.get("guven", 0) for p in parcalar) / len(parcalar)
        return ortalama >= ORTALAMA_GUVEN_ESIK
    return False


def dusuk_guvenli_parcalar(parcalar: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [p for p in parcalar if p.get("guven", 0) < YUKSEK_GUVEN or p.get("supheli")]
