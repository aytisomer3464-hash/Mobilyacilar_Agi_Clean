/* Cep motor: motor_levha.py kurallarinin tarayici kopyasi. */
(function (kok) {
  "use strict";

  var VARSAYILAN_LEVHA_EN = 2800;
  var VARSAYILAN_LEVHA_BOY = 2100;
  var BICAK_PAYI = 3.0;
  var KENAR_TIRASLAMA_PAYI = 10.0;
  var MIN_FIRE_EN = 100;
  var MIN_FIRE_BOY = 100;
  var MAKS_STRATEJI_SAYISI = 8;
  var KESIM_EPS = 1e-6;
  var HAYIR = { "0": 1, false: 1, yok: 1, hayir: 1, kilitli: 1, locked: 1, "": 1 };
  var SU_YONU_SERBEST = { "0": 1, false: 1, yok: 1, hayir: 1, serbest: 1, "": 1 };
  var UYARI_HAVUZ_BOS = "başka alternatif kalmadı";
  var SENARYO_HAVUZU = [];

  function Panel(en, boy, tirasUygula) {
    this.en = Number(en);
    this.boy = Number(boy);
    this.tiras = tirasUygula ? KENAR_TIRASLAMA_PAYI : 0;
    this.bicak = BICAK_PAYI;
    this.min_en = MIN_FIRE_EN;
    this.min_boy = MIN_FIRE_BOY;
    this.kull_en = this.en - 2 * this.tiras;
    this.kull_boy = this.boy - 2 * this.tiras;
    if (this.en <= 0 || this.boy <= 0) throw new Error("Levha en ve boy 0'dan buyuk olmalidir.");
    if (this.kull_en <= 0 || this.kull_boy <= 0) {
      throw new Error("Kenar tirasindan sonra kullanilabilir alan kalmadi.");
    }
  }

  function panelKur(levhaEn, levhaBoy) {
    var en = levhaEn == null ? VARSAYILAN_LEVHA_EN : levhaEn;
    var boy = levhaBoy == null ? VARSAYILAN_LEVHA_BOY : levhaBoy;
    return new Panel(en, boy, true);
  }

  function metinAnahtar(deger) {
    return typeof deger === "string" ? deger.trim().toLowerCase() : null;
  }

  function damarKilidiMi(parca) {
    if (!parca || parca.damar_kilidi == null) return false;
    var anahtar = metinAnahtar(parca.damar_kilidi);
    if (anahtar !== null) return !SU_YONU_SERBEST[anahtar];
    return !!parca.damar_kilidi;
  }

  function dondurulebilirMi(parca) {
    if (damarKilidiMi(parca)) return false;
    if (parca && parca.dondurulebilir != null) {
      var a = metinAnahtar(parca.dondurulebilir);
      if (a !== null) return !HAYIR[a];
      return !!parca.dondurulebilir;
    }
    if (!parca || parca.su_yonu == null) return true;
    var b = metinAnahtar(parca.su_yonu);
    if (b !== null) return !!SU_YONU_SERBEST[b];
    return !parca.su_yonu;
  }

  function parcaDogrula(parca) {
    var en = parseInt(parca.en, 10);
    var boy = parseInt(parca.boy, 10);
    var adet = parseInt(parca.adet, 10);
    if (!isFinite(en) || !isFinite(boy) || !isFinite(adet)) {
      throw new Error("Parca en, boy ve adet tamsayi olmalidir.");
    }
    if (en <= 0 || boy <= 0) throw new Error("Parca en ve boy 0'dan buyuk olmalidir.");
    if (adet < 0) throw new Error("Parca adet negatif olamaz.");
    var etiket = parca.id != null ? parca.id : parca.etiket;
    return { en: en, boy: boy, adet: adet, dondurulebilir: dondurulebilirMi(parca), etiket: etiket };
  }

  function paneldeSigar(en, boy, panel) {
    if (en > panel.kull_en || boy > panel.kull_boy) return null;
    return [en, boy];
  }

  function kerfTuket(pw, ph, bw, bh, bicak) {
    function eksen(parca, bosluk) {
      var kalan = bosluk - parca;
      if (kalan <= 1e-9) return parca;
      if (kalan >= bicak) return parca + bicak;
      return bosluk;
    }
    return [eksen(pw, bw), eksen(ph, bh)];
  }

  function yonler(en, boy, panel, dondurulebilir, damarKilidi) {
    var adaylar = [[en, boy]];
    if (!damarKilidi && dondurulebilir && !(boy === en)) adaylar.push([boy, en]);
    var liste = [];
    var gorulen = {};
    for (var i = 0; i < adaylar.length; i++) {
      var oturt = paneldeSigar(adaylar[i][0], adaylar[i][1], panel);
      if (!oturt) continue;
      var k = oturt[0] + "," + oturt[1];
      if (gorulen[k]) continue;
      gorulen[k] = 1;
      liste.push(oturt);
    }
    return liste;
  }

  function yonlerOnbellekli(en, boy, panel, dondurulebilir, onbellek) {
    var anahtar = en + "," + boy + "," + dondurulebilir;
    if (!onbellek[anahtar]) onbellek[anahtar] = yonler(en, boy, panel, dondurulebilir, false);
    return onbellek[anahtar];
  }

  function kimlikUret(taban, kopyaNo, adet, sira, kullanilan) {
    var aday;
    if (taban == null || String(taban).trim() === "") {
      aday = "P" + ("000" + sira).slice(-3);
    } else {
      var kok = String(taban).trim();
      aday = adet === 1 ? kok : kok + "-" + kopyaNo;
    }
    var kimlik = aday;
    var ek = 2;
    while (kullanilan[kimlik]) {
      kimlik = aday + "-" + ek;
      ek += 1;
    }
    kullanilan[kimlik] = 1;
    return kimlik;
  }

  function parcayiAc(parcaListesi, panel, panelZorunlu) {
    var tekil = [];
    var kullanilan = {};
    var sira = 0;
    for (var i = 0; i < parcaListesi.length; i++) {
      var p = parcaListesi[i];
      var d = parcaDogrula(p);
      var kilidi = damarKilidiMi(p);
      if (d.adet === 0) continue;
      if (panelZorunlu && !yonler(d.en, d.boy, panel, d.dondurulebilir, kilidi).length) {
        throw new Error(
          "Parca levhaya sigmiyor (su yolu kilitliyse donus yok): en=" + d.en + " boy=" + d.boy
        );
      }
      for (var k = 1; k <= d.adet; k++) {
        sira += 1;
        tekil.push([
          d.en,
          d.boy,
          d.en * d.boy,
          d.dondurulebilir,
          kimlikUret(d.etiket, k, d.adet, sira, kullanilan),
          sira
        ]);
      }
    }
    return tekil;
  }

  function artikKullanilir(w, h, panel) {
    return w >= panel.min_en && h >= panel.min_boy;
  }

  function guillotineBol(bos, w, h, panel) {
    var bx = bos[0];
    var by = bos[1];
    var bw = bos[2];
    var bh = bos[3];
    var sagW = bw - w;
    var altH = bh - h;
    var aday = [];
    if (sagW >= altH) {
      if (sagW > 0) aday.push([bx + w, by, sagW, bh]);
      if (altH > 0) aday.push([bx, by + h, w, altH]);
    } else {
      if (sagW > 0) aday.push([bx + w, by, sagW, h]);
      if (altH > 0) aday.push([bx, by + h, bw, altH]);
    }
    var cikti = [];
    for (var i = 0; i < aday.length; i++) {
      if (artikKullanilir(aday[i][2], aday[i][3], panel)) cikti.push(aday[i]);
    }
    return cikti;
  }

  function ilkSigan(bosluklar, yonListesi) {
    for (var i = 0; i < bosluklar.length; i++) {
      var bw = bosluklar[i][2];
      var bh = bosluklar[i][3];
      for (var j = 0; j < yonListesi.length; j++) {
        var w = yonListesi[j][0];
        var h = yonListesi[j][1];
        if (w <= bw && h <= bh) return [i, w, h];
      }
    }
    return null;
  }

  function enIyiSigan(bosluklar, yonListesi) {
    var enIyi = null;
    for (var i = 0; i < bosluklar.length; i++) {
      var bw = bosluklar[i][2];
      var bh = bosluklar[i][3];
      for (var j = 0; j < yonListesi.length; j++) {
        var w = yonListesi[j][0];
        var h = yonListesi[j][1];
        if (w <= bw && h <= bh) {
          var artik = bw * bh - w * h;
          if (enIyi == null || artik < enIyi[0]) enIyi = [artik, i, w, h];
        }
      }
    }
    if (enIyi == null) return null;
    return [enIyi[1], enIyi[2], enIyi[3]];
  }

  function Levha(panel) {
    this.panel = panel;
    this.bosluklar = [[panel.tiras, panel.tiras, panel.kull_en, panel.kull_boy]];
    this.parcalar = [];
  }

  Levha.prototype.yerlestir = function (en, boy, yonListesi, kip, parcaId, sira) {
    var sonuc = kip === "en_iyi" ? enIyiSigan(this.bosluklar, yonListesi) : ilkSigan(this.bosluklar, yonListesi);
    if (!sonuc) return false;
    var i = sonuc[0];
    var pw = sonuc[1];
    var ph = sonuc[2];
    var bos = this.bosluklar.splice(i, 1)[0];
    var kerf = kerfTuket(pw, ph, bos[2], bos[3], this.panel.bicak);
    this.parcalar.push({
      id: parcaId,
      sira: sira,
      en: en,
      boy: boy,
      x: bos[0],
      y: bos[1],
      w: pw,
      h: ph,
      donduruldu: pw !== en || ph !== boy
    });
    var artiklar = guillotineBol(bos, kerf[0], kerf[1], this.panel);
    for (var k = 0; k < artiklar.length; k++) this.bosluklar.push(artiklar[k]);
    return true;
  };

  function stokHavuzuAc(stokHavuzu) {
    if (stokHavuzu == null) return [];
    if (!Array.isArray(stokHavuzu)) throw new Error("stok_havuzu liste olmalidir.");
    var acik = [];
    for (var i = 0; i < stokHavuzu.length; i++) {
      var kayit = stokHavuzu[i];
      if (!kayit || typeof kayit !== "object") throw new Error("stok kaydi sozluk olmalidir (indeks " + i + ").");
      var en = parseInt(kayit.en, 10);
      var boy = parseInt(kayit.boy, 10);
      var adet = parseInt(kayit.adet, 10);
      if (!isFinite(en) || !isFinite(boy) || !isFinite(adet)) {
        throw new Error("stok_havuzu en, boy ve adet tamsayi olmalidir.");
      }
      if (en <= 0 || boy <= 0) throw new Error("stok en ve boy 0'dan buyuk olmalidir.");
      if (adet < 0) throw new Error("stok adet negatif olamaz.");
      for (var n = 0; n < adet; n++) acik.push(new Levha(new Panel(en, boy, false)));
    }
    return acik;
  }

  function stokDeneSirasi(stokLevhalar, fireKip) {
    if (!fireKip) return stokLevhalar;
    return stokLevhalar.slice().sort(function (a, b) {
      var aa = a.panel.en * a.panel.boy;
      var ba = b.panel.en * b.panel.boy;
      if (aa !== ba) return aa - ba;
      return Math.max(a.panel.en, a.panel.boy) - Math.max(b.panel.en, b.panel.boy);
    });
  }

  function yerlestir(tekil, panel, kip, stokHavuzu, fireKip) {
    var stokLevhalar = stokHavuzuAc(stokHavuzu);
    var standartLevhalar = [];
    var sigmayan = [];
    var yonOnbellek = {};
    for (var t = 0; t < tekil.length; t++) {
      var en = tekil[t][0];
      var boy = tekil[t][1];
      var dondurulebilir = tekil[t][3];
      var parcaId = tekil[t][4];
      var sira = tekil[t][5];
      var yerlesti = false;
      var stokSirasi = stokDeneSirasi(stokLevhalar, fireKip);
      for (var s = 0; s < stokSirasi.length; s++) {
        var levha = stokSirasi[s];
        var yonStok = yonler(en, boy, levha.panel, dondurulebilir, false);
        if (!yonStok.length) continue;
        if (levha.yerlestir(en, boy, yonStok, kip, parcaId, sira)) {
          yerlesti = true;
          break;
        }
      }
      if (!yerlesti && !fireKip) {
        var yonStd = yonlerOnbellekli(en, boy, panel, dondurulebilir, yonOnbellek);
        for (var k = 0; k < standartLevhalar.length; k++) {
          if (standartLevhalar[k].yerlestir(en, boy, yonStd, kip, parcaId, sira)) {
            yerlesti = true;
            break;
          }
        }
        if (!yerlesti) {
          var yeni = new Levha(panel);
          if (!yeni.yerlestir(en, boy, yonStd, kip, parcaId, sira)) {
            throw new Error(
              "Parca levhaya sigmiyor (su yolu kilitliyse donus yok): en=" + en + " boy=" + boy
            );
          }
          standartLevhalar.push(yeni);
          yerlesti = true;
        }
      }
      if (!yerlesti) sigmayan.push({ id: parcaId, en: en, boy: boy, sira: sira });
    }
    var kullanilan = [];
    for (var i = 0; i < stokLevhalar.length; i++) {
      if (stokLevhalar[i].parcalar.length) kullanilan.push(stokLevhalar[i]);
    }
    return { levhalar: kullanilan.concat(standartLevhalar), sigmayan: sigmayan };
  }

  function ayirDikey(parcalar, cx, bicak) {
    var sol = [];
    var sag = [];
    for (var i = 0; i < parcalar.length; i++) {
      var p = parcalar[i];
      if (p.x + p.w <= cx + KESIM_EPS) sol.push(p);
      else if (p.x >= cx + bicak - KESIM_EPS) sag.push(p);
      else return null;
    }
    return [sol, sag];
  }

  function ayirYatay(parcalar, cy, bicak) {
    var ust = [];
    var alt = [];
    for (var i = 0; i < parcalar.length; i++) {
      var p = parcalar[i];
      if (p.y + p.h <= cy + KESIM_EPS) ust.push(p);
      else if (p.y >= cy + bicak - KESIM_EPS) alt.push(p);
      else return null;
    }
    return [ust, alt];
  }

  function kesimKayit(levhaNo, kademe, eksen, konum, once, sonra, sira) {
    return {
      levha: levhaNo,
      sira: sira,
      kademe: kademe,
      eksen: eksen,
      konum: konum,
      parca_id_once: once.map(function (p) { return p.id; }),
      parca_id_sonra: sonra.map(function (p) { return p.id; })
    };
  }

  function benzersizSirali(dizi) {
    var gor = {};
    var cik = [];
    for (var i = 0; i < dizi.length; i++) {
      var v = dizi[i];
      if (gor[v]) continue;
      gor[v] = 1;
      cik.push(v);
    }
    cik.sort(function (a, b) { return a - b; });
    return cik;
  }

  function gecerliKesim(parcalar, kutu, bicak) {
    var kx = kutu[0];
    var ky = kutu[1];
    var kw = kutu[2];
    var kh = kutu[3];
    var adayX = benzersizSirali(parcalar.map(function (p) { return p.x + p.w; }));
    for (var i = 0; i < adayX.length; i++) {
      var cx = adayX[i];
      if (cx <= kx + KESIM_EPS || cx >= kx + kw - KESIM_EPS) continue;
      var ayir = ayirDikey(parcalar, cx, bicak);
      if (!ayir) continue;
      if (ayir[0].length && ayir[1].length) {
        return ["x", cx, ayir[0], ayir[1], [kx, ky, cx - kx, kh], [cx + bicak, ky, kx + kw - (cx + bicak), kh]];
      }
    }
    var adayY = benzersizSirali(parcalar.map(function (p) { return p.y + p.h; }));
    for (var j = 0; j < adayY.length; j++) {
      var cy = adayY[j];
      if (cy <= ky + KESIM_EPS || cy >= ky + kh - KESIM_EPS) continue;
      var ayirY = ayirYatay(parcalar, cy, bicak);
      if (!ayirY) continue;
      if (ayirY[0].length && ayirY[1].length) {
        return ["y", cy, ayirY[0], ayirY[1], [kx, ky, kw, cy - ky], [kx, cy + bicak, kw, ky + kh - (cy + bicak)]];
      }
    }
    return null;
  }

  function ikiKademeYedek(parcalar, levhaNo, kesimler) {
    var satirlar = {};
    for (var i = 0; i < parcalar.length; i++) {
      var y = Math.round(parcalar[i].y * 100) / 100;
      if (!satirlar[y]) satirlar[y] = [];
      satirlar[y].push(parcalar[i]);
    }
    var yler = Object.keys(satirlar).map(Number).sort(function (a, b) { return a - b; });
    for (var k = 0; k < yler.length - 1; k++) {
      var grup = satirlar[yler[k]];
      var cy = grup[0].y + grup[0].h;
      for (var g = 1; g < grup.length; g++) cy = Math.max(cy, grup[g].y + grup[g].h);
      var sonra = [];
      for (var n = k + 1; n < yler.length; n++) sonra = sonra.concat(satirlar[yler[n]]);
      kesimler.push(kesimKayit(levhaNo, 1, "y", cy, grup.slice(), sonra, kesimler.length + 1));
    }
    for (var m = 0; m < yler.length; m++) {
      var sirali = satirlar[yler[m]].slice().sort(function (a, b) { return a.x - b.x; });
      for (var p = 0; p < sirali.length - 1; p++) {
        kesimler.push(
          kesimKayit(levhaNo, 2, "x", sirali[p].x + sirali[p].w, sirali.slice(0, p + 1), sirali.slice(p + 1), kesimler.length + 1)
        );
      }
    }
  }

  function kesimAgaciDoldur(parcalar, kutu, panel, levhaNo, kademe, kesimler) {
    if (parcalar.length <= 1) return;
    var bulunan = gecerliKesim(parcalar, kutu, panel.bicak);
    if (!bulunan) {
      if (kademe === 1) ikiKademeYedek(parcalar, levhaNo, kesimler);
      return;
    }
    var kademeYaz = kademe === 1 ? 1 : 2;
    kesimler.push(kesimKayit(levhaNo, kademeYaz, bulunan[0], bulunan[1], bulunan[2], bulunan[3], kesimler.length + 1));
    kesimAgaciDoldur(bulunan[2], bulunan[4], panel, levhaNo, kademe + 1, kesimler);
    kesimAgaciDoldur(bulunan[3], bulunan[5], panel, levhaNo, kademe + 1, kesimler);
  }

  function kesimAgaci(levhalar) {
    var agac = [];
    for (var no = 0; no < levhalar.length; no++) {
      var levha = levhalar[no];
      var p = levha.panel;
      var kesimler = [];
      kesimAgaciDoldur(levha.parcalar.slice(), [p.tiras, p.tiras, p.kull_en, p.kull_boy], p, no + 1, 1, kesimler);
      for (var i = 0; i < kesimler.length; i++) {
        kesimler[i].sira = i + 1;
        agac.push(kesimler[i]);
      }
    }
    return agac;
  }

  function fireEnvanteri(levhalar) {
    var envanter = [];
    for (var no = 0; no < levhalar.length; no++) {
      var levha = levhalar[no];
      for (var i = 0; i < levha.bosluklar.length; i++) {
        var b = levha.bosluklar[i];
        if (!artikKullanilir(b[2], b[3], levha.panel)) continue;
        envanter.push({ levha: no + 1, en: b[2], boy: b[3], x: b[0], y: b[1] });
      }
    }
    envanter.sort(function (a, b) { return b.en * b.boy - a.en * a.boy; });
    return envanter;
  }

  function senaryoSozluk(levhalar, kullanilanAlan, strateji, panel) {
    var toplam = 0;
    var yerlesim = [];
    for (var i = 0; i < levhalar.length; i++) {
      var p = levhalar[i].panel;
      toplam += p.en * p.boy;
      yerlesim.push({
        levha: i + 1,
        parcalar: levhalar[i].parcalar.slice(),
        panel_en: p.en,
        panel_boy: p.boy,
        kaynak: p.tiras === 0 ? "fire" : "standart"
      });
    }
    var net = toplam - kullanilanAlan;
    return {
      strateji: strateji,
      levha_en: panel.en,
      levha_boy: panel.boy,
      levha_sayisi: levhalar.length,
      kullanilan_alan_mm2: kullanilanAlan,
      toplam_levha_alan_mm2: toplam,
      net_fire_mm2: net,
      fire_yuzde: toplam ? (net / toplam) * 100 : 0,
      yerlesim: yerlesim,
      fire_envanteri: fireEnvanteri(levhalar),
      kesim_agaci: kesimAgaci(levhalar),
      sigmayan: []
    };
  }

  function bosSonuc(panel) {
    return {
      strateji: null,
      levha_en: panel ? panel.en : null,
      levha_boy: panel ? panel.boy : null,
      levha_sayisi: 0,
      kullanilan_alan_mm2: 0,
      toplam_levha_alan_mm2: 0,
      net_fire_mm2: 0,
      fire_yuzde: 0,
      yerlesim: [],
      fire_envanteri: [],
      kesim_agaci: [],
      sigmayan: [],
      alternatif_kalan: 0,
      denenen_strateji: 0
    };
  }

  function levhaImza(levhalar) {
    return JSON.stringify(
      levhalar.map(function (levha) {
        return levha.parcalar
          .map(function (p) { return [p.x, p.y, p.w, p.h]; })
          .sort(function (a, b) {
            for (var i = 0; i < 4; i++) {
              if (a[i] !== b[i]) return a[i] - b[i];
            }
            return 0;
          });
      })
    );
  }

  function karistir(dizi, tohum) {
    var a = dizi.slice();
    var s = tohum >>> 0;
    function rnd() {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    }
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function stratejiAdaylari(tekil) {
    var alanAzalan = tekil.slice().sort(function (a, b) {
      if (a[2] !== b[2]) return b[2] - a[2];
      if (a[0] !== b[0]) return b[0] - a[0];
      return b[1] - a[1];
    });
    var adaylar = [
      ["alan_azalan", alanAzalan, "ilk"],
      ["alan_azalan_en_iyi", alanAzalan.slice(), "en_iyi"],
      [
        "uzun_kenar_azalan",
        tekil.slice().sort(function (a, b) {
          var am = Math.max(a[0], a[1]);
          var bm = Math.max(b[0], b[1]);
          if (am !== bm) return bm - am;
          return b[2] - a[2];
        }),
        "ilk"
      ],
      [
        "boy_azalan",
        tekil.slice().sort(function (a, b) {
          if (a[1] !== b[1]) return b[1] - a[1];
          return b[2] - a[2];
        }),
        "ilk"
      ],
      [
        "en_azalan",
        tekil.slice().sort(function (a, b) {
          if (a[0] !== b[0]) return b[0] - a[0];
          return b[2] - a[2];
        }),
        "ilk"
      ]
    ];
    for (var tohum = 1; tohum <= 3; tohum++) {
      adaylar.push(["karistir_" + tohum, karistir(tekil, tohum), "ilk"]);
    }
    return adaylar.slice(0, MAKS_STRATEJI_SAYISI);
  }

  function hesapla(parcaListesi, levhaEn, levhaBoy, stokHavuzu, fireKip, senaryoYaz) {
    var panel = panelKur(levhaEn, levhaBoy);
    if (parcaListesi == null) throw new Error("Parca listesi gerekli.");
    var tekil = parcayiAc(parcaListesi, panel, !fireKip);
    if (!tekil.length) {
      if (senaryoYaz !== false) SENARYO_HAVUZU = [];
      return bosSonuc(panel);
    }
    var adaylar = stratejiAdaylari(tekil);
    var gorulen = {};
    var sirali = [];
    for (var i = 0; i < adaylar.length; i++) {
      var ad = adaylar[i][0];
      var sira = adaylar[i][1];
      var kip = adaylar[i][2];
      var yer = yerlestir(sira, panel, kip, stokHavuzu, fireKip);
      var imza = levhaImza(yer.levhalar) + "|" + yer.sigmayan.map(function (p) { return p.id; }).join(",");
      if (gorulen[imza]) continue;
      var kullanilan = 0;
      for (var L = 0; L < yer.levhalar.length; L++) {
        var ps = yer.levhalar[L].parcalar;
        for (var q = 0; q < ps.length; q++) kullanilan += ps[q].en * ps[q].boy;
      }
      var soz = senaryoSozluk(yer.levhalar, kullanilan, ad, panel);
      soz.sigmayan = yer.sigmayan;
      gorulen[imza] = 1;
      sirali.push(soz);
      if (typeof console !== "undefined" && kok.CEP_MOTOR_DEBUG) {
        console.log(ad, yer.levhalar.length, yer.levhalar.reduce(function (n, L) { return n + L.parcalar.length; }, 0), yer.sigmayan.length);
      }
    }
    sirali.sort(function (a, b) {
      var as = (a.sigmayan || []).length;
      var bs = (b.sigmayan || []).length;
      if (as !== bs) return as - bs;
      if (a.levha_sayisi !== b.levha_sayisi) return a.levha_sayisi - b.levha_sayisi;
      if (a.net_fire_mm2 !== b.net_fire_mm2) return a.net_fire_mm2 - b.net_fire_mm2;
      return String(a.strateji).localeCompare(String(b.strateji));
    });
    var enIyi = JSON.parse(JSON.stringify(sirali[0]));
    if (senaryoYaz !== false) {
      SENARYO_HAVUZU = sirali.slice(1).map(function (s) { return JSON.parse(JSON.stringify(s)); });
      enIyi.alternatif_kalan = SENARYO_HAVUZU.length;
    } else {
      enIyi.alternatif_kalan = 0;
    }
    enIyi.denenen_strateji = adaylar.length;
    return enIyi;
  }

  function sonrakiSenaryo() {
    if (!SENARYO_HAVUZU.length) return { uyari: UYARI_HAVUZ_BOS, senaryo: null };
    var senaryo = SENARYO_HAVUZU.shift();
    senaryo.alternatif_kalan = SENARYO_HAVUZU.length;
    return { uyari: null, senaryo: senaryo };
  }

  kok.CepMotor = {
    hesapla: hesapla,
    sonrakiSenaryo: sonrakiSenaryo
  };
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this);
