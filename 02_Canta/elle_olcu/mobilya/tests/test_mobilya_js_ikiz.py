"""JS ikizi motor.py ile aynı sonucu vermeli. node yoksa atlanır."""

import json
import shutil
import subprocess
from dataclasses import asdict
from pathlib import Path

import pytest

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

KOS = Path(__file__).resolve().with_name("ikiz_kos.js")
NODE = shutil.which("node")
DIS = (600, 720, 580)

pytestmark = pytest.mark.skipif(NODE is None, reason="node yok")


def _js(istek: dict) -> dict:
    sonuc = subprocess.run(
        [NODE, str(KOS)],
        input=json.dumps(istek, ensure_ascii=False),
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert sonuc.returncode == 0, sonuc.stderr
    return json.loads(sonuc.stdout)


def _js_hesap(fn: str, cfg: MotorConfig, args: list) -> dict:
    cevap = _js({"fn": fn, "cfg": asdict(cfg), "args": args})
    assert cevap["ok"] is True, cevap
    return cevap["sonuc"]


@pytest.fixture
def cfg():
    return MotorConfig.varsayilan()


def test_js_varsayilan_ayni(cfg):
    cevap = _js({"op": "varsayilan"})
    assert cevap["ok"] is True
    assert cevap["cfg"] == asdict(cfg)


def test_js_from_dict_hatalari(cfg):
    ham = asdict(cfg)
    eksik = {k: v for k, v in ham.items() if k != "levha"}
    cevap = _js({"op": "from_dict", "veri": eksik})
    assert cevap["ok"] is False
    assert cevap["hata"] == "Eksik ayar: levha."
    cevap = _js({"op": "from_dict", "veri": {**ham, "yok": 1}})
    assert cevap["hata"] == "Bilinmeyen ayar: yok."
    cevap = _js({"op": "from_dict", "veri": {**ham, "derz": -1}})
    assert "negatif" in cevap["hata"]


def test_js_degistir_ayni(cfg):
    py = asdict(cfg.degistir(levha=16, derz=1.5))
    cevap = _js({"op": "degistir", "cfg": asdict(cfg), "ayar": {"levha": 16, "derz": 1.5}})
    assert cevap["ok"] is True
    assert cevap["cfg"] == py


@pytest.mark.parametrize(
    "fn, py_fn, args",
    [
        ("tip_olcu", tip_olcu, ["baza", 2600]),
        ("tip_olcu", tip_olcu, ["duvar", 2600]),
        ("tip_olcu", tip_olcu, ["boy", 2600]),
        ("tip_olcu", tip_olcu, ["boy", 2000]),
        ("govde_hesapla", govde_hesapla, [600, 720, 580]),
        ("govde_hesapla", govde_hesapla, [600, 720, 580, 2]),
        ("govde_birlestir", govde_birlestir, [600, 720, 580]),
        ("govde_birlestir", govde_birlestir, [600, 100, 580]),
        ("kapak_hesapla", kapak_hesapla, [600, 720, 580]),
        ("kapak_hesapla", kapak_hesapla, [600, 720, 580, 2]),
        ("kapak_yerlestir", kapak_yerlestir, [600, 720, 580]),
        ("kapak_yerlestir", kapak_yerlestir, [600, 720, 580, 1]),
        ("kapak_yerlestir", kapak_yerlestir, [600, 720, 580, 2]),
        ("kapak_yerlestir", kapak_yerlestir, [900, 720, 580, 2]),
        ("raf_hesapla", raf_hesapla, [600, 720, 580]),
        ("raf_yerlestir", raf_yerlestir, [600, 720, 580]),
        ("raf_yerlestir", raf_yerlestir, [600, 100, 580]),
        ("duvar_dizi", duvar_dizi, [100]),
        ("duvar_dizi", duvar_dizi, [1900, " Duvar "]),
        ("duvar_dizi", duvar_dizi, [1900, "BOY"]),
        ("sira_kur", sira_kur, [1900, 720, 580]),
        ("sira_kur", sira_kur, [1800, 720, 580]),
        ("sira_kur", sira_kur, [1900, 720, 580, "boy"]),
        ("raf_hesapla", raf_hesapla, [600, 720, 580, 3]),
        ("raf_hesapla", raf_hesapla, [600, 100, 580]),
        ("cekmece_hesapla", cekmece_hesapla, [600, 720, 580, "tandem", 500, 180]),
        ("cekmece_hesapla", cekmece_hesapla, [600, 720, 580, "bilyali", 500, 180]),
        ("cekmece_hesapla", cekmece_hesapla, [600, 720, 580, " Gizli ", 500, 180]),
        ("arkalik_hesapla", arkalik_hesapla, [600, 720, 580, "kanalli"]),
        ("arkalik_hesapla", arkalik_hesapla, [600, 720, 580, "bindirme"]),
        ("ayak_supurgelik_hesapla", ayak_supurgelik_hesapla, [600, 720, 580]),
        ("hirdavat_hesapla", hirdavat_hesapla, [600, 720, 580]),
        ("hirdavat_hesapla", hirdavat_hesapla, [600, 720, 580, 2]),
    ],
)
def test_js_hesap_ayni(cfg, fn, py_fn, args):
    assert _js_hesap(fn, cfg, args) == py_fn(cfg, *args)


CIFT = {"sablon": {"baza": [{"en": 900, "kapak_adedi": 2}, {"en": 600}]}}


@pytest.mark.parametrize(
    "args",
    [
        [1900, 720, 580, "baza", CIFT],
        [1500, 720, 580, " Baza ", CIFT],
        [1900, 720, 580, "baza", {"sablon": {"baza": [{"en": 900, "kapak_adedi": 1}]}}],
        [1900, 720, 580, "baza", {"sablon": {"baza": [{"en": 900, "kapak_adedi": 2.0}]}}],
        [1900, 720, 580, "baza", {"sablon": {"baza": [{"en": 900, "kapak_adedi": 1.0}]}}],
        [900, 720, 580, "baza", {"sablon": {"baza": [{"en": 900, "kapak_adedi": 2}, {"en": 900, "kapak_adedi": 2.0}]}}],
        [900, 720, 580, "baza", {"sablon": {"baza": [{"en": 900, "kapak_adedi": 2}] * 2}}],
        [900, 720, 580, "baza", {"sablon": {"baza": [{"en": 900}, {"en": 1000, "duz_kasa": False, "kapak_adedi": 3}]}}],
    ],
)
def test_js_sira_kur_kapak_adedi_ayni(cfg, args):
    assert _js_hesap("sira_kur", cfg, args) == sira_kur(cfg, *args)
    assert sira_kur(cfg, *args)["hazir"] is True


@pytest.mark.parametrize(
    "baza",
    [
        [{"en": 900, "kapak_adedi": 0}],
        [{"en": 900, "kapak_adedi": 3}],
        [{"en": 900, "kapak_adedi": True}],
        [{"en": 900, "kapak_adedi": 1.5}],
        [{"en": 900, "kapak_adedi": 2.5}],
        [{"en": 900, "kapak_adedi": False}],
        [{"en": 900, "kapak_adedi": "2"}],
        [{"en": 900, "kapak_adedi": None}],
        [{"en": 900, "kapak_adedi": 2}, {"en": 900}],
        [{"en": 900}, {"en": 300, "kapak_adedi": 3}],
    ],
)
def test_js_sira_kur_kapak_adedi_hata_ayni(cfg, baza):
    args = [900, 720, 580, "baza", {"sablon": {"baza": baza}}]
    py = sira_kur(cfg, *args)
    assert py["hazir"] is False
    assert _js_hesap("sira_kur", cfg, args) == py


@pytest.mark.parametrize("derinlik", [249, 249.9, 250, 450, 450.5, 451, 700, 701])
def test_js_govde_vidasi_sinir_ayni(cfg, derinlik):
    args = [600, 720, derinlik]
    assert _js_hesap("hirdavat_hesapla", cfg, args) == hirdavat_hesapla(cfg, *args)


def test_js_govde_vidasi_ayarli_ayni(cfg):
    ayar = cfg.degistir(
        govde_vida_cap=5, govde_vida_esik_1=300, govde_vida_adet_3=6,
        duvar_montaj_vida_cap=8, duvar_montaj_vida_boy=60,
    )
    for args in ([600, 720, 299], [600, 720, 580], [600, 720, 580, 2], [900, 2100, 320]):
        assert _js_hesap("hirdavat_hesapla", ayar, args) == hirdavat_hesapla(ayar, *args)
    bozuk = cfg.degistir(govde_vida_esik_1=500, govde_vida_esik_2=450)
    py = hirdavat_hesapla(bozuk, *DIS)
    assert py["hatalar"] == ["Gövde vidası eşikleri artan olmalı."]
    assert _js_hesap("hirdavat_hesapla", bozuk, list(DIS)) == py


def test_js_ayarli_hesap_ayni(cfg):
    ayar = cfg.degistir(levha=16, derz=1.5, raf_aks=50, raf_aks_baslangic=40, raf_pimi_adet=6)
    assert _js_hesap("govde_hesapla", ayar, list(DIS)) == govde_hesapla(ayar, *DIS)
    assert _js_hesap("govde_birlestir", ayar, list(DIS)) == govde_birlestir(ayar, *DIS)
    assert _js_hesap("kapak_hesapla", ayar, list(DIS)) == kapak_hesapla(ayar, *DIS)
    assert _js_hesap("kapak_yerlestir", ayar, list(DIS)) == kapak_yerlestir(ayar, *DIS)
    assert _js_hesap("kapak_yerlestir", ayar, [*DIS, 2]) == kapak_yerlestir(
        ayar, *DIS, kapak_adedi=2
    )
    assert _js_hesap("raf_hesapla", ayar, [*DIS, 2]) == raf_hesapla(ayar, *DIS, raf_adedi=2)
    assert _js_hesap("raf_yerlestir", ayar, list(DIS)) == raf_yerlestir(ayar, *DIS)
    assert _js_hesap("hirdavat_hesapla", ayar.degistir(mentese_esik_1=700), list(DIS)) == (
        hirdavat_hesapla(ayar.degistir(mentese_esik_1=700), *DIS)
    )


def test_js_hata_ayni(cfg):
    for tip in (None, 1, True, ""):
        py = duvar_dizi(cfg, 1900, tip)
        assert py["hatalar"] == ["Tip baza, duvar veya boy olmalı."]
        assert _js_hesap("duvar_dizi", cfg, [1900, tip]) == py
    for adet in (0, 3, True, 1.5, "2", None):
        py = kapak_yerlestir(cfg, *DIS, kapak_adedi=adet)
        assert py["hazir"] is False
        assert _js_hesap("kapak_yerlestir", cfg, [*DIS, adet]) == py
    assert _js_hesap("tip_olcu", cfg, ["baza", 800]) == tip_olcu(cfg, "baza", 800)
    assert _js_hesap("sira_kur", cfg, [100, 720, 580]) == sira_kur(cfg, 100, 720, 580)
    assert _js_hesap("govde_birlestir", cfg, [36, 720, 580]) == govde_birlestir(cfg, 36, 720, 580)
    assert _js_hesap("kapak_hesapla", cfg, [600, 720, 580, 3]) == kapak_hesapla(
        cfg, *DIS, kapak_adedi=3
    )
    assert _js_hesap("cekmece_hesapla", cfg, [600, 720, 580, "vidali", 500, 180]) == (
        cekmece_hesapla(cfg, *DIS, ray_tipi="vidali", ray_uzunlugu=500, aciklik_yuksekligi=180)
    )
    assert _js_hesap("arkalik_hesapla", cfg, [600, 720, 580, "vida"]) == arkalik_hesapla(
        cfg, *DIS, arkalik_tipi="vida"
    )
    assert _js_hesap("ayak_supurgelik_hesapla", cfg.degistir(ayak_yuksekligi=720), list(DIS)) == (
        ayak_supurgelik_hesapla(cfg.degistir(ayak_yuksekligi=720), *DIS)
    )
    assert _js_hesap(
        "hirdavat_hesapla",
        cfg.degistir(mentese_esik_1=1600, mentese_esik_2=900),
        list(DIS),
    ) == hirdavat_hesapla(cfg.degistir(mentese_esik_1=1600, mentese_esik_2=900), *DIS)
