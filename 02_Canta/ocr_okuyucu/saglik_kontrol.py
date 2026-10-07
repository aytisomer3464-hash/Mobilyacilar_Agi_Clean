"""Sağlık ve gidişat: anlık API, kaynak, OCR boru hattı, LAN/tünel, kara kutu senkronu."""

from __future__ import annotations

import json
import os
import socket
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv

import ogrenme_kurallari
from hata_kayit import SAGLIK, hata_log_yolu, hata_yaz
from sunucu import VARSAYILAN_PORT, lan_adresleri, ortam_yukle
from usta_mantik import bant_sozlugu_kod

TUNEL_SURECLERI = ("cloudflared", "ngrok", "trycloudflare", "bore", "localtunnel")
SAAT_KAYMASI_SN = 300


def _seviye(*durumlar: str) -> str:
    if "hata" in durumlar:
        return "hata"
    if "uyari" in durumlar:
        return "uyari"
    return "tamam"


def _port() -> int:
    try:
        return int(os.environ.get("OCR_PORT", str(VARSAYILAN_PORT)))
    except ValueError:
        return VARSAYILAN_PORT


def _tcp_acik(host: str, port: int, zaman_asimi: float = 0.4) -> bool:
    try:
        with socket.create_connection((host, port), timeout=zaman_asimi):
            return True
    except OSError:
        return False


def _bellek_gb() -> dict[str, Any]:
    """Windows GlobalMemoryStatusEx; yoksa boş."""
    if sys.platform != "win32":
        try:
            sayfa = os.sysconf("SC_PAGE_SIZE")
            toplam = os.sysconf("SC_PHYS_PAGES") * sayfa
            return {"toplam_gb": round(toplam / (1024**3), 2)}
        except (ValueError, OSError, AttributeError):
            return {}
    import ctypes

    class BELLEK(ctypes.Structure):
        _fields_ = [
            ("dwLength", ctypes.c_ulong),
            ("dwMemoryLoad", ctypes.c_ulong),
            ("ullTotalPhys", ctypes.c_ulonglong),
            ("ullAvailPhys", ctypes.c_ulonglong),
            ("ullTotalPageFile", ctypes.c_ulonglong),
            ("ullAvailPageFile", ctypes.c_ulonglong),
            ("ullTotalVirtual", ctypes.c_ulonglong),
            ("ullAvailVirtual", ctypes.c_ulonglong),
            ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
        ]

    bilgi = BELLEK()
    bilgi.dwLength = ctypes.sizeof(BELLEK)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(bilgi)):
        return {}
    toplam = bilgi.ullTotalPhys / (1024**3)
    bos = bilgi.ullAvailPhys / (1024**3)
    return {
        "yuk_yuzde": int(bilgi.dwMemoryLoad),
        "toplam_gb": round(toplam, 2),
        "bos_gb": round(bos, 2),
        "kullanilan_gb": round(toplam - bos, 2),
    }


def _surec_adlari() -> list[str]:
    if sys.platform != "win32":
        return []
    import subprocess

    try:
        cikti = subprocess.check_output(
            ["tasklist", "/fo", "csv", "/nh"],
            text=True,
            encoding="oem",
            errors="ignore",
            timeout=8,
        )
    except (OSError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
        return []
    adlar: list[str] = []
    for satir in cikti.splitlines():
        parca = satir.split(",")
        if parca:
            adlar.append(parca[0].strip('"').lower())
    return adlar


def anlik_durum() -> dict[str, Any]:
    port = _port()
    dinliyor = _tcp_acik("127.0.0.1", port)
    api: dict[str, Any] | None = None
    http_kod = None
    if dinliyor:
        try:
            istek = Request(
                f"http://127.0.0.1:{port}/api/durum",
                headers={"Cache-Control": "no-store", "Accept": "application/json"},
            )
            with urlopen(istek, timeout=3) as yanit:
                http_kod = yanit.status
                api = json.loads(yanit.read().decode("utf-8"))
        except (URLError, TimeoutError, OSError, json.JSONDecodeError, ValueError) as hata:
            return {
                "durum": "uyari",
                "port": port,
                "dinliyor": True,
                "hazir": False,
                "gemini_anahtar": bool(os.environ.get("GEMINI_API_KEY", "").strip()),
                "http": str(hata),
                "api": None,
            }
    gemini = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    token = bool(os.environ.get("OCR_API_TOKEN", "").strip())
    ozet = {
        "durum": "tamam" if dinliyor and isinstance(api, dict) and api.get("hazir") else ("uyari" if dinliyor else "hata"),
        "port": port,
        "dinliyor": dinliyor,
        "http_kod": http_kod,
        "hazir": bool(api and api.get("hazir")),
        "gemini_anahtar": gemini,
        "token_gerekli": bool(api.get("token_gerekli")) if api else token,
        "lan_adresleri": (api or {}).get("lan_adresleri") or lan_adresleri(port),
        "kota": (api or {}).get("kota"),
        "ogrenme": (api or {}).get("ogrenme"),
        "arsiv_tarama": (api or {}).get("arsiv_tarama"),
        "ozel_bant_mm": (api or {}).get("ozel_bant_mm"),
        "olcu_havuzu": (api or {}).get("olcu_havuzu"),
    }
    if not dinliyor:
        ozet["durum"] = "uyari"
        ozet["not"] = "Sunucu bu anda dinlemiyor; boru hattı ve kara kutu yine de yerelde ölçüldü."
    return ozet


def kaynak_tuketimi() -> dict[str, Any]:
    import shutil

    kok = ogrenme_kurallari.veri_kok()
    try:
        disk = shutil.disk_usage(kok if kok.exists() else kok.parent)
        disk_ozet = {
            "veri_kok": str(kok),
            "toplam_gb": round(disk.total / (1024**3), 2),
            "bos_gb": round(disk.free / (1024**3), 2),
            "kullanilan_yuzde": round(100 * (1 - disk.free / disk.total), 1) if disk.total else None,
        }
    except OSError as hata:
        disk_ozet = {"hata": str(hata)}
    ram = _bellek_gb()
    durum = "tamam"
    if isinstance(disk_ozet.get("bos_gb"), (int, float)) and disk_ozet["bos_gb"] < 1:
        durum = "hata"
    elif isinstance(disk_ozet.get("bos_gb"), (int, float)) and disk_ozet["bos_gb"] < 3:
        durum = "uyari"
    if ram.get("yuk_yuzde", 0) >= 95:
        durum = _seviye(durum, "uyari")
    return {
        "durum": durum,
        "cekirdek": os.cpu_count(),
        "bellek": ram,
        "disk": disk_ozet,
    }


def ocr_boru_hatti() -> dict[str, Any]:
    adimlar: dict[str, Any] = {}
    durumlar: list[str] = []

    try:
        from on_isleme import gorseli_baytlardan, gorseli_on_isle  # noqa: F401

        adimlar["on_isleme"] = "tamam"
    except Exception as hata:
        adimlar["on_isleme"] = str(hata)
        durumlar.append("hata")

    motor = None
    paket = None
    try:
        from rapidocr_onnxruntime import RapidOCR as RapidA

        paket = "rapidocr_onnxruntime"
        motor = RapidA
    except Exception:
        try:
            from rapidocr import RapidOCR as RapidB

            paket = "rapidocr"
            motor = RapidB
        except Exception as hata:
            adimlar["rapidocr"] = str(hata)
            durumlar.append("hata")
    if motor is not None:
        adimlar["rapidocr"] = paket
        try:
            from yerel_ocr import _ocr_motoru

            ornek = _ocr_motoru()
            adimlar["rapidocr_yuklu"] = ornek is not None
            if ornek is None:
                durumlar.append("uyari")
        except Exception as hata:
            adimlar["rapidocr_yuklu"] = str(hata)
            durumlar.append("uyari")

    try:
        from gemini_yedek import gemini_kesim_oku  # noqa: F401

        adimlar["gemini_modul"] = "tamam"
    except Exception as hata:
        adimlar["gemini_modul"] = str(hata)
        durumlar.append("hata")

    anahtar = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    adimlar["gemini_anahtar"] = anahtar
    if not anahtar:
        durumlar.append("uyari")

    try:
        from boru_hatti import kroki_oku_baytlari  # noqa: F401

        adimlar["boru_hatti"] = "tamam"
    except Exception as hata:
        adimlar["boru_hatti"] = str(hata)
        durumlar.append("hata")

    sozluk = {
        "bos": bant_sozlugu_kod("720 x 400"),
        "kutu": bant_sozlugu_kod("tam kutu"),
        "cift_nokta": bant_sozlugu_kod("çift nokta"),
        "sag_I": bant_sozlugu_kod("201 x 43 I"),
        "iki_en": bant_sozlugu_kod("201 x 43 adet 2 ="),
    }
    adimlar["bant_sozlugu"] = sozluk
    if (
        sozluk["bos"] != "0-0-0-0"
        or sozluk["kutu"] != "1-1-1-1"
        or sozluk["cift_nokta"] != "1-1-0-0"
        or sozluk["sag_I"] != "1-0-0-0"
        or sozluk["iki_en"] != "0-0-1-1"
    ):
        durumlar.append("hata")

    return {"durum": _seviye(*durumlar) if durumlar else "tamam", "adimlar": adimlar}


def tunel_baglantisi() -> dict[str, Any]:
    port = _port()
    yerel = _tcp_acik("127.0.0.1", port)
    lan = lan_adresleri(port)
    adlar = _surec_adlari()
    tunel = sorted({ad for ad in adlar if any(t in ad for t in TUNEL_SURECLERI)})
    uvicorn = any("uvicorn" in ad or ad.startswith("python") for ad in adlar)
    kesim = any("kesim" in ad for ad in adlar)
    if yerel and lan:
        durum = "tamam"
        notu = "Yerel HTTP açık; telefon aynı Wi-Fi ile LAN adresinden bağlanır."
    elif yerel:
        durum = "uyari"
        notu = "Yerel dinleme var, LAN IP bulunamadı."
    else:
        durum = "uyari"
        notu = "Uygulama şu an kapalı; tünel/LAN yok."
    sabit = os.environ.get("OCR_PUBLIC_URL", "").strip()
    if tunel:
        notu += f" Harici tünel süreci: {', '.join(tunel)}."
    elif sabit:
        notu += f" Sabit adres tanımlı ({sabit}); cloudflared süreci bu kontrolde yok."
        durum = _seviye(durum, "uyari") if yerel else durum
    else:
        notu += " Cloudflare süreci yok. Kalıcı tünel: tunel_baslat.bat ve OCR_PUBLIC_URL."
    return {
        "durum": durum,
        "yerel_tcp": yerel,
        "lan_adresleri": lan,
        "sabit_adres": sabit or None,
        "harici_tunel_surecleri": tunel,
        "python_veya_uvicorn": uvicorn,
        "kesim_exe": kesim,
        "not": notu,
    }


def _log_satirlarini_oku(yol: Path, tavan_bayt: int = 65536) -> list[str]:
    if not yol.is_file():
        return []
    boyut = yol.stat().st_size
    with yol.open("rb") as dosya:
        if boyut > tavan_bayt:
            dosya.seek(boyut - tavan_bayt)
            dosya.readline()
        ham = dosya.read().decode("utf-8", errors="replace")
    return [s for s in ham.splitlines() if s.strip()]


def kara_kutu_senkron(probe_yaz: bool = True) -> dict[str, Any]:
    yol = hata_log_yolu()
    beklenen = ogrenme_kurallari.veri_kok() / "hatalar" / "hata_kayitlari.log"
    damga = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    imza = f"saglik-senkron-{damga}-{os.getpid()}"
    yazildi = False
    if probe_yaz:
        hata_yaz(SAGLIK, imza)
        yazildi = True
        time.sleep(0.05)
    satirlar = _log_satirlarini_oku(yol)
    son = satirlar[-12:] if satirlar else []
    bulundu = any(imza in s for s in satirlar[-5:]) if probe_yaz else True
    kod_say = {}
    kayma = False
    simdi = datetime.now(timezone.utc)
    for satir in satirlar:
        parca = satir.split(" | ")
        if len(parca) < 2:
            continue
        kod = parca[1].strip()
        kod_say[kod] = kod_say.get(kod, 0) + 1
        try:
            ts = datetime.fromisoformat(parca[0].replace("Z", "+00:00"))
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            if abs((simdi - ts).total_seconds()) > 86400 * 30:
                continue
            if (simdi - ts).total_seconds() < 0 and abs((simdi - ts).total_seconds()) > SAAT_KAYMASI_SN:
                kayma = True
        except ValueError:
            continue
    durum = "tamam"
    if not yol.is_file():
        durum = "hata"
    elif probe_yaz and not bulundu:
        durum = "hata"
    elif kayma:
        durum = "uyari"
    elif yol.stat().st_size == 0 and not probe_yaz:
        durum = "uyari"
    try:
        ayni_yol = yol.resolve() == beklenen.resolve()
    except OSError:
        ayni_yol = str(yol) == str(beklenen)
    return {
        "durum": durum,
        "yol": str(yol),
        "beklenen_yol": str(beklenen),
        "yol_eslesiyor": ayni_yol,
        "boyut_bayt": yol.stat().st_size if yol.is_file() else 0,
        "mtime_utc": datetime.fromtimestamp(yol.stat().st_mtime, tz=timezone.utc).isoformat(timespec="seconds")
        if yol.is_file()
        else None,
        "probe_yazildi": yazildi,
        "probe_okundu": bulundu,
        "kod_sayilari_pencere": kod_say,
        "son_satirlar": son,
        "saat_kaymasi": kayma,
    }


def raporu_olustur(probe_yaz: bool = True) -> dict[str, Any]:
    ortam_yukle()
    load_dotenv(Path(__file__).resolve().parent / ".env")
    anlik = anlik_durum()
    kaynak = kaynak_tuketimi()
    ocr = ocr_boru_hatti()
    tunel = tunel_baglantisi()
    kara = kara_kutu_senkron(probe_yaz=probe_yaz)
    genel = _seviye(anlik["durum"], kaynak["durum"], ocr["durum"], tunel["durum"], kara["durum"])
    return {
        "rapor": "Sağlık ve Gidişat",
        "zaman_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "genel": genel,
        "anlik": anlik,
        "kaynak": kaynak,
        "ocr_boru_hatti": ocr,
        "tunel": tunel,
        "kara_kutu": kara,
    }


def metin_rapor(veri: dict[str, Any]) -> str:
    satir = [
        f"=== {veri.get('rapor')} ({veri.get('zaman_utc')}) genel={veri.get('genel')} ===",
        f"[Anlık] {veri['anlik']['durum']} port={veri['anlik']['port']} dinliyor={veri['anlik']['dinliyor']} hazir={veri['anlik']['hazir']} gemini_anahtar={veri['anlik']['gemini_anahtar']}",
        f"  LAN: {', '.join(veri['anlik'].get('lan_adresleri') or [])}",
        f"[Kaynak] {veri['kaynak']['durum']} CPU={veri['kaynak'].get('cekirdek')} bellek={veri['kaynak'].get('bellek')} disk={veri['kaynak'].get('disk')}",
        f"[OCR] {veri['ocr_boru_hatti']['durum']} {veri['ocr_boru_hatti'].get('adimlar')}",
        f"[Tünel] {veri['tunel']['durum']} {veri['tunel'].get('not')}",
        f"  TCP yerel={veri['tunel']['yerel_tcp']} harici={veri['tunel'].get('harici_tunel_surecleri')}",
        f"[Kara kutu] {veri['kara_kutu']['durum']} yol={veri['kara_kutu']['yol']} eşleşiyor={veri['kara_kutu']['yol_eslesiyor']} probe={veri['kara_kutu']['probe_okundu']} bayt={veri['kara_kutu']['boyut_bayt']}",
    ]
    kota = veri["anlik"].get("kota")
    if kota:
        satir.append(f"  Kota kalan={kota.get('kalan')} / {kota.get('tavan')} hafta={kota.get('hafta')}")
    return "\n".join(satir) + "\n"


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    json_mod = "--json" in argv
    probe = "--no-probe" not in argv
    veri = raporu_olustur(probe_yaz=probe)
    if json_mod:
        print(json.dumps(veri, ensure_ascii=False, indent=2, default=str))
    else:
        print(metin_rapor(veri))
    return 0 if veri.get("genel") != "hata" else 1


if __name__ == "__main__":
    raise SystemExit(main())
