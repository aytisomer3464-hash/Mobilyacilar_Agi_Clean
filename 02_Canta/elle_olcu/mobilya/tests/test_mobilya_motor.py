import ast
import json
from dataclasses import FrozenInstanceError, asdict
from pathlib import Path

import pytest

from mobilya import motor
from mobilya.motor import (
    MotorConfig,
    arkalik_hesapla,
    ayak_supurgelik_hesapla,
    cekmece_hesapla,
    govde_birlestir,
    govde_hesapla,
    hirdavat_hesapla,
    kapak_hesapla,
    kapak_yerlestir,
    duvar_dizi,
    sira_kur,
    raf_hesapla,
    raf_yerlestir,
    tip_olcu,
)

DIS = (600, 720, 580)

# Mobilya_Motor_Parametreleri.txt, GLOBAL PARAMETRELER
DOSYA_DEGERLERI = {
    "levha": 18,
    "arkalik": 8,
    "derz": 2,
    "kapak_binis": 18,
    "raf_geri": 20,
    "raf_aks": 32,
    "arkalik_kanal": 10,
    "arkalik_derinlik": 10,
    "ray_bosluk": 12.5,
    "cekmece_derzi": 2,
}
# Aynı dosyada formüle gömülü olan sayılar
GOMULU_AYARLAR = {
    "raf_tolerans": 1,
    "raf_aralik": 350,
    "tandem_pay": 42,
    "cekmece_taban_payi": 2,
    "ayak_yuksekligi": 100,
    "supurgelik_yuksekligi": 100,
    "supurgelik_geri": 50,
    "mentese_esik_1": 900,
    "mentese_esik_2": 1600,
    "mentese_esik_3": 2200,
    "mentese_adet_1": 2,
    "mentese_adet_2": 3,
    "mentese_adet_3": 4,
    "mentese_adet_4": 5,
    "kavela_cap": 8,
    "kavela_boy": 30,
    "kavela_birlesim": 2,
    "minifiks_birlesim": 2,
    "konfirmat_cap": 7,
    "konfirmat_boy": 50,
    "konfirmat_birlesim": 2,
    "raf_aks_baslangic": 37,
    "raf_pimi_adet": 4,
    "modul_genislik": 600,
    "modul_derinlik": 580,
    "panel_yogunluk": 650,
    "metre_mm": 1000,
    "baza_govde_yukseklik": 720,
    "tezgah_kalinlik": 40,
    "duvar_govde_yukseklik": 720,
    "tezgah_ustu_bosluk": 550,
    "boy_govde_yukseklik": 2100,
}


@pytest.fixture
def cfg():
    return MotorConfig.varsayilan()


def _parcalar(sonuc):
    return {p["ad"]: p for p in sonuc["parcalar"]}


# ---- MotorConfig ----

def test_varsayilan_dosya_degerleri(cfg):
    assert asdict(cfg) == {**DOSYA_DEGERLERI, **GOMULU_AYARLAR}


def test_config_eksik_ve_fazla_ayar(cfg):
    ham = asdict(cfg)
    eksik = {k: v for k, v in ham.items() if k != "levha"}
    with pytest.raises(ValueError, match="Eksik ayar: levha"):
        MotorConfig.from_dict(eksik)
    with pytest.raises(ValueError, match="Bilinmeyen ayar: yok"):
        MotorConfig.from_dict({**ham, "yok": 1})
    with pytest.raises(ValueError):
        MotorConfig.from_dict([])


def test_config_gecersiz_deger(cfg):
    ham = asdict(cfg)
    with pytest.raises(ValueError, match="negatif"):
        MotorConfig.from_dict({**ham, "derz": -1})
    with pytest.raises(ValueError, match="sayı olmalı"):
        MotorConfig.from_dict({**ham, "derz": True})
    with pytest.raises(ValueError, match="sayı olmalı"):
        MotorConfig.from_dict({**ham, "derz": "2"})
    with pytest.raises(ValueError, match="sayı olmalı"):
        MotorConfig.from_dict({**ham, "derz": float("nan")})
    with pytest.raises(ValueError, match="sıfırdan büyük"):
        MotorConfig.from_dict({**ham, "levha": 0})
    with pytest.raises(ValueError, match="sıfırdan büyük"):
        MotorConfig.from_dict({**ham, "raf_aralik": 0})
    with pytest.raises(ValueError, match="sıfırdan büyük"):
        MotorConfig.from_dict({**ham, "raf_aks": 0})


def test_config_buyuk_harf_ve_tekrar(cfg):
    buyuk = {k.upper(): v for k, v in asdict(cfg).items()}
    assert MotorConfig.from_dict(buyuk) == cfg
    with pytest.raises(ValueError, match="iki kez"):
        MotorConfig.from_dict({**asdict(cfg), "LEVHA": 16})


def test_config_degismez_ve_degistir(cfg):
    with pytest.raises(FrozenInstanceError):
        cfg.levha = 16
    assert cfg.degistir(levha=16).levha == 16
    assert cfg.levha == 18
    with pytest.raises(ValueError):
        cfg.degistir(levha=-1)
    with pytest.raises(ValueError, match="Bilinmeyen"):
        cfg.degistir(yok=1)


def test_config_dosyadan_yukle(tmp_path, cfg):
    yol = tmp_path / "atolye.json"
    yol.write_text(json.dumps({**asdict(cfg), "levha": 16}), encoding="utf-8")
    assert MotorConfig.yukle(yol).levha == 16
    with pytest.raises(ValueError, match="okunamadı"):
        MotorConfig.yukle(tmp_path / "yok.json")
    bozuk = tmp_path / "bozuk.json"
    bozuk.write_text("{", encoding="utf-8")
    with pytest.raises(ValueError, match="okunamadı"):
        MotorConfig.yukle(bozuk)


# ---- Gövde ----

def test_govde_varsayilan(cfg):
    s = govde_hesapla(cfg, *DIS)
    assert s["hazir"] is True
    assert s["hatalar"] == []
    assert s["ic"] == {"genislik": 564, "yukseklik": 684, "derinlik": 570}
    p = _parcalar(s)
    assert p["yan"] == {"ad": "yan", "adet": 2, "yukseklik": 720, "derinlik": 580}
    assert p["alt"] == {"ad": "alt", "adet": 1, "genislik": 564, "derinlik": 580}
    assert p["ust"] == {"ad": "ust", "adet": 1, "genislik": 564, "derinlik": 580}
    assert "dikme" not in p


def test_govde_dikme(cfg):
    p = _parcalar(govde_hesapla(cfg, *DIS, dikme_adedi=2))
    assert p["dikme"] == {"ad": "dikme", "adet": 2, "yukseklik": 684, "derinlik": 570}


def test_govde_levha_ayardan_gelir(cfg):
    s = govde_hesapla(cfg.degistir(levha=16), *DIS)
    assert s["ic"] == {"genislik": 568, "yukseklik": 688, "derinlik": 570}
    assert _parcalar(s)["alt"]["genislik"] == 568


def test_govde_hatalari(cfg):
    for dis in ((36, 720, 580), (600, 36, 580), (600, 720, 10)):
        s = govde_hesapla(cfg, *dis)
        assert s["hazir"] is False
        assert s["parcalar"] == []
        assert "sıfırdan büyük çıkmadı" in s["hatalar"][0]
    assert govde_hesapla(cfg, "600", 720, 580)["hazir"] is False
    assert govde_hesapla(cfg, 600, 720, 580, dikme_adedi=-1)["hazir"] is False
    assert govde_hesapla(cfg, 600, 720, 580, dikme_adedi=True)["hazir"] is False


def _dis_kutu(parca):
    return (
        parca["x"] + parca["en"],
        parca["y"] + parca["boy"],
        parca["z"] + parca["kalinlik"],
    )


def test_govde_birlestir_kilit(cfg):
    s = govde_birlestir(cfg, *DIS)
    assert s["hazir"] is True
    assert s["hatalar"] == []
    assert s["govde"] == {"genislik": 600, "yukseklik": 720, "derinlik": 580}
    assert s["parcalar"] == [
        {"ad": "yan", "x": 0, "y": 0, "z": 0, "en": 18, "boy": 580, "kalinlik": 720},
        {"ad": "yan", "x": 582, "y": 0, "z": 0, "en": 18, "boy": 580, "kalinlik": 720},
        {"ad": "alt", "x": 18, "y": 0, "z": 0, "en": 564, "boy": 580, "kalinlik": 18},
        {"ad": "ust", "x": 18, "y": 0, "z": 702, "en": 564, "boy": 580, "kalinlik": 18},
        {"ad": "arkalik", "x": 10, "y": 572, "z": 10, "en": 580, "boy": 8, "kalinlik": 700},
    ]
    yanlar = [p for p in s["parcalar"] if p["ad"] == "yan"]
    assert _dis_kutu(yanlar[0])[0] == cfg.levha
    assert yanlar[1]["x"] + yanlar[1]["en"] == 600
    assert s["parcalar"][-1]["y"] + s["parcalar"][-1]["boy"] == 580
    assert [p["ad"] for p in s["parcalar"]] == ["yan", "yan", "alt", "ust", "arkalik"]


def test_govde_birlestir_ayardan(cfg):
    ince = govde_birlestir(cfg.degistir(levha=16, arkalik=6), *DIS)
    assert ince["parcalar"][1]["x"] == 584
    assert ince["parcalar"][-1]["y"] == 574
    assert ince["parcalar"][-1]["boy"] == 6
    assert [p["ad"] for p in ince["parcalar"]] == ["yan", "yan", "alt", "ust", "arkalik"]


def test_govde_birlestir_hatalari(cfg):
    assert govde_birlestir(cfg, 36, 720, 580)["parcalar"] == []
    kalin = govde_birlestir(cfg.degistir(arkalik=581), *DIS)
    assert kalin["hatalar"][0] == "Arkalık kalınlığı derinliği aşıyor."


# ---- Tip ----

def test_tip_olcu_baza_duvar_boy(cfg):
    oda = 2600
    baza = tip_olcu(cfg, "baza", oda)
    assert baza["hazir"] is True
    assert baza["yukseklik"] == cfg.baza_govde_yukseklik
    assert baza["yerden"] == cfg.ayak_yuksekligi
    duvar = tip_olcu(cfg, "duvar", oda)
    assert duvar["yukseklik"] == cfg.duvar_govde_yukseklik
    assert duvar["yerden"] == (
        cfg.ayak_yuksekligi
        + cfg.baza_govde_yukseklik
        + cfg.tezgah_kalinlik
        + cfg.tezgah_ustu_bosluk
    )
    boy = tip_olcu(cfg, "boy", oda)
    assert boy["yukseklik"] == cfg.boy_govde_yukseklik
    assert boy["yerden"] == 0
    kisa = tip_olcu(cfg, "boy", 2000)
    assert kisa["yukseklik"] == 2000
    assert tip_olcu(cfg, "baza", 800)["hatalar"] == ["Oda bu tipe dar."]
    assert tip_olcu(cfg, "yok", oda)["hatalar"][0].startswith("Tip baza")


# ---- Kapak ----

def test_kapak_tek_ic_olcuden(cfg):
    s = kapak_hesapla(cfg, *DIS)
    assert s["hazir"] is True
    assert _parcalar(s)["kapak"] == {"ad": "kapak", "adet": 1, "genislik": 596, "yukseklik": 716}
    assert s["agirlik_kg"] == (596 / 1000) * (716 / 1000) * (18 / 1000) * 650


def test_kapak_agirlik_ayardan(cfg):
    yogun = kapak_hesapla(cfg.degistir(panel_yogunluk=700), *DIS)["agirlik_kg"]
    assert yogun == (596 / 1000) * (716 / 1000) * (18 / 1000) * 700
    cift = kapak_hesapla(cfg, *DIS, kapak_adedi=2)["agirlik_kg"]
    assert cift == (297 / 1000) * (716 / 1000) * (18 / 1000) * 650


def test_kapak_cift(cfg):
    kapak = _parcalar(kapak_hesapla(cfg, *DIS, kapak_adedi=2))["kapak"]
    assert kapak == {"ad": "kapak", "adet": 2, "genislik": 297, "yukseklik": 716}


def test_kapak_govdeden_buyuk_cikmaz(cfg):
    kapak = _parcalar(kapak_hesapla(cfg, *DIS))["kapak"]
    assert kapak["genislik"] <= DIS[0]
    assert kapak["yukseklik"] <= DIS[1]


def test_kapak_derz_ayardan_gelir(cfg):
    premium = cfg.degistir(derz=1.5)
    assert _parcalar(kapak_hesapla(premium, *DIS))["kapak"]["genislik"] == 597
    cift = _parcalar(kapak_hesapla(premium, *DIS, kapak_adedi=2))["kapak"]
    assert cift["genislik"] == 297.75
    assert cift["yukseklik"] == 717


def test_kapak_binis_ve_levha_ayardan_gelir(cfg):
    ince = cfg.degistir(levha=16, kapak_binis=16)
    assert _parcalar(kapak_hesapla(ince, *DIS))["kapak"]["genislik"] == 596


def test_kapak_hatalari(cfg):
    for adet in (0, 3, True, 1.5, "1"):
        s = kapak_hesapla(cfg, *DIS, kapak_adedi=adet)
        assert s["hazir"] is False
        assert s["parcalar"] == []
    assert kapak_hesapla(cfg, *DIS, kapak_adedi=3)["hatalar"] == ["Kapak adedi 1 veya 2 olmalı."]
    assert kapak_hesapla(cfg, 36, 720, 580)["hazir"] is False


def test_kapak_yerlestir_onde(cfg):
    s = kapak_yerlestir(cfg, *DIS)
    assert s["hazir"] is True
    k = s["parcalar"][0]
    assert k == {
        "ad": "kapak",
        "x": 2,
        "y": -18,
        "z": 2,
        "en": 596,
        "boy": 18,
        "kalinlik": 716,
    }
    assert kapak_yerlestir(cfg, 36, 720, 580)["hazir"] is False
    assert kapak_yerlestir(cfg, *DIS, kapak_adedi=1) == s


def test_kapak_yerlestir_cift(cfg):
    s = kapak_yerlestir(cfg, *DIS, kapak_adedi=2)
    assert s["hazir"] is True
    assert s["agirlik_kg"] == kapak_hesapla(cfg, *DIS, kapak_adedi=2)["agirlik_kg"]
    sol, sag = s["parcalar"]
    assert sol == {"ad": "kapak", "x": 2, "y": -18, "z": 2, "en": 297, "boy": 18, "kalinlik": 716}
    assert sag == {"ad": "kapak", "x": 301, "y": -18, "z": 2, "en": 297, "boy": 18, "kalinlik": 716}
    assert sag["x"] - (sol["x"] + sol["en"]) == cfg.derz
    tek = kapak_yerlestir(cfg, *DIS)["parcalar"][0]
    assert sol["x"] == tek["x"]
    assert sag["x"] + sag["en"] == tek["x"] + tek["en"]
    genis = kapak_yerlestir(cfg, 900, 720, 580, kapak_adedi=2)["parcalar"]
    assert [(p["x"], p["en"]) for p in genis] == [(2, 447), (451, 447)]


def test_kapak_yerlestir_cift_derz_ayardan(cfg):
    sol, sag = kapak_yerlestir(cfg.degistir(derz=1.5), *DIS, kapak_adedi=2)["parcalar"]
    assert sol["en"] == 297.75
    assert sol["x"] == 1.5
    assert sag["x"] == 300.75
    assert sol["kalinlik"] == 717


def test_kapak_yerlestir_adet_hatalari(cfg):
    for adet in (0, 3, True, 1.5, "2", None):
        s = kapak_yerlestir(cfg, *DIS, kapak_adedi=adet)
        assert s["hazir"] is False
        assert s["parcalar"] == []
    assert kapak_yerlestir(cfg, *DIS, kapak_adedi=3)["hatalar"] == ["Kapak adedi 1 veya 2 olmalı."]
    assert kapak_yerlestir(cfg, 36, 720, 580, kapak_adedi=2)["hazir"] is False


# ---- Raf ----

def test_raf_varsayilan(cfg):
    s = raf_hesapla(cfg, *DIS)
    assert s["hazir"] is True
    assert s["raf_adedi"] == 1
    assert s["raf_pimi_adedi"] == 4
    assert s["akslar"][:3] == [37, 69, 101]
    assert s["akslar"][-1] == 677
    assert s["delik_adedi"] == 21
    assert _parcalar(s)["raf"] == {"ad": "raf", "adet": 1, "genislik": 563, "derinlik": 550}


def test_raf_adedi_verilir_veya_hesaplanir(cfg):
    assert raf_hesapla(cfg, 600, 1800, 580)["raf_adedi"] == 5
    s = raf_hesapla(cfg, *DIS, raf_adedi=3)
    assert s["raf_adedi"] == 3
    assert s["raf_pimi_adedi"] == 12
    assert _parcalar(s)["raf"]["adet"] == 3


def test_raf_yok(cfg):
    kisa = raf_hesapla(cfg, 600, 100, 580)
    assert kisa["hazir"] is True
    assert kisa["raf_adedi"] == 0
    assert kisa["raf_pimi_adedi"] == 0
    assert kisa["akslar"] == [37]
    assert kisa["parcalar"] == []
    sifir = raf_hesapla(cfg, *DIS, raf_adedi=0)
    assert sifir["raf_adedi"] == 0
    assert sifir["raf_pimi_adedi"] == 0
    assert sifir["delik_adedi"] == 21
    assert sifir["parcalar"] == []


def test_raf_ayardan_gelir(cfg):
    ayar = cfg.degistir(raf_tolerans=2, raf_geri=30, raf_aralik=200)
    s = raf_hesapla(ayar, *DIS)
    assert s["raf_adedi"] == 3
    assert s["raf_pimi_adedi"] == 12
    assert _parcalar(s)["raf"]["genislik"] == 562
    assert _parcalar(s)["raf"]["derinlik"] == 540


def test_raf_aks_ve_pim_ayardan_gelir(cfg):
    s = raf_hesapla(
        cfg.degistir(raf_aks_baslangic=40, raf_aks=50, raf_pimi_adet=6),
        *DIS,
        raf_adedi=2,
    )
    assert s["akslar"][:3] == [40, 90, 140]
    assert s["akslar"][-1] == 640
    assert s["delik_adedi"] == 13
    assert s["raf_pimi_adedi"] == 12
    bos = raf_hesapla(cfg.degistir(raf_aks_baslangic=700), *DIS)
    assert bos["akslar"] == []
    assert bos["delik_adedi"] == 0


def test_raf_hatalari(cfg):
    s = raf_hesapla(cfg, 600, 720, 25)
    assert s["hazir"] is False
    assert s["hatalar"] == ["Raf derinliği sıfırdan büyük çıkmadı."]
    assert raf_hesapla(cfg, *DIS, raf_adedi=-1)["hazir"] is False
    assert raf_hesapla(cfg, *DIS, raf_adedi=1.5)["hazir"] is False


def test_raf_yerlestir_kilit(cfg):
    s = raf_yerlestir(cfg, *DIS)
    assert s["hazir"] is True
    assert s["raf_adedi"] == 1
    assert len(s["parcalar"]) == 1
    r = s["parcalar"][0]
    assert r["ad"] == "raf"
    assert r["en"] == 563
    assert r["boy"] == 550
    assert r["kalinlik"] == 18
    assert r["x"] == 18.5
    assert r["y"] == 20
    assert r["z"] == cfg.levha + 357
    bos = raf_yerlestir(cfg, 600, 100, 580)
    assert bos["parcalar"] == []
    assert bos["raf_adedi"] == 0


def test_raf_yerlestir_hatalari(cfg):
    assert raf_yerlestir(cfg, 600, 720, 25)["hazir"] is False
    cok = raf_yerlestir(cfg, *DIS, raf_adedi=40)
    assert cok["hatalar"] == ["Raf deliği yetmiyor."]


def test_katalog_standart_ve_kose():
    arsiv = motor.katalog_yukle()
    assert motor.standart_enler(arsiv, "baza") == [900, 800, 600, 450, 400, 300, 150]
    assert motor.kose_enler(arsiv, "baza") == [1000, 1200]
    assert 500 not in motor.standart_enler(arsiv, "baza")
    assert motor.standart_enler(arsiv, "boy") == [600]
    assert motor.kose_enler(arsiv, "boy") == []


def test_duvar_dizi(cfg):
    s = duvar_dizi(cfg, 2500)
    assert s["hazir"] is True
    assert s["genislikler"] == [900, 900, 600]
    assert s["modul_adedi"] == 3
    assert s["dolgu_en"] == 100
    tam = duvar_dizi(cfg, 1800)
    assert tam["genislikler"] == [900, 900]
    assert tam["dolgu_en"] == 0
    assert duvar_dizi(cfg, 100)["hatalar"] == ["Duvar modüle dar."]
    assert 1000 not in duvar_dizi(cfg, 2500)["genislikler"]
    assert 1200 not in duvar_dizi(cfg, 2500)["genislikler"]


def test_sira_kur_dolgu_sagda(cfg):
    s = sira_kur(cfg, 1900, 720, 580)
    assert s["hazir"] is True
    assert s["genislikler"] == [900, 900]
    assert s["dolgu_en"] == 100
    dolgu = [p for p in s["parcalar"] if p["ad"] == "dolgu"]
    assert len(dolgu) == 1
    assert dolgu[0]["x"] == 1800
    assert dolgu[0]["en"] == 100
    kasalar = [p for p in s["parcalar"] if p["ad"] == "alt"]
    assert [p["x"] for p in kasalar] == [18, 918]
    kapaklar = [p for p in s["parcalar"] if p["ad"] == "kapak"]
    assert [p["x"] for p in kapaklar] == [2, 902]
    dar = sira_kur(cfg, 100, 720, 580)
    assert dar["hatalar"] == ["Duvar modüle dar."]


# ---- Çekmece ----

def test_cekmece_tandem(cfg):
    s = cekmece_hesapla(cfg, *DIS, ray_tipi="tandem", ray_uzunlugu=500, aciklik_yuksekligi=180)
    assert s["hazir"] is True
    assert s["cekmece_genislik"] == 522
    p = _parcalar(s)
    assert p["cekmece_yan"] == {"ad": "cekmece_yan", "adet": 2, "boy": 500}
    assert p["cekmece_on_arka"] == {"ad": "cekmece_on_arka", "adet": 2, "genislik": 486}
    assert p["cekmece_taban"] == {"ad": "cekmece_taban", "adet": 1, "genislik": 520, "boy": 498}
    assert p["cekmece_onu"] == {"ad": "cekmece_onu", "adet": 1, "genislik": 596, "yukseklik": 178}


def test_cekmece_bilyali(cfg):
    s = cekmece_hesapla(cfg, *DIS, ray_tipi="bilyali", ray_uzunlugu=500, aciklik_yuksekligi=180)
    assert s["cekmece_genislik"] == 539
    p = _parcalar(s)
    assert p["cekmece_on_arka"]["genislik"] == 503
    assert p["cekmece_taban"]["genislik"] == 537


def test_cekmece_gizli_ray_tandem_sayilir(cfg):
    tandem = cekmece_hesapla(cfg, *DIS, ray_tipi="tandem", ray_uzunlugu=500, aciklik_yuksekligi=180)
    gizli = cekmece_hesapla(cfg, *DIS, ray_tipi=" Gizli ", ray_uzunlugu=500, aciklik_yuksekligi=180)
    assert gizli == tandem


def test_cekmece_ayardan_gelir(cfg):
    ayar = cfg.degistir(tandem_pay=40, cekmece_taban_payi=4, derz=3)
    s = cekmece_hesapla(ayar, *DIS, ray_tipi="tandem", ray_uzunlugu=500, aciklik_yuksekligi=180)
    p = _parcalar(s)
    assert s["cekmece_genislik"] == 524
    assert p["cekmece_taban"]["genislik"] == 520
    assert p["cekmece_taban"]["boy"] == 496
    assert p["cekmece_onu"] == {"ad": "cekmece_onu", "adet": 1, "genislik": 594, "yukseklik": 177}


def test_cekmece_hatalari(cfg):
    temel = dict(ray_tipi="tandem", ray_uzunlugu=500, aciklik_yuksekligi=180)
    s = cekmece_hesapla(cfg, *DIS, **{**temel, "ray_tipi": "vidali"})
    assert s["hatalar"] == ["Ray tipi tandem, gizli veya bilyali olmalı."]
    s = cekmece_hesapla(cfg, *DIS, **{**temel, "ray_uzunlugu": 600})
    assert s["hatalar"] == ["Ray uzunluğu iç derinliği aşıyor."]
    s = cekmece_hesapla(cfg, *DIS, **{**temel, "aciklik_yuksekligi": 2})
    assert s["hatalar"] == ["Çekmece önü yüksekliği sıfırdan büyük çıkmadı."]
    s = cekmece_hesapla(cfg, 60, 720, 580, **temel)
    assert s["hazir"] is False
    assert s["hatalar"][0] == "Çekmece genişliği sıfırdan büyük çıkmadı."
    assert s["parcalar"] == []
    assert cekmece_hesapla(cfg, *DIS, **{**temel, "ray_tipi": None})["hazir"] is False
    assert cekmece_hesapla(cfg, *DIS, **{**temel, "ray_uzunlugu": 0})["hazir"] is False


# ---- Arkalık ----

def test_arkalik_kanalli(cfg):
    s = arkalik_hesapla(cfg, *DIS, arkalik_tipi="kanalli")
    assert s["hazir"] is True
    assert s["hatalar"] == []
    assert s["arkalik_tipi"] == "kanalli"
    assert s["ic"] == {"genislik": 564, "yukseklik": 684, "derinlik": 570}
    assert _parcalar(s)["arkalik"] == {
        "ad": "arkalik",
        "adet": 1,
        "genislik": 580,
        "yukseklik": 700,
    }


def test_arkalik_bindirme(cfg):
    s = arkalik_hesapla(cfg, *DIS, arkalik_tipi="bindirme")
    assert s["arkalik_tipi"] == "bindirme"
    assert _parcalar(s)["arkalik"] == {
        "ad": "arkalik",
        "adet": 1,
        "genislik": 600,
        "yukseklik": 720,
    }


def test_arkalik_tip_buyuk_harf(cfg):
    kucuk = arkalik_hesapla(cfg, *DIS, arkalik_tipi="kanalli")
    buyuk = arkalik_hesapla(cfg, *DIS, arkalik_tipi=" Kanalli ")
    assert buyuk == kucuk


def test_arkalik_kanal_ayardan_gelir(cfg):
    s = arkalik_hesapla(cfg.degistir(arkalik_kanal=12), *DIS, arkalik_tipi="kanalli")
    assert _parcalar(s)["arkalik"] == {
        "ad": "arkalik",
        "adet": 1,
        "genislik": 576,
        "yukseklik": 696,
    }
    bindirme = arkalik_hesapla(cfg.degistir(arkalik_kanal=12), *DIS, arkalik_tipi="bindirme")
    assert _parcalar(bindirme)["arkalik"]["genislik"] == 600


def test_arkalik_hatalari(cfg):
    s = arkalik_hesapla(cfg, *DIS, arkalik_tipi="vida")
    assert s["hatalar"] == ["Arkalık tipi kanalli veya bindirme olmalı."]
    assert s["parcalar"] == []
    s = arkalik_hesapla(cfg.degistir(arkalik_kanal=300), *DIS, arkalik_tipi="kanalli")
    assert s["hazir"] is False
    assert s["hatalar"] == ["Arkalık genişliği sıfırdan büyük çıkmadı."]
    assert s["parcalar"] == []
    assert arkalik_hesapla(cfg, *DIS, arkalik_tipi=None)["hazir"] is False
    assert arkalik_hesapla(cfg, 36, 720, 580, arkalik_tipi="bindirme")["hazir"] is False


# ---- Ayak ve süpürgelik ----

def test_ayak_supurgelik_varsayilan(cfg):
    s = ayak_supurgelik_hesapla(cfg, *DIS)
    assert s["hazir"] is True
    assert s["hatalar"] == []
    assert s["parcalar"] == []
    assert s["ayak_yuksekligi"] == 100
    assert s["supurgelik_yuksekligi"] == 100
    assert s["supurgelik_geri"] == 50
    assert s["ic"] == {"genislik": 564, "yukseklik": 684, "derinlik": 570}


def test_ayak_supurgelik_ayardan_gelir(cfg):
    s = ayak_supurgelik_hesapla(
        cfg.degistir(ayak_yuksekligi=120, supurgelik_yuksekligi=80, supurgelik_geri=40),
        *DIS,
    )
    assert s["ayak_yuksekligi"] == 120
    assert s["supurgelik_yuksekligi"] == 80
    assert s["supurgelik_geri"] == 40
    assert s["parcalar"] == []


def test_ayak_supurgelik_sifir_olur(cfg):
    s = ayak_supurgelik_hesapla(
        cfg.degistir(ayak_yuksekligi=0, supurgelik_yuksekligi=0, supurgelik_geri=0),
        *DIS,
    )
    assert s["hazir"] is True
    assert s["ayak_yuksekligi"] == 0
    assert s["supurgelik_yuksekligi"] == 0
    assert s["supurgelik_geri"] == 0


def test_ayak_supurgelik_hatalari(cfg):
    s = ayak_supurgelik_hesapla(cfg.degistir(ayak_yuksekligi=720), *DIS)
    assert s["hazir"] is False
    assert s["hatalar"] == ["Ayak yüksekliği dolabı aşıyor."]
    assert s["parcalar"] == []
    s = ayak_supurgelik_hesapla(cfg.degistir(supurgelik_yuksekligi=800), *DIS)
    assert s["hatalar"] == ["Süpürgelik yüksekliği dolabı aşıyor."]
    s = ayak_supurgelik_hesapla(cfg.degistir(supurgelik_geri=580), *DIS)
    assert s["hatalar"] == ["Süpürgelik geri kaçması derinliği aşıyor."]
    s = ayak_supurgelik_hesapla(
        cfg.degistir(ayak_yuksekligi=720, supurgelik_geri=580), *DIS
    )
    assert s["hatalar"] == [
        "Ayak yüksekliği dolabı aşıyor.",
        "Süpürgelik geri kaçması derinliği aşıyor.",
    ]
    assert ayak_supurgelik_hesapla(cfg, 36, 720, 580)["hazir"] is False


# ---- Hırdavat ----

def test_hirdavat_varsayilan(cfg):
    s = hirdavat_hesapla(cfg, *DIS)
    assert s["hazir"] is True
    assert s["hatalar"] == []
    assert s["parcalar"] == []
    assert s["kapak_yuksekligi"] == 716
    assert s["mentese_kapak_basi"] == 2
    assert s["mentese_adedi"] == 2
    assert s["hirdavat"][0] == {"ad": "mentese", "adet": 2}
    assert s["hirdavat"][1] == {"ad": "kavela", "cap": 8, "boy": 30, "birlesim_adet": 2}
    assert s["hirdavat"][2] == {"ad": "minifiks", "birlesim_adet": 2}
    assert s["hirdavat"][3] == {"ad": "konfirmat", "cap": 7, "boy": 50, "birlesim_adet": 2}


def test_hirdavat_cift_kapak(cfg):
    s = hirdavat_hesapla(cfg, *DIS, kapak_adedi=2)
    assert s["mentese_kapak_basi"] == 2
    assert s["mentese_adedi"] == 4
    assert s["hirdavat"][0]["adet"] == 4


def test_hirdavat_mentese_ayardan_gelir(cfg):
    ince = cfg.degistir(mentese_esik_1=700)
    s = hirdavat_hesapla(ince, *DIS)
    assert s["kapak_yuksekligi"] == 716
    assert s["mentese_kapak_basi"] == 3
    uc = cfg.degistir(mentese_esik_1=700, mentese_esik_2=710)
    assert hirdavat_hesapla(uc, *DIS)["mentese_kapak_basi"] == 4
    dort = cfg.degistir(mentese_esik_1=700, mentese_esik_2=710, mentese_esik_3=715)
    assert hirdavat_hesapla(dort, *DIS)["mentese_kapak_basi"] == 5


def test_hirdavat_esik_dahil_ilk_bant(cfg):
    s = hirdavat_hesapla(cfg.degistir(mentese_esik_1=716), *DIS)
    assert s["mentese_kapak_basi"] == 2


def test_hirdavat_kavela_ayardan_gelir(cfg):
    s = hirdavat_hesapla(cfg.degistir(kavela_cap=6, kavela_boy=40, minifiks_birlesim=3), *DIS)
    assert s["hirdavat"][1] == {"ad": "kavela", "cap": 6, "boy": 40, "birlesim_adet": 2}
    assert s["hirdavat"][2] == {"ad": "minifiks", "birlesim_adet": 3}


def test_hirdavat_hatalari(cfg):
    s = hirdavat_hesapla(cfg.degistir(mentese_esik_1=1600, mentese_esik_2=900), *DIS)
    assert s["hazir"] is False
    assert s["hatalar"] == ["Menteşe eşikleri artan olmalı."]
    assert s["parcalar"] == []
    assert hirdavat_hesapla(cfg, 36, 720, 580)["hazir"] is False
    assert hirdavat_hesapla(cfg, *DIS, kapak_adedi=3)["hatalar"] == ["Kapak adedi 1 veya 2 olmalı."]


# ---- Sözleşme ----

def test_sonuc_json_olur(cfg):
    sonuclar = [
        govde_hesapla(cfg, *DIS, dikme_adedi=1),
        govde_birlestir(cfg, *DIS),
        kapak_hesapla(cfg, *DIS, kapak_adedi=2),
        kapak_yerlestir(cfg, *DIS),
        raf_hesapla(cfg, *DIS),
        raf_yerlestir(cfg, *DIS),
        duvar_dizi(cfg, 1900),
        sira_kur(cfg, 1900, 720, 580),
        cekmece_hesapla(cfg, *DIS, ray_tipi="bilyali", ray_uzunlugu=500, aciklik_yuksekligi=180),
        arkalik_hesapla(cfg, *DIS, arkalik_tipi="kanalli"),
        arkalik_hesapla(cfg, *DIS, arkalik_tipi="bindirme"),
        ayak_supurgelik_hesapla(cfg, *DIS),
        hirdavat_hesapla(cfg, *DIS),
        tip_olcu(cfg, "baza", 2600),
        govde_hesapla(cfg, 36, 720, 580),
    ]
    for s in sonuclar:
        assert json.loads(json.dumps(s)) == s


def _motor_agaci():
    return ast.parse(Path(motor.__file__).read_text(encoding="utf-8"))


def test_kodda_olcu_sabiti_yok():
    """Ölçü ayardan gelir. Koddaki sayılar yalnız panel, derz ve kapak sayısıdır."""
    sayilar = {
        n.value
        for n in ast.walk(_motor_agaci())
        if isinstance(n, ast.Constant) and type(n.value) in (int, float)
    }
    assert sayilar <= {0, 1, 2, 3}


def test_motor_baska_motor_import_etmez():
    adlar = set()
    for n in ast.walk(_motor_agaci()):
        if isinstance(n, ast.Import):
            adlar.update(a.name.split(".")[0] for a in n.names)
        elif isinstance(n, ast.ImportFrom):
            adlar.add((n.module or "").split(".")[0])
    assert adlar <= {"__future__", "json", "math", "dataclasses", "pathlib", "typing"}
