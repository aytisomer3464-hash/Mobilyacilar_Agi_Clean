# 01 ve 02 kaynaklarını karıştırmaz. Yalnız yayın kopyası üretir (iframe yok).
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
from pathlib import Path

from dotenv import load_dotenv

KOK = Path(__file__).resolve().parent
ANA = KOK / "01_Ana_Site"
OCR_STATIK = KOK / "02_Canta" / "ocr_okuyucu" / "web" / "static"
EBATLAMA_VITRIN = KOK / "02_Canta" / "ebatlama" / "vitrin"
CANTA = KOK / "02_Canta"
KAPI_VITRIN = (
    ("tel", CANTA / "tel_cizim" / "vitrin"),
    ("duvar", CANTA / "elle_olcu" / "duvar" / "vitrin"),
)
ELLE_YON = (
    "<!DOCTYPE html><html lang=\"tr\"><head><meta charset=\"UTF-8\">"
    "<meta http-equiv=\"refresh\" content=\"0;url=/duvar/\">"
    "<title>Mobilya İmalat Akıllı Reçete</title></head>"
    "<body><a href=\"/duvar/\">Aç</a></body></html>\n"
)
YAYIN = KOK / "00_Yayin"
OCR_DOSYALAR = ("index.html", "app.js", "style.css", "kabuk.css", "kirpici.js")
EBATLAMA_DOSYALAR = ("index.html", "vitrin.js", "style.css", "kabuk.css", "cep_motor.js")
KAMU_API_KOK = "https://cloud-bridge-470702229392.europe-west1.run.app"


def ortam_yukle() -> None:
    load_dotenv(KOK / "02_Canta" / "ocr_okuyucu" / ".env")


def vitrin_kapi_js() -> str:
    sifre = os.environ.get("MAGI_VITRIN_SIFRE", "").strip()
    if not sifre:
        raise SystemExit("MAGI_VITRIN_SIFRE yok. Yayın kapısız olmaz; .env içine yaz.")
    h = hashlib.sha256(sifre.encode("utf-8")).hexdigest()
    return (
        "(function(){"
        "var H=" + json.dumps(h) + ";"
        "var K='magi_vitrin_ok';"
        "function hex(buf){var a=new Uint8Array(buf),i,s='';"
        "for(i=0;i<a.length;i++)s+=('0'+a[i].toString(16)).slice(-2);return s;}"
        "function ac(){try{sessionStorage.setItem(K,'1');}catch(e){}"
        "document.documentElement.classList.remove('magi-kapi');"
        "var p=document.getElementById('magiKapi');if(p&&p.parentNode)p.parentNode.removeChild(p);}"
        "if(sessionStorage.getItem(K)==='1')return;"
        "document.documentElement.classList.add('magi-kapi');"
        "function perde(){"
        "if(sessionStorage.getItem(K)==='1'){ac();return;}"
        "if(document.getElementById('magiKapi'))return;"
        "var s=document.createElement('style');"
        "s.textContent='html.magi-kapi body>*{visibility:hidden!important}"
        "html.magi-kapi #magiKapi,html.magi-kapi #magiKapi *{visibility:visible!important}"
        "#magiKapi{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;"
        "justify-content:center;background:#2c3136;margin:0}"
        "#magiKapi form{width:min(320px,90vw);padding:24px;background:#1a1e22;border-radius:12px}"
        "#magiKapi h1{margin:0 0 16px;font-size:1.1rem;color:#e8e4dc}"
        "#magiKapi input{width:100%;box-sizing:border-box;min-height:44px;margin:0 0 12px;"
        "padding:8px 12px;border:1px solid #3a4046;border-radius:8px;background:#2c3136;color:#e8e4dc}"
        "#magiKapi button{width:100%;min-height:44px;border:0;border-radius:8px;background:#fb923c;"
        "color:#7c2d12;font-weight:800;cursor:pointer}"
        "#magiKapi .hata{margin:0 0 12px;color:#fb923c;font-size:0.9rem;display:none}';"
        "document.head.appendChild(s);"
        "var k=document.createElement('div');k.id='magiKapi';"
        "k.innerHTML='<form><h1>Mobilyacılar Ağı</h1><p class=\"hata\">Parola yanlış.</p>"
        "<input type=\"password\" name=\"sifre\" placeholder=\"Parola\" required autofocus>"
        "<button type=\"submit\">Giriş</button></form>';"
        "(document.body||document.documentElement).appendChild(k);"
        "k.querySelector('form').addEventListener('submit',function(ev){"
        "ev.preventDefault();"
        "var girdi=k.querySelector('input').value||'';"
        "crypto.subtle.digest('SHA-256',new TextEncoder().encode(girdi)).then(function(buf){"
        "if(hex(buf)===H)ac();else k.querySelector('.hata').style.display='block';"
        "});"
        "});"
        "}"
        "if(document.body)perde();"
        "else document.addEventListener('DOMContentLoaded',perde);"
        "})();\n"
    )


def html_vitrin_kapi_ekle(metin: str) -> str:
    etiket = '<script src="./vitrin_kapi.js"></script>\n'
    if "vitrin_kapi.js" in metin:
        return metin
    m = re.search(r"<head[^>]*>", metin, re.I)
    if m:
        i = m.end()
        return metin[:i] + "\n" + etiket + metin[i:]
    return etiket + metin


def vitrin_kapi_yayin() -> None:
    js = vitrin_kapi_js()
    for html in YAYIN.rglob("*.html"):
        (html.parent / "vitrin_kapi.js").write_text(js, encoding="utf-8")
        ham = html.read_text(encoding="utf-8")
        html.write_text(html_vitrin_kapi_ekle(ham), encoding="utf-8")


def html_komsu_yol(metin: str) -> str:
    return metin.replace('href="/static/', 'href="./').replace('src="/static/', 'src="./')


def kapi_js() -> str:
    paket = os.environ.get("MAGI_KOPRU_URL", KAMU_API_KOK).strip().rstrip("/") or KAMU_API_KOK
    kaynak = OCR_STATIK / "kapi.js"
    if kaynak.is_file():
        return kaynak.read_text(encoding="utf-8").replace(
            "https://cloud-bridge-470702229392.europe-west1.run.app", paket
        )
    return (
        "(function(){"
        "var paket=" + json.dumps(paket) + ";"
        "window.MAGI_API_KOK=paket;"
        "window.MAGI_apiUrl=function(yol){"
        "if(!yol)return paket;"
        "if(yol.charAt(0)!=='/')yol='/'+yol;"
        "return paket+yol;"
        "};"
        "})();\n"
    )


def js_api_kok(metin: str) -> str:
    """Yalnız yayın kopyasında /api çağrılarını MAGI_apiUrl ile sarar (kaynak 02 durur)."""

    def cift(m: re.Match[str]) -> str:
        return f'fetch(window.MAGI_apiUrl("{m.group(1)}"{m.group(2) or ""})'

    def sablon(m: re.Match[str]) -> str:
        return f"fetch(window.MAGI_apiUrl(`{m.group(1)}`)"

    metin = re.sub(r'fetch\("(/api/[^"]*)"(\s*\+\s*[^,]+)?', cift, metin)
    return re.sub(r"fetch\(`(/api/[^`]*)`", sablon, metin)


def html_kapi_ekle(metin: str) -> str:
    etiket = '<script src="./kapi.js"></script>\n'
    if "kapi.js" in metin:
        return metin
    for anahtar in ('<script src="./kirpici.js', '<script src="./app.js', "<script>"):
        if anahtar in metin:
            return metin.replace(anahtar, etiket + anahtar, 1)
    return metin + "\n" + etiket


def kopyala() -> None:
    if YAYIN.exists():
        shutil.rmtree(YAYIN)
    YAYIN.mkdir(parents=True)
    for ad in ("index.html", "app.js", "style.css"):
        shutil.copy2(ANA / ad, YAYIN / ad)
    reklam_kaynak = ANA / "reklam"
    if reklam_kaynak.is_dir():
        shutil.copytree(reklam_kaynak, YAYIN / "static" / "reklam", dirs_exist_ok=True)
    prog = YAYIN / "programlar"
    prog.mkdir()
    yakinda = ANA / "programlar" / "yakinda.html"
    if yakinda.is_file():
        shutil.copy2(yakinda, prog / "yakinda.html")
    okuyucu = YAYIN / "okuyucu"
    okuyucu.mkdir()
    (okuyucu / "kapi.js").write_text(kapi_js(), encoding="utf-8")
    for ad in OCR_DOSYALAR:
        kaynak = OCR_STATIK / ad
        if not kaynak.is_file():
            continue
        hedef = okuyucu / ad
        ham = kaynak.read_text(encoding="utf-8") if ad.endswith((".html", ".js")) else None
        if ad.endswith(".html"):
            hedef.write_text(html_kapi_ekle(js_api_kok(html_komsu_yol(ham or ""))), encoding="utf-8")
        elif ad.endswith(".js"):
            hedef.write_text(js_api_kok(ham or ""), encoding="utf-8")
        else:
            shutil.copy2(kaynak, hedef)
    ebat = YAYIN / "ebatlama"
    ebat.mkdir()
    for ad in EBATLAMA_DOSYALAR:
        kaynak = EBATLAMA_VITRIN / ad
        if kaynak.is_file():
            shutil.copy2(kaynak, ebat / ad)
    for yayin_ad, vitrin in KAPI_VITRIN:
        hedef = YAYIN / yayin_ad
        hedef.mkdir()
        if not vitrin.is_dir():
            continue
        for kaynak in vitrin.iterdir():
            if kaynak.is_file():
                shutil.copy2(kaynak, hedef / kaynak.name)
    elle_hedef = YAYIN / "elle"
    elle_hedef.mkdir(exist_ok=True)
    (elle_hedef / "index.html").write_text(ELLE_YON, encoding="utf-8")
    zemin_hedef = YAYIN / "zemin"
    zemin_hedef.mkdir(exist_ok=True)
    zemin_js = CANTA / "elle_olcu" / "zemin" / "zemin_motor.js"
    if zemin_js.is_file():
        shutil.copy2(zemin_js, zemin_hedef / "zemin_motor.js")
    mobilya_hedef = YAYIN / "mobilya"
    mobilya_hedef.mkdir(exist_ok=True)
    mobilya_js = CANTA / "elle_olcu" / "mobilya" / "mobilya_motor.js"
    mobilya_cfg = CANTA / "elle_olcu" / "mobilya" / "varsayilan_config.json"
    if mobilya_js.is_file():
        shutil.copy2(mobilya_js, mobilya_hedef / "mobilya_motor.js")
    if mobilya_cfg.is_file():
        shutil.copy2(mobilya_cfg, mobilya_hedef / "varsayilan_config.json")
    vitrin_kapi_yayin()


ZORUNLU_GUVENLIK = (
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Cross-Origin-Opener-Policy",
    "Cross-Origin-Resource-Policy",
    "Strict-Transport-Security",
    "Content-Security-Policy",
)


def duman_firebase() -> None:
    """Her predeploy'da rewrite + güvenlik başlığı; 01/02 kaynağına bakmaz."""
    cfg = json.loads((KOK / "firebase.json").read_text(encoding="utf-8"))
    hosting = cfg["hosting"]
    if isinstance(hosting, list):
        hosting = next((h for h in hosting if h.get("target") == "ahsap13"), hosting[0])
    assert hosting.get("target") == "ahsap13"
    rewrites = hosting["rewrites"]
    kaynaklar = [kural["source"] for kural in rewrites]
    assert kaynaklar[-1] == "**"
    assert rewrites[-1].get("destination") == "/index.html"
    for api_kaynak in ("/api", "/api/**"):
        assert api_kaynak in kaynaklar, f"eksik rewrite: {api_kaynak}"
        assert kaynaklar.index(api_kaynak) < kaynaklar.index("**")
        kural = next(k for k in rewrites if k["source"] == api_kaynak)
        assert kural.get("destination") != "/index.html"
        run = kural.get("run") or {}
        assert run.get("serviceId") == "cloud-bridge"
        assert run.get("region") == "europe-west1"
    assert "/okuyucu" in kaynaklar and kaynaklar.index("/okuyucu") < kaynaklar.index("**")
    assert "/ebatlama" in kaynaklar and kaynaklar.index("/ebatlama") < kaynaklar.index("**")
    assert "/ebatlama/**" in kaynaklar and kaynaklar.index("/ebatlama/**") < kaynaklar.index("**")
    for kapi in ("/elle", "/elle/**", "/tel", "/tel/**", "/duvar", "/duvar/**"):
        assert kapi in kaynaklar and kaynaklar.index(kapi) < kaynaklar.index("**")
    basliklar: dict[str, str] = {}
    for blok in hosting.get("headers") or []:
        for satir in blok.get("headers") or []:
            basliklar[satir["key"]] = satir["value"]
    for ad in ZORUNLU_GUVENLIK:
        assert ad in basliklar, f"eksik güvenlik başlığı: {ad}"
    assert basliklar["X-Content-Type-Options"] == "nosniff"
    assert basliklar["X-Frame-Options"] == "DENY"
    csp = basliklar["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in csp
    assert "object-src 'none'" in csp
    assert "connect-src 'self' https:" in csp
    assert "script-src 'self' 'unsafe-inline'" in csp
    assert "https://fonts.googleapis.com" in csp
    assert "microphone=(self)" in basliklar["Permissions-Policy"]
    assert "camera=(self)" in basliklar["Permissions-Policy"]
    assert "max-age=" in basliklar["Strict-Transport-Security"]


def duman() -> None:
    ana = (YAYIN / "index.html").read_text(encoding="utf-8")
    ocr = (YAYIN / "okuyucu" / "index.html").read_text(encoding="utf-8")
    ebat = (YAYIN / "ebatlama" / "index.html").read_text(encoding="utf-8")
    cep = (YAYIN / "ebatlama" / "cep_motor.js").read_text(encoding="utf-8")
    uygulama = (YAYIN / "okuyucu" / "app.js").read_text(encoding="utf-8")
    kapi = (YAYIN / "okuyucu" / "kapi.js").read_text(encoding="utf-8")
    assert "iframe" not in ana.lower(), "01 yayında iframe var"
    assert "iframe" not in ocr.lower(), "okuyucu yayında iframe var"
    assert "iframe" not in ebat.lower(), "ebatlama yayında iframe var"
    for kapi_ad in ("elle", "tel", "duvar"):
        kapi_html = (YAYIN / kapi_ad / "index.html").read_text(encoding="utf-8")
        assert "iframe" not in kapi_html.lower(), f"{kapi_ad} yayında iframe var"
    assert "url=/duvar/" in (YAYIN / "elle" / "index.html").read_text(encoding="utf-8")
    assert "ZeminMotor" in (YAYIN / "zemin" / "zemin_motor.js").read_text(encoding="utf-8")
    assert "MobilyaMotor" in (YAYIN / "mobilya" / "mobilya_motor.js").read_text(encoding="utf-8")
    tel_html = (YAYIN / "tel" / "index.html").read_text(encoding="utf-8")
    duvar_html = (YAYIN / "duvar" / "index.html").read_text(encoding="utf-8")
    assert "Kapı açık" in tel_html
    assert "DuvarMotor" in (YAYIN / "duvar" / "duvar_motor.js").read_text(encoding="utf-8")
    assert "duvarSahne" in duvar_html
    assert "odaUygula" in duvar_html
    assert "cep_motor.js" in ebat
    assert "CepMotor" in cep
    assert "Fire Ebatlama" in ebat or "Ebatlama" in ebat
    assert 'id="karaMetin"' in ana, "sesli metin kutusu 01 kopyasında yok"
    assert 'id="ebatlamaLink"' in ana
    assert 'data-arac="ebatlama"' in ana
    assert "kapi.js" in ocr
    assert KAMU_API_KOK in kapi, "yayın kapi.js Cloud Run tabanını taşımıyor"
    assert "MAGI_istek" in kapi
    assert "MAGI_apiUrl" in kapi
    assert "setInterval" not in kapi
    assert "kopruIzle" not in kapi
    assert "httpsSayfa" not in kapi
    assert "127.0.0.1:8765" not in ana
    assert "127.0.0.1:8765" not in (YAYIN / "app.js").read_text(encoding="utf-8")
    kapi_js_yayin = (YAYIN / "vitrin_kapi.js").read_text(encoding="utf-8")
    assert "vitrin_kapi.js" in ana
    assert "vitrin_kapi.js" in duvar_html
    assert "magi-kapi" in kapi_js_yayin
    sifre = os.environ.get("MAGI_VITRIN_SIFRE", "").strip()
    if sifre:
        assert sifre not in kapi_js_yayin
        assert hashlib.sha256(sifre.encode("utf-8")).hexdigest() in kapi_js_yayin
    assert "MAGI_apiUrl" in kapi
    assert "magiCek(\"/api/tara\" + sorgu" in uygulama
    assert 'fetch("/api/tara"' not in uygulama, "yayın kopyası hâlâ çıplak /api/tara"
    duman_firebase()
    kopru = (KOK / "cloud_bridge.py").read_text(encoding="utf-8")
    assert "127.0.0.1:8765" not in kopru
    assert "from sunucu import" not in kopru
    assert "ASGITransport" not in kopru
    assert "httpx" not in kopru
    assert "gemini_kesim_oku" in kopru
    assert "magi_kopru_url" not in kapi
    kaynak_02 = (OCR_STATIK / "app.js").read_text(encoding="utf-8")
    assert 'fetch("/api/tara"' not in kaynak_02
    assert KAMU_API_KOK in kaynak_02
    print("yayin-ok", YAYIN)
    print("spa-api-ayrik=ok kapi-tarama-only=ok yerel-8765=ok")


if __name__ == "__main__":
    ortam_yukle()
    kopyala()
    duman()
