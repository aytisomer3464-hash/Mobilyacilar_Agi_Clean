"""Tek geçişli görsel yükleme, kağıt kırpma, Hough deskew ve CLAHE."""

from __future__ import annotations

from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

from hata_kayit import hata_yaz

JPEG_SIHIR = b"\xff\xd8\xff"
PNG_SIHIR = b"\x89PNG\r\n\x1a\n"


class GorselBicimHatasi(ValueError):
    """Sihirli bayt JPEG/PNG değil; Gemini'ye gitmeden kes."""

ANALIZ_KENAR = 960
KAGIT_MIN_ALAN = 0.10
KAGIT_MAKS_ALAN = 0.96
KAGIT_MIN_DIKDORTGEN = 0.62
KAGIT_YETER_SKOR = 0.42
DESKEW_ESIK_DERECE = 0.5
VARSAYILAN_KIRPMA_PAYI = 0.03
JPEG_KENAR = 2200
JPEG_KALITE = 90
BLUR_ESIK = 80.0
CLAHE_KIRP = 3.0
KESKIN_ESIK = 420.0


def gorsel_sihir_kontrol(veri: bytes) -> None:
    if not veri:
        raise GorselBicimHatasi("Boş görsel")
    if veri.startswith(JPEG_SIHIR) or veri.startswith(PNG_SIHIR):
        return
    raise GorselBicimHatasi("Desteklenmeyen görsel (JPEG/PNG).")


def gorseli_yukle(resim_yolu: str | Path) -> Image.Image:
    yol = Path(resim_yolu)
    if not yol.exists():
        raise FileNotFoundError(f"Görsel bulunamadı: {yol}")
    with Image.open(yol) as kaynak:
        return ImageOps.exif_transpose(kaynak).convert("RGB")


def gorseli_baytlardan(veri: bytes) -> Image.Image:
    if not veri:
        raise ValueError("Boş görsel verisi")
    gorsel_sihir_kontrol(veri)
    with Image.open(BytesIO(veri)) as kaynak:
        return ImageOps.exif_transpose(kaynak).convert("RGB")


def laplacian_varyans(gorsel: Image.Image) -> float:
    gri = cv2.cvtColor(np.asarray(gorsel), cv2.COLOR_RGB2GRAY)
    return float(cv2.Laplacian(gri, cv2.CV_64F).var())


def blur_uyarisi(gorsel: Image.Image, esik_degeri: float = BLUR_ESIK) -> float:
    """Netlik ölçer; düşük varyansta uyarır ama akışı durdurmaz."""
    varyans = laplacian_varyans(gorsel)
    if varyans < esik_degeri:
        hata_yaz(
            "ON_ISLEME",
            f"Görsel düşük netlik (varyans={varyans:.1f}, eşik={esik_degeri}); tarama sürer",
        )
        print(
            f"Uyarı: Görsel yeterince net değil (varyans: {varyans:.2f}, eşik: {esik_degeri}). "
            "İşlem yine de devam ediyor."
        )
    return varyans


def _kucuk_kopya(rgb: np.ndarray, analiz_boyutu: int = ANALIZ_KENAR) -> tuple[np.ndarray, float]:
    yukseklik, genislik = rgb.shape[:2]
    olcek = min(1.0, analiz_boyutu / max(yukseklik, genislik))
    if olcek < 1:
        kucuk = cv2.resize(
            rgb,
            (max(1, int(genislik * olcek)), max(1, int(yukseklik * olcek))),
            interpolation=cv2.INTER_AREA,
        )
        return kucuk, olcek
    return rgb, 1.0


def _varsayilan_kirp(img: Image.Image) -> Image.Image:
    genislik, yukseklik = img.size
    pay_x = min(max(1, int(genislik * VARSAYILAN_KIRPMA_PAYI)), max(0, (genislik - 1) // 2))
    pay_y = min(max(1, int(yukseklik * VARSAYILAN_KIRPMA_PAYI)), max(0, (yukseklik - 1) // 2))
    if pay_x <= 0 or pay_y <= 0:
        return img
    return img.crop((pay_x, pay_y, genislik - pay_x, yukseklik - pay_y))


def _noktalari_sirala(noktalar: np.ndarray) -> np.ndarray:
    """Dört köşeyi sol-üst, sağ-üst, sağ-alt, sol-alt sırasına koyar."""
    pts = np.asarray(noktalar, dtype=np.float32).reshape(4, 2)
    toplam = pts.sum(axis=1)
    fark = np.diff(pts, axis=1).reshape(4)
    sol_ust = pts[np.argmin(toplam)]
    sag_alt = pts[np.argmax(toplam)]
    sag_ust = pts[np.argmin(fark)]
    sol_alt = pts[np.argmax(fark)]
    return np.array([sol_ust, sag_ust, sag_alt, sol_alt], dtype=np.float32)


def _dortgen_bul(kontur: np.ndarray) -> np.ndarray | None:
    """Konturdan dört köşe: PolyDP, dışbükey gövde, en son minAreaRect."""
    cevre = cv2.arcLength(kontur, True)
    if cevre < 1:
        return None
    for oran in (0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.07, 0.09, 0.12):
        yaklasik = cv2.approxPolyDP(kontur, oran * cevre, True)
        if len(yaklasik) == 4:
            return yaklasik.reshape(4, 2).astype(np.float32)
    govde = cv2.convexHull(kontur)
    cevre_g = cv2.arcLength(govde, True)
    if cevre_g >= 1:
        for oran in (0.02, 0.04, 0.06, 0.08, 0.12):
            yaklasik = cv2.approxPolyDP(govde, oran * cevre_g, True)
            if len(yaklasik) == 4:
                return yaklasik.reshape(4, 2).astype(np.float32)
        if len(govde) >= 4:
            dort = _govdeden_dort_kose(govde)
            if dort is not None:
                return dort
    kutu = cv2.minAreaRect(kontur)
    koseler = cv2.boxPoints(kutu)
    if koseler is None or len(koseler) != 4:
        return None
    return np.asarray(koseler, dtype=np.float32)


def _govdeden_dort_kose(govde: np.ndarray) -> np.ndarray | None:
    """Dışbükey gövdeden uçlardaki dört köşeyi seçer (5+ kenarlı kâğıt)."""
    noktalar = np.asarray(govde, dtype=np.float32).reshape(-1, 2)
    if len(noktalar) < 4:
        return None
    if len(noktalar) == 4:
        return noktalar
    toplam = noktalar.sum(axis=1)
    fark = noktalar[:, 0] - noktalar[:, 1]
    aday = np.array(
        [
            noktalar[int(np.argmin(toplam))],
            noktalar[int(np.argmax(fark))],
            noktalar[int(np.argmax(toplam))],
            noktalar[int(np.argmin(fark))],
        ],
        dtype=np.float32,
    )
    if cv2.contourArea(aday.reshape(-1, 1, 2)) < 1:
        return None
    return aday


def _kose_incelt(gri: np.ndarray, dortgen: np.ndarray) -> np.ndarray:
    """Köşeleri alt-piksel doğrular; başarısızsa orijinali korur."""
    try:
        kose = np.asarray(dortgen, dtype=np.float32).reshape(4, 1, 2)
        olcuter = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.01)
        duzel = cv2.cornerSubPix(gri, kose, (7, 7), (-1, -1), olcuter)
        return duzel.reshape(4, 2).astype(np.float32)
    except cv2.error:
        return np.asarray(dortgen, dtype=np.float32).reshape(4, 2)


def _maske_kapat(maske: np.ndarray) -> np.ndarray | None:
    if maske is None or maske.size == 0:
        return None
    cekirdek = np.ones((7, 7), np.uint8)
    kapat = cv2.morphologyEx(maske, cv2.MORPH_CLOSE, cekirdek, iterations=2)
    return cv2.morphologyEx(kapat, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8), iterations=1)


def _kagit_maske_akisi(analiz: np.ndarray):
    """Maskeleri tek tek üretir; yeterli skor bulununca çağıran durur."""
    gri = cv2.cvtColor(analiz, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(8, 8))
    gri = clahe.apply(gri)
    bulanik = cv2.GaussianBlur(gri, (5, 5), 0)

    _, otsu = cv2.threshold(bulanik, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    yield _maske_kapat(otsu)
    yield _maske_kapat(cv2.bitwise_not(otsu))

    uyarlama = cv2.adaptiveThreshold(
        bulanik, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 35, 5,
    )
    yield _maske_kapat(uyarlama)

    hsv = cv2.cvtColor(analiz, cv2.COLOR_RGB2HSV)
    krem = cv2.inRange(hsv, (0, 0, 130), (50, 90, 255))
    beyaz = cv2.inRange(hsv, (0, 0, 150), (180, 70, 255))
    yield _maske_kapat(cv2.bitwise_or(krem, beyaz))

    kenar = cv2.Canny(bulanik, 40, 120)
    kenar = cv2.dilate(kenar, np.ones((5, 5), np.uint8), iterations=2)
    kenar = cv2.morphologyEx(kenar, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8), iterations=2)
    yield _maske_kapat(kenar)


def _kontur_skoru(kontur: np.ndarray, analiz: np.ndarray, gri: np.ndarray) -> float:
    """Kâğıt: orta-büyük alan, dikdörtgene yakın, içi masadan açık (veya koyu defter)."""
    h, w = analiz.shape[:2]
    alan = float(cv2.contourArea(kontur))
    cerceve = float(h * w)
    if cerceve < 1 or alan < cerceve * KAGIT_MIN_ALAN or alan > cerceve * KAGIT_MAKS_ALAN:
        return 0.0
    dik = cv2.minAreaRect(kontur)
    (rw, rh) = dik[1]
    dik_alan = max(1.0, abs(float(rw) * float(rh)))
    diklik = float(np.clip(alan / dik_alan, 0.0, 1.0))
    if diklik < KAGIT_MIN_DIKDORTGEN:
        return 0.0
    maske = np.zeros((h, w), dtype=np.uint8)
    cv2.drawContours(maske, [kontur], -1, 255, -1)
    ic = cv2.mean(gri, mask=maske)[0]
    dis_maske = cv2.bitwise_not(maske)
    kenar_pay = np.zeros_like(dis_maske)
    kenar_pay[0:max(1, h // 12), :] = 255
    kenar_pay[-max(1, h // 12):, :] = 255
    kenar_pay[:, 0:max(1, w // 12)] = 255
    kenar_pay[:, -max(1, w // 12):] = 255
    dis = cv2.bitwise_and(dis_maske, kenar_pay)
    dis_ort = cv2.mean(gri, mask=dis)[0] if cv2.countNonZero(dis) else ic
    kontrast = abs(ic - dis_ort) / 255.0
    # Tam kare çerçeve (masa) cezası: dört kenara yapışık
    x, y, bw, bh = cv2.boundingRect(kontur)
    kenara = int(x <= 2) + int(y <= 2) + int(x + bw >= w - 2) + int(y + bh >= h - 2)
    ceza = 0.35 if kenara >= 3 else 0.0
    return (0.35 * (alan / cerceve) + 0.40 * diklik + 0.25 * kontrast) - ceza


def _kagit_dortgeni_bul(analiz: np.ndarray) -> np.ndarray | None:
    """Maskeleri sırayla dener; ilk yeterli skorda durur."""
    gri = cv2.cvtColor(analiz, cv2.COLOR_RGB2GRAY)
    en_iyi: tuple[float, np.ndarray] | None = None
    for maske in _kagit_maske_akisi(analiz):
        if maske is None:
            continue
        konturlar, _ = cv2.findContours(maske, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not konturlar:
            continue
        adaylar = sorted(konturlar, key=cv2.contourArea, reverse=True)[:8]
        for kontur in adaylar:
            skor = _kontur_skoru(kontur, analiz, gri)
            if skor <= 0.12:
                continue
            dortgen = _dortgen_bul(kontur)
            if dortgen is None:
                continue
            if en_iyi is None or skor > en_iyi[0]:
                en_iyi = (skor, dortgen)
            if skor >= KAGIT_YETER_SKOR:
                return _kose_incelt(gri, dortgen)
    if en_iyi is None:
        return None
    return _kose_incelt(gri, en_iyi[1])


def _kirpim_makul(kirpik: np.ndarray, kaynak: np.ndarray) -> bool:
    if kirpik is None or kirpik.size == 0:
        return False
    kh, kw = kirpik.shape[:2]
    sh, sw = kaynak.shape[:2]
    if kw < 40 or kh < 40:
        return False
    if kw * kh < 0.08 * sw * sh:
        return False
    if kw * kh > 0.995 * sw * sh:
        return False
    return True


def _perspektif_kirp(rgb: np.ndarray, dortgen: np.ndarray) -> np.ndarray | None:
    kaynak = _noktalari_sirala(dortgen)
    (tl, tr, br, bl) = kaynak
    genislik_ust = float(np.hypot(tr[0] - tl[0], tr[1] - tl[1]))
    genislik_alt = float(np.hypot(br[0] - bl[0], br[1] - bl[1]))
    yukseklik_sol = float(np.hypot(bl[0] - tl[0], bl[1] - tl[1]))
    yukseklik_sag = float(np.hypot(br[0] - tr[0], br[1] - tr[1]))
    genislik = int(max(genislik_ust, genislik_alt))
    yukseklik = int(max(yukseklik_sol, yukseklik_sag))
    if genislik < 40 or yukseklik < 40:
        return None
    hedef = np.array(
        [[0, 0], [genislik - 1, 0], [genislik - 1, yukseklik - 1], [0, yukseklik - 1]],
        dtype=np.float32,
    )
    matris = cv2.getPerspectiveTransform(kaynak, hedef)
    return cv2.warpPerspective(rgb, matris, (genislik, yukseklik))


def _bbox_kirp(rgb: np.ndarray, kontur: np.ndarray, olcek: float) -> np.ndarray | None:
    yukseklik, genislik = rgb.shape[:2]
    x, y, w, h = (int(deger / olcek) for deger in cv2.boundingRect(kontur))
    pay = 10
    x = max(0, min(genislik, x - pay))
    y = max(0, min(yukseklik, y - pay))
    w = max(0, min(genislik - x, w + pay * 2))
    h = max(0, min(yukseklik - y, h + pay * 2))
    if w <= 0 or h <= 0:
        return None
    return rgb[y : y + h, x : x + w]


def kagidi_kirp(img: Image.Image) -> Image.Image:
    """Masayı yok sayıp defter/kâğıt dört köşesini otomatik yakalar; perspektif kırpar."""
    try:
        rgb = np.array(img.convert("RGB"))
        if rgb.ndim != 3 or rgb.shape[2] != 3:
            return img
        yukseklik, genislik = rgb.shape[:2]
        if yukseklik < 30 or genislik < 30:
            return _varsayilan_kirp(img)

        analiz, olcek = _kucuk_kopya(rgb)
        dortgen = _kagit_dortgeni_bul(analiz)
        if dortgen is not None:
            duzeltilmis = _perspektif_kirp(rgb, dortgen / olcek)
            if duzeltilmis is not None and _kirpim_makul(duzeltilmis, rgb):
                return Image.fromarray(duzeltilmis)

        gri = cv2.cvtColor(analiz, cv2.COLOR_RGB2GRAY)
        kenarlar = cv2.Canny(cv2.GaussianBlur(gri, (5, 5), 0), 40, 130)
        kenarlar = cv2.dilate(kenarlar, np.ones((5, 5), np.uint8), iterations=2)
        konturlar, _ = cv2.findContours(kenarlar, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if konturlar:
            en_iyi = max(konturlar, key=lambda k: _kontur_skoru(k, analiz, gri))
            if _kontur_skoru(en_iyi, analiz, gri) > 0.12:
                bbox = _bbox_kirp(rgb, en_iyi, olcek)
                if bbox is not None and _kirpim_makul(bbox, rgb):
                    hata_yaz("ON_ISLEME", "Köşe dörtgeni yok, kâğıt bbox ile kırpıldı")
                    return Image.fromarray(bbox)

        hata_yaz("ON_ISLEME", "Otomatik köşe yakalanamadı, içerik bbox kullanıldı")
        return icerik_bbox_kirp(img)
    except Exception as hata:
        hata_yaz("ON_ISLEME", "Kağıt kırpma başarısız, içerik bbox kullanılacak", hata)
        print(f"Uyarı: Kağıt kırpma başarısız, içerik bbox kullanılacak: {hata}")
        return icerik_bbox_kirp(img)


def icerik_bbox_kirp(img: Image.Image) -> Image.Image:
    rgb = np.asarray(img.convert("RGB"))
    gri = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    maske = gri < 235
    if not np.any(maske):
        return img
    satirlar = np.any(maske, axis=1)
    sutunlar = np.any(maske, axis=0)
    ust, alt = np.flatnonzero(satirlar)[[0, -1]]
    sol, sag = np.flatnonzero(sutunlar)[[0, -1]]
    bosluk = max(20, round(max(img.size) * 0.02))
    return img.crop((
        max(0, int(sol) - bosluk),
        max(0, int(ust) - bosluk),
        min(img.width, int(sag) + 1 + bosluk),
        min(img.height, int(alt) + 1 + bosluk),
    ))


def hough_deskew(img: Image.Image) -> Image.Image:
    """Eğimi küçük kopyada Hough ile ölçer; yalnızca anlamlı açıda döndürür."""
    try:
        rgb = np.asarray(img.convert("RGB"))
        analiz, _ = _kucuk_kopya(rgb)
        gri = cv2.cvtColor(analiz, cv2.COLOR_RGB2GRAY)
        kenar = cv2.Canny(gri, 50, 150)
        min_uzunluk = max(30, kenar.shape[1] // 8)
        cizgiler = cv2.HoughLinesP(
            kenar, 1, np.pi / 180, threshold=80,
            minLineLength=min_uzunluk, maxLineGap=10,
        )
        if cizgiler is None:
            return img

        acilar: list[float] = []
        for cizgi in np.asarray(cizgiler).reshape(-1, 4):
            x1, y1, x2, y2 = (float(deger) for deger in cizgi)
            aci = float(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
            while aci > 45:
                aci -= 90
            while aci < -45:
                aci += 90
            acilar.append(aci)
        if not acilar:
            return img

        aci = float(np.median(acilar))
        if abs(aci) <= DESKEW_ESIK_DERECE:
            return img

        h, w = rgb.shape[:2]
        merkez = (w / 2.0, h / 2.0)
        matris = cv2.getRotationMatrix2D(merkez, aci, 1.0)
        duzeltilmis = cv2.warpAffine(
            rgb, matris, (w, h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE,
        )
        return Image.fromarray(duzeltilmis)
    except Exception as hata:
        hata_yaz("ON_ISLEME", "Eğim düzeltme başarısız, orijinal görsel kullanılıyor", hata)
        print(f"Uyarı: Eğim düzeltme başarısız, orijinal görsel kullanılıyor: {hata}")
        return img


def clahe_kontrast(img: Image.Image, kirp: float = CLAHE_KIRP) -> Image.Image:
    try:
        rgb = np.asarray(img.convert("RGB"))
        lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
        l_kanal, a_kanal, b_kanal = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=float(kirp), tileGridSize=(8, 8))
        l_kanal = clahe.apply(l_kanal)
        birlesik = cv2.merge((l_kanal, a_kanal, b_kanal))
        return Image.fromarray(cv2.cvtColor(birlesik, cv2.COLOR_LAB2RGB))
    except Exception as hata:
        hata_yaz("ON_ISLEME", "CLAHE kontrast başarısız, orijinal görsel kullanılıyor", hata)
        return img


def leke_temizle(img: Image.Image) -> Image.Image:
    """Küçük lekeleri medyan süzgeçle alır; ince el yazısını silmez."""
    try:
        if laplacian_varyans(img) < BLUR_ESIK:
            return img
        rgb = np.asarray(img.convert("RGB"))
        if rgb.size == 0:
            return img
        return Image.fromarray(cv2.medianBlur(rgb, 3))
    except Exception as hata:
        hata_yaz("ON_ISLEME", "Leke temizleme başarısız, görsel olduğu gibi", hata)
        return img


def netlestir(img: Image.Image) -> Image.Image:
    """Unsharp: ince kalem/el yazısı için; çok net kâğıda dokunmaz."""
    try:
        varyans = laplacian_varyans(img)
        if varyans >= KESKIN_ESIK:
            return img
        rgb = np.asarray(img.convert("RGB"))
        bulanik = cv2.GaussianBlur(rgb, (0, 0), 1.1)
        miktar = 0.85 if varyans < BLUR_ESIK else 0.55
        keskin = cv2.addWeighted(rgb, 1.0 + miktar, bulanik, -miktar, 0)
        return Image.fromarray(np.clip(keskin, 0, 255).astype(np.uint8))
    except Exception as hata:
        hata_yaz("ON_ISLEME", "Netleştirme başarısız, görsel olduğu gibi", hata)
        return img


def gorseli_on_isle(kaynak: str | Path | Image.Image) -> Image.Image:
    gorsel = kaynak if isinstance(kaynak, Image.Image) else gorseli_yukle(kaynak)
    blur_uyarisi(gorsel)
    gorsel = kagidi_kirp(gorsel)
    gorsel = hough_deskew(gorsel)
    gorsel = leke_temizle(gorsel)
    gorsel = clahe_kontrast(gorsel)
    gorsel = netlestir(gorsel)
    return gorsel


def jpeg_baytlari(
    gorsel: Image.Image,
    maksimum_kenar: int = JPEG_KENAR,
    kalite: int = JPEG_KALITE,
) -> bytes:
    kopya = gorsel.copy()
    kopya.thumbnail((maksimum_kenar, maksimum_kenar), Image.Resampling.LANCZOS)
    cikti = BytesIO()
    kopya.save(cikti, format="JPEG", quality=kalite, optimize=True)
    return cikti.getvalue()


def kutu_bbox(kutu) -> list[float] | None:
    """OCR kutusunu [x, y, w, h] yapar; bozuksa None."""
    if kutu is None:
        return None
    try:
        dizi = np.asarray(kutu, dtype=np.float64)
    except (TypeError, ValueError):
        return None
    if dizi.size < 4:
        return None
    if dizi.size == 4:
        x, y, a, b = (float(v) for v in dizi.reshape(4))
        if a > 0 and b > 0 and a < 8000 and b < 8000:
            return [x, y, a, b]
        return [min(x, a), min(y, b), abs(a - x), abs(b - y)]
    try:
        noktalar = dizi.reshape(-1, 2)
    except ValueError:
        return None
    x1 = float(noktalar[:, 0].min())
    y1 = float(noktalar[:, 1].min())
    x2 = float(noktalar[:, 0].max())
    y2 = float(noktalar[:, 1].max())
    if x2 <= x1 or y2 <= y1:
        return None
    return [x1, y1, x2 - x1, y2 - y1]


def kutu_sikistir(gorsel: Image.Image, kutu, pay: int = 2) -> list[float] | None:
    """OCR kutusundaki boş kâğıdı keser; yalnız mürekkep satırını bırakır."""
    bbox = kutu_bbox(kutu)
    if bbox is None or gorsel is None:
        return bbox
    gx, gy = gorsel.width, gorsel.height
    x, y, w, h = bbox
    sol = max(0, int(np.floor(x)))
    ust = max(0, int(np.floor(y)))
    sag = min(gx, int(np.ceil(x + w)))
    alt = min(gy, int(np.ceil(y + h)))
    if sag - sol < 4 or alt - ust < 4:
        return [float(sol), float(ust), float(max(1, sag - sol)), float(max(1, alt - ust))]
    kirpik = np.asarray(gorsel.convert("L").crop((sol, ust, sag, alt)))
    if kirpik.size == 0:
        return bbox
    medyan = float(np.median(kirpik))
    esik = min(210.0, max(40.0, medyan - 28.0))
    maske = kirpik < esik
    if maske.mean() < 0.004:
        maske = kirpik > min(250.0, medyan + 28.0)
    if not np.any(maske) or float(maske.mean()) > 0.88:
        return [float(sol), float(ust), float(sag - sol), float(alt - ust)]
    satir = np.where(np.any(maske, axis=1))[0]
    sutun = np.where(np.any(maske, axis=0))[0]
    if satir.size == 0 or sutun.size == 0:
        return [float(sol), float(ust), float(sag - sol), float(alt - ust)]
    ny0, ny1 = int(satir[0]), int(satir[-1]) + 1
    nx0, nx1 = int(sutun[0]), int(sutun[-1]) + 1
    p = max(0, int(pay))
    nx0 = max(0, nx0 - p)
    ny0 = max(0, ny0 - p)
    nx1 = min(kirpik.shape[1], nx1 + p)
    ny1 = min(kirpik.shape[0], ny1 + p)
    if nx1 - nx0 < 6:
        orta = (nx0 + nx1) / 2
        nx0 = max(0, int(orta - 3))
        nx1 = min(kirpik.shape[1], int(orta + 3))
    if ny1 - ny0 < 6:
        orta = (ny0 + ny1) / 2
        ny0 = max(0, int(orta - 3))
        ny1 = min(kirpik.shape[0], int(orta + 3))
    return [float(sol + nx0), float(ust + ny0), float(nx1 - nx0), float(ny1 - ny0)]


def kutu_kirp(gorsel: Image.Image, kutu, pay: int = 8) -> Image.Image:
    """OCR kutusundan (4 nokta veya x,y,w,h) güvenlik paylı kırpım üretir."""
    dizi = np.asarray(kutu, dtype=np.float32)
    if dizi.size == 4 and dizi.ndim == 1:
        x, y, w, h = dizi
        xs = [x, x + w]
        ys = [y, y + h]
    else:
        noktalar = dizi.reshape(-1, 2)
        xs = noktalar[:, 0]
        ys = noktalar[:, 1]
    sol = max(0, int(np.min(xs)) - pay)
    ust = max(0, int(np.min(ys)) - pay)
    sag = min(gorsel.width, int(np.max(xs)) + pay)
    alt = min(gorsel.height, int(np.max(ys)) + pay)
    if sag <= sol or alt <= ust:
        return gorsel
    return gorsel.crop((sol, ust, sag, alt))
