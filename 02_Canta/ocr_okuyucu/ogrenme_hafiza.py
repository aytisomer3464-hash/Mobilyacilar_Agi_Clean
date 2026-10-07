"""Usta düzeltmelerini anında saklar; sonraki taramada varsayılan kurallardan önce uygulanır."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any

from arsiv import _dosya_kilidi, json_oku, kayit_klasoru
from hata_kayit import SUNUCU, hata_yaz
from kenar_bant import bant_ayristir, varsayilan_pvc
from ogrenme_kurallari import ogrenme_dizini

MAKS_SATIR = 1500
MIN_TOKEN = 2
OLCU = re.compile(
    r"(?P<boy>\d+(?:[.,]\d+)?)\s*[xX×*]\s*(?P<en>\d+(?:[.,]\d+)?)"
)


def hafiza_yolu():
    return ogrenme_dizini() / "ogrenme_hafizasi.json"


def _bos() -> dict[str, Any]:
    return {"surum": 1, "satir": {}, "rakam": {}, "bant": {}}


def hafizayi_oku() -> dict[str, Any]:
    yol = hafiza_yolu()
    if not yol.exists():
        return _bos()
    try:
        ham = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return _bos()
    if not isinstance(ham, dict):
        return _bos()
    veri = _bos()
    for anahtar in ("satir", "rakam", "bant"):
        oge = ham.get(anahtar)
        if isinstance(oge, dict):
            veri[anahtar] = oge
    veri["surum"] = int(ham.get("surum") or 1)
    return veri


def _yaz(veri: dict[str, Any]) -> None:
    yol = hafiza_yolu()
    gecici = yol.with_suffix(".json.tmp")
    gecici.write_text(json.dumps(veri, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(gecici, yol)


def metin_imza(ham: str) -> str:
    s = re.sub(r"\s+", " ", str(ham or "").strip())
    s = re.sub(r"[xX×*]", "x", s)
    return s.lower()[:160]


def hafiza_sayisi() -> int:
    veri = hafizayi_oku()
    return len(veri.get("satir") or {})


def okunan_kopya(parca: dict[str, Any] | None) -> dict[str, Any]:
    parca = parca if isinstance(parca, dict) else {}
    bant = parca.get("bant")
    kod = ""
    if isinstance(bant, dict):
        kod = str(bant.get("kod") or "")
    elif bant:
        kod = str(bant)
    mevcut = parca.get("okunan") if isinstance(parca.get("okunan"), dict) else {}
    ham = str(parca.get("ham_metin") or mevcut.get("ham_metin") or parca.get("not") or "")[:120]
    return {
        "ham_metin": ham,
        "uzunluk_mm": parca.get("uzunluk_mm", mevcut.get("uzunluk_mm")),
        "genislik_mm": parca.get("genislik_mm", mevcut.get("genislik_mm")),
        "adet": parca.get("adet", mevcut.get("adet")),
        "parca_adi": parca.get("parca_adi") or mevcut.get("parca_adi") or "",
        "bant_kod": kod or str(mevcut.get("bant_kod") or ""),
    }


def _sayi(deger: Any) -> float | None:
    try:
        n = float(deger)
    except (TypeError, ValueError):
        return None
    if n != n:
        return None
    return n


def _hedef_al(hedef: dict[str, Any]) -> dict[str, Any]:
    bant = hedef.get("bant")
    kod = ""
    if isinstance(bant, dict):
        kod = str(bant.get("kod") or "")
    elif hedef.get("bant_kod"):
        kod = str(hedef.get("bant_kod") or "")
    return {
        "uzunluk_mm": _sayi(hedef.get("uzunluk_mm")),
        "genislik_mm": _sayi(hedef.get("genislik_mm")),
        "adet": _sayi(hedef.get("adet")),
        "parca_adi": str(hedef.get("parca_adi") or "").strip(),
        "malzeme": str(hedef.get("malzeme") or "").strip(),
        "bant_kod": kod,
        "kalinlik_mm": _sayi(hedef.get("kalinlik_mm")),
    }


def _kirp_sozluk(sozluk: dict[str, Any], tavan: int) -> dict[str, Any]:
    if len(sozluk) <= tavan:
        return sozluk
    sirali = sorted(
        sozluk.items(),
        key=lambda kv: (int((kv[1] or {}).get("sayac") or 0), str((kv[1] or {}).get("zaman") or "")),
    )
    return dict(sirali[-tavan:])


def hafizaya_kaydet(orijinal: dict[str, Any] | None, hedef: dict[str, Any] | None) -> dict[str, Any]:
    """Orijinal okuma ile usta değerini eşler; dosyaya anında yazar."""
    orijinal = orijinal if isinstance(orijinal, dict) else {}
    hedef = hedef if isinstance(hedef, dict) else {}
    ham = str(
        orijinal.get("ham_metin")
        or (orijinal.get("okunan") or {}).get("ham_metin")
        or orijinal.get("not")
        or hedef.get("ham_metin")
        or hedef.get("not")
        or ""
    )
    imza = metin_imza(ham)
    doldur = _hedef_al(hedef)
    if not imza or doldur["uzunluk_mm"] is None or doldur["genislik_mm"] is None:
        return hafizayi_oku()
    try:
        with _dosya_kilidi(ogrenme_dizini() / "hafiza.lock"):
            veri = hafizayi_oku()
            satir = dict(veri.get("satir") or {})
            once = dict(satir.get(imza) or {})
            sayac = int(once.get("sayac") or 0) + 1
            satir[imza] = {
                "ham_metin": ham[:120],
                "hedef": doldur,
                "sayac": sayac,
                "zaman": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            veri["satir"] = _kirp_sozluk(satir, MAKS_SATIR)

            olcu = OLCU.search(ham)
            rakam = dict(veri.get("rakam") or {})
            if olcu:
                for anahtar, mm in (
                    (olcu.group("boy"), doldur["uzunluk_mm"]),
                    (olcu.group("en"), doldur["genislik_mm"]),
                ):
                    tok = re.sub(r"\s+", "", anahtar or "")
                    if not tok or mm is None:
                        continue
                    eski = dict(rakam.get(tok) or {})
                    rakam[tok] = {
                        "mm": mm,
                        "sayac": int(eski.get("sayac") or 0) + 1,
                        "zaman": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                    }
            veri["rakam"] = _kirp_sozluk(rakam, MAKS_SATIR)

            if doldur["bant_kod"]:
                bant = dict(veri.get("bant") or {})
                bant[imza] = {
                    "kod": doldur["bant_kod"],
                    "sayac": int((bant.get(imza) or {}).get("sayac") or 0) + 1,
                }
                veri["bant"] = _kirp_sozluk(bant, MAKS_SATIR)
            _yaz(veri)
            return veri
    except Exception as hata:
        hata_yaz(SUNUCU, "Usta öğrenme hafızası yazılamadı", hata)
        return hafizayi_oku()


def hafizaya_listeden(ham_veri: dict[str, Any] | None, duz_veri: dict[str, Any] | None) -> None:
    ham_liste = (ham_veri or {}).get("kesim_listesi") if isinstance(ham_veri, dict) else None
    duz_liste = (duz_veri or {}).get("kesim_listesi") if isinstance(duz_veri, dict) else None
    if not isinstance(duz_liste, list):
        return
    ham_liste = ham_liste if isinstance(ham_liste, list) else []
    for i, duz in enumerate(duz_liste):
        if not isinstance(duz, dict):
            continue
        ham = ham_liste[i] if i < len(ham_liste) and isinstance(ham_liste[i], dict) else {}
        orijinal = duz.get("okunan") if isinstance(duz.get("okunan"), dict) else ham
        hafizaya_kaydet(orijinal, duz)


def hafizaya_kayittan(kayit_id: str, duz_veri: dict[str, Any] | None) -> None:
    if not kayit_id:
        return
    try:
        ham = json_oku(kayit_klasoru(kayit_id) / "ham.json")
    except Exception as hata:
        hata_yaz(SUNUCU, "Hafıza için ham.json okunamadı", hata)
        ham = None
    hafizaya_listeden(ham, duz_veri)


def _uygula_hedef(parca: dict[str, Any], hedef: dict[str, Any]) -> None:
    if hedef.get("uzunluk_mm") is not None:
        parca["uzunluk_mm"] = hedef["uzunluk_mm"]
    if hedef.get("genislik_mm") is not None:
        parca["genislik_mm"] = hedef["genislik_mm"]
    if hedef.get("adet") is not None:
        try:
            parca["adet"] = int(hedef["adet"])
        except (TypeError, ValueError):
            pass
    if hedef.get("parca_adi"):
        parca["parca_adi"] = hedef["parca_adi"]
    if hedef.get("malzeme"):
        parca["malzeme"] = hedef["malzeme"]
    if hedef.get("kalinlik_mm") is not None:
        parca["kalinlik_mm"] = hedef["kalinlik_mm"]
    kod = str(hedef.get("bant_kod") or "")
    if kod:
        parca["bant"] = bant_ayristir(kod, varsayilan=varsayilan_pvc(parca))
    parca["supheli"] = False
    parca["okunamadi"] = False
    parca["suphe_seviye"] = ""
    parca["suphe_neden"] = ""
    parca["hafiza_vurus"] = True
    parca["guven"] = max(float(parca.get("guven") or 0), 0.92)


def hafizadan_doldur(parca: dict[str, Any] | None) -> bool:
    """Varsayılan parser kurallarından önce usta hafızasını uygular."""
    if not isinstance(parca, dict):
        return False
    if not parca.get("okunan"):
        parca["okunan"] = okunan_kopya(parca)
    if parca.get("hafiza_vurus"):
        return True
    ham = str(parca.get("ham_metin") or parca.get("not") or parca["okunan"].get("ham_metin") or "")
    imza = metin_imza(ham)
    if not imza:
        return False
    veri = hafizayi_oku()
    satir = (veri.get("satir") or {}).get(imza)
    if isinstance(satir, dict) and int(satir.get("sayac") or 0) >= 1:
        hedef = satir.get("hedef") if isinstance(satir.get("hedef"), dict) else {}
        if hedef.get("uzunluk_mm") is not None and hedef.get("genislik_mm") is not None:
            _uygula_hedef(parca, hedef)
            return True
    olcu = OLCU.search(ham)
    if not olcu:
        return False
    rakam = veri.get("rakam") or {}
    boy_tok = re.sub(r"\s+", "", olcu.group("boy") or "")
    en_tok = re.sub(r"\s+", "", olcu.group("en") or "")
    boy_k = rakam.get(boy_tok) if isinstance(rakam.get(boy_tok), dict) else None
    en_k = rakam.get(en_tok) if isinstance(rakam.get(en_tok), dict) else None
    degisti = False
    if boy_k and int(boy_k.get("sayac") or 0) >= MIN_TOKEN and _sayi(boy_k.get("mm")) is not None:
        parca["uzunluk_mm"] = float(boy_k["mm"])
        degisti = True
    if en_k and int(en_k.get("sayac") or 0) >= MIN_TOKEN and _sayi(en_k.get("mm")) is not None:
        parca["genislik_mm"] = float(en_k["mm"])
        degisti = True
    bant_k = (veri.get("bant") or {}).get(imza)
    if isinstance(bant_k, dict) and int(bant_k.get("sayac") or 0) >= 1 and bant_k.get("kod"):
        parca["bant"] = bant_ayristir(str(bant_k["kod"]), varsayilan=varsayilan_pvc(parca))
        degisti = True
    if degisti:
        parca["supheli"] = False
        parca["okunamadi"] = False
        parca["suphe_seviye"] = ""
        parca["hafiza_vurus"] = True
        parca["guven"] = max(float(parca.get("guven") or 0), 0.88)
    return degisti


def hafizadan_satir(metin: str, ocr_skoru: float = 1.0, kutu=None) -> dict[str, Any] | None:
    """OCR ölçü deseni kaçırdıysa aynı satır imzasından usta kaydını üretir."""
    imza = metin_imza(metin)
    if not imza:
        return None
    satir = (hafizayi_oku().get("satir") or {}).get(imza)
    if not isinstance(satir, dict) or int(satir.get("sayac") or 0) < 1:
        return None
    hedef = satir.get("hedef") if isinstance(satir.get("hedef"), dict) else {}
    if hedef.get("uzunluk_mm") is None or hedef.get("genislik_mm") is None:
        return None
    kayit = {
        "modul_kodu": "GENEL",
        "parca_adi": hedef.get("parca_adi") or "Parça",
        "uzunluk_mm": hedef["uzunluk_mm"],
        "genislik_mm": hedef["genislik_mm"],
        "kalinlik_mm": hedef.get("kalinlik_mm") or 18.0,
        "adet": int(hedef["adet"] or 1) if hedef.get("adet") is not None else 1,
        "malzeme": hedef.get("malzeme") or "",
        "not": str(metin or "")[:80],
        "supheli": False,
        "guven": max(float(ocr_skoru), 0.9),
        "kutu": kutu,
        "ham_metin": str(metin or "")[:120],
        "hafiza_vurus": True,
    }
    kayit["okunan"] = okunan_kopya(kayit)
    _uygula_hedef(kayit, hedef)
    return kayit
