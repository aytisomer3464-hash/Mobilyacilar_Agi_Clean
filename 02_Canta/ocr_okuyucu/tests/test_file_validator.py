import hashlib
from io import BytesIO

import pytest
from PIL import Image

from file_validator import DosyaDogrulamaHatasi, dosya_dogrula, imza_turu
from on_isleme import GorselBicimHatasi


def _gorsel(bicim: str, boyut=(40, 30)) -> bytes:
    tampon = BytesIO()
    Image.new("RGB", boyut, (200, 120, 40)).save(tampon, format=bicim)
    return tampon.getvalue()


def test_jpeg_gecer_ve_ozet_dogru():
    veri = _gorsel("JPEG")
    sonuc = dosya_dogrula(veri, "olcu.jpg", "image/jpeg")
    assert sonuc.tur == "jpeg"
    assert (sonuc.genislik, sonuc.yukseklik) == (40, 30)
    assert sonuc.sha256 == hashlib.sha256(veri).hexdigest()
    assert sonuc.uyarilar == ()


def test_png_gecer():
    sonuc = dosya_dogrula(_gorsel("PNG"), "olcu.PNG", "image/png; charset=binary")
    assert sonuc.tur == "png"
    assert sonuc.uyarilar == ()


def test_bos_dosya_400():
    with pytest.raises(DosyaDogrulamaHatasi) as hata:
        dosya_dogrula(b"")
    assert hata.value.durum_kodu == 400


def test_buyuk_dosya_413():
    with pytest.raises(DosyaDogrulamaHatasi) as hata:
        dosya_dogrula(_gorsel("PNG"), maks_bayt=100)
    assert hata.value.durum_kodu == 413


def test_sahte_uzanti_metin_415():
    with pytest.raises(DosyaDogrulamaHatasi) as hata:
        dosya_dogrula(b"MZ\x90\x00 bu bir exe", "kesim.jpg", "image/jpeg")
    assert hata.value.durum_kodu == 415


def test_imza_dogru_govde_bozuk_415():
    with pytest.raises(DosyaDogrulamaHatasi) as hata:
        dosya_dogrula(b"\xff\xd8\xff" + b"\x00" * 200)
    assert hata.value.durum_kodu == 415


def test_kesik_png_415():
    with pytest.raises(DosyaDogrulamaHatasi) as hata:
        dosya_dogrula(_gorsel("PNG", (200, 200))[:-30])
    assert hata.value.durum_kodu == 415


def test_piksel_tavani_413():
    with pytest.raises(DosyaDogrulamaHatasi) as hata:
        dosya_dogrula(_gorsel("PNG", (20, 20)), maks_piksel=100)
    assert hata.value.durum_kodu == 413


def test_uzanti_ve_tur_celiskisi_uyari_verir_reddetmez():
    sonuc = dosya_dogrula(_gorsel("PNG"), "foto.jpg", "image/jpeg")
    assert sonuc.tur == "png"
    assert len(sonuc.uyarilar) == 2


def test_mevcut_except_blogu_yakalar():
    with pytest.raises(GorselBicimHatasi):
        dosya_dogrula(b"GIF89a")


def test_imza_turu():
    assert imza_turu(_gorsel("JPEG")) == "jpeg"
    assert imza_turu(_gorsel("PNG")) == "png"
    assert imza_turu(b"GIF89a") is None


def test_tarama_kilidi_cift_istek_409():
    from file_validator import tarama_kilidi

    with tarama_kilidi("abc"):
        with pytest.raises(DosyaDogrulamaHatasi) as hata:
            with tarama_kilidi("abc"):
                pass
        assert hata.value.durum_kodu == 409
    with tarama_kilidi("abc"):
        pass


def test_tarama_kilidi_hata_sonrasi_acilir():
    from file_validator import tarama_kilidi

    try:
        with tarama_kilidi("xyz"):
            raise RuntimeError("ocr dustu")
    except RuntimeError:
        pass
    with tarama_kilidi("xyz"):
        pass
