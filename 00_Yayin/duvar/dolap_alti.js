(function () {
  var KASA_ANAHTAR = "magi_atolye_kasa";
  var PROFIL_ANAHTAR = "magi_usta_profil";
  var STANDART = { derinlik: "600", yukseklik: "20" };
  var yukSec = "";

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
    if (!u.dolap_alti || typeof u.dolap_alti !== "object") u.dolap_alti = {};
    return { kasa: kasa, u: u };
  }

  function yaz(metin, hata) {
    var n = document.getElementById("durum");
    if (!n) return;
    n.textContent = metin || "";
    n.classList.toggle("hata", !!hata);
  }

  function yukGoster() {
    document.getElementById("yuk2").classList.toggle("acik", yukSec === "20");
    document.getElementById("yuk4").classList.toggle("acik", yukSec === "40");
  }

  function doldur() {
    var O = window.MagiOlcu;
    O.etiketYaz();
    var d = ustaKasasi().u.dolap_alti || {};
    document.getElementById("derinlik").value = O.goster(d.derinlik || STANDART.derinlik);
    document.getElementById("yukseklik").value = O.goster(d.yukseklik || STANDART.yukseklik);
    yukSec = d.yukseklik === "40" ? "40" : (d.yukseklik === "20" || !d.yukseklik ? "20" : "");
    yukGoster();
  }

  function zeminDon() {
    window.location.href = "./zemin.html";
  }

  function yukAyar(mm) {
    var O = window.MagiOlcu;
    yukSec = mm;
    document.getElementById("yukseklik").value = O.goster(mm);
    yukGoster();
  }

  document.getElementById("geriBtn").addEventListener("click", zeminDon);
  document.getElementById("altGeri").addEventListener("click", zeminDon);
  document.getElementById("yuk2").addEventListener("click", function () { yukAyar("20"); });
  document.getElementById("yuk4").addEventListener("click", function () { yukAyar("40"); });
  document.getElementById("kaydetBtn").addEventListener("click", function () {
    var paket = ustaKasasi();
    var O = window.MagiOlcu;
    paket.u.dolap_alti = {
      derinlik: O.mmAl(document.getElementById("derinlik").value),
      yukseklik: O.mmAl(document.getElementById("yukseklik").value)
    };
    kasaYaz(paket.kasa);
    yaz("Yükselti kasaya yazıldı.", false);
  });

  doldur();
})();
