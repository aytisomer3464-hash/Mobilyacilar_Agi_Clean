from duvar.motor import (
    cakisiyor_mu,
    cakisiyor_ucgen_kutu,
    duvar_ayarla,
    engel_ekle,
    icinde_mi,
    kose_pah_ekle,
    kutu,
    modul_arka_mm,
    nokta_ucgende,
    oda_ayarla,
    oda_eleman_ekle,
    oda_hazirlik_onayla,
    oda_modul_ekle,
    olcu_yon_ayarla,
    duvar_sec,
    pah_ucgen,
    yasak_dilim_x,
)


def test_duvar_ayarla():
    d = duvar_ayarla(3200, 2600)
    assert d["hazir"] is True
    assert d["duvar"] == kutu(0, 0, 3200, 2600)
    assert duvar_ayarla(0, 2600)["hazir"] is False
    assert duvar_ayarla(3200, 5000)["hazir"] is False


def test_engel_icinde_ve_kenar_degme():
    d = duvar_ayarla(3000, 2500)
    a = engel_ekle(d, {"tip": "priz", "sol": 100, "alt": 300, "en": 80, "boy": 80, "yasak_pay_mm": 0})
    assert a["hazir"] is True
    b = engel_ekle(a, {"tip": "pencere", "sol": 180, "alt": 300, "en": 400, "boy": 800, "yasak_pay_mm": 0})
    assert b["hazir"] is True
    assert len(b["engeller"]) == 2
    assert yasak_dilim_x(b["yasak_kutular"][0]) == (100, 180)


def test_engel_tasar_ve_cakisma():
    d = duvar_ayarla(2000, 2000)
    tasar = engel_ekle(d, {"tip": "kapi", "sol": 1900, "alt": 0, "en": 200, "boy": 2000})
    assert tasar["hazir"] is False
    assert tasar["engeller"] == []
    a = engel_ekle(d, {"tip": "priz", "sol": 100, "alt": 100, "en": 200, "boy": 200, "yasak_pay_mm": 50})
    assert a["hazir"] is True
    c = engel_ekle(a, {"tip": "su", "sol": 280, "alt": 100, "en": 100, "boy": 100, "yasak_pay_mm": 0})
    assert c["hazir"] is False
    assert len(c["engeller"]) == 1


def test_aabb_kenar_degme_cakisma_degil():
    a = kutu(0, 0, 10, 10)
    b = kutu(10, 0, 10, 10)
    assert cakisiyor_mu(a, b) is False
    assert icinde_mi(a, kutu(0, 0, 10, 10)) is True
    assert icinde_mi(kutu(0, 0, 11, 10), kutu(0, 0, 10, 10)) is False


def test_oda_zemin_kilitsiz_kapali():
    d = oda_ayarla(4000, 3000, 2600)
    assert d["hazir"] is False
    assert d["zemin_kilit"] is False
    assert d["hatalar"] == ["Önce zemin mühürle."]
    assert oda_eleman_ekle(d, {"tip": "kapi", "duvar_no": 1})["hazir"] is False


def test_oda_modul_asama3_kapali():
    o = oda_ayarla(4000, 3000, 2600, True)
    o = oda_hazirlik_onayla(o)
    m = oda_modul_ekle(o, {"tip": "baza", "duvar_no": 1, "sol": 0, "alt": 0, "en": 600, "boy": 720})
    assert m["hazir"] is False
    assert m["hatalar"] == ["Mobilya aşaması kapalı."]
    assert m["zemin_kilit"] is True


def test_oda_dort_duvar_ve_zemin():
    o = oda_ayarla(4000, 3000, 2600, True)
    assert o["hazir"] is True
    assert o["zemin"] == kutu(0, 0, 4000, 3000)
    assert o["oda"] == {"en": 4000, "boy": 3000, "yukseklik": 2600}
    d = o["duvarlar"]
    assert [x["no"] for x in d] == [1, 2, 3, 4]
    assert [x["yon"] for x in d] == ["on", "sag", "arka", "sol"]
    assert d[0]["en"] == 4000 and d[0]["boy"] == 2600
    assert d[1]["en"] == 3000 and d[1]["boy"] == 2600
    assert d[2]["en"] == 4000
    assert d[3]["en"] == 3000


def test_oda_sinir():
    assert oda_ayarla(0, 3000, 2600, True)["hazir"] is False
    assert oda_ayarla(4000, 3000, 5000, True)["hazir"] is False
    assert oda_ayarla("x", 3000, 2600, True)["hazir"] is False


def test_oda_kapi_pencere_standart():
    o = oda_ayarla(4000, 3000, 2600, True)
    k = oda_eleman_ekle(o, {"tip": "kapi", "duvar_no": 1, "sol": 200})
    assert k["hazir"] is True
    kap = k["elemanlar"][0]
    assert kap["en"] == 900 and kap["boy"] == 2100 and kap["alt"] == 0
    assert kap["sinif"] == "void" and kap["cikinti_mm"] == 0
    p = oda_eleman_ekle(k, {"tip": "pencere", "duvar_no": 1, "sol": 1200})
    assert p["hazir"] is True
    pen = p["elemanlar"][1]
    assert pen["en"] == 1200 and pen["boy"] == 1400 and pen["alt"] == 900
    assert pen["sinif"] == "void" and pen["cikinti_mm"] == 0


def test_oda_kolon_kiris_ve_cakisma():
    o = oda_ayarla(4000, 3000, 2600, True)
    kol = oda_eleman_ekle(o, {"tip": "kolon", "duvar_no": 2, "sol": 0, "cikinti_mm": 300})
    assert kol["hazir"] is True
    assert kol["elemanlar"][0]["boy"] == 2600
    assert kol["elemanlar"][0]["en"] == 300
    assert kol["elemanlar"][0]["sinif"] == "protrusion" and kol["elemanlar"][0]["cikinti_mm"] == 300
    kir = oda_eleman_ekle(kol, {"tip": "kiris", "duvar_no": 2, "sol": 0, "cikinti_mm": 200})
    assert kir["hazir"] is False
    kir2 = oda_eleman_ekle(kol, {"tip": "kiris", "duvar_no": 2, "sol": 400, "cikinti_mm": 200})
    assert kir2["hazir"] is True
    assert kir2["elemanlar"][1]["alt"] == 2300
    assert kir2["elemanlar"][1]["boy"] == 300
    assert kir2["elemanlar"][1]["sinif"] == "protrusion"


def test_oda_yeni_standart_tipler():
    o = oda_ayarla(4000, 3000, 2600, True)
    r = oda_eleman_ekle(o, {"tip": "radiator", "duvar_no": 1, "sol": 200})
    assert r["hazir"] is True
    assert r["elemanlar"][0]["en"] == 1000 and r["elemanlar"][0]["boy"] == 600
    assert r["elemanlar"][0]["alt"] == 100 and r["elemanlar"][0]["sinif"] == "cephe"
    h = oda_eleman_ekle(r, {"tip": "hava", "duvar_no": 1, "sol": 1400})
    assert h["hazir"] is True
    assert h["elemanlar"][1]["alt"] == 2450
    s = oda_eleman_ekle(o, {"tip": "su", "duvar_no": 3, "sol": 100})
    assert s["hazir"] is True and s["elemanlar"][0]["alt"] == 500
    n = oda_eleman_ekle(o, {"tip": "nis", "duvar_no": 4, "sol": 200})
    assert n["hazir"] is True and n["elemanlar"][0]["sinif"] == "void"


def test_oda_priz_olcu_gecer_diger_duvar_ayri():
    o = oda_ayarla(4000, 3000, 2600, True)
    a = oda_eleman_ekle(o, {"tip": "priz", "duvar_no": 1, "sol": 100, "en": 100, "boy": 100, "alt": 400})
    assert a["elemanlar"][0]["en"] == 100 and a["elemanlar"][0]["alt"] == 400
    b = oda_eleman_ekle(a, {"tip": "priz", "duvar_no": 3, "sol": 100})
    assert b["hazir"] is True
    assert len(b["elemanlar"]) == 2
    c = oda_eleman_ekle(a, {"tip": "priz", "duvar_no": 1, "sol": 100, "en": 100, "boy": 100, "alt": 400})
    assert c["hazir"] is False
    assert oda_eleman_ekle(o, {"tip": "priz", "duvar_no": 9})["hazir"] is False


def test_oda_eleman_duvar_disi():
    o = oda_ayarla(2000, 2000, 2400, True)
    assert oda_eleman_ekle(o, {"tip": "kapi", "duvar_no": 1, "sol": 1500})["hazir"] is False


def test_void_cikinti_red_protrusion_zorunlu():
    o = oda_ayarla(4000, 3000, 2600, True)
    assert oda_eleman_ekle(o, {"tip": "kapi", "duvar_no": 1, "sol": 200, "cikinti_mm": 80})["hazir"] is False
    assert oda_eleman_ekle(o, {"tip": "kolon", "duvar_no": 1, "sol": 0})["hazir"] is False
    assert oda_eleman_ekle(o, {"tip": "kolon", "duvar_no": 1, "sol": 0, "cikinti_mm": 0})["hazir"] is False
    ok = oda_eleman_ekle(o, {"tip": "kolon", "duvar_no": 1, "sol": 0, "cikinti_mm": 300})
    assert ok["hazir"] is True and ok["elemanlar"][0]["sinif"] == "protrusion"
    pr = oda_eleman_ekle(o, {"tip": "priz", "duvar_no": 1, "sol": 100})
    assert pr["hazir"] is True and pr["elemanlar"][0]["sinif"] == "cephe"


def test_pimas_kose_modul_arka():
    o = oda_ayarla(4000, 3000, 2600, True)
    assert oda_eleman_ekle(o, {"tip": "pimas", "en": 100, "cikinti_mm": 80})["hazir"] is False
    assert oda_eleman_ekle(o, {"tip": "pimas", "kose": "1-2", "cikinti_mm": 80})["hazir"] is False
    p = oda_eleman_ekle(o, {"tip": "pimas", "kose": "1-2", "en": 100, "cikinti_mm": 80})
    assert p["hazir"] is True
    e = p["elemanlar"][0]
    assert e["sinif"] == "protrusion" and e["kose"] == "1-2"
    assert e["duvarlar"] == [1, 2] and e["modul_arka_mm"] == 80
    assert e["boy"] == 2600
    assert yasak_dilim_x(p["yasak_kutular"][0]) == (3900, 4000)
    assert yasak_dilim_x(p["yasak_kutular"][1]) == (0, 100)
    assert p["yasak_kutular"][0]["duvar_no"] == 1
    assert p["yasak_kutular"][1]["duvar_no"] == 2
    assert modul_arka_mm(p, 1) == 80 and modul_arka_mm(p, 2) == 80
    assert modul_arka_mm(p, 3) == 0
    hac = e["yasak_hacimler"]
    assert hac[0] == {"sol": 3900, "alt": 0, "en": 100, "boy": 80, "duvar_no": 1}
    kol = oda_eleman_ekle(p, {"tip": "kolon", "duvar_no": 2, "sol": 0, "cikinti_mm": 300})
    assert kol["hazir"] is False
    k4 = oda_eleman_ekle(o, {"tip": "pimas", "kose": "4-1", "en": 120, "cikinti_mm": 60})
    assert k4["hazir"] is True
    assert modul_arka_mm(k4, 4) == 60 and modul_arka_mm(k4, 1) == 60


def test_pah_ucgen_kare_disi_cakismaz():
    o = oda_ayarla(4000, 3000, 2600, True)
    u = pah_ucgen(o["oda"], (4, 1), 100)
    assert nokta_ucgende(20, 20, u) is True
    assert nokta_ucgende(70, 70, u) is False
    ic = kutu(10, 10, 8, 8)
    dis = kutu(70, 70, 20, 20)
    assert cakisiyor_ucgen_kutu(u, ic) is True
    assert cakisiyor_ucgen_kutu(u, dis) is False
    assert cakisiyor_mu(kutu(0, 0, 100, 100), dis) is True
    p = kose_pah_ekle(o, {"kose": "4-1", "bacak_mm": 100})
    assert p["hazir"] is True
    assert p["pahlar"][0]["bacak_mm"] == 100
    assert kose_pah_ekle(p, {"kose": "4-1", "bacak_mm": 80})["hazir"] is False
    pm = oda_eleman_ekle(o, {"tip": "pimas", "kose": "1-2", "en": 100, "cikinti_mm": 80})
    assert pm["hazir"] is True
    assert pm["elemanlar"][0]["pah_mm"] == 80
    assert len(pm["elemanlar"][0]["pah_ucgen"]) == 3
    assert kose_pah_ekle(pm, {"kose": "1-2", "bacak_mm": 80})["hazir"] is False


def test_oda_modul_yasak_ve_arka():
    o = oda_ayarla(4000, 3000, 2600, True)
    assert oda_modul_ekle(o, {"tip": "baza", "duvar_no": 1, "sol": 0, "alt": 0, "en": 600, "boy": 720})["hazir"] is False
    o = oda_hazirlik_onayla(o)
    assert o["hazirlik_onay"] is True
    kapali = oda_modul_ekle(o, {"tip": "baza", "duvar_no": 1, "sol": 0, "alt": 0, "en": 600, "boy": 720})
    assert kapali["hazir"] is False
    assert kapali["hatalar"] == ["Mobilya aşaması kapalı."]
    k = oda_eleman_ekle(o, {"tip": "kapi", "duvar_no": 1, "sol": 200})
    assert k["hazir"] is True
    assert oda_modul_ekle(k, {"tip": "baza", "duvar_no": 1, "sol": 1200, "alt": 0, "en": 600, "boy": 720})["hazir"] is False


def test_duvar_sec_olcu_yon_sag():
    o = oda_ayarla(4000, 3000, 2600, True)
    s = duvar_sec(o, 2)
    assert s["aktif_duvar"] == 2
    assert duvar_sec(o, 9)["hazir"] is False
    y = olcu_yon_ayarla(o, "sag")
    assert y["olcu_yon"] == "sag"
    k = oda_eleman_ekle(y, {"tip": "kapi", "duvar_no": 1, "sol": 200, "olcu_yon": "sag"})
    assert k["hazir"] is True
    assert k["elemanlar"][0]["sol"] == 2900
