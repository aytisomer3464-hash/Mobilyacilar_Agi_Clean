from PIL import Image, ImageDraw

import boru_hatti
from boru_hatti import kroki_oku, kroki_oku_baytlari


def _ornek_gorsel(yol):
    img = Image.new("RGB", (400, 300), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle((20, 20, 380, 280), outline=(0, 0, 0), width=3)
    img.save(yol)


def test_yuksek_guven_gemini_atlanir(tmp_path, monkeypatch):
    yol = tmp_path / "kagit.jpg"
    _ornek_gorsel(yol)
    cagrildi = {"gemini": 0}

    def sahte_ocr(_gorsel):
        return [
            {
                "modul_kodu": "M1",
                "parca_adi": "Dikme",
                "uzunluk_mm": 720,
                "genislik_mm": 560,
                "kalinlik_mm": 18,
                "adet": 1,
                "malzeme": "MDFLAM",
                "not": "72 x 56",
                "supheli": False,
                "guven": 0.92,
            }
            for _ in range(3)
        ]

    def sahte_gemini(*_a, **_k):
        cagrildi["gemini"] += 1
        raise AssertionError("Gemini çağrılmamalı")

    monkeypatch.setattr(boru_hatti, "ocr_okuma", lambda g: (sahte_ocr(g), []))
    sonuc = kroki_oku(yol, tmp_path / "out.json", gemini_oku=sahte_gemini)
    assert sonuc is not None
    assert cagrildi["gemini"] == 0
    assert len(sonuc["kesim_listesi"]) == 3
    assert sonuc.get("okuma_kaynak") == "yerel"
    assert (tmp_path / "out.json").exists()


def test_dusuk_guven_gemini_cagrilir(tmp_path, monkeypatch):
    yol = tmp_path / "kagit.jpg"
    _ornek_gorsel(yol)

    def sahte_ocr(_gorsel):
        return [
            {
                "modul_kodu": "GENEL",
                "parca_adi": "Raf",
                "uzunluk_mm": 800,
                "genislik_mm": 400,
                "kalinlik_mm": 18,
                "adet": 1,
                "malzeme": "",
                "not": "80 x 40",
                "supheli": True,
                "guven": 0.4,
                "kutu": [10, 10, 80, 20],
                "ham_metin": "80 x 40",
            }
        ]

    def sahte_gemini(gorsel, yerel_adaylar=None, dusuk_parcalar=None):
        assert yerel_adaylar
        return {
            "kesim_listesi": [
                {
                    "modul_kodu": "M1",
                    "parca_adi": "Raf",
                    "uzunluk_mm": 800,
                    "genislik_mm": 400,
                    "kalinlik_mm": 18,
                    "adet": 1,
                    "malzeme": "Beyaz",
                    "not": "doğrulandı",
                    "supheli": False,
                }
            ],
            "genel_notlar": [],
        }

    monkeypatch.setattr(boru_hatti, "ocr_okuma", lambda g: (sahte_ocr(g), []))
    sonuc = kroki_oku(yol, yalniz_yerel=False, gemini_oku=sahte_gemini)
    assert sonuc is not None
    assert sonuc["kesim_listesi"][0]["parca_adi"] == "Raf"
    assert sonuc.get("okuma_kaynak") == "gemini"


def test_yalniz_yerel_gemini_cagirmaz(tmp_path, monkeypatch):
    yol = tmp_path / "kagit.jpg"
    _ornek_gorsel(yol)

    def sahte_ocr(_gorsel):
        return [
            {
                "modul_kodu": "GENEL",
                "parca_adi": "Raf",
                "uzunluk_mm": 800,
                "genislik_mm": 400,
                "kalinlik_mm": 18,
                "adet": 1,
                "malzeme": "",
                "not": "80 x 40",
                "supheli": True,
                "guven": 0.3,
            }
        ]

    def sahte_gemini(*_a, **_k):
        raise AssertionError("Gemini çağrılmamalı")

    monkeypatch.setattr(boru_hatti, "ocr_okuma", lambda g: (sahte_ocr(g), []))
    sonuc = kroki_oku(yol, yalniz_yerel=True, gemini_oku=sahte_gemini)
    assert sonuc is not None
    assert sonuc["kesim_listesi"][0]["supheli"] is True


def test_eksik_dosya_none():
    assert kroki_oku("olmayan_dosya_xyz.jpg") is None


def test_baytlardan_oku(tmp_path, monkeypatch):
    yol = tmp_path / "kagit.jpg"
    _ornek_gorsel(yol)

    def sahte_ocr(_gorsel):
        return [
            {
                "modul_kodu": "M1",
                "parca_adi": "Dikme",
                "uzunluk_mm": 720,
                "genislik_mm": 560,
                "kalinlik_mm": 18,
                "adet": 1,
                "malzeme": "MDFLAM",
                "not": "72 x 56",
                "supheli": False,
                "guven": 0.92,
            }
            for _ in range(3)
        ]

    monkeypatch.setattr(boru_hatti, "ocr_okuma", lambda g: (sahte_ocr(g), []))
    sonuc = kroki_oku_baytlari(yol.read_bytes(), gemini_oku=lambda *a, **k: (_ for _ in ()).throw(AssertionError()))
    assert sonuc is not None
    assert len(sonuc["kesim_listesi"]) == 3


def test_ikinci_ayni_bayt_havuzdan_gemini_atlanir(tmp_path, monkeypatch):
    yol = tmp_path / "kagit.jpg"
    _ornek_gorsel(yol)
    bayt = yol.read_bytes()
    cagrildi = {"ocr": 0, "gemini": 0}

    def sahte_ocr(_gorsel):
        cagrildi["ocr"] += 1
        return [
            {
                "modul_kodu": "M1",
                "parca_adi": "Dikme",
                "uzunluk_mm": 720,
                "genislik_mm": 560,
                "kalinlik_mm": 18,
                "adet": 1,
                "malzeme": "MDFLAM",
                "not": "72 x 56",
                "supheli": False,
                "guven": 0.92,
            }
            for _ in range(3)
        ]

    def sahte_gemini(*_a, **_k):
        cagrildi["gemini"] += 1
        raise AssertionError("Gemini çağrılmamalı")

    monkeypatch.setattr(boru_hatti, "ocr_okuma", lambda g: (sahte_ocr(g), []))
    ilk = kroki_oku_baytlari(bayt, gemini_oku=sahte_gemini)
    assert ilk is not None
    from olcu_havuzu import havuza_yaz

    havuza_yaz(bayt, ilk, "havuz-test")
    ikinci = kroki_oku_baytlari(bayt, gemini_oku=sahte_gemini)
    assert ikinci is not None
    assert ikinci.get("okuma_kaynak") == "havuz"
    assert cagrildi["ocr"] == 1
    assert cagrildi["gemini"] == 0


def test_on_islenmis_kirpma_atlar(tmp_path, monkeypatch):
    yol = tmp_path / "kagit.jpg"
    _ornek_gorsel(yol)
    cagrildi = {"on_isle": 0}

    def sahte_on_isle(_g):
        cagrildi["on_isle"] += 1
        raise AssertionError("ön işleme atlanmalı")

    monkeypatch.setattr(boru_hatti, "gorseli_on_isle", sahte_on_isle)
    monkeypatch.setattr(
        boru_hatti,
        "ocr_okuma",
        lambda _g: ([{
            "modul_kodu": "M1",
            "parca_adi": "Dikme",
            "uzunluk_mm": 720,
            "genislik_mm": 560,
            "kalinlik_mm": 18,
            "adet": 1,
            "malzeme": "",
            "not": "72 x 56",
            "supheli": False,
            "guven": 0.92,
        }] * 3, []),
    )
    sonuc = kroki_oku_baytlari(yol.read_bytes(), on_islenmis=True, gemini_oku=lambda *a, **k: (_ for _ in ()).throw(AssertionError()))
    assert cagrildi["on_isle"] == 0
    assert sonuc is not None
    assert len(sonuc["kesim_listesi"]) == 3


def test_tel_adayinda_gemini_cagrilir(tmp_path, monkeypatch):
    yol = tmp_path / "tel.jpg"
    img = Image.new("RGB", (400, 400), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    for i in range(0, 400, 8):
        draw.line((i, 0, 400 - i, 399), fill=(0, 0, 0), width=1)
    img.save(yol)
    monkeypatch.setattr(boru_hatti, "ocr_okuma", lambda _g: ([], []))

    def sahte_gemini(gorsel, **_k):
        return {
            "kesim_listesi": [{
                "modul_kodu": "M1",
                "parca_adi": "Kapak",
                "uzunluk_mm": 720,
                "genislik_mm": 400,
                "kalinlik_mm": 18,
                "adet": 2,
                "malzeme": "",
                "not": "",
                "supheli": False,
                "kategori": "Kapak",
            }],
            "genel_notlar": [],
            "tel_cizim": True,
        }

    sonuc = kroki_oku(yol, yalniz_yerel=False, tel_cizim_izinli=False, gemini_oku=sahte_gemini)
    assert sonuc is not None
    assert sonuc["kesim_listesi"][0]["parca_adi"] == "Kapak"
