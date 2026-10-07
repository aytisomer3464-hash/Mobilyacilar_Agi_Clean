from arsiv import arsiv_kok, ham_taramayi_arsivle, kayit_klasoru
from gecmis_aktar import arsiv_kayitlarini_onarma


def _liste():
    return {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": "Kapak",
                "uzunluk_mm": 500,
                "genislik_mm": 300,
                "kalinlik_mm": 18,
                "adet": 1,
                "malzeme": "",
                "not": "",
                "supheli": False,
            }
        ],
        "genel_notlar": [],
    }


def test_ham_olan_kayit_duzeltilmise_kopyalanir(gecici_veri_kok):
    kayit_id = ham_taramayi_arsivle(b"foto-goc", _liste(), "eski.jpg")
    klasor = kayit_klasoru(kayit_id)
    duz = klasor / "duzeltilmis.json"
    if duz.exists():
        duz.unlink()
    ozet = arsiv_kayitlarini_onarma()
    assert ozet["onarilan"] >= 1
    assert duz.exists()
    assert arsiv_kok().exists()
