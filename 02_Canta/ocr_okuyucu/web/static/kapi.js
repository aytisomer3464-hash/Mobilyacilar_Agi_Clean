(function () {
  var BULUT = "https://cloud-bridge-470702229392.europe-west1.run.app";
  var ZAMAN_MS = 75000;

  function yerelSunucu() {
    var h = String(location.hostname || "");
    var p = String(location.port || "");
    if (h === "127.0.0.1" || h === "localhost" || h === "[::1]") return true;
    if (p === "8765" || p === "8080") return true;
    return false;
  }

  function magiUrl(yol) {
    if (!yol) return yerelSunucu() ? location.origin : BULUT;
    if (yol.charAt(0) !== "/") yol = "/" + yol;
    if (yerelSunucu()) return yol;
    return BULUT + yol;
  }

  function jsonYanit(kod, detail, status) {
    return new Response(
      JSON.stringify({
        kod: kod,
        detail: detail,
        hazir: false,
        kesim_listesi: [],
        lan_adresleri: [],
      }),
      { status: status, headers: { "Content-Type": "application/json" } }
    );
  }

  function agKodu(hata) {
    var metin = String((hata && hata.message) || hata || "").toLowerCase();
    if (metin.indexOf("cors") !== -1) return "cors";
    return "ag";
  }

  window.MAGI_API_KOK = yerelSunucu() ? location.origin : BULUT;
  window.MAGI_apiUrl = magiUrl;
  window.MAGI_istek = async function (yol, secenekler) {
    var ham = secenekler || {};
    var zamanMs = ham.magiTimeoutMs == null ? ZAMAN_MS : ham.magiTimeoutMs;
    var dis = ham.signal;
    var ctrl = new AbortController();
    var zamanlayici = null;
    if (zamanMs > 0) {
      zamanlayici = setTimeout(function () {
        try { ctrl.abort("zaman_asimi"); } catch (e) {}
      }, zamanMs);
    }
    if (dis) {
      if (dis.aborted) ctrl.abort("iptal");
      else dis.addEventListener("abort", function () { ctrl.abort("iptal"); }, { once: true });
    }
    var opts = {};
    Object.keys(ham).forEach(function (k) {
      if (k !== "magiTimeoutMs" && k !== "magiTekrar" && k !== "signal") opts[k] = ham[k];
    });
    opts.signal = ctrl.signal;
    try {
      var yanit = await fetch(magiUrl(yol), opts);
      var tur = (yanit.headers.get("content-type") || "").toLowerCase();
      if (tur.indexOf("text/html") !== -1) {
        return jsonYanit("html_spa", "Köprü HTML döndü", 502);
      }
      return yanit;
    } catch (e) {
      try { console.warn("MAGI_istek", yol, e && e.name, e && e.message ? e.message : e); } catch (_) {}
      if (dis && dis.aborted) throw e;
      if ((e && e.name === "AbortError") || String(ctrl.signal.reason || "") === "zaman_asimi") {
        return jsonYanit("zaman_asimi", "Köprü zaman aşımı.", 504);
      }
      var kod = agKodu(e);
      return jsonYanit(kod, kod === "cors" ? "Köprü CORS engeli." : "Köprüye ulaşılamadı.", 503);
    } finally {
      if (zamanlayici) clearTimeout(zamanlayici);
    }
  };
})();
