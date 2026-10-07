"""Zemin motor yolu. Vitrin /duvar/ sahnesinde; ayrı HTML yok. Duvar/OCR bağlanmaz."""

from __future__ import annotations

from pathlib import Path

PAKET = Path(__file__).resolve().parent
MOTOR = PAKET / "motor.py"
MOTOR_JS = PAKET / "zemin_motor.js"


def motor_yol() -> Path | None:
    return MOTOR if MOTOR.is_file() else None


def motor_js_yol() -> Path | None:
    return MOTOR_JS if MOTOR_JS.is_file() else None
