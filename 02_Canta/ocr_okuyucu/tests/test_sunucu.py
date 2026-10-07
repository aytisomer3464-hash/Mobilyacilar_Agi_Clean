from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

import sunucu


def _ornek_jpeg() -> bytes:
    tampon = BytesIO()
    Image.new("RGB", (40, 30), (200, 120, 40)).save(tampon, format="JPEG")
    return tampon.getvalue()


def test_durum():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/api/durum")
    assert yanit.status_code == 200
    assert "no-store" in yanit.headers.get("cache-control", "").lower()
    govde = yanit.json()
    assert govde["hazir"] is True
    assert "lan_adresleri" in govde
    assert isinstance(govde["lan_adresleri"], list)
    assert any("127.0.0.1" in a for a in govde["lan_adresleri"])
    assert "kota" in govde
    assert govde.get("portal") == "/"
    assert govde.get("okuyucu") == "/okuyucu"
    assert govde.get("ebatlama") == "/ebatlama"
    assert govde.get("elle") == "/duvar"
    assert govde.get("tel") == "/tel"
    assert govde.get("duvar") == "/duvar"
    assert govde.get("zemin") == "/zemin"
    assert "sabit_adres" in govde
    assert govde["kota"]["kalan"] >= 0
    assert isinstance(govde.get("ozel_bant_mm"), list)
    havuz = govde.get("olcu_havuzu")
    assert isinstance(havuz, dict)
    assert "kayit" in havuz
    assert "tavan" in havuz
    assert "doluluk_oran" in havuz


def test_cors_kokenleri_bos_yildiz(monkeypatch):
    monkeypatch.setenv("OCR_CORS", "")
    assert sunucu.cors_kokenleri() == ["*"]
    monkeypatch.setenv("OCR_CORS", "  ,  ")
    assert sunucu.cors_kokenleri() == ["*"]
    monkeypatch.setenv("OCR_CORS", "http://192.168.1.10:8765")
    assert sunucu.cors_kokenleri() == ["http://192.168.1.10:8765"]


def test_ana_sayfa_onbellek_yok():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/")
    assert yanit.status_code == 200
    assert "no-cache" in yanit.headers.get("cache-control", "").lower()
    assert "E-Takım" in yanit.text
    assert 'id="cantaBtn"' in yanit.text
    assert "Mobilya İmalat Akıllı Reçete" in yanit.text
    assert "Elle ölçü" not in yanit.text
    assert "Duvar giydir" not in yanit.text
    assert 'id="duvarPanel"' not in yanit.text
    assert yanit.text.count('class="canta-arac"') == 4
    assert 'data-slot="5"' not in yanit.text
    assert "Ham iskelet" not in yanit.text
    assert "ustaGeriPerde" not in yanit.text
    assert 'id="ustaMicBtn"' not in yanit.text
    js = istemci.get("/app.js")
    assert js.status_code == 200
    assert "BULUT_ELLE" in js.text
    assert '"/duvar/"' in js.text


def test_portal_eski_adres_ana_siteye():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/portal", follow_redirects=False)
    assert yanit.status_code in (307, 308)
    assert yanit.headers.get("location", "").rstrip("/") in ("/", "")
    ana = istemci.get("/")
    assert ana.status_code == 200
    assert 'id="cantaBtn"' in ana.text
    assert "Mobilya İmalat Akıllı Reçete" in ana.text
    assert "arac-kart" not in ana.text
    assert "Atölye Takım Çantası" not in ana.text


def test_okuyucu_sayfasi():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/okuyucu")
    assert yanit.status_code == 200
    assert "no-cache" in yanit.headers.get("cache-control", "").lower()
    assert "Kesim OCR" in yanit.text
    assert "ustaGeriPerde" in yanit.text
    assert 'id="ustaMicBtn"' in yanit.text
    assert "Takım Çantası" not in yanit.text
    assert 'href="/"' in yanit.text
    assert 'id="buyutec"' in yanit.text
    assert "/static/kirpici.js" in yanit.text
    assert 'id="fotoCerceve"' in yanit.text
    assert 'aria-label="Mercek"' in yanit.text
    assert 'type="file"' in yanit.text
    assert 'accept="image/*"' in yanit.text
    assert "capture=" not in yanit.text
    assert "<label class=\"yukle buyuk\"" not in yanit.text


def test_ebatlama_vitrin():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/ebatlama/")
    assert yanit.status_code == 200
    assert "cep_motor.js" in yanit.text
    assert "vitrin.js" in yanit.text
    js = istemci.get("/ebatlama/cep_motor.js")
    assert js.status_code == 200
    assert "CepMotor" in js.text


def test_uc_kapi_vitrin():
    istemci = TestClient(sunucu.app)
    yon = istemci.get("/elle/", follow_redirects=False)
    assert yon.status_code in (307, 308)
    assert "/duvar" in yon.headers.get("location", "")
    for yol, baslik in (("/tel/", "Tel çizim"), ("/duvar/", "Mobilya İmalat Akıllı Reçete")):
        yanit = istemci.get(yol)
        assert yanit.status_code == 200
        assert baslik in yanit.text
        assert "iframe" not in yanit.text.lower()
    duvar = istemci.get("/duvar/")
    assert "/zemin/zemin_motor.js" in duvar.text
    assert "/mobilya/mobilya_motor.js" in duvar.text
    assert 'id="modulMobilya"' in duvar.text
    assert 'id="modulMobilyaSatir"' in duvar.text
    assert 'id="duvarSahne"' in duvar.text
    assert "iframe" not in duvar.text.lower()
    djs = istemci.get("/duvar/duvar_motor.js")
    assert djs.status_code == 200
    assert "DuvarMotor" in djs.text
    assert "odaAyarla" in djs.text
    zjs = istemci.get("/zemin/zemin_motor.js")
    assert zjs.status_code == 200
    assert "ZeminMotor" in zjs.text
    assert "olcu_yaz" in zjs.text
    mjs = istemci.get("/mobilya/mobilya_motor.js")
    assert mjs.status_code == 200
    assert "MobilyaMotor" in mjs.text
    cfg = istemci.get("/mobilya/varsayilan_config.json")
    assert cfg.status_code == 200
    assert cfg.json()["levha"] == 18
    kat = istemci.get("/mobilya/katalog_arsiv.json")
    assert kat.status_code == 200
    assert kat.json()["sablon"]["baza"][0]["en"] == 150


def test_ebatlama_motor_import():
    import importlib.util
    from pathlib import Path

    yol = Path(sunucu.__file__).resolve().parents[1] / "ebatlama" / "baglanti.py"
    spec = importlib.util.spec_from_file_location("_test_ebatlama_baglanti", yol)
    baglanti = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(baglanti)

    assert (baglanti.vitrin_dizin() / "cep_motor.js").is_file()
    motor = baglanti.motor_modulu()
    assert motor is not None
    assert callable(motor.hesapla)


def test_kirpici_statik_servis():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/static/kirpici.js")
    assert yanit.status_code == 200
    assert "KesimKirpici" in yanit.text
    assert "kagidiKirpDosya" in yanit.text


def test_okuyucu_egik_cizgi_yonlendirir():
    istemci = TestClient(sunucu.app, follow_redirects=False)
    yanit = istemci.get("/okuyucu/")
    assert yanit.status_code in (307, 308)
    yer = yanit.headers.get("location", "").rstrip("/")
    assert yer.endswith("/okuyucu")


def test_olcu_havuzu_api(gecici_veri_kok):
    from io import BytesIO

    from PIL import Image

    from olcu_havuzu import havuza_yaz

    buf = BytesIO()
    Image.new("RGB", (40, 24), (255, 255, 255)).save(buf, format="JPEG")
    havuza_yaz(
        buf.getvalue(),
        {
            "kesim_listesi": [
                {
                    "modul_kodu": "M1",
                    "parca_adi": "Dikme",
                    "uzunluk_mm": 720,
                    "genislik_mm": 560,
                    "kalinlik_mm": 18,
                    "adet": 1,
                }
            ],
            "genel_notlar": [],
        },
        "api-kayit",
    )
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/api/olcu-havuzu", params={"q": "dikme"})
    assert yanit.status_code == 200
    govde = yanit.json()
    assert govde["liste"]
    ad = govde["liste"][0]["id"]
    hatali = istemci.delete("/api/olcu-havuzu", params={"kayit": "../x.json"})
    assert hatali.status_code == 400
    sil = istemci.delete("/api/olcu-havuzu", params={"kayit": ad})
    assert sil.status_code == 200
    assert sil.json()["liste"] == []


def test_tara_yukleme(monkeypatch):
    def sahte(_veri, yalniz_yerel=False, **_k):
        return {
            "kesim_listesi": [
                {
                    "modul_kodu": "M1",
                    "parca_adi": "Raf",
                    "uzunluk_mm": 800,
                    "genislik_mm": 400,
                    "kalinlik_mm": 18,
                    "adet": 1,
                    "malzeme": "",
                    "not": "",
                    "supheli": False,
                }
            ],
            "genel_notlar": [],
        }

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", sahte)
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert yanit.status_code == 200
    govde = yanit.json()
    assert govde["kesim_listesi"][0]["parca_adi"] == "Raf"
    from arsiv import kayit_klasoru
    assert (kayit_klasoru(govde["kayit_id"]) / "duzeltilmis.json").exists()
    assert "kota" in govde


def test_tara_havuz_kota_harcamaz(monkeypatch):
    from kota import kota_durumu

    once = kota_durumu("varsayilan")["kalan"]

    def sahte(_veri, yalniz_yerel=False, **_k):
        return {
            "kesim_listesi": [
                {
                    "modul_kodu": "M1",
                    "parca_adi": "Raf",
                    "uzunluk_mm": 800,
                    "genislik_mm": 400,
                    "kalinlik_mm": 18,
                    "adet": 1,
                    "malzeme": "",
                    "not": "",
                    "supheli": False,
                }
            ],
            "genel_notlar": [],
            "okuma_kaynak": "havuz",
        }

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", sahte)
    harcandi = {"n": 0}
    gercek_harca = sunucu.kota_harca

    def say(_usta, adet=1):
        harcandi["n"] += 1
        return gercek_harca(_usta, adet)

    monkeypatch.setattr(sunucu, "kota_harca", say)
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert yanit.status_code == 200
    assert yanit.json()["okuma_kaynak"] == "havuz"
    assert harcandi["n"] == 0
    assert kota_durumu("varsayilan")["kalan"] == once


def test_favicon_204():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/favicon.ico")
    assert yanit.status_code == 204
    assert yanit.content == b""


def test_token_401_kara_kutuya_yazmaz(monkeypatch, gecici_veri_kok):
    monkeypatch.setenv("OCR_API_TOKEN", "gizli")
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert yanit.status_code == 401
    from hata_kayit import hata_log_yolu
    from pathlib import Path

    yol = hata_log_yolu()
    metin = yol.read_text(encoding="utf-8") if Path(yol).exists() else ""
    assert "OCR_API_TOKEN" not in metin
    assert "SUNUCU" not in metin


def test_token_zorunlu(monkeypatch):
    monkeypatch.setenv("OCR_API_TOKEN", "gizli")
    monkeypatch.setattr(
        sunucu,
        "kroki_oku_baytlari",
        lambda *a, **k: {
            "kesim_listesi": [
                {
                    "modul_kodu": "M1",
                    "parca_adi": "Raf",
                    "uzunluk_mm": 500,
                    "genislik_mm": 300,
                    "kalinlik_mm": 18,
                    "adet": 1,
                    "malzeme": "",
                    "not": "",
                    "supheli": False,
                }
            ],
            "genel_notlar": [],
        },
    )
    istemci = TestClient(sunucu.app)
    yok = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert yok.status_code == 401
    var = istemci.post(
        "/api/tara",
        files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")},
        headers={"X-OCR-Token": "gizli"},
    )
    assert var.status_code == 200


def test_kota_ucu():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/api/kota", headers={"X-Usta-Id": "atolyeci"})
    assert yanit.status_code == 200
    assert yanit.json()["usta_id"] == "atolyeci"


def test_duzelt_arsivler(monkeypatch):
    def sahte(_veri, yalniz_yerel=False, **_k):
        return {
            "kesim_listesi": [
                {
                    "modul_kodu": "M1",
                    "parca_adi": "Raf",
                    "uzunluk_mm": 800,
                    "genislik_mm": 400,
                    "kalinlik_mm": 18,
                    "adet": 1,
                    "malzeme": "Beyaz",
                    "not": "",
                    "supheli": False,
                }
            ],
            "genel_notlar": [],
        }

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", sahte)
    monkeypatch.setattr(sunucu, "duzeltme_kaydet_ve_belki_ogren", lambda: {"bekleyen_duzeltme": 1, "esik": 25})
    istemci = TestClient(sunucu.app)
    tara = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    kayit_id = tara.json()["kayit_id"]
    liste = tara.json()["kesim_listesi"]
    liste[0]["uzunluk_mm"] = 810
    yanit = istemci.post("/api/duzelt", json={
        "kayit_id": kayit_id,
        "kesim_listesi": liste,
        "genel_notlar": [],
    })
    assert yanit.status_code == 200
    assert yanit.json()["kesim_listesi"][0]["uzunluk_mm"] == 810
    from arsiv import kayit_klasoru
    klasor = kayit_klasoru(kayit_id)
    assert (klasor / "duzeltilmis.json").exists()
    assert list(klasor.glob("kroki*"))


def test_usta_hafiza_api(gecici_veri_kok):
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/usta-hafiza", json={
        "orijinal": {"ham_metin": "80 x 40", "uzunluk_mm": 800, "genislik_mm": 400},
        "hedef": {"uzunluk_mm": 800, "genislik_mm": 400, "adet": 2, "parca_adi": "Raf", "bant_kod": "1-1-0-0"},
    })
    assert yanit.status_code == 200
    assert yanit.json()["ok"] is True
    assert yanit.json()["ogrenme"]["hafiza_kalip"] >= 1
    durum = istemci.get("/api/durum")
    assert durum.json()["ogrenme"]["hafiza_kalip"] >= 1


def test_supheli_duzelt_arsivlenmez(monkeypatch, gecici_veri_kok):
    def sahte(_veri, yalniz_yerel=False, **_k):
        return {
            "kesim_listesi": [
                {
                    "modul_kodu": "M1",
                    "parca_adi": "Raf",
                    "uzunluk_mm": 800,
                    "genislik_mm": 400,
                    "kalinlik_mm": 18,
                    "adet": 1,
                    "malzeme": "Beyaz",
                    "not": "",
                    "supheli": True,
                }
            ],
            "genel_notlar": [],
        }

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", sahte)
    istemci = TestClient(sunucu.app)
    tara = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert tara.status_code == 200
    assert tara.json().get("kesinlestirme") is False
    from arsiv import kayit_klasoru
    kayit_id = tara.json()["kayit_id"]
    assert not (kayit_klasoru(kayit_id) / "duzeltilmis.json").exists()
    yanit = istemci.post("/api/duzelt", json={
        "kayit_id": kayit_id,
        "kesim_listesi": tara.json()["kesim_listesi"],
        "genel_notlar": [],
    })
    assert yanit.status_code == 409


def test_tara_500_kara_kutuya_yazar(monkeypatch, gecici_veri_kok):
    def patlat(_veri, yalniz_yerel=False, **_k):
        raise RuntimeError("motor patladı")

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", patlat)
    istemci = TestClient(sunucu.app, raise_server_exceptions=False)
    yanit = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert yanit.status_code == 500
    from hata_kayit import hata_log_yolu

    log = hata_log_yolu().read_text(encoding="utf-8")
    assert "SUNUCU" in log
    assert "motor patladı" in log


def test_tara_422_okuma_kara_kutuya_yazar(monkeypatch, gecici_veri_kok):
    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", lambda *_a, **_k: None)
    istemci = TestClient(sunucu.app, raise_server_exceptions=False)
    yanit = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert yanit.status_code == 422
    from hata_kayit import OKUMA, hata_log_yolu

    log = hata_log_yolu().read_text(encoding="utf-8")
    assert OKUMA in log
    assert "Kesim listesi üretilemedi" in log


def test_onizle_kirpar_kota_harcamaz(monkeypatch, gecici_veri_kok):
    from kota import kota_durumu

    once = kota_durumu("varsayilan")["kalan"]

    def sahte_kirp(gorsel):
        return gorsel

    monkeypatch.setattr(sunucu, "gorseli_on_isle", sahte_kirp)
    monkeypatch.setattr(sunucu, "jpeg_baytlari", lambda _g: b"\xff\xd8jpeg")
    monkeypatch.setattr(sunucu, "gorseli_baytlardan", lambda _v: object())
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/onizle", files={"dosya": ("kagit.jpg", _ornek_jpeg(), "image/jpeg")})
    assert yanit.status_code == 200
    assert yanit.content.startswith(b"\xff\xd8")
    assert kota_durumu("varsayilan")["kalan"] == once


def test_onizle_hata_kilitlemez(monkeypatch, gecici_veri_kok):
    def patlat(_veri):
        raise RuntimeError("kirpma dustu")

    monkeypatch.setattr(sunucu, "gorseli_baytlardan", patlat)
    istemci = TestClient(sunucu.app, raise_server_exceptions=False)
    ham = _ornek_jpeg()
    yanit = istemci.post("/api/onizle", files={"dosya": ("kagit.jpg", ham, "image/jpeg")})
    assert yanit.status_code == 200
    assert yanit.content == ham
    from hata_kayit import hata_log_yolu

    assert "ON_ISLEME" in hata_log_yolu().read_text(encoding="utf-8")


def test_tara_bos_ve_sahte_dosya():
    istemci = TestClient(sunucu.app)
    bos = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", b"", "image/jpeg")})
    assert bos.status_code == 400
    sahte = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", b"MZ exe", "image/jpeg")})
    assert sahte.status_code == 415


def _tek_dongu_istekleri(isler):
    """uvicorn gibi tek olay döngüsünde eşzamanlı istek: TestClient bunu taklit etmez."""
    import asyncio

    import httpx

    async def kos():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=sunucu.app), base_url="http://yerel") as ist:
            return await isler(ist)

    return asyncio.run(kos())


def test_tara_ayni_anda_cift_istek(monkeypatch):
    import asyncio
    import threading

    basla = threading.Event()
    birak = threading.Event()
    cagri = {"n": 0}

    def yavas(_veri, yalniz_yerel=False, **_k):
        cagri["n"] += 1
        basla.set()
        birak.wait(3)
        return {"kesim_listesi": [], "genel_notlar": []}

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", yavas)
    jpeg = _ornek_jpeg()

    async def isler(ist):
        def gonder():
            return ist.post("/api/tara", files={"dosya": ("kagit.jpg", jpeg, "image/jpeg")})

        ilk = asyncio.create_task(gonder())
        while not basla.is_set():
            await asyncio.sleep(0.01)
        cift = await gonder()
        birak.set()
        return await ilk, cift

    ilk, cift = _tek_dongu_istekleri(isler)
    assert ilk.status_code == 200
    assert cift.status_code == 409
    assert cagri["n"] == 1


def test_tara_farkli_gorseller_sirayla(monkeypatch):
    import asyncio
    import threading
    import time

    ayni_anda = {"simdi": 0, "en_cok": 0}
    kilit = threading.Lock()

    def motor(_veri, yalniz_yerel=False, **_k):
        with kilit:
            ayni_anda["simdi"] += 1
            ayni_anda["en_cok"] = max(ayni_anda["en_cok"], ayni_anda["simdi"])
        time.sleep(0.15)
        with kilit:
            ayni_anda["simdi"] -= 1
        return {"kesim_listesi": [], "genel_notlar": []}

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", motor)

    def jpeg(renk):
        tampon = BytesIO()
        Image.new("RGB", (40, 30), renk).save(tampon, format="JPEG")
        return tampon.getvalue()

    async def isler(ist):
        gorevler = [
            ist.post("/api/tara", files={"dosya": ("a.jpg", jpeg((r, 40, 40)), "image/jpeg")})
            for r in (10, 120, 230)
        ]
        return await asyncio.gather(*gorevler)

    yanitlar = _tek_dongu_istekleri(isler)
    assert [y.status_code for y in yanitlar] == [200, 200, 200]
    assert ayni_anda["en_cok"] == 1


def test_tara_beklerken_sunucu_cevap_verir(monkeypatch):
    import asyncio
    import threading
    import time

    basla = threading.Event()
    birak = threading.Event()

    def yavas(_veri, yalniz_yerel=False, **_k):
        basla.set()
        birak.wait(3)
        return {"kesim_listesi": [], "genel_notlar": []}

    monkeypatch.setattr(sunucu, "kroki_oku_baytlari", yavas)
    jpeg = _ornek_jpeg()

    async def isler(ist):
        t0 = time.monotonic()
        ilk = asyncio.create_task(ist.post("/api/tara", files={"dosya": ("kagit.jpg", jpeg, "image/jpeg")}))
        while not basla.is_set():
            await asyncio.sleep(0.01)
        durum = await ist.get("/api/durum")
        gecen = time.monotonic() - t0
        birak.set()
        await ilk
        return durum, gecen

    durum, gecen = _tek_dongu_istekleri(isler)
    assert durum.status_code == 200
    assert gecen < 1.0


def test_onizle_bos_ve_sahte_dosya():
    istemci = TestClient(sunucu.app)
    bos = istemci.post("/api/onizle", files={"dosya": ("kagit.jpg", b"", "image/jpeg")})
    assert bos.status_code == 400
    sahte = istemci.post("/api/onizle", files={"dosya": ("kagit.jpg", b"MZ exe", "image/jpeg")})
    assert sahte.status_code == 415


def test_usta_geri_kara_kutuya_yazar(gecici_veri_kok):
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/usta-geri", json={"metin": "Boy 720 değil 740", "kayit_id": "abc"})
    assert yanit.status_code == 200
    from hata_kayit import hata_log_yolu

    metin = hata_log_yolu().read_text(encoding="utf-8")
    assert "USTA_GERI" in metin
    assert "Boy 720 değil 740" in metin
    assert "kayit=abc" in metin


def test_usta_geri_bos_400(gecici_veri_kok):
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/usta-geri", json={"metin": "   "})
    assert yanit.status_code == 400
    from hata_kayit import hata_log_yolu
    from pathlib import Path

    yol = hata_log_yolu()
    metin = yol.read_text(encoding="utf-8") if Path(yol).exists() else ""
    assert "USTA_GERI" not in metin


def test_usta_geri_401_kara_kutuya_yazmaz(monkeypatch, gecici_veri_kok):
    monkeypatch.setenv("OCR_API_TOKEN", "gizli")
    istemci = TestClient(sunucu.app)
    yanit = istemci.post("/api/usta-geri", json={"metin": "sessiz not"})
    assert yanit.status_code == 401
    from hata_kayit import hata_log_yolu
    from pathlib import Path

    yol = hata_log_yolu()
    metin = yol.read_text(encoding="utf-8") if Path(yol).exists() else ""
    assert "USTA_GERI" not in metin
    assert "sessiz not" not in metin


def test_vitrin_kapi_bosken_acik():
    istemci = TestClient(sunucu.app)
    yanit = istemci.get("/", follow_redirects=False)
    assert yanit.status_code == 200


def test_vitrin_kapi_kilit(monkeypatch):
    monkeypatch.setenv("MAGI_VITRIN_SIFRE", "gizli-kapi")
    app = sunucu.uygulamayi_olustur()
    istemci = TestClient(app)
    kilit = istemci.get("/", follow_redirects=False)
    assert kilit.status_code == 303
    assert "/giris" in kilit.headers.get("location", "")
    api = istemci.get("/api/durum")
    assert api.status_code == 401
    yanlis = istemci.post("/giris", data={"sifre": "yanlis", "next": "/"})
    assert yanlis.status_code == 401
    dogru = istemci.post("/giris", data={"sifre": "gizli-kapi", "next": "/"}, follow_redirects=False)
    assert dogru.status_code == 303
    assert "magi_vitrin" in dogru.cookies
    acik = istemci.get("/")
    assert acik.status_code == 200
