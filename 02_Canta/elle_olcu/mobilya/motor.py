"""Mobilya motoru (aşama 3) hesap çekirdeği. Zemin, duvar, OCR, ebatlama import etmez.

Kaynak: Mobilya_Motor_Parametreleri.txt (v1). Gövde, kapak, raf, çekmece, arkalık, ayak, hırdavat.
Ölçü ve paylar yalnız MotorConfig'ten gelir; kodda mm cinsinden sabit yoktur.
Koddaki 0-3 arası tam sayılar ölçü değildir: panel, derz ve kapak sayısıdır
(tests/test_mobilya_motor.py bunu denetler).

Dosyadan ayrılan yerler:
- Kapak, dış değil iç ölçüden hesaplanır (karar: 2026-10-04). 600x720 dolap için 596x716.
- Dosyada formüle gömülü sayılar ayara taşındı: raf_tolerans, raf_aralik,
  tandem_pay, cekmece_taban_payi, ayak_yuksekligi, supurgelik_yuksekligi,
  supurgelik_geri, menteşe eşikleri/adetleri, kavela, minifiks, konfirmat,
  raf_aks_baslangic, raf_pimi_adet.
- Tavan/taban ile alt/üst aynı formül; çift parça çıkmasın diye yalnız alt/üst üretilir.
- Çekmece yan ve ön/arka yüksekliği dosyada yok; hesaplanmaz.
- Çekmece önü dosyadaki gibi derz kullanır; cekmece_derzi bağlı değil.
- arkalik kalınlığı ebat formülünde yok. govde_birlestir onu Y boyutu yapar.
  arkalik_derinlik hâlâ formülde yok. cekmece_derzi bu adımda yok.
- Ayak ve süpürgelikte boy, en, adet yok; parça üretilmez. Yalnız üç ayar döner.
- Kapak bindirmesi 18 mm: Blum CLIP top BLUMOTION 110° (71B3550), 0 mm plaka, delik payı 7. 18 mm levhayı tam kaplar.
- Menteşe sınırları dosyada 900 ve 1600'de çakışır; ilk `<=` eşik alınır (900→2, 1600→3).
  Bu eşik Blum adet şeması değildir. Kapak kg döner; menteşe adedi onu henüz kullanmaz.
- Kapak ağırlığı: (en / metre_mm) × (boy / metre_mm) × (levha / metre_mm) × panel_yogunluk.
  Kalınlık levhadır. Yoğunluk kg/m³, ayardadır.
- Kavela, minifiks, konfirmat yalnız birleşim başı ölçü/adettir. Birleşim sayısı yok; toplam yok.
- Raf delik aksı `37 + n·raf_aks`; 37 ayara taşındı. Dizi iç yükseklikte biter
  (dosyada bitiş yok). Raf pimi = raf_pimi_adet × raf_adedi. Delik yan adedi yok.

Her hesap {"hazir", "hatalar", "parcalar", ...} döner. Hata varsa parça üretilmez.
govde_birlestir aynı gövdeyi tek kutuda kilitler: köşe ön-sol-alt, X sağa, Y arkaya, Z yukarı.
İskelet yalnız yan, alt, üst ve kanallı arkalıktır. Raf `raf_yerlestir` ile içine oturur. Kapak ve donanım bu katmanda yok.
Tip ölçüleri ayardadır. tip_olcu yükseklik ve yerden payı verir. Tur baza, duvar veya boy okur.
sira_kur kasaları katalogdaki standart genişliklerle soldan dizer. Köşe genişliği düz sıraya girmez. Dolgu sağda.
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass, fields
from pathlib import Path
from typing import Any

VARSAYILAN_YOL = Path(__file__).resolve().with_name("varsayilan_config.json")
KATALOG_YOL = Path(__file__).resolve().with_name("katalog_arsiv.json")
RAY_TIPLERI = {"tandem": "tandem", "gizli": "tandem", "bilyali": "bilyali"}
ARKALIK_TIPLERI = {"kanalli": "kanalli", "bindirme": "bindirme"}
TIPLER = {"baza": "baza", "duvar": "duvar", "boy": "boy"}
_POZITIF = frozenset(
    {
        "levha",
        "raf_aralik",
        "raf_aks",
        "mentese_esik_1",
        "mentese_esik_2",
        "mentese_esik_3",
        "mentese_adet_1",
        "mentese_adet_2",
        "mentese_adet_3",
        "mentese_adet_4",
        "kavela_cap",
        "kavela_boy",
        "kavela_birlesim",
        "minifiks_birlesim",
        "konfirmat_cap",
        "konfirmat_boy",
        "konfirmat_birlesim",
        "modul_genislik",
        "modul_derinlik",
        "panel_yogunluk",
        "metre_mm",
        "baza_govde_yukseklik",
        "tezgah_kalinlik",
        "duvar_govde_yukseklik",
        "tezgah_ustu_bosluk",
        "boy_govde_yukseklik",
    }
)


def _sayi_mi(deger: Any) -> bool:
    return (
        not isinstance(deger, bool)
        and isinstance(deger, (int, float))
        and math.isfinite(deger)
    )


def _temiz(deger: float) -> float:
    """596.0 yerine 596 yazılır; JSON ve JS ikizi aynı sayıyı görsün."""
    return int(deger) if float(deger).is_integer() else deger


def _ayar_sayisi(ad: str, deger: Any) -> float:
    if not _sayi_mi(deger):
        raise ValueError(f"{ad} sayı olmalı.")
    if deger < 0:
        raise ValueError(f"{ad} negatif olamaz.")
    if ad in _POZITIF and deger == 0:
        raise ValueError(f"{ad} sıfırdan büyük olmalı.")
    return _temiz(deger)


@dataclass(frozen=True)
class MotorConfig:
    """Ölçüler mm. panel_yogunluk kg/m³. metre_mm birim çevirir. Varsayılan yok."""

    levha: float
    arkalik: float
    derz: float
    kapak_binis: float
    raf_geri: float
    raf_aks: float
    arkalik_kanal: float
    arkalik_derinlik: float
    ray_bosluk: float
    cekmece_derzi: float
    raf_tolerans: float
    raf_aralik: float
    tandem_pay: float
    cekmece_taban_payi: float
    ayak_yuksekligi: float
    supurgelik_yuksekligi: float
    supurgelik_geri: float
    mentese_esik_1: float
    mentese_esik_2: float
    mentese_esik_3: float
    mentese_adet_1: float
    mentese_adet_2: float
    mentese_adet_3: float
    mentese_adet_4: float
    kavela_cap: float
    kavela_boy: float
    kavela_birlesim: float
    minifiks_birlesim: float
    konfirmat_cap: float
    konfirmat_boy: float
    konfirmat_birlesim: float
    raf_aks_baslangic: float
    raf_pimi_adet: float
    modul_genislik: float
    modul_derinlik: float
    panel_yogunluk: float
    metre_mm: float
    baza_govde_yukseklik: float
    tezgah_kalinlik: float
    duvar_govde_yukseklik: float
    tezgah_ustu_bosluk: float
    boy_govde_yukseklik: float

    @classmethod
    def from_dict(cls, veri: Any) -> MotorConfig:
        if not isinstance(veri, dict):
            raise ValueError("Ayarlar bir sözlük olmalı.")
        temiz: dict[str, Any] = {}
        for anahtar, deger in veri.items():
            ad = str(anahtar).strip().lower()
            if ad in temiz:
                raise ValueError(f"Ayar iki kez verilmiş: {ad}.")
            temiz[ad] = deger
        alanlar = [f.name for f in fields(cls)]
        eksik = [a for a in alanlar if a not in temiz]
        if eksik:
            raise ValueError("Eksik ayar: " + ", ".join(eksik) + ".")
        fazla = [a for a in temiz if a not in alanlar]
        if fazla:
            raise ValueError("Bilinmeyen ayar: " + ", ".join(fazla) + ".")
        return cls(**{a: _ayar_sayisi(a, temiz[a]) for a in alanlar})

    @classmethod
    def yukle(cls, yol: str | Path) -> MotorConfig:
        try:
            ham = json.loads(Path(yol).read_text(encoding="utf-8"))
        except (OSError, ValueError) as hata:
            raise ValueError(f"Ayar dosyası okunamadı: {yol}") from hata
        return cls.from_dict(ham)

    @classmethod
    def varsayilan(cls) -> MotorConfig:
        return cls.yukle(VARSAYILAN_YOL)

    def degistir(self, **ayar: float) -> MotorConfig:
        """Bir iki ayarı değişmiş yeni config (ör. derz=1.5)."""
        return type(self).from_dict({**asdict(self), **ayar})


def _hata(hatalar: list[str]) -> dict:
    return {"hazir": False, "hatalar": hatalar, "parcalar": []}


def _pozitif(deger: Any, ad: str, hatalar: list[str]) -> bool:
    if _sayi_mi(deger) and deger > 0:
        return True
    hatalar.append(f"{ad} sıfırdan büyük bir sayı olmalı.")
    return False


def _tam(deger: Any, ad: str, en_az: int, hatalar: list[str]) -> bool:
    if isinstance(deger, int) and not isinstance(deger, bool) and deger >= en_az:
        return True
    hatalar.append(f"{ad} {en_az} veya daha büyük bir tam sayı olmalı.")
    return False


def _sifirdan_buyuk(degerler: dict[str, float], hatalar: list[str]) -> None:
    """Anahtar, mesajda görünen addır."""
    for ad, deger in degerler.items():
        if deger <= 0:
            hatalar.append(f"{ad} sıfırdan büyük çıkmadı.")


def _parca(ad: str, adet: int, **olculer: float) -> dict:
    return {"ad": ad, "adet": adet, **{k: _temiz(v) for k, v in olculer.items()}}


def _kutu(ad: str, x: float, y: float, z: float, en: float, boy: float, kalinlik: float) -> dict:
    """Parça kutusu. en X, boy Y, kalinlik Z boyutudur."""
    return {
        "ad": ad,
        "x": _temiz(x),
        "y": _temiz(y),
        "z": _temiz(z),
        "en": _temiz(en),
        "boy": _temiz(boy),
        "kalinlik": _temiz(kalinlik),
    }


def _ic(
    cfg: MotorConfig,
    dis_genislik: Any,
    dis_yukseklik: Any,
    dis_derinlik: Any,
    hatalar: list[str],
) -> dict | None:
    """İç ölçüler. Hata varsa hatalar listesine yazar ve None döner."""
    sayi = len(hatalar)
    _pozitif(dis_genislik, "Dış genişlik", hatalar)
    _pozitif(dis_yukseklik, "Dış yükseklik", hatalar)
    _pozitif(dis_derinlik, "Dış derinlik", hatalar)
    if len(hatalar) > sayi:
        return None
    genislik = dis_genislik - 2 * cfg.levha
    yukseklik = dis_yukseklik - 2 * cfg.levha
    derinlik = dis_derinlik - cfg.arkalik_kanal
    _sifirdan_buyuk(
        {"İç genişlik": genislik, "İç yükseklik": yukseklik, "İç derinlik": derinlik},
        hatalar,
    )
    if len(hatalar) > sayi:
        return None
    return {"genislik": genislik, "yukseklik": yukseklik, "derinlik": derinlik}


def _ic_goster(ic: dict) -> dict:
    return {anahtar: _temiz(deger) for anahtar, deger in ic.items()}


def _raf_akslari(cfg: MotorConfig, ic_yukseklik: float) -> list:
    """aks = raf_aks_baslangic + n · raf_aks, iç yüksekliği aşmayana kadar."""
    aks = cfg.raf_aks_baslangic
    akslar: list = []
    while aks <= ic_yukseklik:
        akslar.append(_temiz(aks))
        aks = aks + cfg.raf_aks
    return akslar


def _raf_yerleri(cfg: MotorConfig, ic_yukseklik: float, adet: int, hatalar: list[str]) -> list:
    """Raf alt yüzünün oturacağı delikler. İç tabandan, eşit aralığın en yakın deliği."""
    if adet == 0:
        return []
    uygun = [a for a in _raf_akslari(cfg, ic_yukseklik) if a + cfg.levha <= ic_yukseklik]
    if adet > len(uygun):
        hatalar.append("Raf deliği yetmiyor.")
        return []
    kullanilan: list = []
    for i in range(1, adet + 1):
        hedef = ic_yukseklik * i / (adet + 1)
        en_yakin = None
        en_fark = None
        for aks in uygun:
            if aks in kullanilan:
                continue
            fark = abs(aks - hedef)
            if en_fark is None or fark < en_fark or (fark == en_fark and aks < en_yakin):
                en_yakin = aks
                en_fark = fark
        if en_yakin is None:
            hatalar.append("Raf deliği yetmiyor.")
            return []
        kullanilan.append(en_yakin)
    kullanilan.sort()
    onceki = None
    for aks in kullanilan:
        if onceki is not None and aks - onceki < cfg.levha:
            hatalar.append("Raflar birbirine giriyor.")
            return []
        onceki = aks
    return kullanilan


def _mentese_kapak_basi(cfg: MotorConfig, kapak_yukseklik: float) -> tuple[float | None, str | None]:
    """İlk `<=` eşik. Dosyadaki 900/1600 çakışması böyle okunur."""
    esikler = (cfg.mentese_esik_1, cfg.mentese_esik_2, cfg.mentese_esik_3)
    adetler = (cfg.mentese_adet_1, cfg.mentese_adet_2, cfg.mentese_adet_3, cfg.mentese_adet_4)
    if esikler[0] >= esikler[1] or esikler[1] >= esikler[2]:
        return None, "Menteşe eşikleri artan olmalı."
    if kapak_yukseklik <= esikler[0]:
        return adetler[0], None
    if kapak_yukseklik <= esikler[1]:
        return adetler[1], None
    if kapak_yukseklik <= esikler[2]:
        return adetler[2], None
    return adetler[3], None


def tip_olcu(cfg: MotorConfig, tip: Any, oda_yukseklik: float) -> dict:
    """Tipin gövde yüksekliği ve yerden payı. Tur bunu okur."""
    hatalar: list[str] = []
    ad = str(tip).strip().lower() if isinstance(tip, str) else ""
    if ad not in TIPLER:
        hatalar.append("Tip baza, duvar veya boy olmalı.")
    _pozitif(oda_yukseklik, "Oda yüksekliği", hatalar)
    if hatalar:
        return _hata(hatalar)
    if ad == "baza":
        yukseklik = cfg.baza_govde_yukseklik
        yerden = cfg.ayak_yuksekligi
    elif ad == "duvar":
        yukseklik = cfg.duvar_govde_yukseklik
        yerden = (
            cfg.ayak_yuksekligi
            + cfg.baza_govde_yukseklik
            + cfg.tezgah_kalinlik
            + cfg.tezgah_ustu_bosluk
        )
    else:
        yukseklik = cfg.boy_govde_yukseklik
        if yukseklik > oda_yukseklik:
            yukseklik = oda_yukseklik
        yerden = 0
    if yerden + yukseklik > oda_yukseklik:
        return _hata(["Oda bu tipe dar."])
    return {
        "hazir": True,
        "hatalar": [],
        "tip": ad,
        "yukseklik": _temiz(yukseklik),
        "yerden": _temiz(yerden),
        "parcalar": [],
    }


def govde_hesapla(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    dikme_adedi: int = 0,
) -> dict:
    """Yan, alt, üst ve istenirse dikme. Tavan/taban alt/üst ile aynıdır."""
    hatalar: list[str] = []
    ic = _ic(cfg, dis_genislik, dis_yukseklik, dis_derinlik, hatalar)
    _tam(dikme_adedi, "Dikme adedi", 0, hatalar)
    if hatalar:
        return _hata(hatalar)
    parcalar = [
        _parca("yan", 2, yukseklik=dis_yukseklik, derinlik=dis_derinlik),
        _parca("alt", 1, genislik=ic["genislik"], derinlik=dis_derinlik),
        _parca("ust", 1, genislik=ic["genislik"], derinlik=dis_derinlik),
    ]
    if dikme_adedi:
        parcalar.append(
            _parca("dikme", dikme_adedi, yukseklik=ic["yukseklik"], derinlik=ic["derinlik"])
        )
    return {"hazir": True, "hatalar": [], "ic": _ic_goster(ic), "parcalar": parcalar}


def govde_birlestir(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
) -> dict:
    """Yan, alt, üst ve kanallı arkalığı tek gövdede kilitler.

    Köşe ön-sol-alt dış köşedir. X sağa, Y arkaya, Z yukarı.
    Raf bu katmanda yoktur.
    """
    hatalar: list[str] = []
    ic = _ic(cfg, dis_genislik, dis_yukseklik, dis_derinlik, hatalar)
    if ic is not None:
        if cfg.arkalik > dis_derinlik:
            hatalar.append("Arkalık kalınlığı derinliği aşıyor.")
        _sifirdan_buyuk(
            {
                "Arkalık genişliği": dis_genislik - 2 * cfg.arkalik_kanal,
                "Arkalık yüksekliği": dis_yukseklik - 2 * cfg.arkalik_kanal,
                "Arkalık kalınlığı": cfg.arkalik,
            },
            hatalar,
        )
    if hatalar:
        return _hata(hatalar)
    parcalar = [
        _kutu("yan", 0, 0, 0, cfg.levha, dis_derinlik, dis_yukseklik),
        _kutu(
            "yan",
            dis_genislik - cfg.levha,
            0,
            0,
            cfg.levha,
            dis_derinlik,
            dis_yukseklik,
        ),
        _kutu("alt", cfg.levha, 0, 0, ic["genislik"], dis_derinlik, cfg.levha),
        _kutu(
            "ust",
            cfg.levha,
            0,
            dis_yukseklik - cfg.levha,
            ic["genislik"],
            dis_derinlik,
            cfg.levha,
        ),
        _kutu(
            "arkalik",
            cfg.arkalik_kanal,
            dis_derinlik - cfg.arkalik,
            cfg.arkalik_kanal,
            dis_genislik - 2 * cfg.arkalik_kanal,
            cfg.arkalik,
            dis_yukseklik - 2 * cfg.arkalik_kanal,
        ),
    ]
    return {
        "hazir": True,
        "hatalar": [],
        "ic": _ic_goster(ic),
        "govde": {
            "genislik": _temiz(dis_genislik),
            "yukseklik": _temiz(dis_yukseklik),
            "derinlik": _temiz(dis_derinlik),
        },
        "parcalar": parcalar,
    }


def _kapak_agirlik_kg(cfg: MotorConfig, genislik: float, yukseklik: float) -> float:
    """Bir kanat. Kalınlık levha. mm, metre_mm ile metreye çevrilir."""
    m = cfg.metre_mm
    return _temiz((genislik / m) * (yukseklik / m) * (cfg.levha / m) * cfg.panel_yogunluk)


def kapak_hesapla(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    kapak_adedi: int = 1,
) -> dict:
    """Tam bindirme kapak, iç ölçüden. kapak_adedi 1 (tek) veya 2 (çift)."""
    hatalar: list[str] = []
    ic = _ic(cfg, dis_genislik, dis_yukseklik, dis_derinlik, hatalar)
    if _tam(kapak_adedi, "Kapak adedi", 1, hatalar) and kapak_adedi > 2:
        hatalar.append("Kapak adedi 1 veya 2 olmalı.")
    if hatalar:
        return _hata(hatalar)
    yukseklik = ic["yukseklik"] + 2 * cfg.kapak_binis - 2 * cfg.derz
    if kapak_adedi == 1:
        genislik = ic["genislik"] + 2 * cfg.kapak_binis - 2 * cfg.derz
    else:
        genislik = (ic["genislik"] + 2 * cfg.kapak_binis - 3 * cfg.derz) / 2
    _sifirdan_buyuk({"Kapak genişliği": genislik, "Kapak yüksekliği": yukseklik}, hatalar)
    if hatalar:
        return _hata(hatalar)
    return {
        "hazir": True,
        "hatalar": [],
        "ic": _ic_goster(ic),
        "agirlik_kg": _kapak_agirlik_kg(cfg, genislik, yukseklik),
        "parcalar": [_parca("kapak", kapak_adedi, genislik=genislik, yukseklik=yukseklik)],
    }


def kapak_yerlestir(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
) -> dict:
    """Tek kapak, tam bindirme, gövdenin önünde. Kalınlık levha."""
    kapak = kapak_hesapla(cfg, dis_genislik, dis_yukseklik, dis_derinlik, 1)
    if not kapak["hazir"]:
        return _hata(kapak["hatalar"])
    p = kapak["parcalar"][0]
    x = (dis_genislik - p["genislik"]) / 2
    z = (dis_yukseklik - p["yukseklik"]) / 2
    return {
        "hazir": True,
        "hatalar": [],
        "ic": kapak["ic"],
        "agirlik_kg": kapak["agirlik_kg"],
        "parcalar": [
            _kutu("kapak", x, -cfg.levha, z, p["genislik"], cfg.levha, p["yukseklik"])
        ],
    }


def raf_hesapla(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    raf_adedi: int | None = None,
) -> dict:
    """Raf ölçüsü, adedi, pim ve 32 mm aks. raf_adedi yoksa iç yükseklikten gelir."""
    hatalar: list[str] = []
    ic = _ic(cfg, dis_genislik, dis_yukseklik, dis_derinlik, hatalar)
    if raf_adedi is not None:
        _tam(raf_adedi, "Raf adedi", 0, hatalar)
    if ic is not None:
        genislik = ic["genislik"] - cfg.raf_tolerans
        derinlik = ic["derinlik"] - cfg.raf_geri
        _sifirdan_buyuk({"Raf genişliği": genislik, "Raf derinliği": derinlik}, hatalar)
    if hatalar:
        return _hata(hatalar)
    adet = raf_adedi if raf_adedi is not None else math.floor(ic["yukseklik"] / cfg.raf_aralik)
    akslar = _raf_akslari(cfg, ic["yukseklik"])
    parcalar = [_parca("raf", adet, genislik=genislik, derinlik=derinlik)] if adet else []
    return {
        "hazir": True,
        "hatalar": [],
        "ic": _ic_goster(ic),
        "raf_adedi": adet,
        "raf_pimi_adedi": _temiz(adet * cfg.raf_pimi_adet),
        "akslar": akslar,
        "delik_adedi": len(akslar),
        "parcalar": parcalar,
    }


def raf_yerlestir(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    raf_adedi: int | None = None,
) -> dict:
    """Raf kutuları iskeletin içinde. Alt yüz System 32 deliğine oturur. Y önden raf_geri."""
    raf = raf_hesapla(cfg, dis_genislik, dis_yukseklik, dis_derinlik, raf_adedi)
    if not raf["hazir"]:
        return _hata(raf["hatalar"])
    ic = raf["ic"]
    hatalar: list[str] = []
    yerler = _raf_yerleri(cfg, ic["yukseklik"], raf["raf_adedi"], hatalar)
    if hatalar:
        return _hata(hatalar)
    en = ic["genislik"] - cfg.raf_tolerans
    boy = ic["derinlik"] - cfg.raf_geri
    x = cfg.levha + (ic["genislik"] - en) / 2
    parcalar = [
        _kutu("raf", x, cfg.raf_geri, cfg.levha + aks, en, boy, cfg.levha) for aks in yerler
    ]
    return {
        "hazir": True,
        "hatalar": [],
        "ic": ic,
        "raf_adedi": raf["raf_adedi"],
        "parcalar": parcalar,
    }


def katalog_yukle(yol: str | Path | None = None) -> dict:
    """Şablon arşivi. acik_ek sıra için kullanılmaz."""
    kaynak = Path(yol) if yol else KATALOG_YOL
    try:
        ham = json.loads(kaynak.read_text(encoding="utf-8"))
    except (OSError, ValueError) as hata:
        raise ValueError(f"Katalog okunamadı: {kaynak}") from hata
    if not isinstance(ham, dict) or not isinstance(ham.get("sablon"), dict):
        raise ValueError("Katalog şablonu yok.")
    return ham


def _katalog_kayitlari(katalog: dict, tip: str) -> list:
    sablon = katalog.get("sablon")
    if not isinstance(sablon, dict) or tip not in sablon:
        return []
    kayitlar = sablon[tip]
    return kayitlar if isinstance(kayitlar, list) else []


def standart_enler(katalog: dict, tip: str) -> list:
    """Düz kasa genişlikleri, büyükten küçüğe. Köşe dahil değil."""
    enler = []
    for kayit in _katalog_kayitlari(katalog, tip):
        if not isinstance(kayit, dict) or not _sayi_mi(kayit.get("en")):
            continue
        if kayit.get("duz_kasa", True) is False:
            continue
        enler.append(_temiz(kayit["en"]))
    return sorted(set(enler), reverse=True)


def kose_enler(katalog: dict, tip: str) -> list:
    """Köşe genişlikleri. Düz sıra bunları koymaz."""
    enler = []
    for kayit in _katalog_kayitlari(katalog, tip):
        if not isinstance(kayit, dict) or kayit.get("duz_kasa", True) is not False:
            continue
        if not _sayi_mi(kayit.get("en")):
            continue
        enler.append(_temiz(kayit["en"]))
    return sorted(set(enler))


def _en_sec(enler: list, duvar_en: float) -> tuple[list, float]:
    """Soldan, sığan en geniş standart. Kalan dolgudur."""
    secim: list = []
    kalan = duvar_en
    while True:
        sigan = [en for en in enler if en <= kalan]
        if not sigan:
            break
        secim.append(sigan[0])
        kalan = kalan - sigan[0]
    return secim, kalan


def duvar_dizi(cfg: MotorConfig, duvar_en: float, tip: str = "baza", katalog: dict | None = None) -> dict:
    """Standart şablon genişlikleriyle kaçar kasa. Köşe yok. Kalan sağdaki dolgu."""
    del cfg
    hatalar: list[str] = []
    _pozitif(duvar_en, "Duvar eni", hatalar)
    ad = str(tip).strip().lower() if isinstance(tip, str) else ""
    if ad not in TIPLER:
        hatalar.append("Tip baza, duvar veya boy olmalı.")
    if hatalar:
        return _hata(hatalar)
    arsiv = katalog if katalog is not None else katalog_yukle()
    enler = standart_enler(arsiv, ad)
    if not enler:
        return _hata(["Bu tipte standart genişlik yok."])
    if enler[-1] > duvar_en:
        return _hata(["Duvar modüle dar."])
    secim, dolgu = _en_sec(enler, duvar_en)
    return {
        "hazir": True,
        "hatalar": [],
        "modul_adedi": len(secim),
        "genislikler": secim,
        "dolgu_en": _temiz(dolgu),
        "parcalar": [],
    }


def sira_kur(
    cfg: MotorConfig,
    duvar_en: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    tip: str = "baza",
    katalog: dict | None = None,
) -> dict:
    """Standart kasaları soldan dizer. Köşe genişliği girmez. Dolgu sağda."""
    dizi = duvar_dizi(cfg, duvar_en, tip, katalog)
    if not dizi["hazir"]:
        return _hata(dizi["hatalar"])
    hatalar: list[str] = []
    _pozitif(dis_yukseklik, "Dış yükseklik", hatalar)
    _pozitif(dis_derinlik, "Dış derinlik", hatalar)
    if hatalar:
        return _hata(hatalar)
    parcalar: list = []
    dx = 0
    for w in dizi["genislikler"]:
        gov = govde_birlestir(cfg, w, dis_yukseklik, dis_derinlik)
        if not gov["hazir"]:
            return _hata(gov["hatalar"])
        raf = raf_yerlestir(cfg, w, dis_yukseklik, dis_derinlik)
        if not raf["hazir"]:
            return _hata(raf["hatalar"])
        kapak = kapak_yerlestir(cfg, w, dis_yukseklik, dis_derinlik)
        if not kapak["hazir"]:
            return _hata(kapak["hatalar"])
        for p in gov["parcalar"] + raf["parcalar"] + kapak["parcalar"]:
            parcalar.append(
                _kutu(p["ad"], p["x"] + dx, p["y"], p["z"], p["en"], p["boy"], p["kalinlik"])
            )
        dx = dx + w
    if dizi["dolgu_en"] > 0:
        parcalar.append(
            _kutu(
                "dolgu",
                dx,
                0,
                0,
                dizi["dolgu_en"],
                dis_derinlik,
                dis_yukseklik,
            )
        )
    return {
        "hazir": True,
        "hatalar": [],
        "modul_adedi": dizi["modul_adedi"],
        "genislikler": dizi["genislikler"],
        "dolgu_en": dizi["dolgu_en"],
        "parcalar": parcalar,
    }


def cekmece_hesapla(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    ray_tipi: str,
    ray_uzunlugu: float,
    aciklik_yuksekligi: float,
) -> dict:
    """Bir çekmece: yan, ön/arka, taban ve çekmece önü.

    ray_tipi: tandem (gizli ray dahil) veya bilyali. Ray uzunluğu ve açıklık
    yüksekliğini çağıran verir; dosyada bunları seçen kural yok.
    """
    hatalar: list[str] = []
    ic = _ic(cfg, dis_genislik, dis_yukseklik, dis_derinlik, hatalar)
    tip = RAY_TIPLERI.get(str(ray_tipi).strip().lower())
    if tip is None:
        hatalar.append("Ray tipi tandem, gizli veya bilyali olmalı.")
    ray_tamam = _pozitif(ray_uzunlugu, "Ray uzunluğu", hatalar)
    _pozitif(aciklik_yuksekligi, "Açıklık yüksekliği", hatalar)
    if ic is not None and ray_tamam and ray_uzunlugu > ic["derinlik"]:
        hatalar.append("Ray uzunluğu iç derinliği aşıyor.")
    if hatalar:
        return _hata(hatalar)
    if tip == "tandem":
        cekmece_genislik = ic["genislik"] - cfg.tandem_pay
    else:
        cekmece_genislik = ic["genislik"] - 2 * cfg.ray_bosluk
    on_arka_genislik = cekmece_genislik - 2 * cfg.levha
    taban_genislik = cekmece_genislik - cfg.cekmece_taban_payi
    taban_boy = ray_uzunlugu - cfg.cekmece_taban_payi
    onu_genislik = dis_genislik - 2 * cfg.derz
    onu_yukseklik = aciklik_yuksekligi - cfg.derz
    _sifirdan_buyuk(
        {
            "Çekmece genişliği": cekmece_genislik,
            "Ön/arka genişliği": on_arka_genislik,
            "Taban genişliği": taban_genislik,
            "Taban boyu": taban_boy,
            "Çekmece önü genişliği": onu_genislik,
            "Çekmece önü yüksekliği": onu_yukseklik,
        },
        hatalar,
    )
    if hatalar:
        return _hata(hatalar)
    return {
        "hazir": True,
        "hatalar": [],
        "ic": _ic_goster(ic),
        "cekmece_genislik": _temiz(cekmece_genislik),
        "parcalar": [
            _parca("cekmece_yan", 2, boy=ray_uzunlugu),
            _parca("cekmece_on_arka", 2, genislik=on_arka_genislik),
            _parca("cekmece_taban", 1, genislik=taban_genislik, boy=taban_boy),
            _parca("cekmece_onu", 1, genislik=onu_genislik, yukseklik=onu_yukseklik),
        ],
    }


def arkalik_hesapla(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    arkalik_tipi: str,
) -> dict:
    """Kanallı veya bindirme arkalık. Tipi çağıran verir.

    Kanallı: dış ölçü − 2·arkalik_kanal. Bindirme: dış ölçü.
    """
    hatalar: list[str] = []
    ic = _ic(cfg, dis_genislik, dis_yukseklik, dis_derinlik, hatalar)
    tip = ARKALIK_TIPLERI.get(str(arkalik_tipi).strip().lower())
    if tip is None:
        hatalar.append("Arkalık tipi kanalli veya bindirme olmalı.")
    if hatalar:
        return _hata(hatalar)
    if tip == "kanalli":
        genislik = dis_genislik - 2 * cfg.arkalik_kanal
        yukseklik = dis_yukseklik - 2 * cfg.arkalik_kanal
    else:
        genislik = dis_genislik
        yukseklik = dis_yukseklik
    _sifirdan_buyuk(
        {"Arkalık genişliği": genislik, "Arkalık yüksekliği": yukseklik},
        hatalar,
    )
    if hatalar:
        return _hata(hatalar)
    return {
        "hazir": True,
        "hatalar": [],
        "ic": _ic_goster(ic),
        "arkalik_tipi": tip,
        "parcalar": [_parca("arkalik", 1, genislik=genislik, yukseklik=yukseklik)],
    }


def ayak_supurgelik_hesapla(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
) -> dict:
    """Ayak ve süpürgelik yükseklikleri ile geri kaçma. Dosyada parça formülü yok."""
    hatalar: list[str] = []
    ic = _ic(cfg, dis_genislik, dis_yukseklik, dis_derinlik, hatalar)
    if ic is not None:
        if cfg.ayak_yuksekligi >= dis_yukseklik:
            hatalar.append("Ayak yüksekliği dolabı aşıyor.")
        if cfg.supurgelik_yuksekligi >= dis_yukseklik:
            hatalar.append("Süpürgelik yüksekliği dolabı aşıyor.")
        if cfg.supurgelik_geri >= dis_derinlik:
            hatalar.append("Süpürgelik geri kaçması derinliği aşıyor.")
    if hatalar:
        return _hata(hatalar)
    return {
        "hazir": True,
        "hatalar": [],
        "ic": _ic_goster(ic),
        "ayak_yuksekligi": _temiz(cfg.ayak_yuksekligi),
        "supurgelik_yuksekligi": _temiz(cfg.supurgelik_yuksekligi),
        "supurgelik_geri": _temiz(cfg.supurgelik_geri),
        "parcalar": [],
    }


def hirdavat_hesapla(
    cfg: MotorConfig,
    dis_genislik: float,
    dis_yukseklik: float,
    dis_derinlik: float,
    kapak_adedi: int = 1,
) -> dict:
    """Menteşe adedi kapak yüksekliğinden. Kavela/minifiks/konfirmat birleşim başı."""
    kapak = kapak_hesapla(cfg, dis_genislik, dis_yukseklik, dis_derinlik, kapak_adedi)
    if not kapak["hazir"]:
        return _hata(kapak["hatalar"])
    kapak_yukseklik = kapak["parcalar"][0]["yukseklik"]
    kapak_basi, hata = _mentese_kapak_basi(cfg, kapak_yukseklik)
    if hata:
        return _hata([hata])
    mentese_adedi = kapak_basi * kapak_adedi
    return {
        "hazir": True,
        "hatalar": [],
        "ic": kapak["ic"],
        "kapak_yuksekligi": kapak_yukseklik,
        "mentese_kapak_basi": _temiz(kapak_basi),
        "mentese_adedi": _temiz(mentese_adedi),
        "hirdavat": [
            {"ad": "mentese", "adet": _temiz(mentese_adedi)},
            {
                "ad": "kavela",
                "cap": _temiz(cfg.kavela_cap),
                "boy": _temiz(cfg.kavela_boy),
                "birlesim_adet": _temiz(cfg.kavela_birlesim),
            },
            {"ad": "minifiks", "birlesim_adet": _temiz(cfg.minifiks_birlesim)},
            {
                "ad": "konfirmat",
                "cap": _temiz(cfg.konfirmat_cap),
                "boy": _temiz(cfg.konfirmat_boy),
                "birlesim_adet": _temiz(cfg.konfirmat_birlesim),
            },
        ],
        "parcalar": [],
    }
