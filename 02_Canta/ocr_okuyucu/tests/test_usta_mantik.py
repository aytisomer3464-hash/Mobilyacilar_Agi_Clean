from usta_mantik import kesim_hamini_duzelt, token_mm, ustayi_uygula
from yerel_ocr import cm_mm_cevir, satir_ayristir


def test_token_mm_ondalik_kaydirma():
    assert token_mm("69.4") == 694
    assert token_mm("69,4") == 694
    assert token_mm("49.8") == 498
    assert token_mm("83") == 830
    assert token_mm("1546") == 1546
    assert token_mm("560.0") == 560
    assert token_mm("69.45") == 694.5
    assert token_mm("69..4") == 694


def test_cm_mm_cevir_ondalik_float():
    assert cm_mm_cevir(69.4) == 694
    assert cm_mm_cevir(49.8) == 498
    assert cm_mm_cevir(56.1) == 561
    assert cm_mm_cevir(83) == 830
    assert cm_mm_cevir(1546) == 1546


def test_satir_kesirli_olcu():
    parca = satir_ayristir("M1 Raf 69.4 x 56 adet 1 MDFLAM", 0.95)
    assert parca is not None
    assert parca["uzunluk_mm"] == 694
    assert parca["genislik_mm"] == 560


def test_rakam_1_4_7_sayfa_baglami():
    liste = [
        {
            "modul_kodu": "M1",
            "parca_adi": "Sol Dikme",
            "uzunluk_mm": 720,
            "genislik_mm": 560,
            "kalinlik_mm": 18,
            "adet": 1,
            "guven": 0.95,
            "ham_metin": "72 x 56",
            "not": "72 x 56",
        },
        {
            "modul_kodu": "M1",
            "parca_adi": "Sag Dikme",
            "uzunluk_mm": 720,
            "genislik_mm": 560,
            "kalinlik_mm": 18,
            "adet": 1,
            "guven": 0.94,
            "ham_metin": "72 x 56",
            "not": "72 x 56",
        },
        {
            "modul_kodu": "M1",
            "parca_adi": "Ara Dikme",
            "uzunluk_mm": 420,
            "genislik_mm": 560,
            "kalinlik_mm": 18,
            "adet": 1,
            "guven": 0.55,
            "supheli": True,
            "ham_metin": "42 x 56",
            "not": "42 x 56",
        },
    ]
    sonuc = ustayi_uygula(liste)
    ara = next(p for p in sonuc if "Ara" in p["parca_adi"])
    assert ara["uzunluk_mm"] == 420
    assert ara["supheli"] is True


def test_mobilya_standart_derinlik():
    liste = [
        {
            "modul_kodu": "M1",
            "parca_adi": "Raf",
            "uzunluk_mm": 800,
            "genislik_mm": 558,
            "kalinlik_mm": 18,
            "adet": 2,
            "guven": 0.9,
            "ham_metin": "80 x 55.8",
        }
    ]
    sonuc = ustayi_uygula(liste)
    assert sonuc[0]["genislik_mm"] == 558


def test_kapak_bosluk_korunur():
    liste = [
        {
            "modul_kodu": "M1",
            "parca_adi": "Sol Dikme",
            "uzunluk_mm": 720,
            "genislik_mm": 560,
            "kalinlik_mm": 18,
            "adet": 1,
            "guven": 0.9,
            "ham_metin": "72 x 56",
        },
        {
            "modul_kodu": "M1",
            "parca_adi": "Kapak",
            "uzunluk_mm": 718,
            "genislik_mm": 396,
            "kalinlik_mm": 18,
            "adet": 2,
            "guven": 0.9,
            "ham_metin": "71.8 x 39.6",
        },
    ]
    sonuc = ustayi_uygula(liste)
    kapak = next(p for p in sonuc if p["parca_adi"] == "Kapak")
    assert kapak["uzunluk_mm"] == 718


def test_kapak_buyuk_sapma_hizalanir():
    liste = [
        {
            "modul_kodu": "M1",
            "parca_adi": "Sol Dikme",
            "uzunluk_mm": 720,
            "genislik_mm": 560,
            "kalinlik_mm": 18,
            "adet": 1,
            "guven": 0.95,
            "ham_metin": "72 x 56",
        },
        {
            "modul_kodu": "M1",
            "parca_adi": "Kapak",
            "uzunluk_mm": 120,
            "genislik_mm": 396,
            "kalinlik_mm": 18,
            "adet": 2,
            "guven": 0.5,
            "supheli": True,
            "ham_metin": "12 x 39.6",
        },
    ]
    ham = {"kesim_listesi": liste, "genel_notlar": []}
    sonuc = kesim_hamini_duzelt(ham)
    assert sonuc is not None
    kapak = next(p for p in sonuc["kesim_listesi"] if p["parca_adi"] == "Kapak")
    assert kapak["uzunluk_mm"] == 120
    assert kapak["supheli"] is True
    assert any("onay" in n.lower() or "tahmin" in n.lower() for n in sonuc["genel_notlar"])


def test_bant_sozlugu_varsayilan_sifir():
    from usta_mantik import bant_sozlugu_kod

    assert bant_sozlugu_kod("") == "0-0-0-0"
    assert bant_sozlugu_kod("720 x 400 adet 2") == "0-0-0-0"
    assert bant_sozlugu_kod("dört kenar") == "1-1-1-1"
    assert bant_sozlugu_kod("çift nokta") == "1-1-0-0"
    assert bant_sozlugu_kod("201 x 43 I") == "1-0-0-0"
    assert bant_sozlugu_kod("201 x 43 adet 2 =") == "0-0-1-1"
    assert bant_sozlugu_kod("201 x 43 = 2") == "0-0-0-0"


def test_usta_hata_orijinali_korur(monkeypatch):
    import usta_mantik

    def patlat(*_a, **_k):
        raise RuntimeError("kırık")

    monkeypatch.setattr(usta_mantik, "sayfa_rakam_frekansi", patlat)
    ham = [{"parca_adi": "Raf", "uzunluk_mm": 800, "genislik_mm": 400, "guven": 0.9}]
    assert ustayi_uygula(ham) is ham
