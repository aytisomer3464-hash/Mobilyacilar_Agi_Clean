"""Hibrit kesim kâğıdı okuma: yerel OCR, gerekirse Gemini, sonra doğrulama."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from PIL import Image

from dogrulama import kesim_listesi_sanity_kontrol
from gemini_yedek import gemini_kesim_oku
from hata_kayit import BORU_HATTI, DOSYA, GEMINI_API, OCR_YEREL, OKUMA, ON_ISLEME, hata_yaz
from metin_yazilar import basliklari_uygula
from olcu_havuzu import havuzdan_oku
from on_isleme import gorseli_baytlardan, gorseli_on_isle, gorsel_sihir_kontrol, kutu_sikistir
from recete import akilli_recete_olustur
from tel_cizim import (
    semadan_parca_ayikla,
    tel_cizim_aday_mi,
    tel_cizim_bolgeleri,
    tel_cizim_uyari_metni,
    tel_kutularini_birlestir,
    tel_olcu_ibaresi,
)
from usta_havuz import kalip_bul
from usta_mantik import kesim_hamini_duzelt
from yerel_ocr import dusuk_guvenli_parcalar, ocr_okuma, yerel_yeterli_mi


def _parcalari_json(parcalar: list[dict[str, Any]]) -> dict[str, Any]:
    liste = []
    for parca in parcalar:
        kayit = {
            "modul_kodu": parca.get("modul_kodu", "GENEL"),
            "parca_adi": parca.get("parca_adi", "Parça"),
            "uzunluk_mm": parca.get("uzunluk_mm"),
            "genislik_mm": parca.get("genislik_mm"),
            "kalinlik_mm": parca.get("kalinlik_mm", 18),
            "adet": parca.get("adet", 1),
            "malzeme": parca.get("malzeme", ""),
            "kategori": parca.get("kategori", ""),
            "bant": parca.get("bant"),
            "bant_isaret": parca.get("bant_isaret") or "",
            "not": parca.get("not", ""),
            "supheli": bool(parca.get("supheli", False)),
            "okunan": parca.get("okunan"),
            "hafiza_vurus": bool(parca.get("hafiza_vurus")),
            "suphe_seviye": parca.get("suphe_seviye") or "",
            "suphe_neden": parca.get("suphe_neden") or "",
            "okunamadi": bool(parca.get("okunamadi")),
            "kutu": parca.get("kutu"),
            "guven": parca.get("guven"),
            "ham_metin": parca.get("ham_metin") or parca.get("not", ""),
        }
        liste.append(kayit)
    return {"kesim_listesi": liste, "genel_notlar": ["Yerel OCR ile okundu."]}


def _yaz_ve_don(sonuc: dict[str, Any] | None, cikti_dosyasi: str | Path | None) -> dict[str, Any] | None:
    if sonuc is None:
        return None
    if cikti_dosyasi:
        Path(cikti_dosyasi).write_text(
            json.dumps(sonuc, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    return sonuc


def _receteli(
    dogrulanmis: dict[str, Any] | None,
    yazilar: list[dict[str, Any]],
    tel_cizim_izinli: bool,
    tel_algilandi: bool,
    tel_filtrelendi: bool,
) -> dict[str, Any] | None:
    if dogrulanmis is None:
        return None
    ek_yazilar = dogrulanmis.get("yazilar") if isinstance(dogrulanmis.get("yazilar"), list) else []
    birlesik = list(yazilar)
    for yazi in ek_yazilar:
        if isinstance(yazi, dict) and yazi.get("metin"):
            birlesik.append(yazi)
    dogrulanmis["yazilar"] = [
        {k: v for k, v in y.items() if k != "kutu"} for y in birlesik if isinstance(y, dict)
    ]
    dogrulanmis["akilli_recete"] = akilli_recete_olustur(
        dogrulanmis.get("kesim_listesi") or [],
        dogrulanmis["yazilar"],
        tel_cizim_izinli=tel_cizim_izinli,
        tel_cizim_algilandi=tel_algilandi,
        tel_cizim_filtrelendi=tel_filtrelendi,
    )
    return basliklari_uygula(dogrulanmis, birlesik)


def _tel_koruma_uygula(
    ham: dict[str, Any],
    gorsel: Image.Image,
    yerel_parcalar: list[dict[str, Any]],
    yazilar: list[dict[str, Any]],
    tel_algilandi: bool,
) -> tuple[dict[str, Any], bool]:
    """Şema bölgelerini çerçeveler; uydurma ölçü satırlarını listeden düşürür."""
    olcu_kutulari = [p.get("kutu") for p in yerel_parcalar if isinstance(p, dict)]
    bolgeler = tel_cizim_bolgeleri(gorsel, olcu_kutulari)
    gemini_kutu = ham.get("tel_cizim_kutulari") if isinstance(ham.get("tel_cizim_kutulari"), list) else []
    bolgeler = tel_kutularini_birlestir(list(bolgeler) + list(gemini_kutu))
    if ham.get("tel_cizim") is True:
        tel_algilandi = True
    if bolgeler:
        tel_algilandi = True
    if not tel_algilandi:
        return ham, False
    ham["tel_cizim"] = True
    liste = ham.get("kesim_listesi") if isinstance(ham.get("kesim_listesi"), list) else []
    if bolgeler:
        ham["kesim_listesi"] = semadan_parca_ayikla(liste, bolgeler)
        liste = ham["kesim_listesi"]
    if not bolgeler and not liste:
        gw, gh = gorsel.size
        bolgeler = [[gw * 0.05, gh * 0.05, gw * 0.90, gh * 0.90]]
    if bolgeler:
        ham["tel_cizim_kutulari"] = bolgeler
    if not (ham.get("kesim_listesi") or []):
        ham["tel_cizim_filtrelendi"] = True
    olcu_notu = str(ham.get("tel_cizim_olcu_notu") or "").strip() or tel_olcu_ibaresi(yazilar, yerel_parcalar)
    uyari = tel_cizim_uyari_metni(olcu_notu)
    ham["tel_cizim_uyari"] = uyari
    notlar = ham.setdefault("genel_notlar", [])
    if isinstance(notlar, list) and uyari not in notlar:
        notlar.append(uyari)
    return ham, True


def _tara_gorsel(
    gorsel: Image.Image,
    yalniz_yerel: bool = False,
    gemini_oku=None,
    tel_cizim_izinli: bool = False,
) -> dict[str, Any] | None:
    """Ön işlemesi bitmiş görsel üzerinde yerel OCR → gerekirse Gemini → doğrulama."""
    gemini_oku = gemini_kesim_oku if gemini_oku is None else gemini_oku
    yerel_parcalar: list[dict[str, Any]] = []
    yazilar: list[dict[str, Any]] = []
    try:
        yerel_parcalar, yazilar = ocr_okuma(gorsel)
    except Exception as hata:
        hata_yaz(OCR_YEREL, "Boru hattında yerel OCR düştü, boş adaylarla devam", hata)
        yerel_parcalar, yazilar = [], []

    tel_algilandi = tel_cizim_aday_mi(gorsel, len(yerel_parcalar))
    # Yalnız yerel ve ölçü yoksa karalamayı boş listeyle kes; Gemini'yi atlama.
    if tel_algilandi and not tel_cizim_izinli and yalniz_yerel and not yerel_parcalar:
        print("Bilgi: Tel çizim/karalama algılandı; şalter kapalı olduğu için ölçü üretilmedi.")
        ham = {
            "kesim_listesi": [],
            "genel_notlar": ["Tel çizim / karalama ölçü olarak okunmadı (şalter kapalı)."],
            "tel_cizim_filtrelendi": True,
        }
        ham, _ = _tel_koruma_uygula(ham, gorsel, yerel_parcalar, yazilar, True)
        sonuc = _receteli(kesim_listesi_sanity_kontrol(ham), yazilar, False, True, True)
        if sonuc is not None:
            sonuc["okuma_kaynak"] = "yerel"
        return sonuc

    ham: dict[str, Any] | None = None
    kaynak = "yerel"
    havuz_liste = kalip_bul(yerel_parcalar) if yerel_parcalar else None

    if havuz_liste:
        ham = _parcalari_json(havuz_liste)
        ham["genel_notlar"] = ["Usta havuzu: kalıp eşleşti, yapay zeka atlandı."]
        kaynak = "havuz"
        print(f"Bilgi: Usta havuzunda kalıp bulundu ({len(havuz_liste)} satır), Gemini atlandı.")
    elif yerel_yeterli_mi(yerel_parcalar):
        ham = _parcalari_json(yerel_parcalar)
        print(f"Bilgi: Yerel OCR yeterli görüldü ({len(yerel_parcalar)} satır), Gemini atlandı.")
    elif yalniz_yerel:
        if not yerel_parcalar:
            if tel_cizim_izinli and yazilar:
                ham = {
                    "kesim_listesi": [],
                    "genel_notlar": ["Tel çizim reçeteye alındı; ölçü satırı yok."],
                    "olcusuz_izin": True,
                }
            else:
                print("Hata: Yerel OCR sonuç üretmedi (--yalniz-yerel).")
                hata_yaz(OKUMA, "Yalnız yerel: OCR ölçü satırı üretmedi")
                return None
        else:
            ham = _parcalari_json(yerel_parcalar)
            ham["genel_notlar"].append("Yalnız yerel mod: düşük güvenli satırlar da dahil edildi.")
            print("Uyarı: Yerel OCR tam güvenilir değil; Gemini devre dışı.")
    else:
        if not os.environ.get("GEMINI_API_KEY", "").strip() and gemini_oku is gemini_kesim_oku:
            print("Hata: GEMINI_API_KEY tanımlı değil ve yerel OCR yetersiz.")
            if yerel_parcalar:
                ham = _parcalari_json(yerel_parcalar)
                ham["genel_notlar"].append("Anahtar yok; yalnızca yerel adaylar döndü.")
            else:
                hata_yaz(OKUMA, "GEMINI_API_KEY yok ve yerel OCR yetersiz; boş sonuç")
                return None
        else:
            try:
                ham = gemini_oku(
                    gorsel,
                    yerel_adaylar=yerel_parcalar or None,
                    dusuk_parcalar=dusuk_guvenli_parcalar(yerel_parcalar) or None,
                    tel_cizim_izinli=tel_cizim_izinli,
                    yerel_yazilar=yazilar or None,
                )
                kaynak = "gemini"
            except TypeError as hata:
                hata_yaz(GEMINI_API, "Gemini imza uyumsuz, sade çağrı denenecek", hata)
                ham = gemini_oku(
                    gorsel,
                    yerel_adaylar=yerel_parcalar or None,
                    dusuk_parcalar=dusuk_guvenli_parcalar(yerel_parcalar) or None,
                )
                kaynak = "gemini"
            except Exception as hata:
                hata_yaz(GEMINI_API, "Gemini başarısız, yerel adaylara düşülecek", hata)
                if yerel_parcalar:
                    print("Uyarı: Gemini başarısız, yerel adaylar kullanılacak.")
                    ham = _parcalari_json(yerel_parcalar)
                else:
                    hata_yaz(OKUMA, "Gemini düştü ve yerel aday yok")
                    return None

    if not isinstance(ham, dict):
        print("Hata: Okuma sonucu JSON nesnesi değil.")
        hata_yaz(OKUMA, "Okuma sonucu JSON nesnesi değil")
        return None

    ham, tel_algilandi = _tel_koruma_uygula(ham, gorsel, yerel_parcalar, yazilar, tel_algilandi)

    if ham.get("tel_cizim") is True and not tel_cizim_izinli:
        tel_algilandi = True
        if not (ham.get("kesim_listesi") or []):
            ham["tel_cizim_filtrelendi"] = True
            notlar = ham.setdefault("genel_notlar", [])
            if isinstance(notlar, list):
                notlar.append("Tel çizim şalteri kapalı: ölçü üretilmedi.")
        else:
            notlar = ham.setdefault("genel_notlar", [])
            if isinstance(notlar, list):
                notlar.append("Kâğıtta kroki de vardı; ölçü satırları korundu.")

    if kaynak == "gemini" and yerel_parcalar:
        notlar = ham.setdefault("genel_notlar", [])
        if isinstance(notlar, list):
            notlar.append(f"Hibrit: {len(yerel_parcalar)} yerel aday Gemini'ye bağlam olarak verildi.")

    gemini_yazilar = ham.get("yazilar") if isinstance(ham.get("yazilar"), list) else []
    yazilar = yazilar + [y for y in gemini_yazilar if isinstance(y, dict)]
    ham = kesim_hamini_duzelt(ham) or ham
    dogrulanmis = kesim_listesi_sanity_kontrol(ham)
    tel_filtrelendi = bool(dogrulanmis and dogrulanmis.get("tel_cizim_filtrelendi"))
    sonuc = _receteli(dogrulanmis, yazilar, tel_cizim_izinli, tel_algilandi, tel_filtrelendi)
    if sonuc is None:
        hata_yaz(OKUMA, "Doğrulama veya reçete kesim listesini üretemedi")
    if sonuc is not None:
        sonuc["okuma_kaynak"] = kaynak
        for parca in sonuc.get("kesim_listesi") or []:
            if not isinstance(parca, dict):
                continue
            sik = kutu_sikistir(gorsel, parca.get("kutu"))
            if sik:
                parca["kutu"] = sik
    return sonuc


def kroki_oku(
    resim_yolu: str | Path,
    cikti_dosyasi: str | Path | None = None,
    yalniz_yerel: bool = False,
    gemini_oku=None,
    tel_cizim_izinli: bool = False,
) -> dict[str, Any] | None:
    """Dosya yolundan: ön işleme → yerel OCR → gerekirse Gemini → doğrulama."""
    try:
        gorsel = gorseli_on_isle(resim_yolu)
    except FileNotFoundError as hata:
        hata_yaz(DOSYA, f"Kroki dosyası bulunamadı: {resim_yolu}", hata)
        print(f"Hata: {hata}")
        return None
    except Exception as hata:
        hata_yaz(ON_ISLEME, "Dosya yolundan ön işleme başarısız", hata)
        print(f"Hata: Görsel ön işleme sırasında hata oluştu: {hata}")
        return None
    try:
        havuz = havuzdan_oku(Path(resim_yolu).read_bytes(), gorsel)
    except OSError:
        havuz = None
    if havuz:
        return _yaz_ve_don(havuz, cikti_dosyasi)
    return _yaz_ve_don(
        _tara_gorsel(gorsel, yalniz_yerel=yalniz_yerel, gemini_oku=gemini_oku, tel_cizim_izinli=tel_cizim_izinli),
        cikti_dosyasi,
    )


def kroki_oku_baytlari(
    veri: bytes,
    cikti_dosyasi: str | Path | None = None,
    yalniz_yerel: bool = False,
    gemini_oku=None,
    tel_cizim_izinli: bool = False,
    on_islenmis: bool = False,
) -> dict[str, Any] | None:
    """Yüklenen fotoğraf. on_islenmis=True ise tarayıcı kırpmıştır; sunucu OpenCV kırpmaz."""
    gorsel_sihir_kontrol(veri)
    try:
        ham_gorsel = gorseli_baytlardan(veri)
        gorsel = ham_gorsel if on_islenmis else gorseli_on_isle(ham_gorsel)
    except Exception as hata:
        hata_yaz(BORU_HATTI, "Yüklenen fotoğraf baytları işlenemedi", hata)
        print(f"Hata: Görsel baytları işlenemedi: {hata}")
        return None
    havuz = havuzdan_oku(veri, gorsel)
    if havuz:
        return _yaz_ve_don(havuz, cikti_dosyasi)
    return _yaz_ve_don(
        _tara_gorsel(gorsel, yalniz_yerel=yalniz_yerel, gemini_oku=gemini_oku, tel_cizim_izinli=tel_cizim_izinli),
        cikti_dosyasi,
    )


def yapay_zeka_kroki_oku(resim_yolu, cikti_dosyasi, maksimum_deneme=3, yalniz_yerel=False):
    """Eski API uyumu: dosyaya yazar, başarıda True döner."""
    if maksimum_deneme < 1:
        raise ValueError("maksimum_deneme en az 1 olmalıdır.")
    sonuc = kroki_oku(resim_yolu, cikti_dosyasi, yalniz_yerel=yalniz_yerel)
    return True if sonuc is not None else False
