"""Tel çizim / karalama algılama, bölge çerçeveleme ve kesim listesinden ayıklama."""

from __future__ import annotations

import re
from typing import Any

import cv2
import numpy as np
from PIL import Image

from hata_kayit import BORU_HATTI, hata_yaz
from on_isleme import kutu_bbox

UYARI_TABAN = "Bu bir tel çizimdir / farklı bir şemadır. Sistem bunu kesim listesi olarak okumaz."
OLCU_IBARE = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*[xX×*]\s*(\d+(?:[.,]\d+)?)",
)


def tel_cizim_skoru(gorsel: Image.Image) -> float:
    """Kenar yoğunluğu; yüksek skor perspektif/karalama çizimine işaret eder (0-1)."""
    rgb = np.asarray(gorsel.convert("RGB"))
    if rgb.size == 0:
        return 0.0
    h, w = rgb.shape[:2]
    olcek = min(1.0, 640 / max(h, w))
    if olcek < 1:
        rgb = cv2.resize(rgb, (max(1, int(w * olcek)), max(1, int(h * olcek))), interpolation=cv2.INTER_AREA)
    gri = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    kenar = cv2.Canny(gri, 60, 160)
    yogunluk = float(np.mean(kenar > 0))
    return min(1.0, yogunluk / 0.18)


def tel_cizim_aday_mi(gorsel: Image.Image, olcu_satir_sayisi: int) -> bool:
    """Az ölçü satırı + yoğun çizgi → tel çizim / karalama adayı."""
    if olcu_satir_sayisi >= 3:
        return False
    skor = tel_cizim_skoru(gorsel)
    if olcu_satir_sayisi <= 1 and skor >= 0.35:
        return True
    if olcu_satir_sayisi == 0 and skor >= 0.22:
        return True
    return False


def tel_cizim_uyari_metni(olcu_notu: str = "") -> str:
    notu = str(olcu_notu or "").strip()
    if notu:
        return f"{UYARI_TABAN} Üzerinde {notu} ibaresi var; bu ölçü kesim satırı değildir."
    return UYARI_TABAN


def tel_olcu_ibaresi(yazilar: list[dict[str, Any]] | None, parcalar: list[dict[str, Any]] | None = None) -> str:
    """Şema yanında duran boy×en yazısını kesim satırı saymadan not eder."""
    parcalar_metin = []
    for yazi in yazilar or []:
        if isinstance(yazi, dict):
            parcalar_metin.append(str(yazi.get("metin") or ""))
    for parca in parcalar or []:
        if isinstance(parca, dict):
            parcalar_metin.append(str(parca.get("ham_metin") or parca.get("not") or ""))
    metin = " ".join(parcalar_metin)
    eslesme = OLCU_IBARE.search(metin)
    if not eslesme:
        return ""
    a = eslesme.group(1).replace(",", ".")
    b = eslesme.group(2).replace(",", ".")
    return f"{a} × {b}"


def _iou(a: list[float], b: list[float]) -> float:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    x1 = max(ax, bx)
    y1 = max(ay, by)
    x2 = min(ax + aw, bx + bw)
    y2 = min(ay + ah, by + bh)
    if x2 <= x1 or y2 <= y1:
        return 0.0
    kesisim = (x2 - x1) * (y2 - y1)
    birlesim = aw * ah + bw * bh - kesisim
    return kesisim / birlesim if birlesim else 0.0


def _merkez_icinde(kutu: list[float], bolge: list[float]) -> bool:
    x, y, w, h = kutu
    bx, by, bw, bh = bolge
    mx, my = x + w / 2, y + h / 2
    return bx <= mx <= bx + bw and by <= my <= by + bh


def tel_kutularini_birlestir(kutular: list[Any]) -> list[list[float]]:
    ham: list[list[float]] = []
    for kutu in kutular or []:
        bbox = kutu_bbox(kutu)
        if bbox and bbox[2] >= 8 and bbox[3] >= 8:
            ham.append(bbox)
    birlesik: list[list[float]] = []
    for kutu in ham:
        eklendi = False
        for i, mevcut in enumerate(birlesik):
            if _iou(kutu, mevcut) >= 0.18:
                x1 = min(kutu[0], mevcut[0])
                y1 = min(kutu[1], mevcut[1])
                x2 = max(kutu[0] + kutu[2], mevcut[0] + mevcut[2])
                y2 = max(kutu[1] + kutu[3], mevcut[1] + mevcut[3])
                birlesik[i] = [x1, y1, x2 - x1, y2 - y1]
                eklendi = True
                break
        if not eklendi:
            birlesik.append(kutu)
    return birlesik[:4]


def tel_bolgede_mi(kutu: Any, bolgeler: list[list[float]], esik: float = 0.32) -> bool:
    bbox = kutu_bbox(kutu)
    if not bbox or not bolgeler:
        return False
    return any(_iou(bbox, bolge) >= esik or _merkez_icinde(bbox, bolge) for bolge in bolgeler)


def semadan_parca_ayikla(
    parcalar: list[dict[str, Any]] | None,
    bolgeler: list[list[float]],
) -> list[dict[str, Any]]:
    """Şema kutusunun içine düşen uydurma ölçü satırlarını listeden çıkarır."""
    if not bolgeler:
        return list(parcalar or [])
    kalan = []
    for parca in parcalar or []:
        if not isinstance(parca, dict):
            continue
        if tel_bolgede_mi(parca.get("kutu"), bolgeler):
            continue
        kalan.append(parca)
    return kalan


def tel_cizim_bolgeleri(gorsel: Image.Image, olcu_kutulari: list[Any] | None = None) -> list[list[float]]:
    """Ölçü satırı merkezleriyle örtüşmeyen yoğun çizgi bölgelerini [x, y, w, h] döner."""
    try:
        rgb = np.asarray(gorsel.convert("RGB"))
        if rgb.size == 0:
            return []
        h, w = rgb.shape[:2]
        olcek = min(1.0, 640 / max(h, w))
        if olcek < 1:
            kucuk = cv2.resize(rgb, (max(1, int(w * olcek)), max(1, int(h * olcek))), interpolation=cv2.INTER_AREA)
        else:
            kucuk = rgb
            olcek = 1.0
        gri = cv2.cvtColor(kucuk, cv2.COLOR_RGB2GRAY)
        kenar = cv2.Canny(gri, 60, 160)
        cekirdek = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        kapali = cv2.dilate(kenar, cekirdek, iterations=2)
        konturlar, _ = cv2.findContours(kapali, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        kh, kw = kenar.shape[:2]
        min_alan = 0.07 * kw * kh
        max_alan = 0.82 * kw * kh
        olcu_olcekli = []
        for kutu in olcu_kutulari or []:
            bbox = kutu_bbox(kutu)
            if not bbox:
                continue
            olcu_olcekli.append([bbox[0] * olcek, bbox[1] * olcek, bbox[2] * olcek, bbox[3] * olcek])
        adaylar: list[list[float]] = []
        for kontur in konturlar:
            x, y, bw, bh = cv2.boundingRect(kontur)
            alan = bw * bh
            if alan < min_alan or alan > max_alan or bw < 36 or bh < 36:
                continue
            icindeki = sum(1 for o in olcu_olcekli if _merkez_icinde(o, [x, y, bw, bh]))
            if icindeki >= 2:
                continue
            roi = kenar[y:y + bh, x:x + bw]
            if roi.size == 0 or float(np.mean(roi > 0)) < 0.11:
                continue
            adaylar.append([x / olcek, y / olcek, bw / olcek, bh / olcek])
        birlesik = tel_kutularini_birlestir(adaylar)
        if not birlesik and tel_cizim_aday_mi(gorsel, len(olcu_olcekli)):
            gw, gh = gorsel.size
            birlesik = [[gw * 0.05, gh * 0.05, gw * 0.90, gh * 0.90]]
        return birlesik
    except Exception as hata:
        hata_yaz(BORU_HATTI, "Tel çizim bölgesi bulunamadı, tarama sürer", hata)
        return []
