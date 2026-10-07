(function () {
  var Z = window.ZeminMotor;
  var D = window.DuvarMotor;
  var M = window.MobilyaMotor;
  var mobilyaCfg = null;
  var mobilyaKartYazi = "";
  var mobilyaGovde = null;
  var durum = {
    hazir: false, oda: null, zemin: null, duvarlar: [], elemanlar: [],
    yasak_kutular: [], pahlar: [], moduller: [], aktif_duvar: 1, olcu_yon: "sol",
    hazirlik_onay: false, hatalar: []
  };
  var zeminDurum = Z ? Z.bos() : null;
  var ekListe = [];
  var lIc1 = 0;
  var lIc2 = 0;
  var O = window.MagiOlcu;
  var sahne = document.getElementById("duvarSahne").getContext("2d");
  var durumYazi = document.getElementById("duvarDurum");
  var rafInceEl = false;

  function rafInceAktif() {
    var motor = document.getElementById("levhaCamMotor");
    return !!rafInceEl || !!(motor && motor.classList.contains("acik"));
  }

  function rafInceYaz(on) {
    rafInceEl = !!on;
    try {
      document.dispatchEvent(new CustomEvent("magi-raf-ince", { detail: { ince: rafInceAktif() } }));
    } catch (e) { /* */ }
  }

  var VURGU = /(^|[^A-Za-zÇĞİÖŞÜçğıöşü])(yükseltiyi|yükselti|sifonu|sifon|eşiği|eşik|çıkıntıyı|çıkıntı|girintiyi|girinti|en|boy|duvar|yükseklik|derinlik)(?=$|[^A-Za-zÇĞİÖŞÜçğıöşü])/gi;

  function vurgula(metin) {
    var guvenli = String(metin)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return guvenli.replace(VURGU, "$1<b>$2</b>");
  }

  function yaz(metin, hata) {
    durumYazi.textContent = metin || "";
    durumYazi.classList.toggle("hata", !!hata);
    var ps = document.getElementById("perdeSoru");
    var ph = document.getElementById("perdeHata");
    if (metin && hata) {
      if (ph) ph.textContent = metin;
    } else if (metin) {
      if (ps) ps.innerHTML = vurgula(metin);
      if (ph) ph.textContent = "";
    }
    var c = document.getElementById("programCumle");
    if (c && metin) {
      c.innerHTML = vurgula(metin);
      c.classList.toggle("talimat", soruAdim === "kapi_surukle" || soruAdim === "ek_yerlestir" || soruAdim === "yukselti_surukle" || soruAdim === "sifon_surukle" || soruAdim === "gonye_duvar" || soruAdim === "gonye_c1" || soruAdim === "gonye_c2" || soruAdim === "duvar_sol" || soruAdim === "duvar_no" || soruAdim === "duvar_gerec" || soruAdim === "mutfak_sekil" || soruAdim === "mutfak_duvar");
    }
    var sk = document.getElementById("solKomut");
    if (sk) sk.textContent = metin || "";
    adimYay(!!hata);
  }

  function duvarElemanSay(no) {
    var n = 0, i, e, liste = (durum && durum.elemanlar) || [];
    for (i = 0; i < liste.length; i++) {
      e = liste[i];
      if (e && Number(e.duvar_no) === Number(no)) n += 1;
    }
    return n;
  }

  function mobilyaDuvarNo() {
    var no = (duvarTur && duvarTur.no) || (durum && durum.aktif_duvar) || 1;
    if (orulenNos && orulenNos.length && orulenNos.indexOf(no) < 0) no = orulenNos[0];
    return no;
  }

  function mobilyaDuvarEn(no) {
    var i, d, liste = (durum && durum.duvarlar) || [];
    for (i = 0; i < liste.length; i++) {
      d = liste[i];
      if (d && Number(d.no) === Number(no) && d.en > 0) return d.en;
    }
    return 0;
  }

  var MOBILYA_AD = {
    yan: "Yan", alt: "Alt", ust: "Üst", dikme: "Dikme",
    kapak: "Kapak", raf: "Raf", arkalik: "Arkalık", menteşe: "Menteşe",
    kasa: "Kasa", dolgu: "Dolgu"
  };
  var MOBILYA_IKON = {
    yan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="4" height="16"/><rect x="16" y="4" width="4" height="16"/></svg>',
    alt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="15" width="16" height="4"/></svg>',
    ust: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="5" width="16" height="4"/></svg>',
    dikme: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="10" y="4" width="4" height="16"/></svg>',
    kapak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
    raf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="16"/><path d="M6 12 H18"/></svg>',
    arkalik: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="16" rx="1"/></svg>',
    menteşe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="10" y="3" width="4" height="6" rx="1"/><rect x="10" y="15" width="4" height="6" rx="1"/></svg>',
    kasa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="6" width="7" height="12"/><rect x="13" y="6" width="7" height="12"/></svg>',
    dolgu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="9" y="4" width="6" height="16"/></svg>'
  };
  var MOBILYA_TIP = "baza";
  var MOBILYA_TIPLER = [
    { tip: "baza", ad: "Baza", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="11" width="14" height="8"/><path d="M7 19 V21 M17 19 V21"/></svg>' },
    { tip: "duvar", ad: "Duvar", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="4" width="14" height="8"/></svg>' },
    { tip: "boy", ad: "Boy", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="3" width="10" height="18"/></svg>' }
  ];

  function mobilyaSatirKapat() {
    var satir = document.getElementById("modulMobilyaSatir");
    var btn = document.getElementById("modulMobilya");
    var vardi = !!mobilyaGovde;
    if (satir) {
      satir.classList.remove("acik");
      satir.textContent = "";
    }
    if (btn) {
      btn.classList.remove("acik");
      btn.setAttribute("aria-expanded", "false");
    }
    mobilyaGovde = null;
    if (soruAdim === "mobilya") soruAdim = "duvar_kilit";
    if (vardi) ciz();
  }

  function modulMobilyaCiz() {
    var satir = document.getElementById("modulMobilyaSatir");
    var i, t, html;
    if (!satir) return;
    html = "";
    for (i = 0; i < MOBILYA_TIPLER.length; i++) {
      t = MOBILYA_TIPLER[i];
      html += '<button type="button" data-mobilya-tip="' + t.tip + '" class="' + (MOBILYA_TIP === t.tip ? "secili" : "") + '" aria-label="' + t.ad + '">' + t.svg + t.ad + "</button>";
    }
    satir.innerHTML = html;
    satir.classList.add("acik");
  }

  var mobilyaKatalog = null;

  function mobilyaTurKur(cfg) {
    var no = mobilyaDuvarNo();
    var duvarEn = mobilyaDuvarEn(no);
    var odaYuk = (durum.oda && (durum.oda.yukseklik || durum.oda.yuk)) || 0;
    var olcu, boy, derinlik, siraHesap;
    if (!(duvarEn > 0)) return { hatalar: ["Duvar eni yok."], satir: [], parcalar: [] };
    if (!mobilyaKatalog) return { hatalar: ["Katalog yok."], satir: [], parcalar: [] };
    olcu = M.tip_olcu(cfg, MOBILYA_TIP, odaYuk);
    if (!olcu.hazir) {
      return {
        hatalar: olcu.hatalar && olcu.hatalar[0] ? olcu.hatalar : ["Hesap yok."],
        satir: [],
        parcalar: []
      };
    }
    boy = olcu.yukseklik;
    derinlik = cfg.modul_derinlik;
    siraHesap = M.sira_kur(cfg, duvarEn, boy, derinlik, MOBILYA_TIP, mobilyaKatalog);
    if (!siraHesap.hazir) {
      return {
        hatalar: siraHesap.hatalar && siraHesap.hatalar[0] ? siraHesap.hatalar : ["Hesap yok."],
        satir: [],
        parcalar: []
      };
    }
    return {
      hatalar: [],
      satir: [],
      parcalar: siraHesap.parcalar,
      no: no,
      boy: boy,
      derinlik: derinlik,
      yerden: olcu.yerden
    };
  }

  function mobilyaTurCiz(cfg) {
    var tur = mobilyaTurKur(cfg);
    var btn = document.getElementById("modulMobilya");
    mobilyaGovde = null;
    if (tur.hatalar.length) {
      mobilyaKartYazi = "";
      mobilyaSatirKapat();
      yaz(tur.hatalar[0], true);
      return;
    }
    mobilyaGovde = {
      parcalar: tur.parcalar,
      kenar: MOTOR_KENAR[tur.no] || "on",
      ayak: tur.yerden,
      derinlik: tur.derinlik
    };
    mobilyaKartYazi = String(tur.satir.length);
    modulMobilyaCiz();
    if (btn) {
      btn.classList.add("acik");
      btn.setAttribute("aria-expanded", "true");
    }
    yaz("Bir tur çizdim usta, bak.", false);
  }

  function mobilyaAc() {
    if (!M) {
      yaz("Mobilya motoru yok.", true);
      return;
    }
    panellerKapa();
    soruAdim = "mobilya";
    if (mobilyaCfg && mobilyaKatalog) {
      mobilyaTurCiz(mobilyaCfg);
      ayarYaz();
      ciz();
      return;
    }
    Promise.all([
      fetch("/mobilya/varsayilan_config.json", { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("ayar");
        return r.json();
      }),
      fetch("/mobilya/katalog_arsiv.json", { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("katalog");
        return r.json();
      })
    ]).then(function (ikisi) {
      mobilyaCfg = M.from_dict(ikisi[0]);
      mobilyaKatalog = ikisi[1];
      if (soruAdim !== "mobilya") return;
      mobilyaTurCiz(mobilyaCfg);
      ayarYaz();
      ciz();
    }).catch(function () {
      mobilyaKartYazi = "";
      mobilyaSatirKapat();
      yaz("Mobilya ayarı yok.", true);
      ayarYaz();
      ciz();
    });
  }

  function adimYay(hata) {
    var sahneEl = document.getElementById("adimSahne");
    if (!sahneEl || !sahneEl.classList.contains("acik")) return;
    var ad = String((document.getElementById("musteriAd") || {}).value || "").trim();
    var soy = String((document.getElementById("musteriSoyad") || {}).value || "").trim();
    var mus = (ad + " " + soy).trim();
    if (mus.length > 12) mus = ad || mus.slice(0, 12);
    var olcu = taslakOlcu();
    var duvarlar = [];
    var i, no, kenar;
    if (orulenNos && orulenNos.length) {
      for (i = 0; i < orulenNos.length; i++) {
        no = orulenNos[i];
        kenar = MOTOR_KENAR[no] || "on";
        duvarlar.push({ no: no, ad: duvarDYazi(kenar), n: duvarElemanSay(no) });
      }
    }
    try {
      document.dispatchEvent(new CustomEvent("magi-adim", {
        detail: {
          soruAdim: soruAdim,
          motorSayfa: motorSayfa,
          zeminKilit: !!(zeminDurum && zeminDurum.kilit),
          duvarKilit: !!(durum && durum.hazirlik_onay) || soruAdim === "duvar_kilit",
          enYazi: O && olcu.en ? O.goster(olcu.en) : "",
          boyYazi: O && olcu.boy ? O.goster(olcu.boy) : "",
          anket: { oda: zeminAnket.oda, yukselti: zeminAnket.yukselti, yukseltiSekil: zeminAnket.yukseltiSekil, sifon: zeminAnket.sifon },
          isAdi: isSecili === "Ozel" ? (isOzelYazi || "Özel") : (isSecili || "İş"),
          musteri: mus,
          mutfakSekil: mutfakSekil || "",
          duvarlar: duvarlar,
          aktifDuvar: (duvarTur && duvarTur.no) || "",
          hata: !!hata,
          ince: rafInceAktif(),
          mobilyaYazi: mobilyaKartYazi
        }
      }));
    } catch (e) { /* */ }
  }

  function taslakOlcu() {
    var gk = gonyeKutu();
    if (gk) return gk;
    if (zeminDurum && zeminDurum.oda && zeminDurum.oda.en > 0 && zeminDurum.oda.boy > 0) {
      return { en: zeminDurum.oda.en, boy: zeminDurum.oda.boy };
    }
    var en = parseFloat(O.mmAl(document.getElementById("odaEn").value));
    var boy = parseFloat(O.mmAl(document.getElementById("odaBoy").value));
    if (!(en > 0) || !(boy > 0)) return { en: 4000, boy: 3000 };
    return { en: en, boy: boy };
  }

  function zeminKaydet() {
    try { localStorage.setItem("magi_zemin_durum", JSON.stringify(zeminDurum)); } catch (e) { /* */ }
    turKaydet();
  }

  function zeminAl(son) {
    zeminDurum = son;
    zeminKaydet();
    ekListe = (son.ekler || []).slice();
    if (son.oda && son.oda.en > 0) document.getElementById("odaEn").value = O.goster(son.oda.en);
    if (son.oda && son.oda.boy > 0) document.getElementById("odaBoy").value = O.goster(son.oda.boy);
    if (!son.hazir) {
      yaz(son.soz || "Zemin yazılamadı.", true);
      return false;
    }
    return true;
  }

  var IS_KAYIT_ANAHTAR = "magi_is_kayitlari";

  function turSil() {
    /* Eski tek kayıt ve diğer işler durur. */
  }

  function isKayitOku() {
    if (window.MagiDepo) return window.MagiDepo.isler();
    try {
      var k = JSON.parse(localStorage.getItem(IS_KAYIT_ANAHTAR) || "null");
      if (!k || typeof k !== "object") return {};
      return k;
    } catch (e) {
      return {};
    }
  }

  function isAnahtar() {
    if (!kasaAktifId || !isSecili) return "";
    return kasaAktifId + "|" + isSecili + "|" + (isSecili === "Ozel" ? isOzelYazi : "");
  }

  function turPaket() {
    return {
      zemin: zeminDurum,
      yerlesim: yerlesim,
      durum: {
        hazir: durum.hazir,
        oda: durum.oda,
        duvarlar: durum.duvarlar,
        elemanlar: durum.elemanlar,
        yasak_kutular: durum.yasak_kutular,
        pahlar: durum.pahlar,
        moduller: durum.moduller,
        aktif_duvar: durum.aktif_duvar,
        olcu_yon: durum.olcu_yon,
        hazirlik_onay: durum.hazirlik_onay,
        zemin_kilit: durum.zemin_kilit
      },
      duvarTur: duvarTur,
      soruAdim: soruAdim,
      yerlesimKilit: yerlesimKilit,
      odaSaplon: odaSaplon,
      kapiKenar: kapiKenar,
      mutfakSekil: mutfakSekil,
      orulenNos: orulenNos,
      duvarOlcu: duvarOlcu,
      duvarYuk: duvarYuk,
      zeminAnket: zeminAnket,
      ekListe: ekListe,
      gonyePts: gonyePts,
      gonyeOlcu: gonyeOlcu,
      gonyeIx: gonyeIx,
      gonyeKenarlar: gonyeKenarlar,
      yorunge: yorunge,
      motorSayfa: motorSayfa,
      camSeciliTip: camSeciliTip,
      duvarSoruAdim: duvarSoruAdim
    };
  }

  function turKaydet() {
    var ana = isAnahtar();
    if (!ana) return;
    if (window.MagiDepo) {
      window.MagiDepo.isYaz(ana, turPaket()).catch(function () {
        yaz("Kayıt yazılamadı usta.", true);
      });
      return;
    }
    try {
      var hepsi = isKayitOku();
      hepsi[ana] = turPaket();
      localStorage.setItem(IS_KAYIT_ANAHTAR, JSON.stringify(hepsi));
    } catch (e) { /* */ }
  }

  function muhurKaydet(asama) {
    var ana = isAnahtar();
    if (!ana || !window.MagiDepo || !window.MagiDepo.muhurYaz) return;
    window.MagiDepo.muhurYaz(ana, asama, {
      usta: ustaAnahtar(profilOku()),
      musteriId: kasaAktifId,
      isAdi: isSecili === "Ozel" ? isOzelYazi : isSecili
    }, turPaket()).catch(function () {
      yaz("Mühür kaydı yazılamadı usta.", true);
    });
  }

  var islemYuklemede = false;
  var islemDepo = {
    zemin: { yigin: [], ix: -1 },
    duvar: { yigin: [], ix: -1 }
  };

  function islemKova() {
    return islemDepo[motorSayfa] || islemDepo.zemin;
  }

  function islemPaket() {
    return {
      camSeciliTip: camSeciliTip,
      duvarSecKenar: duvarSecKenar,
      duvarPanel: duvarPanel,
      kapiTaslak: kapiTaslak,
      seciliIx: seciliIx,
      gonyeIx: gonyeIx,
      gonyeKenarlar: gonyeKenarlar,
      duvarSoruAdim: duvarSoruAdim,
      p: turPaket()
    };
  }

  function islemJson(pkt) {
    var k;
    try {
      k = JSON.parse(JSON.stringify(pkt));
    } catch (e) {
      return "";
    }
    if (k.p) k.p.yorunge = null;
    return JSON.stringify(k);
  }

  function islemKaydet() {
    var kova, pkt, js;
    if (islemYuklemede) return;
    if (typeof acikAdim === "function" && acikAdim() !== "adimSahne") return;
    kova = islemKova();
    pkt = islemPaket();
    js = islemJson(pkt);
    if (!js) return;
    if (kova.ix >= 0 && islemJson(kova.yigin[kova.ix]) === js) return;
    kova.yigin = kova.yigin.slice(0, kova.ix + 1);
    try {
      kova.yigin.push(JSON.parse(JSON.stringify(pkt)));
    } catch (e2) {
      return;
    }
    if (kova.yigin.length > 80) kova.yigin.shift();
    kova.ix = kova.yigin.length - 1;
    turKaydet();
  }

  function islemDepoSifirla() {
    islemDepo = {
      zemin: { yigin: [], ix: -1 },
      duvar: { yigin: [], ix: -1 }
    };
  }

  function islemDurumYaz(k) {
    zeminDurum = k.zemin;
    yerlesim = k.yerlesim || [];
    ekListe = k.ekListe || [];
    if (k.durum) {
      durum.hazir = k.durum.hazir;
      durum.oda = k.durum.oda;
      durum.duvarlar = k.durum.duvarlar || [];
      durum.elemanlar = k.durum.elemanlar || [];
      durum.yasak_kutular = k.durum.yasak_kutular || [];
      durum.pahlar = k.durum.pahlar || [];
      durum.moduller = k.durum.moduller || [];
      durum.aktif_duvar = k.durum.aktif_duvar || 1;
      durum.olcu_yon = k.durum.olcu_yon || "sol";
      durum.hazirlik_onay = !!k.durum.hazirlik_onay;
      durum.zemin_kilit = !!k.durum.zemin_kilit;
    }
    durum.zemin = zeminDurum;
    duvarTur = k.duvarTur || duvarTur;
    soruAdim = k.soruAdim || soruAdim;
    yerlesimKilit = !!k.yerlesimKilit;
    odaSaplon = k.odaSaplon || odaSaplon;
    kapiKenar = k.kapiKenar || null;
    mutfakSekil = k.mutfakSekil || "";
    orulenNos = Array.isArray(k.orulenNos) ? k.orulenNos : orulenNos;
    duvarOlcu = (k.duvarOlcu && typeof k.duvarOlcu === "object") ? k.duvarOlcu : {};
    duvarYuk = k.duvarYuk > 0 ? k.duvarYuk : 0;
    zeminAnket = k.zeminAnket || zeminAnket;
    gonyePts = k.gonyePts || null;
    gonyeOlcu = k.gonyeOlcu || gonyeOlcu;
    if (k.gonyeIx != null) gonyeIx = k.gonyeIx;
    if (k.gonyeKenarlar) gonyeKenarlar = k.gonyeKenarlar;
    if (k.yorunge) yorunge = k.yorunge;
    if (duvarYuk > 0 && durum.oda) {
      durum.oda.yuk = duvarYuk;
      durum.oda.yukseklik = duvarYuk;
    }
  }

  function islemSahneYenile() {
    cepheGizle();
    if (motorSayfa === "duvar") {
      if (soruAdim === "mobilya") {
        mobilyaAc();
        return;
      }
      if (durum.hazirlik_onay || soruAdim === "duvar_kilit") {
        panellerKapa();
        yaz("Duvar.", false);
      } else if (soruAdim === "duvar_sol") {
        soruAc("duvar_sol", duvarTur.yon === "sag" ? "Sağdan kaç?" : "Soldan kaç?");
      } else if (String(soruAdim).indexOf("duvar") === 0 || String(soruAdim).indexOf("mutfak") === 0) {
        anketAc(soruAdim);
      } else {
        panellerKapa();
        yaz("Duvar.", false);
      }
      ayarYaz();
      ciz();
      return;
    }
    if (soruAdim === "en") soruAc("en", "Oda en kaç?");
    else if (soruAdim === "boy") soruAc("boy", "Oda boy kaç?");
    else if (soruAdim === "kapi_surukle") kapiSurukleGoster();
    else if (soruAdim === "oda_tip" || soruAdim === "yukselti" || soruAdim === "sifon") anketAc(soruAdim);
    else if (soruAdim === "yukselti_surukle") yukseltiSurukleGoster();
    else if (soruAdim === "sifon_surukle") sifonSurukleGoster();
    else if (soruAdim === "gonye_duvar") gonyeDuvarSor();
    else if (soruAdim === "gonye_c1") gonyeCaprazAc(1);
    else if (soruAdim === "gonye_c2") gonyeCaprazAc(2);
    else if (soruAdim === "ek_en") {
      var ekTip = (zeminDurum && zeminDurum.taslak) ? zeminDurum.taslak.tip : "";
      soruAc("ek_en", (ekTip === "oyuk" ? "Girinti" : "Çıkıntı") + " en (kenar boyunca) kaç?");
    } else if (soruAdim === "ek_boy") soruAc("ek_boy", "Ek boy (derinlik) kaç?");
    else if (soruAdim === "ek_yerlestir") {
      panellerKapa();
      yaz("Kenara sürükle bırak usta", false);
    } else if (soruAdim === "birak") zeminUygulaAc();
    else {
      panellerKapa();
      if (zeminDurum && zeminDurum.kilit) {
        var uy = document.getElementById("odaUygula");
        if (uy) uy.style.display = "flex";
      }
      yaz("Zemin.", false);
    }
    ayarYaz();
    ciz();
  }

  function islemUygula(pkt) {
    if (!pkt || !pkt.p) return;
    islemYuklemede = true;
    islemDurumYaz(pkt.p);
    camSeciliTip = pkt.camSeciliTip || "";
    duvarSecKenar = pkt.duvarSecKenar || "";
    duvarPanel = pkt.duvarPanel || "";
    kapiTaslak = pkt.kapiTaslak || null;
    seciliIx = pkt.seciliIx != null ? pkt.seciliIx : -1;
    gonyeIx = pkt.gonyeIx || 0;
    if (pkt.gonyeKenarlar) gonyeKenarlar = pkt.gonyeKenarlar;
    duvarSoruAdim = pkt.duvarSoruAdim || "";
    islemSahneYenile();
    islemYuklemede = false;
  }

  function islemOnce() {
    var kova = islemKova();
    var hedef;
    if (kova.ix <= 0) {
      yaz("Bu sayfada önceki yok usta.", true);
      return;
    }
    hedef = kova.yigin[kova.ix - 1];
    if (zeminDurum && zeminDurum.kilit && !(hedef && hedef.p && hedef.p.zemin && hedef.p.zemin.kilit)) {
      yaz("Zemin mühürlü usta.", true);
      return;
    }
    if (durum.hazirlik_onay && !(hedef && hedef.p && hedef.p.durum && hedef.p.durum.hazirlik_onay)) {
      yaz("Duvar kilitli usta.", true);
      return;
    }
    kova.ix -= 1;
    islemUygula(hedef);
  }

  function islemIleriYap() {
    var kova = islemKova();
    if (kova.ix < 0 || kova.ix >= kova.yigin.length - 1) {
      yaz("Bu sayfada sonraki yok usta.", true);
      return;
    }
    kova.ix += 1;
    islemUygula(kova.yigin[kova.ix]);
  }

  var yerlesim = [];
  var suruklenen = null;
  var tasimaIx = -1;
  var yerlesimKilit = false;
  var sonCam = null;
  var onizleme = null;
  var onizlemeEk = null;
  var seciliIx = -1;

  function mmSay(v, def) {
    var n = parseFloat(v);
    return n > 0 ? n : def;
  }

  function ustaVeri() {
    try {
      var p = JSON.parse(localStorage.getItem("magi_usta_profil") || "null") || {};
      var t = String(p.telefon || "").replace(/\D/g, "");
      var ana = t || String(p.ad || "").trim().toLowerCase() || "varsayilan";
      var kasa = JSON.parse(localStorage.getItem("magi_atolye_kasa") || "null") || {};
      var u = (kasa.ustalar && kasa.ustalar[ana]) || {};
      return u;
    } catch (e) {
      return {};
    }
  }

  var camOlcek = 1;
  var camX = 0;
  var camY = 0;
  var yorunge = { yaw: 0.72, pitch: 0.48, uzak: 0 };
  var orbitSuruk = null;
  var elemanSuruk = null;
  var cepheMod = null;
  var cepheTut = null;
  var Ciz = window.VitrinCizKur({
    get sahne() { return sahne; },
    get O() { return O; },
    taslakOlcu: function () { return taslakOlcu(); },
    get camOlcek() { return camOlcek; },
    get camX() { return camX; },
    get camY() { return camY; },
    get yorunge() { return yorunge; },
    get durum() { return durum; },
    get motorSayfa() { return motorSayfa; },
    get yerlesim() { return yerlesim; },
    get onizleme() { return onizleme; },
    get onizlemeEk() { return onizlemeEk; },
    get seciliIx() { return seciliIx; },
    get zeminDurum() { return zeminDurum; },
    get ekListe() { return ekListe; },
    get lIc1() { return lIc1; },
    get lIc2() { return lIc2; },
    get gonyePts() { return gonyePts; },
    get odaSaplon() { return odaSaplon; },
    get soruAdim() { return soruAdim; },
    get duvarSecKenar() { return duvarSecKenar; },
    get camSeciliTip() { return camSeciliTip; },
    get kapiKenar() { return kapiKenar; },
    get gonyeKenarlar() { return gonyeKenarlar; },
    get gonyeIx() { return gonyeIx; },
    cetvelGerec: function () { return cetvelGerec(); },
    duvarDYazi: function (kenar) { return duvarDYazi(kenar); },
    duvarOruluKenar: function (kenar) { return duvarOruluKenar(kenar); },
    duvarKalinlikKenar: function (kenar) { return duvarKalinlikHazir(kenar); },
    mobilyaGovde: function () { return mobilyaGovde; },
    gonyeCaprazUcu: function (n, en, boy) { return gonyeCaprazUcu(n, en, boy); },
    gonyeKenarUcu: function (kenar, en, boy) { return gonyeKenarUcu(kenar, en, boy); },
    get cepheMod() { return cepheMod; },
    setSonCam: function (cam) { sonCam = cam; }
  });

  function kusHarita() {
    return Ciz.kusHarita();
  }

  var yukseltiEkle = false;
  var yukseltiYedek = null;
  var yukseltiSecIx = -1;

  function yukseltiKopya(g) {
    return JSON.parse(JSON.stringify(g));
  }

  function yukseltiDuvarBoyu(kenar, en, boy) {
    return (kenar === 0 || kenar === 2) ? en : boy;
  }

  function yukseltiAlong(kenar, x, z) {
    return (kenar === 0 || kenar === 2) ? x : z;
  }

  function yukseltiBas(g) {
    return (g.kenar === 0 || g.kenar === 2) ? g.x : g.z;
  }

  function yukseltiDerinlik(g) {
    return (g.kenar === 0 || g.kenar === 2) ? g.boy : g.en;
  }

  function yukseltiKutuBiner(a, b) {
    return a.x < b.x + b.en - 0.5 && b.x < a.x + a.en - 0.5 &&
      a.z < b.z + b.boy - 0.5 && b.z < a.z + a.boy - 0.5;
  }

  function yukseltiKoseKes(yeni, en, boy) {
    var wall = yukseltiDuvarBoyu(yeni.kenar, en, boy);
    var startK = (yeni.kenar === 0 || yeni.kenar === 2) ? 3 : 0;
    var endK = (yeni.kenar === 0 || yeni.kenar === 2) ? 1 : 2;
    var startPay = 0;
    var endPay = 0;
    var i, g;
    for (i = 0; i < yerlesim.length; i++) {
      g = yerlesim[i];
      if (g.tip !== "yukselti" || g === yeni) continue;
      if (g.kenar === startK) startPay = Math.max(startPay, yukseltiDerinlik(g));
      if (g.kenar === endK) endPay = Math.max(endPay, yukseltiDerinlik(g));
    }
    var uz = wall - startPay - endPay;
    if (uz < 1) uz = 1;
    yukseltiKoy(yeni, startPay, uz, en, boy);
  }

  function yukseltiKenardakiler(kenar) {
    var out = [];
    var i;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === "yukselti" && yerlesim[i].kenar === kenar) out.push(yerlesim[i]);
    }
    return out;
  }

  function yukseltiKoy(g, bas, uz, en, boy) {
    var dd = g.p.derinlik > 0 ? g.p.derinlik : 600;
    uz = Math.max(1, Math.round(uz));
    g.p.uzunluk = uz;
    if (g.kenar === 0 || g.kenar === 2) {
      g.en = Math.min(uz, en);
      g.boy = Math.min(dd, boy);
      g.x = Math.max(0, Math.min(en - g.en, Math.round(bas)));
      g.z = g.kenar === 0 ? 0 : Math.max(0, boy - g.boy);
    } else {
      g.boy = Math.min(uz, boy);
      g.en = Math.min(dd, en);
      g.z = Math.max(0, Math.min(boy - g.boy, Math.round(bas)));
      g.x = g.kenar === 3 ? 0 : Math.max(0, en - g.en);
    }
  }

  function yukseltiCiftKilitle(eski, yeni, birak, en, boy) {
    var wall = yukseltiDuvarBoyu(yeni.kenar, en, boy);
    var yeniUz = yeni.p.uzunluk > 0 ? yeni.p.uzunluk : 600;
    if (yeniUz >= wall) yeniUz = Math.max(1, Math.round(wall / 2));
    var eskiUz = wall - yeniUz;
    if (eskiUz < 1) {
      yeniUz = wall - 1;
      eskiUz = 1;
    }
    var along = yukseltiAlong(yeni.kenar, birak.x, birak.z);
    var grup = "yk" + yeni.kenar;
    if (along < wall / 2) {
      yukseltiKoy(yeni, 0, yeniUz, en, boy);
      yukseltiKoy(eski, yeniUz, eskiUz, en, boy);
    } else {
      yukseltiKoy(eski, 0, eskiUz, en, boy);
      yukseltiKoy(yeni, eskiUz, yeniUz, en, boy);
    }
    eski.kilit = true;
    yeni.kilit = true;
    eski.grup = grup;
    yeni.grup = grup;
  }

  function yukseltiIkinciHazirla(mm) {
    yukseltiYedektenKur();
    var o = taslakOlcu();
    var taslak = hizala("yukselti", mm.x, mm.z, { p: { uzunluk: 600 } });
    var ayni = yukseltiKenardakiler(taslak.kenar);
    if (ayni.length >= 2) return { dolu: true, parca: null, cift: false };
    if (ayni.length === 1) {
      yukseltiCiftKilitle(ayni[0], taslak, mm, o.en, o.boy);
      return { dolu: false, parca: taslak, cift: true };
    }
    var parca = hizala("yukselti", mm.x, mm.z);
    yukseltiKoseKes(parca, o.en, o.boy);
    return { dolu: false, parca: parca, cift: false };
  }

  function yukseltiNoVer(g) {
    if (g.yno > 0) return;
    var m = 0, i;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === "yukselti" && yerlesim[i].yno > m) m = yerlesim[i].yno;
    }
    g.yno = m + 1;
  }

  function yukseltiAd(g) {
    return "Y" + (g.yno || 1) + " " + (GONYE_AD[["on", "sag", "arka", "sol"][g.kenar]] || "");
  }

  function yukseltiUcaGore(g, uz, en, boy, yon) {
    var wall = yukseltiDuvarBoyu(g.kenar, en, boy);
    var bas = yukseltiBas(g);
    var cur = (g.kenar === 0 || g.kenar === 2) ? g.en : g.boy;
    if (yon === "son" || (yon !== "bas" && bas > 0.5 && bas + cur >= wall - 0.5)) yukseltiKoy(g, bas + cur - uz, uz, en, boy);
    else yukseltiKoy(g, bas, uz, en, boy);
  }

  function yukseltiSekilKenarlar(sekil, mm, en, boy) {
    if (sekil === "L") return [mm.z < boy / 2 ? 0 : 2, mm.x < en / 2 ? 3 : 1];
    var ana = hizala("yukselti", mm.x, mm.z).kenar;
    return (ana === 0 || ana === 2) ? [ana, 3, 1] : [ana, 0, 2];
  }

  function yukseltiKapiKes(g, yon, along) {
    var i, k, kb, ks, solda;
    var yatay = g.kenar === 0 || g.kenar === 2;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === "esik" && yerlesim[i].kenar === g.kenar) { k = yerlesim[i]; break; }
    }
    if (!k) return g;
    var bas = yukseltiBas(g);
    var son = bas + g.p.uzunluk;
    kb = yatay ? k.x : k.z;
    ks = kb + (yatay ? k.en : k.boy);
    if (ks <= bas || kb >= son) return g;
    if (yon === "bas") solda = true;
    else if (yon === "son") solda = false;
    else if (yon === "nokta") solda = along < (kb + ks) / 2;
    else solda = (kb - bas) >= (son - ks);
    var o = taslakOlcu();
    if (solda) {
      if (kb - bas < 1) return null;
      yukseltiKoy(g, bas, kb - bas, o.en, o.boy);
    } else {
      if (son - ks < 1) return null;
      yukseltiKoy(g, ks, son - ks, o.en, o.boy);
    }
    return g;
  }

  function yukseltiKoseYon(k, kenarlar) {
    var bas = (k === 0 || k === 2) ? 3 : 0;
    var son = (k === 0 || k === 2) ? 1 : 2;
    var b = kenarlar.indexOf(bas) >= 0;
    var s = kenarlar.indexOf(son) >= 0;
    if (b && !s) return "bas";
    if (s && !b) return "son";
    return "uzun";
  }

  function yukseltiSekilKur(sekil, kenarlar, sablon) {
    var o = taslakOlcu();
    var grup = "ys" + Date.now();
    var i, k, g, p, s;
    for (i = 0; i < kenarlar.length; i++) {
      k = kenarlar[i];
      s = sablon ? sablon[k] : null;
      p = s ? { derinlik: s.derinlik, yukseklik: s.yukseklik } : null;
      g = hizala("yukselti",
        k === 3 ? 0 : (k === 1 ? o.en : o.en / 2),
        k === 0 ? 0 : (k === 2 ? o.boy : o.boy / 2),
        p ? { p: p } : null);
      yukseltiKoseKes(g, o.en, o.boy);
      g = yukseltiKapiKes(g, yukseltiKoseYon(k, kenarlar));
      if (!g) continue;
      g.kilit = true;
      g.grup = grup;
      g.sekil = sekil;
      g.sekilKenarlar = kenarlar.slice();
      if (s && s.kod > 0) g.p.kod = g.p.yukseklik;
      if (s && s.yno > 0) g.yno = s.yno;
      else yukseltiNoVer(g);
      yerlesim.push(g);
    }
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].grup === grup) yukseltiKoseDoldur(yerlesim[i], o.en, o.boy);
    }
  }

  function yukseltiKoseDoldur(g, en, boy) {
    var wall = yukseltiDuvarBoyu(g.kenar, en, boy);
    var bas = yukseltiBas(g);
    var son = bas + g.p.uzunluk;
    var dene = [[0, son], [bas > 0 ? bas : 0, wall]];
    var i, j, a, temiz;
    for (i = 0; i < dene.length; i++) {
      if (dene[i][1] - dene[i][0] <= g.p.uzunluk) continue;
      a = yukseltiKopya(g);
      yukseltiKoy(a, dene[i][0], dene[i][1] - dene[i][0], en, boy);
      temiz = true;
      for (j = 0; j < yerlesim.length; j++) {
        if (yerlesim[j] === g) continue;
        if (yerlesim[j].tip !== "yukselti" && yerlesim[j].tip !== "esik") continue;
        if (yukseltiKutuBiner(a, yerlesim[j])) { temiz = false; break; }
      }
      if (temiz) {
        yukseltiKoy(g, dene[i][0], dene[i][1] - dene[i][0], en, boy);
        bas = yukseltiBas(g);
        son = bas + g.p.uzunluk;
        dene[1][0] = bas;
      }
    }
  }

  function yukseltiCevir(yon) {
    var o = taslakOlcu();
    var harita = yon > 0 ? { 2: 1, 1: 0, 0: 3, 3: 2 } : { 1: 2, 0: 1, 3: 0, 2: 3 };
    var hedef = (yukseltiSecIx >= 0 && yerlesim[yukseltiSecIx] && yerlesim[yukseltiSecIx].tip === "yukselti") ? yerlesim[yukseltiSecIx] : null;
    var i, g, k;
    if (!hedef) {
      for (i = 0; i < yerlesim.length; i++) {
        g = yerlesim[i];
        if (g.tip === "yukselti" && (!hedef || (g.yno || 0) < (hedef.yno || 0))) hedef = g;
      }
    }
    if (!hedef) return;
    var secili = yukseltiSecIx >= 0;
    var yedek = yukseltiKopya(yerlesim);
    var takim = yerlesim.filter(function (it) {
      return it.tip === "yukselti" && (hedef.grup ? it.grup === hedef.grup : it === hedef);
    });
    yerlesim = yerlesim.filter(function (it) { return takim.indexOf(it) < 0; });
    var tamam = true;
    if (hedef.sekil) {
      var sablon = {};
      for (i = 0; i < takim.length; i++) {
        g = takim[i];
        sablon[harita[g.kenar]] = { derinlik: g.p.derinlik, yukseklik: g.p.yukseklik, kod: g.p.kod, yno: g.yno };
      }
      yukseltiSekilKur(hedef.sekil, (hedef.sekilKenarlar || []).map(function (x) { return harita[x]; }), sablon);
    } else if (takim.length === 1) {
      k = harita[hedef.kenar];
      g = hizala("yukselti",
        k === 3 ? 0 : (k === 1 ? o.en : o.en / 2),
        k === 0 ? 0 : (k === 2 ? o.boy : o.boy / 2),
        { p: { derinlik: hedef.p.derinlik, yukseklik: hedef.p.yukseklik } });
      yukseltiKoseKes(g, o.en, o.boy);
      g = yukseltiKapiKes(g, "uzun");
      if (g) {
        g.yno = hedef.yno;
        if (hedef.p.kod > 0) g.p.kod = g.p.yukseklik;
        yerlesim.push(g);
      } else tamam = false;
    } else {
      for (i = 0; i < takim.length; i++) {
        g = takim[i];
        k = harita[g.kenar];
        var oran = yukseltiDuvarBoyu(k, o.en, o.boy) / yukseltiDuvarBoyu(g.kenar, o.en, o.boy);
        var bas = yukseltiBas(g) * oran;
        var uz = g.p.uzunluk * oran;
        g.kenar = k;
        g.grup = "yk" + k;
        yukseltiKoy(g, bas, uz, o.en, o.boy);
        yerlesim.push(g);
      }
    }
    if (tamam && yukseltiBinmeVar()) tamam = false;
    if (tamam) {
      for (i = 0; i < yerlesim.length && tamam; i++) {
        if (yerlesim[i].tip !== "yukselti") continue;
        for (k = 0; k < yerlesim.length; k++) {
          if (yerlesim[k].tip === "esik" && yukseltiKutuBiner(yerlesim[i], yerlesim[k])) { tamam = false; break; }
        }
      }
    }
    if (!tamam) {
      yerlesim = yedek;
      yaz("Bu yöne dönmez usta.", true);
      ciz();
      return;
    }
    yukseltiSecIx = -1;
    seciliIx = -1;
    if (secili) {
      for (i = 0; i < yerlesim.length; i++) {
        if (yerlesim[i].tip === "yukselti" && yerlesim[i].yno === hedef.yno) { yukseltiSecIx = i; seciliIx = i; break; }
      }
    }
    turKaydet();
    islemKaydet();
    ayarYaz();
    ciz();
    yaz("Yükselti çevrildi.", false);
  }

  function yukseltiCevirYaz() {
    var el = document.getElementById("yukseltiCevir");
    if (!el) return;
    el.classList.toggle("acik", motorSayfa === "zemin" && camSeciliTip === "yukselti" &&
      zeminParcaVar("yukselti") && !(zeminDurum && zeminDurum.kilit));
  }

  function yukseltiBinmeVar(kenar) {
    var liste = [];
    var i, j;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip !== "yukselti") continue;
      if (kenar != null && yerlesim[i].kenar !== kenar) continue;
      liste.push(yerlesim[i]);
    }
    for (i = 0; i < liste.length; i++) {
      for (j = i + 1; j < liste.length; j++) {
        if (yukseltiKutuBiner(liste[i], liste[j])) return true;
      }
    }
    return false;
  }

  function yukseltiYedekAl() {
    if (yukseltiYedek) return;
    yukseltiYedek = [];
    var i;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === "yukselti") yukseltiYedek.push(yukseltiKopya(yerlesim[i]));
    }
  }

  function yukseltiYedektenKur() {
    if (!yukseltiYedek) return;
    yerlesim = yerlesim.filter(function (g) { return g.tip !== "yukselti"; });
    var i;
    for (i = 0; i < yukseltiYedek.length; i++) yerlesim.push(yukseltiKopya(yukseltiYedek[i]));
  }

  function yukseltiYedekGeri() {
    yukseltiYedektenKur();
    yukseltiYedek = null;
  }

  function zeminKoduVer(g) {
    if (!g || g.tip !== "yukselti" || !g.p) return;
    if (!(g.p.yukseklik > 0)) return;
    g.p.kod = g.p.yukseklik;
  }

  function hizala(tip, x, z, eski) {
    var o = taslakOlcu();
    var paket = eski ? { p: eski.p || {}, usta: ustaVeri() } : { p: {}, usta: ustaVeri() };
    if (!Z || !Z.hizala) return { tip: tip, x: 0, z: 0, en: 300, boy: 300, kenar: 0, p: paket.p };
    return Z.hizala({ oda: o }, tip, x, z, paket);
  }

  function cetvelTip(tip) {
    return !!tip;
  }

  function cetvelGerec() {
    if (onizleme && cetvelTip(onizleme.tip)) return onizleme;
    if (tasimaIx >= 0 && yerlesim[tasimaIx] && cetvelTip(yerlesim[tasimaIx].tip)) {
      return yerlesim[tasimaIx];
    }
    if (seciliIx >= 0 && yerlesim[seciliIx] && cetvelTip(yerlesim[seciliIx].tip)) {
      return yerlesim[seciliIx];
    }
    return null;
  }

  function gerecBul(x, z) {
    var i, g;
    for (i = yerlesim.length - 1; i >= 0; i--) {
      g = yerlesim[i];
      if (x >= g.x && x <= g.x + g.en && z >= g.z && z <= g.z + g.boy) return i;
    }
    return -1;
  }

  function seritKilitGoster() {
    var s = document.querySelector(".gerecSerit");
    if (s) s.classList.toggle("kilit", !!yerlesimKilit);
  }

  var GEREK_AD = {
    oda_zemin: "Oda zemin",
    esik: "Kapı eşiği",
    sifon: "Yer sifonu",
    yukselti: "Dolap altı yükselti"
  };
  var PARCA_LISTE = { oda_zemin: 1, esik: 1, sifon: 1, yukselti: 1 };
  var camGeldi = { oda_zemin: false, esik: false, yukselti: false, sifon: false };
  var camSeciliTip = "";

  function levhaCamSifirla() {
    camGeldi = { oda_zemin: false, esik: false, yukselti: false, sifon: false };
    camSeciliTip = "";
  }

  function parcaIxTip(tip) {
    var i;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === tip) return i;
    }
    return -1;
  }

  function birimdenMm(goster) {
    var n = parseFloat(String(goster == null ? "" : goster).trim().replace(",", "."));
    if (!(n >= 0)) return 0;
    if (O && O.oku() === "cm") n = n * 10;
    return Math.round(n * 10) / 10;
  }

  function duvarEnHazir(kenar) {
    var ozel = duvarOlcu[kenar];
    if (ozel && ozel.en > 0) return ozel.en;
    return gonyeUzun(kenar);
  }

  function duvarKalinlikHazir(kenar) {
    var ozel = duvarOlcu[kenar];
    if (ozel && Object.prototype.hasOwnProperty.call(ozel, "kalinlik")) {
      return ozel.kalinlik > 0 ? ozel.kalinlik : 0;
    }
    duvarOlcuSatir(kenar).kalinlik = birimdenMm(15);
    return duvarOlcu[kenar].kalinlik;
  }

  function duvarYukHazir() {
    if (duvarYuk > 0) return duvarYuk;
    var o = durum.oda || {};
    if (o.yuk > 0) return o.yuk;
    return o.yukseklik > 0 ? o.yukseklik : 0;
  }

  function duvarOlcuSatir(kenar) {
    if (!duvarOlcu[kenar]) duvarOlcu[kenar] = {};
    return duvarOlcu[kenar];
  }

  function duvarOlcuAlan(motor, etiket, deger, bos, yazFn, kilitMi) {
    var lab = document.createElement("label");
    lab.appendChild(document.createTextNode(etiket + " ("));
    var birim = document.createElement("span");
    birim.className = "birimAd";
    lab.appendChild(birim);
    lab.appendChild(document.createTextNode(")"));
    var inp = document.createElement("input");
    inp.type = "number";
    inp.min = "0";
    inp.step = "any";
    inp.placeholder = bos ? "İsteğe bağlı" : "";
    inp.value = deger > 0 ? O.goster(deger) : "";
    inp.disabled = !!kilitMi;
    inp.addEventListener("input", function () {
      var ham = String(inp.value || "").trim();
      if (!ham) { yazFn(0); return; }
      var n = parseFloat(O.mmAl(inp.value));
      if (!(n > 0)) return;
      yazFn(n);
    });
    lab.appendChild(inp);
    motor.appendChild(lab);
  }

  function duvarOlcuTikDugme(motor, kenar, kilitMi) {
    var tik = document.createElement("button");
    tik.type = "button";
    tik.className = "duvarOlcuTik" + (kilitMi ? " aktif" : "");
    tik.setAttribute("aria-pressed", kilitMi ? "true" : "false");
    tik.setAttribute("aria-label", kilitMi ? "Ölçü kilitli" : "Ölçü açık");
    tik.textContent = "✓";
    tik.addEventListener("click", function () {
      duvarOlcuSatir(kenar).kilit = !duvarOlcuSatir(kenar).kilit;
      turKaydet();
      duvarKodListeDoldur(motor);
    });
    return tik;
  }

  function duvarOlcuHucre(ad, mm) {
    var hucre = document.createElement("div");
    hucre.className = "hucre";
    var et = document.createElement("span");
    et.className = "ad";
    et.textContent = ad;
    var sayi = document.createElement("span");
    sayi.className = "sayi";
    sayi.textContent = mm > 0 ? O.goster(mm) : "—";
    hucre.appendChild(et);
    hucre.appendChild(sayi);
    return hucre;
  }

  function duvarKodSatirTazele() {
    var motor = document.getElementById("levhaCamMotor");
    if (!motor) return;
    var dug = motor.querySelectorAll("button[data-kenar]");
    var i, kenar;
    for (i = 0; i < dug.length; i++) {
      kenar = dug[i].getAttribute("data-kenar");
      dug[i].classList.toggle("soluk", !duvarOruluKenar(kenar));
      dug[i].classList.toggle("secili", kenar === duvarSecKenar);
    }
  }

  function duvarKodListeDoldur(motor) {
    motor.textContent = "";
    if (duvarModul === "olcu" && duvarSecKenar && camSeciliTip !== "duvar") {
      duvarOlcuForm(motor, duvarSecKenar);
      return;
    }
    if (camSeciliTip === "duvar" && duvarPanel === "engelIs") {
      duvarEngelIsListe(motor);
      return;
    }
    if (camSeciliTip === "duvar" && duvarPanel === "engelKenar") {
      duvarEngelKenarListe(motor);
      return;
    }
    if (camSeciliTip === "duvar" && duvarPanel === "engelSil" && duvarSecKenar) {
      duvarEngelSilListe(motor, duvarSecKenar);
      return;
    }
    var secKenar = duvarSecKenar;
    if (!secKenar) {
      duvarEngelKenarListe(motor);
      return;
    }
    if (duvarPanel === "engel" || duvarPanel === "yon" || duvarPanel === "kose" || duvarPanel === "olcu" || duvarPanel === "kapi" || duvarPanel === "yapi") {
      duvarEngelEkran(motor, secKenar);
      return;
    }
    duvarPanel = "engel";
    duvarEngelEkran(motor, secKenar);
  }

  function duvarEngelVar() {
    var liste = durum.elemanlar || [];
    var i, e, no;
    for (i = 0; i < liste.length; i++) {
      e = liste[i];
      if (!e) continue;
      no = e.duvar_no;
      if (duvarOrulu(no)) return true;
      if (e.duvarlar) {
        for (no = 0; no < e.duvarlar.length; no++) {
          if (duvarOrulu(e.duvarlar[no])) return true;
        }
      }
    }
    return false;
  }

  function duvarKenarEngelVar(kenar) {
    var no = KENAR_MOTOR[kenar];
    var liste = durum.elemanlar || [];
    var i, e;
    for (i = 0; i < liste.length; i++) {
      e = liste[i];
      if (!e) continue;
      if (e.duvar_no === no || (e.duvarlar && e.duvarlar.indexOf(no) >= 0)) return true;
    }
    return false;
  }

  function duvarEngelIsListe(motor) {
    var bas = document.createElement("p");
    var varMi = duvarEngelVar();
    var ekle, kaldir;
    bas.className = "camMotorBas";
    bas.textContent = "Ne yapalım?";
    motor.appendChild(bas);
    ekle = duvarCamDugme(motor, "Engel ekle", "duvarKod", { "data-engel-is": "ekle" });
    kaldir = duvarCamDugme(motor, "Engel kaldır", "duvarKod" + (varMi ? "" : " soluk"), { "data-engel-is": "kaldir" });
    if (!varMi) kaldir.disabled = true;
    return ekle;
  }

  function duvarEngelKenarListe(motor) {
    var sira = duvarSaatSira();
    var i, kenar, satir;
    var bas = document.createElement("p");
    var say = 0;
    duvarCamDugme(motor, "Geri", "duvarKod", { "data-geri": "engelIs" });
    bas.className = "camMotorBas";
    bas.textContent = "Hangi duvar?";
    motor.appendChild(bas);
    for (i = 0; i < sira.length; i++) {
      kenar = sira[i];
      if (!duvarOruluKenar(kenar)) continue;
      if (engelIs === "kaldir" && !duvarKenarEngelVar(kenar)) continue;
      satir = document.createElement("button");
      satir.type = "button";
      satir.setAttribute("data-engel-kenar", kenar);
      satir.className = "duvarKod";
      satir.textContent = duvarDYazi(kenar);
      motor.appendChild(satir);
      say += 1;
    }
    if (!say) {
      var bos = document.createElement("p");
      bos.className = "camMotorBas";
      bos.textContent = engelIs === "kaldir" ? "Bu işte engel yok usta." : "Tuvalde duvar yok usta.";
      motor.appendChild(bos);
    }
  }

  function duvarEngelSilListe(motor, kenar) {
    var no = KENAR_MOTOR[kenar];
    var liste = durum.elemanlar || [];
    var i, e, ad, say = 0;
    duvarCamDugme(motor, duvarDYazi(kenar), "duvarKod secili", { "data-geri": "engelKenar" });
    var bas = document.createElement("p");
    bas.className = "camMotorBas";
    bas.textContent = "Hangisini kaldır?";
    motor.appendChild(bas);
    for (i = 0; i < liste.length; i++) {
      e = liste[i];
      if (!e) continue;
      if (e.duvar_no !== no && !(e.duvarlar && e.duvarlar.indexOf(no) >= 0)) continue;
      ad = e.tip === "kapi" ? "Kapı" : engelAd(e.tip);
      duvarCamDugme(motor, ad, "duvarKod", { "data-engel-sil": String(i) });
      say += 1;
    }
    if (!say) {
      var bos = document.createElement("p");
      bos.className = "camMotorBas";
      bos.textContent = "Bu duvarda engel yok usta.";
      motor.appendChild(bos);
    }
  }

  function duvarEngelSil(ix) {
    var liste = durum.elemanlar || [];
    var e = liste[ix];
    var ys, i, y, tut;
    if (!e) return;
    tut = {
      sol: e.sol || 0,
      alt: e.alt || 0,
      en: e.en || 0,
      boy: e.boy || 0,
      no: e.duvar_no,
      duvarlar: e.duvarlar
    };
    liste.splice(ix, 1);
    ys = durum.yasak_kutular || [];
    for (i = ys.length - 1; i >= 0; i--) {
      y = ys[i];
      if (!y) continue;
      if (y.duvar_no !== tut.no && !(tut.duvarlar && tut.duvarlar.indexOf(y.duvar_no) >= 0)) continue;
      if (y.sol + y.en <= tut.sol || tut.sol + tut.en <= y.sol) continue;
      if ((y.alt || 0) + y.boy <= tut.alt || tut.alt + tut.boy <= (y.alt || 0)) continue;
      ys.splice(i, 1);
    }
    turKaydet();
    yaz("Engel kalktı usta.", false);
    ciz();
    islemKaydet();
    if (duvarKenarEngelVar(duvarSecKenar)) {
      duvarPanel = "engelSil";
      ayarYaz();
      return;
    }
    if (duvarEngelVar()) {
      duvarPanel = "engelKenar";
      duvarSecKenar = "";
      ayarYaz();
      return;
    }
    engelIs = "";
    engelPanelKapat();
  }

  function duvarOlcuForm(motor, secKenar) {
    var secBas = document.createElement("button");
    secBas.type = "button";
    secBas.setAttribute("data-kenar", secKenar);
    secBas.className = "duvarKod secili";
    secBas.textContent = duvarDYazi(secKenar);
    motor.appendChild(secBas);
    var olcuKilit = !!duvarOlcuSatir(secKenar).kilit;
    if (olcuKilit) {
      var ozet = document.createElement("div");
      ozet.className = "duvarOlcuOzet";
      ozet.appendChild(duvarOlcuHucre("En", duvarEnHazir(secKenar)));
      ozet.appendChild(duvarOlcuHucre("Boy", duvarYukHazir()));
      ozet.appendChild(duvarOlcuHucre("Kalınlık", duvarKalinlikHazir(secKenar)));
      ozet.appendChild(duvarOlcuTikDugme(motor, secKenar, true));
      motor.appendChild(ozet);
    } else {
      duvarOlcuAlan(motor, "En", duvarEnHazir(secKenar), false, function (n) {
        duvarOlcuSatir(secKenar).en = n;
        turKaydet();
      }, false);
      duvarOlcuAlan(motor, "Yükseklik", duvarYukHazir(), false, function (n) {
        if (!(n > 0)) return;
        duvarYuk = n;
        if (durum.oda) {
          durum.oda.yuk = n;
          durum.oda.yukseklik = n;
        }
        var liste = durum.duvarlar || [];
        var k;
        for (k = 0; k < liste.length; k++) liste[k].boy = n;
        turKaydet();
        ciz();
      }, false);
      duvarOlcuAlan(motor, "Kalınlık", duvarKalinlikHazir(secKenar), true, function (n) {
        duvarOlcuSatir(secKenar).kalinlik = n;
        turKaydet();
      }, false);
      var tikSatir = document.createElement("div");
      tikSatir.className = "duvarOlcuTikSatir";
      tikSatir.appendChild(duvarOlcuTikDugme(motor, secKenar, false));
      motor.appendChild(tikSatir);
    }
    var alt = document.createElement("div");
    alt.className = "duvarAlt";
    var kaydet = document.createElement("button");
    kaydet.type = "button";
    kaydet.className = "duvarKaydet" + (olcuKilit ? " secili" : "");
    kaydet.textContent = olcuKilit ? "Kaydedildi" : "Kaydet";
    kaydet.addEventListener("click", function () {
      duvarOlcuSatir(secKenar).kilit = true;
      turKaydet();
      duvarKodListeDoldur(motor);
    });
    alt.appendChild(kaydet);
    motor.appendChild(alt);
    if (O && O.etiketYaz) O.etiketYaz();
  }

  function duvarGerecSiraYaz(motor, kenar) {
    var no = KENAR_MOTOR[kenar];
    var liste = durum.elemanlar || [];
    var i, e, ad;
    for (i = 0; i < liste.length; i++) {
      e = liste[i];
      if (!e) continue;
      if (e.duvar_no !== no && !(e.duvarlar && e.duvarlar.indexOf(no) >= 0)) continue;
      ad = engelAd(e.tip);
      if (e.tip === "kapi") ad = "Kapı";
      duvarCamDugme(motor, ad, "duvarKod", { "data-eleman-ix": String(i) });
    }
  }

  function duvarCamDugme(motor, yazi, cls, attrs) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = yazi;
    var k;
    for (k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) b.setAttribute(k, attrs[k]);
    }
    motor.appendChild(b);
    return b;
  }

  function duvarEngelEkran(motor, secKenar) {
    var i, tip, ad, secili;
    if (duvarPanel === "kapi") {
      kapiFormCiz(motor);
      return;
    }
    if (duvarPanel === "yapi") {
      yapiFormCiz(motor);
      return;
    }
    if (duvarPanel === "engel") {
      duvarCamDugme(motor, duvarDYazi(secKenar), "duvarKod secili", { "data-geri": "engelKenar" });
      for (i = 0; i < ENGEL_LIST.length; i++) {
        tip = ENGEL_LIST[i][0];
        ad = ENGEL_LIST[i][1];
        secili = duvarTur.tip === tip ? " secili" : "";
        duvarCamDugme(motor, ad, "duvarKod" + secili, { "data-engel": tip });
      }
      duvarGerecSiraYaz(motor, secKenar);
      return;
    }
    if (duvarPanel === "yon") {
      duvarCamDugme(motor, engelAd(duvarTur.tip), "duvarKod secili", { "data-geri": "engel" });
      duvarCamDugme(motor, "Soldan", "duvarKod", { "data-yon": "sol" });
      duvarCamDugme(motor, "Sağdan", "duvarKod", { "data-yon": "sag" });
      return;
    }
    if (duvarPanel === "kose") {
      duvarCamDugme(motor, "Pimaş", "duvarKod secili", { "data-geri": "engel" });
      duvarCamDugme(motor, "1-2", "duvarKod", { "data-kose": "1-2" });
      duvarCamDugme(motor, "2-3", "duvarKod", { "data-kose": "2-3" });
      duvarCamDugme(motor, "3-4", "duvarKod", { "data-kose": "3-4" });
      duvarCamDugme(motor, "4-1", "duvarKod", { "data-kose": "4-1" });
      return;
    }
    duvarCamDugme(motor, duvarTur.yon === "sag" ? "Sağdan" : "Soldan", "duvarKod secili", { "data-geri": "yon" });
    duvarOlcuAlan(motor, duvarTur.yon === "sag" ? "Sağdan" : "Soldan", 0, false, function () {});
    duvarCamDugme(motor, "Tamam", "duvarKaydet", { "data-engel-tamam": "1" });
    var inp = motor.querySelector("input");
    if (inp) inp.id = "engelSol";
    if (O && O.etiketYaz) O.etiketYaz();
  }

  function engelAd(tip) {
    var i;
    for (i = 0; i < ENGEL_LIST.length; i++) {
      if (ENGEL_LIST[i][0] === tip) return ENGEL_LIST[i][1];
    }
    return tip || "Engel";
  }

  function esikParca() {
    var i, g;
    for (i = yerlesim.length - 1; i >= 0; i--) {
      g = yerlesim[i];
      if (g && (g.tip === "esik" || g.tip === "kapi")) return g;
    }
    return null;
  }

  function esikDuvarSol(g) {
    var o = durum.oda || {};
    var en = o.en || 0;
    var boy = o.boy || 0;
    if (g.kenar === 0) return Math.max(0, Math.round(g.x));
    if (g.kenar === 1) return Math.max(0, Math.round(g.z));
    if (g.kenar === 2) return Math.max(0, Math.round(en - g.x - g.en));
    return Math.max(0, Math.round(boy - g.z - g.boy));
  }

  function esikDuvarEn(g) {
    if (g.kenar === 1 || g.kenar === 3) return g.boy;
    return g.en;
  }

  function kapiElemanIx() {
    var liste = durum.elemanlar || [];
    var i;
    for (i = 0; i < liste.length; i++) {
      if (liste[i] && liste[i].tip === "kapi") return i;
    }
    return -1;
  }

  function duvarKapiYerlestir(bildir) {
    var g = esikParca();
    var ad, no, ix;
    if (!g) {
      if (bildir) yaz("Zeminde kapı yeri yok usta.", true);
      return;
    }
    ad = ["on", "sag", "arka", "sol"][g.kenar] || kapiKenar || "on";
    kapiKenar = ad;
    no = KENAR_MOTOR[ad];
    ix = kapiElemanIx();
    if (ix >= 0) {
      duvarSecKenar = MOTOR_KENAR[(durum.elemanlar[ix] && durum.elemanlar[ix].duvar_no) || no] || ad;
      duvarPanel = "";
      if (bildir) yaz("Kapı boşluğuna oturdu usta.", false);
      ciz();
      return;
    }
    duvarTur.no = no;
    duvarTur.tip = "kapi";
    duvarTur.yon = "sol";
    duvarTur.en = esikDuvarEn(g);
    if (!D || !duvarAl(D.duvarSec(durum, no))) return;
    if (!duvarAl(D.olcuYonAyarla(durum, "sol"))) return;
    if (!duvarElemanYaz(esikDuvarSol(g), true)) {
      duvarTur.en = 0;
      return;
    }
    duvarTur.en = 0;
    duvarTur.boy = 0;
    duvarSecKenar = ad;
    duvarPanel = "";
    if (bildir) yaz("Kapı boşluğuna oturdu usta.", false);
    ciz();
  }

  function kapiCakisir(e, en, boy) {
    var aday = { sol: e.sol, alt: e.alt || 0, en: en, boy: boy };
    var ys = durum.yasak_kutular || [];
    var i, y, alt;
    for (i = 0; i < ys.length; i++) {
      y = ys[i];
      if (!y || y.duvar_no !== e.duvar_no) continue;
      alt = y.alt || 0;
      if (y.sol === e.sol && y.en === e.en && alt === (e.alt || 0) && y.boy === e.boy) continue;
      if (aday.sol < y.sol + y.en && aday.sol + aday.en > y.sol && aday.alt < alt + y.boy && aday.alt + aday.boy > alt) return true;
    }
    return false;
  }

  function kapiOlcuUygula(en, boy) {
    var g = esikParca();
    var ad, no, ix, e, duvar, liste, i, ys, y, alt;
    if (!g) {
      yaz("Zeminde kapı yeri yok usta.", true);
      return false;
    }
    ad = ["on", "sag", "arka", "sol"][g.kenar] || kapiKenar || "on";
    no = KENAR_MOTOR[ad];
    ix = kapiElemanIx();
    if (ix < 0) {
      duvarTur.no = no;
      duvarTur.tip = "kapi";
      duvarTur.yon = "sol";
      duvarTur.en = en;
      duvarTur.boy = boy;
      if (!D || !duvarAl(D.duvarSec(durum, no))) return false;
      if (!duvarAl(D.olcuYonAyarla(durum, "sol"))) return false;
      if (!duvarElemanYaz(esikDuvarSol(g), true)) {
        duvarTur.en = 0;
        duvarTur.boy = 0;
        return false;
      }
      duvarTur.en = 0;
      duvarTur.boy = 0;
      return kapiElemanIx() >= 0;
    }
    e = durum.elemanlar[ix];
    liste = durum.duvarlar || [];
    duvar = null;
    for (i = 0; i < liste.length; i++) if (liste[i].no === e.duvar_no) duvar = liste[i];
    if (!duvar || e.sol + en > duvar.en || boy > duvar.boy) {
      yaz("Eleman duvar dışına taşar.", true);
      return false;
    }
    if (e.en === en && e.boy === boy) return true;
    if (kapiCakisir(e, en, boy)) {
      yaz("Yasak kutular çakışır.", true);
      return false;
    }
    ys = durum.yasak_kutular || [];
    for (i = 0; i < ys.length; i++) {
      y = ys[i];
      alt = y.alt || 0;
      if (y.duvar_no === e.duvar_no && y.sol === e.sol && y.en === e.en && alt === (e.alt || 0) && y.boy === e.boy) {
        y.en = en;
        y.boy = boy;
        break;
      }
    }
    e.en = en;
    e.boy = boy;
    return true;
  }

  function kapiFormAc() {
    var g = esikParca();
    var ad, ix, e, kal, kasa, kapi;
    if (!g) {
      yaz("Zeminde kapı yeri yok usta.", true);
      return;
    }
    ad = ["on", "sag", "arka", "sol"][g.kenar] || kapiKenar || "on";
    ix = kapiElemanIx();
    e = ix >= 0 ? durum.elemanlar[ix] : null;
    kasa = (e && e.kasa) || {};
    kapi = (e && e.kapi) || {};
    kal = duvarKalinlikHazir(ad);
    kapiTaslak = {
      en: e && e.en > 0 ? e.en : esikDuvarEn(g),
      boy: e && e.boy > 0 ? e.boy : 2100,
      kalinlik: kasa.kalinlik > 0 ? kasa.kalinlik : kal,
      pervaz: kasa.pervaz === "var" ? "var" : "yok",
      cins: kapi.cins || "ic",
      model: kapi.model || "",
      camli: !!kapi.camli,
      renk: kapi.renk || ""
    };
    kapiKenar = ad;
    duvarSecKenar = ad;
    duvarPanel = "kapi";
    duvarModul = "engel";
    camSeciliTip = "duvar";
    panellerKapa();
    ayarYaz();
    yaz("Önce kasa, sonra kapı usta.", false);
  }

  function kapiBaslik(motor, yazi) {
    var p = document.createElement("p");
    p.className = "camMotorBas";
    p.textContent = yazi;
    motor.appendChild(p);
  }

  function kapiYazi(motor, etiket, alan) {
    var lab = document.createElement("label");
    var inp = document.createElement("input");
    lab.appendChild(document.createTextNode(etiket));
    inp.type = "text";
    inp.value = kapiTaslak[alan] || "";
    inp.addEventListener("input", function () { kapiTaslak[alan] = inp.value; });
    lab.appendChild(inp);
    motor.appendChild(lab);
  }

  function kapiFormCiz(motor) {
    var t = kapiTaslak || {};
    duvarCamDugme(motor, "Kapı", "duvarKod secili", { "data-geri": "engel" });
    kapiBaslik(motor, "Kasa");
    duvarOlcuAlan(motor, "Boy", t.boy, false, function (n) { kapiTaslak.boy = n; }, false);
    duvarOlcuAlan(motor, "En", t.en, false, function (n) { kapiTaslak.en = n; }, false);
    duvarOlcuAlan(motor, "Kasa kalınlık", t.kalinlik, false, function (n) { kapiTaslak.kalinlik = n; }, false);
    duvarCamDugme(motor, "Pervaz yok", "duvarKod" + (t.pervaz !== "var" ? " secili" : ""), { "data-kapi-alan": "pervaz", "data-kapi-deger": "yok" });
    duvarCamDugme(motor, "Pervaz var", "duvarKod" + (t.pervaz === "var" ? " secili" : ""), { "data-kapi-alan": "pervaz", "data-kapi-deger": "var" });
    kapiBaslik(motor, "Kapı");
    duvarCamDugme(motor, "İç", "duvarKod" + (t.cins === "ic" ? " secili" : ""), { "data-kapi-alan": "cins", "data-kapi-deger": "ic" });
    duvarCamDugme(motor, "Dış", "duvarKod" + (t.cins === "dis" ? " secili" : ""), { "data-kapi-alan": "cins", "data-kapi-deger": "dis" });
    duvarCamDugme(motor, "Sürme", "duvarKod" + (t.cins === "surme" ? " secili" : ""), { "data-kapi-alan": "cins", "data-kapi-deger": "surme" });
    kapiYazi(motor, "Model", "model");
    duvarCamDugme(motor, "Camlı değil", "duvarKod" + (!t.camli ? " secili" : ""), { "data-kapi-alan": "camli", "data-kapi-deger": "0" });
    duvarCamDugme(motor, "Camlı", "duvarKod" + (t.camli ? " secili" : ""), { "data-kapi-alan": "camli", "data-kapi-deger": "1" });
    kapiYazi(motor, "Boya rengi", "renk");
    duvarCamDugme(motor, "Kapıyı getir", "duvarKaydet", { "data-kapi-kaydet": "1" });
    if (O && O.etiketYaz) O.etiketYaz();
  }

  function kapiFormKaydet() {
    var t = kapiTaslak;
    var ix, e, anketten;
    if (!t || !(t.en > 0) || !(t.boy > 0) || !(t.kalinlik > 0)) {
      yaz("Kasa ölçüsü gir usta.", true);
      return;
    }
    anketten = soruAdim === "duvar_gerec";
    if (!kapiOlcuUygula(t.en, t.boy)) return;
    ix = kapiElemanIx();
    if (ix < 0) return;
    e = durum.elemanlar[ix];
    e.kasa = {
      en: t.en,
      boy: t.boy,
      kalinlik: t.kalinlik,
      pervaz: t.pervaz === "var" ? "var" : "yok"
    };
    e.kapi = {
      cins: t.cins || "ic",
      model: String(t.model || "").trim(),
      camli: t.camli === true || t.camli === "1",
      renk: String(t.renk || "").trim()
    };
    turKaydet();
    duvarPanel = "";
    yaz("Kasa örüldü, kapı geldi usta.", false);
    ciz();
    islemKaydet();
    if (anketten) anketAc("duvar_baska");
    else cepheAc(e.duvar_no, ix);
  }

  function duvarPimasKose(no) {
    var aday = ["1-2", "2-3", "3-4", "4-1"];
    var par, i, a, b;
    for (i = 0; i < aday.length; i++) {
      par = aday[i].split("-");
      a = parseInt(par[0], 10);
      b = parseInt(par[1], 10);
      if ((a === no || b === no) && duvarOrulu(a) && duvarOrulu(b)) return aday[i];
    }
    return "";
  }

  function duvarEngelEn(tip) {
    if (tip === "kapi") return 900;
    if (tip === "pencere") return 1200;
    if (tip === "priz" || tip === "su" || tip === "gaz") return 80;
    if (tip === "radiator" || tip === "kiris") return 1000;
    if (tip === "hava" || tip === "kolon") return 300;
    if (tip === "sayac") return 400;
    if (tip === "nis") return 600;
    if (tip === "pimas") return 150;
    return 300;
  }

  function duvarEngelDusur() {
    var no = duvarTur.no;
    var duvar = null;
    var i, sol, orta, en;
    var liste = durum.duvarlar || [];
    var aday = [];
    for (i = 0; i < liste.length; i++) {
      if (liste[i].no === no) duvar = liste[i];
    }
    if (!duvar) {
      yaz("Duvar yok usta.", true);
      return false;
    }
    en = duvarTur.en > 0 ? duvarTur.en : duvarEngelEn(duvarTur.tip);
    if (en > duvar.en) en = duvar.en;
    orta = Math.max(0, Math.round((duvar.en - en) / 2));
    aday.push(orta);
    for (i = 1; i <= 8; i++) {
      aday.push(Math.max(0, orta - i * 100));
      aday.push(Math.min(Math.max(0, duvar.en - en), orta + i * 100));
    }
    for (i = 0; i < aday.length; i++) {
      if (duvarElemanYaz(aday[i], true)) return true;
    }
    return false;
  }

  function yapiDuvar() {
    var liste = durum.duvarlar || [];
    var i;
    for (i = 0; i < liste.length; i++) if (liste[i].no === duvarTur.no) return liste[i];
    return null;
  }

  function yapiFormAc() {
    var duvar = yapiDuvar();
    if (!duvar) {
      yaz("Duvar yok usta.", true);
      return;
    }
    if (duvarTur.tip === "kolon") {
      duvarTur.boy = duvar.boy;
      duvarTur.en = 300;
      duvarTur.cikinti = 300;
    } else {
      duvarTur.en = duvar.en;
      duvarTur.boy = 300;
      duvarTur.cikinti = 300;
    }
    duvarPanel = "yapi";
    ayarYaz();
  }

  function yapiFormCiz(motor) {
    var duvar = yapiDuvar();
    var boy = duvar ? duvar.boy : 0;
    var en = duvar ? duvar.en : 0;
    duvarCamDugme(motor, duvarTur.tip === "kiris" ? "Kiriş" : "Kolon", "duvarKod secili", { "data-geri": "engel" });
    if (duvarTur.tip === "kolon") {
      duvarOlcuAlan(motor, "Yükseklik", boy, false, function () {}, true);
      duvarOlcuAlan(motor, "Genişlik", 300, false, function (n) { duvarTur.en = n; }, false);
      duvarOlcuAlan(motor, "Derinlik", 300, false, function (n) { duvarTur.cikinti = n; }, false);
    } else {
      duvarOlcuAlan(motor, "En", en, false, function () {}, true);
      duvarOlcuAlan(motor, "Yükseklik", 300, false, function (n) { duvarTur.boy = n; }, false);
      duvarOlcuAlan(motor, "Derinlik", 300, false, function (n) { duvarTur.cikinti = n; }, false);
    }
    var uygula = document.createElement("button");
    uygula.type = "button";
    uygula.className = "parcaUygula";
    uygula.textContent = "Uygula";
    uygula.addEventListener("click", function (ev) {
      if (ev.stopPropagation) ev.stopPropagation();
      yapiUygula(motor);
    });
    motor.appendChild(uygula);
    if (O && O.etiketYaz) O.etiketYaz();
  }

  function yapiUygula(motor) {
    var inp = motor.querySelectorAll("input");
    var duvar = yapiDuvar();
    var n1, n2;
    if (!duvar || inp.length < 3) return;
    n1 = parseFloat(O.mmAl(inp[1].value));
    n2 = parseFloat(O.mmAl(inp[2].value));
    if (!(n1 > 0) || !(n2 > 0)) {
      yaz("Ölçü gir usta.", true);
      return;
    }
    if (duvarTur.tip === "kolon") {
      if (n1 > duvar.en) {
        yaz("Genişlik duvardan büyük usta.", true);
        return;
      }
      duvarTur.boy = duvar.boy;
      duvarTur.en = n1;
      duvarTur.cikinti = n2;
    } else {
      if (n1 > duvar.boy) {
        yaz("Yükseklik duvardan büyük usta.", true);
        return;
      }
      duvarTur.en = duvar.en;
      duvarTur.boy = n1;
      duvarTur.cikinti = n2;
    }
    if (!duvarEngelDusur()) return;
    islemKaydet();
    cepheAc(duvarTur.no);
  }

  function engelPanelKapat() {
    camSeciliTip = "";
    duvarModul = "";
    duvarPanel = "";
    engelIs = "";
    ayarYaz();
  }

  function duvarEngelTip(tip) {
    var no, kose;
    if (tip === "kapi") {
      kapiFormAc();
      return;
    }
    no = KENAR_MOTOR[duvarSecKenar];
    if (!duvarOrulu(no)) {
      yaz("Bu duvar örülmedi usta.", true);
      return;
    }
    duvarTur.no = no;
    duvarTur.tip = tip;
    duvarTur.yon = "sol";
    duvarTur.en = 0;
    duvarTur.boy = 0;
    duvarTur.cikinti = 0;
    if (!D || !duvarAl(D.duvarSec(durum, no))) return;
    if (!duvarAl(D.olcuYonAyarla(durum, "sol"))) return;
    if (tip === "kiris" || tip === "kolon") {
      yapiFormAc();
      return;
    }
    if (tip === "pimas") {
      kose = duvarPimasKose(no);
      if (!kose) {
        yaz("Pimaş köşesi yok usta.", true);
        return;
      }
      duvarTur.kose = kose;
    }
    if (!duvarEngelDusur()) return;
    islemKaydet();
    cepheAc(no);
  }

  function duvarEngelYon(yon) {
    duvarTur.yon = yon === "sag" ? "sag" : "sol";
    if (!D || !duvarAl(D.olcuYonAyarla(durum, duvarTur.yon))) return;
    duvarPanel = "olcu";
    var motor = document.getElementById("levhaCamMotor");
    if (motor) duvarKodListeDoldur(motor);
  }

  function duvarEngelKose(kose) {
    duvarTur.kose = kose || "1-2";
    if (!duvarElemanYaz(0, true)) return;
    islemKaydet();
    cepheAc(duvarTur.no);
  }

  function duvarEngelOlcuYaz() {
    var inp = document.getElementById("engelSol");
    var ham = inp ? String(inp.value || "").trim().replace(",", ".") : "";
    var n;
    if (ham === "") {
      yaz("Ölçü gir usta.", true);
      return;
    }
    n = birimdenMm(ham);
    if (!(n >= 0) || ham === "") {
      yaz("Ölçü gir usta.", true);
      return;
    }
    if (!duvarElemanYaz(n, true)) return;
    islemKaydet();
    cepheAc(duvarTur.no);
  }

  function solParcaYaz() {
    var duvarEl = document.getElementById("camDuvar");
    if (motorSayfa === "duvar") {
      if (camSeciliTip && camSeciliTip !== "duvar" && !PARCA_LISTE[camSeciliTip]) {
        camSeciliTip = "";
        var motorKapa = document.getElementById("levhaCamMotor");
        if (motorKapa) {
          motorKapa.classList.remove("acik");
          motorKapa.textContent = "";
        }
      }
      if (duvarEl) {
        duvarEl.classList.add("geldi");
        duvarEl.classList.toggle("secili", camSeciliTip === "duvar");
      }
      var barD = document.getElementById("levhaCam");
      if (barD) barD.classList.toggle("var", !cepheMod && !!duvarEl);
      if (camSeciliTip === "duvar") duvarKodSatirTazele();
      return;
    }
    if (duvarEl) duvarEl.classList.remove("geldi", "secili");
    camGeldi.oda_zemin = true;
    if (soruAdim === "kapi_surukle" || zeminParcaVar("esik")) camGeldi.esik = true;
    if (soruAdim === "yukselti_surukle" || zeminParcaVar("yukselti")) camGeldi.yukselti = true;
    if (soruAdim === "sifon_surukle" || zeminParcaVar("sifon")) camGeldi.sifon = true;
    var bar = document.getElementById("levhaCam");
    if (bar) bar.classList.toggle("var", false);
  }

  function parcaAlan(tip) {
    if (tip === "oda_zemin" || tip === "sifon") return [["en", "En"], ["boy", "Boy"]];
    if (tip === "esik") return [["en", "En"], ["derinlik", "Derinlik"], ["yukseklik", "Yükseklik"]];
    if (tip === "yukselti") return [["derinlik", "Derinlik"], ["yukseklik", "Yükseklik"]];
    return [];
  }

  function yukseltiOlcuUygula(motor) {
    var inp = motor.querySelectorAll("input[data-alan][data-ix]");
    var o = taslakOlcu();
    var istek = [];
    var i, j, ana, ham, n, ix, g, d, liste, wall, bas;
    for (i = 0; i < inp.length; i++) {
      ham = String(inp[i].value || "").trim();
      if (!ham) continue;
      n = parseFloat(O.mmAl(inp[i].value));
      if (!(n > 0)) {
        yaz("Ölçü gir usta.", true);
        return;
      }
      ana = inp[i].getAttribute("data-alan");
      ix = parseInt(inp[i].getAttribute("data-ix"), 10);
      g = yerlesim[ix];
      if (!g || g.tip !== "yukselti") continue;
      if (Math.abs((g.p[ana] || 0) - n) < 0.5) continue;
      d = null;
      for (j = 0; j < istek.length; j++) if (istek[j].g === g) d = istek[j];
      if (!d) { d = { g: g }; istek.push(d); }
      d[ana] = n;
    }
    if (!istek.length) {
      yaz("Değişen ölçü yok usta.", true);
      return;
    }
    var yedek = yukseltiKopya(yerlesim);
    var sekilDer = false;
    var sekilG = null;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === "yukselti" && yerlesim[i].sekil) { sekilG = yerlesim[i]; break; }
    }
    for (i = 0; i < istek.length; i++) {
      g = istek[i].g;
      if (istek[i].yukseklik) {
        g.p.yukseklik = istek[i].yukseklik;
        if (g.p.kod > 0) g.p.kod = g.p.yukseklik;
      }
      if (g.sekil) {
        if (istek[i].derinlik) sekilDer = true;
        continue;
      }
      if (istek[i].derinlik) g.p.derinlik = istek[i].derinlik;
      if (istek[i].uzunluk) g.p.uzunluk = istek[i].uzunluk;
    }
    var kenarMap = {};
    for (i = 0; i < yerlesim.length; i++) {
      g = yerlesim[i];
      if (g.tip !== "yukselti" || g.sekil) continue;
      if (!kenarMap[g.kenar]) kenarMap[g.kenar] = [];
      kenarMap[g.kenar].push(g);
    }
    for (var key in kenarMap) {
      if (!Object.prototype.hasOwnProperty.call(kenarMap, key)) continue;
      liste = kenarMap[key];
      liste.sort(function (a, b) { return yukseltiBas(a) - yukseltiBas(b); });
      if (liste.length > 1 && liste[0].kilit) {
        bas = 0;
        for (j = 0; j < liste.length; j++) {
          yukseltiKoy(liste[j], bas, liste[j].p.uzunluk, o.en, o.boy);
          bas += liste[j].p.uzunluk;
        }
      } else {
        for (j = 0; j < liste.length; j++) yukseltiUcaGore(liste[j], liste[j].p.uzunluk, o.en, o.boy);
      }
    }
    if (sekilG) {
      var uzIstek = {};
      for (i = 0; i < istek.length; i++) {
        if (istek[i].g.sekil && istek[i].uzunluk) uzIstek[istek[i].g.kenar] = istek[i].uzunluk;
      }
      if (sekilDer) {
        var sablon = {};
        for (i = 0; i < yerlesim.length; i++) {
          g = yerlesim[i];
          if (g.tip !== "yukselti" || !g.sekil) continue;
          d = null;
          for (j = 0; j < istek.length; j++) if (istek[j].g === g) d = istek[j];
          sablon[g.kenar] = {
            derinlik: (d && d.derinlik) || g.p.derinlik,
            yukseklik: g.p.yukseklik,
            kod: g.p.kod,
            yno: g.yno
          };
        }
        yerlesim = yerlesim.filter(function (it) { return !(it.tip === "yukselti" && it.sekil); });
        yukseltiSekilKur(sekilG.sekil, sekilG.sekilKenarlar || [], sablon);
      }
      for (i = 0; i < yerlesim.length; i++) {
        g = yerlesim[i];
        if (g.tip === "yukselti" && g.sekil && uzIstek[g.kenar]) {
          yukseltiUcaGore(g, uzIstek[g.kenar], o.en, o.boy, yukseltiKoseYon(g.kenar, g.sekilKenarlar || []));
        }
      }
    }
    var toplam = {};
    for (i = 0; i < yerlesim.length; i++) {
      g = yerlesim[i];
      if (g.tip !== "yukselti") continue;
      toplam[g.kenar] = (toplam[g.kenar] || 0) + g.p.uzunluk;
      wall = yukseltiDuvarBoyu(g.kenar, o.en, o.boy);
      if (toplam[g.kenar] > wall + 0.5) {
        yerlesim = yedek;
        yaz("Ölçü duvarı aşıyor usta.", true);
        return;
      }
    }
    if (yukseltiBinmeVar()) {
      yerlesim = yedek;
      yaz("Yükseltiler binmez usta.", true);
      return;
    }
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip !== "yukselti") continue;
      for (j = 0; j < yerlesim.length; j++) {
        if (yerlesim[j].tip === "esik" && yukseltiKutuBiner(yerlesim[i], yerlesim[j])) {
          yerlesim = yedek;
          yaz("Yükselti kapı önüne taşıyor usta.", true);
          return;
        }
      }
    }
    turKaydet();
    islemKaydet();
    yukseltiSecIx = -1;
    seciliIx = -1;
    ayarYaz();
    yaz("Dolap altı yükselti uygulandı.", false);
    zeminListeSay();
  }

  function parcaUygula(tip, motor) {
    if (tip === "yukselti") {
      yukseltiOlcuUygula(motor);
      return;
    }
    var inp = motor.querySelectorAll("input[data-alan]");
    var p = {};
    var i, n, ham, ana, k, i2, parca, o;
    var dolu = false;
    for (i = 0; i < inp.length; i++) {
      ana = inp[i].getAttribute("data-alan");
      ham = String(inp[i].value || "").trim();
      if (!ham) continue;
      n = parseFloat(O.mmAl(inp[i].value));
      if (!(n > 0)) {
        yaz("Ölçü gir usta.", true);
        return;
      }
      p[ana] = n;
      dolu = true;
    }
    if (!dolu) {
      yaz("Ölçü gir usta.", true);
      return;
    }
    i2 = parcaIxTip(tip);
    if (i2 < 0 && tip === "esik") i2 = parcaIxTip("kapi");
    o = taslakOlcu();
    if (i2 < 0) {
      parca = hizala(tip, o.en / 2, o.boy / 2, { tip: tip, p: p });
      yerlesim.push(parca);
      seciliIx = yerlesim.length - 1;
    } else {
      parca = yerlesim[i2];
      if (!parca.p) parca.p = {};
      for (k in p) {
        if (Object.prototype.hasOwnProperty.call(p, k)) parca.p[k] = p[k];
      }
      yerlesim[i2] = hizala(parca.tip, parca.x + parca.en / 2, parca.z + parca.boy / 2, parca);
      seciliIx = i2;
    }
    turKaydet();
    islemKaydet();
    camSeciliTip = "";
    seciliIx = -1;
    ayarYaz();
    yaz((GEREK_AD[tip] || "Parça") + " uygulandı.", false);
    zeminListeSay();
  }

  function parcaMotorDoldur(motor, tip) {
    motor.textContent = "";
    var bas = document.createElement("p");
    bas.className = "camMotorBas";
    bas.textContent = GEREK_AD[tip] || tip;
    motor.appendChild(bas);
    var alan = tip === "yukselti" ? [] : parcaAlan(tip);
    var ix = parcaIxTip(tip);
    if (ix < 0 && tip === "esik") ix = parcaIxTip("kapi");
    var g = ix >= 0 ? yerlesim[ix] : null;
    var i;
    for (i = 0; i < alan.length; i++) {
      (function (ana, etiket) {
        var lab = document.createElement("label");
        lab.appendChild(document.createTextNode(etiket + " ("));
        var birim = document.createElement("span");
        birim.className = "birimAd";
        lab.appendChild(birim);
        lab.appendChild(document.createTextNode(")"));
        var inp = document.createElement("input");
        inp.type = "number";
        inp.min = "0";
        inp.step = "any";
        inp.setAttribute("data-alan", ana);
        inp.placeholder = "İsteğe bağlı";
        inp.value = (g && g.p && g.p[ana] > 0) ? O.goster(g.p[ana]) : (
          tip === "oda_zemin" && zeminDurum && zeminDurum.oda && zeminDurum.oda[ana] > 0
            ? O.goster(zeminDurum.oda[ana]) : ""
        );
        lab.appendChild(inp);
        motor.appendChild(lab);
      })(alan[i][0], alan[i][1]);
    }
    if (tip === "yukselti") {
      var yler = [];
      var yi;
      for (yi = 0; yi < yerlesim.length; yi++) {
        if (yerlesim[yi].tip === "yukselti") yler.push(yi);
      }
      yler.sort(function (a, b) { return (yerlesim[a].yno || 0) - (yerlesim[b].yno || 0); });
      if (yler.indexOf(yukseltiSecIx) < 0) {
        yukseltiSecIx = -1;
        for (yi = 0; yi < yler.length; yi++) {
          (function (ix) {
            var par = yerlesim[ix];
            var sik = document.createElement("button");
            sik.type = "button";
            sik.className = "duvarEngel";
            sik.textContent = yukseltiAd(par) + (par.p && par.p.kod > 0 ? "  +" + O.yazi(par.p.kod) : "");
            sik.addEventListener("click", function (ev) {
              if (ev.stopPropagation) ev.stopPropagation();
              yukseltiSecIx = ix;
              seciliIx = ix;
              ayarYaz();
              ciz();
            });
            motor.appendChild(sik);
          })(yler[yi]);
        }
        var ekle = document.createElement("button");
        ekle.type = "button";
        ekle.className = "duvarEngel";
        ekle.textContent = "Ekle";
        ekle.addEventListener("click", function (ev) {
          if (ev.stopPropagation) ev.stopPropagation();
          yukseltiEkle = true;
          yukseltiYedek = null;
          camSeciliTip = "";
          yukseltiSurukleGoster();
        });
        motor.appendChild(ekle);
        O.etiketYaz();
        return;
      }
      var geri = document.createElement("button");
      geri.type = "button";
      geri.className = "duvarEngel";
      geri.textContent = "← Yükseltiler";
      geri.addEventListener("click", function (ev) {
        if (ev.stopPropagation) ev.stopPropagation();
        yukseltiSecIx = -1;
        seciliIx = -1;
        ayarYaz();
        ciz();
      });
      motor.appendChild(geri);
      yler = [yukseltiSecIx];
      for (yi = 0; yi < yler.length; yi++) {
        (function (ix) {
          var par = yerlesim[ix];
          var ad = document.createElement("p");
          ad.className = "camMotorBas";
          ad.textContent = yukseltiAd(par) + (par.p && par.p.kod > 0 ? "  +" + O.yazi(par.p.kod) : "");
          motor.appendChild(ad);
          [["uzunluk", "Uzunluk"], ["derinlik", "Derinlik"], ["yukseklik", "Yükseklik"]].forEach(function (a) {
            var labU = document.createElement("label");
            labU.appendChild(document.createTextNode(a[1] + " ("));
            var birimU = document.createElement("span");
            birimU.className = "birimAd";
            labU.appendChild(birimU);
            labU.appendChild(document.createTextNode(")"));
            var inpU = document.createElement("input");
            inpU.type = "number";
            inpU.min = "0";
            inpU.step = "any";
            inpU.setAttribute("data-alan", a[0]);
            inpU.setAttribute("data-ix", String(ix));
            inpU.value = (par.p && par.p[a[0]] > 0) ? O.goster(par.p[a[0]]) : "";
            labU.appendChild(inpU);
            motor.appendChild(labU);
          });
        })(yler[yi]);
      }
    }
    var uygula = document.createElement("button");
    uygula.type = "button";
    uygula.className = "parcaUygula";
    uygula.textContent = "Uygula";
    uygula.addEventListener("click", function (ev) {
      if (ev.stopPropagation) ev.stopPropagation();
      parcaUygula(tip, motor);
    });
    motor.appendChild(uygula);
    O.etiketYaz();
  }

  function modulZeminCiz() {
    var satir = document.getElementById("modulZeminSatir");
    if (!satir) return;
    var liste = [
      { tip: "esik", ad: "Eşik", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="7" y="3" width="10" height="18" rx="1"/></svg>' },
      { tip: "yukselti", ad: "Yükselti", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="13" width="16" height="5" rx="1"/></svg>' },
      { tip: "sifon", ad: "Sifon", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="6"/></svg>' }
    ];
    var html = "";
    var i, t;
    for (i = 0; i < liste.length; i++) {
      t = liste[i];
      if (!zeminParcaVar(t.tip) && !(t.tip === "esik" && zeminParcaVar("kapi"))) continue;
      html += '<button type="button" data-tip="' + t.tip + '" class="' + (camSeciliTip === t.tip ? "secili" : "") + '" aria-label="' + t.ad + '">' + t.svg + t.ad + "</button>";
    }
    satir.innerHTML = html;
  }

  function modulDuvarCiz() {
    var satir = document.getElementById("modulDuvarSatir");
    if (!satir) return;
    var sira = duvarSaatSira();
    var html = "";
    var i, kenar, ad, parca;
    for (i = 0; i < sira.length; i++) {
      kenar = sira[i];
      if (!duvarOruluKenar(kenar)) continue;
      ad = duvarDYazi(kenar);
      parca = ad.split(" ");
      html += '<button type="button" data-kenar="' + kenar + '" class="' + (duvarSecKenar === kenar ? "secili" : "") + '" aria-label="' + ad + '">' + parca[0] + "<br>" + (parca.slice(1).join(" ") || "") + "</button>";
    }
    satir.innerHTML = html;
  }

  function modulDuvarYaz() {
    var btn = document.getElementById("modulDuvar");
    var satir = document.getElementById("modulDuvarSatir");
    if (!btn) return;
    var gor = motorSayfa === "duvar";
    btn.classList.toggle("gorunur", gor);
    if (!gor) {
      btn.classList.remove("acik");
      btn.setAttribute("aria-expanded", "false");
      if (satir) satir.classList.remove("acik");
      return;
    }
    if (satir && satir.classList.contains("acik")) modulDuvarCiz();
  }

  function modulMobilyaYaz() {
    var btn = document.getElementById("modulMobilya");
    if (!btn) return;
    var gor = motorSayfa === "duvar" && !!(durum.hazirlik_onay || soruAdim === "duvar_kilit" || soruAdim === "mobilya");
    var satirAcik = gor && soruAdim === "mobilya";
    var satir = document.getElementById("modulMobilyaSatir");
    btn.classList.toggle("gorunur", gor);
    btn.classList.toggle("acik", satirAcik);
    btn.setAttribute("aria-expanded", satirAcik ? "true" : "false");
    if (satir && !satirAcik) {
      satir.classList.remove("acik");
      satir.textContent = "";
    }
  }

  function ayarYaz() {
    modulZeminCiz();
    modulDuvarYaz();
    modulMobilyaYaz();
    if (cepheMod) {
      var motorC = document.getElementById("levhaCamMotor");
      if (motorC) {
        motorC.classList.remove("acik");
        motorC.classList.remove("duvarBilgi");
        motorC.textContent = "";
      }
      var kilitBtn = document.getElementById("cepheKilitle");
      if (kilitBtn) kilitBtn.classList.add("acik");
      var barC = document.getElementById("levhaCam");
      if (barC) barC.classList.remove("var");
      ciz();
      return;
    }
    var kutu = document.getElementById("gerecAyar");
    var odaSira = document.querySelector(".altBar .sira3");
    var motor = document.getElementById("levhaCamMotor");
    if (kutu) kutu.classList.remove("acik");
    solParcaYaz();
    if (motorSayfa === "duvar" && duvarModul === "olcu" && duvarSecKenar && camSeciliTip !== "duvar" && !(camSeciliTip && PARCA_LISTE[camSeciliTip])) {
      if (odaSira) odaSira.style.display = "none";
      if (motor) {
        duvarKodListeDoldur(motor);
        motor.classList.add("acik");
        motor.classList.add("duvarBilgi");
        rafInceYaz(true);
      }
      ciz();
      return;
    }
    if (camSeciliTip === "duvar" && motorSayfa === "duvar") {
      if (odaSira) odaSira.style.display = "none";
      if (motor) {
        duvarKodListeDoldur(motor);
        motor.classList.add("acik");
        motor.classList.remove("duvarBilgi");
        rafInceYaz(true);
      }
      ciz();
      return;
    }
    if (!camSeciliTip || !camGeldi[camSeciliTip] || !PARCA_LISTE[camSeciliTip]) {
      if (odaSira) odaSira.style.display = "";
      if (motor) {
        motor.classList.remove("acik");
        motor.classList.remove("duvarBilgi");
        motor.textContent = "";
        rafInceYaz(false);
      }
      ciz();
      return;
    }
    if (odaSira) odaSira.style.display = "none";
    if (motor) {
      parcaMotorDoldur(motor, camSeciliTip);
      motor.classList.add("acik");
      motor.classList.remove("duvarBilgi");
      rafInceYaz(true);
    }
    ciz();
  }

  function noktaSahne(istemciX, istemciY) {
    var cv = sahne.canvas;
    var r = cv.getBoundingClientRect();
    var px = (istemciX - r.left) * (cv.width / r.width);
    var py = (istemciY - r.top) * (cv.height / r.height);
    if (motorSayfa !== "duvar") return kusHarita().mm(px, py);
    var cam = sonCam;
    if (!cam) return kusHarita().mm(px, py);
    var denom = cam.oy - py;
    if (Math.abs(denom) < 1) return null;
    var dz = cam.f * cam.y / denom;
    return { x: cam.x + (px - cam.ox) * dz / cam.f, z: dz + cam.z };
  }


  var cizRaf = 0;
  function ciz() {
    if (cizRaf) return;
    cizRaf = requestAnimationFrame(function () {
      cizRaf = 0;
      Ciz.sahneBoyut();
      Ciz.cizSahne();
      kapiOrtaYerle();
      ekOrtaYerle();
      yukseltiOrtaYerle();
      sifonOrtaYerle();
      solParcaYaz();
      yukseltiCevirYaz();
    });
  }

  function ortaIkonKoy(el) {
    var k = kusHarita();
    el.style.left = k.sx(k.en / 2) + "px";
    el.style.top = k.sy(k.boy / 2) + "px";
    el.classList.add("acik");
    el.classList.toggle("cekiliyor", !!suruklenen);
  }

  function ortaIkonKapa(el) {
    if (!el) return;
    el.classList.remove("acik");
    el.classList.remove("cekiliyor");
  }

  function kapiOrtaYerle() {
    var el = document.getElementById("kapiSurukle");
    if (!el) return;
    if (soruAdim !== "kapi_surukle") {
      ortaIkonKapa(el);
      return;
    }
    ortaIkonKoy(el);
  }

  function sifonOrtaYerle() {
    var el = document.getElementById("sifonSurukle");
    if (!el) return;
    if (soruAdim !== "sifon_surukle") {
      ortaIkonKapa(el);
      return;
    }
    ortaIkonKoy(el);
  }
  function yukseltiOrtaYerle() {
    var el = document.getElementById("yukseltiSurukle");
    if (!el) return;
    if (soruAdim !== "yukselti_surukle") {
      ortaIkonKapa(el);
      return;
    }
    ortaIkonKoy(el);
  }

  function ekOrtaYerle() {
    var el = document.getElementById("ekSurukle");
    if (!el) return;
    if (soruAdim !== "ek_yerlestir") {
      ortaIkonKapa(el);
      return;
    }
    ortaIkonKoy(el);
  }

  function bagla(id, olay, fn) {
    var n = document.getElementById(id);
    if (n) n.addEventListener(olay, fn);
  }

  bagla("yukseltiCevir", "pointerdown", function (ev) { ev.stopPropagation(); });
  bagla("yukseltiCevir", "click", function (ev) {
    var b = ev.target.closest("button[data-yon]");
    if (!b) return;
    ev.stopPropagation();
    yukseltiCevir(parseInt(b.getAttribute("data-yon"), 10));
  });

  bagla("odaEn", "input", function () {
    if (!durum.oda) ciz();
  });
  bagla("odaBoy", "input", function () {
    if (!durum.oda) ciz();
  });

  bagla("odaUygula", "click", function () {
    if (!Z || !zeminDurum) {
      yaz("Zemin motoru yok.", true);
      return;
    }
    if (!zeminAl(Z.muhur(zeminDurum))) {
      yaz(zeminDurum.soz || "Oda turu bitmedi.", true);
      return;
    }
    yerlesimKilit = true;
    muhurKaydet("zemin");
    seritKilitGoster();
    seciliIx = -1;
    islemKaydet();
    duvarPanelineGec();
  });

  function duvarPanelineGec() {
    if (durum.duvarlar && durum.duvarlar.length) {
      turKaydet();
      duvarSayfasiAc();
      return;
    }
    var o = (zeminDurum && zeminDurum.oda) ? zeminDurum.oda : taslakOlcu();
    var yukEl = document.getElementById("odaYuk");
    var yuk = yukEl ? parseFloat(O.mmAl(yukEl.value)) : 2600;
    if (!(yuk > 0)) yuk = 2600;
    durum.zemin = zeminDurum;
    yorunge.yaw = 0.72;
    yorunge.pitch = 0.48;
    yorunge.uzak = 0;
    if (!D) {
      yaz("Duvar motoru yok.", true);
      return;
    }
    if (!duvarAl(D.odaAyarla(o.en, o.boy, yuk, true))) return;
    duvarTur = { no: 1, tip: "", yon: "sol", kose: "1-2", en: 0, boy: 0 };
    duvarKapiYerlestir(false);
    ayarYaz();
    motorSayfa = "duvar";
    anketAc("mutfak_sekil");
  }

  var KASA_ANAHTAR = "magi_atolye_kasa";
  var PROFIL_ANAHTAR = "magi_usta_profil";
  var kasaAktifId = "";

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
    /* Atolye Kasasi kopru sonra bu kaydi alir. Motor yok. */
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
    if (!Array.isArray(u.musteriler)) u.musteriler = [];
    u.atolye = String(p.dukkan || u.atolye || "").trim();
    u.usta = String(p.ad || u.usta || "").trim();
    kasaYaz(kasa);
    return { kasa: kasa, ana: ana, u: u };
  }

  function islerSecilen() {
    var out = [];
    var n = document.querySelectorAll('#ayarPanel input[name="isler"]:checked');
    var i;
    for (i = 0; i < n.length; i++) out.push(n[i].value);
    return out;
  }

  function islerYaz(liste) {
    var n = document.querySelectorAll('#ayarPanel input[name="isler"]');
    var set = {};
    var i;
    for (i = 0; i < (liste || []).length; i++) set[liste[i]] = true;
    for (i = 0; i < n.length; i++) n[i].checked = !!set[n[i].value];
  }

  function musteriSatirYap(sinif) {
    var satir = document.createElement("div");
    satir.className = "musteriSatir";
    if (sinif) satir.className += " " + sinif;
    return satir;
  }

  function musteriListeIsaretGuncelle() {
    var kutular = document.querySelectorAll("#musteriListe input.musteriIsaret");
    var tum = document.getElementById("musteriTumunuSec");
    var i, hepsi = kutular.length > 0;
    for (i = 0; i < kutular.length; i++) {
      if (!kutular[i].checked) hepsi = false;
    }
    if (tum) tum.checked = hepsi;
  }

  function musteriAktifIsaret() {
    var n = document.querySelectorAll("#musteriListe .musteriAdBtn, #musteriListe .musteriYeniBtn");
    var i;
    for (i = 0; i < n.length; i++) {
      if (n[i].classList.contains("musteriYeniBtn")) {
        n[i].classList.toggle("secili", !kasaAktifId);
      } else {
        n[i].classList.toggle("secili", n[i].getAttribute("data-id") === kasaAktifId);
      }
    }
  }

  function musteriBos() {
    kasaAktifId = "";
    document.getElementById("musteriAd").value = "";
    document.getElementById("musteriSoyad").value = "";
    document.getElementById("musteriAdres").value = "";
    document.getElementById("musteriDiger").value = "";
    islerYaz([]);
    musteriAktifIsaret();
  }

  function musteriDoldur(kayit) {
    kasaAktifId = kayit && kayit.id ? kayit.id : "";
    document.getElementById("musteriAd").value = (kayit && kayit.ad) || "";
    document.getElementById("musteriSoyad").value = (kayit && kayit.soyad) || "";
    document.getElementById("musteriAdres").value = (kayit && kayit.adres) || "";
    document.getElementById("musteriDiger").value = (kayit && kayit.diger) || "";
    islerYaz((kayit && kayit.isler) || []);
    musteriAktifIsaret();
  }

  function musteriListeYaz() {
    var paket = ustaKasasi();
    var kutu = document.getElementById("musteriListe");
    if (!kutu) return;
    kutu.innerHTML = "";
    var tumSatir = document.createElement("label");
    tumSatir.className = "musteriSatir";
    var tum = document.createElement("input");
    tum.type = "checkbox";
    tum.id = "musteriTumunuSec";
    var tumYazi = document.createElement("span");
    tumYazi.textContent = "Tümünü seç";
    tumSatir.appendChild(tum);
    tumSatir.appendChild(tumYazi);
    kutu.appendChild(tumSatir);
    var yeniSatir = musteriSatirYap();
    var yeniBos = document.createElement("span");
    yeniBos.style.minWidth = "22px";
    yeniBos.style.display = "inline-block";
    var yeniBtn = document.createElement("button");
    yeniBtn.type = "button";
    yeniBtn.className = "musteriYeniBtn";
    yeniBtn.textContent = "Yeni müşteri";
    yeniSatir.appendChild(yeniBos);
    yeniSatir.appendChild(yeniBtn);
    kutu.appendChild(yeniSatir);
    var i, m, satir, kutuIs, adBtn, ad;
    for (i = 0; i < paket.u.musteriler.length; i++) {
      m = paket.u.musteriler[i];
      satir = musteriSatirYap();
      kutuIs = document.createElement("input");
      kutuIs.type = "checkbox";
      kutuIs.className = "musteriIsaret";
      kutuIs.setAttribute("data-id", m.id);
      adBtn = document.createElement("button");
      adBtn.type = "button";
      adBtn.className = "musteriAdBtn";
      adBtn.setAttribute("data-id", m.id);
      ad = String(m.ad || "") + " " + String(m.soyad || "");
      adBtn.textContent = ad.trim() || "Kayıt";
      satir.appendChild(kutuIs);
      satir.appendChild(adBtn);
      kutu.appendChild(satir);
    }
    musteriAktifIsaret();
    musteriListeIsaretGuncelle();
  }

  function ayarAc() {
    menuKapat();
    var paket = ustaKasasi();
    document.getElementById("ayarAtolye").value = paket.u.atolye || "";
    document.getElementById("ayarUsta").value = paket.u.usta || "";
    musteriListeYaz();
    if (kasaAktifId) {
      var i, m;
      for (i = 0; i < paket.u.musteriler.length; i++) {
        m = paket.u.musteriler[i];
        if (m.id === kasaAktifId) {
          musteriDoldur(m);
          break;
        }
      }
    } else {
      musteriBos();
    }
    var p = document.getElementById("ayarPanel");
    if (p) p.classList.add("acik");
  }

  function ayarKapat() {
    var p = document.getElementById("ayarPanel");
    if (p) p.classList.remove("acik");
  }

  function yeniId() {
    return "m" + String(Date.now());
  }

  bagla("ayarKapat", "click", ayarKapat);
  bagla("musteriYeni", "click", musteriBos);
  bagla("musteriListe", "change", function (ev) {
    var t = ev && ev.target;
    if (!t) return;
    if (t.id === "musteriTumunuSec") {
      var kutular = document.querySelectorAll("#musteriListe input.musteriIsaret");
      var i;
      for (i = 0; i < kutular.length; i++) kutular[i].checked = !!t.checked;
      return;
    }
    if (t.classList && t.classList.contains("musteriIsaret")) musteriListeIsaretGuncelle();
  });
  bagla("musteriListe", "click", function (ev) {
    var t = ev && ev.target;
    if (!t || !t.classList) return;
    if (t.classList.contains("musteriYeniBtn")) {
      musteriBos();
      return;
    }
    if (!t.classList.contains("musteriAdBtn")) return;
    var id = t.getAttribute("data-id") || "";
    if (!id) {
      musteriBos();
      return;
    }
    var paket = ustaKasasi();
    var i, m;
    for (i = 0; i < paket.u.musteriler.length; i++) {
      m = paket.u.musteriler[i];
      if (m.id === id) {
        musteriDoldur(m);
        return;
      }
    }
  });
  bagla("musteriSil", "click", function () {
    var kutular = document.querySelectorAll("#musteriListe input.musteriIsaret:checked");
    if (!kutular.length) {
      yaz("Önce müşteri işaretle usta.", true);
      return;
    }
    yedekBekleyen = null;
    onayIs = "musteriSil";
    var soru = document.getElementById("geriSoru");
    if (soru) soru.textContent = "İşaretli müşteriler silinsin mi?";
    var kutu = document.getElementById("geriOnay");
    if (kutu) kutu.classList.add("acik");
  });
  function musteriKaydetYap() {
    var ad = String(document.getElementById("musteriAd").value || "").trim();
    var soyad = String(document.getElementById("musteriSoyad").value || "").trim();
    if (!ad && !soyad) {
      yaz("Müşteri adı gerekli.", true);
      return false;
    }
    var paket = ustaKasasi();
    var kayit = {
      id: kasaAktifId || yeniId(),
      ad: ad,
      soyad: soyad,
      adres: String(document.getElementById("musteriAdres").value || "").trim(),
      isler: islerSecilen(),
      diger: String(document.getElementById("musteriDiger").value || "").trim(),
      guncelleme: new Date().toISOString()
    };
    var i, varMi = false;
    for (i = 0; i < paket.u.musteriler.length; i++) {
      if (paket.u.musteriler[i].id === kayit.id) {
        paket.u.musteriler[i] = kayit;
        varMi = true;
        break;
      }
    }
    if (!varMi) paket.u.musteriler.push(kayit);
    kasaAktifId = kayit.id;
    kasaYaz(paket.kasa);
    musteriListeYaz();
    return true;
  }

  bagla("musteriKaydet", "click", function () {
    if (musteriKaydetYap()) yaz("Müşteri kasaya yazıldı.", false);
  });

  function acikAdim() {
    if (document.getElementById("adimSahne") && document.getElementById("adimSahne").classList.contains("acik")) return "adimSahne";
    if (document.getElementById("adimIs") && document.getElementById("adimIs").classList.contains("acik")) return "adimIs";
    if (document.getElementById("adimMusteri") && document.getElementById("adimMusteri").classList.contains("acik")) return "adimMusteri";
    return "adimMerhaba";
  }

  function webOnayAc() {
    yedekBekleyen = null;
    onayIs = "";
    var soru = document.getElementById("geriSoru");
    if (soru) soru.textContent = "Web sayfasına geçmek istiyor musunuz?";
    var kutu = document.getElementById("geriOnay");
    if (kutu) kutu.classList.add("acik");
  }

  function duvarEkraniMi() {
    return motorSayfa === "duvar";
  }

  function zeminMotorGoster() {
    cepheGizle();
    if (motorSayfa === "duvar") duvarSoruAdim = soruAdim;
    motorSayfa = "zemin";
    camSeciliTip = "";
    duvarSecKenar = "";
    duvarPanel = "";
    yerlesimKilit = false;
    var motorKapa = document.getElementById("levhaCamMotor");
    if (motorKapa) {
      motorKapa.classList.remove("acik");
      motorKapa.textContent = "";
    }
    if (zeminDurum && zeminDurum.kilit) {
      panellerKapa();
      var uy = document.getElementById("odaUygula");
      if (uy) uy.style.display = "flex";
      yaz("Zemin.", false);
      ayarYaz();
      ciz();
      return;
    }
    if (soruAdim === "en" || soruAdim === "boy") soruAc(soruAdim, soruAdim === "boy" ? "Oda boy kaç?" : "Oda en kaç?");
    else if (soruAdim === "kapi_surukle") kapiSurukleGoster();
    else if (String(soruAdim).indexOf("duvar") === 0 || String(soruAdim).indexOf("mutfak") === 0) {
      panellerKapa();
      var ss = document.getElementById("soruSatir");
      if (ss) ss.classList.add("acik");
      soruAc("en", "Oda en kaç?");
    } else {
      panellerKapa();
      yaz("Zemin.", false);
    }
    ayarYaz();
    ciz();
  }

  function duvarSayfasiAc() {
    motorSayfa = "duvar";
    camSeciliTip = "";
    duvarModul = "";
    duvarPanel = "";
    if (zeminDurum && zeminDurum.kilit) yerlesimKilit = true;
    if (duvarSoruAdim) soruAdim = duvarSoruAdim;
    if (durum.hazirlik_onay || soruAdim === "duvar_kilit" || soruAdim === "mobilya") {
      if (soruAdim === "mobilya") {
        mobilyaAc();
        return;
      }
      panellerKapa();
      soruAdim = "duvar_kilit";
      yaz("Duvar.", false);
      ayarYaz();
      ciz();
      return;
    }
    if (soruAdim === "duvar_sol") {
      soruAc("duvar_sol", duvarTur.yon === "sag" ? "Sağdan kaç?" : "Soldan kaç?");
      return;
    }
    if (String(soruAdim).indexOf("duvar") === 0 || String(soruAdim).indexOf("mutfak") === 0) {
      anketAc(soruAdim);
      return;
    }
    anketAc("mutfak_sekil");
  }

  function sahneyeDon() {
    adimGoster("adimSahne", false);
    seritKilitGoster();
    if (durum.hazirlik_onay || soruAdim === "duvar_kilit" || soruAdim === "mobilya") {
      if (soruAdim === "mobilya") {
        mobilyaAc();
      } else {
        panellerKapa();
        soruAdim = "duvar_kilit";
        yaz("Duvar kilit. Kayıt duruyor usta.", false);
      }
    } else if (soruAdim === "duvar_sol") {
      soruAc("duvar_sol", duvarTur.yon === "sag" ? "Sağdan kaç?" : "Soldan kaç?");
    } else if (String(soruAdim).indexOf("duvar") === 0 || String(soruAdim).indexOf("mutfak") === 0) {
      anketAc(soruAdim);
    } else if (zeminDurum && zeminDurum.kilit) {
      panellerKapa();
      yaz("Zemin kilit. Kayıt duruyor usta.", false);
    }
    ayarYaz();
    ciz();
  }

  function oncekiSayfa() {
    menuKapat();
    var ayar = document.getElementById("ayarPanel");
    if (ayar && ayar.classList.contains("acik")) {
      ayarKapat();
      return;
    }
    var n = acikAdim();
    if (n === "adimSahne") {
      if (cepheMod) {
        cepheKapat();
        return;
      }
      if (zeminOnceki()) return;
      if (duvarEkraniMi()) {
        zeminMotorGoster();
        return;
      }
      turKaydet();
      musteriListeYaz();
      adimGoster("adimMusteri");
      return;
    }
    if (n === "adimIs") {
      musteriListeYaz();
      adimGoster("adimMusteri");
      return;
    }
    webOnayAc();
  }

  function sayfaIleri() {
    menuKapat();
    var ayar = document.getElementById("ayarPanel");
    if (ayar && ayar.classList.contains("acik")) {
      ayarKapat();
      return;
    }
    var n = acikAdim();
    if (n === "adimMerhaba") {
      musteriListeYaz();
      adimGoster("adimMusteri");
      return;
    }
    if (n === "adimMusteri") {
      var md = document.getElementById("musteriDevam");
      if (md) md.click();
      return;
    }
    if (n === "adimIs") {
      var idv = document.getElementById("isDevam");
      if (idv) idv.click();
      return;
    }
    sonrakiSayfa();
  }

  function zeminOnceki() {
    if (soruAdim === "birak") {
      if (zeminAnket.sifon) { yerlesimTipSil("sifon"); sifonSurukleGoster(); return true; }
      if (zeminAnket.yukselti) { yerlesimTipSil("yukselti"); yukseltiSurukleGoster(); return true; }
      sekilTuraGeri();
      return true;
    }
    if (soruAdim === "sifon_surukle") {
      yerlesimTipSil("sifon");
      if (zeminAnket.yukselti) { yukseltiSurukleGoster(); return true; }
      sekilTuraGeri();
      return true;
    }
    if (soruAdim === "yukselti_surukle") {
      yerlesimTipSil("yukselti");
      sekilTuraGeri();
      return true;
    }
    if (soruAdim === "sifon") { anketAc(zeminAnket.yukselti ? "yukselti_sekil" : "yukselti"); return true; }
    if (soruAdim === "yukselti_sekil") { anketAc("yukselti"); return true; }
    if (soruAdim === "yukselti") { anketAc("oda_tip"); return true; }
    if (soruAdim === "oda_tip") { kapiSurukleGoster(); return true; }
    if (soruAdim === "kapi_surukle") { soruAc("boy", "Oda boy kaç?"); return true; }
    if (soruAdim === "boy") { soruAc("en", "Oda en kaç?"); return true; }
    if (soruAdim === "gonye_c2") { gonyeCaprazAc(1); return true; }
    if (soruAdim === "gonye_c1") { gonyeIx = 3; gonyeDuvarSor(); return true; }
    if (soruAdim === "gonye_duvar") {
      if (gonyeIx > 0) { gonyeIx -= 1; gonyeDuvarSor(); return true; }
      anketAc("sifon");
      return true;
    }
    if (soruAdim === "ek_yerlestir") { soruAc("ek_boy", "Ek boy (derinlik) kaç?"); return true; }
    if (soruAdim === "ek_boy") { soruAc("ek_en", ((zeminDurum.taslak || {}).tip === "oyuk" ? "Girinti" : "Çıkıntı") + " en (kenar boyunca) kaç?"); return true; }
    if (soruAdim === "ek_en") { anketAc("sifon"); return true; }
    if (soruAdim === "ek_var") { anketAc("sifon"); return true; }
    if (soruAdim === "duvar_sol") { anketAc("duvar_yon"); return true; }
    if (soruAdim === "duvar_yon") { anketAc("duvar_gerec"); return true; }
    if (soruAdim === "pimas_kose") { anketAc("duvar_gerec"); return true; }
    if (soruAdim === "duvar_gerec" || soruAdim === "duvar_baska") { anketAc("duvar_no"); return true; }
    if (soruAdim === "duvar_no") { anketAc("mutfak_duvar"); return true; }
    if (soruAdim === "mutfak_duvar") { anketAc("mutfak_sekil"); return true; }
    if (soruAdim === "duvar_baska_duvar") { anketAc("mutfak_duvar"); return true; }
    if (soruAdim === "mutfak_sekil") { zeminMotorGoster(); return true; }
    if (soruAdim === "mobilya") {
      panellerKapa();
      soruAdim = "duvar_kilit";
      yaz("Duvar kilit. Kayıt duruyor usta.", false);
      ayarYaz();
      ciz();
      return true;
    }
    if (soruAdim === "duvar_kilit") { zeminMotorGoster(); return true; }
    return false;
  }

  function yerlesimSon(a, b) {
    var i, g = null;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === a || (b && yerlesim[i].tip === b)) g = yerlesim[i];
    }
    return g;
  }

  function sonrakiSayfa() {
    menuKapat();
    if (acikAdim() !== "adimSahne") return;
    if (soruAdim === "en" || soruAdim === "boy" || soruAdim === "ek_en" || soruAdim === "ek_boy" || soruAdim === "gonye_duvar" || soruAdim === "gonye_c1" || soruAdim === "gonye_c2" || soruAdim === "duvar_sol") {
      soruIsle();
      return;
    }
    if (soruAdim === "kapi_surukle") {
      var es = yerlesimSon("esik", "kapi");
      if (!es) { yaz("Eşiği yerine bırak usta", true); return; }
      kapiBirakildi(es);
      return;
    }
    if (soruAdim === "ek_yerlestir") { yaz("Kenara sürükle bırak usta", true); return; }
    if (soruAdim === "yukselti_surukle") {
      if (!zeminParcaVar("yukselti")) { yaz("Yükseltiyi yerine bırak usta", true); return; }
      zeminParcaTur();
      return;
    }
    if (soruAdim === "sifon_surukle") {
      if (!zeminParcaVar("sifon")) { yaz("Sifonu yerine bırak usta", true); return; }
      zeminParcaTur();
      return;
    }
    if (soruAdim === "oda_tip" || soruAdim === "yukselti" || soruAdim === "sifon" || soruAdim === "mutfak_sekil" || soruAdim === "mutfak_duvar" || soruAdim === "duvar_no" || soruAdim === "duvar_gerec" || soruAdim === "duvar_yon" || soruAdim === "pimas_kose" || soruAdim === "duvar_baska" || soruAdim === "duvar_baska_duvar") {
      yaz("Seç usta", true);
      return;
    }
    if (soruAdim === "birak") {
      var uy = document.getElementById("odaUygula");
      if (uy) uy.click();
      return;
    }
    if (soruAdim === "duvar_kilit" && durum.hazirlik_onay) {
      mobilyaAc();
    }
  }

  bagla("geriBtn", "click", oncekiSayfa);
  var zeminListeTmr = null;
  function zeminListeKapat() {
    var satir = document.getElementById("modulZeminSatir");
    var btn = document.getElementById("modulZemin");
    if (zeminListeTmr) {
      clearTimeout(zeminListeTmr);
      zeminListeTmr = null;
    }
    if (satir) satir.classList.remove("acik");
    if (btn) {
      btn.classList.remove("acik");
      btn.setAttribute("aria-expanded", "false");
    }
  }
  function zeminListeSay() {
    var satir = document.getElementById("modulZeminSatir");
    if (!satir || !satir.classList.contains("acik")) return;
    if (zeminListeTmr) clearTimeout(zeminListeTmr);
    zeminListeTmr = setTimeout(zeminListeKapat, 7000);
  }
  bagla("modulZemin", "click", function () {
    var satir = document.getElementById("modulZeminSatir");
    var btn = document.getElementById("modulZemin");
    var ac;
    if (!satir || !btn) return;
    ac = !satir.classList.contains("acik");
    satir.classList.toggle("acik", ac);
    btn.classList.toggle("acik", ac);
    btn.setAttribute("aria-expanded", ac ? "true" : "false");
    if (ac) {
      duvarListeKapat();
      mobilyaSatirKapat();
      modulZeminCiz();
      zeminListeSay();
    } else if (zeminListeTmr) {
      clearTimeout(zeminListeTmr);
      zeminListeTmr = null;
    }
  });
  var zeminSatir = document.getElementById("modulZeminSatir");
  if (zeminSatir) zeminSatir.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest("button[data-tip]") : null;
    var tip, ix;
    if (!t || !zeminSatir.contains(t)) return;
    tip = t.getAttribute("data-tip");
    if (!tip || !PARCA_LISTE[tip]) return;
    camGeldi[tip] = true;
    if (camSeciliTip === tip) camSeciliTip = "";
    else camSeciliTip = tip;
    ix = parcaIxTip(tip);
    if (ix < 0 && tip === "esik") ix = parcaIxTip("kapi");
    if (tip === "yukselti") {
      yukseltiSecIx = -1;
      ix = -1;
    }
    seciliIx = ix;
    ayarYaz();
    islemKaydet();
    zeminListeSay();
  });
  var zeminMotor = document.getElementById("levhaCamMotor");
  if (zeminMotor) zeminMotor.addEventListener("input", function () {
    zeminListeSay();
    duvarListeSay();
  });
  var duvarListeTmr = null;
  function duvarListeKapat() {
    var satir = document.getElementById("modulDuvarSatir");
    var btn = document.getElementById("modulDuvar");
    if (duvarListeTmr) {
      clearTimeout(duvarListeTmr);
      duvarListeTmr = null;
    }
    if (satir) satir.classList.remove("acik");
    if (btn) {
      btn.classList.remove("acik");
      btn.setAttribute("aria-expanded", "false");
    }
  }
  function duvarListeSay() {
    var satir = document.getElementById("modulDuvarSatir");
    if (!satir || !satir.classList.contains("acik")) return;
    if (duvarListeTmr) clearTimeout(duvarListeTmr);
    duvarListeTmr = setTimeout(duvarListeKapat, 7000);
  }
  bagla("modulMobilya", "click", function () {
    var satir = document.getElementById("modulMobilyaSatir");
    if (motorSayfa !== "duvar" || !(durum.hazirlik_onay || soruAdim === "duvar_kilit" || soruAdim === "mobilya")) {
      yaz("Önce duvar kilitle usta.", true);
      return;
    }
    if (satir && satir.classList.contains("acik")) {
      mobilyaSatirKapat();
      yaz("Duvar.", false);
      ayarYaz();
      return;
    }
    zeminListeKapat();
    duvarListeKapat();
    mobilyaAc();
  });
  var mobilyaSatir = document.getElementById("modulMobilyaSatir");
  if (mobilyaSatir) mobilyaSatir.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest("button[data-mobilya-tip]") : null;
    var tip;
    if (!t || !mobilyaSatir.contains(t) || !M || !mobilyaCfg) return;
    tip = t.getAttribute("data-mobilya-tip");
    if (!tip || tip === MOBILYA_TIP) return;
    MOBILYA_TIP = tip;
    mobilyaTurCiz(mobilyaCfg);
    ayarYaz();
    ciz();
  });
  bagla("modulDuvar", "click", function () {
    var satir = document.getElementById("modulDuvarSatir");
    var btn = document.getElementById("modulDuvar");
    var ac;
    if (!satir || !btn || motorSayfa !== "duvar") return;
    ac = !satir.classList.contains("acik");
    satir.classList.toggle("acik", ac);
    btn.classList.toggle("acik", ac);
    btn.setAttribute("aria-expanded", ac ? "true" : "false");
    if (ac) {
      zeminListeKapat();
      mobilyaSatirKapat();
      modulDuvarCiz();
      duvarListeSay();
    } else if (duvarListeTmr) {
      clearTimeout(duvarListeTmr);
      duvarListeTmr = null;
    }
  });
  var duvarSatir = document.getElementById("modulDuvarSatir");
  if (duvarSatir) duvarSatir.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest("button[data-kenar]") : null;
    var kenar;
    if (!t || !duvarSatir.contains(t)) return;
    kenar = t.getAttribute("data-kenar") || "";
    if (!kenar) return;
    if (duvarSecKenar === kenar && duvarModul === "olcu") {
      duvarSecKenar = "";
      duvarModul = "";
      duvarPanel = "";
    } else {
      duvarSecKenar = kenar;
      duvarModul = "olcu";
      duvarPanel = "";
      camSeciliTip = "";
    }
    ayarYaz();
    ciz();
    islemKaydet();
    if (duvarModul === "olcu") {
      if (duvarListeTmr) {
        clearTimeout(duvarListeTmr);
        duvarListeTmr = null;
      }
    } else duvarListeSay();
  });
  (function () {
    bagla("camDuvar", "click", function () {
      if (motorSayfa !== "duvar") return;
      if (camSeciliTip === "duvar") {
        camSeciliTip = "";
        duvarModul = "";
        duvarPanel = "";
        engelIs = "";
        ayarYaz();
        return;
      }
      camSeciliTip = "duvar";
      duvarModul = "engel";
      duvarPanel = "engelIs";
      engelIs = "";
      yaz("Engel ekle veya kaldır.", true);
      ayarYaz();
    });
    var motorTik = document.getElementById("levhaCamMotor");
    if (motorTik) motorTik.addEventListener("click", function (ev) {
      var btn = ev.target.closest ? ev.target.closest("button") : null;
      if (!btn || !motorTik.contains(btn)) return;
      var geri = btn.getAttribute("data-geri");
      var kenar, tip;
      if (geri) {
        if (geri === "engelIs") {
          duvarPanel = "engelIs";
          duvarModul = "engel";
          duvarSecKenar = "";
          camSeciliTip = "duvar";
          yaz("Engel ekle veya kaldır.", true);
          duvarKodListeDoldur(motorTik);
          return;
        }
        if (geri === "form" || geri === "engelKenar") {
          duvarPanel = "engelKenar";
          duvarModul = "engel";
          duvarSecKenar = "";
          camSeciliTip = "duvar";
          yaz("Hangi duvar?", true);
          duvarKodListeDoldur(motorTik);
          return;
        }
        duvarPanel = geri;
        duvarModul = "engel";
        camSeciliTip = "duvar";
        duvarKodListeDoldur(motorTik);
        return;
      }
      if (btn.getAttribute("data-engel-is")) {
        if (btn.disabled) return;
        engelIs = btn.getAttribute("data-engel-is") || "ekle";
        if (engelIs === "kaldir" && !duvarEngelVar()) return;
        duvarPanel = "engelKenar";
        duvarModul = "engel";
        duvarSecKenar = "";
        camSeciliTip = "duvar";
        yaz("Hangi duvar?", true);
        duvarKodListeDoldur(motorTik);
        return;
      }
      if (btn.getAttribute("data-engel-kenar")) {
        duvarSecKenar = btn.getAttribute("data-engel-kenar") || "";
        duvarModul = "engel";
        duvarPanel = engelIs === "kaldir" ? "engelSil" : "engel";
        camSeciliTip = "duvar";
        ayarYaz();
        ciz();
        islemKaydet();
        return;
      }
      if (btn.getAttribute("data-engel-sil")) {
        duvarEngelSil(parseInt(btn.getAttribute("data-engel-sil"), 10));
        return;
      }
      if (btn.getAttribute("data-eleman-ix")) {
        var eIx = parseInt(btn.getAttribute("data-eleman-ix"), 10);
        var eSec = (durum.elemanlar || [])[eIx];
        if (eSec && eSec.tip === "kapi") {
          duvarSecKenar = MOTOR_KENAR[eSec.duvar_no] || duvarSecKenar;
          kapiFormAc();
          return;
        }
        if (eSec) cepheAc(eSec.duvar_no, eIx);
        return;
      }
      if (btn.getAttribute("data-engel")) {
        duvarEngelTip(btn.getAttribute("data-engel"));
        return;
      }
      if (btn.getAttribute("data-kapi-alan")) {
        if (kapiTaslak) {
          var alan = btn.getAttribute("data-kapi-alan");
          var deger = btn.getAttribute("data-kapi-deger");
          kapiTaslak[alan] = alan === "camli" ? deger === "1" : deger;
        }
        duvarKodListeDoldur(motorTik);
        return;
      }
      if (btn.getAttribute("data-kapi-kaydet") === "1") {
        kapiFormKaydet();
        return;
      }
      if (btn.getAttribute("data-yon")) {
        duvarEngelYon(btn.getAttribute("data-yon"));
        return;
      }
      if (btn.getAttribute("data-kose")) {
        duvarEngelKose(btn.getAttribute("data-kose"));
        return;
      }
      if (btn.getAttribute("data-engel-tamam") === "1") {
        duvarEngelOlcuYaz();
        return;
      }
      if (btn.classList.contains("duvarEngel")) {
        duvarTur.tip = "";
        duvarPanel = "engel";
        duvarKodListeDoldur(motorTik);
        return;
      }
      if (!btn.getAttribute("data-kenar")) return;
      if (duvarModul === "olcu") {
        duvarSecKenar = "";
        duvarModul = "";
        duvarPanel = "";
        ayarYaz();
        ciz();
        return;
      }
      kenar = btn.getAttribute("data-kenar") || "";
      tip = duvarSecKenar === kenar ? "" : kenar;
      duvarSecKenar = tip;
      duvarPanel = "";
      duvarKodListeDoldur(motorTik);
      ciz();
      islemKaydet();
    });
  })();
  bagla("ileriBtn", "click", sayfaIleri);
  bagla("ileriMerhaba", "click", sayfaIleri);
  bagla("ileriMusteri", "click", sayfaIleri);
  bagla("ileriIs", "click", sayfaIleri);
  bagla("islemOnce", "click", islemOnce);
  bagla("islemIleri", "click", islemIleriYap);
  bagla("geriMerhaba", "click", oncekiSayfa);
  bagla("geriMusteri", "click", oncekiSayfa);
  bagla("geriIs", "click", oncekiSayfa);
  var onayIs = "";
  var yedekBekleyen = null;
  function onayKapat() {
    var kutu = document.getElementById("geriOnay");
    var soru = document.getElementById("geriSoru");
    if (kutu) kutu.classList.remove("acik");
    if (soru) soru.textContent = "Web sayfasına geçmek istiyor musunuz?";
    onayIs = "";
    yedekBekleyen = null;
  }
  bagla("geriHayir", "click", onayKapat);
  bagla("geriEvet", "click", function () {
    if (onayIs === "musteriSil") {
      var ids = {};
      var kutular = document.querySelectorAll("#musteriListe input.musteriIsaret:checked");
      var i, id, kalan, m, paket;
      for (i = 0; i < kutular.length; i++) {
        id = kutular[i].getAttribute("data-id") || "";
        if (id) ids[id] = true;
      }
      paket = ustaKasasi();
      kalan = [];
      for (i = 0; i < paket.u.musteriler.length; i++) {
        m = paket.u.musteriler[i];
        if (!ids[m.id]) kalan.push(m);
      }
      paket.u.musteriler = kalan;
      kasaYaz(paket.kasa);
      if (kasaAktifId && ids[kasaAktifId]) musteriBos();
      musteriListeYaz();
      onayKapat();
      yaz("İşaretli müşteriler silindi.", false);
      return;
    }
    if (onayIs === "yedek" && yedekBekleyen && window.MagiDepo) {
      var paketYedek = yedekBekleyen;
      window.MagiDepo.yedekKoy(paketYedek).then(function () {
        window.location.reload();
      }).catch(function () {
        onayKapat();
        yaz("Yedek yazılamadı usta.", true);
      });
      return;
    }
    window.location.href = "/";
  });
  function menuKapat() {
    var p = document.getElementById("menuPanel");
    if (p) p.classList.remove("acik");
  }
  bagla("ustAyarlar", "click", function () {
    window.location.href = "./ayarlar.html";
  });
  function menuDuzeltGoster() {
    var isVar = !!isAnahtar();
    var z = document.getElementById("menuZeminDuzelt");
    var d = document.getElementById("menuDuvarDuzelt");
    if (z) z.hidden = !(isVar && zeminDurum && zeminDurum.kilit);
    if (d) d.hidden = !(isVar && (durum.hazirlik_onay || soruAdim === "duvar_kilit" || soruAdim === "mobilya"));
  }

  function zeminDuzeltAc() {
    menuKapat();
    if (!isAnahtar()) { yaz("Önce iş aç usta.", true); return; }
    if (!zeminDurum || !zeminDurum.kilit) { yaz("Zemin kilitli değil usta.", true); return; }
    zeminDurum.kilit = false;
    if (durum.zemin) durum.zemin.kilit = false;
    durum.hazirlik_onay = false;
    yerlesimKilit = false;
    duvarSoruAdim = "";
    adimGoster("adimSahne", false);
    cepheGizle();
    motorSayfa = "zemin";
    camSeciliTip = "";
    duvarSecKenar = "";
    duvarPanel = "";
    zeminUygulaAc();
    seritKilitGoster();
    turKaydet();
    menuDuzeltGoster();
  }

  function duvarDuzeltAc() {
    menuKapat();
    if (!isAnahtar()) { yaz("Önce iş aç usta.", true); return; }
    if (!zeminDurum || !zeminDurum.kilit) { yaz("Önce zemin mühürle usta.", true); return; }
    if (!durum.hazirlik_onay && soruAdim !== "duvar_kilit" && soruAdim !== "mobilya") { yaz("Duvar kilitli değil usta.", true); return; }
    durum.hazirlik_onay = false;
    duvarSoruAdim = "mutfak_sekil";
    soruAdim = "mutfak_sekil";
    adimGoster("adimSahne", false);
    duvarSayfasiAc();
    turKaydet();
    menuDuzeltGoster();
  }

  bagla("menuBtn", "click", function () {
    var p = document.getElementById("menuPanel");
    if (!p) return;
    if (p.classList.contains("acik")) {
      menuKapat();
      return;
    }
    menuDuzeltGoster();
    p.classList.add("acik");
  });
  bagla("menuZeminDuzelt", "click", zeminDuzeltAc);
  bagla("menuDuvarDuzelt", "click", duvarDuzeltAc);
  bagla("menuYedekAl", "click", function () {
    menuKapat();
    if (!window.MagiDepo || !window.MagiDepo.yedekAl) {
      yaz("Yedek alınamadı usta.", true);
      return;
    }
    window.MagiDepo.yedekAl().then(function (paket) {
      var gun = String((paket && paket.tarih) || "").slice(0, 10) || "tarih";
      var blob = new Blob([JSON.stringify(paket)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "magi_recete_yedek_" + gun + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      yaz("Yedek alındı usta.", false);
    }).catch(function () {
      yaz("Yedek alınamadı usta.", true);
    });
  });
  bagla("menuYedekYukle", "click", function () {
    menuKapat();
    var f = document.getElementById("yedekDosya");
    if (f) f.click();
  });
  bagla("yedekDosya", "change", function () {
    var f = document.getElementById("yedekDosya");
    var dosya = f && f.files && f.files[0];
    if (!dosya) return;
    var okuyucu = new FileReader();
    okuyucu.onload = function () {
      if (f) f.value = "";
      var paket;
      try {
        paket = JSON.parse(String(okuyucu.result || ""));
      } catch (e) {
        yaz("Yedek okunamadı usta.", true);
        return;
      }
      if (!paket || paket.tur !== "magi_recete_yedek" || !paket.idb) {
        yaz("Yedek okunamadı usta.", true);
        return;
      }
      yedekBekleyen = paket;
      onayIs = "yedek";
      var soru = document.getElementById("geriSoru");
      if (soru) soru.textContent = "Yedekteki kayıtlar bu tarayıcıdakinin üzerine yazılır usta.";
      var kutu = document.getElementById("geriOnay");
      if (kutu) kutu.classList.add("acik");
    };
    okuyucu.onerror = function () {
      if (f) f.value = "";
      yaz("Yedek okunamadı usta.", true);
    };
    okuyucu.readAsText(dosya);
  });

  var isSecili = "";
  var odaSaplon = "";
  var soruAdim = "en";
  var motorSayfa = "zemin";
  var duvarSoruAdim = "";
  var isOzelYazi = "";
  var kapiKenar = null;
  var zeminAnket = { oda: "", yukselti: null, sifon: null };
  var mutfakSekil = "";
  var orulenNos = null;
  var duvarOlcu = {};
  var duvarYuk = 0;
  var duvarSecKenar = "";
  var duvarPanel = "";
  var duvarModul = "";
  var engelIs = "";
  var kapiTaslak = null;
  var ENGEL_LIST = [
    ["kapi", "Kapı"], ["pencere", "Pencere"], ["priz", "Priz"], ["su", "Su"],
    ["gaz", "Gaz"], ["radiator", "Radyatör"], ["hava", "Hava"], ["pimas", "Pimaş"],
    ["sayac", "Sayaç"], ["nis", "Niş"], ["kiris", "Kiriş"], ["kolon", "Kolon"]
  ];
  var duvarTur = { no: 1, tip: "", yon: "sol", kose: "1-2", en: 0, boy: 0, cikinti: 0 };
  var gonyeKenarlar = ["on", "sag", "arka", "sol"];
  var gonyeIx = 0;
  var gonyeOlcu = { duvar: [0, 0, 0, 0], capraz1: 0, capraz2: 0 };
  var gonyePts = null;
  var GONYE_AD = { on: "Güney", sag: "Doğu", arka: "Kuzey", sol: "Batı" };
  var KENAR_MOTOR = { on: 1, sag: 2, arka: 3, sol: 4 };
  var MOTOR_KENAR = { 1: "on", 2: "sag", 3: "arka", 4: "sol" };
  var SAAT_SIRA = {
    on: ["on", "sol", "arka", "sag"],
    sag: ["sag", "on", "sol", "arka"],
    arka: ["arka", "sag", "on", "sol"],
    sol: ["sol", "arka", "sag", "on"]
  };

  function kapiKenarAl() {
    return kapiKenar || "on";
  }

  function duvarSaatSira() {
    return SAAT_SIRA[kapiKenarAl()] || SAAT_SIRA.on;
  }

  function kenarToD(kenar) {
    var i = duvarSaatSira().indexOf(kenar);
    return i >= 0 ? i + 1 : 1;
  }

  function motorToD(no) {
    return kenarToD(MOTOR_KENAR[no] || "on");
  }

  function duvarDYazi(kenar) {
    return "D" + kenarToD(kenar) + " " + (GONYE_AD[kenar] || "");
  }

  function duvarOrulu(no) {
    if (!orulenNos) return false;
    return orulenNos.indexOf(no) >= 0;
  }

  function duvarOruluKenar(kenar) {
    return duvarOrulu(KENAR_MOTOR[kenar]);
  }

  function mutfakOneriYaz(sekil) {
    var sira = duvarSaatSira();
    mutfakSekil = sekil;
    if (sekil === "duz") orulenNos = [KENAR_MOTOR[sira[2]]];
    else if (sekil === "L") orulenNos = [KENAR_MOTOR[sira[1]], KENAR_MOTOR[sira[2]]];
    else if (sekil === "U") orulenNos = [KENAR_MOTOR[sira[1]], KENAR_MOTOR[sira[2]], KENAR_MOTOR[sira[3]]];
    else if (sekil === "kup") orulenNos = [KENAR_MOTOR[sira[0]], KENAR_MOTOR[sira[1]], KENAR_MOTOR[sira[2]], KENAR_MOTOR[sira[3]]];
  }

  function mutfakDuvarDugmeYaz() {
    var satir = document.querySelector("[data-anket=\"mutfak_duvar\"]");
    if (!satir) return;
    var sira = duvarSaatSira();
    var dug = satir.querySelectorAll("button[data-no]");
    var i, no;
    for (i = 0; i < 4 && i < dug.length; i++) {
      no = KENAR_MOTOR[sira[i]];
      dug[i].setAttribute("data-no", String(no));
      dug[i].textContent = duvarDYazi(sira[i]);
      dug[i].classList.toggle("secili", duvarOrulu(no));
    }
  }

  function duvarNoDugmeYaz() {
    var satir = document.querySelector("[data-anket=\"duvar_no\"]");
    if (!satir) return;
    var sira = duvarSaatSira();
    var dug = satir.querySelectorAll("button");
    var i, no;
    for (i = 0; i < 4 && i < dug.length; i++) {
      no = KENAR_MOTOR[sira[i]];
      dug[i].setAttribute("data-no", String(no));
      dug[i].textContent = duvarDYazi(sira[i]);
      dug[i].style.display = duvarOrulu(no) ? "" : "none";
    }
  }

  function pimasKoseDugmeYaz() {
    var satir = document.querySelector("[data-anket=\"pimas_kose\"]");
    if (!satir) return;
    var dug = satir.querySelectorAll("button[data-kose]");
    var i, par, a, b;
    for (i = 0; i < dug.length; i++) {
      par = String(dug[i].getAttribute("data-kose") || "").split("-");
      a = parseInt(par[0], 10);
      b = parseInt(par[1], 10);
      dug[i].textContent = "D" + motorToD(a) + "–D" + motorToD(b);
      dug[i].style.display = duvarOrulu(a) && duvarOrulu(b) ? "" : "none";
    }
  }
  function adimGoster(id, yeniTur) {
    var hepsi = ["adimMerhaba", "adimMusteri", "adimIs", "adimSahne"];
    var i, n;
    for (i = 0; i < hepsi.length; i++) {
      n = document.getElementById(hepsi[i]);
      if (n) n.classList.toggle("acik", hepsi[i] === id);
    }
    if (id !== "adimSahne") return;
    if (yeniTur === false) {
      requestAnimationFrame(function () { ciz(); adimYay(); });
      return;
    }
    turSil();
      motorSayfa = "zemin";
      yaz("Oda en kaç?", false);
      var sk = document.getElementById("saplonKutu");
      var satir = document.getElementById("soruSatir");
      var ak = document.getElementById("anketKutu");
      if (sk) sk.classList.remove("acik");
      if (ak) ak.classList.remove("acik");
      var ks = document.getElementById("kapiSurukle");
      var ek = document.getElementById("ekSurukle");
      var ys = document.getElementById("yukseltiSurukle");
      var sf = document.getElementById("sifonSurukle");
      if (ks) ks.classList.remove("acik");
      if (ek) ek.classList.remove("acik");
      if (ys) ys.classList.remove("acik");
      if (sf) sf.classList.remove("acik");
      if (satir) satir.classList.add("acik");
      levhaCamSifirla();
      durum.zemin = null;
      durum.oda = null;
      yorunge.yaw = 0.72;
      yorunge.pitch = 0.48;
      yorunge.uzak = 0;
      solParcaYaz();
      soruAdim = "en";
      yerlesimKilit = false;
      odaSaplon = "kup";
      kapiKenar = null;
      zeminAnket = { oda: "", yukselti: null, sifon: null };
      mutfakSekil = "";
      orulenNos = null;
      duvarOlcu = {};
      duvarYuk = 0;
      duvarSecKenar = "";
      duvarPanel = "";
      duvarTur = { no: 1, tip: "", yon: "sol", kose: "1-2", en: 0, boy: 0 };
      durum.elemanlar = [];
      durum.duvarlar = [];
      durum.hazirlik_onay = false;
      gonyeIx = 0;
      gonyeOlcu = { duvar: [0, 0, 0, 0], capraz1: 0, capraz2: 0 };
      gonyePts = null;
      ekListe = [];
      lIc1 = 0;
      lIc2 = 0;
      yerlesim = yerlesim.filter(function (g) { return g.tip !== "kapi" && g.tip !== "esik"; });
      if (Z) zeminDurum = Z.bos();
      zeminKaydet();
      var evk = document.getElementById("ekVarKutu");
      if (evk) evk.classList.remove("acik");
      var inp = document.getElementById("soruMm");
      if (inp) { inp.value = ""; inp.focus(); }
      islemDepoSifirla();
      islemKaydet();
      requestAnimationFrame(function () { ciz(); });
  }
  (function () {
    if (!window.MagiDepo) return;
    var kapi = ["musteriAcBtn", "ileriMerhaba"];
    var i, n;
    for (i = 0; i < kapi.length; i++) {
      n = document.getElementById(kapi[i]);
      if (n) n.disabled = true;
    }
    window.MagiDepo.hazirla().then(function () {
      for (i = 0; i < kapi.length; i++) {
        n = document.getElementById(kapi[i]);
        if (n) n.disabled = false;
      }
    });
  })();
  bagla("musteriAcBtn", "click", function () {
    musteriListeYaz();
    adimGoster("adimMusteri");
  });
  bagla("musteriDevam", "click", function () {
    if (!musteriKaydetYap()) return;
    adimGoster("adimIs");
  });
  (function () {
    var n = document.querySelectorAll(".isSec");
    var i;
    for (i = 0; i < n.length; i++) {
      n[i].addEventListener("click", function () {
        var j;
        for (j = 0; j < n.length; j++) n[j].classList.remove("secili");
        this.classList.add("secili");
        isSecili = this.getAttribute("data-is") || "";
        var kutu = document.getElementById("ozelKutu");
        if (kutu) kutu.classList.toggle("acik", isSecili === "Ozel");
      });
    }
  })();
  bagla("isDevam", "click", function () {
    var ozel = String((document.getElementById("isOzel") || {}).value || "").trim();
    if (!isSecili) {
      yaz("İş seç.", true);
      return;
    }
    if (isSecili === "Ozel" && !ozel) {
      yaz("Özel işi yaz.", true);
      return;
    }
    isOzelYazi = isSecili === "Ozel" ? ozel : "";
    try {
      localStorage.setItem("magi_is_turu", JSON.stringify({
        tip: isSecili,
        ozel: isOzelYazi,
        musteri: kasaAktifId
      }));
    } catch (e) { /* kasa sonra */ }
    var ana = isAnahtar();
    var hepsi = isKayitOku();
    if (ana && hepsi[ana]) {
      turYukle(hepsi[ana]);
      return;
    }
    adimGoster("adimSahne");
  });
  (function () {
    var n = document.querySelectorAll(".saplon");
    var i;
    for (i = 0; i < n.length; i++) {
      n[i].addEventListener("click", function () {
        var j;
        for (j = 0; j < n.length; j++) n[j].classList.remove("secili");
        this.classList.add("secili");
        odaSaplon = "kup";
        ekListe = [];
        lIc1 = 0;
        lIc2 = 0;
        if (Z) zeminDurum = Z.bos();
        zeminKaydet();
        try { localStorage.setItem("magi_oda_saplon", odaSaplon); } catch (e) { /* kasa */ }
        var sk = document.getElementById("saplonKutu");
        var ss = document.getElementById("soruSatir");
        if (sk) sk.classList.remove("acik");
        if (ss) ss.classList.add("acik");
        motorSayfa = "zemin";
        soruAdim = "en";
        yaz("Oda en kaç?", false);
        var inp = document.getElementById("soruMm");
        if (inp) {
          inp.value = "";
          inp.focus();
        }
        ciz();
      });
    }
  })();
  function panellerKapa() {
    var sk = document.getElementById("saplonKutu");
    var satir = document.getElementById("soruSatir");
    var evk = document.getElementById("ekVarKutu");
    var ak = document.getElementById("anketKutu");
    var ks = document.getElementById("kapiSurukle");
    var ek = document.getElementById("ekSurukle");
    var ys = document.getElementById("yukseltiSurukle");
    var sf = document.getElementById("sifonSurukle");
    var uy = document.getElementById("odaUygula");
    if (sk) sk.classList.remove("acik");
    if (satir) satir.classList.remove("acik");
    if (evk) evk.classList.remove("acik");
    if (ak) ak.classList.remove("acik");
    mobilyaSatirKapat();
    if (ks) { ks.classList.remove("acik"); ks.classList.remove("cekiliyor"); }
    if (ek) { ek.classList.remove("acik"); ek.classList.remove("cekiliyor"); }
    if (ys) { ys.classList.remove("acik"); ys.classList.remove("cekiliyor"); }
    if (sf) { sf.classList.remove("acik"); sf.classList.remove("cekiliyor"); }
    if (uy) uy.style.display = "none";
  }

  function turYukle(k) {
    if (!k) return false;
    islemYuklemede = true;
    islemDurumYaz(k);
    if (k.camSeciliTip != null) camSeciliTip = k.camSeciliTip === "duvar" ? "" : k.camSeciliTip;
    if (k.duvarSoruAdim != null) duvarSoruAdim = k.duvarSoruAdim;
    if (k.motorSayfa === "duvar" || k.motorSayfa === "zemin") motorSayfa = k.motorSayfa;
    else if (k.zemin && k.zemin.kilit && (durum.hazirlik_onay || k.soruAdim === "mobilya" || String(k.soruAdim || "").indexOf("duvar") === 0 || String(k.soruAdim || "").indexOf("mutfak") === 0)) motorSayfa = "duvar";
    else motorSayfa = "zemin";
    duvarSecKenar = "";
    duvarPanel = "";
    cepheGizle();
    adimGoster("adimSahne", false);
    seritKilitGoster();
    islemSahneYenile();
    islemYuklemede = false;
    islemDepoSifirla();
    islemKaydet();
    return true;
  }

  function duvarAl(son) {
    if (!son || !son.hazir) {
      yaz((son && son.hatalar && son.hatalar[0]) || "Duvar yazılamadı.", true);
      return false;
    }
    durum.hazir = son.hazir;
    durum.duvarlar = son.duvarlar || [];
    durum.elemanlar = son.elemanlar || [];
    durum.yasak_kutular = son.yasak_kutular || [];
    durum.pahlar = son.pahlar || [];
    durum.moduller = son.moduller || [];
    durum.aktif_duvar = son.aktif_duvar || 1;
    durum.olcu_yon = son.olcu_yon || "sol";
    durum.hazirlik_onay = !!son.hazirlik_onay;
    durum.zemin_kilit = !!son.zemin_kilit;
    if (son.oda) {
      durum.oda = {
        en: son.oda.en,
        boy: son.oda.boy,
        yuk: son.oda.yukseklik,
        yukseklik: son.oda.yukseklik
      };
    }
    turKaydet();
    return true;
  }

  function duvarKayit(sol) {
    var tip = duvarTur.tip;
    var kayit = { tip: tip, duvar_no: duvarTur.no, sol: sol, olcu_yon: duvarTur.yon };
    if (duvarTur.en > 0) kayit.en = duvarTur.en;
    if (duvarTur.boy > 0) kayit.boy = duvarTur.boy;
    if (tip === "pimas") {
      kayit.kose = duvarTur.kose;
      kayit.en = 150;
      kayit.cikinti_mm = 150;
    }
    if (tip === "kolon" || tip === "kiris") kayit.cikinti_mm = duvarTur.cikinti > 0 ? duvarTur.cikinti : 300;
    return kayit;
  }

  function duvarElemanYaz(sol, sessiz) {
    if (!D) {
      yaz("Duvar motoru yok.", true);
      return false;
    }
    var son = D.odaElemanEkle(durum, duvarKayit(sol));
    if (!duvarAl(son)) return false;
    yaz("Yerleşti usta.", false);
    ciz();
    if (sessiz) return true;
    if (duvarPanel) return true;
    anketAc("duvar_baska");
    return true;
  }

  function cepheGizle() {
    cepheMod = null;
    cepheTut = null;
    var btn = document.getElementById("cepheKilitle");
    if (btn) btn.classList.remove("acik");
  }

  function cepheAc(no, ixHazir) {
    var liste = durum.elemanlar || [];
    var ix = -1;
    var i, e;
    if (typeof ixHazir === "number" && ixHazir >= 0 && liste[ixHazir]) ix = ixHazir;
    else {
      for (i = liste.length - 1; i >= 0; i--) {
        e = liste[i];
        if (!e) continue;
        if (e.duvar_no === no || (e.duvarlar && e.duvarlar.indexOf(no) >= 0)) {
          ix = i;
          break;
        }
      }
    }
    if (ix < 0) return;
    camSeciliTip = "";
    duvarModul = "";
    duvarPanel = "";
    cepheMod = { no: no, ix: ix };
    cepheTut = null;
    panellerKapa();
    ayarYaz();
    yaz("Sürükle bırak usta.", false);
    ciz();
  }

  function cepheKapat() {
    if (!cepheMod) return;
    cepheGizle();
    turKaydet();
    yaz("Yer kilit. Odaya döndün usta.", false);
    ayarYaz();
  }

  function cepheYer(ix, sol, alt) {
    var e = (durum.elemanlar || [])[ix];
    var no = cepheMod ? cepheMod.no : 0;
    var duvar = null;
    var liste = durum.duvarlar || [];
    var i, pay, eskiSol, eskiAlt, dSol, dAlt, y, yakin;
    for (i = 0; i < liste.length; i++) if (liste[i].no === no) duvar = liste[i];
    if (!e || !duvar || !(e.en > 0) || !(e.boy > 0)) return;
    if (e.duvar_no === no && e.tip !== "pimas") {
      sol = Math.round(Math.max(0, Math.min(duvar.en - e.en, sol)));
    } else {
      sol = e.sol;
    }
    alt = Math.round(Math.max(0, Math.min(duvar.boy - e.boy, alt)));
    if (sol === e.sol && alt === e.alt) return;
    eskiSol = e.sol;
    eskiAlt = e.alt;
    dSol = sol - eskiSol;
    dAlt = alt - eskiAlt;
    e.sol = sol;
    e.alt = alt;
    pay = e.yasak_pay_mm || 0;
    for (i = 0; i < (durum.yasak_kutular || []).length; i++) {
      y = durum.yasak_kutular[i];
      if (!y) continue;
      if (y.duvar_no !== e.duvar_no && !(e.duvarlar && e.duvarlar.indexOf(y.duvar_no) >= 0)) continue;
      if (Math.abs(y.boy - (e.boy + 2 * pay)) > 4 && Math.abs(y.boy - e.boy) > 4) continue;
      if (Math.abs(y.en - (e.en + 2 * pay)) > 4 && Math.abs(y.en - e.en) > 4) continue;
      yakin = Math.abs((y.alt + pay) - eskiAlt) <= 8 || Math.abs(y.alt - eskiAlt) <= 8;
      if (!yakin) continue;
      y.alt += dAlt;
      if (dSol && y.duvar_no === e.duvar_no) {
        if (Math.abs((y.sol + pay) - eskiSol) <= 8 || Math.abs(y.sol - eskiSol) <= 8) y.sol += dSol;
      }
    }
  }

  function duvarElemanKaydir(ix, x, z) {
    var e = (durum.elemanlar || [])[ix];
    var duvar = null;
    var i, sol, eski, y, pay, delta;
    var liste = durum.duvarlar || [];
    var o = durum.oda;
    if (!e || !o || e.tip === "pimas") return;
    for (i = 0; i < liste.length; i++) {
      if (liste[i].no === e.duvar_no) duvar = liste[i];
    }
    if (!duvar) return;
    if (e.duvar_no === 1) sol = x - e.en / 2;
    else if (e.duvar_no === 2) sol = z - e.en / 2;
    else if (e.duvar_no === 3) sol = o.en - x - e.en / 2;
    else sol = o.boy - z - e.en / 2;
    sol = Math.round(Math.max(0, Math.min(duvar.en - e.en, sol)));
    if (sol === e.sol) return;
    eski = e.sol;
    delta = sol - eski;
    e.sol = sol;
    pay = e.yasak_pay_mm || 0;
    for (i = 0; i < (durum.yasak_kutular || []).length; i++) {
      y = durum.yasak_kutular[i];
      if (y.duvar_no !== e.duvar_no) continue;
      if (Math.abs(y.en - (e.en + 2 * pay)) > 4) continue;
      if (Math.abs((y.sol + pay) - eski) > 8 && Math.abs(y.sol - eski) > 8) continue;
      y.sol += delta;
      break;
    }
  }

  function duvarKilit() {
    if (!D) {
      yaz("Duvar motoru yok.", true);
      return;
    }
    if (!duvarAl(D.odaHazirlikOnayla(durum))) return;
    panellerKapa();
    soruAdim = "duvar_kilit";
    islemKaydet();
    turKaydet();
    muhurKaydet("duvar");
    yaz("Duvar kilit. Kayıt duruyor usta.", false);
    ayarYaz();
    ciz();
  }

  function anketKaydet() {
    try { localStorage.setItem("magi_zemin_anket", JSON.stringify(zeminAnket)); } catch (e) { /* kasa */ }
  }
  function anketAc(adim) {
    panellerKapa();
    seciliIx = -1;
    ayarYaz();
    var ak = document.getElementById("anketKutu");
    if (ak) ak.classList.add("acik");
    var satir = document.querySelectorAll(".anketSatir");
    var i;
    for (i = 0; i < satir.length; i++) {
      satir[i].classList.toggle("acik", satir[i].getAttribute("data-anket") === adim);
    }
    soruAdim = adim;
    if (adim === "duvar_no") duvarNoDugmeYaz();
    if (adim === "mutfak_duvar") mutfakDuvarDugmeYaz();
    if (adim === "pimas_kose") pimasKoseDugmeYaz();
    if (adim === "oda_tip") yaz("Zemin nasıl?", false);
    else if (adim === "yukselti") yaz("Mobilya altı yükselti var mı?", false);
    else if (adim === "yukselti_sekil") yaz("Yükselti hangi şekil?", false);
    else if (adim === "sifon") yaz("Yer sifonu eklemek ister misin?", false);
    else if (adim === "mutfak_sekil") yaz("Mutfak ne tür olacak?", false);
    else if (adim === "mutfak_duvar") yaz("Hangi duvar örülsün? D ekle veya çıkar, kapı duvarı da olur.", false);
    else if (adim === "duvar_no") yaz("Hangi duvar usta? D1 kapı duvarı.", false);
    else if (adim === "duvar_gerec") yaz((duvarDYazi(MOTOR_KENAR[duvarTur.no] || "on")) + " — bu duvarda ne var usta?", false);
    else if (adim === "duvar_yon") yaz("Soldan mı sağdan mı usta?", false);
    else if (adim === "pimas_kose") yaz("Pimaş hangi köşe usta?", false);
    else if (adim === "duvar_baska") yaz("Bu duvarda başka var mı?", false);
    else if (adim === "duvar_baska_duvar") yaz("Başka duvar var mı?", false);
    ciz();
    islemKaydet();
  }
  function kapiSurukleGoster() {
    panellerKapa();
    var ks = document.getElementById("kapiSurukle");
    if (ks) ks.classList.add("acik");
    soruAdim = "kapi_surukle";
    yaz("Kapı eşiğini yerine sürükle bırak usta", false);
    ciz();
    islemKaydet();
  }
  function kapiBirakildi(g) {
    var ad = ["on", "sag", "arka", "sol"];
    kapiKenar = ad[g.kenar] || "on";
    anketKaydet();
    anketAc("oda_tip");
  }
  function anketBitir() {
    anketKaydet();
    var tip = zeminAnket.oda;
    if (tip === "gonyesiz") { gonyeTurAc(); return; }
    gonyePts = null;
    if (tip === "girinti") { ekParcaBasla("oyuk"); return; }
    if (tip === "cikinti") { ekParcaBasla("cikinti"); return; }
    if (tip === "ikisi") { ekParcaBasla("cikinti"); return; }
    ekBitir();
  }
  function gonyeSiraKur() {
    var tum = ["on", "sag", "arka", "sol"];
    var i = tum.indexOf(kapiKenar);
    if (i < 0) i = 0;
    gonyeKenarlar = tum.slice(i).concat(tum.slice(0, i));
  }
  function gonyeTurAc() {
    gonyeSiraKur();
    gonyeIx = 0;
    gonyeOlcu = { duvar: [0, 0, 0, 0], capraz1: 0, capraz2: 0 };
    gonyeYansit();
    gonyeDuvarSor();
  }
  function gonyeDuvarSor() {
    var k = gonyeKenarlar[gonyeIx];
    soruAc("gonye_duvar", GONYE_AD[k] + " duvar kaç? (" + (gonyeIx + 1) + "/4)");
  }
  function gonyeCaprazAc(n) {
    if (n === 1) soruAc("gonye_c1", "Sol ön köşeden sağ arka köşeye kaç?");
    else soruAc("gonye_c2", "Sağ ön köşeden sol arka köşeye kaç?");
  }
  function gonyeKaydet() {
    zeminAnket.gonye = {
      kapi: kapiKenar,
      sira: gonyeKenarlar.slice(),
      duvar: gonyeOlcu.duvar.slice(),
      capraz1: gonyeOlcu.capraz1,
      capraz2: gonyeOlcu.capraz2
    };
    anketKaydet();
    gonyeYansit();
  }
  function gonyeKutu() {
    if (!gonyePts) return null;
    var i, mx = 0, mz = 0;
    for (i = 0; i < 4; i++) {
      if (gonyePts[i][0] > mx) mx = gonyePts[i][0];
      if (gonyePts[i][1] > mz) mz = gonyePts[i][1];
    }
    return { en: Math.max(1, mx), boy: Math.max(1, mz) };
  }
  function gonyeKenarUcu(kenar, en, boy) {
    var p = gonyePts;
    if (p) {
      if (kenar === "on") return [p[0], p[1]];
      if (kenar === "sag") return [p[1], p[2]];
      if (kenar === "arka") return [p[3], p[2]];
      if (kenar === "sol") return [p[0], p[3]];
      return null;
    }
    if (kenar === "on") return [[0, 0], [en, 0]];
    if (kenar === "sag") return [[en, 0], [en, boy]];
    if (kenar === "arka") return [[0, boy], [en, boy]];
    if (kenar === "sol") return [[0, 0], [0, boy]];
    return null;
  }
  function gonyeCaprazUcu(n, en, boy) {
    var p = gonyePts;
    if (p) return n === 1 ? [p[0], p[2]] : [p[1], p[3]];
    return n === 1 ? [[0, 0], [en, boy]] : [[en, 0], [0, boy]];
  }
  function gonyeUzun(kenar) {
    var i = gonyeKenarlar.indexOf(kenar);
    var v = i >= 0 ? parseFloat(gonyeOlcu.duvar[i]) : 0;
    if (v > 0) return v;
    var o = (zeminDurum && zeminDurum.oda) || { en: 4000, boy: 3000 };
    return (kenar === "on" || kenar === "arka") ? (o.en || 4000) : (o.boy || 3000);
  }
  function daireIki(p0, r0, p1, r1) {
    var dx = p1[0] - p0[0], dz = p1[1] - p0[1];
    var d = Math.hypot(dx, dz);
    r0 = Math.max(1, r0);
    r1 = Math.max(1, r1);
    if (d < 0.001) return [[p0[0] + r0, p0[1]], [p0[0] - r0, p0[1]]];
    if (d > r0 + r1 || d < Math.abs(r0 - r1)) {
      var t = r0 / (r0 + r1);
      var m = [p0[0] + dx * t, p0[1] + dz * t];
      return [m, m];
    }
    var a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, r0 * r0 - a * a));
    var mx = p0[0] + a * dx / d;
    var mz = p0[1] + a * dz / d;
    var px = -dz / d * h, pz = dx / d * h;
    return [[mx + px, mz + pz], [mx - px, mz - pz]];
  }
  function gonyeAlan(so, sa, ra, la) {
    return so[0] * sa[1] + sa[0] * ra[1] + ra[0] * la[1] + la[0] * so[1]
      - (so[1] * sa[0] + sa[1] * ra[0] + ra[1] * la[0] + la[1] * so[0]);
  }
  function gonyeSec(so, sa, ra, aday) {
    var i, enIyi = aday[0], enA = -1e18, al;
    for (i = 0; i < aday.length; i++) {
      al = gonyeAlan(so, sa, ra, aday[i]);
      if (al > enA) { enA = al; enIyi = aday[i]; }
    }
    return enIyi;
  }
  function gonyeYansit() {
    if (zeminAnket.oda !== "gonyesiz") { gonyePts = null; return; }
    var lon = gonyeUzun("on");
    var lsag = gonyeUzun("sag");
    var larka = gonyeUzun("arka");
    var lsol = gonyeUzun("sol");
    var so = [0, 0];
    var sa = [lon, 0];
    var ra;
    var d1 = parseFloat(gonyeOlcu.capraz1) || 0;
    var d2 = parseFloat(gonyeOlcu.capraz2) || 0;
    if (d1 > 0) {
      var ira = daireIki(so, d1, sa, lsag);
      ra = ira[0][1] >= ira[1][1] ? ira[0] : ira[1];
    } else {
      ra = [lon, lsag];
    }
    var la;
    if (d2 > 0) {
      var ila = daireIki(sa, d2, so, lsol);
      var i, enIyi = ila[0], fark = 1e18, f;
      for (i = 0; i < ila.length; i++) {
        f = Math.abs(Math.hypot(ila[i][0] - ra[0], ila[i][1] - ra[1]) - larka);
        if (f < fark) { fark = f; enIyi = ila[i]; }
      }
      la = enIyi;
    } else {
      la = gonyeSec(so, sa, ra, daireIki(ra, larka, so, lsol));
    }
    var i, minx = so[0], minz = so[1];
    var ham = [so, sa, ra, la];
    for (i = 0; i < 4; i++) {
      if (ham[i][0] < minx) minx = ham[i][0];
      if (ham[i][1] < minz) minz = ham[i][1];
    }
    gonyePts = [];
    for (i = 0; i < 4; i++) gonyePts.push([ham[i][0] - minx, ham[i][1] - minz]);
    var kutu = gonyeKutu();
    if (kutu && zeminDurum && zeminDurum.oda) {
      zeminDurum.oda.en = Math.round(kutu.en);
      zeminDurum.oda.boy = Math.round(kutu.boy);
      zeminKaydet();
    }
  }
  function ekBitir() {
    onizlemeEk = null;
    panellerKapa();
    if (Z && zeminDurum && zeminDurum.tur === "ek_var") {
      zeminAl(Z.ek_var_yaz(zeminDurum, false));
    }
    zeminParcaTur();
  }
  function yerlesimTipSil(tip) {
    yerlesim = yerlesim.filter(function (g) { return g.tip !== tip; });
  }
  function zeminParcaVar(tip) {
    var i;
    for (i = 0; i < yerlesim.length; i++) {
      if (yerlesim[i].tip === tip) return true;
    }
    return false;
  }
  function sekilTuraGeri() {
    if (zeminAnket.oda === "gonyesiz") { gonyeCaprazAc(2); return; }
    anketAc("sifon");
  }
  function zeminUygulaAc() {
    panellerKapa();
    var uy = document.getElementById("odaUygula");
    if (uy) uy.style.display = "flex";
    soruAdim = "birak";
    yaz("Zemin bitti. Kilitle ve ilerle.", false);
    ciz();
    islemKaydet();
  }
  function zeminParcaTur() {
    if (zeminAnket.yukselti && !zeminParcaVar("yukselti")) {
      yukseltiSurukleGoster();
      return;
    }
    if (zeminAnket.sifon && !zeminParcaVar("sifon")) {
      sifonSurukleGoster();
      return;
    }
    zeminUygulaAc();
  }
  function yukseltiSurukleGoster() {
    panellerKapa();
    soruAdim = "yukselti_surukle";
    var sekilS = zeminAnket.yukseltiSekil;
    if (sekilS === "L") yaz("L yükseltiyi köşeye sürükle bırak usta", false);
    else if (sekilS === "U") yaz("U yükseltiyi orta duvara sürükle bırak usta", false);
    else yaz("Yükseltiyi yerine sürükle bırak usta", false);
    ciz();
    islemKaydet();
  }
  function sifonSurukleGoster() {
    panellerKapa();
    soruAdim = "sifon_surukle";
    yaz("Sifonu yerine sürükle bırak usta", false);
    ciz();
    islemKaydet();
  }
  function ekSonrakiVeyaBitir() {
    onizlemeEk = null;
    var liste = (zeminDurum && zeminDurum.ekler) || [];
    if (liste.length >= 3) { ekBitir(); return; }
    if (zeminAnket.oda === "ikisi") {
      var cik = false, gir = false, i;
      for (i = 0; i < liste.length; i++) {
        if (liste[i].tip === "cikinti") cik = true;
        if (liste[i].tip === "oyuk") gir = true;
      }
      if (cik && !gir) { ekParcaBasla("oyuk"); return; }
    }
    ekBitir();
  }
  function ekSurukleGoster() {
    panellerKapa();
    var t = (zeminDurum && zeminDurum.taslak) || {};
    var ad = document.getElementById("ekSurukleAd");
    var ol = document.getElementById("ekSurukleOlcu");
    if (ad) ad.textContent = t.tip === "oyuk" ? "Girinti" : "Çıkıntı";
    if (ol) ol.textContent = O.yazi(t.en || 0) + " × " + O.yazi(t.boy || 0);
    soruAdim = "ek_yerlestir";
    yaz((t.tip === "oyuk" ? "Girintiyi" : "Çıkıntıyı") + " kenara sürükle bırak usta", false);
    ciz();
  }
  function ekTaslakOnizle(mm) {
    if (!zeminDurum || !zeminDurum.taslak || !mm) return null;
    var t = zeminDurum.taslak;
    var o = taslakOlcu();
    var kenar, kay;
    var ds = { on: Math.abs(mm.z), sag: Math.abs(o.en - mm.x), arka: Math.abs(o.boy - mm.z), sol: Math.abs(mm.x) };
    kenar = "on";
    if (ds.sag < ds[kenar]) kenar = "sag";
    if (ds.arka < ds[kenar]) kenar = "arka";
    if (ds.sol < ds[kenar]) kenar = "sol";
    kay = (kenar === "on" || kenar === "arka") ? mm.x - (t.en || 0) / 2 : mm.z - (t.en || 0) / 2;
    if (kay < 0) kay = 0;
    return { tip: t.tip, en: t.en, boy: t.boy, kenar: kenar, kayma: kay };
  }
  function ekVarGoster() {
    panellerKapa();
    var evk = document.getElementById("ekVarKutu");
    if (evk) evk.classList.add("acik");
    soruAdim = "ek_var";
    yaz("Zemin içinde girinti veya çıkıntı var mı?", false);
    ciz();
  }

  function soruAc(adim, cumle) {
    panellerKapa();
    var ss = document.getElementById("soruSatir");
    if (ss) ss.classList.add("acik");
    soruAdim = adim;
    yaz(cumle, false);
    var inp = document.getElementById("soruMm");
    if (inp) {
      inp.value = "";
      inp.focus();
    }
    ciz();
    islemKaydet();
  }

  function soruIsle() {
    if (soruAdim === "duvar_sol") {
      var inpD = document.getElementById("soruMm");
      var hamD = inpD ? String(inpD.value || "").trim().replace(",", ".") : "";
      if (hamD === "") {
        yaz("Ölçü gir usta.", true);
        return;
      }
      var nD = parseFloat(hamD);
      if (!(nD >= 0)) {
        yaz("Ölçü gir usta.", true);
        return;
      }
      if (O.oku() === "cm") nD = nD * 10;
      duvarElemanYaz(Math.round(nD * 10) / 10);
      return;
    }
    if (!Z || !zeminDurum) {
      yaz("Zemin motoru yok.", true);
      return;
    }
    var inp = document.getElementById("soruMm");
    var ham = inp ? inp.value : "";
    var mm = O.mmAl(ham);
    if (!(parseFloat(mm) > 0)) {
      yaz("Ölçü gir usta.", true);
      return;
    }
    if (soruAdim === "en") {
      if (!zeminAl(Z.olcu_yaz(zeminDurum, mm))) return;
      soruAc("boy", "Oda boy kaç?");
      return;
    }
    if (soruAdim === "boy") {
      if (!zeminAl(Z.olcu_yaz(zeminDurum, mm))) return;
      kapiSurukleGoster();
      return;
    }
    if (soruAdim === "ek_en") {
      if (!zeminAl(Z.olcu_yaz(zeminDurum, mm))) return;
      soruAc("ek_boy", "Ek boy (derinlik) kaç?");
      return;
    }
    if (soruAdim === "ek_boy") {
      if (!zeminAl(Z.olcu_yaz(zeminDurum, mm))) return;
      ekSurukleGoster();
      return;
    }
    if (soruAdim === "gonye_duvar") {
      gonyeOlcu.duvar[gonyeIx] = parseFloat(mm);
      gonyeIx += 1;
      gonyeKaydet();
      if (gonyeIx < 4) { gonyeDuvarSor(); return; }
      gonyeCaprazAc(1);
      return;
    }
    if (soruAdim === "gonye_c1") {
      gonyeOlcu.capraz1 = parseFloat(mm);
      gonyeKaydet();
      gonyeCaprazAc(2);
      return;
    }
    if (soruAdim === "gonye_c2") {
      gonyeOlcu.capraz2 = parseFloat(mm);
      gonyeKaydet();
      ekBitir();
    }
  }
  bagla("ekCikintiBtn", "click", function () { ekParcaBasla("cikinti"); });
  bagla("ekGirintiBtn", "click", function () { ekParcaBasla("oyuk"); });
  bagla("ekYokBtn", "click", function () {
    if (!Z || !zeminDurum) return;
    if (zeminDurum.tur !== "ek_var") return;
    if (!zeminAl(Z.ek_var_yaz(zeminDurum, false))) return;
    var evk = document.getElementById("ekVarKutu");
    if (evk) evk.classList.remove("acik");
    zeminParcaTur();
  });
  function ekParcaBasla(tip) {
    if (!Z || !zeminDurum) return;
    if (zeminDurum.tur !== "ek_var") return;
    if ((zeminDurum.ekler || []).length >= 3) {
      yaz("En fazla 3 ek parça.", true);
      return;
    }
    if (!zeminAl(Z.ek_var_yaz(zeminDurum, true))) return;
    if (!zeminAl(Z.ek_tip_yaz(zeminDurum, tip))) return;
    soruAc("ek_en", (tip === "oyuk" ? "Girinti" : "Çıkıntı") + " en (kenar boyunca) kaç?");
  }
  bagla("soruTamam", "click", soruIsle);
  (function () {
    var ak = document.getElementById("anketKutu");
    if (!ak) return;
    ak.addEventListener("click", function (ev) {
      var btn = ev.target.closest ? ev.target.closest("button") : null;
      if (!btn || !ak.contains(btn)) return;
      var satir = btn.parentNode;
      if (!satir || !satir.classList.contains("acik")) return;
      var grup = satir.getAttribute("data-anket");
      var i, kardes, no, ix;
      if (grup === "mutfak_duvar") {
        if (btn.getAttribute("data-tamam") === "1") {
          if (!orulenNos || !orulenNos.length) { duvarKilit(); return; }
          anketAc("duvar_no");
          return;
        }
        no = parseInt(btn.getAttribute("data-no"), 10);
        if (!(no >= 1 && no <= 4)) return;
        if (!orulenNos) orulenNos = [];
        ix = orulenNos.indexOf(no);
        if (ix >= 0) orulenNos.splice(ix, 1);
        else orulenNos.push(no);
        mutfakDuvarDugmeYaz();
        turKaydet();
        ciz();
        return;
      }
      kardes = satir.querySelectorAll("button");
      for (i = 0; i < kardes.length; i++) kardes[i].classList.remove("secili");
      btn.classList.add("secili");
      if (grup === "mutfak_sekil") {
        mutfakOneriYaz(btn.getAttribute("data-sekil") || "duz");
        turKaydet();
        anketAc("mutfak_duvar");
        return;
      }
      if (grup === "oda_tip") {
        zeminAnket.oda = btn.getAttribute("data-tip") || "kup";
        odaSaplon = zeminAnket.oda === "kup" ? "kup" : odaSaplon;
        anketKaydet();
        anketAc("yukselti");
        return;
      }
      if (grup === "yukselti") {
        zeminAnket.yukselti = btn.getAttribute("data-var") === "1";
        anketKaydet();
        anketAc(zeminAnket.yukselti ? "yukselti_sekil" : "sifon");
        return;
      }
      if (grup === "yukselti_sekil") {
        zeminAnket.yukseltiSekil = btn.getAttribute("data-sekil") || "duz";
        anketKaydet();
        anketAc("sifon");
        return;
      }
      if (grup === "sifon") {
        zeminAnket.sifon = btn.getAttribute("data-var") === "1";
        anketBitir();
        return;
      }
      if (grup === "duvar_no") {
        duvarTur.no = parseInt(btn.getAttribute("data-no"), 10);
        if (!duvarOrulu(duvarTur.no)) { yaz("Bu duvar örülmedi usta.", true); return; }
        if (!D) {
          yaz("Duvar motoru yok.", true);
          return;
        }
        if (!duvarAl(D.duvarSec(durum, duvarTur.no))) return;
        anketAc("duvar_gerec");
        return;
      }
      if (grup === "duvar_gerec") {
        var isBit = btn.getAttribute("data-bitir") === "1";
        var isYok = btn.getAttribute("data-yok") === "1";
        if (isBit) { duvarKilit(); return; }
        if (isYok) { anketAc("duvar_baska_duvar"); return; }
        duvarTur.tip = btn.getAttribute("data-engel") || "";
        if (duvarTur.tip === "kapi") { kapiFormAc(); return; }
        if (duvarTur.tip === "pimas") { anketAc("pimas_kose"); return; }
        anketAc("duvar_yon");
        return;
      }
      if (grup === "duvar_yon") {
        duvarTur.yon = btn.getAttribute("data-yon") === "sag" ? "sag" : "sol";
        if (!duvarAl(D.olcuYonAyarla(durum, duvarTur.yon))) return;
        soruAc("duvar_sol", duvarTur.yon === "sag" ? "Sağdan kaç?" : "Soldan kaç?");
        return;
      }
      if (grup === "pimas_kose") {
        duvarTur.kose = btn.getAttribute("data-kose") || "1-2";
        duvarElemanYaz(0);
        return;
      }
      if (grup === "duvar_baska") {
        if (btn.getAttribute("data-var") === "1") { anketAc("duvar_gerec"); return; }
        anketAc("duvar_baska_duvar");
        return;
      }
      if (grup === "duvar_baska_duvar") {
        if (btn.getAttribute("data-var") === "1") { anketAc("duvar_no"); return; }
        duvarKilit();
      }
    });
  })();
  var soruMm = document.getElementById("soruMm");
  if (soruMm) {
    soruMm.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") soruIsle();
    });
  }
  function zoomCarpan() {
    var h = "normal";
    try { h = localStorage.getItem("magi_zoom_hiz") || "normal"; } catch (e) { /* */ }
    if (h === "yavas") return 1.08;
    if (h === "hizli") return 1.22;
    return 1.14;
  }

  function uzakTaban() {
    var o = durum.oda || taslakOlcu();
    var yuk = (durum.oda && durum.oda.yuk) || 2600;
    return yorunge.uzak > 0 ? yorunge.uzak : Math.max(o.en, o.boy, yuk) * 1.55;
  }

  function sahneSindir() {
    camOlcek = 1;
    camX = 0;
    camY = 0;
    yorunge.yaw = 0.72;
    yorunge.pitch = 0.48;
    yorunge.uzak = 0;
    ciz();
  }

  function zoomAdim(yakin, istemciX, istemciY) {
    var carpan = zoomCarpan();
    if (motorSayfa === "duvar") {
      var oda = durum.oda || taslakOlcu();
      var yuk = (durum.oda && durum.oda.yuk) || 2600;
      var u = uzakTaban();
      var minU = Math.max(oda.en, oda.boy) * 0.55;
      var maxU = Math.max(oda.en, oda.boy, yuk) * 4.5;
      yorunge.uzak = Math.min(maxU, Math.max(minU, yakin ? u / carpan : u * carpan));
      ciz();
      return;
    }
    var cv = sahne.canvas;
    var r = cv.getBoundingClientRect();
    var px, py;
    if (istemciX == null) {
      px = cv.width / 2;
      py = cv.height / 2;
    } else {
      px = (istemciX - r.left) * (cv.width / r.width);
      py = (istemciY - r.top) * (cv.height / r.height);
    }
    var k = kusHarita();
    var mm = k.mm(px, py);
    var eski = camOlcek;
    var f = yakin ? carpan : 1 / carpan;
    camOlcek = Math.min(8, Math.max(0.35, eski * f));
    var yeni = camOlcek;
    camX += mm.x * (eski - yeni) + (k.en * (yeni - eski)) / 2;
    camY += mm.z * (yeni - eski) + (k.boy * (eski - yeni)) / 2;
    ciz();
  }

  bagla("cepheKilitle", "click", cepheKapat);
  bagla("sigdirBtn", "click", sahneSindir);
  bagla("zoomSigdir", "click", sahneSindir);
  function surukleAdimMi() {
    return !!cepheMod || !!elemanSuruk || soruAdim === "kapi_surukle" || soruAdim === "ek_yerlestir" || soruAdim === "yukselti_surukle" || soruAdim === "sifon_surukle";
  }
  bagla("zoomYakin", "click", function () { if (!surukleAdimMi()) zoomAdim(true); });
  bagla("zoomUzak", "click", function () { if (!surukleAdimMi()) zoomAdim(false); });
  document.addEventListener("wheel", function (ev) {
    var t = ev.target;
    if (t && t.closest && t.closest("input, textarea")) ev.preventDefault();
  }, { passive: false, capture: true });
  (function () {
    var cv = document.getElementById("duvarSahne");
    if (!cv) return;
    cv.addEventListener("wheel", function (ev) {
      if (ev.target && ev.target.closest && ev.target.closest("input, textarea, select")) return;
      ev.preventDefault();
      if (surukleAdimMi()) return;
      zoomAdim(ev.deltaY < 0, ev.clientX, ev.clientY);
    }, { passive: false });
  })();

  (function () {
    var hayalet = document.getElementById("surukleHayalet");
    var ikonlar = document.querySelectorAll(".gerecIkon");
    var cv = document.getElementById("duvarSahne");
    var i;
    var parmak = {};
    var pinch = null;
    function hayaletKapa() {
      suruklenen = null;
      tasimaIx = -1;
      onizleme = null;
      if (hayalet) hayalet.classList.remove("acik");
    }
    for (i = 0; i < ikonlar.length; i++) {
      ikonlar[i].addEventListener("pointerdown", function (ev) {
        if (yerlesimKilit && soruAdim !== "kapi_surukle" && soruAdim !== "ek_yerlestir" && soruAdim !== "yukselti_surukle" && soruAdim !== "sifon_surukle") return;
        if (soruAdim === "kapi_surukle" && this.getAttribute("data-tip") !== "esik") return;
        if (soruAdim === "ek_yerlestir" && this.getAttribute("data-tip") !== "ekparca") return;
        if (soruAdim === "yukselti_surukle" && this.getAttribute("data-tip") !== "yukselti") return;
        if (soruAdim === "sifon_surukle" && this.getAttribute("data-tip") !== "sifon") return;
        suruklenen = this.getAttribute("data-tip");
        tasimaIx = -1;
        rafInceYaz(true);
        try { this.setPointerCapture(ev.pointerId); } catch (e) { /* */ }
        if (hayalet) {
          hayalet.classList.add("acik");
          hayalet.style.left = (ev.clientX - 22) + "px";
          hayalet.style.top = (ev.clientY - 22) + "px";
        }
        ev.preventDefault();
      });
    }
    cv.addEventListener("pointerdown", function (ev) {
      cv.setPointerCapture(ev.pointerId);
      parmak[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(parmak);
      if (ids.length === 2) {
        tasimaIx = -1;
        var a = parmak[ids[0]];
        var b = parmak[ids[1]];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var odaP = durum.oda || taslakOlcu();
        var yukP = (durum.oda && durum.oda.yuk) || 2600;
        var tabanP = yorunge.uzak > 0 ? yorunge.uzak : Math.max(odaP.en, odaP.boy, yukP) * 1.55;
        pinch = { dist: Math.sqrt(dx * dx + dy * dy) || 1, olcek: camOlcek, uzak: tabanP };
        orbitSuruk = null;
        elemanSuruk = null;
        rafInceYaz(true);
        return;
      }
      if (motorSayfa === "duvar") {
        if (cepheMod) {
          var rC = cv.getBoundingClientRect();
          var pxC = (ev.clientX - rC.left) * (cv.width / rC.width);
          var pyC = (ev.clientY - rC.top) * (cv.height / rC.height);
          var nokta = Ciz.cepheNokta ? Ciz.cepheNokta(pxC, pyC) : null;
          var eC = (durum.elemanlar || [])[cepheMod.ix];
          orbitSuruk = null;
          elemanSuruk = null;
          cepheTut = null;
          if (nokta && eC && Ciz.cepheVur && Ciz.cepheVur(pxC, pyC)) {
            cepheTut = { ix: cepheMod.ix, dSol: eC.sol - nokta.sol, dAlt: eC.alt - nokta.alt };
            rafInceYaz(true);
          }
          ev.preventDefault();
          return;
        }
        orbitSuruk = { x: ev.clientX, y: ev.clientY };
        rafInceYaz(true);
        ev.preventDefault();
        return;
      }
      if (yerlesimKilit || suruklenen) return;
      var mm = noktaSahne(ev.clientX, ev.clientY);
      if (!mm) return;
      tasimaIx = gerecBul(mm.x, mm.z);
      if (tasimaIx < 0) {
        seciliIx = -1;
        ayarYaz();
        ciz();
        return;
      }
      seciliIx = tasimaIx;
      zeminKoduVer(yerlesim[tasimaIx]);
      ayarYaz();
      ciz();
      rafInceYaz(true);
      ev.preventDefault();
    });
    window.addEventListener("pointermove", function (ev) {
      if (parmak[ev.pointerId]) {
        parmak[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      }
      if (pinch) {
        if (cepheMod) return;
        var ids = Object.keys(parmak);
        if (ids.length === 2) {
          var a = parmak[ids[0]];
          var b = parmak[ids[1]];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (motorSayfa === "duvar") {
            var oda = durum.oda || taslakOlcu();
            var yuk = (durum.oda && durum.oda.yuk) || 2600;
            var taban = pinch.uzak > 0 ? pinch.uzak : Math.max(oda.en, oda.boy, yuk) * 1.55;
            yorunge.uzak = Math.min(Math.max(oda.en, oda.boy, yuk) * 4, Math.max(Math.max(oda.en, oda.boy) * 0.6, taban * (dist / pinch.dist)));
          } else {
            camOlcek = Math.min(6, Math.max(0.4, pinch.olcek * (dist / pinch.dist)));
          }
          ciz();
        }
        return;
      }
      if (motorSayfa === "duvar" && cepheMod && cepheTut) {
        var rM = cv.getBoundingClientRect();
        var pxM = (ev.clientX - rM.left) * (cv.width / rM.width);
        var pyM = (ev.clientY - rM.top) * (cv.height / rM.height);
        var noktaM = Ciz.cepheNokta ? Ciz.cepheNokta(pxM, pyM) : null;
        if (noktaM) cepheYer(cepheTut.ix, noktaM.sol + cepheTut.dSol, noktaM.alt + cepheTut.dAlt);
        ciz();
        return;
      }
      if (motorSayfa === "duvar" && elemanSuruk) {
        var mmEl = noktaSahne(ev.clientX, ev.clientY);
        if (mmEl) duvarElemanKaydir(elemanSuruk.ix, mmEl.x, mmEl.z);
        ciz();
        return;
      }
      if (motorSayfa === "duvar" && orbitSuruk) {
        yorunge.yaw -= (ev.clientX - orbitSuruk.x) * 0.006;
        yorunge.pitch = Math.max(0.12, Math.min(1.18, yorunge.pitch + (ev.clientY - orbitSuruk.y) * 0.004));
        orbitSuruk.x = ev.clientX;
        orbitSuruk.y = ev.clientY;
        ciz();
        return;
      }
      if (hayalet && suruklenen) {
        hayalet.style.left = (ev.clientX - 22) + "px";
        hayalet.style.top = (ev.clientY - 22) + "px";
      }
      if (yerlesimKilit && soruAdim !== "kapi_surukle" && soruAdim !== "ek_yerlestir" && soruAdim !== "yukselti_surukle" && soruAdim !== "sifon_surukle") return;
      var mm;
      if (suruklenen === "ekparca") {
        mm = noktaSahne(ev.clientX, ev.clientY);
        onizlemeEk = mm ? ekTaslakOnizle(mm) : null;
        onizleme = null;
        ciz();
        return;
      }
      if (suruklenen === "yukselti" && yukseltiEkle) {
        mm = noktaSahne(ev.clientX, ev.clientY);
        if (mm) {
          yukseltiYedekAl();
          var hazir = yukseltiIkinciHazirla(mm);
          if (hazir.dolu) {
            yukseltiYedektenKur();
            onizleme = null;
          } else {
            onizleme = hazir.parca;
          }
          ciz();
        }
        return;
      }
      if (suruklenen) {
        mm = noktaSahne(ev.clientX, ev.clientY);
        if (mm) {
          onizleme = soruAdim === "kapi_surukle"
            ? hizala("esik", mm.x, mm.z, { p: { en: 900, derinlik: 120 } })
            : hizala(suruklenen, mm.x, mm.z);
          ciz();
        }
        return;
      }
      if (tasimaIx < 0) return;
      if (yerlesim[tasimaIx] && yerlesim[tasimaIx].tip === "yukselti" && yerlesim[tasimaIx].kilit) return;
      mm = noktaSahne(ev.clientX, ev.clientY);
      if (!mm) return;
      yerlesim[tasimaIx] = hizala(yerlesim[tasimaIx].tip, mm.x, mm.z, yerlesim[tasimaIx]);
      seciliIx = tasimaIx;
      ciz();
    });
    function birak(ev) {
      rafInceYaz(false);
      delete parmak[ev.pointerId];
      if (Object.keys(parmak).length < 2) pinch = null;
      if (!Object.keys(parmak).length) orbitSuruk = null;
      if (cepheTut) {
        cepheTut = null;
        turKaydet();
        islemKaydet();
        ciz();
        return;
      }
      if (elemanSuruk) {
        elemanSuruk = null;
        turKaydet();
        islemKaydet();
        ciz();
        return;
      }
      if (soruAdim === "ek_yerlestir" && suruklenen === "ekparca" && Z && zeminDurum && zeminDurum.tur === "ek_kenar") {
        var rYer = cv.getBoundingClientRect();
        var mmYer = noktaSahne(ev.clientX, ev.clientY);
        hayaletKapa();
        onizlemeEk = null;
        if (mmYer && ev.clientX >= rYer.left && ev.clientX <= rYer.right && ev.clientY >= rYer.top && ev.clientY <= rYer.bottom) {
          if (zeminAl(Z.ek_yapistir(zeminDurum, mmYer.x, mmYer.z))) {
            ekSonrakiVeyaBitir();
            return;
          }
        }
        ciz();
        return;
      }
      if (suruklenen) {
        var tip = suruklenen;
        var r = cv.getBoundingClientRect();
        hayaletKapa();
        if (yerlesimKilit && soruAdim !== "kapi_surukle" && soruAdim !== "ek_yerlestir" && soruAdim !== "yukselti_surukle" && soruAdim !== "sifon_surukle") {
          ciz();
          return;
        }
        if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) {
          if (tip === "yukselti" && yukseltiEkle) yukseltiYedekGeri();
          onizleme = null;
          ciz();
          return;
        }
        var mm = noktaSahne(ev.clientX, ev.clientY);
        if (!mm) {
          if (tip === "yukselti" && yukseltiEkle) yukseltiYedekGeri();
          ciz();
          return;
        }
        if (tip === "yukselti" && soruAdim === "yukselti_surukle" && yukseltiEkle) {
          yukseltiYedekAl();
          var hazirBirak = yukseltiIkinciHazirla(mm);
          onizleme = null;
          if (hazirBirak.dolu || !hazirBirak.parca) {
            yukseltiYedekGeri();
            yaz("Bu duvarda iki yükselti var usta.", true);
            ciz();
            return;
          }
          yukseltiNoVer(hazirBirak.parca);
          yerlesim.push(hazirBirak.parca);
          if (yukseltiBinmeVar()) {
            yukseltiYedekGeri();
            yaz("Yükseltiler binmez usta.", true);
            ciz();
            return;
          }
          yukseltiYedek = null;
          yukseltiEkle = false;
          turKaydet();
          islemKaydet();
          seciliIx = -1;
          ayarYaz();
          ciz();
          zeminParcaTur();
          return;
        }
        if (tip === "oda_zemin") {
          yerlesim = yerlesim.filter(function (it) { return it.tip !== "oda_zemin"; });
        }
        if (tip === "kapi" || tip === "esik" || soruAdim === "kapi_surukle") {
          yerlesim = yerlesim.filter(function (it) { return it.tip !== "kapi" && it.tip !== "esik"; });
        }
        if (soruAdim === "yukselti_surukle") yerlesimTipSil("yukselti");
        if (soruAdim === "sifon_surukle") yerlesimTipSil("sifon");
        var sekilB = zeminAnket.yukseltiSekil;
        if (tip === "yukselti" && soruAdim === "yukselti_surukle" && (sekilB === "L" || sekilB === "U")) {
          var oB = taslakOlcu();
          yukseltiSekilKur(sekilB, yukseltiSekilKenarlar(sekilB, mm, oB.en, oB.boy), null);
          onizleme = null;
          turKaydet();
          islemKaydet();
          seciliIx = -1;
          ayarYaz();
          ciz();
          zeminParcaTur();
          return;
        }
        var parca = soruAdim === "kapi_surukle"
          ? hizala("esik", mm.x, mm.z, { p: { en: 900, derinlik: 120 } })
          : hizala(tip, mm.x, mm.z);
        if (tip === "yukselti" && soruAdim === "yukselti_surukle") {
          parca = yukseltiKapiKes(parca, "nokta", (parca.kenar === 0 || parca.kenar === 2) ? mm.x : mm.z);
          if (!parca) {
            onizleme = null;
            yaz("Kapı önüne yükselti konmaz usta.", true);
            ciz();
            return;
          }
          yukseltiNoVer(parca);
        }
        yerlesim.push(parca);
        turKaydet();
        islemKaydet();
        if (soruAdim === "kapi_surukle") {
          seciliIx = -1;
          ayarYaz();
          kapiBirakildi(parca);
          return;
        }
        if (soruAdim === "yukselti_surukle" || soruAdim === "sifon_surukle") {
          seciliIx = -1;
          ayarYaz();
          ciz();
          zeminParcaTur();
          return;
        }
        seciliIx = yerlesim.length - 1;
        ayarYaz();
        ciz();
        return;
      }
      if (tasimaIx >= 0) {
        seciliIx = tasimaIx;
        tasimaIx = -1;
        ayarYaz();
        ciz();
        islemKaydet();
      }
    }
    window.addEventListener("pointerup", birak);
    window.addEventListener("pointercancel", function (ev) {
      delete parmak[ev.pointerId];
      pinch = null;
      if (suruklenen && (soruAdim === "kapi_surukle" || soruAdim === "ek_yerlestir" || soruAdim === "yukselti_surukle" || soruAdim === "sifon_surukle")) {
        birak(ev);
        return;
      }
      hayaletKapa();
      rafInceYaz(false);
      ciz();
    });
  })();

  window.addEventListener("resize", function () { ciz(); });

  O.etiketYaz();
  document.getElementById("odaEn").value = O.goster(4000);
  document.getElementById("odaBoy").value = O.goster(3000);
  document.getElementById("odaYuk").value = O.goster(2600);
})();
