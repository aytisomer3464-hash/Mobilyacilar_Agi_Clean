/* Zemin motoru (motor.py ikizi). Kaynak: zemin_giydir. Duvar / OCR bağlanmaz. */
(function (kok) {
  "use strict";

  var EN_MIN = 1, EN_MAKS = 12000, SNAP_MM = 10;
  var KENARLAR = { on: 1, sag: 1, arka: 1, sol: 1 };
  var EK_TIP = { cikinti: 1, oyuk: 1 };
  var TIPLER = { oda_zemin: 1, seramik: 1, kapi: 1, sifon: 1, yukselti: 1, mermer: 1 };
  var CUMLE = {
    en: "Oda en kaç?",
    boy: "Oda boy kaç?",
    ek_var: "Bu odada ek parça var mı?",
    ek_tip: "Çıkıntı ekle mi, oyuk/kiler çıkar mı?",
    ek_en: "Ek parça en (kenar boyunca) kaç?",
    ek_boy: "Ek parça boy (derinlik) kaç?",
    ek_kenar: "Hangi kenara yapışsın? (sürükle)",
    birak: "Zeminde ne var, bırak. Yoksa Uygula.",
    kilit: "Zemin mühürlü."
  };

  function tam(deger, alan) {
    var ham = String(deger == null ? "" : deger).trim().replace(",", ".");
    var parca = ham.split(".")[0];
    if (ham === "true" || ham === "false" || !/^[+-]?\d+$/.test(parca)) {
      throw new Error(alan + " tam sayı olmalı.");
    }
    return parseInt(parca, 10);
  }

  function kopya(durum) {
    if (!durum) return bos();
    return JSON.parse(JSON.stringify(durum));
  }

  function aralik(mm, lo, hi, alan) {
    if (mm < lo || mm > hi) throw new Error(alan + " " + lo + "–" + hi + " mm olmalı.");
    return mm;
  }

  function snap(mm) {
    return Math.round(mm / SNAP_MM) * SNAP_MM;
  }

  function bos() {
    return {
      asama: 1,
      tur: "en",
      kilit: false,
      hazir: false,
      cumle: CUMLE.en,
      soz: "",
      oda: { en: 0, boy: 0 },
      ekler: [],
      taslak: {},
      alan_mm2: 0,
      yerlesim: []
    };
  }

  function kabukTam(d) {
    return d.oda.en > 0 && d.oda.boy > 0;
  }

  function alanMm2(durum) {
    var o = durum.oda;
    var a = o.en * o.boy;
    var ekler = durum.ekler || [];
    var i, e, parca;
    for (i = 0; i < ekler.length; i++) {
      e = ekler[i];
      parca = (+e.en) * (+e.boy);
      a += e.tip === "cikinti" ? parca : -parca;
    }
    return a;
  }

  function alanYaz(d) {
    d.alan_mm2 = alanMm2(d);
    return d;
  }

  function kenarUzun(d, kenar) {
    return kenar === "on" || kenar === "arka" ? d.oda.en : d.oda.boy;
  }

  function kenarDerin(d, kenar) {
    return kenar === "on" || kenar === "arka" ? d.oda.boy : d.oda.en;
  }

  function ekKutu(durum, e) {
    var o = durum.oda;
    var kenar = e.kenar;
    var en = +e.en;
    var boy = +e.boy;
    var kay = +(e.kayma || 0);
    if (kenar === "sol") {
      return { sol: e.tip === "cikinti" ? -boy : 0, alt: kay, en: boy, boy: en };
    }
    if (kenar === "sag") {
      return { sol: e.tip === "cikinti" ? o.en : o.en - boy, alt: kay, en: boy, boy: en };
    }
    if (kenar === "on") {
      return { sol: kay, alt: e.tip === "cikinti" ? -boy : 0, en: en, boy: boy };
    }
    return { sol: kay, alt: e.tip === "cikinti" ? o.boy : o.boy - boy, en: en, boy: boy };
  }

  function siger(d, e) {
    if (e.en > kenarUzun(d, e.kenar)) return "Parça kenara sığmaz.";
    if (e.tip === "oyuk" && e.boy >= kenarDerin(d, e.kenar)) return "Oyuk odayı yer.";
    if (alanMm2({ oda: d.oda, ekler: d.ekler.concat([e]) }) <= 0) return "Zemin alanı sıfır olur.";
    return null;
  }

  function kaymaBirak(d, kenar, x, z) {
    var parca = parseInt((d.taslak && d.taslak.en) || 0, 10) || 0;
    var kay = (kenar === "on" || kenar === "arka") ? (x - Math.floor(parca / 2)) : (z - Math.floor(parca / 2));
    return kay > 0 ? kay : 0;
  }

  function yakinKenar(d, x, z) {
    var o = d.oda;
    var aday = { sol: Math.abs(x), sag: Math.abs(o.en - x), on: Math.abs(z), arka: Math.abs(o.boy - z) };
    var k, enIyi = "sol", enAz = aday.sol;
    for (k in aday) {
      if (aday[k] < enAz) {
        enAz = aday[k];
        enIyi = k;
      }
    }
    return enIyi;
  }

  function olcuYaz(durum, mm) {
    var d = kopya(durum);
    d.soz = "";
    if (d.kilit) {
      d.hazir = false;
      d.soz = "Zemin mühürlü.";
      return d;
    }
    try {
      if (d.tur === "en") {
        d.oda.en = aralik(tam(mm, "en"), EN_MIN, EN_MAKS, "en");
        d.tur = "boy";
        d.cumle = CUMLE.boy;
        d.hazir = true;
        return alanYaz(d);
      }
      if (d.tur === "boy") {
        d.oda.boy = aralik(tam(mm, "boy"), EN_MIN, EN_MAKS, "boy");
        d.tur = "ek_var";
        d.cumle = CUMLE.ek_var;
        d.hazir = true;
        return alanYaz(d);
      }
      if (d.tur === "ek_en") {
        d.taslak.en = aralik(tam(mm, "en"), EN_MIN, EN_MAKS, "en");
        d.tur = "ek_boy";
        d.cumle = CUMLE.ek_boy;
        d.hazir = true;
        return d;
      }
      if (d.tur === "ek_boy") {
        d.taslak.boy = aralik(tam(mm, "boy"), EN_MIN, EN_MAKS, "boy");
        d.tur = "ek_kenar";
        d.cumle = CUMLE.ek_kenar;
        d.hazir = true;
        return d;
      }
    } catch (e) {
      d.hazir = false;
      d.soz = String(e.message || e);
      return d;
    }
    d.hazir = false;
    d.soz = d.cumle;
    return d;
  }

  function odaDuzelt(durum, alan, mm) {
    var d = kopya(durum);
    d.soz = "";
    if (d.kilit) {
      d.hazir = false;
      d.soz = "Zemin mühürlü.";
      return d;
    }
    if (alan !== "en" && alan !== "boy") {
      d.hazir = false;
      d.soz = "Zeminde yalnız en ve boy.";
      return d;
    }
    try {
      d.oda[alan] = aralik(tam(mm, alan), EN_MIN, EN_MAKS, alan);
    } catch (e) {
      d.hazir = false;
      d.soz = String(e.message || e);
      return d;
    }
    d.hazir = true;
    return alanYaz(d);
  }

  function ekVarYaz(durum, varMi) {
    var d = kopya(durum);
    d.soz = "";
    if (d.kilit || d.tur !== "ek_var") {
      d.hazir = false;
      d.soz = "Şimdi ek parça sorusu.";
      return d;
    }
    d.taslak = {};
    if (varMi) {
      d.tur = "ek_tip";
      d.cumle = CUMLE.ek_tip;
    } else {
      d.tur = "birak";
      d.cumle = CUMLE.birak;
    }
    d.hazir = true;
    return d;
  }

  function ekTipYaz(durum, tip) {
    var d = kopya(durum);
    d.soz = "";
    if (d.kilit || d.tur !== "ek_tip") {
      d.hazir = false;
      d.soz = "Önce çıkıntı veya oyuk seç.";
      return d;
    }
    if (!EK_TIP[tip]) {
      d.hazir = false;
      d.soz = "Çıkıntı veya oyuk.";
      return d;
    }
    d.taslak = { tip: tip };
    d.tur = "ek_en";
    d.cumle = CUMLE.ek_en;
    d.hazir = true;
    return d;
  }

  function ekKenarYaz(durum, kenar, kayma) {
    var d = kopya(durum);
    d.soz = "";
    if (d.kilit || d.tur !== "ek_kenar") {
      d.hazir = false;
      d.soz = "Önce ek ölçü.";
      return d;
    }
    if (!KENARLAR[kenar]) {
      d.hazir = false;
      d.soz = "Kenar: on, sag, arka, sol.";
      return d;
    }
    var t = d.taslak && typeof d.taslak === "object" ? JSON.parse(JSON.stringify(d.taslak)) : {};
    if (!EK_TIP[t.tip] || !t.en || !t.boy) {
      d.hazir = false;
      d.soz = "Ek turu bitmedi.";
      return d;
    }
    t.kenar = kenar;
    var kay = 0;
    try {
      if (kayma != null && kayma !== "") kay = tam(kayma, "kayma");
    } catch (e) {
      d.hazir = false;
      d.soz = String(e.message || e);
      return d;
    }
    if (kay < 0) kay = 0;
    var uz = kenarUzun(d, kenar);
    if (t.en + kay > uz) kay = Math.max(0, uz - t.en);
    t.kayma = kay;
    var hata = siger(d, t);
    if (hata) {
      d.hazir = false;
      d.soz = hata;
      return d;
    }
    d.ekler.push(t);
    d.taslak = {};
    d.tur = "ek_var";
    d.cumle = CUMLE.ek_var;
    d.hazir = true;
    return alanYaz(d);
  }

  function ekYapistir(durum, x, z) {
    var d = kopya(durum);
    if (d.kilit || d.tur !== "ek_kenar") {
      d.hazir = false;
      d.soz = "Önce ek ölçü.";
      return d;
    }
    var kenar;
    try {
      kenar = yakinKenar(d, tam(x, "x"), tam(z, "z"));
    } catch (e) {
      d.hazir = false;
      d.soz = String(e.message || e);
      return d;
    }
    d.soz = kenar + " kenara yapıştı.";
    var kay = kaymaBirak(d, kenar, tam(x, "x"), tam(z, "z"));
    var son = ekKenarYaz(d, kenar, kay);
    if (son.hazir && d.soz) son.soz = d.soz;
    return son;
  }

  function kenarSec(x, z, en, boy) {
    var d0 = z;
    var d1 = en - x;
    var d2 = boy - z;
    var d3 = x;
    var m = Math.min(d0, d1, d2, d3);
    if (m === d0) return 0;
    if (m === d1) return 1;
    if (m === d2) return 2;
    return 3;
  }

  function say(v, def) {
    var n = parseFloat(v);
    return n > 0 ? n : def;
  }

  function hizala(durum, tip, x, z, eski) {
    var o = (durum && durum.oda) ? durum.oda : { en: 4000, boy: 3000 };
    var en = o.en > 0 ? o.en : 4000;
    var boy = o.boy > 0 ? o.boy : 3000;
    var u = (eski && eski.usta) ? eski.usta : {};
    var p = (eski && eski.p) ? eski.p : null;
    x = Math.max(0, Math.min(en, parseFloat(x) || 0));
    z = Math.max(0, Math.min(boy, parseFloat(z) || 0));
    var g = { tip: tip, x: x, z: z, en: 300, boy: 300, kenar: 0, p: {} };
    if (tip === "oda_zemin") {
      g.p.en = p ? say(p.en, en) : en;
      g.p.boy = p ? say(p.boy, boy) : boy;
      g.en = Math.min(g.p.en, en);
      g.boy = Math.min(g.p.boy, boy);
      g.x = Math.min(en - g.en, Math.max(0, Math.round((x - g.en / 2) / 10) * 10));
      g.z = Math.min(boy - g.boy, Math.max(0, Math.round((z - g.boy / 2) / 10) * 10));
      return g;
    }
    if (tip === "seramik") {
      g.p.en = p ? say(p.en, 300) : say(u.seramik && u.seramik.en, 300);
      g.p.boy = p ? say(p.boy, 300) : say(u.seramik && u.seramik.boy, 300);
      g.en = g.p.en;
      g.boy = g.p.boy;
      g.x = Math.floor(x / g.en) * g.en;
      g.z = Math.floor(z / g.boy) * g.boy;
      if (g.x + g.en > en) g.x = Math.max(0, en - g.en);
      if (g.z + g.boy > boy) g.z = Math.max(0, boy - g.boy);
      return g;
    }
    if (tip === "esik") {
      g.p.en = p && p.en > 0 ? say(p.en, 900) : say(u.kapi && u.kapi.en, 900);
      g.p.derinlik = p ? say(p.derinlik, 120) : 120;
      g.p.yukseklik = p && p.yukseklik > 0 ? say(p.yukseklik, 80) : say(u.kapi && u.kapi.yukseklik, 80);
      var es = Math.max(80, g.p.derinlik);
      g.kenar = kenarSec(x, z, en, boy);
      if (g.kenar === 0) {
        g.en = g.p.en;
        g.boy = es;
        g.z = 0;
        g.x = Math.min(en - g.en, Math.max(0, Math.round(x - g.en / 2)));
      } else if (g.kenar === 2) {
        g.en = g.p.en;
        g.boy = es;
        g.z = boy - g.boy;
        g.x = Math.min(en - g.en, Math.max(0, Math.round(x - g.en / 2)));
      } else if (g.kenar === 1) {
        g.en = es;
        g.boy = g.p.en;
        g.x = en - g.en;
        g.z = Math.min(boy - g.boy, Math.max(0, Math.round(z - g.boy / 2)));
      } else {
        g.en = es;
        g.boy = g.p.en;
        g.x = 0;
        g.z = Math.min(boy - g.boy, Math.max(0, Math.round(z - g.boy / 2)));
      }
      return g;
    }
    if (tip === "kapi") {
      g.p.en = p ? say(p.en, 900) : say(u.kapi && u.kapi.en, 900);
      g.p.boy = p ? say(p.boy, 2100) : say(u.kapi && u.kapi.boy, 2100);
      g.p.kasa = p ? say(p.kasa, 18) : say(u.kapi && u.kapi.kasa_kalinlik, 18);
      g.kenar = kenarSec(x, z, en, boy);
      if (g.kenar === 0) {
        g.en = g.p.en;
        g.boy = Math.max(80, g.p.kasa);
        g.z = 0;
        g.x = Math.min(en - g.en, Math.max(0, Math.round(x - g.en / 2)));
      } else if (g.kenar === 2) {
        g.en = g.p.en;
        g.boy = Math.max(80, g.p.kasa);
        g.z = boy - g.boy;
        g.x = Math.min(en - g.en, Math.max(0, Math.round(x - g.en / 2)));
      } else if (g.kenar === 1) {
        g.en = Math.max(80, g.p.kasa);
        g.boy = g.p.en;
        g.x = en - g.en;
        g.z = Math.min(boy - g.boy, Math.max(0, Math.round(z - g.boy / 2)));
      } else {
        g.en = Math.max(80, g.p.kasa);
        g.boy = g.p.en;
        g.x = 0;
        g.z = Math.min(boy - g.boy, Math.max(0, Math.round(z - g.boy / 2)));
      }
      return g;
    }
    if (tip === "sifon") {
      g.p.en = p ? say(p.en, 150) : say(u.yer_sifonu && u.yer_sifonu.en, 150);
      g.p.boy = p ? say(p.boy, 150) : say(u.yer_sifonu && u.yer_sifonu.boy, 150);
      g.en = g.p.en;
      g.boy = g.p.boy;
      g.x = Math.round((x - g.en / 2) / 50) * 50;
      g.z = Math.round((z - g.boy / 2) / 50) * 50;
      g.x = Math.min(en - g.en, Math.max(0, g.x));
      g.z = Math.min(boy - g.boy, Math.max(0, g.z));
      return g;
    }
    if (tip === "yukselti") {
      g.p.derinlik = p ? say(p.derinlik, 600) : say(u.dolap_alti && u.dolap_alti.derinlik, 600);
      g.p.yukseklik = p ? say(p.yukseklik, 20) : say(u.dolap_alti && u.dolap_alti.yukseklik, 20);
      g.kenar = kenarSec(x, z, en, boy);
      var duvarUz = (g.kenar === 0 || g.kenar === 2) ? en : boy;
      var eskiUz = p && p.uzunluk > 0 ? say(p.uzunluk, duvarUz) : 0;
      if (!eskiUz || eskiUz === en || eskiUz === boy) g.p.uzunluk = duvarUz;
      else g.p.uzunluk = eskiUz;
      var dd = g.p.derinlik;
      var uz = g.p.uzunluk;
      if (g.kenar === 0) {
        g.en = Math.min(uz, en);
        g.boy = Math.min(dd, boy);
        g.x = (g.en >= en) ? 0 : Math.min(en - g.en, Math.max(0, Math.round(x - g.en / 2)));
        g.z = 0;
      } else if (g.kenar === 2) {
        g.en = Math.min(uz, en);
        g.boy = Math.min(dd, boy);
        g.x = (g.en >= en) ? 0 : Math.min(en - g.en, Math.max(0, Math.round(x - g.en / 2)));
        g.z = boy - g.boy;
      } else if (g.kenar === 1) {
        g.en = Math.min(dd, en);
        g.boy = Math.min(uz, boy);
        g.x = en - g.en;
        g.z = (g.boy >= boy) ? 0 : Math.min(boy - g.boy, Math.max(0, Math.round(z - g.boy / 2)));
      } else {
        g.en = Math.min(dd, en);
        g.boy = Math.min(uz, boy);
        g.x = 0;
        g.z = (g.boy >= boy) ? 0 : Math.min(boy - g.boy, Math.max(0, Math.round(z - g.boy / 2)));
      }
      return g;
    }
    var ar = p ? say(p.ayak_arasi, 620) : say(u.ayakli_mermer && u.ayakli_mermer.ayak_arasi, 620);
    var kal = p ? say(p.ayak_kalinlik, 20) : say(u.ayakli_mermer && u.ayakli_mermer.ayak_kalinlik, 20);
    g.p.ayak_arasi = ar;
    g.p.ayak_kalinlik = kal;
    g.p.ayak_yukseklik = p ? say(p.ayak_yukseklik, 880) : say(u.ayakli_mermer && u.ayakli_mermer.ayak_yukseklik, 880);
    g.p.mermer_kalinlik = p ? say(p.mermer_kalinlik, 20) : say(u.ayakli_mermer && u.ayakli_mermer.mermer_kalinlik, 20);
    g.en = ar + 2 * kal;
    g.boy = ar + 2 * kal;
    g.x = Math.min(en - g.en, Math.max(0, Math.round((x - g.en / 2) / 10) * 10));
    g.z = Math.min(boy - g.boy, Math.max(0, Math.round((z - g.boy / 2) / 10) * 10));
    return g;
  }

  function nesneBirak(durum, tip, x, z) {
    var d = kopya(durum);
    d.soz = "";
    if (d.kilit) {
      d.hazir = false;
      d.soz = "Zemin mühürlü.";
      return d;
    }
    if (d.tur !== "birak" || !kabukTam(d)) {
      d.hazir = false;
      d.soz = "Önce oda ve ek parça turu.";
      return d;
    }
    if (!TIPLER[tip]) {
      d.hazir = false;
      d.soz = "Bu gereç zeminde yok.";
      return d;
    }
    var g;
    try {
      g = hizala(d, tip, x, z);
    } catch (e) {
      d.hazir = false;
      d.soz = String(e.message || e);
      return d;
    }
    var eskiX = tam(x, "x"), eskiZ = tam(z, "z");
    if (g.x !== eskiX || g.z !== eskiZ) d.soz = SNAP_MM + " mm kaydırdım.";
    if (tip === "oda_zemin") {
      d.yerlesim = d.yerlesim.filter(function (it) { return it.tip !== "oda_zemin"; });
    }
    d.yerlesim.push(g);
    d.hazir = true;
    return d;
  }

  function muhur(durum) {
    var d = kopya(durum);
    d.soz = "";
    if (!kabukTam(d) || d.tur !== "birak") {
      d.hazir = false;
      d.soz = "Oda turu bitmedi.";
      return d;
    }
    d.kilit = true;
    d.hazir = true;
    d.cumle = CUMLE.kilit;
    return alanYaz(d);
  }

  kok.ZeminMotor = {
    bos: bos,
    olcu_yaz: olcuYaz,
    oda_duzelt: odaDuzelt,
    ek_var_yaz: ekVarYaz,
    ek_tip_yaz: ekTipYaz,
    ek_kenar_yaz: ekKenarYaz,
    ek_yapistir: ekYapistir,
    ek_kutu: ekKutu,
    alan_mm2: alanMm2,
    nesne_birak: nesneBirak,
    hizala: hizala,
    muhur: muhur
  };
})(typeof window !== "undefined" ? window : this);
