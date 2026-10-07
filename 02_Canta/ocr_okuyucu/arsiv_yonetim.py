"""Harici arşiv tarama, tekilleştirme, bozuk görsel temizliği ve öğrenme tetikleme."""

from __future__ import annotations

import json
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from arsiv import (
    _dosya_kilidi,
    _json_yaz,
    _uzanti,
    arsiv_kok,
    bayt_hash,
    benzersiz_kroki_adi,
    cakismayan_hedef,
    dosya_hash,
    gorsel_bozuk_mu,
    ham_taramayi_arsivle,
    icerik_zaten_var,
    indekse_ekle,
    json_oku,
    kayit_klasoru,
    piksel_imza,
)
from ogrenme import duzeltme_kaydet_ve_belki_ogren, iyilestirmeyi_arkaplanda_baslat, sayaci_oku, tarama_sayacini_artir
from hata_kayit import ARSIV, hata_yaz
from kota import kota_katki_ile_yenile
from ogrenme_kurallari import ogrenme_dizini

GORSEL_UZANTILAR = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}
JSON_UZANTILAR = {".json"}
ATLANACAK = {".tmp", ".lock", ".jsonl"}

_izleme_basladi = False
_son_ozet: dict[str, Any] = {}
_son_serbest_imza: tuple | None = None
TAM_TARAMA_TICK = 10  # 12s × 10 ≈ 2 dk; iç klasör temizliği bu sıklıkta


def _bos_ozet() -> dict[str, Any]:
    return {
        "bozuk_silindi": 0,
        "kopya_silindi": 0,
        "harici_kayit": 0,
        "harici_duzeltme": 0,
        "yeniden_ad": 0,
        "ogrenme": sayaci_oku(),
    }


def son_arsiv_ozeti() -> dict[str, Any]:
    """İstek yolunda tam tarama yok; son izleme özeti."""
    return dict(_son_ozet) if _son_ozet else _bos_ozet()


def _serbest_imza(kok: Path) -> tuple:
    """Yalnız kayitlar kökündeki bırakılmış dosyalar; iç kayıt klasörlerini açmaz."""
    if not kok.exists():
        return ()
    imza = []
    try:
        for yol in kok.iterdir():
            if not yol.is_file():
                continue
            if yol.name.startswith(".") or yol.suffix.lower() in ATLANACAK:
                continue
            try:
                st = yol.stat()
            except OSError:
                continue
            imza.append((yol.name, st.st_mtime_ns, st.st_size))
    except OSError:
        return ()
    return tuple(sorted(imza))


def temizlik_gunlugu() -> Path:
    return ogrenme_dizini() / "arsiv_temizlik.jsonl"


def _log(olay: str, **alanlar: Any) -> None:
    kayit = {"zaman": datetime.now(timezone.utc).isoformat(), "olay": olay, **alanlar}
    with temizlik_gunlugu().open("a", encoding="utf-8") as akis:
        akis.write(json.dumps(kayit, ensure_ascii=False) + "\n")


def _kesim_json_mi(veri: Any) -> bool:
    return isinstance(veri, dict) and isinstance(veri.get("kesim_listesi"), list)


def _serbest_dosyalar(kok: Path) -> list[Path]:
    if not kok.exists():
        return []
    sonuc = []
    for yol in kok.iterdir():
        if not yol.is_file():
            continue
        if yol.name.startswith("."):
            continue
        if yol.suffix.lower() in ATLANACAK:
            continue
        if yol.name.endswith(".tmp"):
            continue
        sonuc.append(yol)
    return sonuc


def _bozuklari_sil(kok: Path) -> int:
    silinen = 0
    for yol in list(_serbest_dosyalar(kok)):
        if yol.suffix.lower() not in GORSEL_UZANTILAR:
            continue
        if gorsel_bozuk_mu(yol):
            _log("bozuk_silindi", yol=str(yol))
            yol.unlink(missing_ok=True)
            silinen += 1
    for klasor in sorted(p for p in kok.iterdir() if p.is_dir()):
        for yol in klasor.iterdir():
            if not yol.is_file() or yol.suffix.lower() not in GORSEL_UZANTILAR:
                continue
            if gorsel_bozuk_mu(yol):
                _log("bozuk_silindi", yol=str(yol), kayit=klasor.name)
                yol.unlink(missing_ok=True)
                silinen += 1
    return silinen


def _kopyalari_ele(kok: Path) -> int:
    """İsmi farklı, içeriği (hash veya piksel) aynı olan fazlalıkları siler; bir kopya kalır."""
    adaylar: list[tuple[Path, str, str | None]] = []
    for klasor in [kok] + [p for p in kok.iterdir() if p.is_dir()]:
        for yol in klasor.iterdir() if klasor.exists() else []:
            if not yol.is_file() or yol.suffix.lower() not in GORSEL_UZANTILAR:
                continue
            try:
                sha = dosya_hash(yol)
            except OSError:
                continue
            adaylar.append((yol, sha, piksel_imza(yol=yol)))

    gorulen_sha: dict[str, Path] = {}
    gorulen_piksel: dict[str, Path] = {}
    silinen = 0
    for yol, sha, piksel in sorted(adaylar, key=lambda t: str(t[0])):
        tut = gorulen_sha.get(sha) or (gorulen_piksel.get(piksel) if piksel else None)
        if tut is not None and tut != yol:
            _log("kopya_silindi", silinen=str(yol), kalan=str(tut), sha=sha)
            yol.unlink(missing_ok=True)
            silinen += 1
            continue
        gorulen_sha.setdefault(sha, yol)
        if piksel:
            gorulen_piksel.setdefault(piksel, yol)
    return silinen


def _json_al(yol: Path) -> dict[str, Any] | None:
    veri = json_oku(yol)
    return veri if _kesim_json_mi(veri) else None


def _serbest_ciftleri_ice_al(kok: Path) -> dict[str, int]:
    """kayitlar/ köküne bırakılan görsel ve JSON'ları standart kayıtlara çevirir."""
    gorseller = [p for p in _serbest_dosyalar(kok) if p.suffix.lower() in GORSEL_UZANTILAR]
    jsonlar = [p for p in _serbest_dosyalar(kok) if p.suffix.lower() in JSON_UZANTILAR]
    json_by_stem = {p.stem.lower(): p for p in jsonlar}
    kullanilan_json: set[Path] = set()
    yeni_kayit = 0
    yeni_duzeltme = 0
    atlanan_kopya = 0

    for gorsel in gorseller:
        try:
            baytlar = gorsel.read_bytes()
        except OSError:
            continue
        if gorsel_bozuk_mu(gorsel):
            _log("bozuk_silindi", yol=str(gorsel))
            gorsel.unlink(missing_ok=True)
            continue
        sha = bayt_hash(baytlar)
        piksel = piksel_imza(veri=baytlar)
        es = json_by_stem.get(gorsel.stem.lower())
        json_veri = _json_al(es) if es else None
        if es and json_veri:
            kullanilan_json.add(es)

        mevcut = icerik_zaten_var(sha, piksel)
        if mevcut and kayit_klasoru(mevcut).exists():
            if json_veri:
                _json_yaz(kayit_klasoru(mevcut) / "duzeltilmis.json", json_veri)
                _json_yaz(kayit_klasoru(mevcut) / "ham.json", json_veri)
                yeni_duzeltme += 1
            _log("kopya_atlandi", yol=str(gorsel), kayit_id=mevcut)
            gorsel.unlink(missing_ok=True)
            if es and es in kullanilan_json:
                es.unlink(missing_ok=True)
            atlanan_kopya += 1
            continue

        ham = json_veri or {"kesim_listesi": [], "genel_notlar": ["Harici arşivden alındı."], "olcusuz_izin": True}
        kayit_id = ham_taramayi_arsivle(baytlar, ham, gorsel.name)
        if json_veri:
            _json_yaz(kayit_klasoru(kayit_id) / "duzeltilmis.json", json_veri)
            yeni_duzeltme += 1
        yeni_kayit += 1
        _log("harici_alindi", kayit_id=kayit_id, orijinal=gorsel.name)
        gorsel.unlink(missing_ok=True)
        if es and json_veri:
            es.unlink(missing_ok=True)

    for js in jsonlar:
        if js in kullanilan_json or not js.exists():
            continue
        veri = _json_al(js)
        if not veri:
            _log("bozuk_json_silindi", yol=str(js))
            js.unlink(missing_ok=True)
            continue
        kayit_id = datetime_id()
        klasor = kayit_klasoru(kayit_id)
        klasor.mkdir(parents=True, exist_ok=True)
        _json_yaz(klasor / "ham.json", veri)
        _json_yaz(klasor / "duzeltilmis.json", veri)
        _json_yaz(klasor / "meta.json", {
            "kayit_id": kayit_id,
            "olusturma": datetime.now(timezone.utc).isoformat(),
            "orijinal_dosya": js.name,
            "duzeltme_var": True,
            "ogrenmeye_dahil": False,
            "silinemez": True,
            "kaynak": "harici_json",
        })
        yeni_kayit += 1
        yeni_duzeltme += 1
        _log("harici_json_alindi", kayit_id=kayit_id, orijinal=js.name)
        js.unlink(missing_ok=True)

    return {"kayit": yeni_kayit, "duzeltme": yeni_duzeltme, "kopya": atlanan_kopya}


def datetime_id() -> str:
    import uuid
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S") + "_" + uuid.uuid4().hex[:10]


def klasor_ici_yeniden_adlandir(kok: Path) -> int:
    """Kayıt klasörlerindeki kroki.* dosyalarını çakışmayan standart ada çeker."""
    adet = 0
    for klasor in sorted(p for p in kok.iterdir() if p.is_dir()):
        for yol in list(klasor.iterdir()):
            if not yol.is_file() or yol.suffix.lower() not in GORSEL_UZANTILAR:
                continue
            if yol.name.startswith("kroki_"):
                continue
            try:
                sha = dosya_hash(yol)
            except OSError:
                continue
            hedef = cakismayan_hedef(klasor, benzersiz_kroki_adi(yol.suffix), sha)
            if hedef == yol:
                continue
            yol.replace(hedef)
            adet += 1
            _log("yeniden_adlandirildi", eski=yol.name, yeni=hedef.name, kayit=klasor.name)
    return adet


def harici_arsivi_isle(tam: bool = True) -> dict[str, Any]:
    """Manuel bırakılan dosyaları alır; tam=False iken iç klasör hash/PIL turunu atlar."""
    global _son_ozet, _son_serbest_imza
    with _dosya_kilidi(ogrenme_dizini() / "arsiv_izleme.lock"):
        kok = arsiv_kok()
        imza = _serbest_imza(kok)
        if not tam and imza == _son_serbest_imza and not imza:
            ozet = son_arsiv_ozeti()
            ozet["atlandi"] = True
            return ozet
        _son_serbest_imza = imza
        if tam:
            bozuk = _bozuklari_sil(kok)
            kopya = _kopyalari_ele(kok)
            ad = klasor_ici_yeniden_adlandir(kok)
        else:
            bozuk = 0
            kopya = 0
            ad = 0
            for yol in list(_serbest_dosyalar(kok)):
                if yol.suffix.lower() not in GORSEL_UZANTILAR:
                    continue
                if gorsel_bozuk_mu(yol):
                    _log("bozuk_silindi", yol=str(yol))
                    yol.unlink(missing_ok=True)
                    bozuk += 1
        alinan = _serbest_ciftleri_ice_al(kok)
        for _ in range(alinan.get("kayit") or 0):
            tarama_sayacini_artir()
        for _ in range(alinan.get("duzeltme") or 0):
            duzeltme_kaydet_ve_belki_ogren()
        if (alinan.get("kayit") or 0) > 0:
            kota_katki_ile_yenile("varsayilan", int(alinan["kayit"]))
        ozet = {
            "bozuk_silindi": bozuk,
            "kopya_silindi": kopya,
            "harici_kayit": alinan.get("kayit", 0),
            "harici_duzeltme": alinan.get("duzeltme", 0),
            "yeniden_ad": ad,
            "ogrenme": sayaci_oku(),
        }
        if sayaci_oku().get("bekleyen_duzeltme", 0) >= int(sayaci_oku().get("esik") or 25):
            iyilestirmeyi_arkaplanda_baslat()
        _son_ozet = ozet
        return ozet


def arsiv_izlemeyi_baslat(aralik_sn: float = 12.0) -> None:
    global _izleme_basladi
    if _izleme_basladi:
        return
    _izleme_basladi = True

    def dongu():
        tick = 0
        while True:
            time.sleep(aralik_sn)
            tick += 1
            try:
                harici_arsivi_isle(tam=(tick % TAM_TARAMA_TICK == 0))
            except Exception as hata:
                hata_yaz(ARSIV, "Arşiv izleme döngüsü hata verdi", hata)
                print(f"Uyarı: Arşiv izleme: {hata}")

    threading.Thread(target=dongu, daemon=True, name="arsiv-izle").start()
