(function (kok) {
  var ANAHTAR = "magi_olcu_birim";

  function oku() {
    return localStorage.getItem(ANAHTAR) === "cm" ? "cm" : "mm";
  }

  function yaz(birim) {
    localStorage.setItem(ANAHTAR, birim === "cm" ? "cm" : "mm");
  }

  function sayi(ham) {
    var s = String(ham == null ? "" : ham).trim().replace(",", ".");
    if (!s) return null;
    var n = parseFloat(s);
    if (!(n > 0)) return null;
    return n;
  }

  function mmAl(goster) {
    var n = sayi(goster);
    if (n == null) return "";
    if (oku() === "cm") n = n * 10;
    return String(Math.round(n * 10) / 10);
  }

  function goster(mm) {
    var n = sayi(mm);
    if (n == null) return "";
    if (oku() === "cm") {
      n = n / 10;
      return String(Math.round(n * 10) / 10);
    }
    return String(Math.round(n));
  }

  function yazi(mm) {
    var g = goster(mm);
    return g ? g + " " + oku() : "";
  }

  function etiketYaz() {
    var ad = oku();
    var n = document.getElementsByClassName("birimAd");
    var i;
    for (i = 0; i < n.length; i++) n[i].textContent = ad;
  }

  kok.MagiOlcu = {
    oku: oku,
    yaz: yaz,
    mmAl: mmAl,
    goster: goster,
    yazi: yazi,
    etiketYaz: etiketYaz
  };
})(window);
