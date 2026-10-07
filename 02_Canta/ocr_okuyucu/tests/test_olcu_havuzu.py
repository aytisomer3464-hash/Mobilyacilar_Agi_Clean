from io import BytesIO

from PIL import Image

from olcu_havuzu import havuz_ozeti, havuzdan_oku, havuza_yaz


def _jpeg_bayt() -> bytes:
    buf = BytesIO()
    Image.new("RGB", (48, 32), (255, 255, 255)).save(buf, format="JPEG")
    return buf.getvalue()


def test_havuz_yaz_oku_kota_yok(gecici_veri_kok):
    veri = _jpeg_bayt()
    liste = {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": "Raf",
                "uzunluk_mm": 800,
                "genislik_mm": 400,
                "kalinlik_mm": 18,
                "adet": 1,
            }
        ],
        "genel_notlar": [],
    }
    assert havuzdan_oku(veri) is None
    havuza_yaz(veri, liste, "kayit-test")
    hit = havuzdan_oku(veri)
    assert hit is not None
    assert hit["okuma_kaynak"] == "havuz"
    assert hit["kesim_listesi"][0]["parca_adi"] == "Raf"
    assert hit.get("kayit_id") == "kayit-test"
    ozet = havuz_ozeti()
    assert ozet["kayit"] >= 1
    assert ozet["tavan"] == 80
    assert 0 <= ozet["doluluk_oran"] <= 100


def test_havuz_liste_ara_sil(gecici_veri_kok):
    from olcu_havuzu import havuz_listesi, havuz_sil

    veri = _jpeg_bayt()
    liste = {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": "Kapak",
                "uzunluk_mm": 720,
                "genislik_mm": 400,
                "kalinlik_mm": 18,
                "adet": 2,
            }
        ],
        "genel_notlar": [],
    }
    havuza_yaz(veri, liste, "kayit-kapak")
    hepsi = havuz_listesi()
    assert hepsi["liste"]
    assert hepsi["liste"][0]["ozet"].startswith("Kapak")
    assert havuz_listesi("kapak")["liste"]
    assert havuz_listesi("olmayan-xyz")["liste"] == []
    ad = hepsi["liste"][0]["id"]
    kalan = havuz_sil(ad)
    assert kalan["liste"] == []
    assert havuzdan_oku(veri) is None


def test_havuz_sil_gecersiz():
    import pytest
    from olcu_havuzu import havuz_sil

    with pytest.raises(ValueError):
        havuz_sil("../secret.json")
