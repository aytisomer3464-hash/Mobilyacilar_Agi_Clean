"""Fire Okuyucu vitrin ve motor yolları. motor_levha.py kopyalanmaz."""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path
from types import ModuleType

PAKET = Path(__file__).resolve().parent
VITRIN_YEREL = PAKET / "vitrin"
# .../python_calismalari/Takim_Cantasi_Motorlarİ/Fire_okuyucu
DIS_FIRE = PAKET.parents[2] / "Takim_Cantasi_Motorlarİ" / "Fire_okuyucu"


def vitrin_dizin() -> Path:
    env = os.environ.get("MAGI_EBATLAMA_VITRIN", "").strip()
    if env:
        aday = Path(env)
        if (aday / "index.html").is_file():
            return aday
    if (VITRIN_YEREL / "index.html").is_file():
        return VITRIN_YEREL
    dis = DIS_FIRE / "vitrin"
    if (dis / "index.html").is_file():
        return dis
    raise FileNotFoundError("Ebatlama vitrin yok (yerel kopya veya Fire_okuyucu).")


def motor_dizin() -> Path | None:
    env = os.environ.get("MAGI_EBATLAMA_MOTOR", "").strip()
    if env:
        aday = Path(env)
        if (aday / "motor_levha.py").is_file():
            return aday
    if (DIS_FIRE / "motor_levha.py").is_file():
        return DIS_FIRE
    return None


_MOTOR: ModuleType | None = None


def _dosyadan_yukle(ad: str, yol: Path) -> ModuleType | None:
    spec = importlib.util.spec_from_file_location(ad, yol)
    if spec is None or spec.loader is None:
        return None
    mod = importlib.util.module_from_spec(spec)
    sys.modules[ad] = mod
    try:
        spec.loader.exec_module(mod)
    except Exception:
        sys.modules.pop(ad, None)
        raise
    return mod


def motor_modulu() -> ModuleType | None:
    """Fire_okuyucu sys.path'e konmaz; orada OCR ile aynı adlı sunucu.py vb. var."""
    global _MOTOR
    if _MOTOR is not None:
        return _MOTOR
    kok = motor_dizin()
    if kok is None:
        return None
    ayar = _dosyadan_yukle("_magi_fire_config", kok / "config.py") if (kok / "config.py").is_file() else None
    onceki = sys.modules.get("config")
    if ayar is not None:
        sys.modules["config"] = ayar
    try:
        _MOTOR = _dosyadan_yukle("_magi_fire_motor_levha", kok / "motor_levha.py")
    finally:
        if onceki is None:
            sys.modules.pop("config", None)
        else:
            sys.modules["config"] = onceki
    return _MOTOR
