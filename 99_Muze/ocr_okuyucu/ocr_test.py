"""Geriye dönük giriş noktası: hibrit boru hattını çalıştırır."""

from dotenv import load_dotenv
from pathlib import Path

from boru_hatti import yapay_zeka_kroki_oku
from dogrulama import kesim_listesi_sanity_kontrol

__all__ = ["yapay_zeka_kroki_oku", "kesim_listesi_sanity_kontrol"]


def sistem_simulasyonlarini_calistir():
    veri = {
        "kesim_listesi": [
            {
                "modul_kodu": "M1",
                "parca_adi": "Sol Dikme",
                "uzunluk_mm": 720.0,
                "genislik_mm": 560.0,
                "kalinlik_mm": 18.0,
                "adet": 1.0,
                "malzeme": "MDFLAM",
                "not": "Test",
            },
            {
                "modul_kodu": "M1",
                "parca_adi": "Sağ Dikme",
                "uzunluk_mm": 710.0,
                "genislik_mm": 560.0,
                "kalinlik_mm": 18.0,
                "adet": 1,
                "malzeme": "MDFLAM",
                "not": "Test",
            },
        ],
        "genel_notlar": ["İlişkisel test"],
    }
    sonuc = kesim_listesi_sanity_kontrol(veri)
    assert sonuc is not None
    assert len(sonuc["kesim_listesi"]) == 2
    assert any(p["supheli"] for p in sonuc["kesim_listesi"])
    print("Simülasyon testleri geçti.")


if __name__ == "__main__":
    load_dotenv(Path(__file__).resolve().parent / ".env")
    import sys
    gorsel = sys.argv[1] if len(sys.argv) > 1 else "test_olcukagidi_1.jpg"
    cikti = sys.argv[2] if len(sys.argv) > 2 else "okunan_sonuclar.txt"
    ok = yapay_zeka_kroki_oku(gorsel, cikti)
    raise SystemExit(0 if ok else 1)
