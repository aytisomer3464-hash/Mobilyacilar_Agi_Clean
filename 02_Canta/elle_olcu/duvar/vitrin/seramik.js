(function () {
  var KASA_ANAHTAR = "magi_atolye_kasa";
  var PROFIL_ANAHTAR = "magi_usta_profil";

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
    if (!u.seramik || typeof u.seramik !== "object") u.seramik = {};
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
    var s = ustaKasasi().u.seramik || {};
    document.getElementById("seramikRenk").value = s.renk || "";
    document.getElementById("seramikDesen").value = s.desen || "";
    document.getElementById("seramikEn").value = O.goster(s.en || "");
    document.getElementById("seramikBoy").value = O.goster(s.boy || "");
  }

  function zeminDon() {
    window.location.href = "./zemin.html";
  }

  document.getElementById("geriBtn").addEventListener("click", zeminDon);
  document.getElementById("altGeri").addEventListener("click", zeminDon);
  document.getElementById("kaydetBtn").addEventListener("click", function () {
    var paket = ustaKasasi();
    var O = window.MagiOlcu;
    paket.u.seramik = {
      renk: String(document.getElementById("seramikRenk").value || "").trim(),
      desen: String(document.getElementById("seramikDesen").value || "").trim(),
      en: O.mmAl(document.getElementById("seramikEn").value),
      boy: O.mmAl(document.getElementById("seramikBoy").value)
    };
    kasaYaz(paket.kasa);
    yaz("Seramik kasaya yazıldı.", false);
  });

  doldur();
})();
