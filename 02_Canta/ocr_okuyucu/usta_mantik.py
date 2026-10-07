"""OCR sonrası usta mantığı: ondalık kaydırma, rakam bağlamı, mobilya standartları."""

from __future__ import annotations

import re
from collections import Counter
from typing import Any

from hata_kayit import BORU_HATTI, hata_yaz
from ogrenme_kurallari import kurallari_yukle

OLCU_TOKEN = re.compile(
    r"(?P<boy>\d+(?:[.,]\d+)?)\s*[xX×*]\s*(?P<en>\d+(?:[.,]\d+)?)"
    r"(?:\s*[xX×*]\s*(?P<kalinlik>\d+(?:[.,]\d+)?))?"
)
TEK_SAYI = re.compile(r"^(?P<tam>\d{1,5})(?:[.,](?P<kesir>\d{1,2}))?$")

# El yazısı: 1-4-7 birbirine; 6 sık 8/0 ile karışır.
KARIŞAN = {
    "1": ("4", "7"),
    "4": ("1", "7"),
    "7": ("1", "4"),
    "6": ("8", "0"),
}

VARSAYILAN_DERINLIK = (300.0, 320.0, 350.0, 400.0, 450.0, 500.0, 520.0, 550.0, 560.0, 580.0, 600.0, 650.0)
VARSAYILAN_BOY = (400.0, 450.0, 500.0, 600.0, 720.0, 800.0, 900.0, 1000.0, 1200.0, 1600.0, 1800.0, 2000.0, 2100.0, 2400.0)
KAPAK_BOSLUK = (1.0, 2.0, 3.0, 4.0, 5.0, 6.0)
RAF_ARALIK = 32.0
NET_GUVEN = 0.82

BANT_KOD_BOS = "0-0-0-0"
_ACIK_BANT_KOD = re.compile(r"\b([01](?:-[01]){3})\b")
_BANT_OLCU = re.compile(
    r"(?P<boy_nokta>[.·•∙˙]{0,2})\s*(?P<boy>\d+(?:[.,]\d+)?)"
    r"\s*[xX×*]\s*"
    r"(?P<en_nokta>[.·•∙˙]{0,2})\s*(?P<en>\d+(?:[.,]\d+)?)"
)
_EK_NOKTA_SAYI = re.compile(r"([.·•∙˙]{1,2})\s*(\d+(?:[.,]\d+)?)")
_KUTU_ISARET = re.compile(r"[□■▢▣▭▯◻◼☐⬛⬜]")
_TABLO_BORU = re.compile(r"^\s*[|│Iİl]\s+\d{1,3}\s*$")
_ADET_GOVDE = re.compile(
    r"^\s*(?:[xX×*]\s*)?(?:adet|ad\.?)?\s*[:\-]?\s*\d{1,3}\b\s*",
    re.IGNORECASE,
)
_ESIT_ARA = re.compile(r"^\s*[=＝]\s*\d{1,3}\s*$")
_CIFT_DIKEY = re.compile(r"\|\||│{2}|∥|‖|Ⅱ|\b(?:II|ll|İİ)\b")
_TEK_DIKEY = re.compile(r"[|│Iİɪ]")
_L_KOSE = re.compile(r"[└⌞∟┗]|L\b|\|[_—–―]|/_")
_CIFT_YATAY = re.compile(r"^(?:[=＝≡]{1,2}|═+|══+|——+|––+|──+)$")


def _ascii_katla(metin: str) -> str:
    tablo = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocIGUSOC")
    return str(metin or "").translate(tablo).lower()


def _kenar_bitleri(uzun: int, kisa: int) -> str:
    u = min(2, max(0, int(uzun)))
    k = min(2, max(0, int(kisa)))
    return (
        f"{1 if u >= 1 else 0}-{1 if u >= 2 else 0}-"
        f"{1 if k >= 1 else 0}-{1 if k >= 2 else 0}"
    )


def kod_boy_en(kod: str) -> tuple[int, int]:
    parca = str(kod or BANT_KOD_BOS).replace("/", "-").replace("_", "-").split("-")
    u = (parca + ["0", "0", "0", "0"])[:4]
    boy = (1 if u[0] == "1" else 0) + (1 if u[1] == "1" else 0)
    en = (1 if u[2] == "1" else 0) + (1 if u[3] == "1" else 0)
    return boy, en


def bant_sema(kod: str) -> str:
    boy, en = kod_boy_en(kod)
    if boy == 0 and en == 0:
        return "Bantsız (0)"
    if boy == 2 and en == 2:
        return "4 Taraf / Tam Bant"
    if boy and en:
        return f"{boy} Boy + {en} En bant"
    if boy:
        return f"{boy} Boy bant"
    return f"{en} En bant"


def _yatay_adet(metin: str) -> int:
    """Em/en tire ve çift çizgi; tek ASCII '=' bant değildir."""
    n = len(re.findall(r"—|–|―|━|─", metin))
    n += 2 * len(re.findall(r"══+|──+", metin))
    n += 2 * len(re.findall(r"(?<![-])--(?![-])", metin))
    return min(2, n)


def _sembol_adet_sonrasi(sonek: str) -> tuple[str, bool, bool]:
    """Adet sonrası sağ sütun. (sembol, adet_alindi, esit_ayirici)."""
    s = (sonek or "").strip()
    if not s:
        return "", False, False
    if _TABLO_BORU.match(s) or _ESIT_ARA.match(s):
        return "", True, True
    adet_alindi = False
    govde = _ADET_GOVDE.match(s)
    if govde:
        s = s[govde.end():].strip()
        adet_alindi = True
    return s, adet_alindi, False


def _sag_boy_en(sembol: str) -> tuple[int, int]:
    """Sağ sütun: I=1 boy, L=1+1, C=1+2, ||=2 boy, ==2 en, □=4, boş/orta çizgi=0."""
    s = (sembol or "").strip()
    if not s:
        return 0, 0
    kat = _ascii_katla(s)
    if _KUTU_ISARET.search(s) or re.search(r"\[\s*\]|口", s):
        return 2, 2
    if re.search(r"\b[cCuUeE]\b", s) or s.strip() in {"C", "c", "U", "u", "E", "e", "[", "⊂", "⊏", "⌈", "⌊"}:
        return 1, 2
    if re.search(r"\bL\b", s) or any(ch in s for ch in "└⌞∟┗"):
        return 1, 1
    if _L_KOSE.search(s) and not _CIFT_DIKEY.search(s):
        yatay = _yatay_adet(s)
        if yatay or re.search(r"\bL\b", s) or any(ch in s for ch in "└⌞∟┗"):
            return 1, max(1, yatay)
    if _CIFT_DIKEY.search(s):
        return 2, _yatay_adet(s)
    sade = re.sub(r"^[-:/\s]+", "", s).strip()
    if not sade:
        return 0, 0
    if re.fullmatch(r"[lIİıi|│1]", sade):
        return 1, 0
    yalin = re.sub(r"\s+", "", s)
    if _CIFT_YATAY.fullmatch(yalin):
        return 0, 2
    yatay = _yatay_adet(s)
    dikey = len(_TEK_DIKEY.findall(s))
    if re.search(r"(?:^|[\s])[Iİıi](?:[\s]|$)", s) and dikey == 0:
        dikey = 1
    if re.fullmatch(r"[lIİıi|│]", s):
        dikey = max(dikey, 1)
        yatay = 0
    if dikey == 0 and yatay == 0 and "l" in kat and len(s) <= 2 and "ll" not in kat:
        if s.strip() in "lIİıi|│":
            dikey = 1
    return min(2, dikey), min(2, yatay)


def bant_okuma(metin: str) -> dict[str, Any]:
    """Nokta + adet-sonrası sembol. Emin değilse kod 0, emin=False (tahmin yok)."""
    ham = str(metin or "")
    bos = {"kod": BANT_KOD_BOS, "emin": True, "neden": ""}
    if not ham.strip():
        return dict(bos)
    kat = _ascii_katla(ham)
    if re.search(r"bants[iı]z|bantsiz|cumbas[iı]z|kenars[iı]z|bant\s*yok", kat):
        return dict(bos)
    acik = _ACIK_BANT_KOD.search(ham)
    if acik:
        return {"kod": acik.group(1), "emin": True, "neden": ""}
    if _KUTU_ISARET.search(ham) or re.search(
        r"cerceve|tam\s*kutu|tam\s*cerceve|dort\s*kenar|4\s*kenar|full\s*box",
        kat,
    ):
        return {"kod": "1-1-1-1", "emin": True, "neden": ""}
    if re.search(r"uc\s*kenar|3\s*kenar|c\s*sekli|u\s*sekli|c\s*/\s*u|\bu\s+sekil|\bc\s+sekil", kat):
        return {"kod": "1-0-1-1", "emin": True, "neden": ""}
    if re.search(r"l\s*sekli|el\s*sekli|l\s*sekil", kat):
        return {"kod": "1-0-1-0", "emin": True, "neden": ""}

    uzun = 0
    kisa = 0
    emin = True
    neden = ""
    if re.search(r"cift\s*nokta|iki\s*nokta|2\s*nokta|cift\s*kenar|iki\s*kenar|cift\s*uzun", kat):
        uzun = max(uzun, 2)
    if re.search(r"tek\s*nokta|1\s*nokta|tek\s*kenar|1\s*kenar", kat):
        uzun = max(uzun, 1)
    if re.search(r"iki\s*en|2\s*en|cift\s*en", kat):
        kisa = max(kisa, 2)

    olcu = None
    for eslesme in _BANT_OLCU.finditer(ham):
        olcu = eslesme
        uzun = max(uzun, min(2, len(eslesme.group("boy_nokta") or "")))
        kisa = max(kisa, min(2, len(eslesme.group("en_nokta") or "")))
    if olcu:
        sonra = ham[olcu.end():]
        for ek in _EK_NOKTA_SAYI.finditer(sonra):
            try:
                sayi = float(ek.group(2).replace(",", "."))
            except ValueError:
                continue
            if sayi < 50:
                continue
            kisa = max(kisa, min(2, len(ek.group(1))))
        sembol, adet_ok, esit_ara = _sembol_adet_sonrasi(sonra)
        if esit_ara:
            sag_boy, sag_en = 0, 0
        else:
            yalin = re.sub(r"\s+", "", sembol)
            if _CIFT_YATAY.fullmatch(yalin) and not adet_ok:
                sag_boy, sag_en = 0, 0
                emin = False
                neden = "eşittir belirsiz; adet sonrası değil"
            else:
                sag_boy, sag_en = _sag_boy_en(sembol)
        uzun = max(uzun, sag_boy)
        kisa = max(kisa, sag_en)
    else:
        sag_boy, sag_en = _sag_boy_en(ham.strip())
        uzun = max(uzun, sag_boy)
        kisa = max(kisa, sag_en)

    kod = BANT_KOD_BOS if uzun == 0 and kisa == 0 else _kenar_bitleri(uzun, kisa)
    return {"kod": kod, "emin": emin, "neden": neden}


def bant_sozlugu_kod(metin: str) -> str:
    """Tek bant sözlüğü: nokta + adet sonrası sembol. İşaret yoksa 0-0-0-0."""
    return str(bant_okuma(metin).get("kod") or BANT_KOD_BOS)


def _ust_sinir() -> float:
    return float(kurallari_yukle().get("cm_mm_ust_sinir") or 350)


def _derinlikler() -> tuple[float, ...]:
    ham = kurallari_yukle().get("standart_derinlikler")
    if isinstance(ham, list) and ham:
        sayilar = []
        for oge in ham:
            try:
                sayilar.append(float(oge))
            except (TypeError, ValueError):
                continue
        if sayilar:
            return tuple(sayilar)
    return VARSAYILAN_DERINLIK


def _tolerans() -> float:
    return float(kurallari_yukle().get("usta_olcu_tolerans_mm") or 3.0)


def token_mm(token: str, ust: float | None = None) -> float | None:
    """Kesirli cm'yi float*10 ile değil basamak kaydırarak mm yapar (69.4 → 694)."""
    ham = re.sub(r"\s+", "", (token or "").strip())
    if not ham:
        return None
    ham = re.sub(r"[.,]{2,}", ".", ham)
    if ham.count(".") + ham.count(",") > 1:
        parca = re.match(r"^(\d+[.,]\d{1,2})", ham)
        if not parca:
            return None
        ham = parca.group(1)
    ham = ham.replace(",", ".")
    eslesme = TEK_SAYI.match(ham)
    if not eslesme:
        return None
    tam = int(eslesme.group("tam"))
    kesir = eslesme.group("kesir")
    sinir = _ust_sinir() if ust is None else float(ust)
    if kesir is None:
        if 10 <= tam < sinir:
            return float(tam * 10)
        return float(tam)
    # Zaten mm: 560.0 / 1546.5 — çarpma yok
    if tam >= sinir:
        if kesir.strip("0") == "":
            return float(tam)
        return float(f"{tam}.{kesir}")
    # Cm: 69.4 → 694, 49.8 → 498, 69.45 → 694.5
    if len(kesir) == 1:
        return float(tam * 10 + int(kesir))
    return float(tam * 10) + int(kesir) / (10 ** (len(kesir) - 1))


def cm_mm_guvenli(deger: float, ham: str | None = None) -> float:
    if ham:
        okunan = token_mm(ham)
        if okunan is not None:
            return okunan
    if deger < 0:
        return deger
    if deger != int(deger):
        if abs(deger * 10 - round(deger * 10)) < 1e-6:
            yazi = f"{deger:.1f}"
        else:
            yazi = f"{deger:.2f}".rstrip("0").rstrip(".")
        okunan = token_mm(yazi)
        if okunan is not None:
            return okunan
    ust = _ust_sinir()
    if 10 <= deger < ust:
        return float(int(deger) * 10)
    return float(deger)


def sayfa_rakam_frekansi(parcalar: list[dict[str, Any]]) -> Counter[str]:
    sayac: Counter[str] = Counter()
    for parca in parcalar:
        if not isinstance(parca, dict):
            continue
        try:
            guven = float(parca.get("guven") or 0)
        except (TypeError, ValueError):
            guven = 0.0
        if guven < NET_GUVEN and parca.get("supheli"):
            continue
        kaynak = str(parca.get("ham_metin") or parca.get("not") or "")
        for ch in kaynak:
            if ch.isdigit():
                sayac[ch] += 1
    return sayac


def _kardes_olculer(parca: dict[str, Any], liste: list[dict[str, Any]], alan: str) -> list[float]:
    modul = str(parca.get("modul_kodu") or "")
    ad = str(parca.get("parca_adi") or "").lower()
    kat = str(parca.get("kategori") or "").lower()
    degerler: list[float] = []
    for diger in liste:
        if diger is parca or not isinstance(diger, dict):
            continue
        if str(diger.get("modul_kodu") or "") != modul:
            continue
        try:
            sayi = float(diger.get(alan))
        except (TypeError, ValueError):
            continue
        degerler.append(sayi)
        da = str(diger.get("parca_adi") or "").lower()
        dk = str(diger.get("kategori") or "").lower()
        if any(k in ad for k in ("dikme", "gövde", "govde")) and any(k in da for k in ("dikme", "gövde", "govde")):
            degerler.append(sayi)
        if "kapak" in ad and ("dikme" in da or "gövde" in da or "govde" in da or dk == "gövde"):
            degerler.append(sayi)
        if "raf" in ad and "raf" in da:
            degerler.append(sayi)
        if kat and kat == dk:
            degerler.append(sayi)
    return degerler


def _standart_kume(parca: dict[str, Any]) -> tuple[float, ...]:
    ad = str(parca.get("parca_adi") or "").lower()
    kat = str(parca.get("kategori") or "").lower()
    derinlik = _derinlikler()
    if any(k in ad for k in ("kapak", "klapa")):
        return VARSAYILAN_BOY + derinlik
    if "arkalık" in ad or "arkalik" in ad or kat == "arkalık":
        return VARSAYILAN_BOY + derinlik
    return derinlik + VARSAYILAN_BOY


def _en_yakin(mm: float, kume: tuple[float, ...], tolerans: float) -> float | None:
    if not kume:
        return None
    aday = min(kume, key=lambda s: abs(s - mm))
    if abs(aday - mm) <= tolerans:
        return aday
    return None


def _uyum_skoru(mm: float, parca: dict[str, Any], kardes: list[float], frekans: Counter[str]) -> float:
    skor = 0.0
    yazi = str(int(round(mm)))
    toplam = sum(frekans.values()) or 1
    skor += sum(frekans.get(ch, 0) for ch in yazi) / toplam
    std = _en_yakin(mm, _standart_kume(parca), max(_tolerans(), 8.0))
    if std is not None:
        skor += 2.5 - min(2.5, abs(std - mm) / 4.0)
    for k in kardes:
        fark = abs(k - mm)
        if fark <= 2:
            skor += 4.0
        elif fark in KAPAK_BOSLUK or 1 <= fark <= 6:
            skor += 2.5
        elif fark <= 20:
            skor += 0.3
    if 80 <= mm <= 2800:
        skor += 0.5
    if mm < 30 or mm > 4200:
        skor -= 2.0
    return skor


def _alternatifler(mm: float) -> list[float]:
    if mm <= 0 or not (mm == int(mm) or abs(mm - round(mm)) < 1e-6):
        yazi = str(int(round(mm))) if mm == int(mm) else f"{mm:.1f}".replace(".", "")
    else:
        yazi = str(int(round(mm)))
    if not yazi.isdigit() or len(yazi) > 5:
        return []
    adaylar: list[float] = []
    for i, ch in enumerate(yazi):
        for alt in KARIŞAN.get(ch, ()):
            yeni = yazi[:i] + alt + yazi[i + 1 :]
            if yeni == yazi or yeni.startswith("0"):
                continue
            adaylar.append(float(yeni))
    return adaylar


def _suphe_yaz(parca: dict[str, Any], neden: str, seviye: str = "sari") -> None:
    if parca.get("hafiza_vurus"):
        return
    parca["supheli"] = True
    parca["suphe_neden"] = neden
    parca["suphe_seviye"] = seviye


def _alani_duzelt(
    parca: dict[str, Any],
    alan: str,
    liste: list[dict[str, Any]],
    frekans: Counter[str],
) -> None:
    if parca.get("hafiza_vurus"):
        return
    try:
        guven = float(parca.get("guven") or 0)
    except (TypeError, ValueError):
        guven = 0.0
    if guven >= NET_GUVEN and not parca.get("supheli"):
        return
    try:
        mm = float(parca.get(alan))
    except (TypeError, ValueError):
        return
    kardes = _kardes_olculer(parca, liste, alan)
    temel = _uyum_skoru(mm, parca, kardes, frekans)
    en_iyi = mm
    en_skor = temel
    for aday in _alternatifler(mm):
        skor = _uyum_skoru(aday, parca, kardes, frekans)
        if skor > en_skor + 1.2:
            en_skor = skor
            en_iyi = aday
    if en_iyi != mm:
        _suphe_yaz(parca, "Rakam belirsiz; tahmin yok, usta onayı.")


def _ondalik_yeniden(parca: dict[str, Any]) -> None:
    if parca.get("hafiza_vurus"):
        return
    kaynak = str(parca.get("ham_metin") or parca.get("not") or "")
    olcu = OLCU_TOKEN.search(kaynak)
    if not olcu:
        return
    boy = token_mm(olcu.group("boy"))
    en = token_mm(olcu.group("en"))
    if boy is not None:
        parca["uzunluk_mm"] = boy
    if en is not None:
        parca["genislik_mm"] = en
    kalinlik_ham = olcu.group("kalinlik")
    if kalinlik_ham:
        kalinlik = token_mm(kalinlik_ham)
        if kalinlik is not None and kalinlik <= 40:
            parca["kalinlik_mm"] = kalinlik


def _mobilya_alan(parca: dict[str, Any], alan: str) -> None:
    if parca.get("hafiza_vurus"):
        return
    try:
        mm = float(parca.get(alan))
    except (TypeError, ValueError):
        return
    try:
        guven = float(parca.get("guven") or 0)
    except (TypeError, ValueError):
        guven = 0.0
    ad = str(parca.get("parca_adi") or "").lower()
    kume = _derinlikler() if alan == "genislik_mm" or "raf" in ad else _standart_kume(parca)
    yakin = _en_yakin(mm, kume, _tolerans())
    if yakin is None or yakin == mm:
        return
    if alan == "uzunluk_mm" and any(k in ad for k in ("kapak", "klapa")) and 1 <= (yakin - mm) <= 6:
        return
    if guven >= NET_GUVEN and not parca.get("supheli"):
        return
    _suphe_yaz(parca, "Ölçü standarta yakın ama emin değil; tahmin yok.")


def _adi(parca: dict[str, Any]) -> str:
    return str(parca.get("parca_adi") or "").lower()


def _kapak_bosluk_hizala(liste: list[dict[str, Any]]) -> None:
    by_modul: dict[str, list[dict[str, Any]]] = {}
    for parca in liste:
        by_modul.setdefault(str(parca.get("modul_kodu") or "GENEL"), []).append(parca)
    for grup in by_modul.values():
        dikmeler = [p for p in grup if "dikme" in _adi(p)]
        kapaklar = [p for p in grup if "kapak" in _adi(p)]
        raflar = [p for p in grup if "raf" in _adi(p)]
        boylar: list[float] = []
        derinlikler: list[float] = []
        for d in dikmeler:
            try:
                boylar.append(float(d.get("uzunluk_mm")))
                derinlikler.append(float(d.get("genislik_mm")))
            except (TypeError, ValueError):
                continue
        if boylar:
            hedef_boy = max(set(boylar), key=boylar.count)
            for kapak in kapaklar:
                try:
                    kb = float(kapak.get("uzunluk_mm"))
                except (TypeError, ValueError):
                    continue
                fark = hedef_boy - kb
                if 1 <= fark <= 6:
                    continue
                if abs(kb - hedef_boy) > 50:
                    _suphe_yaz(kapak, "Kapak boyu dikmeyle uyumsuz; tahmin yok.")
        if derinlikler:
            hedef_d = max(set(derinlikler), key=derinlikler.count)
            yakin_std = _en_yakin(hedef_d, _derinlikler(), _tolerans()) or hedef_d
            for raf in raflar:
                try:
                    rd = float(raf.get("genislik_mm"))
                except (TypeError, ValueError):
                    continue
                if abs(rd - yakin_std) <= _tolerans() and rd != yakin_std:
                    _suphe_yaz(raf, "Raf derinliği belirsiz; tahmin yok.")
                elif abs(rd - (yakin_std - 20)) <= _tolerans() and rd != (yakin_std - 20):
                    _suphe_yaz(raf, "Raf derinliği belirsiz; tahmin yok.")
            for d in dikmeler:
                try:
                    dd = float(d.get("genislik_mm"))
                except (TypeError, ValueError):
                    continue
                if abs(dd - yakin_std) <= _tolerans() and dd != yakin_std:
                    _suphe_yaz(d, "Dikme derinliği belirsiz; tahmin yok.")


def _raf_araligi(liste: list[dict[str, Any]]) -> None:
    raflar = [p for p in liste if "raf" in str(p.get("parca_adi") or "").lower()]
    if len(raflar) < 2:
        return
    boylar: list[tuple[dict[str, Any], float]] = []
    for raf in raflar:
        try:
            boylar.append((raf, float(raf.get("uzunluk_mm"))))
        except (TypeError, ValueError):
            continue
    boylar.sort(key=lambda x: x[1])
    for i in range(1, len(boylar)):
        once, sonra = boylar[i - 1][1], boylar[i][1]
        fark = sonra - once
        if fark <= 0:
            continue
        kademe = round(fark / RAF_ARALIK) * RAF_ARALIK
        if kademe >= RAF_ARALIK and abs(fark - kademe) <= _tolerans():
            hedef = once + kademe
            if hedef != sonra:
                _suphe_yaz(boylar[i][0], "Raf aralığı belirsiz; tahmin yok.")


def ustayi_uygula(parcalar: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sayfa bağlamı + mobilya mantığı; hata olursa orijinal listeyi bırakır."""
    if not isinstance(parcalar, list) or not parcalar:
        return parcalar
    try:
        kopya = [dict(p) for p in parcalar if isinstance(p, dict)]
        if not kopya:
            return parcalar
        for parca in kopya:
            _ondalik_yeniden(parca)
        frekans = sayfa_rakam_frekansi(kopya)
        for parca in kopya:
            _alani_duzelt(parca, "uzunluk_mm", kopya, frekans)
            _alani_duzelt(parca, "genislik_mm", kopya, frekans)
            _mobilya_alan(parca, "genislik_mm")
            _mobilya_alan(parca, "uzunluk_mm")
        _kapak_bosluk_hizala(kopya)
        _raf_araligi(kopya)
        return kopya
    except Exception as hata:
        hata_yaz(BORU_HATTI, "Usta mantığı katmanı düştü, ham OCR korundu", hata)
        return parcalar


def kesim_hamini_duzelt(ham: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(ham, dict):
        return ham
    liste = ham.get("kesim_listesi")
    if not isinstance(liste, list):
        return ham
    duzeltilmis = ustayi_uygula(liste)
    ham = dict(ham)
    ham["kesim_listesi"] = duzeltilmis
    if any(isinstance(p, dict) and p.get("supheli") for p in duzeltilmis):
        notlar = list(ham.get("genel_notlar") or []) if isinstance(ham.get("genel_notlar"), list) else []
        mesaj = "Şüpheli ölçü/bant tahmin edilmedi; usta onayı bekleniyor."
        if mesaj not in notlar:
            notlar.append(mesaj)
        ham["genel_notlar"] = notlar
    return ham
