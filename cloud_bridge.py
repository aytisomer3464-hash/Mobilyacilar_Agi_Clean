"""Bulut köprüsü: FastAPI + Gemini. Vekil, 8765 ve tarama önbelleği yok."""

from __future__ import annotations

import os
import sys
import uuid
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

KOK = Path(__file__).resolve().parent
OCR_KOK = KOK / "02_Canta" / "ocr_okuyucu"
if not (OCR_KOK / "gemini_yedek.py").is_file():
    raise RuntimeError(f"02 Gemini motoru bulunamadı: {OCR_KOK}")
if str(OCR_KOK) not in sys.path:
    sys.path.insert(0, str(OCR_KOK))

load_dotenv(OCR_KOK / ".env")

from dogrulama import kesim_listesi_sanity_kontrol, liste_onayli_mi
from file_validator import DosyaDogrulamaHatasi, dosya_dogrula, tarama_kilidi
from gemini_yedek import gemini_kesim_oku
from hata_kayit import hata_yaz
from on_isleme import GorselBicimHatasi, gorseli_baytlardan, gorseli_on_isle
from recete import akilli_recete_olustur
from usta_mantik import kesim_hamini_duzelt

KOD_GORSEL = "gorsel_bozuk"
KOD_GEMINI_ZAMAN = "gemini_zaman_asimi"
KOD_KOPRU = "kopru_erisim_hatasi"
KOD_TEKRAR = "ayni_gorsel_isleniyor"

KAMU_API_KOK = "https://cloud-bridge-470702229392.europe-west1.run.app"
KOPRU_PORT = int(os.environ.get("PORT") or os.environ.get("CLOUD_BRIDGE_PORT", "8080"))
MAKS_BAYT = 12 * 1024 * 1024
CORS_KOKENLER = [
    "https://mobilyaci-agi.web.app",
    "https://mobilyaci-agi.firebaseapp.com",
]

app = FastAPI(title="Mobilyacılar Ağı — bulut köprüsü", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_KOKENLER,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_ozel_bant: list[float] = []


class DuzeltmeIstek(BaseModel):
    kayit_id: str = ""
    kesim_listesi: list[dict] = Field(default_factory=list)
    genel_notlar: list[str] = Field(default_factory=list)


class OzelBantIstek(BaseModel):
    mm: float


class UstaGeriIstek(BaseModel):
    metin: str = ""
    kayit_id: str = ""


class HafizaIstek(BaseModel):
    kayit_id: str = ""
    orijinal: dict = Field(default_factory=dict)
    hedef: dict = Field(default_factory=dict)


def _gemini_var() -> bool:
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())


def _zaman_asimi_mi(hata: BaseException) -> bool:
    metin = f"{type(hata).__name__} {hata}".lower()
    return isinstance(hata, TimeoutError) or any(
        parca in metin for parca in ("timeout", "timed out", "deadline", "zaman aşımı", "zaman_asimi")
    )


def _kopru_http(status: int, kod: str, aciklama: str, hata: BaseException | None = None) -> HTTPException:
    try:
        hata_yaz(kod, aciklama, hata)
    except Exception:
        pass
    return HTTPException(status_code=status, detail={"kod": kod, "detail": aciklama})


def _kota() -> dict[str, Any]:
    return {"kalan": 9999, "tavan": 9999, "harcanan": 0, "tukendi": False}


def _ogrenme() -> dict[str, Any]:
    return {"hafiza_kalip": 0, "bekleyen_duzeltme": 0}


def _dosya_al(dosya: UploadFile | None, foto: UploadFile | None, file: UploadFile | None) -> UploadFile:
    secim = dosya or foto or file
    if secim is None:
        raise HTTPException(status_code=400, detail="Fotoğraf yok. Alan adı: dosya (veya foto).")
    return secim


def _listeyi_tamamla(ham: dict[str, Any], kayit_id: str) -> dict[str, Any]:
    duzeltilmis = kesim_hamini_duzelt(ham) or ham
    dogrulanmis = kesim_listesi_sanity_kontrol(duzeltilmis)
    if dogrulanmis is None:
        raise _kopru_http(422, KOD_GORSEL, "Görsel okunamadı veya kesim listesi üretilemedi")
    yazilar = dogrulanmis.get("yazilar") if isinstance(dogrulanmis.get("yazilar"), list) else []
    dogrulanmis["akilli_recete"] = akilli_recete_olustur(
        dogrulanmis.get("kesim_listesi") or [],
        yazilar,
        tel_cizim_izinli=bool(dogrulanmis.get("tel_cizim")),
        tel_cizim_algilandi=bool(dogrulanmis.get("tel_cizim")),
        tel_cizim_filtrelendi=bool(dogrulanmis.get("tel_cizim_filtrelendi")),
    )
    dogrulanmis["okuma_kaynak"] = "gemini"
    dogrulanmis["kaynak"] = "cloud_bridge"
    dogrulanmis["kayit_id"] = kayit_id
    dogrulanmis["kesinlestirme"] = liste_onayli_mi(dogrulanmis)
    dogrulanmis["ogrenme"] = _ogrenme()
    dogrulanmis["kota"] = _kota()
    return dogrulanmis


def _tara_bayt(
    veri: bytes,
    *,
    tel_cizim: bool,
    kirpilmis: bool,
    dosya_adi: str | None = None,
    icerik_turu: str | None = None,
) -> dict[str, Any]:
    try:
        dogrulanan = dosya_dogrula(veri, dosya_adi, icerik_turu, maks_bayt=MAKS_BAYT)
    except DosyaDogrulamaHatasi as hata:
        raise _kopru_http(hata.durum_kodu, KOD_GORSEL, str(hata), hata) from hata
    if not _gemini_var():
        raise _kopru_http(503, KOD_KOPRU, "GEMINI_API_KEY Cloud Run ortamında yok.")
    try:
        with tarama_kilidi(dogrulanan.sha256):
            return _gemini_tara(veri, tel_cizim=tel_cizim, kirpilmis=kirpilmis)
    except DosyaDogrulamaHatasi as hata:
        raise _kopru_http(hata.durum_kodu, KOD_TEKRAR, str(hata), hata) from hata


def _gemini_tara(veri: bytes, *, tel_cizim: bool, kirpilmis: bool) -> dict[str, Any]:
    try:
        ham_gorsel = gorseli_baytlardan(veri)
        gorsel = ham_gorsel if kirpilmis else gorseli_on_isle(ham_gorsel)
    except GorselBicimHatasi as hata:
        raise _kopru_http(415, KOD_GORSEL, str(hata) or "Desteklenmeyen görsel (JPEG/PNG).", hata) from hata
    except Exception as hata:
        raise _kopru_http(422, KOD_GORSEL, "Görsel okunamadı", hata) from hata
    try:
        ham = gemini_kesim_oku(gorsel, tel_cizim_izinli=tel_cizim)
    except RuntimeError as hata:
        if _zaman_asimi_mi(hata):
            raise _kopru_http(502, KOD_GEMINI_ZAMAN, str(hata) or "Gemini zaman aşımı", hata) from hata
        raise _kopru_http(503, KOD_KOPRU, str(hata) or "Köprü Gemini'ye erişemedi", hata) from hata
    except Exception as hata:
        if _zaman_asimi_mi(hata):
            raise _kopru_http(502, KOD_GEMINI_ZAMAN, "Gemini zaman aşımı", hata) from hata
        raise _kopru_http(502, KOD_KOPRU, "Gemini okuma başarısız", hata) from hata
    if not isinstance(ham, dict):
        raise _kopru_http(422, KOD_GORSEL, "Görsel okunamadı veya kesim listesi üretilemedi")
    return _listeyi_tamamla(ham, uuid.uuid4().hex[:12])


@app.get("/saglik")
def saglik() -> dict[str, Any]:
    return {
        "durum": "acik",
        "kapi": "cloud_bridge",
        "motor": "gemini",
        "kamu": KAMU_API_KOK,
        "gemini": _gemini_var(),
    }


@app.get("/api/durum")
def durum() -> JSONResponse:
    return JSONResponse(
        content={
            "hazir": True,
            "token_gerekli": False,
            "lan_adresleri": [],
            "sabit_adres": KAMU_API_KOK,
            "portal": "/",
            "okuyucu": "/okuyucu/",
            "gemini": _gemini_var(),
            "ogrenme": _ogrenme(),
            "kota": _kota(),
            "ozel_bant_mm": list(_ozel_bant),
            "olcu_havuzu": {"adet": 0},
        },
        headers={"Cache-Control": "no-store"},
    )


@app.post("/api/tara")
@app.post("/api/tarama")
async def tara(
    dosya: UploadFile | None = File(default=None),
    foto: UploadFile | None = File(default=None),
    file: UploadFile | None = File(default=None),
    tel_cizim: bool = Query(default=False),
    kirpilmis: bool = Query(default=False),
    yalniz_yerel: bool = Query(default=False),
) -> dict[str, Any]:
    del yalniz_yerel
    yukleme = _dosya_al(dosya, foto, file)
    veri = await yukleme.read()
    # Gemini çağrısı bloklayıcı; iş parçacığında koşar ki aynı anda gelen ikinci istek kilide takılsın.
    return await run_in_threadpool(
        _tara_bayt,
        veri,
        tel_cizim=tel_cizim,
        kirpilmis=kirpilmis,
        dosya_adi=yukleme.filename,
        icerik_turu=yukleme.content_type,
    )


@app.post("/api/duzelt")
def duzelt(istek: DuzeltmeIstek) -> dict[str, Any]:
    kayit = istek.kayit_id.strip() or uuid.uuid4().hex[:12]
    return _listeyi_tamamla(
        {"kesim_listesi": istek.kesim_listesi, "genel_notlar": istek.genel_notlar},
        kayit,
    )


@app.post("/api/ozel-bant")
def ozel_bant_yaz(istek: OzelBantIstek) -> dict[str, Any]:
    mm = round(float(istek.mm), 2)
    if mm not in _ozel_bant:
        _ozel_bant.append(mm)
    return {"ozel_bant_mm": list(_ozel_bant)}


@app.delete("/api/ozel-bant")
def ozel_bant_sil(mm: float = Query(...)) -> dict[str, Any]:
    hedef = round(float(mm), 2)
    if hedef in _ozel_bant:
        _ozel_bant.remove(hedef)
    return {"ozel_bant_mm": list(_ozel_bant)}


@app.post("/api/usta-geri")
def usta_geri(istek: UstaGeriIstek) -> dict[str, Any]:
    if not str(istek.metin or "").strip():
        raise HTTPException(status_code=400, detail="Boş geri bildirim")
    return {"ok": True}


@app.post("/api/usta-hafiza")
def usta_hafiza(_istek: HafizaIstek) -> dict[str, Any]:
    return {"ok": True, "ogrenme": _ogrenme()}


@app.get("/api/olcu-havuzu")
def olcu_havuzu_liste(q: str = Query(default="")) -> dict[str, Any]:
    del q
    return {"liste": [], "adet": 0}


@app.delete("/api/olcu-havuzu")
def olcu_havuzu_sil(kayit: str = Query(...)) -> dict[str, Any]:
    raise HTTPException(status_code=404, detail=f"Havuz kaydı yok: {kayit}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("cloud_bridge:app", host="0.0.0.0", port=KOPRU_PORT, reload=False)
