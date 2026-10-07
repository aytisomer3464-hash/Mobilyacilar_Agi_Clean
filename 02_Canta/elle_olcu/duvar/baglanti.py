"""Duvar giydir vitrin ve kendi motor yolu. Fire / OCR motoru bağlanmaz."""

from __future__ import annotations

from pathlib import Path

PAKET = Path(__file__).resolve().parent
VITRIN = PAKET / "vitrin"
MOTOR = PAKET / "motor.py"


def vitrin_dizin() -> Path:
    if (VITRIN / "index.html").is_file():
        return VITRIN
    raise FileNotFoundError("Duvar giydir vitrin yok.")


def motor_yol() -> Path | None:
    return MOTOR if MOTOR.is_file() else None
