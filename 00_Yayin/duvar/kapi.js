(function () {
  var KASA_ANAHTAR = "magi_atolye_kasa";
  var PROFIL_ANAHTAR = "magi_usta_profil";
  var camSec = "";
  var modelSec = "";

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
    if (!u.kapi || typeof u.kapi !== "object") u.kapi = {};
    return { kasa: kasa, u: u };
  }

  function yaz(metin, hata) {
    var n = document.getElementById("durum");
    if (!n) return;
    n.textContent = metin || "";
    n.classList.toggle("hata", !!hata);
  }

  function camGoster() {
    document.getElementById("camliBtn").classList.toggle("acik", camSec === "camli");
    document.getElementById("camsizBtn").classList.toggle("acik", camSec === "camsiz");
  }

  function modelGoster() {
    document.getElementById("kentliBtn").classList.toggle("acik", modelSec === "Kentli");
    document.getElementById("duzBtn").classList.toggle("acik", modelSec === "Düz");
  }

  var STANDART = { en: "900", boy: "2100", yukseklik: "80", kasa_kalinlik: "18" };

  function doldur() {
    var O = window.MagiOlcu;
    O.etiketYaz();
    var k = ustaKasasi().u.kapi || {};
    document.getElementById("kapiEn").value = O.goster(k.en || STANDART.en);
    document.getElementById("kapiBoy").value = O.goster(k.boy || STANDART.boy);
    document.getElementById("kapiYukseklik").value = O.goster(k.yukseklik || STANDART.yukseklik);
    document.getElementById("kasaKalinlik").value = O.goster(k.kasa_kalinlik || STANDART.kasa_kalinlik);
    document.getElementById("kapiModel").value = k.model || "";
    camSec = k.cam || "";
    modelSec = k.model_sec || "";
    camGoster();
    modelGoster();
  }

  function zeminDon() {
    window.location.href = "./zemin.html";
  }

  function camTikla(deger) {
    camSec = camSec === deger ? "" : deger;
    camGoster();
  }

  function modelTikla(deger) {
    modelSec = modelSec === deger ? "" : deger;
    if (modelSec) document.getElementById("kapiModel").value = modelSec;
    modelGoster();
  }

  document.getElementById("geriBtn").addEventListener("click", zeminDon);
  document.getElementById("altGeri").addEventListener("click", zeminDon);
  document.getElementById("camliBtn").addEventListener("click", function () { camTikla("camli"); });
  document.getElementById("camsizBtn").addEventListener("click", function () { camTikla("camsiz"); });
  document.getElementById("kentliBtn").addEventListener("click", function () { modelTikla("Kentli"); });
  document.getElementById("duzBtn").addEventListener("click", function () { modelTikla("Düz"); });
  document.getElementById("kaydetBtn").addEventListener("click", function () {
    var paket = ustaKasasi();
    var O = window.MagiOlcu;
    paket.u.kapi = {
      en: O.mmAl(document.getElementById("kapiEn").value),
      boy: O.mmAl(document.getElementById("kapiBoy").value),
      yukseklik: O.mmAl(document.getElementById("kapiYukseklik").value),
      kasa_kalinlik: O.mmAl(document.getElementById("kasaKalinlik").value),
      cam: camSec,
      model_sec: modelSec,
      model: String(document.getElementById("kapiModel").value || "").trim()
    };
    kasaYaz(paket.kasa);
    yaz("Kapı kasaya yazıldı.", false);
  });

  doldur();
})();
