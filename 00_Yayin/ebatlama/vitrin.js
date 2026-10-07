function levhaBos() {
  return { en: 2800, boy: 2100, kalinlik: 18, damarKilidi: false };
}

function musteriBos() {
  return { ad: "", telefon: "", adres: "", zaman: 0 };
}

var DENEME_HAVUZ = [
  { boy: 1800, en: 1500, adet: 1, kalinlik: 18 },
  { boy: 800, en: 700, adet: 1, kalinlik: 18 },
  { boy: 900, en: 650, adet: 2, kalinlik: 18 }
];
var DENEME_IHTIYAC = [
  { sira: 1, boy: 720, en: 560, adet: 4, bant: ["boy-sol"] },
  { sira: 2, boy: 500, en: 528, adet: 6, bant: ["boy-sol", "boy-sag"] },
  { sira: 3, boy: 400, en: 400, adet: 3, bant: ["en-sol"] },
  { sira: 4, boy: 300, en: 200, adet: 8, bant: [] },
  { sira: 5, boy: 650, en: 350, adet: 2, bant: ["boy-sol", "en-sol", "en-sag"] }
];
var FIRE = {
  ihtiyac: [],
  havuz: [],
  kenara: [],
  levha: levhaBos(),
  levhaElle: false,
  motorSonuc: null,
  motorGirdiOzet: null,
  motorKesim: null,
  sayfaNo: 1,
  senaryoGecmis: [],
  senaryoIx: 0,
  isEbatlari: [],
  musteri: musteriBos(),
  bantMm: 0,
  kalinlikMm: 0
};
var PLAKA = {
  ihtiyac: [],
  levha: levhaBos(),
  levhaElle: false,
  motorSonuc: null,
  motorGirdiOzet: null,
  motorKesim: null,
  sayfaNo: 1,
  senaryoGecmis: [],
  senaryoIx: 0,
  isEbatlari: [],
  musteri: musteriBos(),
  bantMm: 0
};
var mod = "fire";
var denemeAcik = false;
var ayarMod = "ekle";
var ayarIx = -1;
var ayarDamarIptal = false;
var ayarDamarAcik = false;
var BIRIM = "mm";
var BIRIM_ANAHTAR = "fire_birim";
var FIYAT_ANAHTAR = "atolye_m2_tl";
var KALINLIK_FIYAT = [];
var KIMLIK_ANAHTAR = "usta_kimligi";
var TELEFON_ANAHTAR = "usta_telefon";
var ONAY_ANAHTAR = "yasal_onay";
var YASAL_CUMLE = "Ölçü optimizasyonu ve kesim hesapları tavsiye niteliğindedir. Fire ve kesim hatalarından doğacak sorumluluğu kabul ediyorum.";
var LEVHA_FIRE_ANAHTAR = "fire_levha";
var LEVHA_PLAKA_ANAHTAR = "plaka_levha";
var FIRE_VERI_ANAHTAR = "fire_veri";
var PLAKA_VERI_ANAHTAR = "plaka_veri";
var KARA_KUTU_ANAHTAR = "ebatlama_kara_kutu";
var KARA_KUTU_MAX = 80;
var birimElle = false;
var KIMLIK = { ad: "", telefon: "" };
var paylasBekleyen = "";
/* Plaka modulu: cm konusmasi (183×366 = 1830×3660 mm). Fire listesine girmez. */
var PLAKA_SABLONLARI = [
  { ad: "183×366", en: 1830, boy: 3660, kalinlik: 18 },
  { ad: "122×280", en: 1220, boy: 2800, kalinlik: 18 },
  { ad: "122×244", en: 1220, boy: 2440, kalinlik: 18 },
  { ad: "210×280", en: 2100, boy: 2800, kalinlik: 18 }
];
var MOTOR_KOK = "http://" + (location.hostname || "127.0.0.1") + ":8766";
var MOTOR_URL = MOTOR_KOK + "/hesapla";
var SENARYO_URL = MOTOR_KOK + "/senaryo";
var AYAR_URL = MOTOR_KOK + "/ayarlar";
var SAGLIK_URL = MOTOR_KOK + "/saglik";
var PARCA_RENK = ["#4c78a8", "#f58518", "#54a24b", "#e45756", "#b279a2", "#72b7b2"];

function M() {
  return mod === "plaka" ? PLAKA : FIRE;
}

function ihtiyac() {
  return M().ihtiyac;
}

function k2Id() { return mod === "plaka" ? "k1-plaka" : "k1-fire"; }
function k3Id() { return mod === "plaka" ? "k2-plaka" : "k2-fire"; }
function k2Kok() { return document.getElementById(k2Id()); }
function k3Kok() { return document.getElementById(k3Id()); }
function q2(sel) { var k = k2Kok(); return k ? k.querySelector(sel) : null; }
function q3(sel) { var k = k3Kok(); return k ? k.querySelector(sel) : null; }

function karaKutuYaz(olay, ek) {
  var satir = { t: Date.now(), mod: mod, olay: olay };
  if (ek && typeof ek === "object") {
    Object.keys(ek).forEach(function (k) {
      if (ek[k] !== undefined) satir[k] = ek[k];
    });
  }
  var liste = [];
  try {
    liste = JSON.parse(localStorage.getItem(KARA_KUTU_ANAHTAR) || "[]");
  } catch (e) {
    liste = [];
  }
  if (!Array.isArray(liste)) liste = [];
  liste.push(satir);
  if (liste.length > KARA_KUTU_MAX) liste = liste.slice(-KARA_KUTU_MAX);
  try {
    localStorage.setItem(KARA_KUTU_ANAHTAR, JSON.stringify(liste));
  } catch (e2) {}
}

function karaKutuOku() {
  var liste = [];
  try {
    liste = JSON.parse(localStorage.getItem(KARA_KUTU_ANAHTAR) || "[]");
  } catch (e) {
    liste = [];
  }
  return Array.isArray(liste) ? liste : [];
}

function karaKutuSonucOzet(sonuc) {
  if (!sonuc) return {};
  var n = levhaKaynakSay(sonuc);
  return {
    strateji: sonuc.strateji || "",
    levha: sonuc.levha_sayisi || 0,
    fire: n.fire || 0,
    tam: n.tam || 0,
    sigmayan: (sonuc.sigmayan || []).length,
    oto: !!sonuc.plaka_havuz_oto
  };
}

function ayarPerde() { return document.getElementById("ayar-perde-" + mod); }
function levhaPerde() { return document.getElementById("levha-perde-" + mod); }
function levhaKok() {
  var sayfa = document.getElementById("k1-plaka-ekle");
  if (sayfa && sayfa.classList.contains("on")) return sayfa;
  return levhaPerde();
}
function qa(sel) { var p = ayarPerde(); return p ? p.querySelector(sel) : null; }
function ql(sel) { var p = levhaKok(); return p ? p.querySelector(sel) : null; }

function motorSonucAl() { return M().motorSonuc; }
function motorSonucYaz(v) { M().motorSonuc = v; }
function motorGirdiOzetAl() { return M().motorGirdiOzet; }
function motorGirdiOzetYaz(v) { M().motorGirdiOzet = v; }
function motorKesimAl() { return M().motorKesim; }
function motorKesimYaz(v) { M().motorKesim = v; }
function sayfaNoAl() { return M().sayfaNo; }
function sayfaNoYaz(v) { M().sayfaNo = v; }

function musteriKart() {
  var p = document.getElementById("cikti-perde");
  return p ? p.querySelector(".musteri-kart") : null;
}

function zamanYazi(ms) {
  var d = new Date(ms || Date.now());
  function p(n) { return (n < 10 ? "0" : "") + n; }
  return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() +
    " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function musteriOkuKart() {
  var k = musteriKart();
  var ad = k ? k.querySelector(".is-ad") : null;
  var tel = k ? k.querySelector(".is-tel") : null;
  var adr = k ? k.querySelector(".is-adres") : null;
  return {
    ad: kimlikTemiz(ad ? ad.value : ""),
    telefon: kimlikTemiz(tel ? tel.value : "", 20),
    adres: kimlikTemiz(adr ? adr.value : "", 160)
  };
}

function musteriYazKart() {
  var k = musteriKart();
  if (!k || !M().musteri) return;
  var m = M().musteri;
  var ad = k.querySelector(".is-ad");
  var tel = k.querySelector(".is-tel");
  var adr = k.querySelector(".is-adres");
  if (ad) ad.value = m.ad || "";
  if (tel) tel.value = m.telefon || "";
  if (adr) adr.value = m.adres || "";
}

function musteriKaydetKart() {
  if (!M().musteri) M().musteri = musteriBos();
  var o = musteriOkuKart();
  var m = M().musteri;
  m.ad = o.ad;
  m.telefon = o.telefon;
  m.adres = o.adres;
  if (m.ad) {
    if (!m.zaman) m.zaman = Date.now();
  } else {
    m.zaman = 0;
  }
}

function musteriAdVar() {
  var m = M().musteri;
  return !!(m && kimlikTemiz(m.ad));
}

function musteriUyari(goster) {
  var k = musteriKart();
  var u = k ? k.querySelector(".musteri-uyari") : null;
  if (u) u.hidden = !goster;
}

function musteriGerekli() {
  musteriKaydetKart();
  if (musteriAdVar()) {
    musteriUyari(false);
    return true;
  }
  musteriUyari(true);
  var k = musteriKart();
  var inp = k ? k.querySelector(".is-ad") : null;
  if (inp) inp.focus();
  return false;
}

function bantOku() {
  var liste = [];
  var p = ayarPerde();
  if (!p) return liste;
  p.querySelectorAll(".kenar.yan").forEach(function (b) {
    liste.push(b.getAttribute("data-kenar"));
  });
  return liste;
}

function bantYaz(liste) {
  var set = liste || [];
  var p = ayarPerde();
  if (!p) return;
  p.querySelectorAll(".kenar").forEach(function (b) {
    b.classList.toggle("yan", set.indexOf(b.getAttribute("data-kenar")) >= 0);
  });
}

function damarSatirlariSifirla() {
  ihtiyac().forEach(function (p) {
    p.damarIptal = false;
    p.damarAcik = false;
  });
  ayarDamarIptal = false;
  ayarDamarAcik = false;
}

function damarGirisPasif() {
  FIRE.levha.damarKilidi = false;
  PLAKA.levha.damarKilidi = false;
  FIRE.ihtiyac.forEach(function (p) {
    p.damarIptal = false;
    p.damarAcik = false;
  });
  PLAKA.ihtiyac.forEach(function (p) {
    p.damarIptal = false;
    p.damarAcik = false;
  });
  ayarDamarIptal = false;
  ayarDamarAcik = false;
  levhaDepoya();
  modulVeriKaydet();
}

function damarListeSuVar() {
  return parcaDamarDurum(null).kilidi;
}

function anahtarAcikCevir(btn) {
  return btn.getAttribute("aria-pressed") !== "true";
}

function parcaDamarDurum(p, kilidi) {
  if (kilidi === undefined) {
    kilidi = !!(levhaAktif() && levhaAktif().damarKilidi);
  }
  if (!p || typeof p !== "object") p = {};
  var ipt = !!p.damarIptal;
  var ac = !!p.damarAcik;
  return {
    kilidi: kilidi,
    suVar: kilidi ? !ipt : ac
  };
}

function parcaAyarDugmeYaz() {
  var damarBtn = qa("[data-parca-damar]");
  if (damarBtn) {
    var acik = parcaDamarDurum({
      damarIptal: ayarDamarIptal,
      damarAcik: ayarDamarAcik
    }).suVar;
    damarBtn.setAttribute("aria-pressed", acik ? "true" : "false");
  }
}

function panoTemizle() {
  var boy = qa(".a-boy");
  var en = qa(".a-en");
  var adet = qa(".a-adet");
  var bantMm = qa(".a-bant-mm");
  if (boy) boy.value = "";
  if (en) en.value = "";
  if (adet) adet.value = "1";
  if (bantMm) bantMm.value = "";
  ayarDamarIptal = false;
  ayarDamarAcik = false;
  bantYaz([]);
  parcaAyarDugmeYaz();
  ayarUyariYaz("");
}

function ekleAc() {
  ayarMod = "ekle";
  ayarIx = -1;
  var baslik = qa(".ayar-baslik");
  var sira = qa(".ayar-sira");
  if (baslik) baslik.textContent = "Parça ekle";
  if (sira) sira.textContent = String(ihtiyac().length + 1);
  panoTemizle();
  var p = ayarPerde();
  if (p) p.classList.add("acik");
}

function satirAyarAc(ix) {
  var p = ihtiyac()[ix];
  if (!p) return;
  ayarMod = "satir";
  ayarIx = ix;
  var baslik = qa(".ayar-baslik");
  var sira = qa(".ayar-sira");
  var boy = qa(".a-boy");
  var en = qa(".a-en");
  var adet = qa(".a-adet");
  var bantMm = qa(".a-bant-mm");
  if (baslik) baslik.textContent = "Parça düzelt";
  if (sira) sira.textContent = String(p.sira);
  if (boy) boy.value = olcuGoster(p.boy);
  if (en) en.value = olcuGoster(p.en);
  if (adet) adet.value = String(p.adet);
  if (bantMm) bantMm.value = p.bantMm > 0 ? olcuGoster(p.bantMm) : "";
  ayarDamarIptal = !!p.damarIptal;
  ayarDamarAcik = !!p.damarAcik;
  bantYaz(p.bant);
  parcaAyarDugmeYaz();
  ayarUyariYaz("");
  var perde = ayarPerde();
  if (perde) perde.classList.add("acik");
}

function ayarKapat() {
  var p = ayarPerde();
  if (p) p.classList.remove("acik");
  ayarIx = -1;
}

function bantMmOku(metin) {
  var temiz = String(metin === undefined || metin === null ? "" : metin).trim().replace(",", ".");
  if (temiz === "" || isNaN(Number(temiz))) return 0;
  var mm = Number(temiz) * birimCarpan();
  if (!(mm > 0)) return 0;
  return Math.round(mm * 100) / 100;
}

function olcuOku() {
  var boy = qa(".a-boy");
  var en = qa(".a-en");
  var adet = qa(".a-adet");
  var bantMm = qa(".a-bant-mm");
  return {
    boy: mmOku(boy ? boy.value : ""),
    en: mmOku(en ? en.value : ""),
    adet: parseInt(adet ? adet.value : "", 10),
    bant: bantOku(),
    bantMm: bantMmOku(bantMm ? bantMm.value : "")
  };
}

function ayarUyariYaz(metin) {
  var el = qa(".ayar-uyari");
  if (!el) return;
  if (!metin) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = metin;
}

function olcuUyariYaz(metin) {
  var el = document.querySelector("#k1-fire-ekle .olcu-uyari");
  if (!el) return;
  if (!metin) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = metin;
}

function ayarKaydet() {
  var o = olcuOku();
  if (!(o.boy > 0) || !(o.en > 0) || !(o.adet > 0)) {
    ayarUyariYaz("Boy, en ve adet yaz.");
    var boy = qa(".a-boy");
    var en = qa(".a-en");
    var adet = qa(".a-adet");
    if (boy && !(o.boy > 0) && boy.focus) boy.focus();
    else if (en && !(o.en > 0) && en.focus) en.focus();
    else if (adet && adet.focus) adet.focus();
    return;
  }
  ayarUyariYaz("");
  if (ayarMod === "ekle") {
    ihtiyac().push({
      sira: ihtiyac().length + 1,
      boy: o.boy,
      en: o.en,
      adet: o.adet,
      bant: o.bant,
      bantMm: o.bantMm,
      damarIptal: ayarDamarIptal,
      damarAcik: ayarDamarAcik
    });
  } else if (ayarIx >= 0 && ihtiyac()[ayarIx]) {
    ihtiyac()[ayarIx].boy = o.boy;
    ihtiyac()[ayarIx].en = o.en;
    ihtiyac()[ayarIx].adet = o.adet;
    ihtiyac()[ayarIx].bant = o.bant;
    ihtiyac()[ayarIx].bantMm = o.bantMm;
    ihtiyac()[ayarIx].damarIptal = ayarDamarIptal;
    ihtiyac()[ayarIx].damarAcik = ayarDamarAcik;
  }
  cizListe();
  if (ayarMod === "ekle") listeAltaKaydir();
  motorBayat();
  ayarKapat();
}

function listeAltaKaydir() {
  var el = q2(".ihtiyac-tablo");
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

function bantOzet(liste) {
  var boy = 0;
  var en = 0;
  (liste || []).forEach(function (k) {
    if (k === "boy-sol" || k === "boy-sag") boy += 1;
    if (k === "en-sol" || k === "en-sag") en += 1;
  });
  if (!boy && !en) return "bant yok";
  var parca = [];
  if (boy) parca.push(boy + " boy");
  if (en) parca.push(en + " en");
  return parca.join(" ");
}

function olcuHucre(sayi, liste, kenar) {
  var n = 0;
  (liste || []).forEach(function (k) {
    if (kenar === "boy" && (k === "boy-sol" || k === "boy-sag")) n += 1;
    if (kenar === "en" && (k === "en-sol" || k === "en-sag")) n += 1;
  });
  var nokta = "";
  var i;
  for (i = 0; i < n; i++) nokta += "<i></i>";
  return (
    "<div class=\"olcu-hucre\"><span class=\"bant-isik\">" +
    nokta + "</span>" + olcuGoster(sayi) + "</div>"
  );
}

function parcaKimlik(p) {
  return "P" + String(p.sira).padStart(3, "0");
}

function parcaListeSatir(etiket) {
  var kaynak = null;
  ihtiyac().forEach(function (satir) {
    var kim = parcaKimlik(satir);
    if (etiket === kim || (etiket && etiket.indexOf(kim + "-") === 0)) kaynak = satir;
  });
  return kaynak;
}

function parcaAdet(kaynak) {
  var n = kaynak ? parseInt(kaynak.adet, 10) : 0;
  return n > 0 ? n : 1;
}

function bantKenarYazi(kaynak) {
  var n = 0;
  if (kaynak && Number(kaynak.bantMm) > 0) n = Number(kaynak.bantMm);
  else if (Number(M().bantMm) > 0) n = Number(M().bantMm);
  else n = 0;
  var s;
  if (n === Math.round(n)) {
    s = String(Math.abs(Math.round(n)));
    if (s.length < 2) s = ("00" + s).slice(-2);
  } else {
    s = String(n).replace(".", ",");
  }
  return "(BANT " + s + " mm)";
}

function bantKenarYon(donduruldu) {
  if (donduruldu) {
    return {
      "boy-sol": "ust",
      "boy-sag": "alt",
      "en-sol": "sag",
      "en-sag": "sol"
    };
  }
  return {
    "boy-sol": "sol",
    "boy-sag": "sag",
    "en-sol": "ust",
    "en-sag": "alt"
  };
}

function bantCizgiKutu(yer, pw, ph) {
  var ic = 20;
  var uc = 70;
  var kal = 3;
  pw = Number(pw) || 0;
  ph = Number(ph) || 0;
  if (pw < 8 || ph < 8) return "";
  var yatay = yer === "ust" || yer === "alt";
  var kenar = yatay ? pw : ph;
  var derinlik = yatay ? ph : pw;
  if (derinlik < ic + kal) ic = Math.max(0, derinlik - kal);
  var minBoy = 8;
  if (kenar < 2 * uc + minBoy) uc = Math.max(0, (kenar - minBoy) / 2);
  var boy = Math.max(minBoy, kenar - 2 * uc);
  var left;
  var top;
  var w;
  var h;
  if (yer === "ust") {
    left = uc;
    top = ic;
    w = boy;
    h = kal;
  } else if (yer === "alt") {
    left = uc;
    top = ph - ic - kal;
    w = boy;
    h = kal;
  } else if (yer === "sol") {
    left = ic;
    top = uc;
    w = kal;
    h = boy;
  } else {
    left = pw - ic - kal;
    top = uc;
    w = kal;
    h = boy;
  }
  return (
    "<i class=\"p-bant-cizgi\" style=\"left:" + ((left / pw) * 100) + "%;top:" +
    ((top / ph) * 100) + "%;width:" + ((w / pw) * 100) + "%;height:" +
    ((h / ph) * 100) + "%\" aria-hidden=\"true\"></i>"
  );
}

function bantKenarHtml(kaynak, donduruldu, pw, ph) {
  var html = "";
  var yon = bantKenarYon(donduruldu);
  var gorulen = {};
  ((kaynak && kaynak.bant) || []).forEach(function (k) {
    var yer = yon[k];
    if (!yer || gorulen[yer]) return;
    gorulen[yer] = true;
    html += bantCizgiKutu(yer, pw, ph);
  });
  return html;
}

function olcuCiftAnahtar(en, boy) {
  var a = Math.round(Number(en)) || 0;
  var b = Math.round(Number(boy)) || 0;
  if (a > b) {
    var t = a;
    a = b;
    b = t;
  }
  return a + "x" + b;
}

function parcaRenkHarita() {
  var harita = {};
  var n = 0;
  ihtiyac().forEach(function (satir) {
    var k = olcuCiftAnahtar(satir.en, satir.boy);
    if (harita[k] == null) {
      harita[k] = PARCA_RENK[n % PARCA_RENK.length];
      n += 1;
    }
  });
  return harita;
}

function kesimHaritasi() {
  var harita = {};
  (motorKesimAl() || []).forEach(function (k) {
    if (k && k.id) harita[k.id] = k;
  });
  return harita;
}

function satirHtml(p, disli, harita, kilidi) {
  var ozet = bantOzet(p.bant);
  var bantTd = "<td><span class=\"bant-ozet\">" + ozet + "</span></td>";
  var govde =
    "<td class=\"sira-hucre\">" + p.sira + "</td><td>" + olcuHucre(p.boy, p.bant, "boy") +
    "</td><td>" + olcuHucre(p.en, p.bant, "en") +
    "</td><td>" + p.adet + "</td>" + bantTd;
  if (harita) {
    var k = harita[parcaKimlik(p)];
    govde +=
      "<td>" +
      (k ? olcuGoster(k.kesim_boy_mm) + "×" + olcuGoster(k.kesim_en_mm) : "—") +
      "</td>";
  }
  if (disli) {
    var d = parcaDamarDurum(p, kilidi);
    var ix = p.sira - 1;
    return (
      "<tr>" + govde +
      "<td class=\"ayar-hucre\"><span class=\"su-isik" +
      (d.suVar ? " yan" : "") +
      "\" aria-hidden=\"true\"><i></i><i></i></span><span class=\"satir-islem\">" +
      "<button type=\"button\" class=\"disli\" data-ayar=\"" + ix +
      "\" aria-label=\"parca ayar\">⚙</button>" +
      "<button type=\"button\" class=\"disli sil-ikon\" data-liste-sil=\"" + ix +
      "\" aria-label=\"Sil\" title=\"Satırı sil\">" +
      "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">" +
      "<path d=\"M9.4 3.1h5.2l.7 1.7h5v1.8H3.7V4.8h5z\"/>" +
      "<path fill-rule=\"evenodd\" d=\"M6 8h12l-1 12.2A1.7 1.7 0 0 1 15.3 21.7H8.7A1.7 1.7 0 0 1 7 20.2zm4.2 2.4h1.5v8.2h-1.5zm2.6 0h1.5v8.2h-1.5z\"/>" +
      "</svg></button></span></td></tr>"
    );
  }
  return "<tr>" + govde + "</tr>";
}

function parcaAdetToplam(liste) {
  var n = 0;
  (liste || []).forEach(function (p) {
    n += Number(p.adet) || 0;
  });
  return n;
}

function parcaRozetYaz() {
  var fireEl = document.querySelector("#k1-fire [data-rozet-parca]");
  var plakaEl = document.querySelector("#k1-plaka [data-rozet-parca]");
  if (fireEl) fireEl.textContent = String(parcaAdetToplam(FIRE.ihtiyac));
  if (plakaEl) plakaEl.textContent = String(parcaAdetToplam(PLAKA.ihtiyac));
}

function cizListe() {
  var kafa =
    "<thead><tr><th class=\"sira-bas\">Sıra/No</th><th>Boy " + BIRIM + "</th><th>En " + BIRIM +
    "</th><th>Adet</th><th>Bant</th>";
  var harita = kesimHaritasi();
  var kesimVar = Object.keys(harita).length > 0;
  var suVar = damarListeSuVar();
  var baslikDisli = "<table>" + kafa + "<th class=\"ayar-bas\"></th></tr></thead><tbody>";
  var baslikOzet =
    "<table>" + kafa + (kesimVar ? "<th>Kesim " + BIRIM + "</th>" : "") +
    "</tr></thead><tbody>";
  var govde = ihtiyac().map(function (p) { return satirHtml(p, true, null, suVar); }).join("");
  var ozet = ihtiyac().map(function (p) {
    return satirHtml(p, false, kesimVar ? harita : null);
  }).join("");
  var el = q2(".ihtiyac-tablo");
  if (el) el.innerHTML = baslikDisli + govde + "</tbody></table>";
  var so = q3(".sonuc-liste");
  if (so) so.innerHTML = ihtiyac().length ? baslikOzet + ozet + "</tbody></table>" : "";
  var bos = q2(".liste-bos");
  if (bos) bos.hidden = ihtiyac().length > 0;
  if (ihtiyac().length) {
    var h = q2(".liste-hata");
    if (h && /Liste boş/.test(h.textContent || "")) listeHataYaz("");
  }
  kimlikListeYaz();
  cizGosterge();
  presetleriYenile();
  parcaRozetYaz();
}

function parcaDamarYaz(acik) {
  var kilidi = parcaDamarDurum(null).kilidi;
  if (kilidi) {
    ayarDamarIptal = !acik;
    ayarDamarAcik = false;
  } else {
    ayarDamarAcik = !!acik;
    ayarDamarIptal = false;
  }
  if (ayarMod === "satir" && ayarIx >= 0 && ihtiyac()[ayarIx]) {
    ihtiyac()[ayarIx].damarIptal = ayarDamarIptal;
    ihtiyac()[ayarIx].damarAcik = ayarDamarAcik;
    cizListe();
    motorBayat();
  }
  parcaAyarDugmeYaz();
}

function fmtOndalik(n) {
  return n.toFixed(2).replace(".", ",");
}

function kalinlikFiyatAl(kal) {
  var k = Math.round(Number(kal));
  if (!(k > 0)) return 0;
  var i;
  for (i = KALINLIK_FIYAT.length - 1; i >= 0; i--) {
    if (KALINLIK_FIYAT[i].kal === k) return KALINLIK_FIYAT[i].tl;
  }
  return 0;
}

function fiyatYaziKac(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function fiyatKayitDuz(p) {
  if (!p || typeof p !== "object") return null;
  var kal = Math.round(Number(p.kal));
  var tl = Number(p.tl);
  if (!(kal > 0) || !(isFinite(tl) && tl > 0)) return null;
  var urun = String(p.urun || "").trim();
  if (urun.length > 40) urun = urun.slice(0, 40);
  return { urun: urun, kal: kal, tl: Math.round(tl * 100) / 100 };
}

function fiyatHaritaOku(veri) {
  var liste = [];
  if (Array.isArray(veri)) {
    veri.forEach(function (p) {
      var k = fiyatKayitDuz(p);
      if (k) liste.push(k);
    });
    return liste;
  }
  if (!veri || typeof veri !== "object") return liste;
  Object.keys(veri).forEach(function (k) {
    var kal = parseInt(k, 10);
    var ham = veri[k];
    var tl = ham && typeof ham === "object" ? Number(ham.tl) : Number(ham);
    var urun = ham && typeof ham === "object" ? String(ham.urun || "") : "";
    var kayit = fiyatKayitDuz({ urun: urun, kal: kal, tl: tl });
    if (kayit) liste.push(kayit);
  });
  return liste;
}

function fiyatKaydet() {
  try {
    localStorage.setItem(FIYAT_ANAHTAR, JSON.stringify(KALINLIK_FIYAT));
  } catch (e) { /* depolama kapali */ }
}

function fiyatYukle() {
  var kayit = fiyatHaritaOku(jsonOku(FIYAT_ANAHTAR));
  if (kayit.length) KALINLIK_FIYAT = kayit;
}

function fiyatListeCiz() {
  var el = document.getElementById("fiyat-liste");
  if (!el) return;
  if (!KALINLIK_FIYAT.length) {
    el.innerHTML = "<p class=\"satir-not\">Henüz fiyat yok.</p>";
    return;
  }
  el.innerHTML = KALINLIK_FIYAT.map(function (p, i) {
    return "<div class=\"fiyat-kayit\">" +
      "<span>" + fiyatYaziKac(p.urun || "—") + "</span>" +
      "<span>" + p.kal + " mm</span>" +
      "<span>" + fmtOndalik(p.tl) + " ₺/m²</span>" +
      "<button type=\"button\" class=\"kenara-btn\" data-fiyat-sil=\"" + i + "\">Sil</button></div>";
  }).join("");
}

function fiyatFormKaydet() {
  var urunEl = document.getElementById("fiyat-urun");
  var kalEl = document.getElementById("fiyat-kal");
  var tlEl = document.getElementById("fiyat-tl");
  var kayit = fiyatKayitDuz({
    urun: urunEl ? urunEl.value : "",
    kal: parseInt(kalEl ? String(kalEl.value).replace(",", ".") : "", 10),
    tl: ondalikOku(tlEl ? tlEl.value : "")
  });
  if (!kayit) return;
  var ayni = -1;
  var urunK = kayit.urun.toLocaleLowerCase("tr");
  KALINLIK_FIYAT.forEach(function (p, i) {
    if (p.kal === kayit.kal && String(p.urun || "").toLocaleLowerCase("tr") === urunK) ayni = i;
  });
  if (ayni >= 0) KALINLIK_FIYAT[ayni] = kayit;
  else KALINLIK_FIYAT.push(kayit);
  fiyatKaydet();
  fiyatListeCiz();
  if (urunEl) urunEl.value = "";
  if (kalEl) kalEl.value = "";
  if (tlEl) tlEl.value = "";
  if (motorSonucAl()) cizMotorSonuc(motorSonucAl());
  else yazK3("toplam", havuzToplamTlYazi());
}

function fiyatSil(ix) {
  var i = Number(ix);
  if (!(i >= 0) || i >= KALINLIK_FIYAT.length) return;
  KALINLIK_FIYAT.splice(i, 1);
  fiyatKaydet();
  fiyatListeCiz();
  if (motorSonucAl()) cizMotorSonuc(motorSonucAl());
  else yazK3("toplam", havuzToplamTlYazi());
}

function stokM2(p) {
  return (Number(p.boy) * Number(p.en)) / 1000000;
}

function stokM2Tl(p) {
  var kal = p && Number(p.kalinlik) > 0 ? Number(p.kalinlik) : 0;
  var n = kalinlikFiyatAl(kal);
  if (n > 0) return n;
  var v = Number(p && p.m2Tl);
  return isFinite(v) && v > 0 ? v : 0;
}

function fmtTl(n) {
  if (n == null || !isFinite(n)) return "—";
  return fmtOndalik(n) + " TL";
}

function birimCarpan() {
  return BIRIM === "cm" ? 10 : 1;
}

function olcuGoster(mm) {
  var n = Number(mm);
  if (!isFinite(n)) return "—";
  return String(Math.round((n / birimCarpan()) * 100) / 100).replace(".", ",");
}

function mmOku(metin) {
  var temiz = String(metin === undefined || metin === null ? "" : metin).trim().replace(",", ".");
  if (temiz === "" || isNaN(Number(temiz))) return NaN;
  return Math.round(Number(temiz) * birimCarpan());
}

function birimYaz() {
  document.querySelectorAll("[data-birim-etiket]").forEach(function (el) {
    el.textContent = BIRIM;
  });
  document.querySelectorAll("[data-birim-sec]").forEach(function (b) {
    var secili = b.getAttribute("data-birim-sec") === BIRIM;
    b.classList.toggle("sec", secili);
    b.setAttribute("aria-pressed", secili ? "true" : "false");
  });
  cizListe();
  cizHavuz();
  if (motorSonucAl()) cizMotorSonuc(motorSonucAl());
}

function birimKaydet() {
  try {
    localStorage.setItem(BIRIM_ANAHTAR, BIRIM);
  } catch (e) { /* depolama kapaliysa oturum boyunca gecerli kalir */ }
}

function birimYukle() {
  try {
    var kayit = localStorage.getItem(BIRIM_ANAHTAR);
    if (kayit === "mm" || kayit === "cm") {
      BIRIM = kayit;
      return true;
    }
  } catch (e) { /* depolama kapali */ }
  return false;
}

function kimlikTemiz(metin, ust) {
  var n = ust || 80;
  return String(metin === undefined || metin === null ? "" : metin).trim().slice(0, n);
}

function kimlikOkuForm() {
  var a = document.getElementById("m-ad");
  var t = document.getElementById("m-telefon");
  var y = document.getElementById("m-yasal");
  return {
    ad: kimlikTemiz(a ? a.value : ""),
    telefon: kimlikTemiz(t ? t.value : "", 20),
    yasal: !!(y && y.checked)
  };
}

function kimlikFormTam(o) {
  return true;
}

function kimlikKilitYenile() {
  var btn = document.getElementById("btn-kimlik-ok");
  if (btn) btn.disabled = false;
}

function depoOku(anahtar) {
  try {
    return localStorage.getItem(anahtar);
  } catch (e) {
    return null;
  }
}

function kimlikKayitli() {
  return depoOku(ONAY_ANAHTAR) === "1";
}

function kimlikMetin(o) {
  var k = o || KIMLIK;
  return k.ad || "";
}

function kimlikListeYaz() {
  var ad = kimlikMetin();
  document.querySelectorAll(".k3-liste-baslik").forEach(function (el) {
    el.textContent = ad || "Kesilecek liste";
  });
  document.querySelectorAll(".k3-liste-alt").forEach(function (el) {
    el.hidden = !ad;
  });
}

function kimlikFormYaz() {
  var a = document.getElementById("m-ad");
  var t = document.getElementById("m-telefon");
  var y = document.getElementById("m-yasal");
  if (a) a.value = KIMLIK.ad;
  if (t) t.value = KIMLIK.telefon;
  if (y) y.checked = depoOku(ONAY_ANAHTAR) === "1";
  kimlikKilitYenile();
}

function kimlikDepoya(o) {
  KIMLIK = { ad: kimlikTemiz(o.ad), telefon: kimlikTemiz(o.telefon, 20) };
  try {
    localStorage.setItem(KIMLIK_ANAHTAR, KIMLIK.ad);
    localStorage.setItem(TELEFON_ANAHTAR, KIMLIK.telefon);
    if (o.yasal) localStorage.setItem(ONAY_ANAHTAR, "1");
  } catch (e) { /* depolama kapaliysa oturum boyunca gecerli kalir */ }
  kimlikListeYaz();
  cizListe();
}

function kimlikKaydet() {
  var o = kimlikOkuForm();
  o.yasal = true;
  kimlikDepoya(o);
  return true;
}

function kimlikEskiNesne(ham) {
  try {
    var o = JSON.parse(ham);
    if (!o || typeof o !== "object") return null;
    var parca = [];
    if (o.atolye) parca.push(kimlikTemiz(o.atolye));
    if (o.usta) parca.push(kimlikTemiz(o.usta));
    return {
      ad: parca.join(" · ") || kimlikTemiz(o.ad),
      telefon: kimlikTemiz(o.telefon, 20)
    };
  } catch (e) {
    return null;
  }
}

function kimlikYukle() {
  var ham = depoOku(KIMLIK_ANAHTAR);
  var tel = depoOku(TELEFON_ANAHTAR);
  var eski = ham ? kimlikEskiNesne(ham) : null;
  if (eski) {
    KIMLIK = {
      ad: eski.ad,
      telefon: tel !== null ? kimlikTemiz(tel, 20) : eski.telefon
    };
    kimlikDepoya(KIMLIK);
  } else {
    KIMLIK = {
      ad: kimlikTemiz(ham),
      telefon: kimlikTemiz(tel, 20)
    };
  }
  kimlikFormYaz();
  kimlikListeYaz();
}

function kimlikModalAc() {
  kimlikFormYaz();
  var p = document.getElementById("kimlik-perde");
  if (p) p.classList.add("acik");
}

function kimlikModalKapat() {
  var p = document.getElementById("kimlik-perde");
  if (p) p.classList.remove("acik");
  paylasBekleyen = "";
}

function k3OzetSatirlari() {
  return ustaOzetSatirlari();
}

var BANT_YAZI = {
  "boy-sol": "Boy sol",
  "boy-sag": "Boy sağ",
  "en-sol": "En sol",
  "en-sag": "En sağ"
};

function bantKenarYazi(bant) {
  var liste = Array.isArray(bant) ? bant : [];
  return liste.map(function (k) {
    return BANT_YAZI[k] || k;
  }).filter(Boolean).join(", ");
}

function levhaKaynakAd(s) {
  if (s && s.kaynak === "fire") return "fire";
  if (s && s.kaynak === "standart") return "standart";
  if (mod === "plaka") return "standart";
  var L = levhaAktif();
  if (L && s && k3StokSatirEslesir(s.panel_en, s.panel_boy, L.en, L.boy)) return "standart";
  return "fire";
}

function levhaKaynakSay(sonuc) {
  var fire = 0;
  var tam = 0;
  ((sonuc && sonuc.yerlesim) || []).forEach(function (s) {
    if (levhaKaynakAd(s) === "fire") fire += 1;
    else tam += 1;
  });
  return { fire: fire, tam: tam };
}

function levhaK3Yazi(sonuc, kalinlik) {
  var kal = kalinlik ? " · " + kalinlik + " mm" : "";
  var n = levhaKaynakSay(sonuc);
  if (mod !== "plaka") return (n.fire || 0) + " fire" + kal;
  if (!n.fire && !n.tam) return "0 levha" + kal;
  if (!n.fire) return (sonuc.levha_sayisi || n.tam) + " levha" + kal;
  var parca = [n.fire + " fire"];
  if (n.tam) parca.push(n.tam + " tam boy");
  return parca.join(" + ") + kal;
}

function yerlesimFireSayfa(sonuc) {
  return ((sonuc && sonuc.yerlesim) || []).filter(function (s) {
    return levhaKaynakAd(s) === "fire";
  });
}

function fireSigmayanSatir(sonuc) {
  if (mod === "plaka" || !sonuc) return [];
  var map = {};
  var sira = [];
  function ekle(etiket, boy, en) {
    var kaynak = parcaListeSatir(etiket);
    var b = kaynak ? kaynak.boy : boy;
    var e = kaynak ? kaynak.en : en;
    var anahtar = kaynak && kaynak.sira != null
      ? "s" + kaynak.sira
      : olcuCiftAnahtar(e, b);
    if (!map[anahtar]) {
      map[anahtar] = {
        boy: b,
        en: e,
        adet: 0,
        sira: kaynak && kaynak.sira != null ? kaynak.sira : 0,
        bant: kaynak && kaynak.bant ? kaynak.bant : []
      };
      sira.push(anahtar);
    }
    map[anahtar].adet += 1;
  }
  if (Array.isArray(sonuc.sigmayan) && sonuc.sigmayan.length) {
    sonuc.sigmayan.forEach(function (p, i) {
      var etiket = p.id || ("P" + (p.sira === undefined ? i + 1 : p.sira));
      ekle(etiket, p.boy, p.en);
    });
    return sira.map(function (k) { return map[k]; });
  }
  ((sonuc.yerlesim) || []).forEach(function (s) {
    if (levhaKaynakAd(s) !== "standart") return;
    (s.parcalar || []).forEach(function (p, i) {
      var etiket = p.id || ("P" + (p.sira === undefined ? i + 1 : p.sira));
      ekle(etiket, p.h, p.w);
    });
  });
  return sira.map(function (k) { return map[k]; });
}

function plakaHavuzSatir() {
  var n = M().plakaHavuz;
  if (!n || !n.kurtarir || !n.kurtarParca || !n.kurtarParca.length) return [];
  var map = {};
  var sira = [];
  n.kurtarParca.forEach(function (p, i) {
    var etiket = p.id || ("P" + (i + 1));
    var kaynak = parcaListeSatir(etiket);
    var b = kaynak ? kaynak.boy : (p.h || p.boy);
    var e = kaynak ? kaynak.en : (p.w || p.en);
    var anahtar = kaynak && kaynak.sira != null
      ? "s" + kaynak.sira
      : olcuCiftAnahtar(e, b);
    if (!map[anahtar]) {
      map[anahtar] = {
        boy: b,
        en: e,
        adet: 0,
        sira: kaynak && kaynak.sira != null ? kaynak.sira : 0,
        bant: kaynak && kaynak.bant ? kaynak.bant : []
      };
      sira.push(anahtar);
    }
    map[anahtar].adet += 1;
  });
  return sira.map(function (k) { return map[k]; });
}

function plakaHavuzYazi() {
  var kutu = q3(".fire-sigmayan");
  var liste = q3(".fire-sigmayan-liste");
  var btn = q3(".btn-sigmayan");
  var kok = k3Kok();
  if (!kutu || !liste || mod !== "plaka") return;
  var satir = plakaHavuzSatir();
  var varMi = !!satir.length;
  if (btn) btn.hidden = !varMi;
  if (!varMi && kok) kok.classList.remove("k3-perde-sigmayan");
  liste.innerHTML = varMi
    ? "<table><thead><tr><th class=\"sira-bas\">Sıra/No</th><th>Boy " + BIRIM +
      "</th><th>En " + BIRIM + "</th><th>Adet</th><th>Bant</th></tr></thead><tbody>" +
      satir.map(function (s) {
        return satirHtml({
          sira: s.sira || "—",
          boy: s.boy,
          en: s.en,
          adet: s.adet,
          bant: s.bant || []
        }, false, null);
      }).join("") +
      "</tbody></table>"
    : "";
}

function fireSigmayanYazi(sonuc) {
  var kutu = q3(".fire-sigmayan");
  var liste = q3(".fire-sigmayan-liste");
  var btn = q3(".btn-sigmayan");
  var kok = k3Kok();
  if (!kutu || !liste) return;
  if (mod === "plaka") {
    plakaHavuzYazi();
    return;
  }
  if (!sonuc) {
    if (btn) btn.hidden = true;
    if (kok) kok.classList.remove("k3-perde-sigmayan");
    liste.innerHTML = "";
    return;
  }
  var satir = fireSigmayanSatir(sonuc);
  var varMi = !!satir.length;
  if (btn) btn.hidden = !varMi;
  if (!varMi && kok) kok.classList.remove("k3-perde-sigmayan");
  liste.innerHTML = varMi
    ? "<table><thead><tr><th class=\"sira-bas\">Sıra/No</th><th>Boy " + BIRIM +
      "</th><th>En " + BIRIM + "</th><th>Adet</th><th>Bant</th></tr></thead><tbody>" +
      satir.map(function (s) {
        return satirHtml({
          sira: s.sira || "—",
          boy: s.boy,
          en: s.en,
          adet: s.adet,
          bant: s.bant || []
        }, false, null);
      }).join("") +
      "</tbody></table>"
    : "";
}

function ustaOzetSatirlari() {
  var satir = [];
  var sonuc = motorSonucAl();
  var ozet = motorGirdiOzetAl();
  if (!sonuc) {
    satir.push("Hesap yok. Önce Hesapla.");
    return satir;
  }
  var n = levhaKaynakSay(sonuc);
  var L = levhaAktif();
  if (mod === "plaka") {
    satir.push("Fire levha: " + n.fire + " adet");
    var havuzNot = M().plakaHavuz;
    if (havuzNot && havuzNot.kurtarAdet) {
      satir.push("Havuza gitti: " + havuzNot.kurtarAdet + " parça");
    }
    if (n.tam) {
      satir.push(
        "Tam boy: " + n.tam + " adet" +
        (L && L.en > 0 && L.boy > 0
          ? " · " + olcuGoster(L.en) + "×" + olcuGoster(L.boy) + " " + BIRIM
          : "")
      );
    } else {
      satir.push("Tam boy: yok");
    }
  } else {
    satir.push("Fire levha: " + n.fire + " adet");
    var sigmayan = fireSigmayanSatir(sonuc);
    if (sigmayan.length) {
      satir.push("Sığmayan:");
      sigmayan.forEach(function (s) {
        satir.push(
          "· " + olcuGoster(s.boy) + "×" + olcuGoster(s.en) + " · " + s.adet + " adet"
        );
      });
    } else {
      satir.push("Sığmayan: yok");
    }
  }
  var yerlesen = 0;
  var sayfalar = mod === "plaka" ? (sonuc.yerlesim || []) : yerlesimFireSayfa(sonuc);
  sayfalar.forEach(function (s) {
    yerlesen += (s.parcalar || []).length;
  });
  satir.push("Yerleşen parça: " + yerlesen + " adet");
  var kesilen = sonuc.kullanilan_alan_mm2 || 0;
  if (mod !== "plaka") {
    kesilen = 0;
    sayfalar.forEach(function (s) {
      (s.parcalar || []).forEach(function (p) {
        kesilen += (Number(p.w) || 0) * (Number(p.h) || 0);
      });
    });
  }
  satir.push("Kesilen alan: " + fmtOndalik(kesilen / 1000000) + " m²");
  var bantM = bantMetraj() / 1000;
  if (bantM > 0) satir.push("Bant: " + fmtOndalik(bantM) + " m");
  var fireM2 = (sonuc.net_fire_mm2 || 0) / 1000000;
  var yuzde = typeof sonuc.fire_yuzde === "number" ? Math.round(sonuc.fire_yuzde) : 0;
  satir.push("Kalan (net fire): " + fmtOndalik(fireM2) + " m² (%" + yuzde + ")");
  var havuz = k3FireGittiOzetDeger(sonuc);
  if (havuz && havuz !== "0,00 m²") satir.push("Havuzdan kesilen: " + havuz);
  if (mod !== "plaka") {
    var tl = havuzToplamTlYazi();
    if (tl && tl !== "—") satir.push("Fire tutarı: " + tl);
  }
  if (ozet) {
    satir.push(ozet.damar_kilidi
      ? "Su yönü kilitli — döndürme yok."
      : "Su yönü serbest — parça dönebilir.");
  }
  return satir;
}

function ciktiPaket() {
  var m = M().musteri || musteriBos();
  var isZaman = m.zaman || Date.now();
  var satir = [];
  satir.push(mod === "plaka" ? "Plaka ebatlama" : "Fire ebatlama");
  satir.push("Tarih: " + zamanYazi(isZaman));
  if (KIMLIK.ad) satir.push("Atölye: " + KIMLIK.ad);
  if (KIMLIK.telefon) satir.push("Atölye tel: " + KIMLIK.telefon);
  if (m.ad) satir.push("İş / müşteri: " + m.ad);
  if (m.telefon) satir.push("Müşteri tel: " + m.telefon);
  if (m.adres) satir.push("Adres: " + m.adres);
  satir.push("");
  satir.push("Kesilecek parçalar");
  ihtiyac().forEach(function (p) {
    var satirP =
      p.sira + ") " + olcuGoster(p.boy) + " × " + olcuGoster(p.en) + " " + BIRIM +
      " — " + p.adet + " adet";
    var bant = bantKenarYazi(p.bant);
    if (bant) satirP += " | Bant: " + bant;
    satir.push(satirP);
  });
  if (!ihtiyac().length) satir.push("(Liste boş)");
  satir.push("");
  satir.push("Özet");
  var ozetSatir = ustaOzetSatirlari();
  ozetSatir.forEach(function (s) {
    satir.push(s);
  });
  satir.push("");
  satir.push("Ölçüler rehberdir. Kesmeden önce usta teyit eder.");
  return {
    surum: 1,
    zaman: Date.now(),
    is_zaman: isZaman,
    modul: mod === "plaka" ? "plaka" : "fire",
    kimlik: KIMLIK.ad || "",
    telefon: KIMLIK.telefon || "",
    musteri: m.ad || "",
    musteri_telefon: m.telefon || "",
    musteri_adres: m.adres || "",
    ozet: ozetSatir,
    yasal: YASAL_CUMLE,
    parcalar: ihtiyac().map(function (p) {
      return {
        sira: p.sira,
        boy: p.boy,
        en: p.en,
        adet: p.adet,
        bant: (p.bant || []).slice()
      };
    }),
    metin: satir.join("\n")
  };
}

function kasasiKanca(paket, kanal) {
  /* Atolye Kasasi / harici kopru sonra bu paketi alir. Simdi aktarim yok. */
}

function telefonWa() {
  var d = String(KIMLIK.telefon || "").replace(/\D/g, "");
  if (d.length === 11 && d.charAt(0) === "0") d = "90" + d.slice(1);
  else if (d.length === 10) d = "90" + d;
  return d.length >= 11 ? d : "";
}

function kanalWhatsapp(paket, metin) {
  var t = encodeURIComponent(metin || (paket && paket.metin) || "");
  var no = telefonWa();
  var url = no
    ? "https://wa.me/" + no + "?text=" + t
    : "https://wa.me/?text=" + t;
  window.open(url, "_blank");
}

function dosyaIndir(blob, ad) {
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = ad;
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 800);
}

function metinU8(s) {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(String(s));
  var u = unescape(encodeURIComponent(String(s)));
  var a = new Uint8Array(u.length);
  var i;
  for (i = 0; i < u.length; i++) a[i] = u.charCodeAt(i);
  return a;
}

var CRC_TAB = null;
function crc32(u8) {
  var n;
  var k;
  var c;
  if (!CRC_TAB) {
    CRC_TAB = new Uint32Array(256);
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      CRC_TAB[n] = c >>> 0;
    }
  }
  c = 0xFFFFFFFF;
  for (n = 0; n < u8.length; n++) c = CRC_TAB[(c ^ u8[n]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function zipU16(n) { return [n & 255, (n >>> 8) & 255]; }
function zipU32(n) {
  return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
}

function zipStore(dosyalar) {
  var yerel = [];
  var merkez = [];
  var offset = 0;
  dosyalar.forEach(function (d) {
    var ad = metinU8(d.ad);
    var data = d.u8;
    var crc = crc32(data);
    var bas = [0x50, 0x4b, 0x03, 0x04].concat(
      zipU16(20), zipU16(0), zipU16(0), zipU16(0), zipU16(0),
      zipU32(crc), zipU32(data.length), zipU32(data.length),
      zipU16(ad.length), zipU16(0)
    );
    yerel.push(bas, ad, data);
    var dir = [0x50, 0x4b, 0x01, 0x02].concat(
      zipU16(20), zipU16(20), zipU16(0), zipU16(0), zipU16(0), zipU16(0),
      zipU32(crc), zipU32(data.length), zipU32(data.length),
      zipU16(ad.length), zipU16(0), zipU16(0), zipU16(0), zipU16(0),
      zipU32(0), zipU32(offset)
    );
    merkez.push(dir, ad);
    offset += bas.length + ad.length + data.length;
  });
  var merkezBoy = 0;
  merkez.forEach(function (p) { merkezBoy += p.length; });
  var eocd = [0x50, 0x4b, 0x05, 0x06].concat(
    zipU16(0), zipU16(0), zipU16(dosyalar.length), zipU16(dosyalar.length),
    zipU32(merkezBoy), zipU32(offset), zipU16(0)
  );
  var parca = yerel.concat(merkez, [eocd]);
  var toplam = 0;
  parca.forEach(function (p) { toplam += p.length; });
  var out = new Uint8Array(toplam);
  var i = 0;
  parca.forEach(function (p) {
    out.set(p instanceof Uint8Array ? p : new Uint8Array(p), i);
    i += p.length;
  });
  return new Blob([out], { type: "application/zip" });
}

function kanalTxt(paket) {
  dosyaIndir(new Blob([paket.metin], { type: "text/plain;charset=utf-8" }), "kesim-listesi.txt");
}

function pdfLatin(s) {
  return String(s)
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/×/g, "x")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function kanalPdf(paket) {
  var satir = paket.metin.split("\n");
  var y = 800;
  var akis = "";
  satir.forEach(function (s) {
    akis += "BT /F1 11 Tf 48 " + y + " Td (" + pdfLatin(s) + ") Tj ET\n";
    y -= 16;
  });
  var stream = akis;
  var objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    "<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  var pdf = "%PDF-1.4\n";
  var xref = [0];
  objects.forEach(function (govde, i) {
    xref.push(pdf.length);
    pdf += (i + 1) + " 0 obj\n" + govde + "\nendobj\n";
  });
  var start = pdf.length;
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  xref.slice(1).forEach(function (off) {
    pdf += ("0000000000" + off).slice(-10) + " 00000 n \n";
  });
  pdf += "trailer << /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + start + "\n%%EOF";
  dosyaIndir(new Blob([pdf], { type: "application/pdf" }), "kesim-listesi.pdf");
}

function tuvalBlob(c) {
  return new Promise(function (ok) {
    if (c.toBlob) {
      c.toBlob(function (b) { ok(b || null); }, "image/png");
      return;
    }
    ok(dataUrlBlob(c.toDataURL("image/png")));
  });
}

function ciktiLevhaSayfalar() {
  var sonuc = motorSonucAl();
  if (!sonuc) return [];
  return mod === "plaka" ? (sonuc.yerlesim || []) : yerlesimFireSayfa(sonuc);
}

function levhaPngBlob(no, paket) {
  var sonuc = motorSonucAl();
  if (!sonuc) return Promise.resolve(null);
  var sayfa = sayfaBul(sonuc, no);
  if (!sayfa) {
    ciktiLevhaSayfalar().forEach(function (s) {
      if (Number(s.levha) === Number(no)) sayfa = s;
    });
  }
  if (!sayfa) return Promise.resolve(null);
  var pe = Number(sayfa.panel_en) || 1;
  var pb = Number(sayfa.panel_boy) || 1;
  var maxKenar = 480;
  var olcek = Math.min(maxKenar / pe, maxKenar / pb);
  var w = Math.max(1, Math.round(pe * olcek));
  var h = Math.max(1, Math.round(pb * olcek));
  var serit = 40 + 12 * Math.max(1, ((paket && paket.ozet) || []).length + 1);
  var c = document.createElement("canvas");
  c.width = w;
  c.height = h + serit;
  var ctx = c.getContext("2d", { alpha: false });
  if (!ctx) return Promise.resolve(null);
  ctx.fillStyle = "#d4cfc4";
  ctx.fillRect(0, 0, w, h);
  (sonuc.fire_envanteri || []).forEach(function (f) {
    if (Number(f.levha) !== Number(no)) return;
    ctx.fillStyle = "#ebe6da";
    ctx.fillRect(
      Math.round(f.x * olcek),
      Math.round(f.y * olcek),
      Math.max(1, Math.round(f.en * olcek)),
      Math.max(1, Math.round(f.boy * olcek))
    );
  });
  (sayfa.parcalar || []).forEach(function (p, i) {
    ctx.fillStyle = PARCA_RENK[i % PARCA_RENK.length];
    ctx.fillRect(
      Math.round(p.x * olcek),
      Math.round(p.y * olcek),
      Math.max(1, Math.round(p.w * olcek)),
      Math.max(1, Math.round(p.h * olcek))
    );
  });
  ctx.strokeStyle = "#2a2a24";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  ctx.fillStyle = "#1c1c18";
  ctx.fillRect(0, h, w, serit);
  var p = paket || {};
  var ust = [];
  if (p.musteri) ust.push(p.musteri);
  if (p.musteri_telefon) ust.push(p.musteri_telefon);
  ust.push(zamanYazi(p.is_zaman));
  if (p.musteri_adres) ust.push(p.musteri_adres);
  ctx.fillStyle = "#e8e4d9";
  ctx.font = "10px sans-serif";
  ctx.textBaseline = "top";
  var y0 = h + 6;
  var bas = ust.join(" · ");
  if (bas.length > 78) bas = bas.slice(0, 76) + "…";
  ctx.fillText(bas, 6, y0, w - 12);
  y0 += 14;
  (p.ozet || []).forEach(function (s) {
    ctx.fillText(s, 6, y0, w - 12);
    y0 += 12;
  });
  return tuvalBlob(c);
}

function kanalGorsel(paket) {
  var sonuc = motorSonucAl();
  if (!sonuc) return;
  var no = sayfaNoAl();
  var sayfa = sayfaBul(sonuc, no);
  if (!sayfa) {
    var yer = ciktiLevhaSayfalar();
    if (!yer.length) return;
    sayfa = yer[0];
    no = sayfa.levha;
  }
  levhaPngBlob(no, paket).then(function (blob) {
    if (blob) dosyaIndir(blob, "kesim-sema.png");
  });
}

function dataUrlBlob(url) {
  var parca = url.split(",");
  var bin = atob(parca[1] || "");
  var n = bin.length;
  var u8 = new Uint8Array(n);
  var i;
  for (i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: "image/png" });
}

var CIKTI_KANALLAR = {
  whatsapp: kanalWhatsapp,
  txt: kanalTxt,
  pdf: kanalPdf,
  gorsel: kanalGorsel
};

function ciktiSigmayanMetin() {
  var satir = fireSigmayanSatir(motorSonucAl());
  if (!satir.length) return "";
  var s = ["Sığmayan liste", ""];
  satir.forEach(function (p) {
    s.push(
      (p.sira || "—") + ") " + olcuGoster(p.boy) + " × " + olcuGoster(p.en) + " " +
      BIRIM + " — " + p.adet + " adet"
    );
  });
  return s.join("\n");
}

function ciktiKalemHtml(id, yazi, levha) {
  var ek = levha != null ? " data-levha=\"" + levha + "\"" : "";
  return (
    "<label class=\"cikti-kalem\"><input type=\"checkbox\" checked data-cikti-kalem=\"" +
    id + "\"" + ek + "> " + yazi + "</label>"
  );
}

function ciktiSecimYaz() {
  var kutu = document.getElementById("cikti-secim-liste");
  var btn = document.getElementById("btn-cikti-secim-ok");
  var bas = document.getElementById("cikti-secim-baslik");
  if (bas) {
    bas.textContent = paylasBekleyen === "whatsapp" ? "WhatsApp’a ne gitsin?" : "Cihaza ne insin?";
  }
  if (btn) btn.textContent = paylasBekleyen === "whatsapp" ? "WhatsApp’a gönder" : "Cihaza indir";
  if (!kutu) return;
  var html = ciktiKalemHtml("tumu", "Tümü");
  html += ciktiKalemHtml("liste", "Liste");
  if (fireSigmayanSatir(motorSonucAl()).length) {
    html += ciktiKalemHtml("sigmayan", "Sığmayan liste");
  }
  if (paylasBekleyen !== "whatsapp") {
    ciktiLevhaSayfalar().forEach(function (s, i) {
      var no = s.levha != null ? s.levha : i + 1;
      var ad = "L" + no;
      if (s.panel_en && s.panel_boy) {
        ad += " · " + olcuGoster(s.panel_en) + "×" + olcuGoster(s.panel_boy);
      }
      html += ciktiKalemHtml("levha", ad, no);
    });
  }
  kutu.innerHTML = html;
}

function ciktiSecimKutular() {
  var kutu = document.getElementById("cikti-secim-liste");
  return kutu ? kutu.querySelectorAll("input[data-cikti-kalem]") : [];
}

function ciktiTumuAyarla() {
  var tumu = document.querySelector("#cikti-secim-liste input[data-cikti-kalem=\"tumu\"]");
  if (!tumu) return;
  var diger = [];
  ciktiSecimKutular().forEach(function (el) {
    if (el.getAttribute("data-cikti-kalem") !== "tumu") diger.push(el);
  });
  tumu.checked = !!(diger.length && diger.every(function (el) { return el.checked; }));
}

function ciktiSecilen() {
  var liste = false;
  var sigmayan = false;
  var levhalar = [];
  ciktiSecimKutular().forEach(function (el) {
    if (!el.checked) return;
    var k = el.getAttribute("data-cikti-kalem");
    if (k === "liste") liste = true;
    if (k === "sigmayan") sigmayan = true;
    if (k === "levha") levhalar.push(Number(el.getAttribute("data-levha")));
  });
  return { liste: liste, sigmayan: sigmayan, levhalar: levhalar };
}

function blobU8(blob) {
  if (blob.arrayBuffer) {
    return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  return new Promise(function (ok, no) {
    var r = new FileReader();
    r.onload = function () { ok(new Uint8Array(r.result)); };
    r.onerror = no;
    r.readAsArrayBuffer(blob);
  });
}

function ciktiZipKur(paket, sec) {
  var isler = [];
  if (sec.liste) {
    isler.push(Promise.resolve({ ad: "liste.txt", u8: metinU8(paket.metin) }));
  }
  if (sec.sigmayan) {
    var sm = ciktiSigmayanMetin();
    if (sm) isler.push(Promise.resolve({ ad: "sigmayan.txt", u8: metinU8(sm) }));
  }
  sec.levhalar.forEach(function (no) {
    isler.push(
      levhaPngBlob(no, paket).then(function (blob) {
        if (!blob) return null;
        return blobU8(blob).then(function (u8) {
          return { ad: "L" + no + ".png", u8: u8 };
        });
      })
    );
  });
  if (!isler.length) return Promise.resolve(null);
  return Promise.all(isler).then(function (liste) {
    var dosya = liste.filter(Boolean);
    if (!dosya.length) return null;
    return zipStore(dosya);
  });
}

function kanalZipGonder(blob) {
  dosyaIndir(blob, "kesim-paketi.zip");
}

function ciktiWaMetin(paket, sec) {
  var blok = [];
  if (sec.liste) blok.push(paket.metin);
  if (sec.sigmayan) {
    var sm = ciktiSigmayanMetin();
    if (sm) blok.push(sm);
  }
  return blok.join("\n\n");
}

function ciktiGonder(kanal) {
  var paket = ciktiPaket();
  var sec = ciktiSecilen();
  if (kanal === "whatsapp") {
    var metin = ciktiWaMetin(paket, sec);
    if (!metin) {
      karaKutuYaz("cikti_bos", { kanal: "whatsapp" });
      return;
    }
    kasasiKanca(paket, kanal);
    kanalWhatsapp(paket, metin);
    karaKutuYaz("cikti", {
      kanal: "whatsapp",
      liste: !!sec.liste,
      sigmayan: !!sec.sigmayan,
      levha: 0
    });
    return;
  }
  if (!sec.liste && !sec.sigmayan && !sec.levhalar.length) {
    karaKutuYaz("cikti_bos", { kanal: kanal || "" });
    return;
  }
  ciktiZipKur(paket, sec).then(function (blob) {
    if (!blob) return;
    kasasiKanca(paket, kanal);
    kanalZipGonder(blob);
    karaKutuYaz("cikti", {
      kanal: kanal || "",
      liste: !!sec.liste,
      sigmayan: !!sec.sigmayan,
      levha: sec.levhalar.length
    });
  });
}

function paylasYap() {
  var tur = paylasBekleyen;
  kimlikListeYaz();
  ciktiGonder(tur);
  paylasBekleyen = "";
  var k = document.getElementById("kimlik-perde");
  if (k) k.classList.remove("acik");
  var c = document.getElementById("cikti-perde");
  if (c) c.classList.remove("acik");
}

function ciktiAdimYaz(ad) {
  var p = document.getElementById("cikti-perde");
  if (!p) return;
  p.classList.toggle("cikti-tam", ad === "secim");
  p.querySelectorAll(".cikti-adim").forEach(function (el) {
    el.hidden = el.getAttribute("data-cikti-adim") !== ad;
  });
}

function ciktiOkKilit() {
  var btn = document.getElementById("btn-cikti-ok");
  if (!btn) return;
  musteriKaydetKart();
  btn.disabled = false;
}

function ciktiMenuAc() {
  paylasBekleyen = "";
  ciktiAdimYaz("menu");
  var p = document.getElementById("cikti-perde");
  if (p) p.classList.add("acik");
}

function ciktiPerdeKapat() {
  var p = document.getElementById("cikti-perde");
  if (p) p.classList.remove("acik");
  paylasBekleyen = "";
  ciktiAdimYaz("menu");
}

function ciktiKanalSec(tur) {
  paylasBekleyen = tur;
  ciktiSecimYaz();
  ciktiAdimYaz("secim");
}

function ciktiFormGonder() {
  var sec = ciktiSecilen();
  if (!sec.liste && !sec.sigmayan && !sec.levhalar.length) return;
  if (kimlikKayitli()) {
    paylasYap();
    return;
  }
  var c = document.getElementById("cikti-perde");
  if (c) c.classList.remove("acik");
  kimlikModalAc();
}

function levhaDogrula(o) {
  if (!o || typeof o !== "object") return null;
  var en = Math.round(Number(o.en));
  var boy = Math.round(Number(o.boy));
  var kal = parseInt(o.kalinlik, 10);
  if (!(en > 0) || !(boy > 0) || !(kal > 0)) return null;
  return {
    en: en,
    boy: boy,
    kalinlik: kal,
    damarKilidi: !!o.damarKilidi
  };
}

function levhaAktif() {
  return M().levha;
}

function levhaAktifElle() {
  return M().levhaElle;
}

function levhaAktifYaz(o, elle) {
  M().levha = o;
  if (elle) M().levhaElle = true;
}

function levhaDepoya() {
  try {
    localStorage.setItem(LEVHA_FIRE_ANAHTAR, JSON.stringify(FIRE.levha));
    localStorage.setItem(LEVHA_PLAKA_ANAHTAR, JSON.stringify(PLAKA.levha));
  } catch (e) { /* depolama kapaliysa oturum boyunca gecerli kalir */ }
}

function levhaYukleAnahtar(anahtar) {
  try {
    var ham = localStorage.getItem(anahtar);
    if (!ham) return null;
    return levhaDogrula(JSON.parse(ham));
  } catch (e) {
    return null;
  }
}

function levhaYukle() {
  var fire = levhaYukleAnahtar(LEVHA_FIRE_ANAHTAR);
  var plaka = levhaYukleAnahtar(LEVHA_PLAKA_ANAHTAR);
  if (fire) {
    FIRE.levha = fire;
    FIRE.levhaElle = true;
  }
  if (plaka) {
    PLAKA.levha = plaka;
    PLAKA.levhaElle = true;
  }
}

function ihtiyacKayit(p) {
  if (!p) return null;
  var boy = Math.round(Number(p.boy));
  var en = Math.round(Number(p.en));
  var adet = parseInt(p.adet, 10);
  if (!(boy > 0) || !(en > 0) || !(adet > 0)) return null;
  var bant = [];
  (p.bant || []).forEach(function (k) {
    if (typeof k === "string") bant.push(k);
  });
  var sira = parseInt(p.sira, 10);
  return {
    sira: sira > 0 ? sira : 1,
    boy: boy,
    en: en,
    adet: adet,
    bant: bant,
    bantMm: Number(p.bantMm) > 0 ? Math.round(Number(p.bantMm) * 100) / 100 : 0,
    damarIptal: !!p.damarIptal,
    damarAcik: !!p.damarAcik
  };
}

function stokKayit(p) {
  if (!p) return null;
  var boy = Math.round(Number(p.boy));
  var en = Math.round(Number(p.en));
  var adet = parseInt(p.adet, 10);
  if (!(boy > 0) || !(en > 0) || !(adet > 0)) return null;
  var m2Tl = Number(p.m2Tl);
  var kal = parseInt(p.kalinlik, 10);
  return {
    boy: boy,
    en: en,
    adet: adet,
    m2Tl: isFinite(m2Tl) && m2Tl > 0 ? m2Tl : 0,
    kalinlik: kal > 0 ? kal : 0
  };
}

function listeDogrula(arr, fn) {
  var cikis = [];
  if (!Array.isArray(arr)) return cikis;
  arr.forEach(function (p) {
    var o = fn(p);
    if (o) cikis.push(o);
  });
  return cikis;
}

function modulVeriKaydet() {
  try {
    localStorage.setItem(FIRE_VERI_ANAHTAR, JSON.stringify({
      ihtiyac: FIRE.ihtiyac,
      havuz: FIRE.havuz,
      kenara: FIRE.kenara,
      deneme: !!denemeAcik,
      bantMm: FIRE.bantMm,
      kalinlikMm: FIRE.kalinlikMm
    }));
    localStorage.setItem(PLAKA_VERI_ANAHTAR, JSON.stringify({
      ihtiyac: PLAKA.ihtiyac,
      bantMm: PLAKA.bantMm
    }));
  } catch (e) { /* depolama kapali */ }
}

function jsonOku(anahtar) {
  try {
    var ham = localStorage.getItem(anahtar);
    if (!ham) return null;
    var o = JSON.parse(ham);
    return o && typeof o === "object" ? o : null;
  } catch (e) {
    return null;
  }
}

function modulVeriYukle() {
  var fire = jsonOku(FIRE_VERI_ANAHTAR);
  if (fire) {
    FIRE.ihtiyac = listeDogrula(fire.ihtiyac, ihtiyacKayit);
    FIRE.havuz = listeDogrula(fire.havuz, stokKayit);
    FIRE.kenara = listeDogrula(fire.kenara, stokKayit);
    denemeAcik = !!fire.deneme;
    if (Number(fire.bantMm) > 0) FIRE.bantMm = Number(fire.bantMm);
    if (Number(fire.kalinlikMm) > 0) FIRE.kalinlikMm = Number(fire.kalinlikMm);
    var eskiFiyat = fiyatHaritaOku(fire.kalinlikFiyat);
    if (!KALINLIK_FIYAT.length && eskiFiyat.length) {
      KALINLIK_FIYAT = eskiFiyat;
      fiyatKaydet();
    }
  }
  var plaka = jsonOku(PLAKA_VERI_ANAHTAR);
  if (plaka) {
    PLAKA.ihtiyac = listeDogrula(plaka.ihtiyac, ihtiyacKayit);
    if (Number(plaka.bantMm) > 0) PLAKA.bantMm = Number(plaka.bantMm);
  }
}

function denemeYaz() {
  var sil = document.getElementById("btn-deneme-sil");
  if (sil) sil.hidden = !denemeAcik;
}

function denemeYukle() {
  FIRE.ihtiyac = DENEME_IHTIYAC.map(function (p) {
    return {
      sira: p.sira,
      boy: p.boy,
      en: p.en,
      adet: p.adet,
      bant: (p.bant || []).slice()
    };
  });
  FIRE.havuz = DENEME_HAVUZ.map(function (p) {
    return { boy: p.boy, en: p.en, adet: p.adet, m2Tl: stokM2Tl(p), kalinlik: p.kalinlik || 18 };
  });
  FIRE.kenara = [];
  denemeAcik = true;
  denemeYaz();
  cizListe();
  cizHavuz();
  motorBayat();
}

function denemeTemizle() {
  FIRE.ihtiyac = [];
  FIRE.havuz = [];
  FIRE.kenara = [];
  denemeAcik = false;
  denemeYaz();
  cizListe();
  cizHavuz();
  motorBayat();
}

function atolyePerde() {
  return document.getElementById("atolye-perde");
}

function atolyeSayfa(id) {
  var p = atolyePerde();
  if (!p) return;
  if (id !== "bildir") bildirKayitBitir();
  p.querySelectorAll("[data-ayar-sayfa]").forEach(function (el) {
    el.hidden = el.getAttribute("data-ayar-sayfa") !== id;
  });
  if (id === "fiyat") fiyatListeCiz();
  if (id === "birim") birimYaz();
  if (id === "bildir") {
    bildirYazi();
    if (bildirGuvenli()) bildirMikrofonIste();
  }
}

function birimAc() {
  atolyeSayfa("menu");
  var p = atolyePerde();
  if (p) p.classList.add("acik");
}

function birimKapat() {
  bildirTemiz();
  var p = atolyePerde();
  if (p) p.classList.remove("acik");
  atolyeSayfa("menu");
}

var BILDIR_MAX_SN = 90;
var bildirDurum = {
  kayit: false,
  sn: 0,
  sayac: 0,
  sr: null,
  metinTaban: "",
  sonHata: ""
};

function bildirSrMotor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function bildirGuvenli() {
  return window.isSecureContext === true;
}

function bildirMikrofonIste(sonra) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (sonra) sonra(false);
    return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    stream.getTracks().forEach(function (t) { t.stop(); });
    if (sonra) sonra(true);
  }).catch(function () {
    if (sonra) sonra(false);
  });
}

function bildirSureYazi(sn) {
  var n = Math.max(0, Math.floor(sn || 0));
  var d = Math.floor(n / 60);
  var s = n % 60;
  return d + ":" + (s < 10 ? "0" : "") + s;
}

function bildirUyari(yazi) {
  var el = document.getElementById("bildir-uyari");
  if (!el) return;
  if (!yazi) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = yazi;
}

function bildirYazi() {
  var mic = document.getElementById("btn-bildir-mic");
  var sure = document.getElementById("bildir-sure");
  var durum = document.getElementById("bildir-durum");
  if (sure) sure.textContent = bildirSureYazi(bildirDurum.sn);
  if (mic) {
    mic.classList.toggle("kayit", !!bildirDurum.kayit);
    mic.setAttribute("aria-pressed", bildirDurum.kayit ? "true" : "false");
    mic.textContent = bildirDurum.kayit ? "Durdur" : "Konuş";
  }
  if (durum) durum.textContent = bildirDurum.kayit ? "Dinliyorum…" : "Yaz veya konuş";
}

function bildirSrDurdur() {
  if (!bildirDurum.sr) return;
  try {
    bildirDurum.sr.onresult = null;
    bildirDurum.sr.onerror = null;
    bildirDurum.sr.onend = null;
    bildirDurum.sr.stop();
  } catch (e) {}
  bildirDurum.sr = null;
}

function bildirMetinKoy(taban, canli) {
  var ta = document.getElementById("bildir-metin");
  if (!ta) return;
  var a = (taban || "").trim();
  var b = (canli || "").trim();
  ta.value = a && b ? a + " " + b : (a || b);
}

function bildirSonucSec(satir) {
  var best = satir[0];
  var i;
  for (i = 1; i < satir.length; i++) {
    if ((satir[i].confidence || 0) > (best.confidence || 0)) best = satir[i];
  }
  return (best && best.transcript) || "";
}

function bildirSrAc() {
  var SR = bildirSrMotor();
  if (!SR) return false;
  var ta = document.getElementById("bildir-metin");
  bildirDurum.metinTaban = ((ta && ta.value) || "").trim();
  var sr = new SR();
  sr.lang = "tr-TR";
  sr.continuous = true;
  sr.interimResults = true;
  sr.maxAlternatives = 3;
  sr.onresult = function (ev) {
    bildirDurum.sonHata = "";
    bildirUyari("");
    var i;
    var kesin = "";
    var taslak = "";
    for (i = 0; i < ev.results.length; i++) {
      var parca = bildirSonucSec(ev.results[i]);
      if (ev.results[i].isFinal) kesin += parca;
      else taslak += parca;
    }
    bildirMetinKoy(bildirDurum.metinTaban, (kesin + " " + taslak).trim());
  };
  sr.onerror = function (ev) {
    var kod = ev && ev.error;
    bildirDurum.sonHata = kod || "";
    if (kod === "not-allowed") {
      bildirDurum.kayit = false;
      bildirSrDurdur();
      bildirUyari("Mikrofon izni lazım. Yazman da olur.");
      bildirYazi();
    }
  };
  sr.onend = function () {
    if (!bildirDurum.kayit) return;
    if (bildirDurum.sonHata === "network" || bildirDurum.sonHata === "service-not-allowed") {
      bildirDurum.kayit = false;
      bildirSrDurdur();
      bildirYazi();
      return;
    }
    try { sr.start(); } catch (e2) {
      bildirKayitBitir();
    }
  };
  try { sr.start(); } catch (e3) { return false; }
  bildirDurum.sr = sr;
  return true;
}

function bildirKayitBitir() {
  if (bildirDurum.sayac) {
    clearInterval(bildirDurum.sayac);
    bildirDurum.sayac = 0;
  }
  bildirDurum.kayit = false;
  bildirSrDurdur();
  bildirYazi();
}

function bildirTemiz() {
  bildirKayitBitir();
  bildirDurum.sn = 0;
  var ta = document.getElementById("bildir-metin");
  if (ta) ta.value = "";
  bildirUyari("");
  bildirYazi();
}

function bildirKayitAc() {
  bildirUyari("");
  if (bildirDurum.kayit) {
    bildirKayitBitir();
    return;
  }
  if (!bildirGuvenli()) {
    bildirUyari("Telefonda mikrofon izni çıkmaz: adres http. Chrome yalnızca https veya bu PC’de 127.0.0.1 ister. Şimdilik yaz.");
    return;
  }
  if (!bildirSrMotor()) {
    bildirUyari("Bu telefonda konuşma yazıya dönmez. Yazman yeter.");
    return;
  }
  bildirKayitBitir();
  bildirMikrofonIste(function (ok) {
    if (!ok) {
      bildirUyari("Mikrofon izni lazım. Chrome’da İzin Ver’e bas.");
      return;
    }
    bildirDurum.sn = 0;
    bildirDurum.sonHata = "";
    bildirDurum.kayit = true;
    if (!bildirSrAc()) {
      bildirDurum.kayit = false;
      bildirUyari("Konuşma açılamadı. Yazman yeter.");
      bildirYazi();
      return;
    }
    bildirYazi();
    bildirDurum.sayac = setInterval(function () {
      bildirDurum.sn += 1;
      bildirYazi();
      if (bildirDurum.sn >= BILDIR_MAX_SN) bildirKayitBitir();
    }, 1000);
  });
}

function bildirGonder() {
  if (bildirDurum.kayit) bildirKayitBitir();
  var ta = document.getElementById("bildir-metin");
  var metin = ((ta && ta.value) || "").trim();
  if (!metin) {
    bildirUyari("Yaz veya konuş.");
    return;
  }
  bildirUyari("");
  karaKutuYaz("bildir", { metin: metin.slice(0, 400) });
  var govde = "Ebatlama — öneri / şikayet\n" +
    new Date().toLocaleString("tr-TR") + "\n\n" + metin;
  function bitti() {
    bildirTemiz();
    birimKapat();
  }
  if (navigator.share) {
    navigator.share({ title: "Ebatlama öneri", text: govde }).then(bitti).catch(function () {});
    return;
  }
  kanalWhatsapp(null, govde);
  bitti();
}

function birimSec(yeni) {
  if ((yeni !== "mm" && yeni !== "cm") || yeni === BIRIM) return;
  var perde = levhaPerde();
  var acik = perde && perde.classList.contains("acik");
  var enEl = ql(".l-en");
  var boyEl = ql(".l-boy");
  var enMm = acik && enEl ? mmOku(enEl.value) : NaN;
  var boyMm = acik && boyEl ? mmOku(boyEl.value) : NaN;
  BIRIM = yeni;
  birimElle = true;
  birimKaydet();
  if (acik) {
    if (enMm > 0 && enEl) enEl.value = olcuGoster(enMm);
    if (boyMm > 0 && boyEl) boyEl.value = olcuGoster(boyMm);
    presetleriCiz();
  }
  birimYaz();
}

function yazGosterge(ad, metin) {
  var kok = k2Kok();
  if (!kok) return;
  kok.querySelectorAll("[data-g=\"" + ad + "\"]").forEach(function (el) {
    el.textContent = metin;
  });
}

function fireYazi() {
  if (mod === "plaka") return "0,00 m²";
  var mm2 = 0;
  ihtiyac().forEach(function (p) {
    mm2 += p.boy * p.en * p.adet;
  });
  var fireMm2 = 0;
  FIRE.havuz.forEach(function (p) {
    fireMm2 += p.boy * p.en * p.adet;
  });
  var m2 = mm2 / 1000000;
  var fireM2 = fireMm2 / 1000000;
  var pay = m2 + fireM2;
  return pay > 0
    ? fmtOndalik(fireM2) + " m²  %" + Math.round((fireM2 / pay) * 100)
    : "0,00 m²";
}

function cizGosterge() {}

var havuzSilIx = -1;
var listeSilIx = -1;

function listeSiraYaz() {
  ihtiyac().forEach(function (p, i) {
    p.sira = i + 1;
  });
}

function listeSilSor(ix) {
  if (!(ix >= 0) || ix >= ihtiyac().length) return;
  listeSilIx = ix;
  havuzSilIx = -1;
  var yazi = document.getElementById("havuz-sil-yazi");
  if (yazi) yazi.textContent = (ix + 1) + ". satır silinsin mi?";
  var p = document.getElementById("havuz-sil-perde");
  if (p) p.classList.add("acik");
}

function listeSilOnay() {
  var ix = listeSilIx;
  listeSilIx = -1;
  if (!(ix >= 0) || ix >= ihtiyac().length) return;
  ihtiyac().splice(ix, 1);
  listeSiraYaz();
  cizListe();
  motorBayat();
}

function havuzSilSor(ix) {
  if (!(ix >= 0) || ix >= FIRE.havuz.length) return;
  havuzSilIx = ix;
  listeSilIx = -1;
  var yazi = document.getElementById("havuz-sil-yazi");
  if (yazi) yazi.textContent = (ix + 1) + ". satır silinsin mi?";
  var p = document.getElementById("havuz-sil-perde");
  if (p) p.classList.add("acik");
}

function havuzSilKapat() {
  havuzSilIx = -1;
  listeSilIx = -1;
  var p = document.getElementById("havuz-sil-perde");
  if (p) p.classList.remove("acik");
}

function havuzSilOnay() {
  if (listeSilIx >= 0) {
    listeSilOnay();
    havuzSilKapat();
    return;
  }
  var ix = havuzSilIx;
  havuzSilKapat();
  if (!(ix >= 0) || ix >= FIRE.havuz.length) return;
  FIRE.havuz.splice(ix, 1);
  cizHavuz();
  motorBayat();
}

function cizHavuz() {
  cizGosterge();
  presetleriYenile();
  var n = FIRE.havuz.length;
  document.querySelectorAll("[data-rozet]").forEach(function (r) {
    r.textContent = String(n);
  });
  document.querySelectorAll(".havuz-ikon").forEach(function (b) {
    b.classList.toggle("dolu", n > 0);
  });
  document.querySelectorAll("[data-bos]").forEach(function (p) {
    p.hidden = n > 0;
  });
  document.querySelectorAll("[data-havuz]").forEach(function (tb) {
    var kenaraCol = tb.hasAttribute("data-kenara-col");
    var silCol = tb.hasAttribute("data-sil-col");
    tb.innerHTML = "";
    FIRE.havuz.forEach(function (p, i) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + (i + 1) + "</td><td>" + olcuGoster(p.boy) + "</td><td>" + olcuGoster(p.en) +
        "</td><td>" + p.adet + "</td><td>" + havuzKalinlikHucre(p) + "</td>" +
        (kenaraCol
          ? "<td><button type=\"button\" class=\"kenara-btn\" data-kenara=\"" + i + "\">Kenara</button></td>"
          : "") +
        (silCol
          ? "<td class=\"ayar-hucre\"><button type=\"button\" class=\"disli sil-ikon\" data-havuz-sil=\"" +
            i +
            "\" aria-label=\"Sil\" title=\"Satırı sil\">" +
            "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">" +
            "<path d=\"M9.4 3.1h5.2l.7 1.7h5v1.8H3.7V4.8h5z\"/>" +
            "<path fill-rule=\"evenodd\" d=\"M6 8h12l-1 12.2A1.7 1.7 0 0 1 15.3 21.7H8.7A1.7 1.7 0 0 1 7 20.2zm4.2 2.4h1.5v8.2h-1.5zm2.6 0h1.5v8.2h-1.5z\"/>" +
            "</svg></button></td>"
          : "");
      tb.appendChild(tr);
    });
  });
  var kb = document.getElementById("kenar-govde");
  var tab = document.getElementById("kenar-tablo");
  var bos = document.getElementById("kenar-bos");
  if (!kb || !tab || !bos) return;
  kb.innerHTML = "";
  if (!FIRE.kenara.length) {
    tab.hidden = true;
    bos.hidden = false;
    return;
  }
  tab.hidden = false;
  bos.hidden = true;
  FIRE.kenara.forEach(function (p, i) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + (i + 1) + "</td><td>" + olcuGoster(p.boy) + "</td><td>" + olcuGoster(p.en) +
      "</td><td>" + p.adet + "</td><td>" + havuzKalinlikHucre(p) + "</td>" +
      "<td><button type=\"button\" class=\"kenara-btn\" data-geri=\"" + i + "\">Geri koy</button></td>";
    kb.appendChild(tr);
  });
}

function havuzKalinlikHucre(p) {
  var n = p && Number(p.kalinlik) > 0 ? Math.round(Number(p.kalinlik)) : 0;
  if (!(n > 0)) n = havuzKalinlikSon();
  if (!(n > 0)) return "—";
  return "( " + (n / 10).toFixed(1) + " )";
}

function ondalikOku(metin) {
  var temiz = String(metin === undefined || metin === null ? "" : metin).trim().replace(",", ".");
  if (temiz === "") return NaN;
  return Number(temiz);
}

function motorDurumYaz(acik) {
  var el = document.getElementById("motor-durum");
  if (!el) return;
  el.className = acik ? "motor-acik" : "motor-kapali";
  el.textContent = acik ? "Motor açık" : "Motor kapalı";
}

function motorDurumCek() {
  motorDurumYaz(typeof CepMotor !== "undefined");
  return Promise.resolve();
}

function ayarlariCek() {
  return Promise.resolve();
}

function isEbatListesi() {
  var gorulen = {};
  var liste = [];
  function ekle(kaynak, p) {
    var en = Math.round(Number(p.en));
    var boy = Math.round(Number(p.boy));
    if (!(en > 0) || !(boy > 0)) return;
    var anahtar = en + "x" + boy;
    if (gorulen[anahtar]) return;
    gorulen[anahtar] = true;
    liste.push({
      ad: kaynak,
      en: en,
      boy: boy,
      kalinlik: FIRE.levha.kalinlik
    });
  }
  FIRE.havuz.forEach(function (p) { ekle("Havuz", p); });
  FIRE.kenara.forEach(function (p) { ekle("Kenara", p); });
  return liste;
}

function ozelOlcuAcikMi() {
  var kutu = ql(".levha-ozel");
  return !!(kutu && !kutu.hidden);
}

function ozelOlcuGoster(acik) {
  var kutu = ql(".levha-ozel");
  if (kutu) kutu.hidden = !acik;
}

function ozelOlcuAc() {
  var L = levhaAktif();
  var sec = ql(".levha-preset");
  if (sec) sec.value = "";
  var en = ql(".l-en");
  var boy = ql(".l-boy");
  var kal = ql(".l-kalinlik");
  if (en) en.value = "";
  if (boy) boy.value = "";
  if (kal) kal.value = String(L.kalinlik || 18);
  ozelOlcuGoster(true);
  if (en) en.focus();
}

function plakaSablonListesi() {
  var kal = PLAKA.levha.kalinlik || 18;
  return PLAKA_SABLONLARI.map(function (p) {
    return { ad: p.ad, en: p.en, boy: p.boy, kalinlik: kal };
  });
}

function presetleriCiz() {
  var sec = ql(".levha-preset");
  if (!sec) return;
  M().isEbatlari = mod === "plaka" ? plakaSablonListesi() : isEbatListesi();
  var html = M().isEbatlari.map(function (p, i) {
    return (
      "<option value=\"" + i + "\">" + p.ad + " — " +
      olcuGoster(p.en) + "×" + olcuGoster(p.boy) + " " + BIRIM + "</option>"
    );
  }).join("");
  if (mod === "plaka") {
    sec.innerHTML = "<option value=\"\">Şablon seç…</option>" + html;
  } else if (!html) {
    sec.innerHTML = "<option value=\"\" disabled>Bu işte ebat yok</option>";
  } else {
    sec.innerHTML = "<option value=\"\">Seç…</option>" + html;
  }
  sec.value = "";
}

function presetleriYenile() {
  var perde = levhaPerde();
  if (perde && perde.classList.contains("acik") && !ozelOlcuAcikMi()) presetleriCiz();
}

function presetSecildi() {
  ozelOlcuGoster(false);
}

function fabrikaOlcuMu(en, boy) {
  var kisa = en < boy ? en : boy;
  var uzun = en < boy ? boy : en;
  return (uzun === 2800 && kisa === 2100) ||
    (uzun === 3660 && kisa === 1830) ||
    (uzun === 2800 && kisa === 1220) ||
    (uzun === 2440 && kisa === 1220);
}

function levhaKayitliYaz() {
  var el = ql(".levha-kayitli");
  var L = levhaAktif();
  if (!el) return;
  if (!levhaAktifElle()) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  if (mod !== "plaka" && fabrikaOlcuMu(L.en, L.boy)) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent =
    "Kayıtlı: " + olcuGoster(L.en) + "×" + olcuGoster(L.boy) + " " + BIRIM +
    " · " + L.kalinlik + " mm";
}

function levhaFormDoldur() {
  var L = levhaAktif();
  var uyari = ql(".levha-uyari");
  if (uyari) uyari.hidden = true;
  ozelOlcuGoster(false);
  var en = ql(".l-en");
  var boy = ql(".l-boy");
  var kal = ql(".l-kalinlik");
  if (en) en.value = "";
  if (boy) boy.value = "";
  if (kal) kal.value = "";
  var anahtar = ql(".l-damar");
  if (anahtar) anahtar.setAttribute("aria-pressed", L.damarKilidi ? "true" : "false");
  levhaKayitliYaz();
  presetleriCiz();
}

function levhaAc() {
  levhaFormDoldur();
  var p = levhaPerde();
  if (p) p.classList.add("acik");
}

function levhaKapat() {
  ozelOlcuGoster(false);
  var p = levhaPerde();
  if (p) p.classList.remove("acik");
}

function levhaKaydet(opts) {
  opts = opts || {};
  var uyari = ql(".levha-uyari");
  var anahtar = ql(".l-damar");
  var L = levhaAktif();
  var en;
  var boy;
  var kal;
  var sec = ql(".levha-preset");
  var secIx = sec ? sec.value : "";
  var enEl = ql(".l-en");
  var boyEl = ql(".l-boy");
  var kalEl = ql(".l-kalinlik");

  if (ozelOlcuAcikMi()) {
    en = mmOku(enEl ? enEl.value : "");
    boy = mmOku(boyEl ? boyEl.value : "");
    kal = parseInt(kalEl ? kalEl.value : "", 10);
  } else if (secIx !== "" && M().isEbatlari[Number(secIx)]) {
    var p = M().isEbatlari[Number(secIx)];
    en = p.en;
    boy = p.boy;
    kal = p.kalinlik || L.kalinlik || 18;
  } else if (mod === "plaka" && levhaAktifElle()) {
    en = L.en;
    boy = L.boy;
    kal = L.kalinlik;
  } else if (mod !== "plaka" && levhaAktifElle() && !fabrikaOlcuMu(L.en, L.boy)) {
    en = L.en;
    boy = L.boy;
    kal = L.kalinlik;
  } else if (opts.sayfa && L && L.en > 0 && L.boy > 0) {
    en = L.en;
    boy = L.boy;
    kal = L.kalinlik || 18;
  } else {
    if (uyari) {
      uyari.hidden = false;
      uyari.textContent = mod === "plaka"
        ? "Şablon seç veya Özel ölçü gir."
        : "Bu işten ebat seç veya Özel ölçü gir.";
    }
    return false;
  }
  if (!(en > 0) || !(boy > 0) || !(kal > 0)) {
    if (uyari) {
      uyari.hidden = false;
      uyari.textContent = "En, boy ve kalınlık 0'dan büyük olmalı.";
    }
    return false;
  }

  levhaAktifYaz({
    en: en,
    boy: boy,
    kalinlik: kal,
    damarKilidi: anahtar ? anahtar.getAttribute("aria-pressed") === "true" : false
  }, true);
  damarSatirlariSifirla();
  levhaDepoya();
  motorBayat();
  cizListe();
  parcaAyarDugmeYaz();
  if (!opts.sayfa) levhaKapat();
  return true;
}

function isBilgiAc() {
  var p = document.getElementById("is-bilgi-perde");
  var mdf = document.getElementById("is-mdf");
  var bant = document.getElementById("is-bant");
  var uyari = document.getElementById("is-bilgi-uyari");
  var L = levhaAktif();
  if (mdf) mdf.value = L && L.kalinlik ? String(L.kalinlik) : "";
  if (bant) bant.value = M().bantMm > 0 ? String(M().bantMm).replace(".", ",") : "";
  if (uyari) uyari.hidden = true;
  if (p) p.classList.add("acik");
}

function isBilgiKapat() {
  var p = document.getElementById("is-bilgi-perde");
  if (p) p.classList.remove("acik");
}

function isBilgiKaydet() {
  var mdfEl = document.getElementById("is-mdf");
  var bantEl = document.getElementById("is-bant");
  var uyari = document.getElementById("is-bilgi-uyari");
  var kal = parseInt(mdfEl ? String(mdfEl.value).replace(",", ".") : "", 10);
  var bantMetin = bantEl ? String(bantEl.value).trim().replace(",", ".") : "";
  var bantMm = Number(bantMetin);
  if (!(kal > 0) || !(bantMm > 0) || !isFinite(bantMm)) {
    if (uyari) uyari.hidden = false;
    return;
  }
  bantMm = Math.round(bantMm * 100) / 100;
  var L = levhaAktif() || levhaBos();
  levhaAktifYaz({
    en: L.en,
    boy: L.boy,
    kalinlik: kal,
    damarKilidi: !!L.damarKilidi
  }, true);
  M().bantMm = bantMm;
  levhaDepoya();
  modulVeriKaydet();
  motorBayat();
  if (uyari) uyari.hidden = true;
  isBilgiKapat();
}

function havuzAc() {
  if (mod === "plaka") return;
  document.getElementById("h-boy").value = "";
  document.getElementById("h-en").value = "";
  document.getElementById("h-adet").value = "1";
  cizHavuz();
  document.getElementById("havuz-perde").classList.add("acik");
}

function havuzKapat() {
  document.getElementById("havuz-perde").classList.remove("acik");
}

function ocrUyarisi() {
  var p = document.getElementById("ocr-perde");
  if (p) p.classList.add("acik");
}

function ocrUyarisiKapat() {
  var p = document.getElementById("ocr-perde");
  if (p) p.classList.remove("acik");
}

function havuzKalinlikSon() {
  if (Number(FIRE.kalinlikMm) > 0) return Math.round(Number(FIRE.kalinlikMm));
  var L = levhaAktif();
  if (L && Number(L.kalinlik) > 0) return Math.round(Number(L.kalinlik));
  return 18;
}

function havuzKalinlikOku() {
  var el = document.getElementById("f-kalinlik");
  var n = parseInt(el ? String(el.value).replace(",", ".").replace(/mm/gi, "") : "", 10);
  return n > 0 ? n : 0;
}

function havuzKalinlikYaz() {
  var el = document.getElementById("f-kalinlik");
  if (el) el.value = String(havuzKalinlikSon());
}

function fireDamarYaz() {
  var btn = document.querySelector("#k1-fire-ekle .l-damar");
  var L = levhaAktif();
  if (btn) btn.setAttribute("aria-pressed", L && L.damarKilidi ? "true" : "false");
}

function havuzKalinlikKaydet() {
  var n = havuzKalinlikOku();
  if (!(n > 0)) return;
  FIRE.kalinlikMm = n;
  var L = levhaAktif() || levhaBos();
  levhaAktifYaz({
    en: L.en,
    boy: L.boy,
    kalinlik: n,
    damarKilidi: !!L.damarKilidi
  }, false);
  levhaDepoya();
  modulVeriKaydet();
}

function havuzaEkle(boyId, enId, adetId) {
  if (mod === "plaka") return false;
  var boy = mmOku(document.getElementById(boyId).value);
  var en = mmOku(document.getElementById(enId).value);
  var adet = parseInt(document.getElementById(adetId).value, 10);
  if (!(boy > 0) || !(en > 0) || !(adet > 0)) {
    olcuUyariYaz("Boy, en ve adet yaz.");
    return false;
  }
  olcuUyariYaz("");
  havuzKalinlikKaydet();
  var kal = havuzKalinlikSon();
  FIRE.havuz.push({
    boy: boy,
    en: en,
    adet: adet,
    kalinlik: kal
  });
  document.getElementById(boyId).value = "";
  document.getElementById(enId).value = "";
  document.getElementById(adetId).value = "1";
  cizHavuz();
  motorBayat();
  return true;
}

function motorGirdi() {
  var parca_listesi = ihtiyac().map(function (p) {
    var kayit = {
      en: p.en,
      boy: p.boy,
      adet: p.adet,
      bant: (p.bant || []).slice(),
      id: "P" + String(p.sira).padStart(3, "0")
    };
    if (p.damarIptal) kayit.damar_kilidi = false;
    else if (p.damarAcik) kayit.damar_kilidi = true;
    return kayit;
  });
  var stok = [];
  FIRE.havuz.forEach(function (p) {
    var en = parseInt(p.en, 10);
    var boy = parseInt(p.boy, 10);
    var adet = parseInt(p.adet, 10);
    if (en > 0 && boy > 0 && adet > 0) stok.push({ en: en, boy: boy, adet: adet });
  });
  stok.sort(function (a, b) {
    var aa = a.en * a.boy;
    var bb = b.en * b.boy;
    if (bb !== aa) return bb - aa;
    return Math.max(b.en, b.boy) - Math.max(a.en, a.boy);
  });
  var L = levhaAktif();
  return {
    birim: "mm",
    parca_listesi: parca_listesi,
    levha_en: L.en,
    levha_boy: L.boy,
    levha_kalinlik: L.kalinlik,
    bant_payi_mm: 0,
    damar_kilidi: L.damarKilidi,
    fire_kip: mod !== "plaka",
    stok_havuzu: mod === "plaka" ? [] : stok
  };
}

function motorHataYazi(hata) {
  var m = String((hata && hata.message) || hata || "");
  return "Hesap olmadı. " + m;
}

function plakaParcaDoner(p) {
  var kaynak = parcaListeSatir(p.id);
  if (kaynak && kaynak.damarIptal) return true;
  if (kaynak && kaynak.damarAcik) return false;
  var L = levhaAktif();
  return !(L && L.damarKilidi);
}

function plakaHavuzStok() {
  var stok = [];
  FIRE.havuz.forEach(function (p) {
    var en = parseInt(p.en, 10);
    var boy = parseInt(p.boy, 10);
    var adet = parseInt(p.adet, 10);
    if (en > 0 && boy > 0 && adet > 0) stok.push({ en: en, boy: boy, adet: adet });
  });
  return stok;
}

function plakaParcaMotorKayit(p) {
  var kayit = {
    en: parseInt(p.en, 10) || parseInt(p.w, 10),
    boy: parseInt(p.boy, 10) || parseInt(p.h, 10),
    adet: 1,
    id: p.id
  };
  var kaynak = parcaListeSatir(p.id);
  if (kaynak && kaynak.damarIptal) kayit.damar_kilidi = false;
  else if (kaynak && kaynak.damarAcik) kayit.damar_kilidi = true;
  else if (levhaAktif() && levhaAktif().damarKilidi) kayit.damar_kilidi = true;
  return kayit;
}

function plakaSayfaEkle(birlesik, env, kesim, sayfalar, envKaynak, kesimKaynak) {
  (sayfalar || []).forEach(function (s) {
    var eski = s.levha;
    var yeni = birlesik.length + 1;
    var kopya = JSON.parse(JSON.stringify(s));
    kopya.levha = yeni;
    birlesik.push(kopya);
    (envKaynak || []).forEach(function (f) {
      if (Number(f.levha) !== Number(eski)) return;
      var e = JSON.parse(JSON.stringify(f));
      e.levha = yeni;
      env.push(e);
    });
    (kesimKaynak || []).forEach(function (k) {
      if (Number(k.levha) !== Number(eski)) return;
      var c = JSON.parse(JSON.stringify(k));
      c.levha = yeni;
      kesim.push(c);
    });
  });
}

function plakaHavuzOtoKes(sonuc) {
  if (mod !== "plaka" || !sonuc || typeof CepMotor === "undefined" || !CepMotor.hesapla) return sonuc;
  if (sonuc.plaka_havuz_oto) return sonuc;
  var yer = sonuc.yerlesim || [];
  if (yer.length < 2) return sonuc;
  var pe = Number(sonuc.levha_en) || 0;
  var pb = Number(sonuc.levha_boy) || 0;
  var esik = (pe * pb) / 2;
  if (!(esik > 0)) return sonuc;
  var artik = [];
  yer.forEach(function (s, i) {
    if (i < 1) return;
    (s.parcalar || []).forEach(function (p) {
      artik.push(p);
    });
  });
  var mm2 = 0;
  artik.forEach(function (p) {
    mm2 += (Number(p.w) || 0) * (Number(p.h) || 0);
  });
  if (!artik.length || !(mm2 > 0) || mm2 >= esik) return sonuc;
  var stok = plakaHavuzStok();
  if (!stok.length) return sonuc;
  var fireSonuc = CepMotor.hesapla(artik.map(plakaParcaMotorKayit), pe, pb, stok, true, false);
  var fireSayfa = ((fireSonuc && fireSonuc.yerlesim) || []).filter(function (s) {
    return levhaKaynakAd(s) === "fire";
  });
  if (!fireSayfa.length) return sonuc;
  var gitti = {};
  fireSayfa.forEach(function (s) {
    (s.parcalar || []).forEach(function (p) {
      if (p.id) gitti[p.id] = 1;
    });
  });
  var kalan = [];
  artik.forEach(function (p) {
    if (p.id && gitti[p.id]) return;
    kalan.push(p);
  });
  var extraSonuc = kalan.length
    ? CepMotor.hesapla(kalan.map(plakaParcaMotorKayit), pe, pb, [], false, false)
    : null;
  var birlesik = [];
  var env = [];
  var kesim = [];
  plakaSayfaEkle(birlesik, env, kesim, fireSayfa, fireSonuc.fire_envanteri, fireSonuc.kesim_agaci);
  plakaSayfaEkle(birlesik, env, kesim, [yer[0]], sonuc.fire_envanteri, sonuc.kesim_agaci);
  if (extraSonuc) {
    plakaSayfaEkle(birlesik, env, kesim, extraSonuc.yerlesim || [], extraSonuc.fire_envanteri, extraSonuc.kesim_agaci);
  }
  var kullanilan = 0;
  var toplam = 0;
  birlesik.forEach(function (s) {
    toplam += (Number(s.panel_en) || 0) * (Number(s.panel_boy) || 0);
    (s.parcalar || []).forEach(function (p) {
      kullanilan += (Number(p.en) || Number(p.w) || 0) * (Number(p.boy) || Number(p.h) || 0);
    });
  });
  var net = toplam - kullanilan;
  var cikti = JSON.parse(JSON.stringify(sonuc));
  cikti.yerlesim = birlesik;
  cikti.fire_envanteri = env;
  cikti.kesim_agaci = kesim;
  cikti.levha_sayisi = birlesik.length;
  cikti.kullanilan_alan_mm2 = kullanilan;
  cikti.toplam_levha_alan_mm2 = toplam;
  cikti.net_fire_mm2 = net;
  cikti.fire_yuzde = toplam ? (net / toplam) * 100 : 0;
  cikti.plaka_havuz_oto = true;
  karaKutuYaz("havuz_oto", {
    fireLevha: fireSayfa.length,
    parca: Object.keys(gitti).length,
    kalan: kalan.length
  });
  return cikti;
}

function plakaHavuzKontrol(sonuc) {
  M().plakaHavuz = { bakildi: false, kurtarir: false, artikMm2: 0, esikMm2: 0, kurtarAdet: 0, kurtarParca: [] };
  if (mod !== "plaka" || !sonuc) return;
  if (sonuc.plaka_havuz_oto) {
    var n = 0;
    ((sonuc.yerlesim) || []).forEach(function (s) {
      if (levhaKaynakAd(s) !== "fire") return;
      n += (s.parcalar || []).length;
    });
    M().plakaHavuz.bakildi = true;
    M().plakaHavuz.kurtarAdet = n;
    return;
  }
  var pe = Number(sonuc.levha_en) || 0;
  var pb = Number(sonuc.levha_boy) || 0;
  var esik = (pe * pb) / 2;
  if (!(esik > 0)) return;
  var artik = [];
  ((sonuc.yerlesim) || []).forEach(function (s, i) {
    if (i < 1) return;
    (s.parcalar || []).forEach(function (p) {
      artik.push(p);
    });
  });
  var mm2 = 0;
  artik.forEach(function (p) {
    mm2 += (Number(p.w) || 0) * (Number(p.h) || 0);
  });
  M().plakaHavuz.artikMm2 = mm2;
  M().plakaHavuz.esikMm2 = esik;
  if (!artik.length || !(mm2 > 0) || mm2 >= esik) return;
  M().plakaHavuz.bakildi = true;
  var havuz = [];
  FIRE.havuz.forEach(function (h) {
    var n = parseInt(h.adet, 10) || 0;
    if (n > 0 && Number(h.en) > 0 && Number(h.boy) > 0) {
      havuz.push({ en: Number(h.en), boy: Number(h.boy), adet: n });
    }
  });
  if (!havuz.length) return;
  var kurtar = 0;
  var kurtarParca = [];
  artik.forEach(function (p) {
    var en = Number(p.w) || 0;
    var boy = Number(p.h) || 0;
    var don = plakaParcaDoner(p);
    var i;
    for (i = 0; i < havuz.length; i++) {
      var f = havuz[i];
      if (f.adet < 1) continue;
      var ok = (en <= f.en && boy <= f.boy) || (don && boy <= f.en && en <= f.boy);
      if (!ok) continue;
      f.adet -= 1;
      kurtar += 1;
      kurtarParca.push(p);
      break;
    }
  });
  M().plakaHavuz.kurtarir = kurtar > 0;
  M().plakaHavuz.kurtarAdet = kurtar;
  M().plakaHavuz.kurtarParca = kurtarParca;
}

function yerelMotorCevap() {
  if (typeof CepMotor === "undefined" || !CepMotor.hesapla) {
    throw new Error("Cep motoru yüklenmedi.");
  }
  var girdi = motorGirdi();
  var sonuc = CepMotor.hesapla(
    girdi.parca_listesi,
    girdi.levha_en,
    girdi.levha_boy,
    girdi.stok_havuzu,
    !!girdi.fire_kip
  );
  sonuc = plakaHavuzOtoKes(sonuc);
  var kesim = (girdi.parca_listesi || []).map(function (p) {
    return { id: p.id, kesim_en_mm: p.en, kesim_boy_mm: p.boy };
  });
  return { ok: true, girdi: girdi, kesim: kesim, sonuc: sonuc };
}

function motorHesapla() {
  listeHataYaz("");
  if (!ihtiyac().length) {
    var bos = q2(".liste-bos");
    if (bos) {
      bos.hidden = false;
      bos.textContent = "Liste boş. Önce Parça ekle.";
    }
    listeHataYaz("Liste boş. Önce Parça ekle.");
    karaKutuYaz("hesap_bos");
    return Promise.resolve();
  }
  var btn = q2(".btn-hesapla");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Hesaplanıyor…";
  }
  return Promise.resolve()
    .then(function () {
      var veri = yerelMotorCevap();
      motorGirdiOzetYaz(veri.girdi || null);
      motorKesimYaz(veri.kesim || null);
      return veri.sonuc;
    })
    .then(function (sonuc) {
      M().senaryoGecmis = [sonuc];
      M().senaryoIx = 0;
      M().senaryoBitti = false;
      motorSonucYaz(sonuc);
      sayfaNoYaz(1);
      cizListe();
      git(k3Id());
      cizDurum();
      senaryoDugmeYaz();
      motorDurumYaz(true);
      karaKutuYaz("hesap_ok", karaKutuSonucOzet(sonuc));
    })
    .catch(function (hata) {
      listeHataYaz(motorHataYazi(hata));
      motorDurumCek();
      karaKutuYaz("hesap_hata", { hata: String((hata && hata.message) || hata || "") });
    })
    .then(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Hesapla";
      }
    });
}

function k3StokSatirEslesir(pe, pb, en, boy) {
  pe = Math.round(Number(pe));
  pb = Math.round(Number(pb));
  en = Math.round(Number(en));
  boy = Math.round(Number(boy));
  return (pe === en && pb === boy) || (pe === boy && pb === en);
}

function k3StokMasrafSatir(s) {
  var m2 = stokM2(s);
  var birim = stokM2Tl(s);
  var tl = birim ? m2 * birim : null;
  return { m2: m2, tl: tl };
}

function k3StokToplamOzet(liste) {
  var m2 = 0;
  var tl = 0;
  var tlVar = false;
  (liste || []).forEach(function (s) {
    var m = k3StokMasrafSatir(s);
    var adet = s.adet || 1;
    m2 += m.m2 * adet;
    if (m.tl != null) {
      tl += m.tl * adet;
      tlVar = true;
    }
  });
  return { m2: m2, tl: tl, tlVar: tlVar, adet: (liste || []).length };
}

function k3FireKopyaEsle(sonuc) {
  var kopya = [];
  FIRE.havuz.forEach(function (p) {
    var n = parseInt(p.adet, 10) || 0;
    var i;
    for (i = 0; i < n; i++) {
      kopya.push({
        boy: p.boy,
        en: p.en,
        kalinlik: p.kalinlik,
        kullanildi: false,
        levha: 0,
        parca: 0
      });
    }
  });
  ((sonuc && sonuc.yerlesim) || []).forEach(function (s) {
    if (s.kaynak !== "fire") return;
    var j;
    for (j = 0; j < kopya.length; j++) {
      if (kopya[j].kullanildi) continue;
      if (k3StokSatirEslesir(s.panel_en, s.panel_boy, kopya[j].en, kopya[j].boy)) {
        kopya[j].kullanildi = true;
        kopya[j].levha = s.levha;
        kopya[j].parca = (s.parcalar || []).length;
        break;
      }
    }
  });
  return {
    gitti: kopya.filter(function (s) { return s.kullanildi; }),
    duran: kopya.filter(function (s) { return !s.kullanildi; })
  };
}

function havuzToplamTlYazi() {
  if (mod === "plaka") {
    var kal = PLAKA.levha && PLAKA.levha.kalinlik;
    var birim = kalinlikFiyatAl(kal);
    if (!(birim > 0)) return "—";
    var m2 = 0;
    PLAKA.ihtiyac.forEach(function (p) {
      m2 += stokM2(p) * (p.adet || 1);
    });
    return m2 > 0 ? fmtTl(m2 * birim) : "—";
  }
  var t = k3StokToplamOzet(FIRE.havuz);
  return t.tlVar ? fmtTl(t.tl) : "—";
}

function k3FireGittiOzetDeger(sonuc) {
  var a = k3FireKopyaEsle(sonuc);
  if (!a.gitti.length) return mod === "plaka" ? "" : "0,00 m²";
  var t = k3StokToplamOzet(a.gitti);
  return fmtOndalik(t.m2) + " m² · " + (t.tlVar ? fmtTl(t.tl) : "fiyat yok");
}

function k3FireGittiOzetYazi(sonuc) {
  var d = k3FireGittiOzetDeger(sonuc);
  return d ? "HAVUZ GİTTİ: " + d : "";
}

function k3SemaYazi(sonuc) {
  if (!sonuc || sonuc.strateji == null || sonuc.strateji === "") return "—";
  var ad = String(sonuc.strateji).replace(/_/g, " ");
  var gec = M().senaryoGecmis || [];
  var ix = M().senaryoIx || 0;
  if (gec.length) ad += " · " + (ix + 1) + "/" + gec.length;
  var n = sonuc.alternatif_kalan;
  if (typeof n === "number") ad += " · " + n + " kaldı";
  return ad;
}

function senaryoDugmeYaz() {
  var once = q3(".btn-senaryo-once");
  if (once) once.disabled = !(M().senaryoIx > 0);
  var btn = q3(".btn-senaryo");
  if (!btn) return;
  var gec = M().senaryoGecmis || [];
  var yan = !!M().senaryoBitti && gec.length &&
    M().senaryoIx >= gec.length - 1;
  btn.classList.toggle("yan", yan);
}

function senaryoGoster(sonuc) {
  motorSonucYaz(sonuc);
  plakaHavuzKontrol(sonuc);
  sayfaNoYaz(1);
  cizMotorSonuc(sonuc);
  k3SahneYaz();
  senaryoDugmeYaz();
}

function senaryoOnce() {
  var not = q3(".k3-not");
  if (!(M().senaryoIx > 0)) {
    if (not) not.textContent = "İlk şemadasın.";
    return;
  }
  M().senaryoIx -= 1;
  senaryoGoster(M().senaryoGecmis[M().senaryoIx]);
}

function senaryoIste() {
  var btn = q3(".btn-senaryo");
  var not = q3(".k3-not");
  if (!motorSonucAl()) {
    if (not) not.textContent = "Önce Hesapla.";
    karaKutuYaz("senaryo_yok");
    return;
  }
  var gec = M().senaryoGecmis || [];
  if (M().senaryoBitti && gec.length &&
      M().senaryoIx >= gec.length - 1) {
    M().senaryoIx = 0;
    karaKutuYaz("senaryo_basa", karaKutuSonucOzet(gec[0]));
    senaryoGoster(gec[0]);
    return;
  }
  if (M().senaryoIx < gec.length - 1) {
    M().senaryoIx += 1;
    karaKutuYaz("senaryo", karaKutuSonucOzet(gec[M().senaryoIx]));
    senaryoGoster(gec[M().senaryoIx]);
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = "…";
  }
  Promise.resolve()
    .then(function () {
      if (typeof CepMotor === "undefined" || !CepMotor.sonrakiSenaryo) {
        throw new Error("Cep motoru yüklenmedi.");
      }
      var ham = CepMotor.sonrakiSenaryo();
      return { uyari: ham.uyari, sonuc: plakaHavuzOtoKes(ham.senaryo) };
    })
    .then(function (veri) {
      if (veri.uyari || !veri.sonuc) {
        M().senaryoBitti = true;
        if (not) not.textContent = veri.uyari || "Başka kesim kalmadı.";
        karaKutuYaz("senaryo_bitti", { uyari: veri.uyari || "" });
        senaryoDugmeYaz();
        return;
      }
      M().senaryoGecmis.push(veri.sonuc);
      M().senaryoIx = M().senaryoGecmis.length - 1;
      karaKutuYaz("senaryo", karaKutuSonucOzet(veri.sonuc));
      senaryoGoster(veri.sonuc);
    })
    .catch(function (hata) {
      if (not) not.textContent = motorHataYazi(hata);
      motorDurumCek();
      karaKutuYaz("senaryo_hata", { hata: String((hata && hata.message) || hata || "") });
    })
    .then(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Kesimi { } Çevir";
      }
      senaryoDugmeYaz();
    });
}

var tezSahneGoz = null;
var tezSahneGozEl = null;
var tezSahneKilit = false;

function tezSahneIzle(tez) {
  var sahne = tez && tez.querySelector(".tez-sahne");
  if (!sahne || typeof ResizeObserver === "undefined") return;
  if (!tezSahneGoz) {
    tezSahneGoz = new ResizeObserver(function () {
      if (tezSahneKilit) return;
      tezSahneKilit = true;
      requestAnimationFrame(function () {
        tezSahneKilit = false;
        var s = motorSonucAl();
        if (s) cizTezgah(s, sayfaNoAl());
      });
    });
  }
  if (tezSahneGozEl === sahne) return;
  if (tezSahneGozEl) tezSahneGoz.unobserve(tezSahneGozEl);
  tezSahneGozEl = sahne;
  tezSahneGoz.observe(sahne);
}

function k3SahneYaz() {
  k3PerdeYaz();
  tezZoomYaz();
  requestAnimationFrame(function () {
    if (motorSonucAl()) cizTezgah(motorSonucAl(), sayfaNoAl());
  });
}

function k3PerdeYaz() {
  var kok = k3Kok();
  var btn = q3(".btn-k3-perde");
  if (!btn) return;
  btn.textContent = kok && kok.classList.contains("k3-perde-liste") ? "Levha" : "Liste";
}

function k3PerdeDegis() {
  var kok = k3Kok();
  if (!kok) return;
  kok.classList.remove("k3-perde-sigmayan");
  kok.classList.toggle("k3-perde-liste");
  k3SahneYaz();
}

function k3SigmayanDegis() {
  var kok = k3Kok();
  if (!kok) return;
  kok.classList.remove("k3-perde-liste");
  kok.classList.toggle("k3-perde-sigmayan");
  k3SahneYaz();
}

function listeHataYaz(metin) {
  var el = q2(".liste-hata");
  if (!el) return;
  if (!metin) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = metin;
}

function yazK3(ad, metin) {
  var kok = k3Kok();
  if (!kok) return;
  kok.querySelectorAll("[data-k3=\"" + ad + "\"]").forEach(function (el) {
    el.textContent = metin;
  });
}

function sayfaBul(sonuc, no) {
  var bulunan = null;
  (sonuc.yerlesim || []).forEach(function (s) {
    if (s.levha === no) bulunan = s;
  });
  if (mod !== "plaka" && bulunan && levhaKaynakAd(bulunan) !== "fire") return null;
  return bulunan;
}

var TEZGAH_MM = 3000;
var TEZGAH_IZGARA_MM = 500;
var TAM_CETVEL_MM = 200;

function tezCerceveCetvelDoldur(tez, ox, oy, olcek, pe, pb) {
  var alt = tez.querySelector(".tez-cetvel-alt");
  var sag = tez.querySelector(".tez-cetvel-sag");
  function bosalt(el) { if (el) el.innerHTML = ""; }
  bosalt(alt);
  bosalt(sag);
  if (!tezZoomAcik() || !(olcek > 0)) return;
  pe = Number(pe) || 1;
  pb = Number(pb) || 1;

  function milNoktalari(maxMm) {
    var dizi = [];
    var mm = 0;
    while (mm <= maxMm + 0.5) {
      dizi.push(mm);
      mm += TAM_CETVEL_MM;
    }
    if (dizi[dizi.length - 1] < maxMm - 0.5) dizi.push(maxMm);
    return dizi;
  }

  function tik(el, yer, px) {
    if (!el) return;
    var t = document.createElement("span");
    t.className = "tez-cet-tik";
    if (yer === "alt") t.style.left = px + "px";
    else t.style.top = px + "px";
    el.appendChild(t);
  }

  function araYazi(el, yer, aMm, bMm, aPx, bPx) {
    if (!el || bMm - aMm < 8) return;
    var y = document.createElement("span");
    y.className = "tez-cet-yazi";
    y.textContent = olcuGoster(bMm);
    var orta = (aPx + bPx) / 2;
    if (yer === "alt") y.style.left = orta + "px";
    else y.style.top = orta + "px";
    el.appendChild(y);
  }

  var i;
  var enler = milNoktalari(pe);
  for (i = 0; i < enler.length; i++) {
    tik(alt, "alt", ox + enler[i] * olcek);
    if (i > 0) {
      araYazi(alt, "alt", enler[i - 1], enler[i], ox + enler[i - 1] * olcek, ox + enler[i] * olcek);
    }
  }
  var boylar = milNoktalari(pb);
  for (i = 0; i < boylar.length; i++) {
    tik(sag, "sag", oy + boylar[i] * olcek);
    if (i > 0) {
      araYazi(sag, "sag", boylar[i - 1], boylar[i], oy + boylar[i - 1] * olcek, oy + boylar[i] * olcek);
    }
  }
}

function tezCetvelAdim(olcek) {
  if (olcek <= 0) return 500;
  var hedef = 70 / olcek;
  var adimlar = [50, 100, 200, 250, 500, 1000];
  var i;
  for (i = 0; i < adimlar.length; i++) {
    if (adimlar[i] >= hedef) return adimlar[i];
  }
  return 1000;
}

function tezSkalaDoldur(el, yatay, olcek, mmMax, adim) {
  if (!el) return;
  el.innerHTML = "";
  function tik(deger) {
    var s = document.createElement("span");
    s.className = "tez-tik";
    if (yatay) s.style.left = (deger * olcek) + "px";
    else s.style.top = (deger * olcek) + "px";
    s.textContent = olcuGoster(deger);
    el.appendChild(s);
  }
  var mm = 0;
  while (mm <= mmMax + 0.5) {
    tik(mm);
    mm += adim;
  }
  if ((mmMax % adim) > 0.5) tik(mmMax);
}

var mercekDurum = { zaman: 0, acik: false, pid: null, x: 0, y: 0, tez: null };
var MERCEK_OLCEK = 2.4;

function mercekCamAl() {
  return document.querySelector(".phone > .tez-mercek-cam");
}

function mercekKapat() {
  if (mercekDurum.zaman) {
    clearTimeout(mercekDurum.zaman);
    mercekDurum.zaman = 0;
  }
  mercekDurum.acik = false;
  mercekDurum.pid = null;
  mercekDurum.tez = null;
  var cam = mercekCamAl();
  if (cam) {
    cam.hidden = true;
    var ic = cam.querySelector(".tez-mercek-ic");
    if (ic) ic.innerHTML = "";
  }
  document.querySelectorAll(".btn-tez-mercek").forEach(function (b) {
    b.classList.remove("basili");
    b.setAttribute("aria-pressed", "false");
  });
}

function mercekDoldur() {
  var phone = document.querySelector(".phone");
  var cam = mercekCamAl();
  var ic = cam && cam.querySelector(".tez-mercek-ic");
  if (!phone || !cam || !ic) return;
  ic.innerHTML = "";
  var kopya = phone.cloneNode(true);
  kopya.classList.add("tez-mercek-kopya");
  var icCam = kopya.querySelector(".tez-mercek-cam");
  if (icCam) icCam.remove();
  ic.appendChild(kopya);
  cam.hidden = false;
}

function mercekCamGuncelle(clientX, clientY) {
  var phone = document.querySelector(".phone");
  var cam = mercekCamAl();
  var kopya = cam && cam.querySelector(".tez-mercek-kopya");
  if (!phone || !cam || !kopya) return;
  var pr = phone.getBoundingClientRect();
  var cap = cam.offsetWidth || 100;
  var r = cap / 2;
  var gx = clientX - r;
  var gy = clientY - r - 40;
  gx = Math.max(pr.left + 2, Math.min(pr.right - cap - 2, gx));
  gy = Math.max(pr.top + 2, Math.min(pr.bottom - cap - 2, gy));
  cam.style.left = gx + "px";
  cam.style.top = gy + "px";
  var fx = (gx + r) - pr.left;
  var fy = (gy + r) - pr.top;
  kopya.style.width = pr.width + "px";
  kopya.style.height = pr.height + "px";
  kopya.style.transform = "translate(" + (r - fx * MERCEK_OLCEK) + "px," +
    (r - fy * MERCEK_OLCEK) + "px) scale(" + MERCEK_OLCEK + ")";
}

function mercekBaslat(ev, btn) {
  mercekKapat();
  mercekDurum.tez = btn.closest(".tez");
  mercekDurum.pid = ev.pointerId;
  mercekDurum.x = ev.clientX;
  mercekDurum.y = ev.clientY;
  btn.classList.add("basili");
  btn.setAttribute("aria-pressed", "true");
  try { btn.setPointerCapture(ev.pointerId); } catch (e) {}
  mercekDurum.zaman = setTimeout(function () {
    mercekDurum.zaman = 0;
    mercekDurum.acik = true;
    mercekDoldur();
    mercekCamGuncelle(mercekDurum.x, mercekDurum.y);
  }, 180);
}

function tezZoomAcik() {
  var kok = k3Kok();
  return !!(kok && kok.classList.contains("k3-tez-zoom"));
}

function tezZoomYaz() {
  var btn = q3(".btn-tez-zoom");
  if (!btn) return;
  var acik = tezZoomAcik();
  btn.textContent = acik ? "Geri" : "Tam";
  btn.setAttribute("aria-label", acik ? "Tezgahı küçült" : "Parçayı ekrana büyüt");
}

function tezZoomDegis() {
  var kok = k3Kok();
  if (!kok) return;
  mercekKapat();
  kok.classList.toggle("k3-tez-zoom");
  tezZoomYaz();
  requestAnimationFrame(function () {
    k3SahneYaz();
  });
}

function tezIndirAdimYaz(ad) {
  var p = document.getElementById("tez-indir-perde");
  if (!p) return;
  p.querySelectorAll(".tez-indir-adim").forEach(function (el) {
    el.hidden = el.getAttribute("data-tez-indir-adim") !== ad;
  });
}

function tezIndirKapat() {
  var p = document.getElementById("tez-indir-perde");
  if (p) p.classList.remove("acik");
  tezIndirAdimYaz("soru");
}

function tezIndir() {
  if (!tezZoomAcik()) return;
  tezIndirAdimYaz("soru");
  var p = document.getElementById("tez-indir-perde");
  if (p) p.classList.add("acik");
}

function tezIndirKanal(tur) {
  tezIndirKapat();
  ciktiKanalSec(tur);
}

function tezOlcekYerles(tez, pe, pb) {
  var sahne = tez.querySelector(".tez-sahne") || tez;
  var zemin = tez.querySelector(".tez-zemin");
  var sx = tez.querySelector(".tez-skala-x");
  var sy = tez.querySelector(".tez-skala-y");
  var et = tez.querySelector(".tez-etiket");
  if (!zemin) return 0;
  tezSahneIzle(tez);
  var zoom = tezZoomAcik();
  var mmX = pe > 0 ? pe : 1;
  var mmY = pb > 0 ? pb : 1;
  var tw = sahne.clientWidth || tez.clientWidth || 358;
  var th = sahne.clientHeight || tez.clientHeight || 280;
  var padL;
  var padR;
  var padT;
  var padB;
  if (zoom) {
    padL = padR = padT = padB = 28;
  } else {
    padL = padR = padT = padB = 4;
  }
  var kw = Math.max(40, tw - padL - padR);
  var kh = Math.max(40, th - padT - padB);
  var olcek = Math.min(kw / mmX, kh / mmY);
  var alanX = mmX * olcek;
  var alanY = mmY * olcek;
  var ox = padL + (kw - alanX) / 2;
  var oy = padT + (kh - alanY) / 2;
  zemin.style.left = ox + "px";
  zemin.style.top = oy + "px";
  zemin.style.width = alanX + "px";
  zemin.style.height = alanY + "px";
  zemin.style.backgroundSize = (TEZGAH_IZGARA_MM * olcek) + "px " +
    (TEZGAH_IZGARA_MM * olcek) + "px";
  if (sx) {
    sx.style.left = ox + "px";
    sx.style.top = (oy + alanY) + "px";
    sx.style.width = alanX + "px";
  }
  if (sy) {
    sy.style.left = (ox - 32) + "px";
    sy.style.top = oy + "px";
    sy.style.width = "32px";
    sy.style.height = alanY + "px";
  }
  if (et) {
    et.style.left = (ox + 4) + "px";
    et.style.top = (oy + 2) + "px";
  }
  if (zoom) tezCerceveCetvelDoldur(tez, ox, oy, olcek, pe, pb);
  return olcek;
}

function cizTezgah(sonuc, no) {
  var kutu = q3(".tez-levha");
  if (!kutu) return;
  var tez = kutu.closest(".tez");
  var sayfa = sayfaBul(sonuc, no);
  var pe = sayfa ? Number(sayfa.panel_en) || 1 : 1;
  var pb = sayfa ? Number(sayfa.panel_boy) || 1 : 1;
  var olcek = tez ? tezOlcekYerles(tez, pe, pb) : 0;
  if (!sayfa || olcek <= 0) {
    kutu.innerHTML = "";
    kutu.classList.remove("damar");
    kutu.style.width = "0";
    kutu.style.height = "0";
    tezSayfaDugmeGuncelle(sonuc, no);
    return;
  }
  kutu.style.width = "100%";
  kutu.style.height = "100%";
  kutu.style.left = "0";
  kutu.style.top = "0";
  kutu.classList.toggle("damar", !!(levhaAktif() && levhaAktif().damarKilidi));
  kutu.innerHTML = levhaIcerikHtml(sonuc, no);
  var enYazi = olcuGoster(pe);
  var boyYazi = olcuGoster(pb);
  if (tez) {
    var u = tez.querySelector(".tez-olcu-ust");
    var s = tez.querySelector(".tez-olcu-sol");
    if (u) u.textContent = enYazi;
    if (s) s.textContent = boyYazi;
  }
  var baslik = tez ? tez.querySelector(".tez-zoom-baslik") : null;
  if (baslik) {
    var sayfalar = mod === "plaka" ? ((sonuc && sonuc.yerlesim) || []) : yerlesimFireSayfa(sonuc);
    var adet = sayfalar.length;
    var tur = mod === "plaka" ? "Plaka" : "Fire-Levha";
    baslik.textContent = adet + " " + tur + " · L" + no + " · " + enYazi + "×" + boyYazi;
  }
  tezSayfaDugmeGuncelle(sonuc, no);
  requestAnimationFrame(function () {
    parcaYaziSigdir(kutu);
  });
}

function tezSayfaListesi(sonuc) {
  return mod === "plaka" ? ((sonuc && sonuc.yerlesim) || []) : yerlesimFireSayfa(sonuc);
}

function tezSayfaDugmeGuncelle(sonuc, no) {
  var sayfalar = tezSayfaListesi(sonuc);
  var i = -1;
  sayfalar.forEach(function (s, idx) {
    if (Number(s.levha) === Number(no)) i = idx;
  });
  var once = q3(".btn-tez-once");
  var sonra = q3(".btn-tez-sonra");
  if (once) once.disabled = i <= 0;
  if (sonra) sonra.disabled = i < 0 || i >= sayfalar.length - 1;
}

function tezSayfaDegis(yon) {
  var sonuc = motorSonucAl();
  if (!sonuc) return;
  var sayfalar = tezSayfaListesi(sonuc);
  var i = -1;
  var no = sayfaNoAl();
  sayfalar.forEach(function (s, idx) {
    if (Number(s.levha) === Number(no)) i = idx;
  });
  if (i < 0) return;
  var j = yon === "once" ? i - 1 : i + 1;
  if (j < 0 || j >= sayfalar.length) return;
  sayfaNoYaz(sayfalar[j].levha);
  cizMotorSonuc(sonuc);
}

function olcuKutuSigar(el, olcu, pad) {
  return olcu.scrollWidth <= el.clientWidth - pad &&
    olcu.scrollHeight <= el.clientHeight - pad;
}

function parcaYaziDene(el, olcu, dik, kucuk, pad, sar) {
  olcu.classList.toggle("boy-dik", !!dik);
  olcu.classList.toggle("kucuk", !!kucuk);
  olcu.classList.toggle("sar", !!sar);
  void olcu.offsetWidth;
  return olcuKutuSigar(el, olcu, pad);
}

function parcaYaziSigdir(kok) {
  if (!kok) return;
  var kutular = kok.querySelectorAll(".p");
  var i;
  var pad = 4;
  for (i = 0; i < kutular.length; i++) {
    var el = kutular[i];
    if (el.closest(".mini")) continue;
    var olcu = el.querySelector(".p-yazi-olcu");
    var sira = el.querySelector(".p-yazi-sira");
    if (!olcu) continue;
    olcu.hidden = false;
    if (sira) sira.hidden = true;
    var dikUzun = el.clientHeight > el.clientWidth;
    var oldu = parcaYaziDene(el, olcu, false, false, pad, false) ||
      parcaYaziDene(el, olcu, false, true, pad, false) ||
      parcaYaziDene(el, olcu, false, false, pad, true) ||
      parcaYaziDene(el, olcu, false, true, pad, true) ||
      (dikUzun && parcaYaziDene(el, olcu, true, false, pad, false)) ||
      (dikUzun && parcaYaziDene(el, olcu, true, true, pad, false));
    if (oldu) continue;
    olcu.hidden = true;
    olcu.classList.remove("boy-dik");
    olcu.classList.remove("kucuk");
    olcu.classList.remove("sar");
    if (sira) sira.hidden = false;
  }
}

function levhaIcerikHtml(sonuc, no) {
  var sayfa = sayfaBul(sonuc, no);
  if (!sayfa) return "";
  var pe = Number(sayfa.panel_en) || 1;
  var pb = Number(sayfa.panel_boy) || 1;
  var html = "";
  (sonuc.fire_envanteri || []).forEach(function (f) {
    if (Number(f.levha) !== Number(no)) return;
    html +=
      "<div class=\"f\" style=\"left:" + ((f.x / pe) * 100) + "%;top:" +
      ((f.y / pb) * 100) + "%;width:" + ((f.en / pe) * 100) + "%;height:" +
      ((f.boy / pb) * 100) + "%\" title=\"" + olcuGoster(f.en) + "×" +
      olcuGoster(f.boy) + "\"><span class=\"f-yazi\">" + olcuGoster(f.en) +
      "×" + olcuGoster(f.boy) + "</span></div>";
  });
  var renkHarita = parcaRenkHarita();
  (sayfa.parcalar || []).forEach(function (p, i) {
    var etiket = p.id || ("P" + (p.sira === undefined ? i + 1 : p.sira));
    var kaynak = parcaListeSatir(etiket);
    var anahtar = kaynak
      ? olcuCiftAnahtar(kaynak.en, kaynak.boy)
      : olcuCiftAnahtar(p.w, p.h);
    var renk = renkHarita[anahtar] || PARCA_RENK[i % PARCA_RENK.length];
    var adet = parcaAdet(kaynak);
    var boyMm = kaynak ? kaynak.boy : (p.h || p.boy);
    var enMm = kaynak ? kaynak.en : (p.w || p.en);
    var olcu = olcuGoster(boyMm) + "×" + olcuGoster(enMm);
    var yazi = olcu + " " + adet;
    var siraNo = kaynak && kaynak.sira != null ? kaynak.sira : (p.sira != null ? p.sira : i + 1);
    var suVar = parcaDamarDurum(kaynak).suVar;
    var sinif = "p";
    if (suVar) sinif += " damar-dik";
    else if (p.donduruldu) sinif += " damar-yatay";
    var pw = Number(p.w) || 0;
    var ph = Number(p.h) || 0;
    var boyYatay = kaynak && kaynak.boy > 0
      ? Math.abs(pw - kaynak.boy) <= Math.abs(ph - kaynak.boy)
      : pw >= ph;
    html +=
      "<div class=\"" + sinif + "\" data-boy=\"" + (boyYatay ? "yatay" : "dik") +
      "\" style=\"left:" + ((p.x / pe) * 100) + "%;top:" +
      ((p.y / pb) * 100) + "%;width:" + ((p.w / pe) * 100) + "%;height:" +
      ((p.h / pb) * 100) + "%;background:" + renk + "\" title=\"" + etiket + " " +
      olcu + " · " + adet + " adet" + (p.donduruldu ? " döndü" : "") + (suVar ? " su yönü" : "") +
      "\"><span class=\"p-yazi p-yazi-olcu\">" + yazi + "</span>" +
      "<span class=\"p-yazi p-yazi-sira\" hidden>" + siraNo + "</span>" +
      bantKenarHtml(kaynak, !!p.donduruldu, p.w, p.h) + "</div>";
  });
  return html + kesimCizgiHtml(sonuc, no, pe, pb);
}

function kesimCizgiHtml(sonuc, no, pe, pb) {
  var indeks = {};
  var sayfa = sayfaBul(sonuc, no);
  ((sayfa && sayfa.parcalar) || []).forEach(function (p) {
    if (p.id) indeks[p.id] = p;
  });
  var html = "";
  (sonuc.kesim_agaci || []).forEach(function (k) {
    if (Number(k.levha) !== Number(no)) return;
    var parcalar = [];
    (k.parca_id_once || []).concat(k.parca_id_sonra || []).forEach(function (id) {
      if (indeks[id]) parcalar.push(indeks[id]);
    });
    if (!parcalar.length) return;
    var konum = Number(k.konum) || 0;
    var sinif = "kesim-cizgi k" + (k.kademe === 1 ? "1" : "2");
    var i;
    if (k.eksen === "x") {
      var y0 = parcalar[0].y;
      var y1 = parcalar[0].y + parcalar[0].h;
      for (i = 1; i < parcalar.length; i++) {
        if (parcalar[i].y < y0) y0 = parcalar[i].y;
        if (parcalar[i].y + parcalar[i].h > y1) y1 = parcalar[i].y + parcalar[i].h;
      }
      html +=
        "<div class=\"" + sinif + " dik\" style=\"left:" + ((konum / pe) * 100) +
        "%;top:" + ((y0 / pb) * 100) + "%;height:" + (((y1 - y0) / pb) * 100) +
        "%\"></div>";
    } else if (k.eksen === "y") {
      var x0 = parcalar[0].x;
      var x1 = parcalar[0].x + parcalar[0].w;
      for (i = 1; i < parcalar.length; i++) {
        if (parcalar[i].x < x0) x0 = parcalar[i].x;
        if (parcalar[i].x + parcalar[i].w > x1) x1 = parcalar[i].x + parcalar[i].w;
      }
      html +=
        "<div class=\"" + sinif + " yatay\" style=\"top:" + ((konum / pb) * 100) +
        "%;left:" + ((x0 / pe) * 100) + "%;width:" + (((x1 - x0) / pe) * 100) +
        "%\"></div>";
    }
  });
  return html;
}

function bantMetraj() {
  var mm = 0;
  ihtiyac().forEach(function (p) {
    (p.bant || []).forEach(function (k) {
      if (k === "boy-sol" || k === "boy-sag") mm += p.boy * p.adet;
      if (k === "en-sol" || k === "en-sag") mm += p.en * p.adet;
    });
  });
  return mm;
}

function cizMotorSonuc(sonuc) {
  plakaHavuzKontrol(sonuc);
  var kok = k3Kok();
  if (!kok) return;
  var serit = q3(".serit");
  var sayfalar = mod === "plaka" ? (sonuc.yerlesim || []) : yerlesimFireSayfa(sonuc);
  if (!sayfalar.length) sayfaNoYaz(1);
  else if (!sayfalar.some(function (s) { return s.levha === sayfaNoAl(); })) {
    sayfaNoYaz(sayfalar[0].levha);
  }

  var yerlesen = 0;
  sayfalar.forEach(function (s) {
    yerlesen += (s.parcalar || []).length;
  });
  var kullanilanM2 = (sonuc.kullanilan_alan_mm2 || 0) / 1000000;
  var fireM2 = (sonuc.net_fire_mm2 || 0) / 1000000;
  var yuzde = typeof sonuc.fire_yuzde === "number" ? sonuc.fire_yuzde : 0;
  if (mod !== "plaka") {
    kullanilanM2 = 0;
    sayfalar.forEach(function (s) {
      (s.parcalar || []).forEach(function (p) {
        kullanilanM2 += ((Number(p.w) || 0) * (Number(p.h) || 0)) / 1000000;
      });
    });
  }

  yazK3("olcu", ihtiyac().length + " satır");
  yazK3("parca", yerlesen + " adet");
  yazK3("alan", fmtOndalik(kullanilanM2) + " m²");
  yazK3("bant", fmtOndalik(bantMetraj() / 1000) + " m");
  var ozet = motorGirdiOzetAl();
  yazK3("levha", levhaK3Yazi(sonuc, ozet && ozet.levha_kalinlik));
  yazK3("sema", k3SemaYazi(sonuc));
  yazK3("fire", fmtOndalik(fireM2) + " m²  %" + Math.round(yuzde));
  var havuzGitti = k3FireGittiOzetDeger(sonuc);
  if (havuzGitti) yazK3("havuz-gitti", havuzGitti);
  yazK3("toplam", havuzToplamTlYazi());

  var not = q3(".k3-not");
  if (not && ozet) {
    not.textContent = ozet.damar_kilidi
      ? "Su yönü sabit, döndürme yok."
      : "Döndürme serbest.";
  }

  if (serit) {
    serit.innerHTML = sayfalar.map(function (s) {
      var sec = s.levha === sayfaNoAl() ? " sec" : "";
      return (
        "<div class=\"mini" + sec + "\" data-sayfa=\"" + s.levha + "\">" +
        "<span class=\"mini-ad\">" +
        (levhaKaynakAd(s) === "fire" ? "Fire " : "Tam ") +
        olcuGoster(s.panel_en) + "×" + olcuGoster(s.panel_boy) + "</span>" +
        "<div class=\"mini-govde\"><div class=\"mini-levha\">" +
        levhaIcerikHtml(sonuc, s.levha) +
        "</div></div></div>"
      );
    }).join("");
  }

  cizTezgah(sonuc, sayfaNoAl());
  fireSigmayanYazi(sonuc);
  plakaHavuzYazi();
}

function motorBayat() {
  modulVeriKaydet();
  if (!motorSonucAl()) return;
  motorSonucYaz(null);
  motorGirdiOzetYaz(null);
  motorKesimYaz(null);
  M().senaryoGecmis = [];
  M().senaryoIx = 0;
  M().senaryoBitti = false;
  M().plakaHavuz = null;
  senaryoDugmeYaz();
  sayfaNoYaz(1);
  cizListe();
  var not = q3(".k3-not");
  if (not) not.textContent = "Düzeltme kesilecek listedeki ⚙ ile yapılır.";
  yazK3("olcu", ihtiyac().length + " satır");
  yazK3("parca", "0 adet");
  yazK3("alan", "0,00 m²");
  yazK3("bant", "0,00 m");
  yazK3("levha", "0 levha");
  yazK3("sema", "—");
  yazK3("fire", "0,00 m²");
  yazK3("havuz-gitti", "0,00 m²");
  yazK3("toplam", havuzToplamTlYazi());
  var serit = q3(".serit");
  if (serit) serit.innerHTML = "";
  var kutu = q3(".tez-levha");
  if (kutu) {
    kutu.innerHTML = "";
    kutu.classList.remove("damar");
  }
  fireSigmayanYazi(null);
  plakaHavuzYazi();
}

function cizDurum() {
  var baslik = document.getElementById("baslik");
  var k0on = document.getElementById("k0") && document.getElementById("k0").classList.contains("on");
  if (baslik) {
    if (k0on) baslik.textContent = "Ebatlama";
    else baslik.textContent = mod === "plaka" ? "Plaka Ebatlama" : "Fire Ebatlama";
  }
  kimlikListeYaz();
  if (motorSonucAl()) cizMotorSonuc(motorSonucAl());
}

function git(id) {
  mercekKapat();
  bildirTemiz();
  var hedef = document.getElementById(id);
  if (!hedef) return;
  var once = document.querySelector(".ekran.on");
  if (once && once.id === "k1-fire-ekle") havuzKalinlikKaydet();
  if (once && once.id === "k1-plaka-ekle" && id === "k1-plaka") {
    if (!levhaKaydet({ sayfa: true })) return;
  }
  document.querySelectorAll(".ekran").forEach(function (e) {
    e.classList.remove("on");
  });
  hedef.classList.add("on");
  document.querySelectorAll(".cekmece.acik").forEach(function (c) {
    c.classList.remove("acik");
  });
  document.querySelectorAll(".perde.acik").forEach(function (p) {
    p.classList.remove("acik");
  });
  paylasBekleyen = "";
  if (id === "k1-fire" || id === "k1-fire-ekle") cizHavuz();
  if (id === "k1-fire-ekle") {
    havuzKalinlikYaz();
    fireDamarYaz();
  }
  if (id === "k1-plaka-ekle") {
    mod = "plaka";
    levhaFormDoldur();
  }
  if (id === k2Id() || id === k3Id()) {
    cizListe();
    if (id === k3Id()) {
      k3SahneYaz();
      if (motorSonucAl()) cizMotorSonuc(motorSonucAl());
    }
  }
  if (id === "k0") {
    var b = document.getElementById("baslik");
    if (b) b.textContent = "Ebatlama";
  }
}

document.addEventListener("pointerdown", function (ev) {
  var btn = ev.target.closest(".btn-tez-mercek");
  if (!btn) return;
  ev.preventDefault();
  mercekBaslat(ev, btn);
});
document.addEventListener("pointermove", function (ev) {
  if (mercekDurum.pid !== ev.pointerId) return;
  mercekDurum.x = ev.clientX;
  mercekDurum.y = ev.clientY;
  if (mercekDurum.acik) mercekCamGuncelle(ev.clientX, ev.clientY);
});
document.addEventListener("pointerup", function (ev) {
  if (mercekDurum.pid === ev.pointerId) mercekKapat();
});
document.addEventListener("pointercancel", function (ev) {
  if (mercekDurum.pid === ev.pointerId) mercekKapat();
});

document.addEventListener("click", function (ev) {
  if (ev.target.closest(".btn-tez-mercek")) {
    ev.preventDefault();
    return;
  }
  var cek = ev.target.closest("[data-cekmece]");
  if (cek) {
    var kutu = document.getElementById(cek.getAttribute("data-cekmece"));
    if (kutu) kutu.classList.toggle("acik");
    return;
  }
  if (ev.target.closest(".btn-tez-zoom")) {
    tezZoomDegis();
    return;
  }
  if (ev.target.closest(".btn-tez-indir")) {
    tezIndir();
    return;
  }
  if (ev.target.closest("#btn-tez-indir-evet")) {
    tezIndirKapat();
    ciktiMenuAc();
    return;
  }
  if (ev.target.closest("#btn-tez-indir-vazgec") || ev.target.id === "tez-indir-perde") {
    tezIndirKapat();
    return;
  }
  var tezIndirKanalBtn = ev.target.closest("[data-tez-indir-kanal]");
  if (tezIndirKanalBtn) {
    tezIndirKanal(tezIndirKanalBtn.getAttribute("data-tez-indir-kanal"));
    return;
  }
  if (ev.target.closest(".btn-tez-once")) {
    tezSayfaDegis("once");
    return;
  }
  if (ev.target.closest(".btn-tez-sonra")) {
    tezSayfaDegis("sonra");
    return;
  }
  if (ev.target.closest(".btn-sigmayan")) {
    k3SigmayanDegis();
    return;
  }
  if (ev.target.closest(".btn-k3-perde")) {
    k3PerdeDegis();
    return;
  }
  if (ev.target.closest(".btn-senaryo-once")) {
    senaryoOnce();
    return;
  }
  if (ev.target.closest(".btn-senaryo")) {
    senaryoIste();
    return;
  }
  if (ev.target.closest(".btn-k1-parca")) {
    isBilgiAc();
    return;
  }
  if (ev.target.closest("#btn-is-bilgi-iptal")) {
    isBilgiKapat();
    return;
  }
  if (ev.target.closest("#btn-is-bilgi-ok")) {
    isBilgiKaydet();
    return;
  }
  if (ev.target.id === "is-bilgi-perde") {
    isBilgiKapat();
    return;
  }
  if (ev.target.closest("#btn-ekle")) {
    havuzaEkle("f-boy", "f-en", "f-adet");
    return;
  }
  var havuzSilBtn = ev.target.closest("[data-havuz-sil]");
  if (havuzSilBtn) {
    havuzSilSor(Number(havuzSilBtn.getAttribute("data-havuz-sil")));
    return;
  }
  var listeSilBtn = ev.target.closest("[data-liste-sil]");
  if (listeSilBtn) {
    listeSilSor(Number(listeSilBtn.getAttribute("data-liste-sil")));
    return;
  }
  if (ev.target.closest("#btn-havuz-sil-ok")) {
    havuzSilOnay();
    return;
  }
  if (ev.target.closest("#btn-havuz-sil-iptal") || ev.target.id === "havuz-sil-perde") {
    havuzSilKapat();
    return;
  }
  if (ev.target.closest("#btn-fiyat-kaydet")) {
    fiyatFormKaydet();
    return;
  }
  var fiyatSilBtn = ev.target.closest("[data-fiyat-sil]");
  if (fiyatSilBtn) {
    fiyatSil(fiyatSilBtn.getAttribute("data-fiyat-sil"));
    return;
  }
  if (ev.target.closest("#btn-havuz-ekle")) {
    havuzaEkle("h-boy", "h-en", "h-adet");
    return;
  }
  if (ev.target.closest(".btn-ekle-parca")) {
    ekleAc();
    return;
  }
  if (ev.target.closest(".btn-ocr")) {
    ocrUyarisi();
    return;
  }
  if (ev.target.closest("#btn-ocr-kapat") || ev.target.id === "ocr-perde") {
    ocrUyarisiKapat();
    return;
  }
  if (ev.target.closest(".btn-havuz-ayar")) {
    if (mod === "plaka") return;
    git("k1-fire-ekle");
    cizDurum();
    return;
  }
  if (ev.target.closest("#btn-havuz-kapat")) {
    havuzKapat();
    return;
  }
  if (ev.target.closest("#btn-ana-ayar")) {
    birimAc();
    return;
  }
  if (ev.target.closest("#btn-bildir-mic")) {
    bildirKayitAc();
    return;
  }
  if (ev.target.closest("#btn-bildir-gonder")) {
    bildirGonder();
    return;
  }
  var ayarGit = ev.target.closest("[data-ayar-git]");
  if (ayarGit) {
    atolyeSayfa(ayarGit.getAttribute("data-ayar-git"));
    return;
  }
  if (ev.target.closest("[data-ayar-kapat]") || ev.target.id === "atolye-perde") {
    birimKapat();
    return;
  }
  if (ev.target.closest("#btn-deneme")) {
    denemeYukle();
    return;
  }
  if (ev.target.closest("#btn-deneme-sil")) {
    denemeTemizle();
    return;
  }
  if (ev.target.closest(".btn-levha-ayar")) {
    git("k1-plaka-ekle");
    cizDurum();
    return;
  }
  if (ev.target.closest(".btn-ozel-olcu")) {
    ozelOlcuAc();
    return;
  }
  var birimBtn = ev.target.closest("[data-birim-sec]");
  if (birimBtn) {
    birimSec(birimBtn.getAttribute("data-birim-sec"));
    return;
  }
  var damarBtn = ev.target.closest(".l-damar");
  if (damarBtn) {
    var acik = anahtarAcikCevir(damarBtn);
    damarBtn.setAttribute("aria-pressed", acik ? "true" : "false");
    if (damarBtn.closest("#k1-fire-ekle") || damarBtn.closest("#k1-plaka-ekle")) {
      var L = levhaAktif() || levhaBos();
      levhaAktifYaz({
        en: L.en,
        boy: L.boy,
        kalinlik: L.kalinlik,
        damarKilidi: acik
      }, true);
      levhaDepoya();
      modulVeriKaydet();
      motorBayat();
    }
    return;
  }
  if (ev.target.closest(".btn-levha-iptal")) {
    levhaKapat();
    return;
  }
  if (ev.target.closest(".btn-levha-ok")) {
    levhaKaydet();
    return;
  }
  if (ev.target.closest(".btn-ayar-iptal")) {
    ayarKapat();
    return;
  }
  if (ev.target.closest(".btn-ayar-ok")) {
    ayarKaydet();
    return;
  }
  if (ev.target.closest(".btn-hesapla")) {
    motorHesapla();
    return;
  }
  if (ev.target.closest(".btn-cikti-ac")) {
    ciktiMenuAc();
    return;
  }
  var ciktiKanal = ev.target.closest("[data-cikti-kanal]");
  if (ciktiKanal) {
    ciktiKanalSec(ciktiKanal.getAttribute("data-cikti-kanal"));
    return;
  }
  if (ev.target.closest("#btn-cikti-ok")) {
    ciktiFormGonder();
    return;
  }
  if (ev.target.closest("#btn-cikti-secim-ok")) {
    ciktiFormGonder();
    return;
  }
  if (ev.target.closest("#btn-cikti-secim-geri")) {
    paylasBekleyen = "";
    ciktiAdimYaz("menu");
    return;
  }
  var ciktiKalem = ev.target.closest("#cikti-secim-liste input[data-cikti-kalem]");
  if (ciktiKalem) {
    if (ciktiKalem.getAttribute("data-cikti-kalem") === "tumu") {
      var on = ciktiKalem.checked;
      ciktiSecimKutular().forEach(function (el) { el.checked = on; });
    } else {
      ciktiTumuAyarla();
    }
    return;
  }
  if (ev.target.id === "cikti-perde") {
    ciktiPerdeKapat();
    return;
  }
  if (ev.target.closest("#btn-kimlik-ok")) {
    if (kimlikKaydet()) paylasYap();
    return;
  }
  if (ev.target.id === "kimlik-perde") {
    kimlikModalKapat();
    return;
  }
  var sayfaBtn = ev.target.closest("[data-sayfa]");
  if (sayfaBtn && motorSonucAl()) {
    sayfaNoYaz(Number(sayfaBtn.getAttribute("data-sayfa")));
    cizMotorSonuc(motorSonucAl());
    return;
  }
  var disli = ev.target.closest("[data-ayar]");
  if (disli) {
    satirAyarAc(Number(disli.getAttribute("data-ayar")));
    return;
  }
  var parcaDamarBtn = ev.target.closest("[data-parca-damar]");
  if (parcaDamarBtn) {
    parcaDamarYaz(anahtarAcikCevir(parcaDamarBtn));
    return;
  }
  var btn = ev.target.closest("[data-git]");
  if (btn) {
    var yeniMod = btn.getAttribute("data-mod");
    if (yeniMod) mod = yeniMod;
    var hedef = btn.getAttribute("data-git");
    git(hedef);
    cizDurum();
    return;
  }
  var kenar = ev.target.closest(".kenar");
  if (kenar) {
    kenar.classList.toggle("yan");
    return;
  }
  var k = ev.target.closest("[data-kenara]");
  if (k) {
    var ix = Number(k.getAttribute("data-kenara"));
    if (ix >= 0 && ix < FIRE.havuz.length) FIRE.kenara.push(FIRE.havuz.splice(ix, 1)[0]);
    cizHavuz();
    motorBayat();
    return;
  }
  var g = ev.target.closest("[data-geri]");
  if (g) {
    var gx = Number(g.getAttribute("data-geri"));
    if (gx >= 0 && gx < FIRE.kenara.length) FIRE.havuz.push(FIRE.kenara.splice(gx, 1)[0]);
    cizHavuz();
    motorBayat();
  }
});

document.addEventListener("change", function (ev) {
  if (ev.target && ev.target.classList && ev.target.classList.contains("levha-preset")) {
    presetSecildi();
  }
  if (ev.target && ev.target.id === "m-yasal") kimlikKilitYenile();
  if (ev.target && ev.target.id === "f-kalinlik") {
    havuzKalinlikKaydet();
  }
});

document.addEventListener("input", function (ev) {
  if (ev.target && ev.target.id === "f-kalinlik") {
    var t = String(ev.target.value).replace(/[^\d]/g, "");
    if (ev.target.value !== t) ev.target.value = t;
  }
  if (ev.target && (ev.target.id === "m-ad" || ev.target.id === "m-telefon")) {
    kimlikKilitYenile();
  }
  if (ev.target && ev.target.closest && ev.target.closest(".musteri-kart") &&
      (ev.target.classList.contains("is-ad") ||
       ev.target.classList.contains("is-tel") ||
       ev.target.classList.contains("is-adres"))) {
    musteriKaydetKart();
    ciktiOkKilit();
    if (musteriAdVar()) musteriUyari(false);
  }
});

levhaYukle();
kimlikYukle();
fiyatYukle();
modulVeriYukle();
damarGirisPasif();
birimElle = birimYukle();
denemeYaz();
cizDurum();
birimYaz();
ayarlariCek();
motorDurumCek();
