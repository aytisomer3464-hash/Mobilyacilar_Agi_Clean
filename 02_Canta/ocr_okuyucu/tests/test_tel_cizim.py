from PIL import Image, ImageDraw

from boru_hatti import kroki_oku
from tel_cizim import tel_cizim_aday_mi, tel_cizim_skoru


def test_yogun_cizgi_aday():
    img = Image.new("RGB", (400, 400), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    for i in range(0, 400, 8):
        draw.line((i, 0, 400 - i, 399), fill=(0, 0, 0), width=1)
        draw.line((0, i, 399, 400 - i), fill=(0, 0, 0), width=1)
    assert tel_cizim_skoru(img) > 0.2
    assert tel_cizim_aday_mi(img, olcu_satir_sayisi=0) is True
    assert tel_cizim_aday_mi(img, olcu_satir_sayisi=4) is False


def test_salter_kapali_filtreler(tmp_path, monkeypatch):
    yol = tmp_path / "tel.jpg"
    img = Image.new("RGB", (400, 400), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    for i in range(0, 400, 6):
        draw.line((i, 0, 399, i), fill=(20, 20, 20), width=2)
    img.save(yol)

    monkeypatch.setattr("boru_hatti.ocr_okuma", lambda _g: ([], []))
    monkeypatch.setattr("boru_hatti.tel_cizim_aday_mi", lambda *_a, **_k: True)
    sonuc = kroki_oku(yol, yalniz_yerel=True, tel_cizim_izinli=False)
    assert sonuc is not None
    assert sonuc["kesim_listesi"] == []
    assert sonuc["akilli_recete"]["tel_cizim"]["filtrelendi"] is True
    assert "tel çizimdir" in (sonuc.get("tel_cizim_uyari") or "").lower()
    assert sonuc.get("tel_cizim_kutulari")


def test_salter_acik_receteye_girer(tmp_path, monkeypatch):
    yol = tmp_path / "tel.jpg"
    img = Image.new("RGB", (200, 200), (255, 255, 255))
    ImageDraw.Draw(img).line((10, 10, 180, 180), fill=0, width=3)
    img.save(yol)
    monkeypatch.setattr("boru_hatti.ocr_okuma", lambda _g: ([], [{"tur": "serbest", "metin": "perspektif dolap", "kategori": "Gövde"}]))
    sonuc = kroki_oku(yol, yalniz_yerel=True, tel_cizim_izinli=True)
    assert sonuc is not None
    assert "perspektif" in " ".join(sonuc["akilli_recete"].get("tasarim_yazilari") or [])


def test_semadan_parca_ayikla():
    from tel_cizim import semadan_parca_ayikla, tel_olcu_ibaresi

    bolge = [[0, 0, 100, 100]]
    ic = {"parca_adi": "Uydurma", "kutu": [10, 10, 20, 20]}
    dis = {"parca_adi": "Raf", "kutu": [400, 10, 30, 20]}
    kalan = semadan_parca_ayikla([ic, dis], bolge)
    assert [p["parca_adi"] for p in kalan] == ["Raf"]
    assert tel_olcu_ibaresi([{"metin": "kroki 720 x 400"}]) == "720 × 400"
