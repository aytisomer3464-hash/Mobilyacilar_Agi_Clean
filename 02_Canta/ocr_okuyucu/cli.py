"""Kesim kâğıdı OCR komut satırı."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

from boru_hatti import kroki_oku


def _argumanlar(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Hibrit mobilya kesim kâğıdı OCR")
    parser.add_argument("gorsel", help="Giriş görseli (jpg/png)")
    parser.add_argument(
        "-o", "--cikti",
        default="okunan_sonuclar.txt",
        help="JSON çıktı dosyası",
    )
    parser.add_argument(
        "--yalniz-yerel",
        action="store_true",
        help="Gemini kullanma; yalnızca RapidOCR",
    )
    parser.add_argument(
        "--tel-cizim",
        action="store_true",
        help="Tel çizim / karalamaları tasarıma dahil et (varsayılan: filtrele)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    load_dotenv(Path(__file__).resolve().parent / ".env")
    args = _argumanlar(argv)
    sonuc = kroki_oku(
        args.gorsel,
        args.cikti,
        yalniz_yerel=args.yalniz_yerel,
        tel_cizim_izinli=args.tel_cizim,
    )
    if sonuc is None:
        return 1
    print(json.dumps(sonuc, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
