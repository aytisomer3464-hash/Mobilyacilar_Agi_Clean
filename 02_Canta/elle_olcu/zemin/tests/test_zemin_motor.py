from zemin.motor import (
    bos,
    ek_kenar_yaz,
    ek_kutu,
    ek_tip_yaz,
    ek_var_yaz,
    ek_yapistir,
    muhur,
    nesne_birak,
    oda_duzelt,
    olcu_yaz,
)


def _ana():
    d = bos()
    d = olcu_yaz(d, 4000)
    d = olcu_yaz(d, 3000)
    return d


def test_tur_en_boy_sonra_ek_var():
    d = _ana()
    assert d["tur"] == "ek_var"
    assert d["alan_mm2"] == 4000 * 3000
    assert d["cumle"] == "Bu odada ek parça var mı?"


def test_bos_zemin_gerecsiz_muhur():
    d = ek_var_yaz(_ana(), False)
    assert d["tur"] == "birak"
    assert d["yerlesim"] == []
    d = muhur(d)
    assert d["kilit"] is True
    assert d["yerlesim"] == []


def test_ek_yok_birak_ve_kilit():
    d = ek_var_yaz(_ana(), False)
    assert d["tur"] == "birak"
    d = nesne_birak(d, "sifon", 100, 100)
    assert d["hazir"] is True
    d = muhur(d)
    assert d["kilit"] is True


def test_cikinti_alan_artar():
    d = ek_tip_yaz(ek_var_yaz(_ana(), True), "cikinti")
    d = olcu_yaz(d, 1000)
    d = olcu_yaz(d, 500)
    d = ek_kenar_yaz(d, "sol")
    assert d["hazir"] is True
    assert d["alan_mm2"] == 4000 * 3000 + 1000 * 500
    assert ek_kutu(d, d["ekler"][0])["sol"] == -500
    d = ek_var_yaz(d, False)
    assert muhur(d)["kilit"] is True


def test_oyuk_alan_dusar_ve_sigmaz_son_kayit():
    d = ek_tip_yaz(ek_var_yaz(_ana(), True), "oyuk")
    d = olcu_yaz(d, 800)
    d = olcu_yaz(d, 400)
    d = ek_kenar_yaz(d, "arka")
    assert d["alan_mm2"] == 4000 * 3000 - 800 * 400
    once = d["ekler"][:]
    d2 = ek_tip_yaz(ek_var_yaz(d, True), "oyuk")
    d2 = olcu_yaz(d2, 5000)
    d2 = olcu_yaz(d2, 100)
    bad = ek_kenar_yaz(d2, "on")
    assert bad["hazir"] is False
    assert "sığmaz" in bad["soz"]
    assert len(bad["ekler"]) == len(once)


def test_yapistir_yakin_kenar():
    d = ek_tip_yaz(ek_var_yaz(_ana(), True), "cikinti")
    d = olcu_yaz(d, 600)
    d = olcu_yaz(d, 200)
    d = ek_yapistir(d, 3990, 1500)
    assert d["hazir"] is True
    assert d["ekler"][0]["kenar"] == "sag"
    assert d["ekler"][0]["kayma"] == 1200


def test_l_oyuk_arka_kayma():
    d = ek_tip_yaz(ek_var_yaz(_ana(), True), "oyuk")
    d = olcu_yaz(d, 1600)
    d = olcu_yaz(d, 1200)
    d = ek_kenar_yaz(d, "arka", 2400)
    assert d["hazir"] is True
    assert d["ekler"][0]["kayma"] == 2400
    k = ek_kutu(d, d["ekler"][0])
    assert k["sol"] == 2400
    assert k["alt"] == 3000 - 1200


def test_ek_bitmeden_muhur_yok():
    assert muhur(_ana())["kilit"] is False
    d = oda_duzelt(_ana(), "en", 3500)
    assert d["oda"]["en"] == 3500


def test_motor_js_pakette():
    from zemin.baglanti import motor_js_yol, motor_yol

    assert motor_yol() is not None
    js = motor_js_yol()
    assert js is not None and js.is_file()
    metin = js.read_text(encoding="utf-8")
    assert "ZeminMotor" in metin
    assert "olcu_yaz" in metin
