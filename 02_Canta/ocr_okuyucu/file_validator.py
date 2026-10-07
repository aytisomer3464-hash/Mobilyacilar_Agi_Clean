"""Yüklenen görsel süzgeci: boş/büyük/sahte dosyayı OCR ve Gemini'den önce keser."""

from __future__ import annotations

import hashlib
import threading
from contextlib import contextmanager
from dataclasses import dataclass
from io import BytesIO
from pathlib import PurePath

from PIL import Image

from on_isleme import JPEG_SIHIR, PNG_SIHIR, GorselBicimHatasi

MAKS_BAYT = 12 * 1024 * 1024
MAKS_PIKSEL = 80_000_000

_PIL_TUR = {"JPEG": "jpeg", "PNG": "png"}
_UZANTI_TUR = {".jpg": "jpeg", ".jpeg": "jpeg", ".png": "png"}
_ICERIK_TUR = {"image/jpeg": "jpeg", "image/jpg": "jpeg", "image/png": "png"}
_TARAMA_KILIT = threading.Lock()
_acik_taramalar: set[str] = set()


class DosyaDogrulamaHatasi(GorselBicimHatasi):
    """GorselBicimHatasi alt sınıfı: mevcut except blokları değişmeden yakalar."""

    def __init__(self, mesaj: str, durum_kodu: int = 415):
        super().__init__(mesaj)
        self.durum_kodu = durum_kodu


@dataclass(frozen=True)
class DogrulananDosya:
    tur: str
    sha256: str
    genislik: int
    yukseklik: int
    uyarilar: tuple[str, ...] = ()


def imza_turu(veri: bytes) -> str | None:
    """Yalnız baştaki sihirli baytlara bakar; JPEG için 'jpeg', PNG için 'png'."""
    if veri.startswith(JPEG_SIHIR):
        return "jpeg"
    if veri.startswith(PNG_SIHIR):
        return "png"
    return None


def _uyarilar(tur: str, dosya_adi: str | None, icerik_turu: str | None) -> tuple[str, ...]:
    uyari: list[str] = []
    if dosya_adi:
        beklenen = _UZANTI_TUR.get(PurePath(str(dosya_adi)).suffix.lower())
        if beklenen and beklenen != tur:
            uyari.append(f"Uzantı {beklenen.upper()} diyor, içerik {tur.upper()}.")
    if icerik_turu:
        beklenen = _ICERIK_TUR.get(str(icerik_turu).split(";")[0].strip().lower())
        if beklenen and beklenen != tur:
            uyari.append(f"Bildirilen tür {beklenen.upper()}, içerik {tur.upper()}.")
    return tuple(uyari)


def dosya_dogrula(
    veri: bytes,
    dosya_adi: str | None = None,
    icerik_turu: str | None = None,
    maks_bayt: int = MAKS_BAYT,
    maks_piksel: int = MAKS_PIKSEL,
) -> DogrulananDosya:
    """Sırayla: boş, boyut, sihirli bayt, gerçek açılış ve piksel tavanı. Hatada DosyaDogrulamaHatasi."""
    if not veri:
        raise DosyaDogrulamaHatasi("Boş dosya", 400)
    if len(veri) > maks_bayt:
        raise DosyaDogrulamaHatasi(f"Dosya {maks_bayt // (1024 * 1024)} MB sınırını aşıyor", 413)
    tur = imza_turu(veri)
    if tur is None:
        raise DosyaDogrulamaHatasi("Desteklenmeyen görsel (JPEG/PNG).", 415)
    try:
        with Image.open(BytesIO(veri)) as gorsel:
            if _PIL_TUR.get(gorsel.format or "") != tur:
                raise DosyaDogrulamaHatasi("Görsel içeriği imzasıyla uyuşmuyor.", 415)
            genislik, yukseklik = gorsel.size
            if genislik < 1 or yukseklik < 1 or genislik * yukseklik > maks_piksel:
                raise DosyaDogrulamaHatasi("Görsel çözünürlüğü sınırı aşıyor.", 413)
            gorsel.verify()
    except DosyaDogrulamaHatasi:
        raise
    except Exception as hata:
        raise DosyaDogrulamaHatasi("Görsel açılamadı veya bozuk.", 415) from hata
    return DogrulananDosya(
        tur=tur,
        sha256=hashlib.sha256(veri).hexdigest(),
        genislik=genislik,
        yukseklik=yukseklik,
        uyarilar=_uyarilar(tur, dosya_adi, icerik_turu),
    )


@contextmanager
def tarama_kilidi(ozet: str):
    """Aynı SHA-256 işlenirken ikinci isteği 409 ile keser. İş bitince kilit kalkar."""
    with _TARAMA_KILIT:
        if ozet in _acik_taramalar:
            raise DosyaDogrulamaHatasi("Aynı görsel zaten taranıyor.", 409)
        _acik_taramalar.add(ozet)
    try:
        yield
    finally:
        with _TARAMA_KILIT:
            _acik_taramalar.discard(ozet)
