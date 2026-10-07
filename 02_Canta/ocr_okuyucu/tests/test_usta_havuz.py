from usta_havuz import imza_benzerlik, kalip_bul, liste_imzasi, olcu_anahtari


def _parca(boy, en, adet=1):
    return {"uzunluk_mm": boy, "genislik_mm": en, "adet": adet, "parca_adi": "Raf"}


def test_olcu_anahtari_yuvarlar():
    assert olcu_anahtari(_parca(721, 399, 2)) == (720, 400, 2)


def test_imza_benzer_eslesir():
    a = liste_imzasi([_parca(720, 560), _parca(800, 400), _parca(400, 400)])
    b = liste_imzasi([_parca(720, 560), _parca(800, 400), _parca(400, 400)])
    assert imza_benzerlik(a, b) >= 0.85


def test_kalip_bul_bos_havuz(monkeypatch):
    monkeypatch.setattr("usta_havuz.havuz_kaliplari", lambda: [])
    assert kalip_bul([_parca(720, 560)] * 3) is None


def test_kalip_bul_eslesir(monkeypatch):
    kalip = [_parca(720, 560, 1), _parca(800, 400, 2), _parca(300, 300, 1)]
    monkeypatch.setattr("usta_havuz.havuz_kaliplari", lambda: [kalip])
    bulunan = kalip_bul([_parca(720, 560), _parca(800, 400, 2), _parca(300, 300)])
    assert bulunan is not None
    assert len(bulunan) == 3
