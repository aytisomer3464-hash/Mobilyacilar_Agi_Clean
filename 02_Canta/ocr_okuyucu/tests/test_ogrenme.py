import ogrenme
from arsiv import duzeltmeyi_arsivle, ham_taramayi_arsivle, kayit_klasoru
from ogrenme_kurallari import kurallari_yukle


def _liste(parca_adi="Yan", kalinlik=16):
    return {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": parca_adi,
                "uzunluk_mm": 720,
                "genislik_mm": 400,
                "kalinlik_mm": kalinlik,
                "adet": 1,
                "malzeme": "Beyaz",
                "not": "",
                "supheli": False,
            }
        ],
        "genel_notlar": [],
    }


def test_arsiv_silinmez(gecici_veri_kok):
    ham = _liste("yan")
    kayit_id = ham_taramayi_arsivle(b"\xff\xd8fake", ham, "kroki.jpg")
    duzeltmeyi_arsivle(kayit_id, _liste("Yan Dikme", 16))
    klasor = kayit_klasoru(kayit_id)
    assert list(klasor.glob("kroki*"))
    assert (klasor / "ham.json").exists()
    assert (klasor / "duzeltilmis.json").exists()
    ogrenme.OGRENME_ESIK = 1
    ogrenme.kurallari_iyilestir()
    assert list(klasor.glob("kroki*"))
    assert (klasor / "ham.json").exists()
    assert (klasor / "duzeltilmis.json").exists()


def test_esikte_kurallar_guncellenir(monkeypatch):
    monkeypatch.setattr(ogrenme, "OGRENME_ESIK", 2)
    idler = []
    for i in range(2):
        kayit_id = ham_taramayi_arsivle(f"foto-{i}".encode(), _liste("yan", 16), "a.jpg")
        duzeltmeyi_arsivle(kayit_id, _liste("Yan Dikme", 16))
        idler.append(kayit_id)
    kurallar = ogrenme.kurallari_iyilestir()
    assert 16.0 in kurallar["standart_kalinliklar"]
    assert kurallar["parca_adi_esle"].get("yan") == "Yan Dikme"
    for kayit_id in idler:
        assert list(kayit_klasoru(kayit_id).glob("kroki*"))
    assert kurallari_yukle()["surum"] >= 2


def test_esik_altinda_islenmez(monkeypatch):
    monkeypatch.setattr(ogrenme, "OGRENME_ESIK", 25)
    kayit_id = ham_taramayi_arsivle(b"x", _liste("yan"), "a.jpg")
    duzeltmeyi_arsivle(kayit_id, _liste("Yan Dikme"))
    once = kurallari_yukle()["surum"]
    ogrenme.kurallari_iyilestir()
    assert kurallari_yukle()["surum"] == once
