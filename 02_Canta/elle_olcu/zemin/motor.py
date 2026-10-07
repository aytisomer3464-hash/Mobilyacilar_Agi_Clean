"""Zemin motoru. Duvar, OCR, ebatlama, elle_olcu import etmez.

Ana dikdörtgen + çıkıntı (ekleme) / oyuk-kiler (çıkarma).
Kenar: on, sag, arka, sol. Parça en = kenar boyunca, boy = duvardan derinlik.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

EN_MIN, EN_MAKS = 1, 12000
SNAP_MM = 10
KENARLAR = ("on", "sag", "arka", "sol")
EK_TIP = frozenset({"cikinti", "oyuk"})
TIPLER = frozenset({"oda_zemin", "seramik", "kapi", "sifon", "yukselti", "mermer"})
CUMLE = {
    "en": "Oda en kaç?",
    "boy": "Oda boy kaç?",
    "ek_var": "Bu odada ek parça var mı?",
    "ek_tip": "Çıkıntı ekle mi, oyuk/kiler çıkar mı?",
    "ek_en": "Ek parça en (kenar boyunca) kaç?",
    "ek_boy": "Ek parça boy (derinlik) kaç?",
    "ek_kenar": "Hangi kenara yapışsın? (sürükle)",
    "birak": "Zeminde ne var, bırak. Yoksa Uygula.",
    "kilit": "Zemin mühürlü.",
}


def _tam(deger: Any, alan: str) -> int:
    try:
        if isinstance(deger, bool) or deger is None:
            raise ValueError
        return int(str(deger).strip().replace(",", ".").split(".")[0])
    except (TypeError, ValueError):
        raise ValueError(f"{alan} tam sayı olmalı.") from None


def _kopya(durum: dict | None) -> dict:
    if not durum:
        return bos()
    return deepcopy(durum)


def _aralik(mm: int, lo: int, hi: int, alan: str) -> int:
    if mm < lo or mm > hi:
        raise ValueError(f"{alan} {lo}–{hi} mm olmalı.")
    return mm


def _snap(mm: int) -> int:
    return int(round(mm / SNAP_MM) * SNAP_MM)


def bos() -> dict:
    return {
        "asama": 1,
        "tur": "en",
        "kilit": False,
        "hazir": False,
        "cumle": CUMLE["en"],
        "soz": "",
        "oda": {"en": 0, "boy": 0},
        "ekler": [],
        "taslak": {},
        "alan_mm2": 0,
        "yerlesim": [],
    }


def _kabuk_tam(d: dict) -> bool:
    o = d["oda"]
    return o["en"] > 0 and o["boy"] > 0


def alan_mm2(durum: dict) -> int:
    o = durum["oda"]
    a = o["en"] * o["boy"]
    for e in durum.get("ekler") or []:
        parca = int(e["en"]) * int(e["boy"])
        if e["tip"] == "cikinti":
            a += parca
        else:
            a -= parca
    return a


def _alan_yaz(d: dict) -> dict:
    d["alan_mm2"] = alan_mm2(d)
    return d


def _kenar_uzun(d: dict, kenar: str) -> int:
    o = d["oda"]
    return o["en"] if kenar in ("on", "arka") else o["boy"]


def _kenar_derin(d: dict, kenar: str) -> int:
    o = d["oda"]
    return o["boy"] if kenar in ("on", "arka") else o["en"]


def ek_kutu(durum: dict, e: dict) -> dict:
    """sol/alt = zemin orijini (sol-alt). Çıkıntı dışarı, oyuk içeride."""
    o = durum["oda"]
    kenar, en, boy = e["kenar"], int(e["en"]), int(e["boy"])
    kay = int(e.get("kayma") or 0)
    if kenar == "sol":
        return {"sol": -boy if e["tip"] == "cikinti" else 0, "alt": kay, "en": boy, "boy": en}
    if kenar == "sag":
        sol = o["en"] if e["tip"] == "cikinti" else o["en"] - boy
        return {"sol": sol, "alt": kay, "en": boy, "boy": en}
    if kenar == "on":
        return {"sol": kay, "alt": -boy if e["tip"] == "cikinti" else 0, "en": en, "boy": boy}
    alt = o["boy"] if e["tip"] == "cikinti" else o["boy"] - boy
    return {"sol": kay, "alt": alt, "en": en, "boy": boy}


def _siger(d: dict, e: dict) -> str | None:
    if e["en"] > _kenar_uzun(d, e["kenar"]):
        return "Parça kenara sığmaz."
    if e["tip"] == "oyuk" and e["boy"] >= _kenar_derin(d, e["kenar"]):
        return "Oyuk odayı yer."
    if alan_mm2({"oda": d["oda"], "ekler": d["ekler"] + [e]}) <= 0:
        return "Zemin alanı sıfır olur."
    return None


def _kayma_birak(d: dict, kenar: str, x: int, z: int) -> int:
    parca = int((d.get("taslak") or {}).get("en") or 0)
    kay = int(x - parca // 2) if kenar in ("on", "arka") else int(z - parca // 2)
    return kay if kay > 0 else 0


def _yakin_kenar(d: dict, x: int, z: int) -> str:
    o = d["oda"]
    aday = {
        "sol": abs(x),
        "sag": abs(o["en"] - x),
        "on": abs(z),
        "arka": abs(o["boy"] - z),
    }
    return min(aday, key=aday.get)


def olcu_yaz(durum: dict | None, mm: Any) -> dict:
    d = _kopya(durum)
    d["soz"] = ""
    if d["kilit"]:
        d["hazir"] = False
        d["soz"] = "Zemin mühürlü."
        return d
    if d["tur"] == "en":
        try:
            d["oda"]["en"] = _aralik(_tam(mm, "en"), EN_MIN, EN_MAKS, "en")
        except ValueError as e:
            d["hazir"] = False
            d["soz"] = str(e)
            return d
        d["tur"] = "boy"
        d["cumle"] = CUMLE["boy"]
        d["hazir"] = True
        return _alan_yaz(d)
    if d["tur"] == "boy":
        try:
            d["oda"]["boy"] = _aralik(_tam(mm, "boy"), EN_MIN, EN_MAKS, "boy")
        except ValueError as e:
            d["hazir"] = False
            d["soz"] = str(e)
            return d
        d["tur"] = "ek_var"
        d["cumle"] = CUMLE["ek_var"]
        d["hazir"] = True
        return _alan_yaz(d)
    if d["tur"] == "ek_en":
        try:
            d["taslak"]["en"] = _aralik(_tam(mm, "en"), EN_MIN, EN_MAKS, "en")
        except ValueError as e:
            d["hazir"] = False
            d["soz"] = str(e)
            return d
        d["tur"] = "ek_boy"
        d["cumle"] = CUMLE["ek_boy"]
        d["hazir"] = True
        return d
    if d["tur"] == "ek_boy":
        try:
            d["taslak"]["boy"] = _aralik(_tam(mm, "boy"), EN_MIN, EN_MAKS, "boy")
        except ValueError as e:
            d["hazir"] = False
            d["soz"] = str(e)
            return d
        d["tur"] = "ek_kenar"
        d["cumle"] = CUMLE["ek_kenar"]
        d["hazir"] = True
        return d
    d["hazir"] = False
    d["soz"] = d["cumle"]
    return d


def oda_duzelt(durum: dict | None, alan: str, mm: Any) -> dict:
    d = _kopya(durum)
    d["soz"] = ""
    if d["kilit"]:
        d["hazir"] = False
        d["soz"] = "Zemin mühürlü."
        return d
    if alan not in ("en", "boy"):
        d["hazir"] = False
        d["soz"] = "Zeminde yalnız en ve boy."
        return d
    try:
        d["oda"][alan] = _aralik(_tam(mm, alan), EN_MIN, EN_MAKS, alan)
    except ValueError as e:
        d["hazir"] = False
        d["soz"] = str(e)
        return d
    d["hazir"] = True
    return _alan_yaz(d)


def ek_var_yaz(durum: dict | None, var: bool) -> dict:
    d = _kopya(durum)
    d["soz"] = ""
    if d["kilit"] or d["tur"] != "ek_var":
        d["hazir"] = False
        d["soz"] = "Şimdi ek parça sorusu."
        return d
    if var:
        d["taslak"] = {}
        d["tur"] = "ek_tip"
        d["cumle"] = CUMLE["ek_tip"]
    else:
        d["taslak"] = {}
        d["tur"] = "birak"
        d["cumle"] = CUMLE["birak"]
    d["hazir"] = True
    return d


def ek_tip_yaz(durum: dict | None, tip: str) -> dict:
    d = _kopya(durum)
    d["soz"] = ""
    if d["kilit"] or d["tur"] != "ek_tip":
        d["hazir"] = False
        d["soz"] = "Önce çıkıntı veya oyuk seç."
        return d
    if tip not in EK_TIP:
        d["hazir"] = False
        d["soz"] = "Çıkıntı veya oyuk."
        return d
    d["taslak"] = {"tip": tip}
    d["tur"] = "ek_en"
    d["cumle"] = CUMLE["ek_en"]
    d["hazir"] = True
    return d


def ek_kenar_yaz(durum: dict | None, kenar: str, kayma: Any = 0) -> dict:
    d = _kopya(durum)
    d["soz"] = ""
    if d["kilit"] or d["tur"] != "ek_kenar":
        d["hazir"] = False
        d["soz"] = "Önce ek ölçü."
        return d
    if kenar not in KENARLAR:
        d["hazir"] = False
        d["soz"] = "Kenar: on, sag, arka, sol."
        return d
    t = dict(d.get("taslak") or {})
    if t.get("tip") not in EK_TIP or not t.get("en") or not t.get("boy"):
        d["hazir"] = False
        d["soz"] = "Ek turu bitmedi."
        return d
    t["kenar"] = kenar
    try:
        kay = 0 if kayma in (None, "") else _tam(kayma, "kayma")
    except ValueError as e:
        d["hazir"] = False
        d["soz"] = str(e)
        return d
    if kay < 0:
        kay = 0
    uz = _kenar_uzun(d, kenar)
    if t["en"] + kay > uz:
        kay = max(0, uz - int(t["en"]))
    t["kayma"] = kay
    hata = _siger(d, t)
    if hata:
        d["hazir"] = False
        d["soz"] = hata
        return d
    d["ekler"].append(t)
    d["taslak"] = {}
    d["tur"] = "ek_var"
    d["cumle"] = CUMLE["ek_var"]
    d["hazir"] = True
    return _alan_yaz(d)


def ek_yapistir(durum: dict | None, x: Any, z: Any) -> dict:
    """Sürükle-bırak: en yakın kenara mıknatıs."""
    d = _kopya(durum)
    if d["kilit"] or d["tur"] != "ek_kenar":
        d["hazir"] = False
        d["soz"] = "Önce ek ölçü."
        return d
    try:
        kenar = _yakin_kenar(d, _tam(x, "x"), _tam(z, "z"))
    except ValueError as e:
        d["hazir"] = False
        d["soz"] = str(e)
        return d
    d["soz"] = f"{kenar} kenara yapıştı."
    kay = _kayma_birak(d, kenar, _tam(x, "x"), _tam(z, "z"))
    son = ek_kenar_yaz(d, kenar, kay)
    if son["hazir"] and d["soz"]:
        son["soz"] = d["soz"]
    return son


def hizala(durum: dict, tip: str, x: Any, z: Any, eski: dict | None = None) -> dict:
    o = durum["oda"]
    en, boy = o["en"], o["boy"]
    g: dict[str, Any] = {"tip": tip, "x": 0, "z": 0, "en": 300, "boy": 300, "p": {}}
    if eski and eski.get("p"):
        g["p"] = dict(eski["p"])
    xx, zz = _tam(x, "x"), _tam(z, "z")
    if tip == "oda_zemin":
        g["p"]["en"] = int(g["p"].get("en") or en)
        g["p"]["boy"] = int(g["p"].get("boy") or boy)
        g["en"] = min(g["p"]["en"], en)
        g["boy"] = min(g["p"]["boy"], boy)
        g["x"] = min(en - g["en"], max(0, _snap(xx - g["en"] // 2)))
        g["z"] = min(boy - g["boy"], max(0, _snap(zz - g["boy"] // 2)))
        return g
    if tip == "kapi":
        g["p"].setdefault("en", 900)
        g["p"].setdefault("boy", 2100)
        g["p"].setdefault("kasa", 18)
        g["en"], g["boy"] = int(g["p"]["en"]), min(80, en)
    elif tip == "yukselti":
        g["p"].setdefault("derinlik", 600)
        g["p"].setdefault("yukseklik", 40)
        g["p"].setdefault("uzunluk", 600)
        g["en"], g["boy"] = int(g["p"]["uzunluk"]), int(g["p"]["derinlik"])
    elif tip == "mermer":
        g["p"].setdefault("ayak_arasi", 620)
        g["p"].setdefault("ayak_kalinlik", 20)
        g["p"].setdefault("ayak_yukseklik", 880)
        g["p"].setdefault("mermer_kalinlik", 20)
        g["en"], g["boy"] = int(g["p"]["ayak_arasi"]), 400
    else:
        g["p"].setdefault("en", 300)
        g["p"].setdefault("boy", 300)
        g["en"], g["boy"] = int(g["p"]["en"]), int(g["p"]["boy"])
    g["x"] = min(max(0, _snap(xx)), max(0, en - g["en"]))
    g["z"] = min(max(0, _snap(zz)), max(0, boy - g["boy"]))
    return g


def nesne_birak(durum: dict | None, tip: str, x: Any, z: Any) -> dict:
    d = _kopya(durum)
    d["soz"] = ""
    if d["kilit"]:
        d["hazir"] = False
        d["soz"] = "Zemin mühürlü."
        return d
    if d["tur"] != "birak" or not _kabuk_tam(d):
        d["hazir"] = False
        d["soz"] = "Önce oda ve ek parça turu."
        return d
    if tip not in TIPLER:
        d["hazir"] = False
        d["soz"] = "Bu gereç zeminde yok."
        return d
    try:
        g = hizala(d, tip, x, z)
    except ValueError as e:
        d["hazir"] = False
        d["soz"] = str(e)
        return d
    eski_x, eski_z = _tam(x, "x"), _tam(z, "z")
    if g["x"] != eski_x or g["z"] != eski_z:
        d["soz"] = f"{SNAP_MM} mm kaydırdım."
    if tip == "oda_zemin":
        d["yerlesim"] = [it for it in d["yerlesim"] if it.get("tip") != "oda_zemin"]
    d["yerlesim"].append(g)
    d["hazir"] = True
    return d


def muhur(durum: dict | None) -> dict:
    """Kabuk + ek turu bitsin yeter; gereç bırakmak şart değil."""
    d = _kopya(durum)
    d["soz"] = ""
    if not _kabuk_tam(d) or d["tur"] != "birak":
        d["hazir"] = False
        d["soz"] = "Oda turu bitmedi."
        return d
    d["kilit"] = True
    d["hazir"] = True
    d["cumle"] = CUMLE["kilit"]
    return _alan_yaz(d)
