"""Kesim listesi + usta yazılarından akıllı reçete."""

from __future__ import annotations

from collections import defaultdict
from typing import Any


def akilli_recete_olustur(
    kesim_listesi: list[dict[str, Any]],
    yazilar: list[dict[str, Any]] | None = None,
    tel_cizim_izinli: bool = False,
    tel_cizim_algilandi: bool = False,
    tel_cizim_filtrelendi: bool = False,
) -> dict[str, Any]:
    yazilar = yazilar or []
    gruplar: dict[str, list[dict[str, Any]]] = defaultdict(list)
    malzemeler: list[str] = []
    defter: list[str] = []
    tasarim: list[str] = []
    bant_satirlari: list[str] = []

    for parca in kesim_listesi:
        kat = str(parca.get("kategori") or "Kesim")
        gruplar[kat].append({
            "parca_adi": parca.get("parca_adi"),
            "modul_kodu": parca.get("modul_kodu"),
            "uzunluk_mm": parca.get("uzunluk_mm"),
            "genislik_mm": parca.get("genislik_mm"),
            "kalinlik_mm": parca.get("kalinlik_mm"),
            "adet": parca.get("adet"),
            "malzeme": parca.get("malzeme"),
            "bant": parca.get("bant"),
        })
        malzeme = str(parca.get("malzeme") or "").strip()
        if malzeme and malzeme not in malzemeler:
            malzemeler.append(malzeme)

    for yazi in yazilar:
        metin = str(yazi.get("metin") or "").strip()
        if not metin:
            continue
        tur = yazi.get("tur")
        if tur == "defter" or yazi.get("kategori") == "Defter":
            defter.append(metin)
        elif tur == "malzeme" or yazi.get("malzeme"):
            malzeme = str(yazi.get("malzeme") or metin)
            if malzeme not in malzemeler:
                malzemeler.append(malzeme)
        elif tur == "bant":
            bant_satirlari.append(metin)
        elif tur == "kategori":
            tasarim.append(metin)
        else:
            tasarim.append(metin)

    ozet_parca = sum(int(p.get("adet") or 0) for p in kesim_listesi if isinstance(p.get("adet"), int))
    bant_ozet: dict[str, int] = {}
    for parca in kesim_listesi:
        bant = parca.get("bant") if isinstance(parca.get("bant"), dict) else None
        if not bant:
            continue
        kod = str(bant.get("kod") or "0-0-0-0")
        bant_ozet[kod] = bant_ozet.get(kod, 0) + int(parca.get("adet") or 1)
        bant_satirlari.append(
            f"{parca.get('parca_adi', 'Parça')}: {bant.get('rapor') or kod}"
        )

    return {
        "baslik": defter[0] if defter else (tasarim[0] if tasarim else "Kesim reçetesi"),
        "kategoriler": dict(gruplar),
        "malzemeler": malzemeler,
        "defter_notlari": defter,
        "tasarim_yazilari": tasarim if tel_cizim_izinli or not tel_cizim_filtrelendi else [],
        "ozet": {
            "satir": len(kesim_listesi),
            "adet": ozet_parca,
        },
        "kenar_bant": {
            "standart": "kod=U1-U2-K1-K2; boy_bant/en_bant adedi; sema=I/L/C/||/=/□/nokta",
            "kod_dagilimi": bant_ozet,
            "satirlar": bant_satirlari,
        },
        "tel_cizim": {
            "izinli": tel_cizim_izinli,
            "algilandi": tel_cizim_algilandi,
            "filtrelendi": tel_cizim_filtrelendi,
            "ozet": (
                "Bu bir tel çizimdir / farklı bir şemadır. Sistem bunu kesim listesi olarak okumaz."
                if tel_cizim_filtrelendi
                else ("Tel çizim reçeteye alındı." if tel_cizim_izinli and tel_cizim_algilandi else "")
            ),
        },
    }
