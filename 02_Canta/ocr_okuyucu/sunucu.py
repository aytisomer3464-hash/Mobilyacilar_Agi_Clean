"""HTTP vitrin: masaüstü .exe ve mobil tarayıcı aynı uçları kullanır.

OCR motoru burada çalışmaz; tarama `boru_hatti` üzerinden gider.
Bu dosya `02_Canta/ocr_okuyucu/` içinde kalır; kök veya `01_` altına taşınmaz.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
import hashlib
import hmac
import html
import importlib.util
import os
import socket
import sys
import threading
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from starlette.exceptions import HTTPException as StarletteHTTPException

from arsiv import (
    arsiv_izlemeyi_baslat,
    duzeltmeyi_arsivle,
    ham_taramayi_arsivle,
    harici_arsivi_isle,
    son_arsiv_ozeti,
)
from boru_hatti import kroki_oku_baytlari
from gecmis_aktar import gecmisi_arkaplanda_baslat
from hata_kayit import ARSIV, OKUMA, ON_ISLEME, SUNUCU, USTA_GERI, hata_yaz
from dogrulama import kesim_listesi_sanity_kontrol, liste_onayli_mi
from file_validator import DosyaDogrulamaHatasi, dosya_dogrula, tarama_kilidi
from on_isleme import GorselBicimHatasi, gorseli_baytlardan, gorseli_on_isle, jpeg_baytlari
from kota import kota_durumu, kota_harca
from ogrenme import duzeltme_kaydet_ve_belki_ogren, hafiza_sayisi, hafizaya_kaydet, hafizaya_kayittan, sayaci_oku, tarama_sayacini_artir
from olcu_havuzu import havuz_listesi, havuz_ozeti, havuz_sil, havuza_yaz, havuza_yaz_kayit
from ozel_bant import ozel_bant_ekle, ozel_bant_oku, ozel_bant_sil
from recete import akilli_recete_olustur

_CANTA_KOK = Path(__file__).resolve().parents[1]
_ANA_SITE = _CANTA_KOK.parent / "01_Ana_Site"
# tel_cizim klasörü OCR tel_cizim.py ile sys.path'e konmaz.
_KAPI_VITRIN = (
    ("tel", "tel_cizim", "/tel"),
    ("duvar", "elle_olcu/duvar", "/duvar"),
)
_ZEMIN_JS = _CANTA_KOK / "elle_olcu" / "zemin" / "zemin_motor.js"
_MOBILYA_KOK = _CANTA_KOK / "elle_olcu" / "mobilya"
_MOBILYA_JS = _MOBILYA_KOK / "mobilya_motor.js"
_MOBILYA_CFG = _MOBILYA_KOK / "varsayilan_config.json"
_MOBILYA_KATALOG = _MOBILYA_KOK / "katalog_arsiv.json"


def _kapi_vitrin(paket: str) -> Path | None:
    yol = _CANTA_KOK.joinpath(*str(paket).replace("\\", "/").split("/")) / "baglanti.py"
    if not yol.is_file():
        return None
    spec = importlib.util.spec_from_file_location(f"_magi_{paket}_baglanti", yol)
    if spec is None or spec.loader is None:
        return None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    try:
        return mod.vitrin_dizin()
    except FileNotFoundError:
        return None

MAKS_BAYT = 12 * 1024 * 1024
_TARA_SIRA = threading.Lock()
VARSAYILAN_PORT = int(os.environ.get("PORT", 8080))


class DuzeltmeIstek(BaseModel):
    kayit_id: str
    kesim_listesi: list[dict] = Field(default_factory=list)
    genel_notlar: list[str] = Field(default_factory=list)


class OzelBantIstek(BaseModel):
    mm: float


class UstaGeriIstek(BaseModel):
    metin: str = Field(default="", max_length=4000)
    kayit_id: str = ""


class HafizaIstek(BaseModel):
    kayit_id: str = ""
    orijinal: dict = Field(default_factory=dict)
    hedef: dict = Field(default_factory=dict)


def _ogrenme_ozet() -> dict:
    ozet = sayaci_oku()
    ozet["hafiza_kalip"] = hafiza_sayisi()
    return ozet


def temel_dizin() -> Path:
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent))
    return Path(__file__).resolve().parent


def ortam_yukle() -> None:
    exe_yani = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else temel_dizin()
    load_dotenv(exe_yani / ".env")
    load_dotenv(temel_dizin() / ".env")


def statik_klasor() -> Path:
    return temel_dizin() / "web" / "static"


def api_token() -> str:
    return os.environ.get("OCR_API_TOKEN", "").strip()


def vitrin_sifre() -> str:
    return os.environ.get("MAGI_VITRIN_SIFRE", "").strip()


def vitrin_imza() -> str:
    sifre = vitrin_sifre()
    if not sifre:
        return ""
    return hmac.new(sifre.encode("utf-8"), b"vitrin-kapi", hashlib.sha256).hexdigest()


def _guvenli_next(ham: str | None) -> str:
    y = str(ham or "/").strip()
    if not y.startswith("/") or y.startswith("//") or "://" in y:
        return "/"
    return y


def _giris_html(hata: bool = False, next_yol: str = "/") -> str:
    uyari = "<p class=\"hata\">Parola yanlış.</p>" if hata else ""
    nxt = html.escape(_guvenli_next(next_yol), quote=True)
    return (
        "<!DOCTYPE html><html lang=\"tr\"><head><meta charset=\"UTF-8\">"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        "<title>Kapı</title><style>"
        "body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;"
        "background:#2c3136;color:#e8e4dc;font-family:Segoe UI,sans-serif}"
        "form{width:min(320px,90vw);padding:24px;background:#1a1e22;border-radius:12px}"
        "h1{margin:0 0 16px;font-size:1.1rem}"
        "input{width:100%;box-sizing:border-box;min-height:44px;margin:0 0 12px;padding:8px 12px;"
        "border:1px solid #3a4046;border-radius:8px;background:#2c3136;color:#e8e4dc}"
        "button{width:100%;min-height:44px;border:0;border-radius:8px;background:#fb923c;"
        "color:#7c2d12;font-weight:800;cursor:pointer}"
        ".hata{margin:0 0 12px;color:#fb923c;font-size:0.9rem}"
        "</style></head><body><form method=\"post\" action=\"/giris\">"
        "<h1>Mobilyacılar Ağı</h1>"
        + uyari
        + f"<input type=\"hidden\" name=\"next\" value=\"{nxt}\">"
        "<input type=\"password\" name=\"sifre\" placeholder=\"Parola\" required autofocus>"
        "<button type=\"submit\">Giriş</button></form></body></html>"
    )


def sabit_adres() -> str:
    """Named tunnel / sabit alan adı; boşsa yalnızca LAN."""
    return os.environ.get("OCR_PUBLIC_URL", "").strip().rstrip("/")


def cors_kokenleri() -> list[str]:
    """OCR_CORS virgülle ayrılır; boş veya geçersiz değer * olur (LAN telefon kırılmaz)."""
    ham = os.environ.get("OCR_CORS", "*")
    parcalar = [p.strip() for p in str(ham).split(",") if p.strip()]
    return parcalar or ["*"]


def lan_adresleri(port: int) -> list[str]:
    adresler = [f"http://127.0.0.1:{port}"]
    bulunan: set[str] = set()
    try:
        baglanti = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        baglanti.connect(("8.8.8.8", 80))
        ip = baglanti.getsockname()[0]
        baglanti.close()
        if ip and not ip.startswith("127."):
            bulunan.add(ip)
    except OSError:
        pass
    try:
        for bilgi in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = bilgi[4][0]
            if ip and not ip.startswith("127."):
                bulunan.add(ip)
    except OSError:
        pass
    adresler.extend(f"http://{ip}:{port}" for ip in sorted(bulunan))
    return adresler


def _token_kontrol(x_ocr_token: str | None, authorization: str | None) -> None:
    beklenen = api_token()
    if not beklenen:
        return
    verilen = (x_ocr_token or "").strip()
    if authorization and authorization.lower().startswith("bearer "):
        verilen = authorization[7:].strip()
    if verilen != beklenen:
        raise HTTPException(status_code=401, detail="Geçersiz veya eksik OCR_API_TOKEN")


def uygulamayi_olustur() -> FastAPI:
    ortam_yukle()

    def _ilk_arsiv_tarama():
        try:
            harici_arsivi_isle()
        except Exception as hata:
            hata_yaz(ARSIV, "İlk arşiv tarama başarısız", hata)
            print(f"Uyarı: İlk arşiv tarama: {hata}")

    @asynccontextmanager
    async def omur(_app: FastAPI):
        if os.environ.get("OCR_ARSIV_IZLE", "1").strip() not in ("0", "false", "hayir"):
            arsiv_izlemeyi_baslat()
            threading.Thread(target=_ilk_arsiv_tarama, daemon=True, name="ilk-arsiv").start()
            if os.environ.get("OCR_GECMIS_GOC", "1").strip() not in ("0", "false", "hayir"):
                gecmisi_arkaplanda_baslat()
        yield

    app = FastAPI(title="Kesim OCR", version="1.0", lifespan=omur, redirect_slashes=True)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_kokenleri(),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def vitrin_kapi(istek: Request, call_next):
        if not vitrin_sifre():
            return await call_next(istek)
        yol = istek.url.path
        if yol.rstrip("/") == "/giris" or yol == "/favicon.ico":
            return await call_next(istek)
        verilen = (istek.cookies.get("magi_vitrin") or "").strip()
        if verilen and hmac.compare_digest(verilen, vitrin_imza()):
            return await call_next(istek)
        if yol.startswith("/api/"):
            return JSONResponse(status_code=401, content={"detail": "Kapı kilitli."})
        hedef = "/giris?next=" + _guvenli_next(yol)
        return RedirectResponse(url=hedef, status_code=303)

    @app.get("/giris")
    def giris_sayfa(next: str = Query(default="/")):
        if not vitrin_sifre():
            return RedirectResponse(url="/", status_code=303)
        return HTMLResponse(_giris_html(False, next), headers={"Cache-Control": "no-store"})

    @app.post("/giris")
    def giris_yaz(istek: Request, sifre: str = Form(""), next: str = Form(default="/")):
        if not vitrin_sifre():
            return RedirectResponse(url="/", status_code=303)
        verilen = hmac.new(sifre.encode("utf-8"), b"vitrin-kapi", hashlib.sha256).hexdigest()
        if not hmac.compare_digest(verilen, vitrin_imza()):
            return HTMLResponse(_giris_html(True, next), status_code=401, headers={"Cache-Control": "no-store"})
        git = _guvenli_next(next)
        yanit = RedirectResponse(url=git, status_code=303)
        yanit.set_cookie(
            "magi_vitrin",
            vitrin_imza(),
            httponly=True,
            samesite="lax",
            max_age=7 * 24 * 3600,
            path="/",
            secure=istek.url.scheme == "https",
        )
        return yanit

    @app.exception_handler(StarletteHTTPException)
    async def http_hata(_istek: Request, hata: StarletteHTTPException):
        """401/404 vb. kara kutuya yazılmaz; yanıt kodu olduğu gibi döner."""
        return JSONResponse(status_code=hata.status_code, content={"detail": hata.detail})

    @app.exception_handler(Exception)
    async def genel_hata(_istek: Request, hata: Exception):
        if isinstance(hata, StarletteHTTPException):
            return JSONResponse(status_code=hata.status_code, content={"detail": hata.detail})
        hata_yaz(SUNUCU, "Yakalanmayan sunucu istisnası", hata)
        return JSONResponse(status_code=500, content={"detail": "Sunucu hatası. Ayrıntı kara kutuya yazıldı."})

    @app.get("/api/kota")
    def kota(x_usta_id: str | None = Header(default=None)):
        return kota_durumu(x_usta_id or "varsayilan")

    @app.get("/api/durum")
    def durum(
        istek: Request,
        port: int = Query(default=0),
        x_usta_id: str | None = Header(default=None),
    ):
        arsiv_ozet = son_arsiv_ozeti()
        kullanilan = port or istek.url.port or int(os.environ.get("OCR_PORT", str(VARSAYILAN_PORT)))
        return JSONResponse(
            content={
                "hazir": True,
                "token_gerekli": bool(api_token()),
                "lan_adresleri": lan_adresleri(kullanilan),
                "sabit_adres": sabit_adres() or None,
                "portal": "/",
                "okuyucu": "/okuyucu",
                "ebatlama": "/ebatlama",
                "elle": "/duvar",
                "zemin": "/zemin",
                "tel": "/tel",
                "duvar": "/duvar",
                "gemini": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
                "ogrenme": _ogrenme_ozet(),
                "arsiv_tarama": arsiv_ozet,
                "kota": kota_durumu(x_usta_id or "varsayilan"),
                "ozel_bant_mm": ozel_bant_oku(),
                "olcu_havuzu": havuz_ozeti(),
            },
            headers={"Cache-Control": "no-store"},
        )

    @app.post("/api/tara")
    async def tara(
        dosya: UploadFile = File(...),
        yalniz_yerel: bool = Query(default=False),
        tel_cizim: bool = Query(default=False),
        kirpilmis: bool = Query(default=False),
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
        x_usta_id: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        usta = x_usta_id or "varsayilan"
        kota = kota_durumu(usta)
        if kota.get("kalan", 0) <= 0 and not yalniz_yerel:
            yalniz_yerel = True
        veri = await dosya.read()
        dosya_adi, icerik_turu = dosya.filename, dosya.content_type

        def isle():
            try:
                dogrulanan = dosya_dogrula(veri, dosya_adi, icerik_turu, maks_bayt=MAKS_BAYT)
                with tarama_kilidi(dogrulanan.sha256), _TARA_SIRA:
                    sonuc = kroki_oku_baytlari(
                        veri,
                        yalniz_yerel=yalniz_yerel,
                        tel_cizim_izinli=tel_cizim,
                        on_islenmis=kirpilmis,
                    )
                    if sonuc is None:
                        hata_yaz(OKUMA, "Kesim listesi üretilemedi veya görsel okunamadı")
                        raise HTTPException(status_code=422, detail="Görsel okunamadı veya kesim listesi üretilemedi")
                    havuz_vurus = sonuc.get("okuma_kaynak") == "havuz"
                    kayit_id = ham_taramayi_arsivle(veri, sonuc, dosya_adi)
                    kesin = liste_onayli_mi(sonuc)
                    sonuc["kesinlestirme"] = kesin
                    if kesin:
                        try:
                            duzeltmeyi_arsivle(kayit_id, sonuc)
                        except Exception as hata:
                            hata_yaz(ARSIV, f"Otomatik arşiv düzeltmesi yazılamadı: {kayit_id}", hata)
                    liste = sonuc.get("kesim_listesi") if isinstance(sonuc.get("kesim_listesi"), list) else []
                    supheli_n = sum(1 for p in liste if isinstance(p, dict) and p.get("supheli"))
                    if (not liste or supheli_n) and not sonuc.get("tel_cizim"):
                        hata_yaz(
                            OKUMA,
                            f"okuma kaynak={sonuc.get('okuma_kaynak') or '-'} satir={len(liste)} "
                            f"supheli={supheli_n} kayit={kayit_id} tel={bool(sonuc.get('tel_cizim'))}",
                        )
                    if havuz_vurus:
                        ogrenme = sayaci_oku()
                        kota = kota_durumu(usta)
                    else:
                        ogrenme = tarama_sayacini_artir()
                        kota = kota_harca(usta, 1)
                        if kesin:
                            havuza_yaz(veri, {**sonuc, "kayit_id": kayit_id}, kayit_id)
                    notlar = sonuc.setdefault("genel_notlar", [])
                    if isinstance(notlar, list) and kota.get("tukendi"):
                        notlar.append("Haftalık kota doldu. Eski defter krokisi arşive bırakarak kota yenileyin.")
                    if isinstance(ogrenme, dict):
                        ogrenme["hafiza_kalip"] = hafiza_sayisi()
                    return {**sonuc, "kayit_id": kayit_id, "ogrenme": ogrenme, "kota": kota}
            except DosyaDogrulamaHatasi as hata:
                hata_yaz(ON_ISLEME, str(hata), hata)
                raise HTTPException(status_code=hata.durum_kodu, detail=str(hata)) from hata
            except GorselBicimHatasi as hata:
                hata_yaz(ON_ISLEME, "Desteklenmeyen görsel (JPEG/PNG)", hata)
                raise HTTPException(status_code=415, detail="Desteklenmeyen görsel (JPEG/PNG).") from hata
            except HTTPException:
                raise
            except Exception as hata:
                hata_yaz(SUNUCU, "Tarama boru hattı düştü", hata)
                raise HTTPException(status_code=500, detail="Okuma sırasında hata. Kara kutuya yazıldı.") from hata

        # Bloklayıcı OCR/Gemini iş parçacığında koşar: olay döngüsü serbest kalır, aynı fotoğrafın
        # ikinci isteği kilide takılıp 409 alır. Farklı fotoğraflar _TARA_SIRA ile sırayla işlenir.
        return await run_in_threadpool(isle)

    @app.post("/api/onizle")
    async def onizle(
        dosya: UploadFile = File(...),
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        """Yedek uç: tarayıcı kırpması yoksa. Kota harcamaz, OCR yok. Web istemci OpenCV çağırmaz."""
        _token_kontrol(x_ocr_token, authorization)
        veri = await dosya.read()
        try:
            dosya_dogrula(veri, dosya.filename, dosya.content_type, maks_bayt=MAKS_BAYT)
        except DosyaDogrulamaHatasi as hata:
            raise HTTPException(status_code=hata.durum_kodu, detail=str(hata)) from hata
        except GorselBicimHatasi as hata:
            raise HTTPException(status_code=415, detail="Desteklenmeyen görsel (JPEG/PNG).") from hata
        try:
            gorsel = gorseli_on_isle(gorseli_baytlardan(veri))
            return Response(content=jpeg_baytlari(gorsel), media_type="image/jpeg")
        except Exception as hata:
            hata_yaz(ON_ISLEME, "Önizleme kırpma başarısız, ham görsel döndü", hata)
            return Response(content=veri, media_type=dosya.content_type or "image/jpeg")

    @app.post("/api/duzelt")
    def duzelt(
        istek: DuzeltmeIstek,
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        dogrulanmis = kesim_listesi_sanity_kontrol({
            "kesim_listesi": istek.kesim_listesi,
            "genel_notlar": istek.genel_notlar,
        })
        if dogrulanmis is None:
            raise HTTPException(status_code=422, detail="Düzeltilmiş liste doğrulanamadı")
        if not liste_onayli_mi(dogrulanmis):
            raise HTTPException(
                status_code=409,
                detail="Şüpheli satırlar onaylanmadan liste kesinleşmez ve arşive yazılmaz",
            )
        dogrulanmis["akilli_recete"] = akilli_recete_olustur(dogrulanmis.get("kesim_listesi") or [])
        try:
            duzeltmeyi_arsivle(istek.kayit_id, dogrulanmis)
        except FileNotFoundError as hata:
            hata_yaz(ARSIV, f"Düzeltme kaydı bulunamadı: {istek.kayit_id}", hata)
            raise HTTPException(status_code=404, detail=str(hata)) from hata
        except Exception as hata:
            hata_yaz(ARSIV, f"Düzeltme arşive yazılamadı: {istek.kayit_id}", hata)
            raise HTTPException(status_code=500, detail="Arşive yazılamadı. Kara kutuya yazıldı.") from hata
        ogrenme = duzeltme_kaydet_ve_belki_ogren()
        ogrenme["hafiza_kalip"] = hafiza_sayisi()
        havuza_yaz_kayit(istek.kayit_id, {**dogrulanmis, "kayit_id": istek.kayit_id})
        try:
            hafizaya_kayittan(istek.kayit_id, dogrulanmis)
        except Exception as hata:
            hata_yaz(SUNUCU, "Usta hafızası düzeltmeden işlenemedi", hata)
        return {**dogrulanmis, "kayit_id": istek.kayit_id, "ogrenme": ogrenme}

    @app.post("/api/ozel-bant")
    def ozel_bant_yaz(
        istek: OzelBantIstek,
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        try:
            return {"ozel_bant_mm": ozel_bant_ekle(istek.mm)}
        except ValueError as hata:
            raise HTTPException(status_code=400, detail=str(hata)) from hata

    @app.delete("/api/ozel-bant")
    def ozel_bant_kaldir(
        mm: float = Query(...),
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        try:
            return {"ozel_bant_mm": ozel_bant_sil(mm)}
        except ValueError as hata:
            raise HTTPException(status_code=400, detail=str(hata)) from hata

    @app.post("/api/usta-geri")
    def usta_geri(
        istek: UstaGeriIstek,
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        metin = " ".join((istek.metin or "").split()).replace("|", "/")
        if not metin:
            raise HTTPException(status_code=400, detail="Boş geri bildirim")
        kayit = (istek.kayit_id or "").strip()[:80]
        aciklama = f"Usta geri bildirimi kayit={kayit or '-'} {metin[:1500]}"
        hata_yaz(USTA_GERI, aciklama)
        return {"ok": True}

    @app.post("/api/usta-hafiza")
    def usta_hafiza(
        istek: HafizaIstek,
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        try:
            hafizaya_kaydet(istek.orijinal, istek.hedef)
        except Exception as hata:
            hata_yaz(SUNUCU, "Usta öğrenme hafızası kaydı düştü", hata)
            raise HTTPException(status_code=500, detail="Hafıza yazılamadı. Kara kutuya yazıldı.") from hata
        return {"ok": True, "ogrenme": _ogrenme_ozet()}

    @app.get("/api/olcu-havuzu")
    def olcu_havuzu_liste(
        q: str = Query(default=""),
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        try:
            return havuz_listesi(q)
        except Exception as hata:
            hata_yaz(ARSIV, "Havuz geçmişi API okunamadı", hata)
            raise HTTPException(status_code=500, detail="Havuz listesi alınamadı. Kara kutuya yazıldı.") from hata

    @app.delete("/api/olcu-havuzu")
    def olcu_havuzu_sil(
        kayit: str = Query(...),
        x_ocr_token: str | None = Header(default=None),
        authorization: str | None = Header(default=None),
    ):
        _token_kontrol(x_ocr_token, authorization)
        try:
            return havuz_sil(kayit)
        except ValueError as hata:
            raise HTTPException(status_code=400, detail=str(hata)) from hata
        except FileNotFoundError as hata:
            raise HTTPException(status_code=404, detail=str(hata)) from hata
        except Exception as hata:
            hata_yaz(ARSIV, "Havuz kaydı silinemedi", hata)
            raise HTTPException(status_code=500, detail="Havuz silinemedi. Kara kutuya yazıldı.") from hata

    @app.get("/favicon.ico")
    def favicon():
        return Response(status_code=204, headers={"Cache-Control": "public, max-age=86400"})

    statik = statik_klasor()
    index = statik / "index.html"
    ana_index = _ANA_SITE / "index.html"
    if statik.is_dir():
        @app.get("/")
        def ana_sayfa():
            if not ana_index.is_file():
                raise HTTPException(status_code=404, detail="Ana site yok")
            return FileResponse(ana_index, headers={"Cache-Control": "no-cache"})

        @app.get("/portal")
        @app.get("/portal/")
        def portal_yonlendir():
            return RedirectResponse(url="/", status_code=307)

        @app.get("/app.js")
        def ana_app_js():
            yol = _ANA_SITE / "app.js"
            if not yol.is_file():
                raise HTTPException(status_code=404, detail="Ana site yok")
            return FileResponse(yol, media_type="text/javascript", headers={"Cache-Control": "no-cache"})

        @app.get("/style.css")
        def ana_style_css():
            yol = _ANA_SITE / "style.css"
            if not yol.is_file():
                raise HTTPException(status_code=404, detail="Ana site yok")
            return FileResponse(yol, media_type="text/css", headers={"Cache-Control": "no-cache"})

        reklam_dizin = _ANA_SITE / "reklam"
        if reklam_dizin.is_dir():
            app.mount("/reklam", StaticFiles(directory=reklam_dizin), name="ana-reklam")

        @app.get("/elle")
        @app.get("/elle/")
        def elle_yonlendir():
            return RedirectResponse(url="/duvar/", status_code=307)

        @app.get("/zemin/zemin_motor.js")
        def zemin_motor_js():
            if not _ZEMIN_JS.is_file():
                raise HTTPException(status_code=404, detail="Zemin motor yok")
            return FileResponse(
                _ZEMIN_JS,
                media_type="text/javascript",
                headers={"Cache-Control": "no-cache"},
            )

        @app.get("/mobilya/mobilya_motor.js")
        def mobilya_motor_js():
            if not _MOBILYA_JS.is_file():
                raise HTTPException(status_code=404, detail="Mobilya motor yok")
            return FileResponse(
                _MOBILYA_JS,
                media_type="text/javascript",
                headers={"Cache-Control": "no-cache"},
            )

        @app.get("/mobilya/varsayilan_config.json")
        def mobilya_config():
            if not _MOBILYA_CFG.is_file():
                raise HTTPException(status_code=404, detail="Mobilya ayarı yok")
            return FileResponse(
                _MOBILYA_CFG,
                media_type="application/json",
                headers={"Cache-Control": "no-cache"},
            )

        @app.get("/mobilya/katalog_arsiv.json")
        def mobilya_katalog():
            if not _MOBILYA_KATALOG.is_file():
                raise HTTPException(status_code=404, detail="Mobilya kataloğu yok")
            return FileResponse(
                _MOBILYA_KATALOG,
                media_type="application/json",
                headers={"Cache-Control": "no-cache"},
            )

        @app.get("/okuyucu")
        def okuyucu_sayfasi():
            if not index.exists():
                raise HTTPException(status_code=404, detail="Arayüz dosyası yok")
            return FileResponse(index, headers={"Cache-Control": "no-cache"})

        app.mount("/static", StaticFiles(directory=statik), name="static")

    ebat_vitrin = _kapi_vitrin("ebatlama")
    if ebat_vitrin is not None:
        app.mount("/ebatlama", StaticFiles(directory=ebat_vitrin, html=True), name="ebatlama")
    for mount_ad, paket, yol in _KAPI_VITRIN:
        vitrin = _kapi_vitrin(paket)
        if vitrin is not None:
            app.mount(yol, StaticFiles(directory=vitrin, html=True), name=mount_ad)

    return app


app = uygulamayi_olustur()
