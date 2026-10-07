"""25 düzeltmede arka planda kural güncellemesi. Arşiv asla silinmez."""

from __future__ import annotations

import json
import os
import threading
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from arsiv import _dosya_kilidi, islenmemis_duzeltmeler, json_oku, meta_guncelle
from hata_kayit import SUNUCU, hata_yaz
from ogrenme_hafiza import hafiza_sayisi, hafizaya_kaydet, hafizaya_kayittan
from ogrenme_kurallari import kurallari_kaydet, kurallari_yukle, ogrenme_dizini

OGRENME_ESIK = int(os.environ.get("OCR_OGRENME_ESIK", "25"))
MIN_ESLESTIRME = 2
MIN_KALINLIK = 2

_iyilestirme_kilidi = threading.Lock()
_iyilestirme_calisiyor = False


def sayac_yolu():
    return ogrenme_dizini() / "sayac.json"


def _bos_sayac() -> dict[str, Any]:
    return {
        "bekleyen_duzeltme": 0,
        "toplam_kayit": 0,
        "toplam_duzeltme": 0,
        "iyilestirme_sayisi": 0,
        "son_iyilestirme": None,
        "son_ozet": "",
        "esik": OGRENME_ESIK,
    }


def sayaci_oku() -> dict[str, Any]:
    yol = sayac_yolu()
    if not yol.exists():
        return _bos_sayac()
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return _bos_sayac()
    if not isinstance(veri, dict):
        return _bos_sayac()
    birlesik = _bos_sayac()
    birlesik.update(veri)
    birlesik["esik"] = OGRENME_ESIK
    return birlesik


def _sayaci_yaz(veri: dict[str, Any]) -> None:
    yol = sayac_yolu()
    gecici = yol.with_suffix(".json.tmp")
    gecici.write_text(json.dumps(veri, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(gecici, yol)


def tarama_sayacini_artir() -> dict[str, Any]:
    with _dosya_kilidi(ogrenme_dizini() / "sayac.lock"):
        veri = sayaci_oku()
        veri["toplam_kayit"] = int(veri.get("toplam_kayit") or 0) + 1
        _sayaci_yaz(veri)
        return veri


def duzeltme_kaydet_ve_belki_ogren() -> dict[str, Any]:
    """Düzeltme sayacını artırır; eşik dolunca arka plan iyileştirmeyi tetikler."""
    tetikle = False
    with _dosya_kilidi(ogrenme_dizini() / "sayac.lock"):
        veri = sayaci_oku()
        veri["bekleyen_duzeltme"] = int(veri.get("bekleyen_duzeltme") or 0) + 1
        veri["toplam_duzeltme"] = int(veri.get("toplam_duzeltme") or 0) + 1
        _sayaci_yaz(veri)
        tetikle = veri["bekleyen_duzeltme"] >= OGRENME_ESIK
    if tetikle:
        iyilestirmeyi_arkaplanda_baslat()
    return sayaci_oku()


def iyilestirmeyi_arkaplanda_baslat() -> None:
    global _iyilestirme_calisiyor
    with _iyilestirme_kilidi:
        if _iyilestirme_calisiyor:
            return
        _iyilestirme_calisiyor = True

    def _calis():
        global _iyilestirme_calisiyor
        try:
            kurallari_iyilestir()
        except Exception as hata:
            hata_yaz(SUNUCU, "Otomatik öğrenme iyileştirmesi başarısız", hata)
            print(f"Uyarı: Otomatik iyileştirme başarısız: {hata}")
        finally:
            with _iyilestirme_kilidi:
                _iyilestirme_calisiyor = False

    threading.Thread(target=_calis, daemon=True, name="ocr-ogrenme").start()


def _parca_listesi(veri: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not veri:
        return []
    liste = veri.get("kesim_listesi")
    if not isinstance(liste, list):
        return []
    return [p for p in liste if isinstance(p, dict)]


def _metin(deger: Any) -> str:
    return str(deger or "").strip()


def kurallari_iyilestir() -> dict[str, Any]:
    """İşlenmemiş düzeltmeleri tarar, kuralları günceller, arşive dokunmaz (silmez)."""
    klasorler = islenmemis_duzeltmeler()
    if len(klasorler) < OGRENME_ESIK:
        return kurallari_yukle()

    islenecek = klasorler[:OGRENME_ESIK]
    kalinliklar: Counter[float] = Counter()
    malzemeler: Counter[str] = Counter()
    parca_kelimeleri: Counter[str] = Counter()
    parca_esle: Counter[tuple[str, str]] = Counter()
    modul_esle: Counter[tuple[str, str]] = Counter()
    malzeme_esle: Counter[tuple[str, str]] = Counter()
    cm_carpan: list[float] = []

    for klasor in islenecek:
        ham = json_oku(klasor / "ham.json")
        duz = json_oku(klasor / "duzeltilmis.json")
        ham_parcalar = _parca_listesi(ham)
        duz_parcalar = _parca_listesi(duz)
        for indeks, duzeltilmis in enumerate(duz_parcalar):
            kalinlik = duzeltilmis.get("kalinlik_mm")
            try:
                kalinliklar[round(float(kalinlik), 1)] += 1
            except (TypeError, ValueError):
                pass
            malzeme = _metin(duzeltilmis.get("malzeme"))
            if malzeme:
                malzemeler[malzeme] += 1
            parca = _metin(duzeltilmis.get("parca_adi"))
            if parca:
                for kelime in parca.lower().replace("/", " ").split():
                    if len(kelime) >= 3:
                        parca_kelimeleri[kelime] += 1
            if indeks < len(ham_parcalar):
                ham_parca = ham_parcalar[indeks]
                ham_ad = _metin(ham_parca.get("parca_adi"))
                if ham_ad and parca and ham_ad.lower() != parca.lower():
                    parca_esle[(ham_ad.lower(), parca)] += 1
                ham_mod = _metin(ham_parca.get("modul_kodu"))
                duz_mod = _metin(duzeltilmis.get("modul_kodu"))
                if ham_mod and duz_mod and ham_mod.lower() != duz_mod.lower():
                    modul_esle[(ham_mod.lower(), duz_mod)] += 1
                ham_mal = _metin(ham_parca.get("malzeme"))
                if ham_mal and malzeme and ham_mal.lower() != malzeme.lower():
                    malzeme_esle[(ham_mal.lower(), malzeme)] += 1
                try:
                    h_boy = float(ham_parca.get("uzunluk_mm"))
                    d_boy = float(duzeltilmis.get("uzunluk_mm"))
                    if h_boy > 0 and d_boy > 0:
                        cm_carpan.append(d_boy / h_boy)
                except (TypeError, ValueError):
                    pass

    mevcut = kurallari_yukle()
    yeni_kalinlik = [k for k, n in kalinliklar.items() if n >= MIN_KALINLIK and 2 <= k <= 40]
    for k in yeni_kalinlik:
        if k not in mevcut["standart_kalinliklar"]:
            mevcut["standart_kalinliklar"].append(k)
    mevcut["standart_kalinliklar"] = sorted(set(float(x) for x in mevcut["standart_kalinliklar"]), reverse=True)

    for malzeme, n in malzemeler.items():
        if n >= MIN_ESLESTIRME and malzeme.lower() not in {m.lower() for m in mevcut["malzeme_kelimeleri"]}:
            mevcut["malzeme_kelimeleri"].append(malzeme)

    for kelime, n in parca_kelimeleri.items():
        if n >= MIN_ESLESTIRME and kelime not in {p.lower() for p in mevcut["parca_kelimeleri"]}:
            mevcut["parca_kelimeleri"].append(kelime)

    for (kaynak, hedef), n in parca_esle.items():
        if n >= MIN_ESLESTIRME:
            mevcut["parca_adi_esle"][kaynak] = hedef
    for (kaynak, hedef), n in modul_esle.items():
        if n >= MIN_ESLESTIRME:
            mevcut["modul_esle"][kaynak] = hedef
    for (kaynak, hedef), n in malzeme_esle.items():
        if n >= MIN_ESLESTIRME:
            mevcut["malzeme_esle"][kaynak] = hedef

    if len(cm_carpan) >= MIN_ESLESTIRME:
        oran = sorted(cm_carpan)[len(cm_carpan) // 2]
        if 8 <= oran <= 12:
            mevcut["cm_mm_ust_sinir"] = max(float(mevcut.get("cm_mm_ust_sinir") or 350), 400.0)
            mevcut["gemini_notlari"] = list(dict.fromkeys(
                list(mevcut.get("gemini_notlari") or []) + ["Usta düzeltmeleri cm→mm çarpanını doğruladı (x10)."]
            ))
        elif 0.08 <= oran <= 0.12:
            mevcut["cm_mm_ust_sinir"] = min(float(mevcut.get("cm_mm_ust_sinir") or 350), 120.0)
            mevcut["gemini_notlari"] = list(dict.fromkeys(
                list(mevcut.get("gemini_notlari") or []) + ["Usta düzeltmeleri bazı ölçülerin zaten mm olduğunu gösterdi."]
            ))

    if yeni_kalinlik:
        mevcut["gemini_notlari"] = list(dict.fromkeys(
            list(mevcut.get("gemini_notlari") or [])
            + [f"Atölyede görülen kalınlıklar: {', '.join(str(k) for k in sorted(yeni_kalinlik))} mm."]
        ))

    mevcut["surum"] = int(mevcut.get("surum") or 1) + 1
    kurallari_kaydet(mevcut)

    islenen_idler = []
    for klasor in islenecek:
        kayit_id = klasor.name
        islenen_idler.append(kayit_id)
        meta_guncelle(kayit_id, ogrenmeye_dahil=True, ogrenme_zamani=datetime.now(timezone.utc).isoformat())

    ozet = (
        f"{len(islenecek)} düzeltme tarandı; kalınlık {len(yeni_kalinlik)} yeni, "
        f"parça eşleme {len(parca_esle)} aday. Arşiv silinmedi."
    )
    gecmis = ogrenme_dizini() / "iyilestirme_gecmisi.jsonl"
    with gecmis.open("a", encoding="utf-8") as akis:
        akis.write(json.dumps({
            "zaman": datetime.now(timezone.utc).isoformat(),
            "kayit_idler": islenen_idler,
            "ozet": ozet,
            "kurallar_surum": mevcut["surum"],
        }, ensure_ascii=False) + "\n")

    with _dosya_kilidi(ogrenme_dizini() / "sayac.lock"):
        veri = sayaci_oku()
        veri["bekleyen_duzeltme"] = max(0, int(veri.get("bekleyen_duzeltme") or 0) - len(islenecek))
        veri["iyilestirme_sayisi"] = int(veri.get("iyilestirme_sayisi") or 0) + 1
        veri["son_iyilestirme"] = datetime.now(timezone.utc).isoformat()
        veri["son_ozet"] = ozet
        _sayaci_yaz(veri)

    print(f"Bilgi: Otomatik iyileştirme tamamlandı. {ozet}")
    return mevcut
