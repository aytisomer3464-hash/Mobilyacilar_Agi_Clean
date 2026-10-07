from yerel_ocr import satir_ayristir

from ogrenme_hafiza import (
    hafiza_yolu,
    hafizadan_doldur,
    hafizadan_satir,
    hafizaya_kaydet,
    hafizayi_oku,
    metin_imza,
)


def test_hafiza_kaydet_ve_doldur(gecici_veri_kok):
    hafizaya_kaydet(
        {"ham_metin": "42 x 56 adet 1", "uzunluk_mm": 420, "genislik_mm": 560},
        {
            "uzunluk_mm": 720,
            "genislik_mm": 560,
            "adet": 1,
            "parca_adi": "Yan Dikme",
            "bant_kod": "1-0-0-0",
        },
    )
    assert hafiza_yolu().is_file()
    veri = hafizayi_oku()
    assert metin_imza("42 x 56 adet 1") in veri["satir"]
    parca = satir_ayristir("42 x 56 adet 1", 0.4)
    assert parca is not None
    assert parca["uzunluk_mm"] == 720
    assert parca["parca_adi"] == "Yan Dikme"
    assert parca["hafiza_vurus"] is True
    assert parca["supheli"] is False
    assert parca["bant"]["kod"] == "1-0-0-0"


def test_hafiza_satir_olcusuz(gecici_veri_kok):
    hafizaya_kaydet(
        {"ham_metin": "kapak karalama", "uzunluk_mm": 1, "genislik_mm": 1},
        {"uzunluk_mm": 718, "genislik_mm": 396, "adet": 2, "parca_adi": "Kapak"},
    )
    parca = hafizadan_satir("kapak karalama", 0.3)
    assert parca is not None
    assert parca["uzunluk_mm"] == 718
    assert parca["adet"] == 2


def test_rakam_hafizasi_ikinci_kez(gecici_veri_kok):
    for _ in range(2):
        hafizaya_kaydet(
            {"ham_metin": "42 x 56", "uzunluk_mm": 420, "genislik_mm": 560},
            {"uzunluk_mm": 720, "genislik_mm": 560, "adet": 1},
        )
    parca = {"ham_metin": "42 x 40", "uzunluk_mm": 420, "genislik_mm": 400, "supheli": True}
    assert hafizadan_doldur(parca) is True
    assert parca["uzunluk_mm"] == 720
    assert parca["hafiza_vurus"] is True
