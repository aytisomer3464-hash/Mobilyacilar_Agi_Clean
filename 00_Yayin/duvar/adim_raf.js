(function () {
  var IKO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="14" rx="2"/></svg>';
  var kaydir = null;
  var dol = null;
  var tmr = null;
  var inceTmr = null;
  var sonAnahtar = "";
  var sonIdler = [];
  var sonSimdi = "";
  var sonAd = "";
  var sonDetay = {};
  var dokun = null;

  function azalt() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) {
      return false;
    }
  }

  function ikon(tur) {
    if (tur === "is") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3"/><path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6"/></svg>';
    if (tur === "esik") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="3" width="8" height="18" rx="1"/></svg>';
    if (tur === "kilit" || tur === "muhur") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
    if (tur === "mobilya") return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10h16v10H4z"/><path d="M4 10V7h16v3"/></svg>';
    return IKO;
  }

  function kartHtml(k) {
    var cls = "adimRafKart " + (k.durum || "sirada");
    if (k.yapi) cls += " yapi";
    var deger = k.deger ? '<span class="deger">' + k.deger + "</span>" : "";
    var rozet = k.durum === "bitti" ? " ✓" : (k.durum === "kilitli" ? " 🔒" : "");
    return '<div class="' + cls + '" data-id="' + k.id + '" data-durum="' + (k.durum || "sirada") + '">' + ikon(k.ikon || k.id) + '<span class="ad">' + k.ad + rozet + "</span>" + deger + "</div>";
  }

  function adimKim(adim, aktifDuvar) {
    var a = String(adim || "");
    if (a === "en") return "en";
    if (a === "boy") return "boy";
    if (a === "kapi_surukle") return "esik";
    if (a === "oda_tip") return "oda";
    if (a.indexOf("gonye") === 0) return "gonye";
    if (a.indexOf("ek_") === 0) return "ek";
    if (a === "yukselti" || a === "yukselti_surukle") return "yukselti";
    if (a === "sifon" || a === "sifon_surukle") return "sifon";
    if (a === "birak") return "birak";
    if (a === "mutfak_sekil") return "sekil";
    if (a === "mutfak_duvar") return "duvarlar";
    if (a === "duvar_kilit") return "kilit";
    if (a.indexOf("duvar") === 0) return "duvar-" + (aktifDuvar || "");
    return a;
  }

  function durumlar(d) {
    var anket = d.anket || {};
    var adim = d.soruAdim || "en";
    var sayfa = d.motorSayfa || "zemin";
    var zKilit = !!d.zeminKilit;
    var dKilit = !!d.duvarKilit;
    var simdi = adimKim(adim, d.aktifDuvar);
    if (zKilit && sayfa === "zemin") simdi = "sifon";
    if (dKilit) simdi = "kilit";
    var liste = [];
    var isAd = d.isAdi || "İş";
    var mus = d.musteri || "";
    liste.push({ id: "is", yapi: true, ikon: "is", ad: mus || isAd, deger: mus ? isAd : "", durum: "yapi" });

    function ekle(id, ad, deger, ikon) {
      liste.push({ id: id, ad: ad, deger: deger || "", ikon: ikon || id });
    }
    ekle("en", "En", d.enYazi || "");
    ekle("boy", "Boy", d.boyYazi || "");
    ekle("esik", "Eşik", "", "esik");
    ekle("oda", "Oda", anket.oda === "kup" ? "Küp" : (anket.oda === "gonyesiz" ? "Gönye" : (anket.oda || "")));
    if (anket.oda === "gonyesiz") ekle("gonye", "Gönye", "");
    ekle("yukselti", "Yükselti", anket.yukselti === true ? "Var" : (anket.yukselti === false ? "Yok" : ""));
    ekle("sifon", "Sifon", anket.sifon === true ? "Var" : (anket.sifon === false ? "Yok" : ""));
    ekle("sekil", "Şekil", d.mutfakSekil || "");
    ekle("duvarlar", "Duvarlar", d.duvarlar && d.duvarlar.length ? String(d.duvarlar.length) : "");
    var i, dw;
    for (i = 0; i < (d.duvarlar || []).length; i++) {
      dw = d.duvarlar[i];
      ekle("duvar-" + dw.no, dw.ad || ("D" + dw.no), dw.n ? String(dw.n) : "", "oda");
    }
    ekle("kilit", "Kilit", dKilit ? "Kilit" : "", "kilit");
    ekle("mobilya", "Mobilya", "Motor sırada", "mobilya");

    if (simdi === "muhur" || simdi === "birak") simdi = "sifon";
    if (simdi === "ek") simdi = "oda";
    var simdiIx = -1;
    for (i = 0; i < liste.length; i++) {
      if (liste[i].id === simdi) simdiIx = i;
    }
    if (simdiIx < 0) {
      if (sayfa === "duvar") {
        for (i = 0; i < liste.length; i++) {
          if (liste[i].id === "sekil") simdiIx = i;
        }
      }
      if (simdiIx < 0) simdiIx = 1;
    }
    for (i = 0; i < liste.length; i++) {
      if (liste[i].yapi) continue;
      if (liste[i].id === "mobilya") { liste[i].durum = "kilitli"; continue; }
      if (!zKilit && (liste[i].id === "sekil" || liste[i].id === "duvarlar" || liste[i].id.indexOf("duvar-") === 0 || liste[i].id === "kilit")) {
        liste[i].durum = "kilitli";
        continue;
      }
      if (liste[i].id === simdi) liste[i].durum = "simdi";
      else if (i < simdiIx) liste[i].durum = "bitti";
      else liste[i].durum = "sirada";
    }
    var adimSay = 0, bittiSay = 0;
    for (i = 0; i < liste.length; i++) {
      if (liste[i].yapi) continue;
      adimSay += 1;
      if (liste[i].durum === "bitti" || liste[i].durum === "simdi") bittiSay += 1;
    }
    return { liste: liste, oran: adimSay ? Math.round(100 * bittiSay / adimSay) : 0, simdi: simdi };
  }

  function idListe(liste) {
    var i, t = [];
    for (i = 0; i < liste.length; i++) t.push(liste[i].id);
    return t;
  }

  function anahtar(s) {
    var i, t = [];
    for (i = 0; i < s.liste.length; i++) t.push(s.liste[i].id + ":" + s.liste[i].durum + ":" + s.liste[i].deger);
    return t.join("|");
  }

  function kaydirAktif() {
    if (!kaydir) return;
    var el = kaydir.querySelector(".adimRafKart.simdi");
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: azalt() ? "auto" : "smooth" });
    }
  }

  function sinifCalistir(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener("animationend", function bit() {
      el.removeEventListener("animationend", bit);
      el.classList.remove(cls);
    });
  }

  function titre(el) {
    if (azalt()) return;
    sinifCalistir(el, "titrer");
  }

  function ciz(d) {
    kaydir = document.getElementById("adimRafKaydir");
    dol = document.getElementById("adimRafIlerlemeDol");
    if (!kaydir) return;
    var s = durumlar(d || {});
    var a = anahtar(s);
    var ayni = a === sonAnahtar;
    var simdiEl;
    if (ayni) {
      if (d && d.hata) {
        simdiEl = kaydir.querySelector(".adimRafKart.simdi");
        titre(simdiEl);
      }
      return;
    }
    var oncekiIdler = sonIdler.slice();
    var oncekiSimdi = sonSimdi;
    sonAnahtar = a;
    sonIdler = idListe(s.liste);
    sonSimdi = s.simdi;
    var html = "", i, k;
    for (i = 0; i < s.liste.length; i++) html += kartHtml(s.liste[i]);
    kaydir.innerHTML = html;
    var simdiKart = null;
    for (i = 0; i < s.liste.length; i++) {
      if (s.liste[i].id === s.simdi) simdiKart = s.liste[i];
    }
    sonAd = simdiKart ? simdiKart.ad : "";
    var adEl = document.getElementById("adimRafAd");
    if (adEl) adEl.textContent = sonAd;
    if (dol) dol.style.width = s.oran + "%";
    if (!azalt()) {
      for (i = 0; i < s.liste.length; i++) {
        k = s.liste[i];
        if (oncekiIdler.length && oncekiIdler.indexOf(k.id) < 0 && k.id === "gonye") {
          var dog = kaydir.querySelector('[data-id="' + k.id + '"]');
          if (dog) dog.classList.add("dogdu");
        }
      }
      simdiEl = kaydir.querySelector(".adimRafKart.simdi");
      if (simdiEl && s.simdi !== oncekiSimdi) {
        if (s.simdi === "muhur" || s.simdi === "kilit") {
          sinifCalistir(simdiEl, "damga");
          try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* */ }
        } else {
          sinifCalistir(simdiEl, "nefes");
        }
      }
    }
    if (d && d.hata) titre(kaydir.querySelector(".adimRafKart.simdi"));
    setTimeout(kaydirAktif, 50);
  }

  function zeminKartMi(id) {
    return id === "en" || id === "boy" || id === "esik" || id === "oda" || id === "gonye" || id === "ek" || id === "yukselti" || id === "sifon" || id === "birak" || id === "muhur";
  }

  function sozYaz(metin) {
    if (!metin) return;
    var c = document.getElementById("programCumle");
    if (c) {
      c.textContent = metin;
      c.classList.add("talimat");
      c.classList.remove("hata");
    }
    var d = document.getElementById("duvarDurum");
    if (d) {
      d.textContent = metin;
      d.classList.remove("hata");
    }
    var sk = document.getElementById("solKomut");
    if (sk) sk.textContent = metin;
  }

  function kartCumle(id, durum) {
    var d = sonDetay || {};
    if (!id || durum === "simdi" || durum === "yapi") return "";
    if (durum === "kilitli") {
      if (id === "mobilya") return d.duvarKilit ? "Mobilya motoru sırada usta." : "Önce duvar kilitle usta.";
      return "Önce zemin mühürle usta.";
    }
    if (durum === "sirada") return "Sırası gelmedi usta.";
    if (durum === "bitti") {
      if (d.duvarKilit || id === "kilit" || (d.zeminKilit && zeminKartMi(id))) {
        return "Mühürlü usta, düzeltme Menü'de.";
      }
      return "Değiştirmek için Önceki usta.";
    }
    return "";
  }

  function kartDokun(ev) {
    if (!dokun) return;
    if (Math.abs(ev.clientX - dokun.x) > 8 || Math.abs(ev.clientY - dokun.y) > 8) {
      dokun = null;
      return;
    }
    var t = ev.target && ev.target.closest ? ev.target.closest(".adimRafKart") : null;
    var id = t ? t.getAttribute("data-id") : dokun.id;
    var durum = t ? t.getAttribute("data-durum") : dokun.durum;
    dokun = null;
    sozYaz(kartCumle(id, durum));
  }

  function baglaKaydir() {
    kaydir = document.getElementById("adimRafKaydir");
    if (!kaydir || kaydir.getAttribute("data-bag")) return;
    kaydir.setAttribute("data-bag", "1");
    kaydir.addEventListener("scroll", function () {
      if (tmr) clearTimeout(tmr);
      tmr = setTimeout(kaydirAktif, 2000);
    });
    kaydir.addEventListener("pointerdown", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest(".adimRafKart") : null;
      if (!t) {
        dokun = null;
        return;
      }
      dokun = { id: t.getAttribute("data-id"), durum: t.getAttribute("data-durum"), x: ev.clientX, y: ev.clientY };
    });
    kaydir.addEventListener("pointerup", kartDokun);
    kaydir.addEventListener("pointercancel", function () { dokun = null; });
  }

  function inceAyar(on) {
    var raf = document.getElementById("adimRaf");
    if (!raf) return;
    if (on) {
      if (inceTmr) {
        clearTimeout(inceTmr);
        inceTmr = null;
      }
      raf.classList.add("ince");
      return;
    }
    if (azalt()) {
      raf.classList.remove("ince");
      return;
    }
    if (inceTmr) clearTimeout(inceTmr);
    inceTmr = setTimeout(function () {
      raf.classList.remove("ince");
      inceTmr = null;
    }, 1200);
  }

  function baglaRaf() {
    var raf = document.getElementById("adimRaf");
    if (!raf || raf.getAttribute("data-ince-bag")) return;
    raf.setAttribute("data-ince-bag", "1");
    raf.addEventListener("click", function () {
      if (!raf.classList.contains("ince")) return;
      if (inceTmr) {
        clearTimeout(inceTmr);
        inceTmr = null;
      }
      raf.classList.remove("ince");
    });
  }

  document.addEventListener("magi-adim", function (e) {
    baglaKaydir();
    baglaRaf();
    var d = e && e.detail ? e.detail : {};
    sonDetay = d;
    if (d.ince != null) inceAyar(!!d.ince);
    ciz(d);
  });

  document.addEventListener("magi-raf-ince", function (e) {
    baglaRaf();
    inceAyar(!!(e && e.detail && e.detail.ince));
  });
})();
