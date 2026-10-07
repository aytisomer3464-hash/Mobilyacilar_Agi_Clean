from io import BytesIO

from PIL import Image

from arsiv import arsiv_kok
from arsiv_yonetim import harici_arsivi_isle
from kota import kota_durumu, kota_harca, kota_katki_ile_yenile


def _png(renk: tuple[int, int, int]) -> bytes:
    tampon = BytesIO()
    Image.new("RGB", (12, 12), renk).save(tampon, format="PNG")
    return tampon.getvalue()


def test_haftalik_harcama_ve_katki(gecici_veri_kok):
    bas = kota_durumu("usta-1")
    assert bas["kalan"] == bas["tavan"]
    harc = kota_harca("usta-1", 8)
    assert harc["kalan"] == bas["tavan"] - 8
    yen = kota_katki_ile_yenile("usta-1", 1)
    assert yen["kalan"] == harc["kalan"] + 5
    assert yen["katki_adet"] == 1
    assert yen["yenilenen"] == 5


def test_arsiv_katkisi_kotayi_doldurur(gecici_veri_kok):
    kota_harca("varsayilan", 10)
    once = kota_durumu("varsayilan")["kalan"]
    kok = arsiv_kok()
    (kok / "defter.png").write_bytes(_png((11, 22, 33)))
    ozet = harici_arsivi_isle()
    assert ozet["harici_kayit"] == 1
    sonra = kota_durumu("varsayilan")
    assert sonra["kalan"] > once
    assert sonra["katki_adet"] >= 1
