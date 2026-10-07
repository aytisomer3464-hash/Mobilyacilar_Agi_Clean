import asyncio
import importlib.util
import threading
from io import BytesIO
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from PIL import Image

_KOPRU = Path(__file__).resolve().parents[3] / "cloud_bridge.py"


@pytest.fixture()
def kopru(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-anahtar")
    spec = importlib.util.spec_from_file_location("_test_cloud_bridge", _KOPRU)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _jpeg() -> bytes:
    tampon = BytesIO()
    Image.new("RGB", (40, 30), (200, 120, 40)).save(tampon, format="JPEG")
    return tampon.getvalue()


def _sahte_gemini(kopru, monkeypatch, bekle=None, basla=None):
    def oku(_gorsel, **_k):
        if basla is not None:
            basla.set()
        if bekle is not None:
            bekle.wait(3)
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

    monkeypatch.setattr(kopru, "gemini_kesim_oku", oku)


def test_gecerli_gorsel_okunur(kopru, monkeypatch):
    _sahte_gemini(kopru, monkeypatch)
    yanit = TestClient(kopru.app).post("/api/tara", files={"dosya": ("kagit.jpg", _jpeg(), "image/jpeg")})
    assert yanit.status_code == 200
    assert yanit.json()["kesim_listesi"][0]["parca_adi"] == "Raf"


def test_bos_buyuk_ve_sahte_dosya(kopru, monkeypatch):
    _sahte_gemini(kopru, monkeypatch)
    istemci = TestClient(kopru.app)
    bos = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", b"", "image/jpeg")})
    assert bos.status_code == 400
    assert bos.json()["detail"]["kod"] == kopru.KOD_GORSEL
    sahte = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", b"MZ exe", "image/jpeg")})
    assert sahte.status_code == 415
    monkeypatch.setattr(kopru, "MAKS_BAYT", 100)
    buyuk = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", _jpeg(), "image/jpeg")})
    assert buyuk.status_code == 413


def test_gemini_cagrilmadan_sahte_dosya_kesilir(kopru, monkeypatch):
    cagri = {"n": 0}

    def oku(*_a, **_k):
        cagri["n"] += 1
        return {}

    monkeypatch.setattr(kopru, "gemini_kesim_oku", oku)
    TestClient(kopru.app).post("/api/tara", files={"dosya": ("kagit.jpg", b"GIF89a", "image/jpeg")})
    assert cagri["n"] == 0


def test_ayni_anda_cift_istek_tek_gemini(kopru, monkeypatch):
    basla = threading.Event()
    bekle = threading.Event()
    cagri = {"n": 0}
    _sahte_gemini(kopru, monkeypatch, bekle=bekle, basla=basla)
    gercek = kopru.gemini_kesim_oku

    def say(*a, **k):
        cagri["n"] += 1
        return gercek(*a, **k)

    monkeypatch.setattr(kopru, "gemini_kesim_oku", say)
    jpeg = _jpeg()

    async def dene():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=kopru.app), base_url="http://kopru") as istemci:
            async def gonder():
                return await istemci.post("/api/tara", files={"dosya": ("kagit.jpg", jpeg, "image/jpeg")})

            ilk = asyncio.create_task(gonder())
            while not basla.is_set():
                await asyncio.sleep(0.01)
            ikinci = await gonder()
            bekle.set()
            return await ilk, ikinci

    ilk, ikinci = asyncio.run(dene())
    assert ilk.status_code == 200
    assert ikinci.status_code == 409
    assert ikinci.json()["detail"]["kod"] == kopru.KOD_TEKRAR
    assert cagri["n"] == 1


def test_kilit_gemini_hatasindan_sonra_acilir(kopru, monkeypatch):
    def patlat(*_a, **_k):
        raise RuntimeError("gemini dustu")

    monkeypatch.setattr(kopru, "gemini_kesim_oku", patlat)
    istemci = TestClient(kopru.app)
    jpeg = _jpeg()
    ilk = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", jpeg, "image/jpeg")})
    assert ilk.status_code == 503
    _sahte_gemini(kopru, monkeypatch)
    ikinci = istemci.post("/api/tara", files={"dosya": ("kagit.jpg", jpeg, "image/jpeg")})
    assert ikinci.status_code == 200
