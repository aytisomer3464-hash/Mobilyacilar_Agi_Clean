from dogrulama import kesim_listesi_sanity_kontrol


def test_dikme_uyumsuzlugu_silmez():
    test_verisi = {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": "Sol Dikme",
                "uzunluk_mm": 720.0,
                "genislik_mm": 560.0,
                "kalinlik_mm": 18.0,
                "adet": 1,
                "malzeme": "MDFLAM",
                "not": "Test",
            },
            {
                "modul_kodu": "M1",
                "parca_adi": "Sağ Dikme",
                "uzunluk_mm": 710.0,
                "genislik_mm": 560.0,
                "kalinlik_mm": 18.0,
                "adet": 1,
                "malzeme": "MDFLAM",
                "not": "Test",
            },
        ],
        "genel_notlar": ["İlişkisel test"],
    }
    sonuc = kesim_listesi_sanity_kontrol(test_verisi)
    assert sonuc is not None
    assert len(sonuc["kesim_listesi"]) == 2
    boylar = {p["parca_adi"]: p for p in sonuc["kesim_listesi"]}
    assert boylar["Sağ Dikme"]["supheli"] is True
    assert any("dikme boyları" in n for n in sonuc["genel_notlar"])


def test_adet_float_kabul():
    veri = {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": "Raf",
                "uzunluk_mm": 500,
                "genislik_mm": 300,
                "kalinlik_mm": 18,
                "adet": 1.0,
                "malzeme": "Beyaz",
                "not": "",
            }
        ],
        "genel_notlar": [],
    }
    sonuc = kesim_listesi_sanity_kontrol(veri)
    assert sonuc is not None
    assert sonuc["kesim_listesi"][0]["adet"] == 1
    assert sonuc["kesim_listesi"][0]["supheli"] is False


def test_sinir_disi_silinmez_isaretlenir():
    veri = {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": "Hatalı",
                "uzunluk_mm": 9000,
                "genislik_mm": 300,
                "kalinlik_mm": 18,
                "adet": 1,
                "malzeme": "Beyaz",
                "not": "",
                "kutu": [10, 20, 40, 12],
            }
        ],
        "genel_notlar": [],
    }
    sonuc = kesim_listesi_sanity_kontrol(veri)
    assert sonuc is not None
    assert len(sonuc["kesim_listesi"]) == 1
    assert sonuc["kesim_listesi"][0]["supheli"] is True
    assert sonuc["kesim_listesi"][0]["kutu"] == [10.0, 20.0, 40.0, 12.0]


def test_liste_onayli_mi():
    from dogrulama import liste_onayli_mi

    assert liste_onayli_mi({"kesim_listesi": [{"supheli": False}]}) is True
    assert liste_onayli_mi({"kesim_listesi": [{"supheli": True}]}) is False
    assert liste_onayli_mi({"kesim_listesi": [{"okunamadi": True}]}) is False
    assert liste_onayli_mi({"usta_onay": {"gerekli": True}, "kesim_listesi": []}) is False


def test_kalinlik_standart_yuvarlama():
    veri = {
        "kesim_listesi": [
            {
                "modul_kodu": "M2",
                "parca_adi": "Yan",
                "uzunluk_mm": 720,
                "genislik_mm": 400,
                "kalinlik_mm": 17.7,
                "adet": 2,
                "malzeme": "",
                "not": "",
            }
        ],
        "genel_notlar": [],
    }
    sonuc = kesim_listesi_sanity_kontrol(veri)
    assert sonuc["kesim_listesi"][0]["kalinlik_mm"] == 18.0
