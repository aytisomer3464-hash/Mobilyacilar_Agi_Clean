"""Gemini yedek okuma: tek istemci, şema, prompt ve 503 backoff."""

from __future__ import annotations

import json
import os
import random
import time
from io import BytesIO
from typing import Any

from google import genai
from google.genai import types
from PIL import Image

from hata_kayit import hata_yaz
from kenar_bant import gemini_listesine_bant_yaz
from on_isleme import jpeg_baytlari, kutu_kirp
from ogrenme_kurallari import kurallari_yukle

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
MAKS_API_DENEME = 3
API_BEKLEME_SN = 3.0
MAKS_KIRPIM = 8
GEMINI_TIMEOUT_MS = max(1000, int(os.environ.get("GEMINI_TIMEOUT_MS", "60000")))

KESIM_LISTESI_SEMASI = {
    "type": "OBJECT",
    "properties": {
        "kesim_listesi": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "modul_kodu": {"type": "STRING"},
                    "parca_adi": {"type": "STRING"},
                    "uzunluk_mm": {"type": "NUMBER"},
                    "genislik_mm": {"type": "NUMBER"},
                    "kalinlik_mm": {"type": "NUMBER"},
                    "adet": {"type": "INTEGER"},
                    "malzeme": {"type": "STRING"},
                    "not": {"type": "STRING"},
                    "supheli": {"type": "BOOLEAN"},
                    "kategori": {"type": "STRING"},
                    "bant": {"type": "STRING"},
                },
                "required": [
                    "modul_kodu",
                    "parca_adi",
                    "uzunluk_mm",
                    "genislik_mm",
                    "kalinlik_mm",
                    "adet",
                    "malzeme",
                    "not",
                    "supheli",
                ],
            },
        },
        "yazilar": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "tur": {"type": "STRING"},
                    "kategori": {"type": "STRING"},
                    "malzeme": {"type": "STRING"},
                    "metin": {"type": "STRING"},
                },
            },
        },
        "tel_cizim": {"type": "BOOLEAN"},
        "tel_cizim_kutulari": {
            "type": "ARRAY",
            "items": {"type": "ARRAY", "items": {"type": "NUMBER"}},
        },
        "tel_cizim_olcu_notu": {"type": "STRING"},
        "genel_notlar": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
        },
    },
    "required": ["kesim_listesi", "genel_notlar"],
}

SISTEM_TALIMATI = """
Sen endüstriyel mobilya üretiminde uzman kıdemli bir marangoz ve teknik ressamsın.
Görseldeki el yazısı kesim kâğıdını incele ve Türkçe kesim listesi JSON üret.

YAZI OKUMA (KRİTİK):
- Kapak, dolap, klapa, gövde, defter, sipariş, müşteri başlıklarını oku.
- Malzeme türlerini oku: MDFLAM, MDF, sunta, lake, akrilik, ceviz, beyaz, 18mm vb.
- Bunları ilgili parçanın kategori ve malzeme alanına, ayrıca yazilar dizisine koy.
- Defter/sipariş satırları ölçü değildir; yazilar içinde tur=defter olarak geçir.

KENAR BANDI:
- Her parçanın bant alanına yalnızca 1-0-0-0 kodu yaz (uzun1-uzun2-kisa1-kisa2). Cümle, PVC paragrafı, sağ/sol açıklama yazma.
- İşaret yoksa 0-0-0-0. Varsayılan 4 kenar (1-1-1-1) YAZMA. Emin değilsen uydurma; supheli: true.
- NOKTA: Boy/en rakamının hemen ÜSTÜNDEKİ · adedi = o eksenin bantı. ·201 x ·43 → 1 Boy + 1 En; ··201 x 43 → 2 Boy.
- ADET SONRASI SAĞ SÜTUN: I/| = 1 Boy; L = 1 Boy + 1 En; C/U = 1 Boy + 2 En; || = 2 Boy; üst-alt yatay (═ / ——) = 2 En; □ = 4 Taraf.
- Aradaki ASCII eşittir (201 x 43 = 2, adet=2) BANT DEĞİLDİR; 2 En yazma, hata üretme.
- Sembolleri not alanına yaz (ör. "201 x 43 adet 2 L"). Ondalık 57.4 bant değildir.
- PVC kalınlığını (0.4 / 0.8 / 1 / 2 mm) not alanına yaz.

TEL ÇİZİM:
- Ölçülendirilmemiş teknik çizim, kroki, tel çizim veya geometrik şema KESİM LİSTESİ DEĞİLDİR. Bundan parça uydurma; kesim_listesi'ne yazma.
- tel_cizim=true yap. Şemanın kâğıt üzerindeki kutusunu tel_cizim_kutulari içine [x, y, w, h] olarak yaz.
- Şema üzerinde net boy×en (ör. 720 x 400) varsa tel_cizim_olcu_notu'na yaz; bunu kesim satırı yapma.
- Şalter KAPALI: karalamadan ölçü UYDURMA. El yazısı kesim tablosu (boy x en, adet, kapak/gövde/arkalık) her zaman kesim_listesi'ne yazılsın.
- Şalter AÇIK: tel çizimi yazilar/genel_notlar ile tarif et; yine kesim satırı uydurma.
- Kâğıtta hem kroki hem ölçü tablosu varsa yalnız tabloyu oku; krokiyi tel_cizim olarak işaretle.

DİĞER:
- Kâğıttaki cm ölçülerini mm'ye çevir (83 -> 830, 49.8 -> 498, 154.6 -> 1546).
- Rakamları tek tek oku; 1↔7, 3↔8, 5↔6, 0↔9, 4↔9 karışmasın.
- Üzeri çizili / iptal satırları listeye alma.
- modul_kodu malzeme adı değil; M1, M2 gibi olsun.
- Emin olmadığın satırda supheli: true yaz; rakam/ölçü/bant UYDURMA, sessizce atlama.
"""

_istemci = None


def gemini_istemcisi():
    global _istemci
    anahtar = os.environ.get("GEMINI_API_KEY", "").strip()
    if not anahtar:
        raise RuntimeError("GEMINI_API_KEY ortam değişkeni tanımlı değil!")
    if _istemci is None:
        _istemci = genai.Client(
            api_key=anahtar,
            http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS),
        )
    return _istemci


def istemciyi_sifirla() -> None:
    global _istemci
    _istemci = None


def _gecici_hata(hata: Exception) -> bool:
    if _zaman_asimi_hata(hata):
        return False
    metin = str(hata).lower()
    kod = getattr(hata, "status_code", None) or getattr(hata, "code", None)
    if kod in (429, 500, 502, 503, 504):
        return True
    return any(kelime in metin for kelime in ("unavailable", "429", "503", "resource exhausted", "overloaded"))


def _zaman_asimi_hata(hata: Exception) -> bool:
    if isinstance(hata, TimeoutError):
        return True
    ad = type(hata).__name__.lower()
    metin = str(hata).lower()
    return "timeout" in ad or any(
        parca in metin for parca in ("timeout", "timed out", "deadline", "zaman aşımı")
    )


def _gorsel_parcalari(gorsel: Image.Image, dusuk_parcalar: list[dict[str, Any]] | None) -> list[types.Part]:
    parcalar: list[types.Part] = [
        types.Part.from_bytes(data=jpeg_baytlari(gorsel), mime_type="image/jpeg")
    ]
    if not dusuk_parcalar:
        return parcalar
    kirpimlar = []
    for oge in dusuk_parcalar:
        kutu = oge.get("kutu")
        if kutu is None:
            continue
        kirpimlar.append(kutu_kirp(gorsel, kutu))
        if len(kirpimlar) >= MAKS_KIRPIM:
            break
    if not kirpimlar:
        return parcalar
    genislik = max(k.width for k in kirpimlar)
    yukseklik = sum(k.height for k in kirpimlar)
    kolaj = Image.new("RGB", (genislik, yukseklik), (255, 255, 255))
    y = 0
    for k in kirpimlar:
        kolaj.paste(k, (0, y))
        y += k.height
    kolaj.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
    tampon = BytesIO()
    kolaj.save(tampon, format="JPEG", quality=85, optimize=True)
    parcalar.append(types.Part.from_bytes(data=tampon.getvalue(), mime_type="image/jpeg"))
    return parcalar


def gemini_kesim_oku(
    gorsel: Image.Image,
    yerel_adaylar: list[dict[str, Any]] | None = None,
    dusuk_parcalar: list[dict[str, Any]] | None = None,
    tel_cizim_izinli: bool = False,
    yerel_yazilar: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    istemci = gemini_istemcisi()
    baglam = ""
    if yerel_adaylar:
        ozet = []
        for aday in yerel_adaylar:
            ozet.append({
                "ham_metin": aday.get("ham_metin") or aday.get("not"),
                "guven": aday.get("guven"),
                "uzunluk_mm": aday.get("uzunluk_mm"),
                "genislik_mm": aday.get("genislik_mm"),
                "adet": aday.get("adet"),
            })
        baglam = "Yerel OCR adayları (doğrula):\n" + json.dumps(ozet, ensure_ascii=False)
    if yerel_yazilar:
        baglam += ("\n" if baglam else "") + "Usta yazıları:\n" + json.dumps(
            [{"tur": y.get("tur"), "metin": y.get("metin"), "kategori": y.get("kategori"), "malzeme": y.get("malzeme")}
             for y in yerel_yazilar],
            ensure_ascii=False,
        )

    icerik = _gorsel_parcalari(gorsel, dusuk_parcalar)
    ogrenilen = kurallari_yukle().get("gemini_notlari") or []
    ogrenme_metni = ""
    if ogrenilen:
        ogrenme_metni = "\nAtölye öğrenmesi:\n- " + "\n- ".join(str(n) for n in ogrenilen)
    salter = "AÇIK: tel çizimleri tasarıma dahil et." if tel_cizim_izinli else "KAPALI: tel çizim/karalamadan ölçü üretme."
    icerik.append(
        SISTEM_TALIMATI.strip()
        + f"\nTEL ÇİZİM ŞALTERİ: {salter}"
        + ogrenme_metni
        + ("\n\n" + baglam if baglam else "")
    )

    son_hata: Exception | None = None
    for deneme in range(1, MAKS_API_DENEME + 1):
        try:
            yanit = istemci.models.generate_content(
                model=GEMINI_MODEL,
                contents=icerik,
                config=types.GenerateContentConfig(
                    http_options=types.HttpOptions(timeout=GEMINI_TIMEOUT_MS),
                    response_mime_type="application/json",
                    response_schema=KESIM_LISTESI_SEMASI,
                    temperature=0.0,
                ),
            )
            return gemini_listesine_bant_yaz(json.loads(yanit.text))
        except json.JSONDecodeError as hata:
            son_hata = hata
            hata_yaz("GEMINI_API", f"Gemini geçerli JSON döndürmedi (deneme {deneme})", hata)
            print(f"Hata: Gemini geçerli JSON döndürmedi: {hata}")
            if deneme == MAKS_API_DENEME:
                raise
        except Exception as hata:
            son_hata = hata
            if _zaman_asimi_hata(hata):
                hata_yaz("GEMINI_API", "Gemini istemci zaman aşımı", hata)
                raise TimeoutError("gemini_zaman_asimi") from hata
            if _gecici_hata(hata) and deneme < MAKS_API_DENEME:
                bekle = API_BEKLEME_SN + random.uniform(0, 1.5)
                hata_yaz("GEMINI_API", f"Gemini geçici hata, tekrar denenecek (deneme {deneme})", hata)
                print(f"Uyarı: Gemini geçici hata ({hata}); {bekle:.1f}s sonra tekrar.")
                time.sleep(bekle)
                continue
            hata_yaz("GEMINI_API", f"Gemini isteği başarısız oldu (deneme {deneme})", hata)
            print(f"Hata: Gemini isteği başarısız oldu: {hata}")
            raise
    raise RuntimeError(f"Gemini yanıtı alınamadı: {son_hata}")
