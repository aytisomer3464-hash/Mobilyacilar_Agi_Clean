/* Mobilya motoru (motor.py ikizi). Zemin, duvar, OCR, ebatlama bağlanmaz.
   Ölçü yalnız config'ten gelir. */
(function (kok) {
  "use strict";

  var ALANLAR = [
    "levha", "arkalik", "derz", "kapak_binis", "raf_geri", "raf_aks",
    "arkalik_kanal", "arkalik_derinlik", "ray_bosluk", "cekmece_derzi",
    "raf_tolerans", "raf_aralik", "tandem_pay", "cekmece_taban_payi",
    "ayak_yuksekligi", "supurgelik_yuksekligi", "supurgelik_geri",
    "mentese_esik_1", "mentese_esik_2", "mentese_esik_3",
    "mentese_adet_1", "mentese_adet_2", "mentese_adet_3", "mentese_adet_4",
    "kavela_cap", "kavela_boy", "kavela_birlesim", "minifiks_birlesim",
    "konfirmat_cap", "konfirmat_boy", "konfirmat_birlesim",
    "raf_aks_baslangic", "raf_pimi_adet",
    "modul_genislik", "modul_derinlik", "panel_yogunluk", "metre_mm",
    "baza_govde_yukseklik", "tezgah_kalinlik", "duvar_govde_yukseklik",
    "tezgah_ustu_bosluk", "boy_govde_yukseklik"
  ];
  var POZITIF = {
    levha: 1, raf_aralik: 1, raf_aks: 1,
    mentese_esik_1: 1, mentese_esik_2: 1, mentese_esik_3: 1,
    mentese_adet_1: 1, mentese_adet_2: 1, mentese_adet_3: 1, mentese_adet_4: 1,
    kavela_cap: 1, kavela_boy: 1, kavela_birlesim: 1, minifiks_birlesim: 1,
    konfirmat_cap: 1, konfirmat_boy: 1, konfirmat_birlesim: 1,
    modul_genislik: 1, modul_derinlik: 1, panel_yogunluk: 1, metre_mm: 1,
    baza_govde_yukseklik: 1, tezgah_kalinlik: 1, duvar_govde_yukseklik: 1,
    tezgah_ustu_bosluk: 1, boy_govde_yukseklik: 1
  };
  var RAY_TIPLERI = { tandem: "tandem", gizli: "tandem", bilyali: "bilyali" };
  var ARKALIK_TIPLERI = { kanalli: "kanalli", bindirme: "bindirme" };
  var TIPLER = { baza: "baza", duvar: "duvar", boy: "boy" };

  function sayiMi(deger) {
    return typeof deger === "number" && isFinite(deger);
  }

  function temiz(deger) {
    return deger === Math.floor(deger) ? deger : deger;
  }

  function ayarSayisi(ad, deger) {
    if (!sayiMi(deger)) throw new Error(ad + " sayı olmalı.");
    if (deger < 0) throw new Error(ad + " negatif olamaz.");
    if (POZITIF[ad] && deger === 0) throw new Error(ad + " sıfırdan büyük olmalı.");
    return temiz(deger);
  }

  function fromDict(veri) {
    if (!veri || typeof veri !== "object" || Array.isArray(veri)) {
      throw new Error("Ayarlar bir sözlük olmalı.");
    }
    var temizMap = {};
    var anahtarlar = Object.keys(veri);
    var i, ad;
    for (i = 0; i < anahtarlar.length; i++) {
      ad = String(anahtarlar[i]).trim().toLowerCase();
      if (Object.prototype.hasOwnProperty.call(temizMap, ad)) {
        throw new Error("Ayar iki kez verilmiş: " + ad + ".");
      }
      temizMap[ad] = veri[anahtarlar[i]];
    }
    var eksik = [];
    for (i = 0; i < ALANLAR.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(temizMap, ALANLAR[i])) eksik.push(ALANLAR[i]);
    }
    if (eksik.length) throw new Error("Eksik ayar: " + eksik.join(", ") + ".");
    var fazla = [];
    for (i = 0; i < anahtarlar.length; i++) {
      ad = String(anahtarlar[i]).trim().toLowerCase();
      if (ALANLAR.indexOf(ad) < 0) fazla.push(ad);
    }
    if (fazla.length) throw new Error("Bilinmeyen ayar: " + fazla.join(", ") + ".");
    var cfg = {};
    for (i = 0; i < ALANLAR.length; i++) {
      cfg[ALANLAR[i]] = ayarSayisi(ALANLAR[i], temizMap[ALANLAR[i]]);
    }
    return Object.freeze(cfg);
  }

  function varsayilan() {
    if (typeof require !== "function") {
      throw new Error("Ayar dosyası okunamadı: varsayilan_config.json");
    }
    var fs = require("fs");
    var path = require("path");
    var yol = path.join(__dirname, "varsayilan_config.json");
    try {
      return fromDict(JSON.parse(fs.readFileSync(yol, "utf8")));
    } catch (hata) {
      throw new Error("Ayar dosyası okunamadı: " + yol);
    }
  }

  function degistir(cfg, ayar) {
    var birlesik = {};
    var i, ad, anahtarlar;
    for (i = 0; i < ALANLAR.length; i++) birlesik[ALANLAR[i]] = cfg[ALANLAR[i]];
    anahtarlar = Object.keys(ayar || {});
    for (i = 0; i < anahtarlar.length; i++) {
      ad = anahtarlar[i];
      birlesik[ad] = ayar[ad];
    }
    return fromDict(birlesik);
  }

  function hata(hatalar) {
    return { hazir: false, hatalar: hatalar.slice(), parcalar: [] };
  }

  function pozitif(deger, ad, hatalar) {
    if (sayiMi(deger) && deger > 0) return true;
    hatalar.push(ad + " sıfırdan büyük bir sayı olmalı.");
    return false;
  }

  function tam(deger, ad, enAz, hatalar) {
    if (typeof deger === "number" && isFinite(deger) && Math.floor(deger) === deger && deger >= enAz) {
      return true;
    }
    hatalar.push(ad + " " + enAz + " veya daha büyük bir tam sayı olmalı.");
    return false;
  }

  function sifirdanBuyuk(degerler, hatalar) {
    var adlar = Object.keys(degerler);
    var i;
    for (i = 0; i < adlar.length; i++) {
      if (degerler[adlar[i]] <= 0) hatalar.push(adlar[i] + " sıfırdan büyük çıkmadı.");
    }
  }

  function parca(ad, adet, olculer) {
    var p = { ad: ad, adet: adet };
    var adlar = Object.keys(olculer);
    var i;
    for (i = 0; i < adlar.length; i++) p[adlar[i]] = temiz(olculer[adlar[i]]);
    return p;
  }

  function ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar) {
    var sayi = hatalar.length;
    pozitif(disGenislik, "Dış genişlik", hatalar);
    pozitif(disYukseklik, "Dış yükseklik", hatalar);
    pozitif(disDerinlik, "Dış derinlik", hatalar);
    if (hatalar.length > sayi) return null;
    var genislik = disGenislik - 2 * cfg.levha;
    var yukseklik = disYukseklik - 2 * cfg.levha;
    var derinlik = disDerinlik - cfg.arkalik_kanal;
    sifirdanBuyuk(
      { "İç genişlik": genislik, "İç yükseklik": yukseklik, "İç derinlik": derinlik },
      hatalar
    );
    if (hatalar.length > sayi) return null;
    return { genislik: genislik, yukseklik: yukseklik, derinlik: derinlik };
  }

  function icGoster(icOlcu) {
    return {
      genislik: temiz(icOlcu.genislik),
      yukseklik: temiz(icOlcu.yukseklik),
      derinlik: temiz(icOlcu.derinlik)
    };
  }

  function rafAkslari(cfg, icYukseklik) {
    var aks = cfg.raf_aks_baslangic;
    var akslar = [];
    while (aks <= icYukseklik) {
      akslar.push(temiz(aks));
      aks = aks + cfg.raf_aks;
    }
    return akslar;
  }

  function listede(dizi, deger) {
    var i;
    for (i = 0; i < dizi.length; i++) if (dizi[i] === deger) return true;
    return false;
  }

  function rafYerleri(cfg, icYukseklik, adet, hatalar) {
    var uygun, kullanilan, i, hedef, enYakin, enFark, aks, fark, onceki, j;
    if (adet === 0) return [];
    uygun = [];
    var akslar = rafAkslari(cfg, icYukseklik);
    for (i = 0; i < akslar.length; i++) {
      if (akslar[i] + cfg.levha <= icYukseklik) uygun.push(akslar[i]);
    }
    if (adet > uygun.length) {
      hatalar.push("Raf deliği yetmiyor.");
      return [];
    }
    kullanilan = [];
    for (i = 1; i <= adet; i++) {
      hedef = icYukseklik * i / (adet + 1);
      enYakin = null;
      enFark = null;
      for (j = 0; j < uygun.length; j++) {
        aks = uygun[j];
        if (listede(kullanilan, aks)) continue;
        fark = Math.abs(aks - hedef);
        if (enFark === null || fark < enFark || (fark === enFark && aks < enYakin)) {
          enYakin = aks;
          enFark = fark;
        }
      }
      if (enYakin === null) {
        hatalar.push("Raf deliği yetmiyor.");
        return [];
      }
      kullanilan.push(enYakin);
    }
    kullanilan.sort(function (a, b) { return a - b; });
    onceki = null;
    for (i = 0; i < kullanilan.length; i++) {
      if (onceki !== null && kullanilan[i] - onceki < cfg.levha) {
        hatalar.push("Raflar birbirine giriyor.");
        return [];
      }
      onceki = kullanilan[i];
    }
    return kullanilan;
  }

  function kutu(ad, x, y, z, en, boy, kalinlik) {
    return {
      ad: ad,
      x: temiz(x),
      y: temiz(y),
      z: temiz(z),
      en: temiz(en),
      boy: temiz(boy),
      kalinlik: temiz(kalinlik)
    };
  }

  function menteseKapakBasi(cfg, kapakYukseklik) {
    var esikler = [cfg.mentese_esik_1, cfg.mentese_esik_2, cfg.mentese_esik_3];
    var adetler = [cfg.mentese_adet_1, cfg.mentese_adet_2, cfg.mentese_adet_3, cfg.mentese_adet_4];
    if (esikler[0] >= esikler[1] || esikler[1] >= esikler[2]) {
      return { adet: null, hata: "Menteşe eşikleri artan olmalı." };
    }
    if (kapakYukseklik <= esikler[0]) return { adet: adetler[0], hata: null };
    if (kapakYukseklik <= esikler[1]) return { adet: adetler[1], hata: null };
    if (kapakYukseklik <= esikler[2]) return { adet: adetler[2], hata: null };
    return { adet: adetler[3], hata: null };
  }

  function tipOlcu(cfg, tip, odaYukseklik) {
    var hatalar = [];
    var ad = typeof tip === "string" ? String(tip).trim().toLowerCase() : "";
    var yukseklik, yerden;
    if (!TIPLER[ad]) hatalar.push("Tip baza, duvar veya boy olmalı.");
    pozitif(odaYukseklik, "Oda yüksekliği", hatalar);
    if (hatalar.length) return hata(hatalar);
    if (ad === "baza") {
      yukseklik = cfg.baza_govde_yukseklik;
      yerden = cfg.ayak_yuksekligi;
    } else if (ad === "duvar") {
      yukseklik = cfg.duvar_govde_yukseklik;
      yerden = cfg.ayak_yuksekligi + cfg.baza_govde_yukseklik + cfg.tezgah_kalinlik + cfg.tezgah_ustu_bosluk;
    } else {
      yukseklik = cfg.boy_govde_yukseklik;
      if (yukseklik > odaYukseklik) yukseklik = odaYukseklik;
      yerden = 0;
    }
    if (yerden + yukseklik > odaYukseklik) return hata(["Oda bu tipe dar."]);
    return {
      hazir: true,
      hatalar: [],
      tip: ad,
      yukseklik: temiz(yukseklik),
      yerden: temiz(yerden),
      parcalar: []
    };
  }

  function govdeHesapla(cfg, disGenislik, disYukseklik, disDerinlik, dikmeAdedi) {
    if (dikmeAdedi === undefined) dikmeAdedi = 0;
    var hatalar = [];
    var icOlcu = ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar);
    tam(dikmeAdedi, "Dikme adedi", 0, hatalar);
    if (hatalar.length) return hata(hatalar);
    var parcalar = [
      parca("yan", 2, { yukseklik: disYukseklik, derinlik: disDerinlik }),
      parca("alt", 1, { genislik: icOlcu.genislik, derinlik: disDerinlik }),
      parca("ust", 1, { genislik: icOlcu.genislik, derinlik: disDerinlik })
    ];
    if (dikmeAdedi) {
      parcalar.push(parca("dikme", dikmeAdedi, {
        yukseklik: icOlcu.yukseklik,
        derinlik: icOlcu.derinlik
      }));
    }
    return { hazir: true, hatalar: [], ic: icGoster(icOlcu), parcalar: parcalar };
  }

  function govdeBirlestir(cfg, disGenislik, disYukseklik, disDerinlik) {
    var hatalar = [];
    var icOlcu = ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar);
    var parcalar;
    if (icOlcu) {
      if (cfg.arkalik > disDerinlik) hatalar.push("Arkalık kalınlığı derinliği aşıyor.");
      sifirdanBuyuk({
        "Arkalık genişliği": disGenislik - 2 * cfg.arkalik_kanal,
        "Arkalık yüksekliği": disYukseklik - 2 * cfg.arkalik_kanal,
        "Arkalık kalınlığı": cfg.arkalik
      }, hatalar);
    }
    if (hatalar.length) return hata(hatalar);
    parcalar = [
      kutu("yan", 0, 0, 0, cfg.levha, disDerinlik, disYukseklik),
      kutu("yan", disGenislik - cfg.levha, 0, 0, cfg.levha, disDerinlik, disYukseklik),
      kutu("alt", cfg.levha, 0, 0, icOlcu.genislik, disDerinlik, cfg.levha),
      kutu("ust", cfg.levha, 0, disYukseklik - cfg.levha, icOlcu.genislik, disDerinlik, cfg.levha),
      kutu(
        "arkalik",
        cfg.arkalik_kanal,
        disDerinlik - cfg.arkalik,
        cfg.arkalik_kanal,
        disGenislik - 2 * cfg.arkalik_kanal,
        cfg.arkalik,
        disYukseklik - 2 * cfg.arkalik_kanal
      )
    ];
    return {
      hazir: true,
      hatalar: [],
      ic: icGoster(icOlcu),
      govde: {
        genislik: temiz(disGenislik),
        yukseklik: temiz(disYukseklik),
        derinlik: temiz(disDerinlik)
      },
      parcalar: parcalar
    };
  }

  function kapakHesapla(cfg, disGenislik, disYukseklik, disDerinlik, kapakAdedi) {
    if (kapakAdedi === undefined) kapakAdedi = 1;
    var hatalar = [];
    var icOlcu = ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar);
    if (tam(kapakAdedi, "Kapak adedi", 1, hatalar) && kapakAdedi > 2) {
      hatalar.push("Kapak adedi 1 veya 2 olmalı.");
    }
    if (hatalar.length) return hata(hatalar);
    var yukseklik = icOlcu.yukseklik + 2 * cfg.kapak_binis - 2 * cfg.derz;
    var genislik;
    if (kapakAdedi === 1) {
      genislik = icOlcu.genislik + 2 * cfg.kapak_binis - 2 * cfg.derz;
    } else {
      genislik = (icOlcu.genislik + 2 * cfg.kapak_binis - 3 * cfg.derz) / 2;
    }
    sifirdanBuyuk({ "Kapak genişliği": genislik, "Kapak yüksekliği": yukseklik }, hatalar);
    if (hatalar.length) return hata(hatalar);
    var m = cfg.metre_mm;
    return {
      hazir: true,
      hatalar: [],
      ic: icGoster(icOlcu),
      agirlik_kg: temiz((genislik / m) * (yukseklik / m) * (cfg.levha / m) * cfg.panel_yogunluk),
      parcalar: [parca("kapak", kapakAdedi, { genislik: genislik, yukseklik: yukseklik })]
    };
  }

  function kapakYerlestir(cfg, disGenislik, disYukseklik, disDerinlik, kapakAdedi) {
    if (kapakAdedi === undefined) kapakAdedi = 1;
    var kapak = kapakHesapla(cfg, disGenislik, disYukseklik, disDerinlik, kapakAdedi);
    var p, toplam, x, z, parcalar, i;
    if (!kapak.hazir) return hata(kapak.hatalar);
    p = kapak.parcalar[0];
    toplam = p.genislik * kapakAdedi + cfg.derz * (kapakAdedi - 1);
    x = (disGenislik - toplam) / 2;
    z = (disYukseklik - p.yukseklik) / 2;
    parcalar = [];
    for (i = 0; i < kapakAdedi; i++) {
      parcalar.push(kutu("kapak", x + i * (p.genislik + cfg.derz), -cfg.levha, z, p.genislik, cfg.levha, p.yukseklik));
    }
    return {
      hazir: true,
      hatalar: [],
      ic: kapak.ic,
      agirlik_kg: kapak.agirlik_kg,
      parcalar: parcalar
    };
  }

  function rafHesapla(cfg, disGenislik, disYukseklik, disDerinlik, rafAdedi) {
    var hatalar = [];
    var icOlcu = ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar);
    var genislik, derinlik, adet, akslar;
    if (rafAdedi !== undefined && rafAdedi !== null) {
      tam(rafAdedi, "Raf adedi", 0, hatalar);
    }
    if (icOlcu) {
      genislik = icOlcu.genislik - cfg.raf_tolerans;
      derinlik = icOlcu.derinlik - cfg.raf_geri;
      sifirdanBuyuk({ "Raf genişliği": genislik, "Raf derinliği": derinlik }, hatalar);
    }
    if (hatalar.length) return hata(hatalar);
    adet = (rafAdedi !== undefined && rafAdedi !== null)
      ? rafAdedi
      : Math.floor(icOlcu.yukseklik / cfg.raf_aralik);
    akslar = rafAkslari(cfg, icOlcu.yukseklik);
    return {
      hazir: true,
      hatalar: [],
      ic: icGoster(icOlcu),
      raf_adedi: adet,
      raf_pimi_adedi: temiz(adet * cfg.raf_pimi_adet),
      akslar: akslar,
      delik_adedi: akslar.length,
      parcalar: adet ? [parca("raf", adet, { genislik: genislik, derinlik: derinlik })] : []
    };
  }

  function rafYerlestir(cfg, disGenislik, disYukseklik, disDerinlik, rafAdedi) {
    var raf = rafHesapla(cfg, disGenislik, disYukseklik, disDerinlik, rafAdedi);
    var hatalar, icOlcu, yerler, en, boy, x, parcalar, i;
    if (!raf.hazir) return hata(raf.hatalar);
    icOlcu = raf.ic;
    hatalar = [];
    yerler = rafYerleri(cfg, icOlcu.yukseklik, raf.raf_adedi, hatalar);
    if (hatalar.length) return hata(hatalar);
    en = icOlcu.genislik - cfg.raf_tolerans;
    boy = icOlcu.derinlik - cfg.raf_geri;
    x = cfg.levha + (icOlcu.genislik - en) / 2;
    parcalar = [];
    for (i = 0; i < yerler.length; i++) {
      parcalar.push(kutu("raf", x, cfg.raf_geri, cfg.levha + yerler[i], en, boy, cfg.levha));
    }
    return {
      hazir: true,
      hatalar: [],
      ic: icOlcu,
      raf_adedi: raf.raf_adedi,
      parcalar: parcalar
    };
  }

  function katalogYukle(yol) {
    if (typeof require !== "function") {
      throw new Error("Katalog okunamadı: katalog_arsiv.json");
    }
    var fs = require("fs");
    var path = require("path");
    var kaynak = yol || path.join(__dirname, "katalog_arsiv.json");
    var ham;
    try {
      ham = JSON.parse(fs.readFileSync(kaynak, "utf8"));
    } catch (hata) {
      throw new Error("Katalog okunamadı: " + kaynak);
    }
    if (!ham || typeof ham !== "object" || !ham.sablon || typeof ham.sablon !== "object") {
      throw new Error("Katalog şablonu yok.");
    }
    return ham;
  }

  function katalogKayitlari(katalog, tip) {
    if (!katalog || !katalog.sablon || !katalog.sablon[tip]) return [];
    return Array.isArray(katalog.sablon[tip]) ? katalog.sablon[tip] : [];
  }

  function standartEnler(katalog, tip) {
    var enler = [];
    var kayitlar = katalogKayitlari(katalog, tip);
    var i, kayit;
    for (i = 0; i < kayitlar.length; i++) {
      kayit = kayitlar[i];
      if (!kayit || !sayiMi(kayit.en) || kayit.duz_kasa === false) continue;
      if (enler.indexOf(temiz(kayit.en)) < 0) enler.push(temiz(kayit.en));
    }
    enler.sort(function (a, b) { return b - a; });
    return enler;
  }

  function koseEnler(katalog, tip) {
    var enler = [];
    var kayitlar = katalogKayitlari(katalog, tip);
    var i, kayit;
    for (i = 0; i < kayitlar.length; i++) {
      kayit = kayitlar[i];
      if (!kayit || kayit.duz_kasa !== false || !sayiMi(kayit.en)) continue;
      if (enler.indexOf(temiz(kayit.en)) < 0) enler.push(temiz(kayit.en));
    }
    enler.sort(function (a, b) { return a - b; });
    return enler;
  }

  function enSec(enler, duvarEn) {
    var secim = [];
    var kalan = duvarEn;
    var sigan, i;
    while (true) {
      sigan = [];
      for (i = 0; i < enler.length; i++) if (enler[i] <= kalan) sigan.push(enler[i]);
      if (!sigan.length) break;
      secim.push(sigan[0]);
      kalan = kalan - sigan[0];
    }
    return { secim: secim, dolgu: kalan };
  }

  function duvarDizi(cfg, duvarEn, tip, katalog) {
    var hatalar = [];
    var ad = tip === undefined ? "baza" : (typeof tip === "string" ? String(tip).trim().toLowerCase() : "");
    var arsiv, enler, sec;
    pozitif(duvarEn, "Duvar eni", hatalar);
    if (!TIPLER[ad]) hatalar.push("Tip baza, duvar veya boy olmalı.");
    if (hatalar.length) return hata(hatalar);
    arsiv = katalog || katalogYukle();
    enler = standartEnler(arsiv, ad);
    if (!enler.length) return hata(["Bu tipte standart genişlik yok."]);
    if (enler[enler.length - 1] > duvarEn) return hata(["Duvar modüle dar."]);
    sec = enSec(enler, duvarEn);
    return {
      hazir: true,
      hatalar: [],
      modul_adedi: sec.secim.length,
      genislikler: sec.secim,
      dolgu_en: temiz(sec.dolgu),
      parcalar: []
    };
  }

  function siraKur(cfg, duvarEn, disYukseklik, disDerinlik, tip, katalog) {
    if (tip === undefined) tip = "baza";
    var dizi = duvarDizi(cfg, duvarEn, tip, katalog);
    var hatalar = [];
    var parcalar, dx, i, j, w, gov, raf, kapak, p;
    if (!dizi.hazir) return hata(dizi.hatalar);
    pozitif(disYukseklik, "Dış yükseklik", hatalar);
    pozitif(disDerinlik, "Dış derinlik", hatalar);
    if (hatalar.length) return hata(hatalar);
    parcalar = [];
    dx = 0;
    for (i = 0; i < dizi.genislikler.length; i++) {
      w = dizi.genislikler[i];
      gov = govdeBirlestir(cfg, w, disYukseklik, disDerinlik);
      if (!gov.hazir) return hata(gov.hatalar);
      raf = rafYerlestir(cfg, w, disYukseklik, disDerinlik);
      if (!raf.hazir) return hata(raf.hatalar);
      kapak = kapakYerlestir(cfg, w, disYukseklik, disDerinlik);
      if (!kapak.hazir) return hata(kapak.hatalar);
      for (j = 0; j < gov.parcalar.length; j++) {
        p = gov.parcalar[j];
        parcalar.push(kutu(p.ad, p.x + dx, p.y, p.z, p.en, p.boy, p.kalinlik));
      }
      for (j = 0; j < raf.parcalar.length; j++) {
        p = raf.parcalar[j];
        parcalar.push(kutu(p.ad, p.x + dx, p.y, p.z, p.en, p.boy, p.kalinlik));
      }
      for (j = 0; j < kapak.parcalar.length; j++) {
        p = kapak.parcalar[j];
        parcalar.push(kutu(p.ad, p.x + dx, p.y, p.z, p.en, p.boy, p.kalinlik));
      }
      dx = dx + w;
    }
    if (dizi.dolgu_en > 0) {
      parcalar.push(kutu("dolgu", dx, 0, 0, dizi.dolgu_en, disDerinlik, disYukseklik));
    }
    return {
      hazir: true,
      hatalar: [],
      modul_adedi: dizi.modul_adedi,
      genislikler: dizi.genislikler,
      dolgu_en: dizi.dolgu_en,
      parcalar: parcalar
    };
  }

  function cekmeceHesapla(cfg, disGenislik, disYukseklik, disDerinlik, rayTipi, rayUzunlugu, aciklikYuksekligi) {
    var hatalar = [];
    var icOlcu = ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar);
    var tip = RAY_TIPLERI[String(rayTipi).trim().toLowerCase()];
    if (tip === undefined) hatalar.push("Ray tipi tandem, gizli veya bilyali olmalı.");
    var rayTamam = pozitif(rayUzunlugu, "Ray uzunluğu", hatalar);
    pozitif(aciklikYuksekligi, "Açıklık yüksekliği", hatalar);
    if (icOlcu && rayTamam && rayUzunlugu > icOlcu.derinlik) {
      hatalar.push("Ray uzunluğu iç derinliği aşıyor.");
    }
    if (hatalar.length) return hata(hatalar);
    var cekmeceGenislik = tip === "tandem"
      ? icOlcu.genislik - cfg.tandem_pay
      : icOlcu.genislik - 2 * cfg.ray_bosluk;
    var onArka = cekmeceGenislik - 2 * cfg.levha;
    var tabanGenislik = cekmeceGenislik - cfg.cekmece_taban_payi;
    var tabanBoy = rayUzunlugu - cfg.cekmece_taban_payi;
    var onuGenislik = disGenislik - 2 * cfg.derz;
    var onuYukseklik = aciklikYuksekligi - cfg.derz;
    sifirdanBuyuk({
      "Çekmece genişliği": cekmeceGenislik,
      "Ön/arka genişliği": onArka,
      "Taban genişliği": tabanGenislik,
      "Taban boyu": tabanBoy,
      "Çekmece önü genişliği": onuGenislik,
      "Çekmece önü yüksekliği": onuYukseklik
    }, hatalar);
    if (hatalar.length) return hata(hatalar);
    return {
      hazir: true,
      hatalar: [],
      ic: icGoster(icOlcu),
      cekmece_genislik: temiz(cekmeceGenislik),
      parcalar: [
        parca("cekmece_yan", 2, { boy: rayUzunlugu }),
        parca("cekmece_on_arka", 2, { genislik: onArka }),
        parca("cekmece_taban", 1, { genislik: tabanGenislik, boy: tabanBoy }),
        parca("cekmece_onu", 1, { genislik: onuGenislik, yukseklik: onuYukseklik })
      ]
    };
  }

  function arkalikHesapla(cfg, disGenislik, disYukseklik, disDerinlik, arkalikTipi) {
    var hatalar = [];
    var icOlcu = ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar);
    var tip = ARKALIK_TIPLERI[String(arkalikTipi).trim().toLowerCase()];
    if (tip === undefined) hatalar.push("Arkalık tipi kanalli veya bindirme olmalı.");
    if (hatalar.length) return hata(hatalar);
    var genislik, yukseklik;
    if (tip === "kanalli") {
      genislik = disGenislik - 2 * cfg.arkalik_kanal;
      yukseklik = disYukseklik - 2 * cfg.arkalik_kanal;
    } else {
      genislik = disGenislik;
      yukseklik = disYukseklik;
    }
    sifirdanBuyuk({ "Arkalık genişliği": genislik, "Arkalık yüksekliği": yukseklik }, hatalar);
    if (hatalar.length) return hata(hatalar);
    return {
      hazir: true,
      hatalar: [],
      ic: icGoster(icOlcu),
      arkalik_tipi: tip,
      parcalar: [parca("arkalik", 1, { genislik: genislik, yukseklik: yukseklik })]
    };
  }

  function ayakSupurgelikHesapla(cfg, disGenislik, disYukseklik, disDerinlik) {
    var hatalar = [];
    var icOlcu = ic(cfg, disGenislik, disYukseklik, disDerinlik, hatalar);
    if (icOlcu) {
      if (cfg.ayak_yuksekligi >= disYukseklik) hatalar.push("Ayak yüksekliği dolabı aşıyor.");
      if (cfg.supurgelik_yuksekligi >= disYukseklik) hatalar.push("Süpürgelik yüksekliği dolabı aşıyor.");
      if (cfg.supurgelik_geri >= disDerinlik) hatalar.push("Süpürgelik geri kaçması derinliği aşıyor.");
    }
    if (hatalar.length) return hata(hatalar);
    return {
      hazir: true,
      hatalar: [],
      ic: icGoster(icOlcu),
      ayak_yuksekligi: temiz(cfg.ayak_yuksekligi),
      supurgelik_yuksekligi: temiz(cfg.supurgelik_yuksekligi),
      supurgelik_geri: temiz(cfg.supurgelik_geri),
      parcalar: []
    };
  }

  function hirdavatHesapla(cfg, disGenislik, disYukseklik, disDerinlik, kapakAdedi) {
    if (kapakAdedi === undefined) kapakAdedi = 1;
    var kapak = kapakHesapla(cfg, disGenislik, disYukseklik, disDerinlik, kapakAdedi);
    if (!kapak.hazir) return hata(kapak.hatalar);
    var kapakYukseklik = kapak.parcalar[0].yukseklik;
    var mentese = menteseKapakBasi(cfg, kapakYukseklik);
    if (mentese.hata) return hata([mentese.hata]);
    var menteseAdedi = mentese.adet * kapakAdedi;
    return {
      hazir: true,
      hatalar: [],
      ic: kapak.ic,
      kapak_yuksekligi: kapakYukseklik,
      mentese_kapak_basi: temiz(mentese.adet),
      mentese_adedi: temiz(menteseAdedi),
      hirdavat: [
        { ad: "mentese", adet: temiz(menteseAdedi) },
        {
          ad: "kavela",
          cap: temiz(cfg.kavela_cap),
          boy: temiz(cfg.kavela_boy),
          birlesim_adet: temiz(cfg.kavela_birlesim)
        },
        { ad: "minifiks", birlesim_adet: temiz(cfg.minifiks_birlesim) },
        {
          ad: "konfirmat",
          cap: temiz(cfg.konfirmat_cap),
          boy: temiz(cfg.konfirmat_boy),
          birlesim_adet: temiz(cfg.konfirmat_birlesim)
        }
      ],
      parcalar: []
    };
  }

  var api = {
    from_dict: fromDict,
    varsayilan: varsayilan,
    degistir: degistir,
    tip_olcu: tipOlcu,
    govde_hesapla: govdeHesapla,
    govde_birlestir: govdeBirlestir,
    kapak_hesapla: kapakHesapla,
    kapak_yerlestir: kapakYerlestir,
    raf_hesapla: rafHesapla,
    raf_yerlestir: rafYerlestir,
    katalog_yukle: katalogYukle,
    standart_enler: standartEnler,
    kose_enler: koseEnler,
    duvar_dizi: duvarDizi,
    sira_kur: siraKur,
    cekmece_hesapla: cekmeceHesapla,
    arkalik_hesapla: arkalikHesapla,
    ayak_supurgelik_hesapla: ayakSupurgelikHesapla,
    hirdavat_hesapla: hirdavatHesapla
  };

  kok.MobilyaMotor = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : this);
