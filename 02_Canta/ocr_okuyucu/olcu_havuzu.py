"""Onaylı kesim listesi havuzu: dosya/piksel imzasıyla Gemini'siz anında yanıt."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image

from arsiv import (
    _dosya_kilidi,
    _json_yaz,
    bayt_hash,
    icerik_zaten_var,
    kayit_klasoru,
    piksel_imza,
)
from hata_kayit import ARSIV, hata_yaz
from ogrenme_kurallari import ogrenme_dizini

HAVUZ_TAVAN = 80
HAVUZ_AD_DESENI = re.compile(r"^[a-f0-9]{24}\.json$")


def havuz_dizini():
    yol = ogrenme_dizini() / "olcu_havuzu"
    yol.mkdir(parents=True, exist_ok=True)
    return yol


def _indeks_yolu():
    return havuz_dizini() / "indeks.json"


def _kilit_yolu():
    return havuz_dizini() / "havuz.lock"


def _indeks_oku() -> dict[str, Any]:
    yol = _indeks_yolu()
    if not yol.exists():
        return {"anahtarlar": {}, "siralar": []}
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"anahtarlar": {}, "siralar": []}
    if not isinstance(veri, dict):
        return {"anahtarlar": {}, "siralar": []}
    veri.setdefault("anahtarlar", {})
    veri.setdefault("siralar", [])
    return veri


def _gorsel_imza(gorsel: Image.Image | None) -> str | None:
    if gorsel is None:
        return None
    try:
        rgb = gorsel.convert("RGB")
        return hashlib.sha256(rgb.tobytes()).hexdigest()
    except Exception:
        return None


def havuz_anahtarlari(veri: bytes, gorsel: Image.Image | None = None) -> list[str]:
    anahtarlar = [f"sha:{bayt_hash(veri)}"]
    pix = piksel_imza(veri=veri)
    if pix:
        anahtarlar.append(f"pix:{pix}")
    img = _gorsel_imza(gorsel)
    if img:
        anahtarlar.append(f"img:{img}")
    return anahtarlar


def _liste_yukle(kayit_id: str) -> dict[str, Any] | None:
    klasor = kayit_klasoru(kayit_id)
    for ad in ("duzeltilmis.json", "ham.json"):
        yol = klasor / ad
        if not yol.exists():
            continue
        try:
            veri = json.loads(yol.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(veri, dict) and isinstance(veri.get("kesim_listesi"), list) and veri["kesim_listesi"]:
            return veri
    return None


def _havuz_dosyasi(dosya_adi: str) -> dict[str, Any] | None:
    yol = havuz_dizini() / dosya_adi
    if not yol.exists():
        return None
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if isinstance(veri, dict) and isinstance(veri.get("kesim_listesi"), list) and veri["kesim_listesi"]:
        return veri
    return None


def havuzdan_oku(veri: bytes, gorsel: Image.Image | None = None) -> dict[str, Any] | None:
    """Aynı kâğıt imzası varsa arşiv/havuz listesini döner; aksi halde None."""
    try:
        sha = bayt_hash(veri)
        pix = piksel_imza(veri=veri)
        kayit_id = icerik_zaten_var(sha, pix)
        if kayit_id:
            yuklu = _liste_yukle(kayit_id)
            if yuklu:
                kopya = json.loads(json.dumps(yuklu))
                kopya["okuma_kaynak"] = "havuz"
                kopya["kayit_id"] = kayit_id
                notlar = kopya.setdefault("genel_notlar", [])
                if isinstance(notlar, list) and "Havuz: aynı kâğıt, Gemini atlandı." not in notlar:
                    notlar.append("Havuz: aynı kâğıt, Gemini atlandı.")
                return kopya
        indeks = _indeks_oku()
        for anahtar in havuz_anahtarlari(veri, gorsel):
            ad = (indeks.get("anahtarlar") or {}).get(anahtar)
            if not ad:
                continue
            yuklu = _havuz_dosyasi(str(ad))
            if yuklu:
                kopya = json.loads(json.dumps(yuklu))
                kopya["okuma_kaynak"] = "havuz"
                if yuklu.get("kayit_id"):
                    kopya["kayit_id"] = yuklu["kayit_id"]
                notlar = kopya.setdefault("genel_notlar", [])
                if isinstance(notlar, list) and "Havuz: aynı kâğıt, Gemini atlandı." not in notlar:
                    notlar.append("Havuz: aynı kâğıt, Gemini atlandı.")
                return kopya
    except Exception as hata:
        hata_yaz(ARSIV, "Ölçü havuzu okunamadı, tarama sürer", hata)
    return None


def _tasima(indeks: dict[str, Any]) -> None:
    siralar = [str(x) for x in indeks.get("siralar") or []]
    while len(siralar) > HAVUZ_TAVAN:
        eski = siralar.pop(0)
        try:
            (havuz_dizini() / eski).unlink(missing_ok=True)
        except OSError as hata:
            hata_yaz(ARSIV, f"Havuz tavanı: eski kayıt silinemedi {eski}", hata)
        indeks["anahtarlar"] = {k: v for k, v in (indeks.get("anahtarlar") or {}).items() if v != eski}
    indeks["siralar"] = siralar


def havuza_yaz(
    veri: bytes,
    sonuc: dict[str, Any],
    kayit_id: str | None = None,
    gorsel: Image.Image | None = None,
) -> None:
    """Onaylı/üretilmiş listeyi imza ile saklar; tavan dolunca en eskiyi düşürür."""
    liste = sonuc.get("kesim_listesi") if isinstance(sonuc, dict) else None
    if not isinstance(liste, list) or not liste:
        return
    try:
        ad = f"{bayt_hash(veri)[:24]}.json"
        sakla = {
            "kesim_listesi": liste,
            "genel_notlar": sonuc.get("genel_notlar") or [],
            "kayit_id": kayit_id or sonuc.get("kayit_id"),
            "havuz_zaman": datetime.now(timezone.utc).isoformat(),
        }
        with _dosya_kilidi(_kilit_yolu()):
            _json_yaz(havuz_dizini() / ad, sakla)
            indeks = _indeks_oku()
            for anahtar in havuz_anahtarlari(veri, gorsel):
                indeks["anahtarlar"][anahtar] = ad
            siralar = [str(x) for x in indeks.get("siralar") or [] if x != ad]
            siralar.append(ad)
            indeks["siralar"] = siralar
            _tasima(indeks)
            _json_yaz(_indeks_yolu(), indeks)
    except Exception as hata:
        hata_yaz(ARSIV, "Ölçü havuzuna yazılamadı", hata)


def havuza_yaz_kayit(kayit_id: str, sonuc: dict[str, Any]) -> None:
    """Arşivdeki kroki baytlarıyla havuzu onaylı listeye günceller."""
    if not kayit_id:
        return
    try:
        klasor = kayit_klasoru(kayit_id)
        for yol in klasor.glob("kroki*"):
            if yol.is_file():
                havuza_yaz(yol.read_bytes(), sonuc, kayit_id)
                return
    except Exception as hata:
        hata_yaz(ARSIV, f"Havuz kayıt güncellemesi başarısız: {kayit_id}", hata)


def havuz_ozeti() -> dict[str, Any]:
    """Arka plan doluluk: kayıt sayısı, tavan, yüzde."""
    try:
        indeks = _indeks_oku()
        kayit = len({str(v) for v in (indeks.get("anahtarlar") or {}).values()})
        if not kayit:
            kayit = len(indeks.get("siralar") or [])
        tavan = HAVUZ_TAVAN
        oran = int(round(100 * kayit / tavan)) if tavan else 0
        uyari = ""
        if oran >= 90:
            uyari = "Havuz dolmak üzere; en eski listeler düşecek."
        elif oran >= 70:
            uyari = "Havuz doluluk yüksek."
        return {
            "kayit": kayit,
            "tavan": tavan,
            "doluluk_oran": min(100, oran),
            "uyari": uyari,
        }
    except Exception as hata:
        hata_yaz(ARSIV, "Havuz özeti alınamadı", hata)
        return {"kayit": 0, "tavan": HAVUZ_TAVAN, "doluluk_oran": 0, "uyari": ""}


def _guvenli_havuz_adi(ad: str) -> str | None:
    ad = Path(str(ad or "")).name.lower()
    if not HAVUZ_AD_DESENI.fullmatch(ad):
        return None
    return ad


def _kayit_ozeti(ad: str, veri: dict[str, Any]) -> dict[str, Any]:
    liste = veri.get("kesim_listesi") if isinstance(veri.get("kesim_listesi"), list) else []
    adlar: list[str] = []
    for parca in liste:
        if not isinstance(parca, dict):
            continue
        adlar.append(str(parca.get("parca_adi") or parca.get("modul_kodu") or "Parça").strip())
    ozet = ", ".join([a for a in adlar[:3] if a])
    if len(adlar) > 3:
        ozet += f" +{len(adlar) - 3}"
    return {
        "id": ad,
        "kayit_id": str(veri.get("kayit_id") or ""),
        "zaman": str(veri.get("havuz_zaman") or ""),
        "satir": len(liste),
        "ozet": ozet,
    }


def _kayit_metni(ad: str, veri: dict[str, Any]) -> str:
    parcalar = []
    for parca in veri.get("kesim_listesi") or []:
        if isinstance(parca, dict):
            parcalar.append(
                f"{parca.get('parca_adi') or ''} {parca.get('modul_kodu') or ''} "
                f"{parca.get('uzunluk_mm') or ''} {parca.get('genislik_mm') or ''}"
            )
    notlar = veri.get("genel_notlar") or []
    not_metin = " ".join(str(n) for n in notlar if n)
    return f"{ad} {veri.get('kayit_id') or ''} {not_metin} {' '.join(parcalar)}".lower()


def havuz_listesi(arama: str = "") -> dict[str, Any]:
    """En yeni kayıtlar önce; arama parça adı / kod / kayıt id üzerinde süzgeçler."""
    ozet = havuz_ozeti()
    satirlar: list[dict[str, Any]] = []
    try:
        indeks = _indeks_oku()
        sorgu = str(arama or "").strip().lower()
        gorulen: set[str] = set()
        for ad in reversed([str(x) for x in indeks.get("siralar") or []]):
            if ad in gorulen:
                continue
            gorulen.add(ad)
            veri = _havuz_dosyasi(ad)
            if not veri:
                continue
            if sorgu and sorgu not in _kayit_metni(ad, veri):
                continue
            satirlar.append(_kayit_ozeti(ad, veri))
    except Exception as hata:
        hata_yaz(ARSIV, "Havuz geçmişi listelenemedi", hata)
    ozet["liste"] = satirlar
    return ozet


def havuz_sil(ad: str) -> dict[str, Any]:
    """Yalnızca havuz JSON'unu düşürür; arşiv klasörüne dokunmaz."""
    guvenli = _guvenli_havuz_adi(ad)
    if not guvenli:
        raise ValueError("Geçersiz havuz kaydı")
    try:
        with _dosya_kilidi(_kilit_yolu()):
            yol = havuz_dizini() / guvenli
            if not yol.exists():
                raise FileNotFoundError("Havuz kaydı yok")
            yol.unlink(missing_ok=True)
            indeks = _indeks_oku()
            indeks["siralar"] = [str(x) for x in indeks.get("siralar") or [] if x != guvenli]
            indeks["anahtarlar"] = {
                k: v for k, v in (indeks.get("anahtarlar") or {}).items() if v != guvenli
            }
            _json_yaz(_indeks_yolu(), indeks)
    except FileNotFoundError:
        raise
    except ValueError:
        raise
    except Exception as hata:
        hata_yaz(ARSIV, f"Havuz kaydı silinemedi: {guvenli}", hata)
        raise
    return havuz_listesi()
