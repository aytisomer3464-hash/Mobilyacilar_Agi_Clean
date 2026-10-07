from metin_yazilar import yazi_ayristir
from recete import akilli_recete_olustur
from yerel_ocr import satir_ayristir


def test_kapak_yazisi():
    yazi = yazi_ayristir("KAPAK lake beyaz", 0.9)
    assert yazi is not None
    assert yazi["kategori"] == "Kapak"
    assert yazi["malzeme"]


def test_dolap_ve_defter():
    dolap = yazi_ayristir("Dolap gövde", 0.9)
    defter = yazi_ayristir("Defter: Ahmet sipariş", 0.9)
    assert dolap["kategori"] == "Gövde"
    assert defter["tur"] == "defter"


def test_olcu_satiri_yazi_degil():
    assert yazi_ayristir("72 x 56 dikme") is None


def test_kapak_olcu_kategori():
    parca = satir_ayristir("Kapak 45 x 60 adet 2 akrilik", 0.95)
    assert parca is not None
    assert parca.get("kategori") == "Kapak"


def test_baslik_18mm_kapak():
    from metin_yazilar import basliklari_uygula
    sonuc = basliklari_uygula(
        {"kesim_listesi": [{"parca_adi": "Kapak sol", "uzunluk_mm": 450, "genislik_mm": 600, "adet": 2}]},
        [{"metin": "18 mm kapak lake"}],
    )
    parca = sonuc["kesim_listesi"][0]
    assert parca["kategori"] == "Kapak"
    assert parca["kalinlik_mm"] == 18.0
    assert sonuc["usta_onay"]["gerekli"] is False


def test_baslik_yok_varsayilan_onay():
    from metin_yazilar import basliklari_uygula
    sonuc = basliklari_uygula(
        {"kesim_listesi": [{"parca_adi": "Parça", "uzunluk_mm": 720, "genislik_mm": 400, "adet": 1}]},
        [],
    )
    parca = sonuc["kesim_listesi"][0]
    assert parca["kategori"] == "Gövde"
    assert parca["kalinlik_mm"] == 18.0
    assert parca["onay_bekliyor"] is True
    assert sonuc["usta_onay"]["gerekli"] is True


def test_recete_gruplar():
    recete = akilli_recete_olustur(
        [{"kategori": "Kapak", "parca_adi": "Kapak", "adet": 2, "malzeme": "lake"}],
        [{"tur": "defter", "kategori": "Defter", "metin": "Sipariş 12"}],
    )
    assert "Kapak" in recete["kategoriler"]
    assert recete["defter_notlari"]
