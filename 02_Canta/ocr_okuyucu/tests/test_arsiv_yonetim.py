from io import BytesIO

from PIL import Image

from arsiv import arsiv_kok, cakismayan_hedef, kayit_klasoru
from arsiv_yonetim import harici_arsivi_isle
import ogrenme


def _png(renk: tuple[int, int, int]) -> bytes:
    tampon = BytesIO()
    Image.new("RGB", (12, 12), renk).save(tampon, format="PNG")
    return tampon.getvalue()


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
                "malzeme": "Lake",
                "not": "",
                "supheli": False,
            }
        ],
        "genel_notlar": [],
    }


def test_harici_json_ve_kroki_sayaca_girer(gecici_veri_kok, monkeypatch):
    monkeypatch.setattr(ogrenme, "OGRENME_ESIK", 25)
    kok = arsiv_kok()
    (kok / "siparis.png").write_bytes(_png((10, 20, 30)))
    (kok / "siparis.json").write_text(
        __import__("json").dumps(_liste(), ensure_ascii=False), encoding="utf-8"
    )
    ozet = harici_arsivi_isle()
    assert ozet["harici_kayit"] == 1
    assert ozet["harici_duzeltme"] == 1
    assert not (kok / "siparis.png").exists()
    kayitlar = [p for p in kok.iterdir() if p.is_dir()]
    assert len(kayitlar) == 1
    assert list(kayitlar[0].glob("kroki_*"))
    assert (kayitlar[0] / "duzeltilmis.json").exists()
    assert ogrenme.sayaci_oku()["bekleyen_duzeltme"] >= 1


def test_ayni_icerik_farkli_ad_elensin(gecici_veri_kok):
    kok = arsiv_kok()
    veri = _png((40, 50, 60))
    (kok / "a.png").write_bytes(veri)
    (kok / "b.png").write_bytes(veri)
    ozet = harici_arsivi_isle()
    klasorler = [p for p in kok.iterdir() if p.is_dir()]
    gorseller = []
    for k in klasorler:
        gorseller.extend(k.glob("kroki_*"))
    assert len(gorseller) == 1
    assert ozet["kopya_silindi"] >= 1 or ozet["harici_kayit"] == 1


def test_ayni_ad_farkli_icerik_ezilmez(gecici_veri_kok):
    klasor = kayit_klasoru("ornek")
    klasor.mkdir(parents=True, exist_ok=True)
    (klasor / "kroki.jpg").write_bytes(_png((1, 2, 3)))
    h1 = __import__("hashlib").sha256((klasor / "kroki.jpg").read_bytes()).hexdigest()
    h2 = __import__("hashlib").sha256(_png((9, 9, 9))).hexdigest()
    hedef = cakismayan_hedef(klasor, "kroki.jpg", h2)
    assert hedef.name != "kroki.jpg"
    hedef.write_bytes(_png((9, 9, 9)))
    assert (klasor / "kroki.jpg").exists()
    assert hedef.exists()
    assert h1 != h2


def test_hafif_tarama_arsiv_ici_hashlemez(gecici_veri_kok, monkeypatch):
    import arsiv_yonetim as ay

    ay._son_ozet = {}
    ay._son_serbest_imza = None
    cagrildi = {"kopya": 0}

    def say(*_a, **_k):
        cagrildi["kopya"] += 1
        return 0

    monkeypatch.setattr(ay, "_kopyalari_ele", say)
    ay.harici_arsivi_isle(tam=False)
    ay.harici_arsivi_isle(tam=False)
    assert cagrildi["kopya"] == 0
    ay.harici_arsivi_isle(tam=True)
    assert cagrildi["kopya"] == 1


def test_bozuk_imaj_silinir(gecici_veri_kok):
    kok = arsiv_kok()
    (kok / "kirik.jpg").write_bytes(b"bu-bir-resim-degil")
    ozet = harici_arsivi_isle()
    assert ozet["bozuk_silindi"] >= 1
    assert not (kok / "kirik.jpg").exists()
