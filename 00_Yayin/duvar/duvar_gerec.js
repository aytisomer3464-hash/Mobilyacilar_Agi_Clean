(function () {
  var KASA_ANAHTAR = "magi_atolye_kasa";
  var PROFIL_ANAHTAR = "magi_usta_profil";

  var LISTE = [
    { tip: "kapi", ad: "Kapı", alan: ["en", "boy", "alt"] },
    { tip: "pencere", ad: "Pencere", alan: ["en", "boy", "alt"] },
    { tip: "priz", ad: "Priz", alan: ["en", "boy", "alt"] },
    { tip: "su", ad: "Su", alan: ["en", "boy", "alt"] },
    { tip: "gaz", ad: "Gaz", alan: ["en", "boy", "alt"] },
    { tip: "radiator", ad: "Radyatör", alan: ["en", "boy", "alt", "cikinti"] },
    { tip: "hava", ad: "Hava", alan: ["en", "boy", "alt"] },
    { tip: "pimas", ad: "Pimaş", alan: ["en", "cikinti", "kose"] },
    { tip: "sayac", ad: "Sayaç", alan: ["en", "boy", "alt"] },
    { tip: "nis", ad: "Niş", alan: ["en", "boy", "alt", "cikinti"] },
    { tip: "kiris", ad: "Kiriş", alan: ["en", "boy", "cikinti"] },
    { tip: "kolon", ad: "Kolon", alan: ["en", "cikinti"] }
  ];

  var STANDART = {
    kapi: { en: "900", boy: "2100", alt: "0" },
    pencere: { en: "1200", boy: "1400", alt: "900" },
    priz: { en: "80", boy: "80", alt: "300" },
    su: { en: "80", boy: "80", alt: "500" },
    gaz: { en: "80", boy: "80", alt: "300" },
    radiator: { en: "1000", boy: "600", alt: "100", cikinti: "105" },
    hava: { en: "300", boy: "150", alt: "2200" },
    pimas: { en: "150", cikinti: "150", kose: "1-2" },
    sayac: { en: "400", boy: "400", alt: "800" },
    nis: { en: "600", boy: "400", alt: "800", cikinti: "150" },
    kiris: { en: "1000", boy: "300", cikinti: "300" },
    kolon: { en: "300", cikinti: "300" }
  };

  var ALAN_AD = {
    en: "En",
    boy: "Boy",
    alt: "Yerden",
    cikinti: "Derinlik",
    kose: "Köşe"
  };

  function profilOku() {
    try {
      var ham = JSON.parse(localStorage.getItem(PROFIL_ANAHTAR) || "null");
      if (!ham || typeof ham !== "object") return { ad: "", dukkan: "", telefon: "" };
      return ham;
    } catch (e) {
      return { ad: "", dukkan: "", telefon: "" };
    }
  }

  function ustaAnahtar(p) {
    var t = String((p && p.telefon) || "").replace(/\D/g, "");
    if (t) return t;
    var ad = String((p && p.ad) || "").trim().toLowerCase();
    return ad || "varsayilan";
  }

  function kasaOku() {
    try {
      var ham = JSON.parse(localStorage.getItem(KASA_ANAHTAR) || "null");
      if (!ham || typeof ham !== "object") return { ustalar: {} };
      if (!ham.ustalar || typeof ham.ustalar !== "object") ham.ustalar = {};
      return ham;
    } catch (e) {
      return { ustalar: {} };
    }
  }

  function kasaYaz(kasa) {
    localStorage.setItem(KASA_ANAHTAR, JSON.stringify(kasa));
  }

  function ustaKasasi() {
    var p = profilOku();
    var kasa = kasaOku();
    var ana = ustaAnahtar(p);
    var u = kasa.ustalar[ana];
    if (!u || typeof u !== "object") {
      u = { atolye: "", usta: "", musteriler: [] };
      kasa.ustalar[ana] = u;
    }
    if (!u.duvar_gerec || typeof u.duvar_gerec !== "object") u.duvar_gerec = {};
    return { kasa: kasa, u: u };
  }

  function yaz(metin) {
    var n = document.getElementById("durum");
    if (n) n.textContent = metin || "";
  }

  function idYap(tip, alan) {
    return tip + "_" + alan;
  }

  function formHtml(kalem) {
    var s = "";
    var i;
    var cift = [];
    for (i = 0; i < kalem.alan.length; i++) {
      var a = kalem.alan[i];
      if (a === "kose") {
        s += '<label>' + ALAN_AD.kose +
          '<select id="' + idYap(kalem.tip, "kose") + '">' +
          '<option value="1-2">1-2</option>' +
          '<option value="2-3">2-3</option>' +
          '<option value="3-4">3-4</option>' +
          '<option value="4-1">4-1</option>' +
          "</select></label>";
      } else if (a === "en" || a === "boy") {
        cift.push(a);
      } else {
        s += '<label>' + ALAN_AD[a] + ' (<span class="birimAd">mm</span>)' +
          '<input id="' + idYap(kalem.tip, a) + '" type="number" min="0" step="any" inputmode="decimal"></label>';
      }
    }
    if (cift.length) {
      var kutu = '<div class="sira">';
      for (i = 0; i < cift.length; i++) {
        kutu += '<label>' + ALAN_AD[cift[i]] + ' (<span class="birimAd">mm</span>)' +
          '<input id="' + idYap(kalem.tip, cift[i]) + '" type="number" min="0" step="any" inputmode="decimal"></label>';
      }
      kutu += "</div>";
      s = kutu + s;
    }
    s += '<button type="button" data-kaydet="' + kalem.tip + '">Kaydet</button>';
    return s;
  }

  function listeKur() {
    var kok = document.getElementById("gerecListe");
    var html = "";
    var i;
    for (i = 0; i < LISTE.length; i++) {
      var k = LISTE[i];
      html += '<div class="kalem" data-tip="' + k.tip + '">' +
        '<button type="button" class="baslik" data-ac="' + k.tip + '">' + k.ad + "</button>" +
        '<div class="form">' + formHtml(k) + "</div></div>";
    }
    kok.innerHTML = html;
  }

  function kalemBul(tip) {
    var i;
    for (i = 0; i < LISTE.length; i++) if (LISTE[i].tip === tip) return LISTE[i];
    return null;
  }

  function doldurTip(tip) {
    var O = window.MagiOlcu;
    var kalem = kalemBul(tip);
    if (!kalem) return;
    var kayit = (ustaKasasi().u.duvar_gerec || {})[tip] || {};
    var std = STANDART[tip] || {};
    var i;
    for (i = 0; i < kalem.alan.length; i++) {
      var a = kalem.alan[i];
      var el = document.getElementById(idYap(tip, a));
      if (!el) continue;
      var v = kayit[a] != null && kayit[a] !== "" ? kayit[a] : std[a];
      el.value = a === "kose" ? (v || "1-2") : O.goster(v);
    }
  }

  function acKapat(tip) {
    var kutular = document.querySelectorAll(".kalem");
    var i;
    for (i = 0; i < kutular.length; i++) {
      var k = kutular[i];
      var bu = k.getAttribute("data-tip") === tip && !k.classList.contains("acik");
      k.classList.toggle("acik", bu);
      var btn = k.querySelector(".baslik");
      if (btn) btn.classList.toggle("acik", bu);
    }
    doldurTip(tip);
    window.MagiOlcu.etiketYaz();
    yaz("");
  }

  function kaydet(tip) {
    var O = window.MagiOlcu;
    var kalem = kalemBul(tip);
    if (!kalem) return;
    var paket = ustaKasasi();
    var kayit = {};
    var i;
    for (i = 0; i < kalem.alan.length; i++) {
      var a = kalem.alan[i];
      var el = document.getElementById(idYap(tip, a));
      if (!el) continue;
      if (a === "kose") kayit[a] = el.value;
      else kayit[a] = O.mmAl(el.value);
    }
    paket.u.duvar_gerec[tip] = kayit;
    kasaYaz(paket.kasa);
    yaz(kalem.ad + " kaydedildi.");
  }

  listeKur();
  window.MagiOlcu.etiketYaz();

  document.getElementById("geriBtn").addEventListener("click", function () {
    window.location.href = "./index.html";
  });
  document.getElementById("gerecListe").addEventListener("click", function (e) {
    var ac = e.target.closest("[data-ac]");
    if (ac) {
      acKapat(ac.getAttribute("data-ac"));
      return;
    }
    var kay = e.target.closest("[data-kaydet]");
    if (kay) kaydet(kay.getAttribute("data-kaydet"));
  });
})();
