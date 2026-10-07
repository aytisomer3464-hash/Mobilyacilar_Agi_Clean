"""Kenar bandı: PVC, rapor ve sözlük kodunun parçaya yazılması."""

from __future__ import annotations

import re
from typing import Any

import numpy as np

from bant_cizgi import sag_sutun_cizgi
from usta_mantik import BANT_KOD_BOS, bant_okuma, bant_sema, bant_sozlugu_kod, kod_boy_en

KENAR_ADLARI = ("uzun_1", "uzun_2", "kisa_1", "kisa_2")
KENAR_ETIKET = {
    "uzun_1": "1. uzun kenar",
    "uzun_2": "2. uzun kenar",
    "kisa_1": "1. kısa kenar",
    "kisa_2": "2. kısa kenar",
}

KOD_DESENI = re.compile(r"\b([01])\s*[-_/]\s*([01])\s*[-_/]\s*([01])\s*[-_/]\s*([01])\b")
PVC_DESENI = re.compile(
    r"(?:pvc|bant|cumba)?\s*(0\s*[.,]\s*[48]|0[.,]40?|[12](?:[.,]0)?)\s*mm",
    re.IGNORECASE,
)
PVC_KISA = re.compile(r"\b(0[.,]4|0[.,]8|1(?:[.,]0)?|2(?:[.,]0)?)\s*mm\s*(?:pvc|bant|cumba)\b", re.IGNORECASE)


def bant_kodu_dogrula(kod: str) -> str | None:
    eslesme = KOD_DESENI.search(str(kod or ""))
    if not eslesme:
        return None
    return "-".join(eslesme.groups())


def varsayilan_pvc(parca: dict[str, Any] | None = None) -> float:
    """Kapak/klapa 0.8 mm, gövde ve diğerleri 0.4 mm."""
    if not parca:
        return 0.4
    kat = f"{parca.get('kategori') or ''} {parca.get('parca_adi') or ''}".lower()
    if "kapak" in kat or "klapa" in kat:
        return 0.8
    return 0.4


def _pvc_mm(metin: str, varsayilan: float = 0.4) -> float:
    for desen in (PVC_KISA, PVC_DESENI):
        m = desen.search(metin)
        if m:
            ham = re.sub(r"\s+", "", m.group(1)).replace(",", ".")
            try:
                deger = float(ham)
            except ValueError:
                continue
            if deger in (0.4, 0.8, 1.0, 2.0) or deger in (0.4, 0.8, 1, 2):
                return float(deger)
            if abs(deger - 0.4) < 0.05:
                return 0.4
            if abs(deger - 0.8) < 0.05:
                return 0.8
            if deger in (1, 2):
                return float(deger)
    kucuk = metin.lower()
    if "2mm" in kucuk.replace(" ", "") or "2 mm" in kucuk:
        return 2.0
    if "1mm" in kucuk.replace(" ", "") or "1 mm" in kucuk:
        return 1.0
    if "0.8" in kucuk or "0,8" in kucuk:
        return 0.8
    if "0.4" in kucuk or "0,4" in kucuk:
        return 0.4
    return float(varsayilan)


def kenarlari_listesi(kod: str, pvc_mm: float) -> list[dict[str, Any]]:
    bitler = kod.split("-")
    liste = []
    for ad, bit in zip(KENAR_ADLARI, bitler):
        var = bit == "1"
        liste.append({
            "kenar": ad,
            "etiket": KENAR_ETIKET[ad],
            "var": var,
            "kalinlik_mm": pvc_mm if var else 0.0,
        })
    return liste


def bant_raporu(kod: str, pvc_mm: float) -> str:
    boy, en = kod_boy_en(kod)
    sema = bant_sema(kod)
    if boy == 0 and en == 0:
        return f"{sema}."
    kenarlar = kenarlari_listesi(kod, pvc_mm)
    olanlar = [k["etiket"] for k in kenarlar if k["var"]]
    return f"{sema}. PVC {pvc_mm:g} mm → {', '.join(olanlar)} ({kod})."


def _pvc_mevcuttan(mevcut: Any, metin: str, varsayilan: float) -> float:
    if isinstance(mevcut, dict) and mevcut.get("pvc_mm") is not None:
        try:
            return float(mevcut["pvc_mm"])
        except (TypeError, ValueError):
            pass
        return _pvc_mm(str(mevcut.get("rapor") or metin), varsayilan)
    return _pvc_mm(metin, varsayilan)


def bant_ayristir(metin: str, mevcut: Any = None, varsayilan: float = 0.4) -> dict[str, Any]:
    """Sözlük kodu + PVC. İşaret yoksa 0-0-0-0; mevcut kod yalnızca LED/düzeltmede kalır."""
    if isinstance(mevcut, str) and bant_kodu_dogrula(mevcut):
        metin = f"{mevcut} {metin}"
    ham = str(metin or "")
    okuma = bant_okuma(ham)
    sozluk = str(okuma.get("kod") or BANT_KOD_BOS)
    emin = bool(okuma.get("emin", True))
    kod_mevcut = None
    if isinstance(mevcut, dict):
        kod_mevcut = bant_kodu_dogrula(str(mevcut.get("kod") or ""))
    if sozluk != BANT_KOD_BOS:
        kod = sozluk
    elif kod_mevcut:
        kod = kod_mevcut
    else:
        kod = BANT_KOD_BOS
    pvc = _pvc_mevcuttan(mevcut, ham, varsayilan)
    boy, en = kod_boy_en(kod)
    return {
        "kod": kod,
        "boy_bant": boy,
        "en_bant": en,
        "sema": bant_sema(kod),
        "emin": emin,
        "neden": str(okuma.get("neden") or ""),
        "pvc_mm": pvc,
        "kenarlar": kenarlari_listesi(kod, pvc),
        "rapor": bant_raporu(kod, pvc),
    }


def _kutu_merkez(kutu) -> tuple[float, float] | None:
    if kutu is None:
        return None
    try:
        dizi = np.asarray(kutu, dtype=float).reshape(-1, 2)
        return float(dizi[:, 0].mean()), float(dizi[:, 1].mean())
    except Exception:
        return None


_NOKTA_KUTU = re.compile(r"^[.·•∙˙∘º]{1,2}$")
_OLCU_KIRPIM = re.compile(
    r"(?P<boy>\d+(?:[.,]\d+)?)\s*[xX×*]\s*(?P<en>\d+(?:[.,]\d+)?)"
)


def _kutu_xywh(kutu) -> tuple[float, float, float, float] | None:
    if _kutu_merkez(kutu) is None:
        return None
    try:
        dizi = np.asarray(kutu, dtype=float).reshape(-1, 2)
        x1 = float(dizi[:, 0].min())
        y1 = float(dizi[:, 1].min())
        x2 = float(dizi[:, 0].max())
        y2 = float(dizi[:, 1].max())
        if x2 <= x1 or y2 <= y1:
            return None
        return x1, y1, x2 - x1, y2 - y1
    except Exception:
        return None


def _ayni_satir(a: tuple[float, float, float, float], b: tuple[float, float, float, float]) -> bool:
    ay, ah, by, bh = a[1], a[3], b[1], b[3]
    return abs((ay + ah / 2) - (by + bh / 2)) <= max(ah, bh, 12.0) * 0.9


def _boy_en_aralik(ham: str, x: float, w: float) -> tuple[tuple[float, float], tuple[float, float]]:
    eslesme = _OLCU_KIRPIM.search(ham or "")
    if not eslesme or w <= 0:
        return (x, x + w * 0.48), (x + w * 0.52, x + w)
    n = max(len(ham), 1)
    boy_c = x + ((eslesme.start("boy") + eslesme.end("boy")) / 2 / n) * w
    en_c = x + ((eslesme.start("en") + eslesme.end("en")) / 2 / n) * w
    boy_w = max((eslesme.end("boy") - eslesme.start("boy")) / n * w, w * 0.12)
    en_w = max((eslesme.end("en") - eslesme.start("en")) / n * w, w * 0.12)
    return (boy_c - boy_w, boy_c + boy_w), (en_c - en_w, en_c + en_w)


def _x_ortusur(aralik: tuple[float, float], x: float, w: float) -> bool:
    return not (x + w < aralik[0] or x > aralik[1])


def _olcu_ustu_noktalar(parca: dict[str, Any], kutular: list[dict[str, Any]] | None) -> tuple[int, int]:
    """Boy/en kutularının hemen üstündeki · • . adedi (en fazla 2)."""
    if not kutular:
        return 0, 0
    kendi = _kutu_xywh(parca.get("kutu"))
    if kendi is None:
        return 0, 0
    px, py, pw, ph = kendi
    ham = str(parca.get("ham_metin") or parca.get("not") or "")
    boy_ar, en_ar = _boy_en_aralik(ham, px, pw)
    boy_n = 0
    en_n = 0
    for yazi in kutular:
        if not isinstance(yazi, dict):
            continue
        metin = str(yazi.get("metin") or "").strip()
        if not _NOKTA_KUTU.match(metin):
            continue
        kutu = _kutu_xywh(yazi.get("kutu"))
        if kutu is None:
            continue
        x, y, w, h = kutu
        cy = y + h / 2
        if cy > py + ph * 0.45:
            continue
        adet = min(2, len(metin))
        if _x_ortusur(boy_ar, x, w):
            boy_n = max(boy_n, adet)
        if _x_ortusur(en_ar, x, w):
            en_n = max(en_n, adet)
    return min(2, boy_n), min(2, en_n)


def _satir_sag_sembol(parca: dict[str, Any], kutular: list[dict[str, Any]] | None) -> str:
    """Aynı satırda ölçü kutusunun sağındaki OCR parçaları (I, L, C, ||, =, □)."""
    if not kutular:
        return ""
    kendi = _kutu_xywh(parca.get("kutu"))
    if kendi is None:
        return ""
    px, py, pw, ph = kendi
    sag_esik = px + pw * 0.78
    aday: list[tuple[float, str]] = []
    for yazi in kutular:
        if not isinstance(yazi, dict):
            continue
        metin = str(yazi.get("metin") or "").strip()
        if not metin or len(metin) > 12:
            continue
        kutu = _kutu_xywh(yazi.get("kutu"))
        if kutu is None or not _ayni_satir(kendi, kutu):
            continue
        x, _y, w, _h = kutu
        if x + w / 2 < sag_esik:
            continue
        if abs(x - px) < 4 and abs(w - pw) < 4:
            continue
        aday.append((x, metin))
    aday.sort(key=lambda o: o[0])
    return " ".join(m for _x, m in aday[:6])


def bant_isaret_uret(parca: dict[str, Any], kutular: list[dict[str, Any]] | None = None) -> str:
    """Konumsal nokta + sağ sütun sembolünü sözlüğün okuyacağı metne çevirir."""
    parcalar: list[str] = []
    sag = _satir_sag_sembol(parca, kutular)
    if sag:
        parcalar.append(f"201 x 43 {sag}")
    boy_n, en_n = _olcu_ustu_noktalar(parca, kutular)
    if boy_n or en_n:
        parcalar.append(("·" * boy_n) + "201 x " + ("·" * en_n) + "43")
    return " ".join(parcalar)


def _yakin_bant_yazilari(parca: dict[str, Any], yazilar: list[dict[str, Any]] | None) -> str:
    """Yalnızca bant türü veya aynı satırdaki kısa yazılar; tüm sayfa değil."""
    if not yazilar:
        return ""
    merkez = _kutu_merkez(parca.get("kutu"))
    parcalar: list[str] = []
    for yazi in yazilar:
        if not isinstance(yazi, dict):
            continue
        metin = str(yazi.get("metin") or "").strip()
        if not metin or len(metin) > 40:
            continue
        if yazi.get("tur") == "bant" or bant_kodu_dogrula(metin):
            if merkez is None:
                parcalar.append(metin)
                continue
            ym = _kutu_merkez(yazi.get("kutu"))
            if ym is not None and abs(ym[1] - merkez[1]) < 48:
                parcalar.append(metin)
    return " ".join(parcalar[:4])


def parcaya_bant_yaz(
    parca: dict[str, Any],
    yazilar: list[dict[str, Any]] | None = None,
    kutular: list[dict[str, Any]] | None = None,
    yeniden: bool = False,
    gorsel=None,
) -> None:
    """Tek bant kapısı. Hafıza vuruşu veya mühür varsa ikinci yazım yok."""
    if not yeniden and (parca.get("hafiza_vurus") or parca.get("_bant_muhur")):
        return
    ham_ocr = str(parca.get("ham_metin") or "").strip()
    if kutular:
        uretilen = bant_isaret_uret(parca, kutular)
        if uretilen:
            parca["bant_isaret"] = uretilen
    parcalar_metin = " ".join([
        str(parca.get("bant_isaret") or ""),
        str(parca.get("not") or "")[:80],
        ham_ocr[:80],
        _yakin_bant_yazilari(parca, yazilar),
    ])
    mevcut = None if ham_ocr else parca.get("bant")
    parca["bant"] = bant_ayristir(parcalar_metin, mevcut, varsayilan=varsayilan_pvc(parca))
    bant = parca.get("bant") if isinstance(parca.get("bant"), dict) else {}
    kod = str(bant.get("kod") or BANT_KOD_BOS)
    if gorsel is not None and kod == BANT_KOD_BOS:
        cizgi = sag_sutun_cizgi(gorsel, parca.get("kutu"))
        cizgi_kod = str(cizgi.get("kod") or BANT_KOD_BOS)
        if cizgi_kod != BANT_KOD_BOS or cizgi.get("emin") is False:
            parca["bant"] = bant_ayristir(
                cizgi_kod, mevcut, varsayilan=varsayilan_pvc(parca)
            )
            if cizgi.get("emin") is False:
                parca["bant"]["emin"] = False
                parca["bant"]["neden"] = cizgi.get("neden") or parca["bant"].get("neden")
            bant = parca["bant"]
    if bant.get("emin") is False:
        parca["supheli"] = True
        parca["suphe_seviye"] = parca.get("suphe_seviye") or "sari"
        parca["suphe_neden"] = bant.get("neden") or "Bant sembolü belirsiz; tahmin yok."
    parca["_bant_muhur"] = True


def gemini_listesine_bant_yaz(veri: dict[str, Any] | None) -> dict[str, Any] | None:
    """Gemini JSON bant alanını kroki sözlüğüne çeker; işaret yoksa 0-0-0-0."""
    if not isinstance(veri, dict):
        return veri
    liste = veri.get("kesim_listesi")
    if not isinstance(liste, list):
        return veri
    for parca in liste:
        if isinstance(parca, dict):
            parca["bant"] = None
            parcaya_bant_yaz(parca, yeniden=True)
    return veri


def bant_bitleri(kod: str) -> list[bool]:
    parcalar = str(kod or "0-0-0-0").replace("/", "-").replace("_", "-").split("-")
    return [(parcalar[i] if i < len(parcalar) else "0") == "1" for i in range(4)]


def bant_kodu_bitlerden(bitler: list[bool] | tuple[bool, ...]) -> str:
    doldur = list(bitler) + [False, False, False, False]
    return "-".join("1" if doldur[i] else "0" for i in range(4))
