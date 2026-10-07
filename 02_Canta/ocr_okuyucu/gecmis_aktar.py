"""Geçmiş arşiv kayıtlarını indeksler; yetim görselleri yerel OCR ile içeri alır. Gemini/kota yok."""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

from arsiv import arsiv_kok, duzeltmeyi_arsivle, ham_taramayi_arsivle, json_oku, meta_guncelle
from arsiv_yonetim import harici_arsivi_isle
from hata_kayit import ARSIV, hata_yaz
from ogrenme import duzeltme_kaydet_ve_belki_ogren
from ogrenme_kurallari import ogrenme_dizini, veri_kok

GORSEL_UZANTILAR = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}
ATLANAN_KLASOR = {".venv", "web", "__pycache__", ".git", "node_modules", "tests", "hatalar"}

_goc_basladi = False


def _goc_isaret_yolu() -> Path:
    return ogrenme_dizini() / "goc_sha.json"


def _goc_sha_oku() -> set[str]:
    yol = _goc_isaret_yolu()
    if not yol.exists():
        return set()
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()
    if isinstance(veri, list):
        return {str(x) for x in veri}
    return set()


def _goc_sha_yaz(sha_lar: set[str]) -> None:
    _goc_isaret_yolu().write_text(
        json.dumps(sorted(sha_lar), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def arsiv_kayitlarini_onarma() -> dict[str, int]:
    """ham.json olan kayıtlarda eksik duzeltilmis.json'u doldurur; öğrenmeye alır."""
    onarilan = 0
    ogrenme = 0
    kok = arsiv_kok()
    if not kok.exists():
        return {"onarilan": 0, "ogrenme": 0}
    for klasor in sorted(p for p in kok.iterdir() if p.is_dir()):
        ham_yol = klasor / "ham.json"
        duz_yol = klasor / "duzeltilmis.json"
        meta_yol = klasor / "meta.json"
        if not ham_yol.exists():
            continue
        ham = json_oku(ham_yol)
        if not ham:
            continue
        if not duz_yol.exists():
            try:
                duzeltmeyi_arsivle(klasor.name, ham)
                onarilan += 1
            except Exception as hata:
                hata_yaz(ARSIV, f"Geçmiş kayıt onarılamadı: {klasor.name}", hata)
                continue
        meta = json_oku(meta_yol) or {}
        if meta.get("goc_ogrenme"):
            continue
        if (klasor / "duzeltilmis.json").exists():
            try:
                duzeltme_kaydet_ve_belki_ogren()
                ogrenme += 1
                meta_guncelle(klasor.name, goc_ogrenme=True)
            except Exception as hata:
                hata_yaz(ARSIV, f"Geçmiş öğrenme sayacı yazılamadı: {klasor.name}", hata)
    return {"onarilan": onarilan, "ogrenme": ogrenme}


def _yetim_gorseller(kok: Path) -> list[Path]:
    if not kok.exists():
        return []
    sonuc: list[Path] = []
    arsiv = arsiv_kok().resolve()
    for yol in kok.rglob("*"):
        if not yol.is_file() or yol.suffix.lower() not in GORSEL_UZANTILAR:
            continue
        parcalar = {p.name.lower() for p in yol.resolve().parents}
        if parcalar & {n.lower() for n in ATLANAN_KLASOR}:
            continue
        try:
            if arsiv in yol.resolve().parents or yol.resolve().parent == arsiv:
                continue
        except OSError:
            continue
        sonuc.append(yol)
    return sonuc


def kayitsiz_gorselleri_tara(yalniz_yerel: bool = True) -> dict[str, int]:
    """Proje/veri kökündeki arşiv dışı görselleri yerel OCR ile kaydeder; kota harcamaz."""
    from arsiv import bayt_hash
    from boru_hatti import kroki_oku_baytlari

    alinan = 0
    atlanan = 0
    islenmis = _goc_sha_oku()
    kokler = [veri_kok(), Path(__file__).resolve().parent]
    for kok in kokler:
        for yol in _yetim_gorseller(kok):
            try:
                baytlar = yol.read_bytes()
            except OSError:
                continue
            sha = bayt_hash(baytlar)
            if sha in islenmis:
                atlanan += 1
                continue
            try:
                sonuc = kroki_oku_baytlari(baytlar, yalniz_yerel=yalniz_yerel) or {
                    "kesim_listesi": [],
                    "genel_notlar": ["Geçmiş görsel; ölçü okunamadı."],
                    "olcusuz_izin": True,
                }
                kayit_id = ham_taramayi_arsivle(baytlar, sonuc, yol.name)
                if sonuc.get("kesim_listesi"):
                    duzeltmeyi_arsivle(kayit_id, sonuc)
                islenmis.add(sha)
                alinan += 1
            except Exception as hata:
                hata_yaz(ARSIV, f"Geçmiş görsel okunamadı: {yol.name}", hata)
                islenmis.add(sha)
    try:
        _goc_sha_yaz(islenmis)
    except OSError as hata:
        hata_yaz(ARSIV, "Göç SHA listesi yazılamadı", hata)
    return {"alinan": alinan, "atlanan": atlanan}


def gecmisi_aktar(arkaplan_ocr: bool = True) -> dict[str, Any]:
    """Harici bırakılanları alır, kayıtları onarır, isteğe yetim görselleri arka planda okur."""
    ozet: dict[str, Any] = {}
    try:
        ozet["harici"] = harici_arsivi_isle()
    except Exception as hata:
        hata_yaz(ARSIV, "Göç harici tarama başarısız", hata)
        ozet["harici"] = {"hata": str(hata)}
    try:
        ozet["onarim"] = arsiv_kayitlarini_onarma()
    except Exception as hata:
        hata_yaz(ARSIV, "Göç kayıt onarımı başarısız", hata)
        ozet["onarim"] = {"hata": str(hata)}
    if arkaplan_ocr:
        threading.Thread(target=_guvenli_yetim, daemon=True, name="gecmis-ocr").start()
        ozet["yetim_ocr"] = "arkaplan"
    return ozet


def _guvenli_yetim() -> None:
    try:
        kayitsiz_gorselleri_tara(yalniz_yerel=True)
    except Exception as hata:
        hata_yaz(ARSIV, "Yetim görsel göçü başarısız", hata)


def gecmisi_arkaplanda_baslat() -> None:
    global _goc_basladi
    if _goc_basladi:
        return
    _goc_basladi = True
    threading.Thread(target=lambda: gecmisi_aktar(arkaplan_ocr=True), daemon=True, name="gecmis-aktar").start()
