from kenar_bant import bant_ayristir, bant_kodu_dogrula, parcaya_bant_yaz
from metin_yazilar import yazi_ayristir
from recete import akilli_recete_olustur


def test_kod_ve_pvc():
    assert bant_kodu_dogrula("1-0-0-0") == "1-0-0-0"
    nesne = bant_ayristir("1-0-0-0 PVC 0.4 mm")
    assert nesne["kod"] == "1-0-0-0"
    assert nesne["pvc_mm"] == 0.4
    assert nesne["boy_bant"] == 1
    assert nesne["en_bant"] == 0
    assert nesne["sema"] == "1 Boy bant"
    assert "1. uzun kenar" in nesne["rapor"]


def test_nokta_kodlari():
    assert bant_ayristir("tek nokta")["kod"] == "1-0-0-0"
    assert bant_ayristir("çift nokta")["kod"] == "1-1-0-0"
    assert bant_ayristir("bantsız")["kod"] == "0-0-0-0"


def test_isaretsiz_bantsiz():
    assert bant_ayristir("")["kod"] == "0-0-0-0"
    assert bant_ayristir("720 x 400")["kod"] == "0-0-0-0"
    assert bant_ayristir("Kapak MDFLAM adet 2")["kod"] == "0-0-0-0"


def test_sekil_sozlugu():
    assert bant_ayristir("tam kutu 720 x 400")["kod"] == "1-1-1-1"
    assert bant_ayristir("çerçeve")["kod"] == "1-1-1-1"
    assert bant_ayristir("C şekli")["kod"] == "1-0-1-1"
    assert bant_ayristir("U şekli")["kod"] == "1-0-1-1"
    assert bant_ayristir("üç kenar")["kod"] == "1-0-1-1"
    assert bant_ayristir("L şekli")["kod"] == "1-0-1-0"


def test_parcaya_sayfa_yiginlamaz():
    parca = {"parca_adi": "Kapak", "not": "1-0-0-0", "adet": 1}
    yazilar = [{"tur": "defter", "metin": "sipariş notu " + ("x" * 80)} for _ in range(12)]
    parcaya_bant_yaz(parca, yazilar)
    assert parca["bant"]["kod"] == "1-0-0-0"
    assert "xxxx" not in parca["bant"]["rapor"]


def test_parcaya_ve_recete():
    parca = {"parca_adi": "Kapak", "not": "1-1-0-0 2 mm pvc", "adet": 2}
    parcaya_bant_yaz(parca)
    assert parca["bant"]["kod"] == "1-1-0-0"
    recete = akilli_recete_olustur([parca], [{"tur": "bant", "metin": "Kenar bant 1-1-0-0"}])
    assert recete["kenar_bant"]["kod_dagilimi"]["1-1-0-0"] == 2
    assert recete["kenar_bant"]["satirlar"]
    assert "Kapak" in recete["kenar_bant"]["satirlar"][-1]


def test_akilli_pvc_varsayilan():
    kapak = {"parca_adi": "Kapak", "kategori": "Kapak", "not": "1-0-0-0"}
    parcaya_bant_yaz(kapak)
    assert kapak["bant"]["pvc_mm"] == 0.8
    govde = {"parca_adi": "Yan dikme", "kategori": "Gövde", "not": "1-0-0-0"}
    parcaya_bant_yaz(govde)
    assert govde["bant"]["pvc_mm"] == 0.4


def test_yazi_bant():
    yazi = yazi_ayristir("1-0-0-0", 0.9)
    assert yazi is not None
    assert yazi["tur"] == "bant"


def test_ondalik_olcu_bant_degil():
    assert bant_ayristir("720 x 400 57.4")["kod"] == "0-0-0-0"
    assert bant_ayristir("720 x 400 49,8")["kod"] == "0-0-0-0"


def test_nokta_konumlari():
    assert bant_ayristir(".720 x 400")["kod"] == "1-0-0-0"
    assert bant_ayristir("·720 x ·400")["kod"] == "1-0-1-0"
    assert bant_ayristir("·720 x 400 ·560")["kod"] == "1-0-1-0"
    assert bant_ayristir("··720 x 400")["kod"] == "1-1-0-0"


def test_cizgi_notasyonu():
    assert bant_ayristir("720 x 400 x 2 |")["kod"] == "1-0-0-0"
    assert bant_ayristir("720 x 400 x 2 ||")["kod"] == "1-1-0-0"
    assert bant_ayristir("720 x 400 x 2 | —")["kod"] == "1-0-1-0"
    assert bant_ayristir("720 x 400 x 2 || --")["kod"] == "1-1-1-1"
    assert bant_ayristir("720 x 400 - kapak")["kod"] == "0-0-0-0"


def test_olcu_adet_sonrasi_i():
    assert bant_ayristir("88*76-1-I")["kod"] == "1-0-0-0"
    assert bant_ayristir("88*76-1-l")["kod"] == "1-0-0-0"
    assert bant_ayristir("88*76-1-1")["kod"] == "1-0-0-0"
    assert bant_ayristir("88*76-1")["kod"] == "0-0-0-0"
    assert bant_ayristir("80 x 40 - 2 - E")["kod"] == "1-0-1-1"
    assert bant_ayristir("80 x 40 adet 2 E")["kod"] == "1-0-1-1"
    assert bant_ayristir("39 x 45 - 12 --")["kod"] == "0-0-0-0"
    assert bant_ayristir("39 x 45 - 12 - -")["kod"] == "0-0-0-0"


def test_sag_sutun_usta_sembolleri():
    assert bant_ayristir("201 x 43 I")["sema"] == "1 Boy bant"
    assert bant_ayristir("201 x 43 L")["sema"] == "1 Boy + 1 En bant"
    assert bant_ayristir("201 x 43 C")["sema"] == "1 Boy + 2 En bant"
    assert bant_ayristir("201 x 43 ||")["sema"] == "2 Boy bant"
    assert bant_ayristir("201 x 43 adet 2 =")["sema"] == "2 En bant"
    assert bant_ayristir("201 x 43 = 2")["kod"] == "0-0-0-0"
    assert bant_ayristir("201 x 43 =")["kod"] == "0-0-0-0"
    assert bant_ayristir("201 x 43 =")["emin"] is False
    assert bant_ayristir("201 x 43 □")["sema"] == "4 Taraf / Tam Bant"
    assert bant_ayristir("Kapak | 201 x 43")["kod"] == "0-0-0-0"
    assert bant_ayristir("201 x 43 | 2")["kod"] == "0-0-0-0"
    assert bant_ayristir("201 x 43")["sema"] == "Bantsız (0)"


def test_olcu_ustu_nokta_kutulari():
    from kenar_bant import parcaya_bant_yaz

    olcu = [[20, 40], [180, 40], [180, 58], [20, 58]]
    boy_nokta = [[28, 22], [36, 22], [36, 30], [28, 30]]
    en_nokta = [[130, 20], [138, 20], [138, 28], [130, 28]]
    parca = {
        "parca_adi": "Raf",
        "ham_metin": "201 x 43",
        "not": "201 x 43",
        "kutu": olcu,
    }
    parcaya_bant_yaz(
        parca,
        kutular=[
            {"metin": "201 x 43", "kutu": olcu},
            {"metin": "·", "kutu": boy_nokta},
            {"metin": "·", "kutu": en_nokta},
        ],
    )
    assert parca["bant"]["kod"] == "1-0-1-0"
    assert parca["bant"]["boy_bant"] == 1
    assert parca["bant"]["en_bant"] == 1

    cift_boy = [[28, 18], [44, 18], [44, 28], [28, 28]]
    parca2 = {"parca_adi": "Kapak", "ham_metin": "201 x 43", "not": "201 x 43", "kutu": olcu}
    parcaya_bant_yaz(parca2, kutular=[{"metin": "··", "kutu": cift_boy}])
    assert parca2["bant"]["kod"] == "1-1-0-0"


def test_ocr_ham_gemini_dort_kenar_silinir():
    parca = {"ham_metin": "720 x 400", "parca_adi": "Raf", "bant": {"kod": "1-1-1-1", "pvc_mm": 0.4}}
    parcaya_bant_yaz(parca)
    assert parca["bant"]["kod"] == "0-0-0-0"


def test_led_duzeltme_kodu_kalir():
    parca = {"parca_adi": "Kapak", "not": "", "bant": {"kod": "1-1-0-0", "pvc_mm": 0.8}}
    parcaya_bant_yaz(parca)
    assert parca["bant"]["kod"] == "1-1-0-0"
    assert parca["bant"]["pvc_mm"] == 0.8


def test_gemini_liste_isaretsiz_sifir():
    from kenar_bant import gemini_listesine_bant_yaz

    veri = {
        "kesim_listesi": [
            {"parca_adi": "Raf", "not": "720 x 400", "bant": {"kod": "1-1-1-1", "pvc_mm": 0.4}},
        ]
    }
    gemini_listesine_bant_yaz(veri)
    assert veri["kesim_listesi"][0]["bant"]["kod"] == "0-0-0-0"
