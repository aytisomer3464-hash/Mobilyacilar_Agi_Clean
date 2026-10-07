from pathlib import Path

import hata_kayit
from hata_kayit import OCR_YEREL, OKUMA, hata_log_yolu, hata_yaz


def test_hata_yaz_zaman_kod_aciklama(gecici_veri_kok):
    hata_yaz(OCR_YEREL, "RapidOCR deneme hatası", RuntimeError("motor yok"))
    yol = hata_log_yolu()
    assert yol.parent == gecici_veri_kok / "hatalar"
    metin = yol.read_text(encoding="utf-8")
    assert OCR_YEREL in metin
    assert "RapidOCR deneme hatası" in metin
    assert "RuntimeError" in metin
    assert "motor yok" in metin
    assert "T" in metin.split(" | ", 1)[0]


def test_hata_yaz_istisnasiz(gecici_veri_kok):
    hata_yaz("KOTA", "kota tükendi bildirimi")
    metin = hata_log_yolu().read_text(encoding="utf-8")
    assert "KOTA" in metin
    assert "kota tükendi bildirimi" in metin


def test_hata_yaz_dosya_hatasinda_yukseltmez(monkeypatch, gecici_veri_kok, capsys):
    def patlat():
        raise OSError("disk dolu")

    monkeypatch.setattr(hata_kayit, "hata_log_yolu", patlat)
    hata_yaz("SUNUCU", "bu yazılamaz", ValueError("x"))
    err = capsys.readouterr().err
    assert "SUNUCU" in err
    assert "bu yazılamaz" in err


def test_hata_dizini_olusturulur(gecici_veri_kok):
    assert not (gecici_veri_kok / "hatalar").exists()
    hata_yaz("DOSYA", "klasör yokken yaz")
    assert Path(hata_log_yolu()).is_file()


def test_hata_yaz_flush_okuma(gecici_veri_kok):
    hata_yaz(OKUMA, "anlik okuma kaydi")
    metin = hata_log_yolu().read_text(encoding="utf-8")
    assert OKUMA in metin
    assert "anlik okuma kaydi" in metin
    assert Path(hata_log_yolu()).is_file()
