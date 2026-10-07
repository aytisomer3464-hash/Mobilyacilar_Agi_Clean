"""Atölye sınırları, adet düzeltme ve ilişkisel dikme uyarısı (silmeden işaretle)."""

from __future__ import annotations

import math
from typing import Any

from kenar_bant import parcaya_bant_yaz
from ogrenme_hafiza import hafizadan_doldur, okunan_kopya
from ogrenme_kurallari import kurallari_yukle
from on_isleme import kutu_bbox

BOY_TOLERANSI_MM = 2.0
STANDART_KALINLIKLAR = (18.0, 8.0, 4.0, 3.0)
KALINLIK_YAKINLIK = 0.6
KISA_DIKME_ANAHTARLARI = ("ara dikme", "orta dikme", "bölme", "bolme")


def _aktif_kurallar() -> dict:
    return kurallari_yukle()


def adet_coerce(deger: Any, maksimum_adet: int = 100) -> int | None:
    if isinstance(deger, bool) or deger is None:
        return None
    if isinstance(deger, int):
        adet = deger
    elif isinstance(deger, float) and math.isfinite(deger) and deger == int(deger):
        adet = int(deger)
    elif isinstance(deger, str) and deger.strip().isdigit():
        adet = int(deger.strip())
    else:
        return None
    if 1 <= adet <= maksimum_adet:
        return adet
    return None


def olcu_gecerli(
    deger: Any,
    minimum_olcu_mm: float,
    maksimum_olcu_mm: float,
) -> float | None:
    if isinstance(deger, bool) or not isinstance(deger, (int, float)):
        return None
    sayi = float(deger)
    if not math.isfinite(sayi) or not (minimum_olcu_mm <= sayi <= maksimum_olcu_mm):
        return None
    return sayi


def kalinlik_yuvarla(deger: float) -> tuple[float, bool]:
    kurallar = _aktif_kurallar()
    kalinliklar = tuple(float(k) for k in kurallar.get("standart_kalinliklar") or STANDART_KALINLIKLAR)
    yakinlik = float(kurallar.get("kalinlik_yakinlik") or KALINLIK_YAKINLIK)
    if not kalinliklar:
        kalinliklar = STANDART_KALINLIKLAR
    en_yakin = min(kalinliklar, key=lambda k: abs(k - deger))
    if abs(en_yakin - deger) <= yakinlik:
        return en_yakin, en_yakin != deger
    return deger, False


def _tel_alanlari(kaynak: dict[str, Any]) -> dict[str, Any]:
    """Tel çizim uyarı/çerçeve alanlarını doğrulama çıktısına taşır."""
    alan: dict[str, Any] = {}
    if kaynak.get("tel_cizim"):
        alan["tel_cizim"] = True
    if kaynak.get("tel_cizim_filtrelendi"):
        alan["tel_cizim_filtrelendi"] = True
    kutular = kaynak.get("tel_cizim_kutulari")
    if isinstance(kutular, list) and kutular:
        alan["tel_cizim_kutulari"] = kutular
    uyari = kaynak.get("tel_cizim_uyari")
    if isinstance(uyari, str) and uyari.strip():
        alan["tel_cizim_uyari"] = uyari.strip()
    return alan


def kesim_listesi_sanity_kontrol(
    json_verisi,
    minimum_olcu_mm=10,
    maksimum_olcu_mm=5000,
    maksimum_kalinlik_mm=100,
    maksimum_adet=100,
    etkilesimli_onay=False,
):
    """Şüpheli kalemleri silmez; supheli işaretler ve not düşer."""
    del etkilesimli_onay
    if not isinstance(json_verisi, dict):
        print("Hata: Yanıt beklenen JSON nesnesi formatında değil!")
        return None

    kesim_listesi = json_verisi.get("kesim_listesi")
    if not isinstance(kesim_listesi, list):
        print("Hata: JSON içinde geçerli bir kesim listesi bulunamadı!")
        return None

    genel_notlar = json_verisi.get("genel_notlar", [])
    if not isinstance(genel_notlar, list):
        genel_notlar = []
    notlar = [n for n in genel_notlar if isinstance(n, str)]
    temiz: list[dict[str, Any]] = []

    for sira, parca in enumerate(kesim_listesi, start=1):
        if not isinstance(parca, dict):
            print(f"Uyarı: {sira}. kesim kalemi nesne olmadığı için atlandı.")
            continue

        kayit = dict(parca)
        kayit["supheli"] = bool(kayit.get("supheli", False))
        sorunlar: list[str] = []

        uzunluk = olcu_gecerli(kayit.get("uzunluk_mm"), minimum_olcu_mm, maksimum_olcu_mm)
        genislik = olcu_gecerli(kayit.get("genislik_mm"), minimum_olcu_mm, maksimum_olcu_mm)
        kalinlik = olcu_gecerli(kayit.get("kalinlik_mm"), 0.5, maksimum_kalinlik_mm)
        adet = adet_coerce(kayit.get("adet"), maksimum_adet)

        if uzunluk is None:
            sorunlar.append("uzunluk")
        else:
            kayit["uzunluk_mm"] = uzunluk
        if genislik is None:
            sorunlar.append("genislik")
        else:
            kayit["genislik_mm"] = genislik
        if kalinlik is None:
            sorunlar.append("kalinlik")
        else:
            yuvarlanmis, degisti = kalinlik_yuvarla(kalinlik)
            kayit["kalinlik_mm"] = yuvarlanmis
            if degisti:
                notlar.append(
                    f"{sira}. kalem kalınlığı {kalinlik} mm -> {yuvarlanmis} mm atölye standardına çekildi."
                )
        if adet is None:
            sorunlar.append("adet")
        else:
            kayit["adet"] = adet

        kayit.setdefault("modul_kodu", "GENEL")
        kayit.setdefault("parca_adi", "Parça")
        kayit.setdefault("malzeme", "")
        kayit.setdefault("not", "")
        kayit.setdefault("kategori", "")
        if not kayit.get("hafiza_vurus"):
            _ogrenilen_eslemeleri_uygula(kayit)
            hafizadan_doldur(kayit)
        if not kayit.get("okunan"):
            kayit["okunan"] = okunan_kopya(kayit)
        if "bant" not in kayit and not kayit.get("hafiza_vurus"):
            parcaya_bant_yaz(kayit)

        if sorunlar and not kayit.get("hafiza_vurus"):
            kayit["supheli"] = True
            kayit["okunamadi"] = True
            kayit["suphe_seviye"] = "kirmizi"
            kayit["suphe_neden"] = "Okunamayan ölçü; tahmin yok."
            mesaj = (
                f"{sira}. kalem ({kayit.get('modul_kodu')} - {kayit.get('parca_adi')}) "
                f"şüpheli alanlar: {', '.join(sorunlar)}"
            )
            print(f"[DİKKAT] {mesaj}")
            notlar.append(mesaj)
            kayit["not"] = (str(kayit.get("not") or "") + f" | {mesaj}").strip(" |")

        bbox = kutu_bbox(kayit.get("kutu"))
        kayit.pop("kutu", None)
        kayit.pop("bant_isaret", None)
        if bbox:
            kayit["kutu"] = bbox
        temiz.append(kayit)

    if not temiz:
        if json_verisi.get("tel_cizim_filtrelendi") or json_verisi.get("olcusuz_izin"):
            bos = {
                "kesim_listesi": [],
                "genel_notlar": notlar or ["Ölçü satırı yok; reçete yazılardan üretildi."],
                "tel_cizim_filtrelendi": bool(json_verisi.get("tel_cizim_filtrelendi")),
            }
            bos.update(_tel_alanlari(json_verisi))
            return bos
        print("Hata: Doğrulama sonrasında kullanılabilir kesim kalemi kalmadı!")
        return None

    _dikme_uyumsuzlugunu_isaretle(temiz, notlar)

    sonuc = {"kesim_listesi": temiz, "genel_notlar": notlar}
    sonuc.update(_tel_alanlari(json_verisi))
    return sonuc


def liste_onayli_mi(veri: Any) -> bool:
    """Şüpheli veya onay bekleyen satır varken liste kesin değildir."""
    if not isinstance(veri, dict):
        return False
    onay = veri.get("usta_onay")
    if isinstance(onay, dict) and onay.get("gerekli"):
        return False
    liste = veri.get("kesim_listesi")
    if not isinstance(liste, list):
        return False
    for parca in liste:
        if not isinstance(parca, dict):
            continue
        if parca.get("supheli") or parca.get("onay_bekliyor") or parca.get("okunamadi"):
            return False
    return True


def _ogrenilen_eslemeleri_uygula(kayit: dict[str, Any]) -> None:
    kurallar = _aktif_kurallar()
    parca_esle = kurallar.get("parca_adi_esle") or {}
    modul_esle = kurallar.get("modul_esle") or {}
    malzeme_esle = kurallar.get("malzeme_esle") or {}
    parca = str(kayit.get("parca_adi") or "")
    if parca.lower() in parca_esle:
        kayit["parca_adi"] = parca_esle[parca.lower()]
    modul = str(kayit.get("modul_kodu") or "")
    if modul.lower() in modul_esle:
        kayit["modul_kodu"] = modul_esle[modul.lower()]
    malzeme = str(kayit.get("malzeme") or "")
    if malzeme.lower() in malzeme_esle:
        kayit["malzeme"] = malzeme_esle[malzeme.lower()]


def _dikme_uyumsuzlugunu_isaretle(kesim_listesi: list[dict[str, Any]], notlar: list[str]) -> None:
    modul_gruplari: dict[str, list[dict[str, Any]]] = {}
    for parca in kesim_listesi:
        modul_gruplari.setdefault(str(parca.get("modul_kodu", "GENEL")), []).append(parca)

    for m_kod, kayitlar in modul_gruplari.items():
        dikmeler = []
        for parca in kayitlar:
            ad = str(parca.get("parca_adi", "")).lower()
            if "dikme" in ad and not any(anahtar in ad for anahtar in KISA_DIKME_ANAHTARLARI):
                if isinstance(parca.get("uzunluk_mm"), (int, float)):
                    dikmeler.append(parca)
        if len(dikmeler) < 2:
            continue
        boylar = [float(p["uzunluk_mm"]) for p in dikmeler]
        medyan = sorted(boylar)[len(boylar) // 2]
        tolerans = float(_aktif_kurallar().get("boy_toleransi_mm") or BOY_TOLERANSI_MM)
        aykirilar = [p for p in dikmeler if abs(float(p["uzunluk_mm"]) - medyan) > tolerans]
        if not aykirilar:
            continue
        for parca in dikmeler:
            if abs(float(parca["uzunluk_mm"]) - medyan) > tolerans:
                parca["supheli"] = True
                parca["suphe_seviye"] = parca.get("suphe_seviye") or "sari"
                parca["suphe_neden"] = parca.get("suphe_neden") or "Dikme boyları uyuşmuyor; tahmin yok."
        mesaj = (
            f"{m_kod} modülünde dikme boyları uyuşmuyor "
            f"({', '.join(str(b) for b in boylar)} mm). Kalemler silinmedi, şüpheli işaretlendi."
        )
        print(f"[İlişkisel Uyarı] {mesaj}")
        notlar.append(mesaj)
