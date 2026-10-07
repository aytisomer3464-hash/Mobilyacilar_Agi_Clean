"""Duvar AABB motoru. OCR, ebatlama ve elle_olcu import etmez."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

BOY_MIN, BOY_MAKS = 1, 12000
YUK_MIN, YUK_MAKS = 1, 4000
TIPLER = frozenset(
    "priz su pencere kiris kolon gaz kapi radiator hava pimas sayac nis".split()
)
STANDART = {
    "kapi": {"en": 900, "boy": 2100, "alt": 0, "yasak_pay_mm": 0, "sinif": "void"},
    "pencere": {"en": 1200, "boy": 1400, "alt": 900, "yasak_pay_mm": 0, "sinif": "void"},
    "priz": {"en": 80, "boy": 80, "alt": 300, "yasak_pay_mm": 0, "sinif": "cephe"},
    "su": {"en": 80, "boy": 80, "alt": 500, "yasak_pay_mm": 0, "sinif": "cephe"},
    "gaz": {"en": 80, "boy": 80, "alt": 300, "yasak_pay_mm": 0, "sinif": "cephe"},
    "radiator": {"en": 1000, "boy": 600, "alt": 100, "yasak_pay_mm": 0, "sinif": "cephe"},
    "hava": {"en": 300, "boy": 150, "alt": "tavan", "yasak_pay_mm": 0, "sinif": "cephe"},
    "sayac": {"en": 400, "boy": 400, "alt": 800, "yasak_pay_mm": 0, "sinif": "cephe"},
    "nis": {"en": 600, "boy": 400, "alt": 800, "yasak_pay_mm": 0, "sinif": "void"},
    "kiris": {"en": 1000, "boy": 300, "alt": "tavan", "yasak_pay_mm": 0, "sinif": "protrusion"},
    "kolon": {"en": 300, "boy": "duvar", "alt": 0, "yasak_pay_mm": 0, "sinif": "protrusion"},
    "pimas": {"en": 0, "boy": "duvar", "alt": 0, "yasak_pay_mm": 0, "sinif": "protrusion"},
}
ELEMAN_TIPLER = frozenset(STANDART)
KOSE = {"1-2": (1, 2), "2-3": (2, 3), "3-4": (3, 4), "4-1": (4, 1)}
MODUL_TIPLER = frozenset({"baza", "asma", "boy"})


def _tam(deger: Any, alan: str) -> int:
    try:
        if isinstance(deger, bool) or deger is None:
            raise ValueError
        return int(str(deger).strip().replace(",", ".").split(".")[0])
    except (TypeError, ValueError):
        raise ValueError(f"{alan} tam sayı olmalı.") from None


def kutu(sol: int, alt: int, en: int, boy: int) -> dict:
    return {"sol": sol, "alt": alt, "en": en, "boy": boy}


def cakisiyor_mu(a: dict, b: dict) -> bool:
    """İç örtüşme. Kenar değme False."""
    return (
        a["sol"] < b["sol"] + b["en"]
        and a["sol"] + a["en"] > b["sol"]
        and a["alt"] < b["alt"] + b["boy"]
        and a["alt"] + a["boy"] > b["alt"]
    )


def icinde_mi(ic: dict, dis: dict) -> bool:
    return (
        ic["sol"] >= dis["sol"]
        and ic["alt"] >= dis["alt"]
        and ic["sol"] + ic["en"] <= dis["sol"] + dis["en"]
        and ic["alt"] + ic["boy"] <= dis["alt"] + dis["boy"]
    )


def sisir(k: dict, pay: int) -> dict:
    p = max(0, pay)
    return kutu(k["sol"] - p, k["alt"] - p, k["en"] + 2 * p, k["boy"] + 2 * p)


def kes(k: dict, duvar: dict) -> dict | None:
    sol = max(k["sol"], duvar["sol"])
    alt = max(k["alt"], duvar["alt"])
    sag = min(k["sol"] + k["en"], duvar["sol"] + duvar["en"])
    ust = min(k["alt"] + k["boy"], duvar["alt"] + duvar["boy"])
    if sag <= sol or ust <= alt:
        return None
    return kutu(sol, alt, sag - sol, ust - alt)


def yasak_dilim_x(k: dict) -> tuple[int, int]:
    return (k["sol"], k["sol"] + k["en"])


def _kose_cift(kayit: dict) -> tuple[int, int] | None:
    ham = str(kayit.get("kose") or "").strip().replace(" ", "")
    return KOSE.get(ham)


def _pimas_sol(duvar_a: dict, duvar_b: dict, en: int) -> tuple[int, int]:
    return duvar_a["en"] - en, 0


def _pimas_hacim(oda: dict, kose: tuple[int, int], en: int, derinlik: int) -> list[dict]:
    oe, ob = oda["en"], oda["boy"]
    a, b = kose
    if (a, b) == (1, 2):
        return [
            {**kutu(oe - en, 0, en, derinlik), "duvar_no": 1},
            {**kutu(oe - derinlik, 0, derinlik, en), "duvar_no": 2},
        ]
    if (a, b) == (2, 3):
        return [
            {**kutu(oe - derinlik, ob - en, derinlik, en), "duvar_no": 2},
            {**kutu(oe - en, ob - derinlik, en, derinlik), "duvar_no": 3},
        ]
    if (a, b) == (3, 4):
        return [
            {**kutu(0, ob - derinlik, en, derinlik), "duvar_no": 3},
            {**kutu(0, ob - en, derinlik, en), "duvar_no": 4},
        ]
    return [
        {**kutu(0, 0, derinlik, en), "duvar_no": 4},
        {**kutu(0, 0, en, derinlik), "duvar_no": 1},
    ]


def _pts_ucgen(u: list) -> list[tuple[int, int]]:
    return [(int(p["x"]), int(p["y"])) for p in u]


def _pts_kutu(k: dict) -> list[tuple[int, int]]:
    x, y, w, h = k["sol"], k["alt"], k["en"], k["boy"]
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]


def _proj(pts: list[tuple[int, int]], ax: int, ay: int) -> tuple[int, int]:
    d = [px * ax + py * ay for px, py in pts]
    return min(d), max(d)


def _kenar_normal(pts: list[tuple[int, int]]) -> list[tuple[int, int]]:
    n = []
    m = len(pts)
    for i in range(m):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % m]
        n.append((-(y1 - y0), x1 - x0))
    return n


def _ortusur(a: list, b: list, eksenler: list) -> bool:
    for ax, ay in eksenler:
        if ax == 0 and ay == 0:
            continue
        amin, amax = _proj(a, ax, ay)
        bmin, bmax = _proj(b, ax, ay)
        if not (amax > bmin and bmax > amin):
            return False
    return True


def pah_ucgen(oda: dict, kose: tuple[int, int], bacak: int) -> list[dict]:
    """45° iç köşe üçgeni; hipotenüs oda içine bakar."""
    oe, ob = oda["en"], oda["boy"]
    s = bacak
    a, b = kose
    if (a, b) == (4, 1):
        pts = [(0, 0), (s, 0), (0, s)]
    elif (a, b) == (1, 2):
        pts = [(oe, 0), (oe - s, 0), (oe, s)]
    elif (a, b) == (2, 3):
        pts = [(oe, ob), (oe - s, ob), (oe, ob - s)]
    else:
        pts = [(0, ob), (s, ob), (0, ob - s)]
    return [{"x": x, "y": y} for x, y in pts]


def nokta_ucgende(x: int, y: int, ucgen: list) -> bool:
    p = _pts_ucgen(ucgen)
    ax, ay = p[0]
    v1x, v1y = p[1][0] - ax, p[1][1] - ay
    v2x, v2y = p[2][0] - ax, p[2][1] - ay
    den = v1x * v2y - v2x * v1y
    if den == 0:
        return False
    px, py = x - ax, y - ay
    u = (px * v2y - py * v2x) / den
    v = (py * v1x - px * v1y) / den
    return u > 0 and v > 0 and (u + v) < 1


def cakisiyor_ucgen_kutu(ucgen: list, k: dict) -> bool:
    t, b = _pts_ucgen(ucgen), _pts_kutu(k)
    return _ortusur(t, b, [(1, 0), (0, 1)] + _kenar_normal(t))


def cakisiyor_ucgen_ucgen(a: list, b: list) -> bool:
    pa, pb = _pts_ucgen(a), _pts_ucgen(b)
    return _ortusur(pa, pb, _kenar_normal(pa) + _kenar_normal(pb))


def modul_arka_mm(durum: dict | None, duvar_no: Any) -> int:
    """Duvar iç yüzünden modül arkası: o duvardaki max protrusion cikinti_mm."""
    once = durum if isinstance(durum, dict) else {}
    try:
        no = _tam(duvar_no, "Duvar no")
    except ValueError:
        return 0
    maks = 0
    for e in once.get("elemanlar") or []:
        if e.get("sinif") != "protrusion":
            continue
        nos = e.get("duvarlar") or [e.get("duvar_no")]
        if no in nos:
            maks = max(maks, int(e.get("cikinti_mm") or 0))
    return maks


def bos_durum() -> dict:
    return {"hazir": False, "duvar": None, "engeller": [], "yasak_kutular": [], "hatalar": ["Duvar yok."]}


def _cevap(duvar: dict | None, engeller: list, yasaklar: list, hatalar: list) -> dict:
    hat = list(hatalar)
    return {
        "hazir": duvar is not None and not hat,
        "duvar": deepcopy(duvar) if duvar else None,
        "engeller": deepcopy(engeller),
        "yasak_kutular": deepcopy(yasaklar),
        "hatalar": hat,
    }


def duvar_ayarla(boy_mm: Any, yukseklik_mm: Any) -> dict:
    try:
        boy = _tam(boy_mm, "Duvar boy")
        yuk = _tam(yukseklik_mm, "Duvar yükseklik")
    except ValueError as hata:
        return _cevap(None, [], [], [str(hata)])
    if boy < BOY_MIN or boy > BOY_MAKS:
        return _cevap(None, [], [], ["Duvar boy 1–12000 mm."])
    if yuk < YUK_MIN or yuk > YUK_MAKS:
        return _cevap(None, [], [], ["Duvar yükseklik 1–4000 mm."])
    return _cevap(kutu(0, 0, boy, yuk), [], [], [])


ZEMIN_MUHUR_YAZI = "Önce zemin mühürle."
MOBILYA_KAPALI_YAZI = "Mobilya aşaması kapalı."


def oda_ayarla(en_mm: Any, boy_mm: Any, yukseklik_mm: Any, zemin_kilit: Any = False) -> dict:
    """Dikdörtgen oda: zemin + 4 duvar. Zemin mühürsüz açılmaz."""
    if not zemin_kilit:
        return {
            "hazir": False,
            "oda": None,
            "zemin": None,
            "duvarlar": [],
            "elemanlar": [],
            "yasak_kutular": [],
            "pahlar": [],
            "moduller": [],
            "aktif_duvar": 1,
            "olcu_yon": "sol",
            "hazirlik_onay": False,
            "zemin_kilit": False,
            "hatalar": [ZEMIN_MUHUR_YAZI],
        }
    try:
        en = _tam(en_mm, "Oda en")
        boy = _tam(boy_mm, "Oda boy")
        yuk = _tam(yukseklik_mm, "Oda yükseklik")
    except ValueError as hata:
        return {
            "hazir": False,
            "oda": None,
            "zemin": None,
            "duvarlar": [],
            "elemanlar": [],
            "yasak_kutular": [],
            "pahlar": [],
            "moduller": [],
            "zemin_kilit": True,
            "hatalar": [str(hata)],
        }
    hatalar: list[str] = []
    if en < BOY_MIN or en > BOY_MAKS:
        hatalar.append("Oda en 1–12000 mm.")
    if boy < BOY_MIN or boy > BOY_MAKS:
        hatalar.append("Oda boy 1–12000 mm.")
    if yuk < YUK_MIN or yuk > YUK_MAKS:
        hatalar.append("Oda yükseklik 1–4000 mm.")
    if hatalar:
        return {
            "hazir": False,
            "oda": None,
            "zemin": None,
            "duvarlar": [],
            "elemanlar": [],
            "yasak_kutular": [],
            "pahlar": [],
            "moduller": [],
            "zemin_kilit": True,
            "hatalar": hatalar,
        }
    zemin = kutu(0, 0, en, boy)
    duvarlar = [
        {"no": 1, "yon": "on", "sol": 0, "alt": 0, "en": en, "boy": yuk},
        {"no": 2, "yon": "sag", "sol": 0, "alt": 0, "en": boy, "boy": yuk},
        {"no": 3, "yon": "arka", "sol": 0, "alt": 0, "en": en, "boy": yuk},
        {"no": 4, "yon": "sol", "sol": 0, "alt": 0, "en": boy, "boy": yuk},
    ]
    return {
        "hazir": True,
        "oda": {"en": en, "boy": boy, "yukseklik": yuk},
        "zemin": zemin,
        "duvarlar": duvarlar,
        "elemanlar": [],
        "yasak_kutular": [],
        "pahlar": [],
        "moduller": [],
        "aktif_duvar": 1,
        "olcu_yon": "sol",
        "hazirlik_onay": False,
        "zemin_kilit": True,
        "hatalar": [],
    }


def _oda_cevap(
    oda, zemin, duvarlar, elemanlar, yasaklar, hatalar,
    pahlar=None, moduller=None, aktif_duvar=1, olcu_yon="sol", hazirlik_onay=False,
    zemin_kilit=False,
) -> dict:
    hat = list(hatalar)
    yon = str(olcu_yon or "sol").strip().lower()
    if yon not in ("sol", "sag"):
        yon = "sol"
    try:
        aktif = int(aktif_duvar or 1)
    except (TypeError, ValueError):
        aktif = 1
    if aktif not in (1, 2, 3, 4):
        aktif = 1
    return {
        "hazir": oda is not None and not hat,
        "oda": deepcopy(oda) if oda else None,
        "zemin": deepcopy(zemin) if zemin else None,
        "duvarlar": deepcopy(duvarlar),
        "elemanlar": deepcopy(elemanlar),
        "yasak_kutular": deepcopy(yasaklar),
        "pahlar": deepcopy(list(pahlar or [])),
        "moduller": deepcopy(list(moduller or [])),
        "aktif_duvar": aktif,
        "olcu_yon": yon,
        "hazirlik_onay": bool(hazirlik_onay),
        "zemin_kilit": bool(zemin_kilit),
        "hatalar": hat,
    }


def _mm(kayit: dict, ad: str, varsayilan: int, etiket: str) -> int:
    if kayit.get(ad) in (None, ""):
        return int(varsayilan)
    return _tam(kayit.get(ad), etiket)


def oda_eleman_ekle(durum: dict | None, kayit: dict | None) -> dict:
    """Standart kapı/pencere/kiriş/kolon/priz; ölçü verilirse o geçer."""
    once = durum if isinstance(durum, dict) else {}
    oda = once.get("oda")
    zemin = once.get("zemin")
    duvarlar = list(once.get("duvarlar") or [])
    elemanlar = list(once.get("elemanlar") or [])
    yasaklar = list(once.get("yasak_kutular") or [])
    pahlar = list(once.get("pahlar") or [])
    moduller = list(once.get("moduller") or [])
    aktif = once.get("aktif_duvar") or 1
    yon = once.get("olcu_yon") or "sol"
    onay = bool(once.get("hazirlik_onay"))
    zk = bool(once.get("zemin_kilit"))

    def _c(o, z, d, el, ys, hat, ph=None, md=None, ad=None, oy=None, ho=None):
        return _oda_cevap(
            o, z, d, el, ys, hat,
            pahlar if ph is None else ph,
            moduller if md is None else md,
            aktif if ad is None else ad,
            yon if oy is None else oy,
            onay if ho is None else ho,
            zk,
        )
    if not zk:
        return _c(
            oda if isinstance(oda, dict) else None,
            zemin, duvarlar, elemanlar, yasaklar, [ZEMIN_MUHUR_YAZI],
        )
    if not isinstance(oda, dict) or not duvarlar:
        return _c(None, None, [], [], [], ["Oda yok."])
    if not isinstance(kayit, dict):
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Eleman yok."])
    tip = str(kayit.get("tip") or "").strip().lower()
    if tip not in ELEMAN_TIPLER:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Eleman tipi geçersiz."])
    if tip == "pimas":
        return _pimas_ekle(oda, zemin, duvarlar, elemanlar, yasaklar, kayit, pahlar, moduller, aktif, yon, onay, zk)
    try:
        no = _tam(kayit.get("duvar_no"), "Duvar no")
    except ValueError as hata:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, [str(hata)])
    duvar = next((d for d in duvarlar if d.get("no") == no), None)
    if duvar is None:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Duvar no 1–4."])
    std = STANDART[tip]
    cephe = kutu(0, 0, duvar["en"], duvar["boy"])
    try:
        sol = _mm(kayit, "sol", 0, "Sol")
        en = _mm(kayit, "en", std["en"], "En")
        if std["boy"] == "duvar":
            boy = duvar["boy"] if kayit.get("boy") in (None, "") else _tam(kayit.get("boy"), "Boy")
        else:
            boy = _mm(kayit, "boy", std["boy"], "Boy")
        if std["alt"] == "tavan":
            alt = duvar["boy"] - boy if kayit.get("alt") in (None, "") else _tam(kayit.get("alt"), "Alt")
        else:
            alt = _mm(kayit, "alt", std["alt"], "Alt")
        pay = _mm(kayit, "yasak_pay_mm", std["yasak_pay_mm"], "Yasak pay")
        sinif = std["sinif"]
        if sinif == "void":
            if kayit.get("cikinti_mm") not in (None, "", 0, "0"):
                cikinti = _tam(kayit.get("cikinti_mm"), "Çıkıntı")
                if cikinti != 0:
                    return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Void çıkıntı almaz."])
            cikinti = 0
        elif sinif == "protrusion":
            if kayit.get("cikinti_mm") in (None, ""):
                return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı mm zorunlu."])
            cikinti = _tam(kayit.get("cikinti_mm"), "Çıkıntı")
            if cikinti <= 0:
                return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı 0'dan büyük olmalı."])
        else:
            cikinti = 0 if kayit.get("cikinti_mm") in (None, "") else _tam(kayit.get("cikinti_mm"), "Çıkıntı")
            if cikinti < 0:
                return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı negatif olamaz."])
    except ValueError as hata:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, [str(hata)])
    if en <= 0 or boy <= 0:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["En ve boy 0'dan büyük olmalı."])
    if pay < 0:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pay negatif olamaz."])
    olcu = str(kayit.get("olcu_yon") or "").strip().lower()
    if olcu == "sag":
        sol = duvar["en"] - sol - en
    ham = kutu(sol, alt, en, boy)
    if not icinde_mi(ham, cephe):
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Eleman duvar dışına taşar."])
    yasak = kes(sisir(ham, pay), cephe)
    if yasak is None:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutu boş."])
    yasak_no = {**yasak, "duvar_no": no}
    for eski in yasaklar:
        if eski.get("duvar_no") == no and cakisiyor_mu(yasak, eski):
            return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutular çakışır."])
    kayit_e = {
        "id": f"a{len(elemanlar) + 1}",
        "duvar_no": no,
        "tip": tip,
        "sinif": sinif,
        "sol": sol,
        "alt": alt,
        "en": en,
        "boy": boy,
        "cikinti_mm": cikinti,
        "yasak_pay_mm": pay,
        "duvarlar": [no],
    }
    return _c(oda, zemin, duvarlar, elemanlar + [kayit_e], yasaklar + [yasak_no], [])


def _pimas_ekle(oda, zemin, duvarlar, elemanlar, yasaklar, kayit, pahlar, moduller, aktif=1, yon="sol", onay=False, zemin_kilit=False) -> dict:
    def _c(o, z, d, el, ys, hat, ph=None, md=None):
        return _oda_cevap(
            o, z, d, el, ys, hat,
            pahlar if ph is None else ph,
            moduller if md is None else md,
            aktif, yon, onay, zemin_kilit,
        )
    kose = _kose_cift(kayit)
    if kose is None:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Köşe 1-2, 2-3, 3-4 veya 4-1."])
    no_a, no_b = kose
    duvar_a = next((d for d in duvarlar if d.get("no") == no_a), None)
    duvar_b = next((d for d in duvarlar if d.get("no") == no_b), None)
    if duvar_a is None or duvar_b is None:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Köşe duvarı yok."])
    try:
        if kayit.get("en") in (None, ""):
            return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pimaş en zorunlu."])
        en = _tam(kayit.get("en"), "En")
        if kayit.get("cikinti_mm") in (None, ""):
            return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı mm zorunlu."])
        cikinti = _tam(kayit.get("cikinti_mm"), "Çıkıntı")
        boy = duvar_a["boy"] if kayit.get("boy") in (None, "") else _tam(kayit.get("boy"), "Boy")
        alt = 0 if kayit.get("alt") in (None, "") else _tam(kayit.get("alt"), "Alt")
        pay = _mm(kayit, "yasak_pay_mm", 0, "Yasak pay")
        if kayit.get("pah_mm") in (None, ""):
            pah = min(en, cikinti)
        else:
            pah = _tam(kayit.get("pah_mm"), "Pah")
    except ValueError as hata:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, [str(hata)])
    if en <= 0 or boy <= 0:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["En ve boy 0'dan büyük olmalı."])
    if cikinti <= 0:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı 0'dan büyük olmalı."])
    if pay < 0:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pay negatif olamaz."])
    if pah < 0:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah negatif olamaz."])
    sol_a, sol_b = _pimas_sol(duvar_a, duvar_b, en)
    if sol_a < 0 or sol_b < 0:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pimaş duvar dışına taşar."])
    cephe_a = kutu(0, 0, duvar_a["en"], duvar_a["boy"])
    cephe_b = kutu(0, 0, duvar_b["en"], duvar_b["boy"])
    ham_a = kutu(sol_a, alt, en, boy)
    ham_b = kutu(sol_b, alt, en, boy)
    if not icinde_mi(ham_a, cephe_a) or not icinde_mi(ham_b, cephe_b):
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pimaş duvar dışına taşar."])
    yasak_a = kes(sisir(ham_a, pay), cephe_a)
    yasak_b = kes(sisir(ham_b, pay), cephe_b)
    if yasak_a is None or yasak_b is None:
        return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutu boş."])
    y_a = {**yasak_a, "duvar_no": no_a}
    y_b = {**yasak_b, "duvar_no": no_b}
    for eski in yasaklar:
        if eski.get("duvar_no") == no_a and cakisiyor_mu(yasak_a, eski):
            return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutular çakışır."])
        if eski.get("duvar_no") == no_b and cakisiyor_mu(yasak_b, eski):
            return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutular çakışır."])
    ucgen = pah_ucgen(oda, kose, pah) if pah > 0 else []
    if ucgen:
        if pah > oda["en"] or pah > oda["boy"]:
            return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah oda dışına taşar."])
        for eski_p in pahlar:
            if cakisiyor_ucgen_ucgen(ucgen, eski_p["ucgen"]):
                return _c(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah çakışır."])
    kayit_e = {
        "id": f"a{len(elemanlar) + 1}",
        "duvar_no": no_a,
        "duvarlar": [no_a, no_b],
        "kose": f"{no_a}-{no_b}",
        "tip": "pimas",
        "sinif": "protrusion",
        "sol": sol_a,
        "alt": alt,
        "en": en,
        "boy": boy,
        "cikinti_mm": cikinti,
        "yasak_pay_mm": pay,
        "yasak_hacimler": _pimas_hacim(oda, kose, en, cikinti),
        "modul_arka_mm": cikinti,
        "pah_mm": pah,
        "pah_ucgen": ucgen,
    }
    yeni_pah = pahlar + ([{"kose": f"{no_a}-{no_b}", "bacak_mm": pah, "ucgen": ucgen}] if ucgen else [])
    return _c(oda, zemin, duvarlar, elemanlar + [kayit_e], yasaklar + [y_a, y_b], [], yeni_pah)


def kose_pah_ekle(durum: dict | None, kayit: dict | None) -> dict:
    once = durum if isinstance(durum, dict) else {}
    oda = once.get("oda")
    zemin = once.get("zemin")
    duvarlar = list(once.get("duvarlar") or [])
    elemanlar = list(once.get("elemanlar") or [])
    yasaklar = list(once.get("yasak_kutular") or [])
    pahlar = list(once.get("pahlar") or [])
    moduller = list(once.get("moduller") or [])
    aktif = once.get("aktif_duvar") or 1
    yon = once.get("olcu_yon") or "sol"
    onay = bool(once.get("hazirlik_onay"))
    zk = bool(once.get("zemin_kilit"))
    if not zk:
        return _oda_cevap(
            oda if isinstance(oda, dict) else None, zemin, duvarlar, elemanlar, yasaklar,
            [ZEMIN_MUHUR_YAZI], pahlar, moduller, aktif, yon, onay, False,
        )
    if not isinstance(oda, dict) or not duvarlar:
        return _oda_cevap(None, None, [], [], [], ["Oda yok."], pahlar, moduller, aktif, yon, onay, zk)
    if not isinstance(kayit, dict):
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah yok."], pahlar, moduller, aktif, yon, onay, zk)
    kose = _kose_cift(kayit)
    if kose is None:
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Köşe 1-2, 2-3, 3-4 veya 4-1."], pahlar, moduller, aktif, yon, onay, zk)
    try:
        ham = kayit.get("bacak_mm", kayit.get("pah_mm"))
        if ham in (None, ""):
            return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah mm zorunlu."], pahlar, moduller, aktif, yon, onay, zk)
        bacak = _tam(ham, "Pah")
    except ValueError as hata:
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, [str(hata)], pahlar, moduller, aktif, yon, onay, zk)
    if bacak <= 0:
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah 0'dan büyük olmalı."], pahlar, moduller, aktif, yon, onay, zk)
    if bacak > oda["en"] or bacak > oda["boy"]:
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah oda dışına taşar."], pahlar, moduller, aktif, yon, onay, zk)
    kim = f"{kose[0]}-{kose[1]}"
    if any(p.get("kose") == kim for p in pahlar):
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah çakışır."], pahlar, moduller, aktif, yon, onay, zk)
    ucgen = pah_ucgen(oda, kose, bacak)
    for eski_p in pahlar:
        if cakisiyor_ucgen_ucgen(ucgen, eski_p["ucgen"]):
            return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah çakışır."], pahlar, moduller, aktif, yon, onay, zk)
    kayit_p = {"kose": kim, "bacak_mm": bacak, "ucgen": ucgen}
    return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar + [kayit_p], moduller, aktif, yon, onay, zk)


def oda_modul_ekle(durum: dict | None, kayit: dict | None) -> dict:
    """Aşama 3 kapalı; zemin/duvar kilidi bitmeden modül yok."""
    once = durum if isinstance(durum, dict) else {}
    oda = once.get("oda")
    zemin = once.get("zemin")
    duvarlar = list(once.get("duvarlar") or [])
    elemanlar = list(once.get("elemanlar") or [])
    yasaklar = list(once.get("yasak_kutular") or [])
    pahlar = list(once.get("pahlar") or [])
    moduller = list(once.get("moduller") or [])
    aktif = once.get("aktif_duvar") or 1
    yon = once.get("olcu_yon") or "sol"
    onay = bool(once.get("hazirlik_onay"))
    zk = bool(once.get("zemin_kilit"))
    return _oda_cevap(
        oda if isinstance(oda, dict) else None, zemin, duvarlar, elemanlar, yasaklar,
        [MOBILYA_KAPALI_YAZI], pahlar, moduller, aktif, yon, onay, zk,
    )


def duvar_sec(durum: dict | None, duvar_no: Any) -> dict:
    once = durum if isinstance(durum, dict) else {}
    oda = once.get("oda")
    zemin = once.get("zemin")
    duvarlar = list(once.get("duvarlar") or [])
    elemanlar = list(once.get("elemanlar") or [])
    yasaklar = list(once.get("yasak_kutular") or [])
    pahlar = list(once.get("pahlar") or [])
    moduller = list(once.get("moduller") or [])
    yon = once.get("olcu_yon") or "sol"
    onay = bool(once.get("hazirlik_onay"))
    zk = bool(once.get("zemin_kilit"))
    if not zk:
        return _oda_cevap(
            oda if isinstance(oda, dict) else None, zemin, duvarlar, elemanlar, yasaklar,
            [ZEMIN_MUHUR_YAZI], pahlar, moduller, 1, yon, onay, False,
        )
    if not isinstance(oda, dict) or not duvarlar:
        return _oda_cevap(None, None, [], [], [], ["Oda yok."], pahlar, moduller, 1, yon, onay, zk)
    try:
        no = _tam(duvar_no, "Duvar no")
    except ValueError as hata:
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, [str(hata)], pahlar, moduller, once.get("aktif_duvar") or 1, yon, onay, zk)
    if no not in (1, 2, 3, 4):
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Duvar no 1–4."], pahlar, moduller, once.get("aktif_duvar") or 1, yon, onay, zk)
    return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, moduller, no, yon, onay, zk)


def olcu_yon_ayarla(durum: dict | None, yon: Any) -> dict:
    once = durum if isinstance(durum, dict) else {}
    oda = once.get("oda")
    zemin = once.get("zemin")
    duvarlar = list(once.get("duvarlar") or [])
    elemanlar = list(once.get("elemanlar") or [])
    yasaklar = list(once.get("yasak_kutular") or [])
    pahlar = list(once.get("pahlar") or [])
    moduller = list(once.get("moduller") or [])
    aktif = once.get("aktif_duvar") or 1
    onay = bool(once.get("hazirlik_onay"))
    zk = bool(once.get("zemin_kilit"))
    if not zk:
        return _oda_cevap(
            oda if isinstance(oda, dict) else None, zemin, duvarlar, elemanlar, yasaklar,
            [ZEMIN_MUHUR_YAZI], pahlar, moduller, aktif, "sol", onay, False,
        )
    if not isinstance(oda, dict) or not duvarlar:
        return _oda_cevap(None, None, [], [], [], ["Oda yok."], pahlar, moduller, aktif, "sol", onay, zk)
    ham = str(yon or "").strip().lower()
    if ham not in ("sol", "sag"):
        return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Ölçü yönü sol veya sağ."], pahlar, moduller, aktif, once.get("olcu_yon") or "sol", onay, zk)
    return _oda_cevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, moduller, aktif, ham, onay, zk)


def oda_hazirlik_onayla(durum: dict | None) -> dict:
    once = durum if isinstance(durum, dict) else {}
    oda = once.get("oda")
    zemin = once.get("zemin")
    duvarlar = list(once.get("duvarlar") or [])
    elemanlar = list(once.get("elemanlar") or [])
    yasaklar = list(once.get("yasak_kutular") or [])
    pahlar = list(once.get("pahlar") or [])
    zk = bool(once.get("zemin_kilit"))
    if not zk:
        return _oda_cevap(
            oda if isinstance(oda, dict) else None, zemin, duvarlar, elemanlar, yasaklar,
            [ZEMIN_MUHUR_YAZI], pahlar, [], once.get("aktif_duvar") or 1, once.get("olcu_yon") or "sol", False, False,
        )
    if not isinstance(oda, dict) or not duvarlar:
        return _oda_cevap(None, None, [], [], [], ["Oda yok."], zemin_kilit=zk)
    return _oda_cevap(
        oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, [],
        once.get("aktif_duvar") or 1, once.get("olcu_yon") or "sol", True, zk,
    )


def _engel_kutu(engel: dict) -> dict:
    sol = _tam(engel.get("sol"), "Engel sol")
    alt = _tam(engel.get("alt"), "Engel alt")
    en = _tam(engel.get("en"), "Engel en")
    boy = _tam(engel.get("boy"), "Engel boy")
    if en <= 0 or boy <= 0:
        raise ValueError("Engel en ve boy 0'dan büyük olmalı.")
    return kutu(sol, alt, en, boy)


def engel_ekle(durum: dict | None, engel: dict | None) -> dict:
    once = durum if isinstance(durum, dict) else bos_durum()
    duvar = once.get("duvar")
    engeller = list(once.get("engeller") or [])
    yasaklar = list(once.get("yasak_kutular") or [])
    if not isinstance(duvar, dict):
        return _cevap(None, engeller, yasaklar, ["Duvar yok."])
    if not isinstance(engel, dict):
        return _cevap(duvar, engeller, yasaklar, ["Engel yok."])
    tip = str(engel.get("tip") or "").strip().lower()
    if tip not in TIPLER:
        return _cevap(duvar, engeller, yasaklar, ["Engel tipi geçersiz."])
    try:
        ham = _engel_kutu(engel)
        pay = _tam(engel.get("yasak_pay_mm", 0), "Yasak pay")
        cikinti = _tam(engel.get("cikinti_mm", 0), "Çıkıntı")
    except ValueError as hata:
        return _cevap(duvar, engeller, yasaklar, [str(hata)])
    if pay < 0 or cikinti < 0:
        return _cevap(duvar, engeller, yasaklar, ["Pay ve çıkıntı negatif olamaz."])
    if not icinde_mi(ham, duvar):
        return _cevap(duvar, engeller, yasaklar, ["Engel duvar dışına taşar."])
    yasak = kes(sisir(ham, pay), duvar)
    if yasak is None:
        return _cevap(duvar, engeller, yasaklar, ["Yasak kutu boş."])
    for eski in yasaklar:
        if cakisiyor_mu(yasak, eski):
            return _cevap(duvar, engeller, yasaklar, ["Yasak kutular çakışır."])
    kim = engel.get("id")
    kayit = {
        "id": kim if kim not in (None, "") else f"e{len(engeller) + 1}",
        "tip": tip,
        "sol": ham["sol"],
        "alt": ham["alt"],
        "en": ham["en"],
        "boy": ham["boy"],
        "cikinti_mm": cikinti,
        "yasak_pay_mm": pay,
    }
    return _cevap(duvar, engeller + [kayit], yasaklar + [yasak], [])
