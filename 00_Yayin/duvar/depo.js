(function () {
  var DB_AD = "magi_recete";
  var DB_SURUM = 1;
  var DEPOLAR = ["ustalar", "musteriler", "isler", "muhurler", "taslaklar", "olaylar"];
  var LS_IS = "magi_is_kayitlari";
  var LS_KASA = "magi_atolye_kasa";
  var LS_GOC = "magi_goc_v1";

  var db = null;
  var isler = {};
  var kasa = { ustalar: {} };
  var hazirSoz = null;

  function lsOku(anahtar, bos) {
    try {
      var k = JSON.parse(localStorage.getItem(anahtar) || "null");
      return k && typeof k === "object" ? k : bos;
    } catch (e) {
      return bos;
    }
  }

  function lsYaz(anahtar, deger) {
    try {
      localStorage.setItem(anahtar, JSON.stringify(deger));
      return true;
    } catch (e) {
      return false;
    }
  }

  function kopya(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function istek(r) {
    return new Promise(function (coz, red) {
      r.onsuccess = function () { coz(r.result); };
      r.onerror = function () { red(r.error); };
    });
  }

  function islem(depolar, mod, fn) {
    return new Promise(function (coz, red) {
      var t = db.transaction(depolar, mod);
      var sonuc;
      t.oncomplete = function () { coz(sonuc); };
      t.onerror = function () { red(t.error); };
      t.onabort = function () { red(t.error || new Error("İşlem durdu.")); };
      sonuc = fn(t);
    });
  }

  function ac() {
    return new Promise(function (coz, red) {
      if (!window.indexedDB) {
        red(new Error("IndexedDB yok."));
        return;
      }
      var r = indexedDB.open(DB_AD, DB_SURUM);
      r.onupgradeneeded = function () {
        var d = r.result;
        var i;
        for (i = 0; i < DEPOLAR.length; i++) {
          if (!d.objectStoreNames.contains(DEPOLAR[i])) d.createObjectStore(DEPOLAR[i]);
        }
      };
      r.onsuccess = function () { coz(r.result); };
      r.onerror = function () { red(r.error); };
      r.onblocked = function () { red(new Error("Veritabanı başka sekmede kilitli.")); };
    });
  }

  function hepsiOku(depo) {
    return islem([depo], "readonly", function (t) {
      var s = t.objectStore(depo);
      var cikti = {};
      var imlec = s.openCursor();
      imlec.onsuccess = function () {
        var c = imlec.result;
        if (!c) return;
        cikti[c.key] = c.value;
        c.continue();
      };
      return cikti;
    });
  }

  function goc() {
    if (localStorage.getItem(LS_GOC)) return Promise.resolve(false);
    var eskiIs = lsOku(LS_IS, {});
    var eskiKasa = lsOku(LS_KASA, { ustalar: {} });
    return islem(["isler", "ustalar"], "readwrite", function (t) {
      var si = t.objectStore("isler");
      var su = t.objectStore("ustalar");
      Object.keys(eskiIs).forEach(function (a) {
        var r = si.get(a);
        r.onsuccess = function () { if (r.result === undefined) si.put(eskiIs[a], a); };
      });
      Object.keys(eskiKasa.ustalar || {}).forEach(function (a) {
        var r = su.get(a);
        r.onsuccess = function () { if (r.result === undefined) su.put(eskiKasa.ustalar[a], a); };
      });
    }).then(function () {
      try { localStorage.setItem(LS_GOC, new Date().toISOString()); } catch (e) { /* işaret sonra */ }
      return true;
    });
  }

  function yedekYukle() {
    isler = lsOku(LS_IS, {});
    kasa = lsOku(LS_KASA, { ustalar: {} });
    if (!kasa.ustalar || typeof kasa.ustalar !== "object") kasa.ustalar = {};
  }

  function hazirla() {
    if (hazirSoz) return hazirSoz;
    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    } catch (e) { /* izin isteğe bağlı */ }
    hazirSoz = ac().then(function (d) {
      db = d;
      return goc();
    }).then(function (tasindi) {
      return Promise.all([hepsiOku("isler"), hepsiOku("ustalar")]).then(function (s) {
        isler = s[0];
        kasa = { ustalar: s[1] };
        return { idb: true, tasindi: tasindi };
      });
    }).catch(function (hata) {
      db = null;
      yedekYukle();
      return { idb: false, tasindi: false, hata: String((hata && hata.message) || hata) };
    });
    return hazirSoz;
  }

  function isYaz(anahtar, paket) {
    if (!anahtar) return Promise.resolve(false);
    isler[anahtar] = kopya(paket);
    var lsTamam = lsYaz(LS_IS, isler);
    if (!db) return lsTamam ? Promise.resolve(true) : Promise.reject(new Error("Kayıt yazılamadı."));
    var deger = isler[anahtar];
    return islem(["isler"], "readwrite", function (t) {
      t.objectStore("isler").put(deger, anahtar);
    }).then(function () { return true; });
  }

  function kasaYaz(yeni) {
    kasa = kopya(yeni && typeof yeni === "object" ? yeni : { ustalar: {} });
    if (!kasa.ustalar || typeof kasa.ustalar !== "object") kasa.ustalar = {};
    var lsTamam = lsYaz(LS_KASA, kasa);
    if (!db) return lsTamam ? Promise.resolve(true) : Promise.reject(new Error("Kasa yazılamadı."));
    var ustalar = kasa.ustalar;
    return islem(["ustalar"], "readwrite", function (t) {
      var s = t.objectStore("ustalar");
      Object.keys(ustalar).forEach(function (a) { s.put(ustalar[a], a); });
    }).then(function () { return true; });
  }

  function muhurSon(isAnahtar, asama) {
    var onEk = isAnahtar + "|" + asama + "|";
    return new Promise(function (coz, red) {
      if (!db) {
        coz({ anahtar: "", surum: 0 });
        return;
      }
      var t = db.transaction(["muhurler"], "readonly");
      var s = t.objectStore("muhurler");
      var rk = s.getAllKeys();
      var rv = s.getAll();
      t.oncomplete = function () {
        var son = { anahtar: "", surum: 0 };
        var keys = rk.result || [];
        var vals = rv.result || [];
        var i;
        for (i = 0; i < keys.length; i++) {
          if (String(keys[i]).indexOf(onEk) !== 0) continue;
          var srm = vals[i] && vals[i].surum ? Number(vals[i].surum) : 1;
          if (!(srm > 0)) srm = 1;
          if (!son.anahtar || String(keys[i]) > son.anahtar) son = { anahtar: keys[i], surum: srm };
        }
        coz(son);
      };
      t.onerror = function () { red(t.error); };
      t.onabort = function () { red(t.error || new Error("İşlem durdu.")); };
    });
  }

  function muhurYaz(isAnahtar, asama, bilgi, paket) {
    if (!isAnahtar || !db) return Promise.reject(new Error("Mühür deposu yok."));
    return muhurSon(isAnahtar, asama).then(function (son) {
      var zaman = new Date().toISOString();
      var anahtar = isAnahtar + "|" + asama + "|" + zaman;
      var kayit = {
        muhur_id: anahtar,
        is_id: isAnahtar,
        asama: asama,
        surum: (son && son.surum ? son.surum : 0) + 1,
        onceki_id: (son && son.anahtar) || "",
        tarih: zaman,
        usta: (bilgi && bilgi.usta) || "",
        musteriId: (bilgi && bilgi.musteriId) || "",
        isAdi: (bilgi && bilgi.isAdi) || "",
        paket: kopya(paket)
      };
      return islem(["muhurler"], "readwrite", function (t) {
        t.objectStore("muhurler").add(kayit, anahtar);
      });
    }).then(function () { return true; });
  }

  function depoHarita(depo) {
    return new Promise(function (coz, red) {
      if (!db) {
        coz({});
        return;
      }
      var t = db.transaction([depo], "readonly");
      var s = t.objectStore(depo);
      var rk = s.getAllKeys();
      var rv = s.getAll();
      t.oncomplete = function () {
        var o = {};
        var keys = rk.result || [];
        var vals = rv.result || [];
        var i;
        for (i = 0; i < keys.length; i++) o[String(keys[i])] = vals[i];
        coz(o);
      };
      t.onerror = function () { red(t.error); };
      t.onabort = function () { red(t.error || new Error("İşlem durdu.")); };
    });
  }

  function depoDoldur(depo, harita) {
    return new Promise(function (coz, red) {
      if (!db) {
        red(new Error("IndexedDB yok."));
        return;
      }
      var t = db.transaction([depo], "readwrite");
      var s = t.objectStore(depo);
      s.clear();
      Object.keys(harita || {}).forEach(function (a) { s.put(harita[a], a); });
      t.oncomplete = function () { coz(true); };
      t.onerror = function () { red(t.error); };
      t.onabort = function () { red(t.error || new Error("İşlem durdu.")); };
    });
  }

  function yedekAl() {
    return hazirla().then(function () {
      var i;
      var sozler = [];
      for (i = 0; i < DEPOLAR.length; i++) sozler.push(depoHarita(DEPOLAR[i]));
      return Promise.all(sozler);
    }).then(function (list) {
      var idb = {};
      var i;
      for (i = 0; i < DEPOLAR.length; i++) idb[DEPOLAR[i]] = list[i];
      var profil;
      try {
        profil = JSON.parse(localStorage.getItem("magi_usta_profil") || "null");
      } catch (e) {
        profil = null;
      }
      return {
        tur: "magi_recete_yedek",
        surum: 1,
        tarih: new Date().toISOString(),
        idb: idb,
        ls: {
          magi_is_kayitlari: lsOku(LS_IS, {}),
          magi_atolye_kasa: lsOku(LS_KASA, { ustalar: {} }),
          magi_usta_profil: profil && typeof profil === "object" ? profil : { ad: "", dukkan: "", telefon: "" },
          magi_goc_v1: localStorage.getItem(LS_GOC) || ""
        }
      };
    });
  }

  function yedekKoy(paket) {
    if (!paket || paket.tur !== "magi_recete_yedek" || !paket.idb || typeof paket.idb !== "object") {
      return Promise.reject(new Error("Yedek okunamadı usta."));
    }
    return hazirla().then(function (durum) {
      if (!durum || !durum.idb) return Promise.reject(new Error("Yedek yazılamadı usta."));
      var i;
      var sozler = [];
      for (i = 0; i < DEPOLAR.length; i++) {
        sozler.push(depoDoldur(DEPOLAR[i], paket.idb[DEPOLAR[i]] || {}));
      }
      return Promise.all(sozler);
    }).then(function () {
      var ls = paket.ls && typeof paket.ls === "object" ? paket.ls : {};
      if (ls.magi_is_kayitlari) lsYaz(LS_IS, ls.magi_is_kayitlari);
      if (ls.magi_atolye_kasa) lsYaz(LS_KASA, ls.magi_atolye_kasa);
      if (ls.magi_usta_profil) lsYaz("magi_usta_profil", ls.magi_usta_profil);
      try {
        if (ls.magi_goc_v1) localStorage.setItem(LS_GOC, ls.magi_goc_v1);
      } catch (e) { /* işaret sonra */ }
      isler = lsOku(LS_IS, {});
      kasa = lsOku(LS_KASA, { ustalar: {} });
      if (!kasa.ustalar || typeof kasa.ustalar !== "object") kasa.ustalar = {};
      return true;
    });
  }

  window.MagiDepo = {
    hazirla: hazirla,
    idbVar: function () { return !!db; },
    isler: function () { return kopya(isler); },
    isYaz: isYaz,
    kasa: function () { return kopya(kasa); },
    kasaYaz: kasaYaz,
    muhurYaz: muhurYaz,
    yedekAl: yedekAl,
    yedekKoy: yedekKoy
  };
})();
