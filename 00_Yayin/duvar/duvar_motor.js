/* Duvar AABB cep motoru. Python motor.py ile aynı kural. OCR/ebatlama yok. */
(function (kok) {
  "use strict";

  var BOY_MIN = 1, BOY_MAKS = 12000, YUK_MIN = 1, YUK_MAKS = 4000;
  var TIPLER = {
    priz: 1, su: 1, pencere: 1, kiris: 1, kolon: 1, gaz: 1,
    kapi: 1, radiator: 1, hava: 1, pimas: 1, sayac: 1, nis: 1
  };

  function tam(deger, alan) {
    var ham = String(deger == null ? "" : deger).trim().replace(",", ".");
    var parca = ham.split(".")[0];
    if (!/^[+-]?\d+$/.test(parca)) throw new Error(alan + " tam sayı olmalı.");
    return parseInt(parca, 10);
  }

  function kutu(sol, alt, en, boy) {
    return { sol: sol, alt: alt, en: en, boy: boy };
  }

  function cakisiyorMu(a, b) {
    return a.sol < b.sol + b.en && a.sol + a.en > b.sol && a.alt < b.alt + b.boy && a.alt + a.boy > b.alt;
  }

  function icindeMi(ic, dis) {
    return ic.sol >= dis.sol && ic.alt >= dis.alt &&
      ic.sol + ic.en <= dis.sol + dis.en && ic.alt + ic.boy <= dis.alt + dis.boy;
  }

  function sisir(k, pay) {
    var p = Math.max(0, pay);
    return kutu(k.sol - p, k.alt - p, k.en + 2 * p, k.boy + 2 * p);
  }

  function kes(k, duvar) {
    var sol = Math.max(k.sol, duvar.sol);
    var alt = Math.max(k.alt, duvar.alt);
    var sag = Math.min(k.sol + k.en, duvar.sol + duvar.en);
    var ust = Math.min(k.alt + k.boy, duvar.alt + duvar.boy);
    if (sag <= sol || ust <= alt) return null;
    return kutu(sol, alt, sag - sol, ust - alt);
  }

  function cevap(duvar, engeller, yasaklar, hatalar) {
    return {
      hazir: !!duvar && hatalar.length === 0,
      duvar: duvar ? { sol: duvar.sol, alt: duvar.alt, en: duvar.en, boy: duvar.boy } : null,
      engeller: engeller.slice(),
      yasak_kutular: yasaklar.slice(),
      hatalar: hatalar.slice()
    };
  }

  function bosDurum() {
    return cevap(null, [], [], ["Duvar yok."]);
  }

  function duvarAyarla(boyMm, yukMm) {
    var boy, yuk;
    try {
      boy = tam(boyMm, "Duvar boy");
      yuk = tam(yukMm, "Duvar yükseklik");
    } catch (h) {
      return cevap(null, [], [], [h.message]);
    }
    if (boy < BOY_MIN || boy > BOY_MAKS) return cevap(null, [], [], ["Duvar boy 1–12000 mm."]);
    if (yuk < YUK_MIN || yuk > YUK_MAKS) return cevap(null, [], [], ["Duvar yükseklik 1–4000 mm."]);
    return cevap(kutu(0, 0, boy, yuk), [], [], []);
  }

  function engelEkle(durum, engel) {
    var once = durum && typeof durum === "object" ? durum : bosDurum();
    var duvar = once.duvar;
    var engeller = (once.engeller || []).slice();
    var yasaklar = (once.yasak_kutular || []).slice();
    if (!duvar) return cevap(null, engeller, yasaklar, ["Duvar yok."]);
    if (!engel || typeof engel !== "object") return cevap(duvar, engeller, yasaklar, ["Engel yok."]);
    var tip = String(engel.tip || "").trim().toLowerCase();
    if (!TIPLER[tip]) return cevap(duvar, engeller, yasaklar, ["Engel tipi geçersiz."]);
    var ham, pay, cikinti;
    try {
      ham = kutu(tam(engel.sol, "Engel sol"), tam(engel.alt, "Engel alt"), tam(engel.en, "Engel en"), tam(engel.boy, "Engel boy"));
      pay = tam(engel.yasak_pay_mm == null ? 0 : engel.yasak_pay_mm, "Yasak pay");
      cikinti = tam(engel.cikinti_mm == null ? 0 : engel.cikinti_mm, "Çıkıntı");
    } catch (h) {
      return cevap(duvar, engeller, yasaklar, [h.message]);
    }
    if (ham.en <= 0 || ham.boy <= 0) return cevap(duvar, engeller, yasaklar, ["Engel en ve boy 0'dan büyük olmalı."]);
    if (pay < 0 || cikinti < 0) return cevap(duvar, engeller, yasaklar, ["Pay ve çıkıntı negatif olamaz."]);
    if (!icindeMi(ham, duvar)) return cevap(duvar, engeller, yasaklar, ["Engel duvar dışına taşar."]);
    var yasak = kes(sisir(ham, pay), duvar);
    if (!yasak) return cevap(duvar, engeller, yasaklar, ["Yasak kutu boş."]);
    for (var i = 0; i < yasaklar.length; i++) {
      if (cakisiyorMu(yasak, yasaklar[i])) return cevap(duvar, engeller, yasaklar, ["Yasak kutular çakışır."]);
    }
    var kim = engel.id;
    engeller.push({
      id: kim == null || kim === "" ? "e" + (engeller.length + 1) : kim,
      tip: tip,
      sol: ham.sol, alt: ham.alt, en: ham.en, boy: ham.boy,
      cikinti_mm: cikinti, yasak_pay_mm: pay
    });
    yasaklar.push(yasak);
    return cevap(duvar, engeller, yasaklar, []);
  }

  var STANDART = {
    kapi: { en: 900, boy: 2100, alt: 0, yasak_pay_mm: 0, sinif: "void" },
    pencere: { en: 1200, boy: 1400, alt: 900, yasak_pay_mm: 0, sinif: "void" },
    priz: { en: 80, boy: 80, alt: 300, yasak_pay_mm: 0, sinif: "cephe" },
    su: { en: 80, boy: 80, alt: 500, yasak_pay_mm: 0, sinif: "cephe" },
    gaz: { en: 80, boy: 80, alt: 300, yasak_pay_mm: 0, sinif: "cephe" },
    radiator: { en: 1000, boy: 600, alt: 100, yasak_pay_mm: 0, sinif: "cephe" },
    hava: { en: 300, boy: 150, alt: "tavan", yasak_pay_mm: 0, sinif: "cephe" },
    sayac: { en: 400, boy: 400, alt: 800, yasak_pay_mm: 0, sinif: "cephe" },
    nis: { en: 600, boy: 400, alt: 800, yasak_pay_mm: 0, sinif: "void" },
    kiris: { en: 1000, boy: 300, alt: "tavan", yasak_pay_mm: 0, sinif: "protrusion" },
    kolon: { en: 300, boy: "duvar", alt: 0, yasak_pay_mm: 0, sinif: "protrusion" },
    pimas: { en: 0, boy: "duvar", alt: 0, yasak_pay_mm: 0, sinif: "protrusion" }
  };
  var KOSE = { "1-2": [1, 2], "2-3": [2, 3], "3-4": [3, 4], "4-1": [4, 1] };

  function koseCift(kayit) {
    var ham = String((kayit && kayit.kose) || "").trim().replace(/ /g, "");
    return KOSE[ham] || null;
  }

  function pimasHacim(oda, kose, en, derinlik) {
    var oe = oda.en, ob = oda.boy, a = kose[0], b = kose[1];
    if (a === 1 && b === 2) return [
      Object.assign(kutu(oe - en, 0, en, derinlik), { duvar_no: 1 }),
      Object.assign(kutu(oe - derinlik, 0, derinlik, en), { duvar_no: 2 })
    ];
    if (a === 2 && b === 3) return [
      Object.assign(kutu(oe - derinlik, ob - en, derinlik, en), { duvar_no: 2 }),
      Object.assign(kutu(oe - en, ob - derinlik, en, derinlik), { duvar_no: 3 })
    ];
    if (a === 3 && b === 4) return [
      Object.assign(kutu(0, ob - derinlik, en, derinlik), { duvar_no: 3 }),
      Object.assign(kutu(0, ob - en, derinlik, en), { duvar_no: 4 })
    ];
    return [
      Object.assign(kutu(0, 0, derinlik, en), { duvar_no: 4 }),
      Object.assign(kutu(0, 0, en, derinlik), { duvar_no: 1 })
    ];
  }

  function modulArkaMm(durum, duvarNo) {
    var once = durum && typeof durum === "object" ? durum : {};
    var no;
    try { no = tam(duvarNo, "Duvar no"); } catch (e) { return 0; }
    var maks = 0;
    (once.elemanlar || []).forEach(function (e) {
      if (e.sinif !== "protrusion") return;
      var nos = e.duvarlar || [e.duvar_no];
      if (nos.indexOf(no) >= 0) maks = Math.max(maks, e.cikinti_mm || 0);
    });
    return maks;
  }

  function duvarBul(duvarlar, no) {
    for (var i = 0; i < duvarlar.length; i++) if (duvarlar[i].no === no) return duvarlar[i];
    return null;
  }

  function ptsUcgen(u) {
    return u.map(function (p) { return [p.x, p.y]; });
  }

  function ptsKutu(k) {
    return [[k.sol, k.alt], [k.sol + k.en, k.alt], [k.sol + k.en, k.alt + k.boy], [k.sol, k.alt + k.boy]];
  }

  function proj(pts, ax, ay) {
    var d = pts.map(function (p) { return p[0] * ax + p[1] * ay; });
    return [Math.min.apply(null, d), Math.max.apply(null, d)];
  }

  function kenarNormal(pts) {
    var n = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length];
      n.push([-(b[1] - a[1]), b[0] - a[0]]);
    }
    return n;
  }

  function ortusur(a, b, eksenler) {
    for (var i = 0; i < eksenler.length; i++) {
      var ax = eksenler[i][0], ay = eksenler[i][1];
      if (ax === 0 && ay === 0) continue;
      var pa = proj(a, ax, ay), pb = proj(b, ax, ay);
      if (!(pa[1] > pb[0] && pb[1] > pa[0])) return false;
    }
    return true;
  }

  function pahUcgen(oda, kose, bacak) {
    var oe = oda.en, ob = oda.boy, s = bacak, a = kose[0], b = kose[1], pts;
    if (a === 4 && b === 1) pts = [[0, 0], [s, 0], [0, s]];
    else if (a === 1 && b === 2) pts = [[oe, 0], [oe - s, 0], [oe, s]];
    else if (a === 2 && b === 3) pts = [[oe, ob], [oe - s, ob], [oe, ob - s]];
    else pts = [[0, ob], [s, ob], [0, ob - s]];
    return pts.map(function (p) { return { x: p[0], y: p[1] }; });
  }

  function noktaUcgende(x, y, ucgen) {
    var p = ptsUcgen(ucgen);
    var ax = p[0][0], ay = p[0][1];
    var v1x = p[1][0] - ax, v1y = p[1][1] - ay;
    var v2x = p[2][0] - ax, v2y = p[2][1] - ay;
    var den = v1x * v2y - v2x * v1y;
    if (den === 0) return false;
    var px = x - ax, py = y - ay;
    var u = (px * v2y - py * v2x) / den;
    var v = (py * v1x - px * v1y) / den;
    return u > 0 && v > 0 && (u + v) < 1;
  }

  function cakisiyorUcgenKutu(ucgen, k) {
    var t = ptsUcgen(ucgen), b = ptsKutu(k);
    return ortusur(t, b, [[1, 0], [0, 1]].concat(kenarNormal(t)));
  }

  function cakisiyorUcgenUcgen(a, b) {
    var pa = ptsUcgen(a), pb = ptsUcgen(b);
    return ortusur(pa, pb, kenarNormal(pa).concat(kenarNormal(pb)));
  }

  var CEVAP_META = { aktif_duvar: 1, olcu_yon: "sol", hazirlik_onay: false, zemin_kilit: false };

  function odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, hatalar, pahlar, moduller) {
    var a = parseInt(CEVAP_META.aktif_duvar, 10);
    if (a !== 1 && a !== 2 && a !== 3 && a !== 4) a = 1;
    var y = String(CEVAP_META.olcu_yon || "sol").toLowerCase();
    if (y !== "sol" && y !== "sag") y = "sol";
    return {
      hazir: !!oda && hatalar.length === 0,
      oda: oda ? { en: oda.en, boy: oda.boy, yukseklik: oda.yukseklik } : null,
      zemin: zemin ? kutu(zemin.sol, zemin.alt, zemin.en, zemin.boy) : null,
      duvarlar: duvarlar.slice(),
      elemanlar: elemanlar.slice(),
      yasak_kutular: yasaklar.slice(),
      pahlar: (pahlar || []).slice(),
      moduller: (moduller || []).slice(),
      aktif_duvar: a,
      olcu_yon: y,
      hazirlik_onay: !!CEVAP_META.hazirlik_onay,
      zemin_kilit: !!CEVAP_META.zemin_kilit,
      hatalar: hatalar.slice()
    };
  }

  function metaAl(once) {
    return {
      aktif_duvar: once && once.aktif_duvar ? once.aktif_duvar : 1,
      olcu_yon: once && once.olcu_yon ? once.olcu_yon : "sol",
      hazirlik_onay: !!(once && once.hazirlik_onay),
      zemin_kilit: !!(once && once.zemin_kilit)
    };
  }

  function withMeta(once, fn) {
    var eski = CEVAP_META;
    CEVAP_META = metaAl(once);
    try { return fn(); } finally { CEVAP_META = eski; }
  }

  function mm(kayit, ad, varsayilan, etiket) {
    if (kayit[ad] == null || kayit[ad] === "") return varsayilan;
    return tam(kayit[ad], etiket);
  }

  function odaAyarla(enMm, boyMm, yukMm, zeminKilit) {
    if (!zeminKilit) {
      CEVAP_META = { aktif_duvar: 1, olcu_yon: "sol", hazirlik_onay: false, zemin_kilit: false };
      return odaCevap(null, null, [], [], [], ["Önce zemin mühürle."]);
    }
    var en, boy, yuk;
    try {
      en = tam(enMm, "Oda en");
      boy = tam(boyMm, "Oda boy");
      yuk = tam(yukMm, "Oda yükseklik");
    } catch (h) {
      return odaCevap(null, null, [], [], [], [h.message]);
    }
    var hat = [];
    if (en < BOY_MIN || en > BOY_MAKS) hat.push("Oda en 1–12000 mm.");
    if (boy < BOY_MIN || boy > BOY_MAKS) hat.push("Oda boy 1–12000 mm.");
    if (yuk < YUK_MIN || yuk > YUK_MAKS) hat.push("Oda yükseklik 1–4000 mm.");
    if (hat.length) return odaCevap(null, null, [], [], [], hat);
    var duvarlar = [
      { no: 1, yon: "on", sol: 0, alt: 0, en: en, boy: yuk },
      { no: 2, yon: "sag", sol: 0, alt: 0, en: boy, boy: yuk },
      { no: 3, yon: "arka", sol: 0, alt: 0, en: en, boy: yuk },
      { no: 4, yon: "sol", sol: 0, alt: 0, en: boy, boy: yuk }
    ];
    CEVAP_META = { aktif_duvar: 1, olcu_yon: "sol", hazirlik_onay: false, zemin_kilit: true };
    return odaCevap({ en: en, boy: boy, yukseklik: yuk }, kutu(0, 0, en, boy), duvarlar, [], [], []);
  }

  function odaElemanEkle(durum, kayit) {
    var once = durum && typeof durum === "object" ? durum : {};
    return withMeta(once, function () {
    var oda = once.oda;
    var zemin = once.zemin;
    var duvarlar = (once.duvarlar || []).slice();
    var elemanlar = (once.elemanlar || []).slice();
    var yasaklar = (once.yasak_kutular || []).slice();
    var pahlar = (once.pahlar || []).slice();
    var moduller = (once.moduller || []).slice();
    if (!CEVAP_META.zemin_kilit) return odaCevap(oda || null, zemin, duvarlar, elemanlar, yasaklar, ["Önce zemin mühürle."], pahlar, moduller);
    if (!oda || !duvarlar.length) return odaCevap(null, null, [], [], [], ["Oda yok."], pahlar, moduller);
    if (!kayit) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Eleman yok."], pahlar, moduller);
    var tip = String(kayit.tip || "").trim().toLowerCase();
    if (!STANDART[tip]) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Eleman tipi geçersiz."], pahlar, moduller);
    if (tip === "pimas") return pimasEkle(oda, zemin, duvarlar, elemanlar, yasaklar, kayit, pahlar, moduller);
    var no;
    try { no = tam(kayit.duvar_no, "Duvar no"); } catch (h) {
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [h.message]);
    }
    var duvar = null;
    for (var i = 0; i < duvarlar.length; i++) if (duvarlar[i].no === no) duvar = duvarlar[i];
    if (!duvar) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Duvar no 1–4."]);
    var std = STANDART[tip];
    var cephe = kutu(0, 0, duvar.en, duvar.boy);
    var sol, en, boy, alt, pay, sinif, cikinti;
    try {
      sol = mm(kayit, "sol", 0, "Sol");
      en = mm(kayit, "en", std.en, "En");
      if (std.boy === "duvar") boy = (kayit.boy == null || kayit.boy === "") ? duvar.boy : tam(kayit.boy, "Boy");
      else boy = mm(kayit, "boy", std.boy, "Boy");
      if (std.alt === "tavan") alt = (kayit.alt == null || kayit.alt === "") ? duvar.boy - boy : tam(kayit.alt, "Alt");
      else alt = mm(kayit, "alt", std.alt, "Alt");
      pay = mm(kayit, "yasak_pay_mm", std.yasak_pay_mm, "Yasak pay");
      sinif = std.sinif;
      if (sinif === "void") {
        if (kayit.cikinti_mm != null && kayit.cikinti_mm !== "" && kayit.cikinti_mm !== 0 && kayit.cikinti_mm !== "0") {
          cikinti = tam(kayit.cikinti_mm, "Çıkıntı");
          if (cikinti !== 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Void çıkıntı almaz."]);
        }
        cikinti = 0;
      } else if (sinif === "protrusion") {
        if (kayit.cikinti_mm == null || kayit.cikinti_mm === "") {
          return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı mm zorunlu."]);
        }
        cikinti = tam(kayit.cikinti_mm, "Çıkıntı");
        if (cikinti <= 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı 0'dan büyük olmalı."]);
      } else {
        cikinti = (kayit.cikinti_mm == null || kayit.cikinti_mm === "") ? 0 : tam(kayit.cikinti_mm, "Çıkıntı");
        if (cikinti < 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı negatif olamaz."]);
      }
    } catch (h2) {
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [h2.message]);
    }
    if (en <= 0 || boy <= 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["En ve boy 0'dan büyük olmalı."]);
    if (pay < 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pay negatif olamaz."]);
    var olcu = String(kayit.olcu_yon || "").trim().toLowerCase();
    if (olcu === "sag") sol = duvar.en - sol - en;
    var ham = kutu(sol, alt, en, boy);
    if (!icindeMi(ham, cephe)) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Eleman duvar dışına taşar."]);
    var yasak = kes(sisir(ham, pay), cephe);
    if (!yasak) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutu boş."]);
    yasak.duvar_no = no;
    for (var j = 0; j < yasaklar.length; j++) {
      if (yasaklar[j].duvar_no === no && cakisiyorMu(yasak, yasaklar[j])) {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutular çakışır."]);
      }
    }
    elemanlar.push({
      id: "a" + (elemanlar.length + 1), duvar_no: no, tip: tip, sinif: sinif,
      sol: sol, alt: alt, en: en, boy: boy, cikinti_mm: cikinti, yasak_pay_mm: pay, duvarlar: [no]
    });
    yasaklar.push(yasak);
    return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, moduller);
    });
  }

  function pimasEkle(oda, zemin, duvarlar, elemanlar, yasaklar, kayit, pahlar, moduller) {
    pahlar = pahlar || [];
    moduller = moduller || [];
    var kose = koseCift(kayit);
    if (!kose) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Köşe 1-2, 2-3, 3-4 veya 4-1."], pahlar);
    var noA = kose[0], noB = kose[1];
    var duvarA = duvarBul(duvarlar, noA);
    var duvarB = duvarBul(duvarlar, noB);
    if (!duvarA || !duvarB) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Köşe duvarı yok."]);
    var en, cikinti, boy, alt, pay, pah, solA, solB;
    try {
      if (kayit.en == null || kayit.en === "") return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pimaş en zorunlu."]);
      en = tam(kayit.en, "En");
      if (kayit.cikinti_mm == null || kayit.cikinti_mm === "") return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı mm zorunlu."]);
      cikinti = tam(kayit.cikinti_mm, "Çıkıntı");
      boy = (kayit.boy == null || kayit.boy === "") ? duvarA.boy : tam(kayit.boy, "Boy");
      alt = (kayit.alt == null || kayit.alt === "") ? 0 : tam(kayit.alt, "Alt");
      pay = mm(kayit, "yasak_pay_mm", 0, "Yasak pay");
      pah = (kayit.pah_mm == null || kayit.pah_mm === "") ? Math.min(en, cikinti) : tam(kayit.pah_mm, "Pah");
    } catch (h) {
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [h.message]);
    }
    if (en <= 0 || boy <= 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["En ve boy 0'dan büyük olmalı."]);
    if (cikinti <= 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Çıkıntı 0'dan büyük olmalı."]);
    if (pay < 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pay negatif olamaz."], pahlar);
    if (pah < 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah negatif olamaz."], pahlar);
    solA = duvarA.en - en;
    solB = 0;
    if (solA < 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pimaş duvar dışına taşar."]);
    var cepheA = kutu(0, 0, duvarA.en, duvarA.boy);
    var cepheB = kutu(0, 0, duvarB.en, duvarB.boy);
    var hamA = kutu(solA, alt, en, boy);
    var hamB = kutu(solB, alt, en, boy);
    if (!icindeMi(hamA, cepheA) || !icindeMi(hamB, cepheB)) {
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pimaş duvar dışına taşar."]);
    }
    var yasakA = kes(sisir(hamA, pay), cepheA);
    var yasakB = kes(sisir(hamB, pay), cepheB);
    if (!yasakA || !yasakB) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutu boş."]);
    yasakA.duvar_no = noA;
    yasakB.duvar_no = noB;
    for (var j = 0; j < yasaklar.length; j++) {
      if (yasaklar[j].duvar_no === noA && cakisiyorMu(yasakA, yasaklar[j])) {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutular çakışır."]);
      }
      if (yasaklar[j].duvar_no === noB && cakisiyorMu(yasakB, yasaklar[j])) {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Yasak kutular çakışır."]);
      }
    }
    var ucgen = pah > 0 ? pahUcgen(oda, kose, pah) : [];
    if (ucgen.length) {
      if (pah > oda.en || pah > oda.boy) {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah oda dışına taşar."], pahlar);
      }
      for (var pi = 0; pi < pahlar.length; pi++) {
        if (cakisiyorUcgenUcgen(ucgen, pahlar[pi].ucgen)) {
          return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah çakışır."], pahlar);
        }
      }
    }
    elemanlar.push({
      id: "a" + (elemanlar.length + 1), duvar_no: noA, duvarlar: [noA, noB],
      kose: noA + "-" + noB, tip: "pimas", sinif: "protrusion",
      sol: solA, alt: alt, en: en, boy: boy, cikinti_mm: cikinti, yasak_pay_mm: pay,
      yasak_hacimler: pimasHacim(oda, kose, en, cikinti), modul_arka_mm: cikinti,
      pah_mm: pah, pah_ucgen: ucgen
    });
    yasaklar.push(yasakA, yasakB);
    var yeniPah = pahlar.slice();
    if (ucgen.length) yeniPah.push({ kose: noA + "-" + noB, bacak_mm: pah, ucgen: ucgen });
    return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], yeniPah, moduller);
  }

  function kosePahEkle(durum, kayit) {
    var once = durum && typeof durum === "object" ? durum : {};
    return withMeta(once, function () {
    var oda = once.oda, zemin = once.zemin;
    var duvarlar = (once.duvarlar || []).slice();
    var elemanlar = (once.elemanlar || []).slice();
    var yasaklar = (once.yasak_kutular || []).slice();
    var pahlar = (once.pahlar || []).slice();
    var moduller = (once.moduller || []).slice();
    if (!CEVAP_META.zemin_kilit) return odaCevap(oda || null, zemin, duvarlar, elemanlar, yasaklar, ["Önce zemin mühürle."], pahlar, moduller);
    if (!oda || !duvarlar.length) return odaCevap(null, null, [], [], [], ["Oda yok."], pahlar, moduller);
    if (!kayit) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah yok."], pahlar);
    var kose = koseCift(kayit);
    if (!kose) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Köşe 1-2, 2-3, 3-4 veya 4-1."], pahlar);
    var bacak;
    try {
      var ham = kayit.bacak_mm != null && kayit.bacak_mm !== "" ? kayit.bacak_mm : kayit.pah_mm;
      if (ham == null || ham === "") return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah mm zorunlu."], pahlar);
      bacak = tam(ham, "Pah");
    } catch (h) {
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [h.message], pahlar);
    }
    if (bacak <= 0) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah 0'dan büyük olmalı."], pahlar);
    if (bacak > oda.en || bacak > oda.boy) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah oda dışına taşar."], pahlar);
    var kim = kose[0] + "-" + kose[1];
    for (var i = 0; i < pahlar.length; i++) {
      if (pahlar[i].kose === kim) return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah çakışır."], pahlar);
    }
    var ucgen = pahUcgen(oda, kose, bacak);
    for (var j = 0; j < pahlar.length; j++) {
      if (cakisiyorUcgenUcgen(ucgen, pahlar[j].ucgen)) {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Pah çakışır."], pahlar);
      }
    }
    pahlar.push({ kose: kim, bacak_mm: bacak, ucgen: ucgen });
    return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, moduller);
    });
  }

  var MODUL_TIPLER = { baza: 1, asma: 1, boy: 1 };

  function odaModulEkle(durum, kayit) {
    var once = durum && typeof durum === "object" ? durum : {};
    return withMeta(once, function () {
    var oda = once.oda, zemin = once.zemin;
    var duvarlar = (once.duvarlar || []).slice();
    var elemanlar = (once.elemanlar || []).slice();
    var yasaklar = (once.yasak_kutular || []).slice();
    var pahlar = (once.pahlar || []).slice();
    var moduller = (once.moduller || []).slice();
    return odaCevap(oda || null, zemin, duvarlar, elemanlar, yasaklar, ["Mobilya aşaması kapalı."], pahlar, moduller);
    });
  }

  function duvarSec(durum, duvarNo) {
    var once = durum && typeof durum === "object" ? durum : {};
    return withMeta(once, function () {
      var oda = once.oda, zemin = once.zemin;
      var duvarlar = (once.duvarlar || []).slice();
      var elemanlar = (once.elemanlar || []).slice();
      var yasaklar = (once.yasak_kutular || []).slice();
      var pahlar = (once.pahlar || []).slice();
      var moduller = (once.moduller || []).slice();
      if (!CEVAP_META.zemin_kilit) return odaCevap(oda || null, zemin, duvarlar, elemanlar, yasaklar, ["Önce zemin mühürle."], pahlar, moduller);
      if (!oda || !duvarlar.length) return odaCevap(null, null, [], [], [], ["Oda yok."], pahlar, moduller);
      var no;
      try { no = tam(duvarNo, "Duvar no"); } catch (h) {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [h.message], pahlar, moduller);
      }
      if (no !== 1 && no !== 2 && no !== 3 && no !== 4) {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Duvar no 1–4."], pahlar, moduller);
      }
      CEVAP_META.aktif_duvar = no;
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, moduller);
    });
  }

  function olcuYonAyarla(durum, yon) {
    var once = durum && typeof durum === "object" ? durum : {};
    return withMeta(once, function () {
      var oda = once.oda, zemin = once.zemin;
      var duvarlar = (once.duvarlar || []).slice();
      var elemanlar = (once.elemanlar || []).slice();
      var yasaklar = (once.yasak_kutular || []).slice();
      var pahlar = (once.pahlar || []).slice();
      var moduller = (once.moduller || []).slice();
      if (!CEVAP_META.zemin_kilit) return odaCevap(oda || null, zemin, duvarlar, elemanlar, yasaklar, ["Önce zemin mühürle."], pahlar, moduller);
      if (!oda || !duvarlar.length) return odaCevap(null, null, [], [], [], ["Oda yok."], pahlar, moduller);
      var ham = String(yon || "").trim().toLowerCase();
      if (ham !== "sol" && ham !== "sag") {
        return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, ["Ölçü yönü sol veya sağ."], pahlar, moduller);
      }
      CEVAP_META.olcu_yon = ham;
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, moduller);
    });
  }

  function odaHazirlikOnayla(durum) {
    var once = durum && typeof durum === "object" ? durum : {};
    return withMeta(once, function () {
      var oda = once.oda, zemin = once.zemin;
      var duvarlar = (once.duvarlar || []).slice();
      var elemanlar = (once.elemanlar || []).slice();
      var yasaklar = (once.yasak_kutular || []).slice();
      var pahlar = (once.pahlar || []).slice();
      if (!CEVAP_META.zemin_kilit) return odaCevap(oda || null, zemin, duvarlar, elemanlar, yasaklar, ["Önce zemin mühürle."], pahlar, []);
      if (!oda || !duvarlar.length) return odaCevap(null, null, [], [], [], ["Oda yok."]);
      CEVAP_META.hazirlik_onay = true;
      return odaCevap(oda, zemin, duvarlar, elemanlar, yasaklar, [], pahlar, []);
    });
  }

  kok.DuvarMotor = {
    duvarAyarla: duvarAyarla,
    engelEkle: engelEkle,
    bosDurum: bosDurum,
    odaAyarla: odaAyarla,
    odaElemanEkle: odaElemanEkle,
    odaModulEkle: odaModulEkle,
    duvarSec: duvarSec,
    olcuYonAyarla: olcuYonAyarla,
    odaHazirlikOnayla: odaHazirlikOnayla,
    modulArkaMm: modulArkaMm,
    kosePahEkle: kosePahEkle,
    pahUcgen: pahUcgen,
    noktaUcgende: noktaUcgende,
    cakisiyorUcgenKutu: cakisiyorUcgenKutu
  };
})(typeof window !== "undefined" ? window : this);
