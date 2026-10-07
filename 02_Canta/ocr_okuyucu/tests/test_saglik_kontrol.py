from saglik_kontrol import _seviye, kara_kutu_senkron, metin_rapor, ocr_boru_hatti


def test_seviye_oncelik():
    assert _seviye("tamam", "uyari") == "uyari"
    assert _seviye("tamam", "hata", "uyari") == "hata"
    assert _seviye("tamam") == "tamam"


def test_kara_kutu_probe_senkron(gecici_veri_kok):
    ozet = kara_kutu_senkron(probe_yaz=True)
    assert ozet["durum"] == "tamam"
    assert ozet["probe_yazildi"] is True
    assert ozet["probe_okundu"] is True
    assert ozet["yol_eslesiyor"] is True
    assert (gecici_veri_kok / "hatalar" / "hata_kayitlari.log").is_file()
    metin = (gecici_veri_kok / "hatalar" / "hata_kayitlari.log").read_text(encoding="utf-8")
    assert "SAGLIK" in metin
    assert "saglik-senkron-" in metin


def test_ocr_bant_sozlugu_adimi():
    ozet = ocr_boru_hatti()
    assert ozet["adimlar"]["bant_sozlugu"]["bos"] == "0-0-0-0"
    assert ozet["adimlar"]["bant_sozlugu"]["cift_nokta"] == "1-1-0-0"
    assert ozet["adimlar"]["boru_hatti"] == "tamam"


def test_metin_rapor_baslik():
    veri = {
        "rapor": "Sağlık ve Gidişat",
        "zaman_utc": "2026-08-30T13:00:00+00:00",
        "genel": "tamam",
        "anlik": {
            "durum": "uyari",
            "port": 8765,
            "dinliyor": False,
            "hazir": False,
            "gemini_anahtar": False,
            "lan_adresleri": ["http://127.0.0.1:8765"],
            "kota": {"kalan": 40, "tavan": 40, "hafta": "2026-W35"},
        },
        "kaynak": {"durum": "tamam", "cekirdek": 8, "bellek": {}, "disk": {}},
        "ocr_boru_hatti": {"durum": "tamam", "adimlar": {}},
        "tunel": {"durum": "uyari", "not": "kapalı", "yerel_tcp": False, "harici_tunel_surecleri": []},
        "kara_kutu": {
            "durum": "tamam",
            "yol": "veri/hatalar/hata_kayitlari.log",
            "yol_eslesiyor": True,
            "probe_okundu": True,
            "boyut_bayt": 10,
        },
    }
    metin = metin_rapor(veri)
    assert "genel=tamam" in metin
    assert "Kara kutu" in metin
    assert "Kota kalan=40" in metin
