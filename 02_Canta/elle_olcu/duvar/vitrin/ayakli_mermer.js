(function () {
  var KASA_ANAHTAR = "magi_atolye_kasa";
  var PROFIL_ANAHTAR = "magi_usta_profil";
  var STANDART = {
    ayak_arasi: "620",
    ayak_kalinlik: "20",
    ayak_yukseklik: "880",
    mermer_kalinlik: "20"
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
    if (!u.ayakli_mermer || typeof u.ayakli_mermer !== "object") u.ayakli_mermer = {};
    return { kasa: kasa, u: u };
  }

  function yaz(metin, hata) {
    var n = document.getElementById("durum");
    if (!n) return;
    n.textContent = metin || "";
    n.classList.toggle("hata", !!hata);
  }

  function doldur() {
    var O = window.MagiOlcu;
    O.etiketYaz();
    var a = ustaKasasi().u.ayakli_mermer || {};
    document.getElementById("ayakArasi").value = O.goster(a.ayak_arasi || STANDART.ayak_arasi);
    document.getElementById("ayakKalinlik").value = O.goster(a.ayak_kalinlik || STANDART.ayak_kalinlik);
    document.getElementById("ayakYukseklik").value = O.goster(a.ayak_yukseklik || STANDART.ayak_yukseklik);
    document.getElementById("mermerKalinlik").value = O.goster(a.mermer_kalinlik || STANDART.mermer_kalinlik);
  }

  function duvarDon() {
    window.location.href = "./duvar.html";
  }

  document.getElementById("geriBtn").addEventListener("click", duvarDon);
  document.getElementById("altGeri").addEventListener("click", duvarDon);
  document.getElementById("kaydetBtn").addEventListener("click", function () {
    var paket = ustaKasasi();
    var O = window.MagiOlcu;
    paket.u.ayakli_mermer = {
      ayak_arasi: O.mmAl(document.getElementById("ayakArasi").value),
      ayak_kalinlik: O.mmAl(document.getElementById("ayakKalinlik").value),
      ayak_yukseklik: O.mmAl(document.getElementById("ayakYukseklik").value),
      mermer_kalinlik: O.mmAl(document.getElementById("mermerKalinlik").value)
    };
    kasaYaz(paket.kasa);
    yaz("Ayaklı mermer kasaya yazıldı.", false);
  });

  doldur();
})();
