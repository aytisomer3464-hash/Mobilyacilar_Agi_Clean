from io import BytesIO

from PIL import Image, ImageDraw

from on_isleme import (
    jpeg_baytlari,
    gorseli_on_isle,
    hough_deskew,
    kagidi_kirp,
    kutu_bbox,
    kutu_sikistir,
    laplacian_varyans,
    kutu_kirp,
)


def _ornek_gorsel() -> Image.Image:
    img = Image.new("RGB", (400, 300), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle((40, 30, 360, 270), outline=(0, 0, 0), width=4)
    draw.line((60, 80, 340, 80), fill=(0, 0, 0), width=2)
    draw.text((70, 100), "72 x 56", fill=(0, 0, 0))
    return img


def test_jpeg_baytlari():
    data = jpeg_baytlari(_ornek_gorsel(), maksimum_kenar=200, kalite=80)
    assert data[:2] == b"\xff\xd8"
    acilan = Image.open(BytesIO(data))
    assert max(acilan.size) <= 200


def test_on_isleme_boyut_korur():
    islenmis = gorseli_on_isle(_ornek_gorsel())
    assert islenmis.mode == "RGB"
    assert islenmis.width > 50 and islenmis.height > 50


def test_laplacian_sayi():
    varyans = laplacian_varyans(_ornek_gorsel())
    assert varyans >= 0


def test_kutu_kirp():
    img = _ornek_gorsel()
    kirpik = kutu_kirp(img, [50, 90, 150, 40], pay=4)
    assert kirpik.width > 0 and kirpik.height > 0


def test_kutu_bbox_dort_nokta():
    kutu = [[10, 20], [80, 20], [80, 50], [10, 50]]
    assert kutu_bbox(kutu) == [10.0, 20.0, 70.0, 30.0]


def test_kagidi_kirp_arka_plan_keser():
    img = Image.new("RGB", (500, 400), (20, 20, 20))
    draw = ImageDraw.Draw(img)
    draw.rectangle((80, 50, 420, 350), fill=(250, 250, 250), outline=(0, 0, 0), width=6)
    kirpik = kagidi_kirp(img)
    assert kirpik.mode == "RGB"
    assert kirpik.width < img.width
    assert kirpik.height < img.height
    pikseller = list(kirpik.getdata())
    acik = sum(1 for r, g, b in pikseller if r + g + b > 600)
    assert acik / len(pikseller) > 0.6


def test_kagidi_kirp_ahsap_masa_yamuk():
    """Koyu masa üstünde yamuk kâğıt: dört köşe + perspektif, zemin kalmaz."""
    import numpy as np
    import cv2

    zemin = np.full((480, 640, 3), (88, 52, 28), dtype=np.uint8)
    koseler = np.array([[110, 70], [530, 45], [590, 410], [70, 430]], dtype=np.int32)
    cv2.fillConvexPoly(zemin, koseler, (248, 244, 232))
    cv2.polylines(zemin, [koseler], True, (30, 24, 18), 4)
    kirpik = kagidi_kirp(Image.fromarray(zemin))
    assert kirpik.mode == "RGB"
    assert kirpik.width < 640
    assert kirpik.height < 480
    assert kirpik.width > 200
    assert kirpik.height > 160
    ortalama = float(np.asarray(kirpik).mean())
    assert ortalama > 170


def test_kagit_dortgen_kisa_devre(monkeypatch):
    """İlk yeterli skorda sonraki maske üretilmez."""
    import numpy as np
    import on_isleme
    from on_isleme import _kagit_dortgeni_bul

    img = np.full((200, 260, 3), (30, 20, 12), dtype=np.uint8)
    img[30:170, 40:220] = (250, 246, 236)
    sayac = {"n": 0}

    def akis(_analiz):
        sayac["n"] += 1
        maske = np.zeros((_analiz.shape[0], _analiz.shape[1]), dtype=np.uint8)
        maske[30:170, 40:220] = 255
        yield maske
        sayac["n"] += 1
        raise AssertionError("kısa devre çalışmadı")

    monkeypatch.setattr(on_isleme, "_kagit_maske_akisi", akis)
    dort = _kagit_dortgeni_bul(img)
    assert dort is not None
    assert sayac["n"] == 1


def test_kagidi_kirp_dort_kose_govde():
    import numpy as np
    from on_isleme import _govdeden_dort_kose

    govde = np.array([[[0, 0]], [[80, 2]], [[90, 40]], [[88, 70]], [[3, 68]]], dtype=np.int32)
    dort = _govdeden_dort_kose(govde)
    assert dort is not None
    assert dort.shape == (4, 2)


def test_kutu_sikistir_boslugu_keser():
    img = Image.new("RGB", (200, 100), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle((40, 30, 90, 48), fill=(0, 0, 0))
    sik = kutu_sikistir(img, [10, 10, 160, 70])
    assert sik is not None
    x, y, w, h = sik
    assert x >= 10
    assert y >= 10
    assert x <= 42
    assert y <= 32
    assert x + w >= 88
    assert y + h >= 46
    assert w < 150
    assert h < 65


def test_hough_deskew_houghlines_n14(monkeypatch):
    """Eski `cizgiler[:, 0]` unpack hatası: HoughLinesP şekli (N, 1, 4)."""
    import numpy as np
    import on_isleme

    monkeypatch.setattr(
        on_isleme.cv2,
        "HoughLinesP",
        lambda *_a, **_k: np.array([[[10, 20, 180, 22]]], dtype=np.int32),
    )
    img = _ornek_gorsel()
    sonuc = hough_deskew(img)
    assert sonuc.mode == "RGB"
    assert sonuc.size == img.size


def test_hough_deskew_houghlines_none(monkeypatch):
    import on_isleme

    monkeypatch.setattr(on_isleme.cv2, "HoughLinesP", lambda *_a, **_k: None)
    img = _ornek_gorsel()
    assert hough_deskew(img) is img


def test_hough_deskew_houghlines_bos(monkeypatch):
    import numpy as np
    import on_isleme

    monkeypatch.setattr(
        on_isleme.cv2,
        "HoughLinesP",
        lambda *_a, **_k: np.zeros((0, 1, 4), dtype=np.int32),
    )
    img = _ornek_gorsel()
    assert hough_deskew(img) is img
