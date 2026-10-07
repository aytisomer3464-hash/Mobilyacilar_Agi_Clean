from PIL import Image, ImageDraw

from bant_cizgi import sag_sutun_cizgi
from kenar_bant import parcaya_bant_yaz


def _kagit(ciz: callable) -> Image.Image:
    img = Image.new("RGB", (280, 90), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((12, 28), "72 x 56", fill=(0, 0, 0))
    ciz(d)
    return img


def _kutu():
    return [10, 22, 110, 40]


def test_dikey_bir_boy():
    def ciz(d):
        d.line((200, 18, 200, 72), fill=(0, 0, 0), width=4)
    okuma = sag_sutun_cizgi(_kagit(ciz), _kutu())
    assert okuma["kod"] == "1-0-0-0"
    assert okuma["emin"] is True


def test_l_bir_boy_bir_en():
    def ciz(d):
        d.line((188, 20, 188, 70), fill=(0, 0, 0), width=4)
        d.line((188, 68, 240, 68), fill=(0, 0, 0), width=4)
    okuma = sag_sutun_cizgi(_kagit(ciz), _kutu())
    assert okuma["kod"] == "1-0-1-0"


def test_c_bir_boy_iki_en():
    def ciz(d):
        d.line((188, 20, 188, 70), fill=(0, 0, 0), width=4)
        d.line((188, 22, 242, 22), fill=(0, 0, 0), width=4)
        d.line((188, 68, 242, 68), fill=(0, 0, 0), width=4)
    okuma = sag_sutun_cizgi(_kagit(ciz), _kutu())
    assert okuma["kod"] == "1-0-1-1"


def test_cift_yatay_iki_en():
    def ciz(d):
        d.line((175, 32, 250, 32), fill=(0, 0, 0), width=4)
        d.line((175, 52, 250, 52), fill=(0, 0, 0), width=4)
    okuma = sag_sutun_cizgi(_kagit(ciz), _kutu())
    assert okuma["kod"] == "0-0-1-1"


def test_kutu_dort_kenar():
    def ciz(d):
        d.rectangle((180, 22, 248, 70), outline=(0, 0, 0), width=4)
    okuma = sag_sutun_cizgi(_kagit(ciz), _kutu())
    assert okuma["kod"] == "1-1-1-1"


def test_bos_sag_sifir():
    okuma = sag_sutun_cizgi(_kagit(lambda _d: None), _kutu())
    assert okuma["kod"] == "0-0-0-0"
    assert okuma["emin"] is True


def test_parcaya_gorsel_metin_yoksa_cizgi():
    def ciz(d):
        d.line((200, 18, 200, 72), fill=(0, 0, 0), width=4)
    parca = {
        "parca_adi": "Raf",
        "ham_metin": "72 x 56",
        "not": "72 x 56",
        "kutu": _kutu(),
        "kategori": "Gövde",
    }
    parcaya_bant_yaz(parca, gorsel=_kagit(ciz))
    assert parca["bant"]["kod"] == "1-0-0-0"


def test_parcaya_metin_cizgiyi_ezmez():
    def ciz(d):
        d.line((200, 18, 200, 72), fill=(0, 0, 0), width=4)
    parca = {
        "parca_adi": "Kapak",
        "not": "1-1-1-1",
        "ham_metin": "72 x 56 1-1-1-1",
        "kutu": _kutu(),
        "kategori": "Kapak",
    }
    parcaya_bant_yaz(parca, gorsel=_kagit(ciz))
    assert parca["bant"]["kod"] == "1-1-1-1"
