from PIL import Image

from yerel_ocr import (
    _rapidocr_satirlari,
    cm_mm_cevir,
    ocr_icin_gorsel,
    ocr_okuma,
    satir_ayristir,
    satir_giris,
    yerel_yeterli_mi,
)


def test_cm_mm_cevir():
    assert cm_mm_cevir(83) == 830
    assert cm_mm_cevir(49.8) == 498
    assert cm_mm_cevir(1546) == 1546


def test_satir_x_olcu():
    parca = satir_ayristir("M1 Sol dikme 72 x 56 adet 2 MDFLAM", 0.95)
    assert parca is not None
    assert parca["modul_kodu"] == "M1"
    assert parca["uzunluk_mm"] == 720
    assert parca["genislik_mm"] == 560
    assert parca["adet"] == 2
    assert parca["guven"] >= 0.75
    assert "dikme" in parca["parca_adi"].lower()


def test_satir_olcusuz_none():
    assert satir_ayristir("sadece not", 0.9) is None


def test_satir_giris_tek_kapi():
    parca, yazi = satir_giris("M1 Raf 72 x 56 adet 1", 0.95)
    assert parca is not None and yazi is None
    parca, yazi = satir_giris("KAPAK lake beyaz", 0.9)
    assert parca is None and yazi is not None
    assert yazi["kategori"] == "Kapak"


def test_yerel_yeterli_esik():
    iyi = [satir_ayristir(f"M1 raf 80 x 40 adet 1", 0.95) for _ in range(3)]
    assert all(p is not None for p in iyi)
    assert yerel_yeterli_mi(iyi)
    assert not yerel_yeterli_mi([])
    zayif = [satir_ayristir("70 x 40", 0.4)]
    assert not yerel_yeterli_mi(zayif)


def test_rapidocr_numpy_boxes():
    import numpy as np

    class Sahte:
        boxes = np.array([[[0.0, 0.0], [10.0, 0.0], [10.0, 8.0], [0.0, 8.0]]], dtype=np.float32)
        txts = ("72 x 56 adet 2",)
        scores = (0.91,)

    satirlar = _rapidocr_satirlari(Sahte())
    assert len(satirlar) == 1
    assert satirlar[0][1] == "72 x 56 adet 2"
    assert satirlar[0][2] == 0.91


def test_ocr_okuma_motor_tek_cagri(monkeypatch):
    cagrildi = {"n": 0}

    class Motor:
        def __call__(self, _gorsel, **_k):
            cagrildi["n"] += 1
            return []

    monkeypatch.setattr("yerel_ocr._ocr_motoru", lambda: Motor())
    parcalar, yazilar = ocr_okuma(Image.new("RGB", (32, 32), (255, 255, 255)))
    assert cagrildi["n"] == 1
    assert parcalar == []
    assert yazilar == []


def test_ocr_icin_gorsel_rgb():
    img = Image.new("RGB", (80, 60), (180, 180, 170))
    out = ocr_icin_gorsel(img)
    assert out.mode == "RGB"
    assert out.size == img.size
