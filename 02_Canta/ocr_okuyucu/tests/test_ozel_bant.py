from fastapi.testclient import TestClient

import ozel_bant
import sunucu


def test_ozel_bant_kaydet_ve_sil(gecici_veri_kok):
    assert ozel_bant.ozel_bant_oku() == []
    liste = ozel_bant.ozel_bant_ekle("1,2")
    assert liste == [1.2]
    assert ozel_bant.ozel_bant_oku() == [1.2]
    ozel_bant.ozel_bant_ekle(0.8)
    assert ozel_bant.ozel_bant_oku() == [1.2]
    kalan = ozel_bant.ozel_bant_sil(1.2)
    assert kalan == []


def test_ozel_bant_sinir(gecici_veri_kok):
    try:
        ozel_bant.ozel_bant_ekle(99)
        raise AssertionError("beklenen hata gelmedi")
    except ValueError:
        pass


def test_ozel_bant_api(gecici_veri_kok):
    istemci = TestClient(sunucu.app)
    durum = istemci.get("/api/durum")
    assert durum.status_code == 200
    assert durum.json()["ozel_bant_mm"] == []
    yaz = istemci.post("/api/ozel-bant", json={"mm": 1.5})
    assert yaz.status_code == 200
    assert yaz.json()["ozel_bant_mm"] == [1.5]
    assert istemci.get("/api/durum").json()["ozel_bant_mm"] == [1.5]
    sil = istemci.delete("/api/ozel-bant", params={"mm": 1.5})
    assert sil.status_code == 200
    assert sil.json()["ozel_bant_mm"] == []
    hatali = istemci.post("/api/ozel-bant", json={"mm": 0.01})
    assert hatali.status_code == 400
