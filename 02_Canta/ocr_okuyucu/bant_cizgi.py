"""Sağ sütun bant simgesi: OpenCV çizgi kuralı → 0-0-0-0. Yeni OCR yok."""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np
from PIL import Image

from on_isleme import kutu_bbox
from usta_mantik import BANT_KOD_BOS, _kenar_bitleri

_BOS = {"kod": BANT_KOD_BOS, "emin": True, "neden": ""}


def _numpy_gorsel(gorsel) -> np.ndarray | None:
    if gorsel is None:
        return None
    if isinstance(gorsel, Image.Image):
        return np.asarray(gorsel.convert("RGB"))
    dizi = np.asarray(gorsel)
    if dizi.ndim < 2 or dizi.size == 0:
        return None
    return dizi


def _sag_kirpik(gorsel: np.ndarray, kutu) -> np.ndarray | None:
    bbox = kutu_bbox(kutu)
    if bbox is None:
        return None
    x, y, w, h = bbox
    gh, gw = gorsel.shape[:2]
    x0 = int(max(0, x + w * 0.68))
    y0 = int(max(0, y - h * 0.45))
    x1 = int(min(gw, x + w + max(h * 4.0, w * 1.6, 96)))
    y1 = int(min(gh, y + h * 1.6))
    if x1 - x0 < 8 or y1 - y0 < 8:
        return None
    return gorsel[y0:y1, x0:x1]


def _murekkep(kirpik: np.ndarray) -> np.ndarray:
    if kirpik.ndim == 3:
        gri = cv2.cvtColor(kirpik, cv2.COLOR_RGB2GRAY)
    else:
        gri = kirpik
    _, maske = cv2.threshold(gri, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return maske


def _bilesen_say(maske: np.ndarray, dikey: bool) -> tuple[int, list]:
    h, w = maske.shape[:2]
    if dikey:
        k = cv2.getStructuringElement(cv2.MORPH_RECT, (2, max(8, h // 5)))
    else:
        k = cv2.getStructuringElement(cv2.MORPH_RECT, (max(8, w // 5), 2))
    acik = cv2.morphologyEx(maske, cv2.MORPH_OPEN, k)
    n, _etiket, stats, _ = cv2.connectedComponentsWithStats(acik)
    kutular = []
    for i in range(1, n):
        bx = int(stats[i, cv2.CC_STAT_WIDTH])
        by = int(stats[i, cv2.CC_STAT_HEIGHT])
        if int(stats[i, cv2.CC_STAT_AREA]) < 8:
            continue
        if dikey and (by < 10 or by < bx * 1.6):
            continue
        if not dikey and (bx < 10 or bx < by * 1.6):
            continue
        kutular.append(
            (
                int(stats[i, cv2.CC_STAT_LEFT]),
                int(stats[i, cv2.CC_STAT_TOP]),
                bx,
                by,
            )
        )
    return min(4, len(kutular)), kutular


def _kose_var(dikeyler: list, yataylar: list) -> bool:
    for dx, dy, dw, dh in dikeyler:
        for yx, yy, yw, yh in yataylar:
            dx2, dy2 = dx + dw, dy + dh
            yx2, yy2 = yx + yw, yy + yh
            yakin = (
                abs(dx - yx) < 10 or abs(dx2 - yx) < 10 or abs(dx - yx2) < 10 or abs(dx2 - yx2) < 10
            )
            yakin = yakin and (
                abs(dy - yy) < 10 or abs(dy2 - yy) < 10 or abs(dy - yy2) < 10 or abs(dy2 - yy2) < 10
            )
            if yakin:
                return True
    return False


def _boy_en(dikey: int, yatay: int, kose: bool) -> tuple[int, int, bool, str]:
    if dikey >= 3 or yatay >= 3:
        return 0, 0, False, "Bant çizgisi belirsiz; tahmin yok."
    if dikey >= 2 and yatay >= 2:
        return 2, 2, True, ""
    if dikey == 1 and yatay == 2:
        return 1, 2, True, ""
    if kose and dikey >= 1 and yatay >= 1:
        return 1, 1, True, ""
    if dikey == 0 and yatay == 2:
        return 0, 2, True, ""
    if dikey == 1 and yatay == 0:
        return 1, 0, True, ""
    if dikey == 2 and yatay == 0:
        return 2, 0, True, ""
    if dikey == 0 and yatay == 1:
        return 0, 1, True, ""
    if dikey == 0 and yatay == 0:
        return 0, 0, True, ""
    return 0, 0, False, "Bant çizgisi belirsiz; tahmin yok."


def sag_sutun_cizgi(gorsel, kutu) -> dict[str, Any]:
    """Ölçü satırının sağındaki | L = □ çizgisini boy/en koduna çevirir."""
    try:
        dizi = _numpy_gorsel(gorsel)
        if dizi is None:
            return dict(_BOS)
        kirpik = _sag_kirpik(dizi, kutu)
        if kirpik is None:
            return dict(_BOS)
        maske = _murekkep(kirpik)
        if int(cv2.countNonZero(maske)) < 8:
            return dict(_BOS)
        dikey, d_kut = _bilesen_say(maske, True)
        yatay, y_kut = _bilesen_say(maske, False)
        kose = _kose_var(d_kut, y_kut)
        boy, en, emin, neden = _boy_en(dikey, yatay, kose)
        kod = BANT_KOD_BOS if boy == 0 and en == 0 else _kenar_bitleri(boy, en)
        return {"kod": kod, "emin": emin, "neden": neden}
    except Exception:
        return dict(_BOS)
