"""Haftalık tarama kotası; arşive eski defter katkısı ile yenilenir."""

from __future__ import annotations

import json
import os
from datetime import date, datetime, timezone
from typing import Any

from arsiv import _dosya_kilidi, _json_yaz
from hata_kayit import KOTA, hata_yaz
from ogrenme_kurallari import ogrenme_dizini

HAFTALIK_KOTA = int(os.environ.get("OCR_HAFTALIK_KOTA", "40"))
KATKI_ODUL = int(os.environ.get("OCR_KATKI_ODUL", "5"))
KATKI_TAVAN = int(os.environ.get("OCR_KATKI_TAVAN", "40"))


def kota_yolu():
    return ogrenme_dizini() / "kota.json"


def _hafta_anahtari() -> str:
    yil, hafta, _ = date.today().isocalendar()
    return f"{yil}-W{hafta:02d}"


def _bos_usta(usta_id: str) -> dict[str, Any]:
    return {
        "usta_id": usta_id,
        "hafta": _hafta_anahtari(),
        "tavan": HAFTALIK_KOTA,
        "kalan": HAFTALIK_KOTA,
        "harcanan": 0,
        "katki_adet": 0,
        "yenilenen": 0,
    }


def _yukle() -> dict[str, Any]:
    yol = kota_yolu()
    if not yol.exists():
        return {"ustalar": {}}
    try:
        veri = json.loads(yol.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as hata:
        hata_yaz(KOTA, "kota.json okunamadı, boş kota ile devam", hata)
        return {"ustalar": {}}
    if not isinstance(veri, dict):
        return {"ustalar": {}}
    veri.setdefault("ustalar", {})
    return veri


def _usta_al(veri: dict[str, Any], usta_id: str) -> dict[str, Any]:
    usta_id = (usta_id or "varsayilan").strip() or "varsayilan"
    ustalar = veri.setdefault("ustalar", {})
    kayit = ustalar.get(usta_id)
    if not isinstance(kayit, dict) or kayit.get("hafta") != _hafta_anahtari():
        kayit = _bos_usta(usta_id)
        ustalar[usta_id] = kayit
    kayit["tavan"] = HAFTALIK_KOTA
    return kayit


def kota_durumu(usta_id: str = "varsayilan") -> dict[str, Any]:
    with _dosya_kilidi(ogrenme_dizini() / "kota.lock"):
        veri = _yukle()
        kayit = dict(_usta_al(veri, usta_id))
        _json_yaz(kota_yolu(), veri)
        kayit["odul_kayit_basi"] = KATKI_ODUL
        kayit["katki_tavan"] = KATKI_TAVAN
        return kayit


def kota_harca(usta_id: str = "varsayilan", adet: int = 1) -> dict[str, Any]:
    with _dosya_kilidi(ogrenme_dizini() / "kota.lock"):
        veri = _yukle()
        kayit = _usta_al(veri, usta_id)
        adet = max(0, int(adet))
        kayit["harcanan"] = int(kayit.get("harcanan") or 0) + adet
        kayit["kalan"] = max(0, int(kayit.get("kalan") or 0) - adet)
        kayit["tukendi"] = kayit["kalan"] <= 0
        _json_yaz(kota_yolu(), veri)
        return dict(kayit)


def kota_katki_ile_yenile(usta_id: str = "varsayilan", benzersiz_kayit: int = 1) -> dict[str, Any]:
    """Eski defter/kroki arşive kabul edilince haftalık kotayı ödülle doldurur."""
    with _dosya_kilidi(ogrenme_dizini() / "kota.lock"):
        veri = _yukle()
        kayit = _usta_al(veri, usta_id)
        benzersiz_kayit = max(0, int(benzersiz_kayit))
        odul = benzersiz_kayit * KATKI_ODUL
        kalan_tavan = max(0, KATKI_TAVAN - int(kayit.get("yenilenen") or 0))
        odul = min(odul, kalan_tavan)
        kayit["katki_adet"] = int(kayit.get("katki_adet") or 0) + benzersiz_kayit
        kayit["yenilenen"] = int(kayit.get("yenilenen") or 0) + odul
        kayit["kalan"] = min(HAFTALIK_KOTA, int(kayit.get("kalan") or 0) + odul)
        kayit["tukendi"] = kayit["kalan"] <= 0
        kayit["son_katki"] = datetime.now(timezone.utc).isoformat()
        _json_yaz(kota_yolu(), veri)
        return dict(kayit)
