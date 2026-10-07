(function () {
  const cekmece = document.getElementById("cekmece");
  const cekmecePerde = document.getElementById("cekmecePerde");
  const cantaDock = document.getElementById("cantaDock");
  const cantaBtn = document.getElementById("cantaBtn");
  const cantaAletler = document.getElementById("cantaAletler");
  const cantaPerde = document.getElementById("cantaPerde");
  const araForm = document.getElementById("araForm");
  const araDurum = document.getElementById("araDurum");
  const ocrLink = document.getElementById("ocrLink");
  const ebatlamaLink = document.getElementById("ebatlamaLink");
  const modTelefon = document.getElementById("modTelefon");
  const modMasa = document.getElementById("modMasa");
  const hesapDialog = document.getElementById("hesapDialog");
  const hesapOzet = document.getElementById("hesapOzet");
  const adimBasla = document.getElementById("adimBasla");
  const adimProfil = document.getElementById("adimProfil");
  const ustaAd = document.getElementById("ustaAd");
  const ustaDukkan = document.getElementById("ustaDukkan");
  const ustaTel = document.getElementById("ustaTel");
  const kayitBtn = document.getElementById("kayitBtn");
  const cantaDon = document.getElementById("cantaDon");
  const ebatlamaPanel = document.getElementById("ebatlamaPanel");
  const ocrPanel = document.getElementById("ocrPanel");
  const telPanel = document.getElementById("telPanel");
  const ebatHesap = document.getElementById("ebatHesap");
  const ebatSonuc = document.getElementById("ebatSonuc");
  const karaKutuBtn = document.getElementById("karaKutuBtn");
  const karaKutuPanel = document.getElementById("karaKutuPanel");
  const karaPerde = document.getElementById("karaPerde");
  const karaModul = document.getElementById("karaModul");
  const karaMetin = document.getElementById("karaMetin");
  const karaDurum = document.getElementById("karaDurum");
  const karaListe = document.getElementById("karaListe");
  const karaGonderBtn = document.getElementById("karaGonder");
  const adimDogrula = document.getElementById("adimDogrula");
  const dogrulaAd = document.getElementById("dogrulaAd");
  const dogrulaTel = document.getElementById("dogrulaTel");
  const dogrulaKod = document.getElementById("dogrulaKod");
  const kodGoster = document.getElementById("kodGoster");
  const PROFIL_ANAHTAR = "magi_usta_profil";
  const SERBEST_KULLANIM = 3;
  const HATIRLATMA_ESIK = [3, 4, 6, 9, 13, 18, 24, 32, 42];
  const MOD_ANAHTAR = "magi_ekran_mod";
  const KARA_ANAHTAR = "magi_kara_kutu";
  const MODUL_AD = {
    meydan: "Sanayi Meydanı",
    istihdam: "İstihdam / İş İlanları",
    "ikinci-el": "İkinci El Pazarı",
    reklam: "Reklam ve Sponsor",
    usta: "Usta Kayıt ve Profil",
    programlar: "Programlar",
    iletisim: "Adres ve İletişim",
  };
  const BULUT_OCR = "/okuyucu/";
  const BULUT_EBATLAMA = "/ebatlama/";
  const BULUT_ELLE = "/duvar/";
  const BULUT_TEL = "/tel/";
  const CANLI_KOK = "https://mobilyaci-agi.web.app";
  function kapiOrigin() {
    if (location.protocol === "http:" || location.protocol === "https:") {
      return location.origin;
    }
    return CANLI_KOK;
  }
  function ocrVarsayilan() {
    return new URL(BULUT_OCR, kapiOrigin() + "/").href;
  }
  function ebatlamaVarsayilan() {
    return new URL(BULUT_EBATLAMA, kapiOrigin() + "/").href;
  }
  function elleVarsayilan() {
    return new URL(BULUT_ELLE, kapiOrigin() + "/").href;
  }
  function telVarsayilan() {
    return new URL(BULUT_TEL, kapiOrigin() + "/").href;
  }
  const VARSAYILAN_OCR = ocrVarsayilan();
  const VARSAYILAN_EBATLAMA = ebatlamaVarsayilan();
  const VARSAYILAN_ELLE = elleVarsayilan();
  const VARSAYILAN_TEL = telVarsayilan();
  function kapiAc(url) {
    kullanimSay();
    const pencere = window.open(url, "_blank", "noopener,noreferrer");
    if (!pencere) window.location.assign(url);
  }
  window.addEventListener("error", (ev) => {
    try {
      const havuz = karaHavuzOku();
      const metin = String(ev.message || "JS hata");
      if (havuz[0] && havuz[0].metin === metin) return;
      havuz.unshift({
        id: Date.now(),
        zaman: new Date().toISOString(),
        modul: "sistem",
        modulAd: "Kara kutu",
        metin,
      });
      karaHavuzYaz(havuz);
    } catch (_) {
      /* kara kutu dolsa da sayfa açık kalır */
    }
  });
  const CANTA_MS = 1000;
  const CANTA_ORTA_MS = 350;
  const CANTA_KAPAN_MS = 300;
  const USTA_TOST_MS = 3000;
  const cerceve = document.getElementById("cerceve");
  const ustaTost = document.getElementById("ustaTost");
  let cantaKilit = false;
  let cantaZaman = 0;
  let sesCtx = null;
  let meydanOtp = "";
  let meydanBekleyen = "";
  let ilanBekleyenTur = "is";
  let panoBekleyenMetin = "";
  let ustaTostZaman = 0;
  let karaBaglam = { id: "meydan", ad: "Sanayi Meydanı" };
  let karaDinleyici = null;
  let karaSessizlik = 0;
  let karaSatirlar = [];
  let karaCanli = "";
  let karaKesin = "";
  let karaDurIstek = false;
  let karaYeniden = 0;
  let cekmeceCantaIcinKapandi = false;
  const KARA_SESSIZ_MS = 7000;
  const KARA_YENIDEN_TAVAN = 40;

  function cantaSes(tip) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!sesCtx) sesCtx = new AC();
      if (sesCtx.state === "suspended") sesCtx.resume();
      const acilis = tip === "open";
      const freqs = acilis ? [360, 520] : [420, 260];
      const vol = acilis ? 0.18 : 0.15;
      const sure = acilis ? 0.18 : 0.14;
      const ara = acilis ? 80 : 60;
      freqs.forEach((f, idx) => {
        window.setTimeout(() => {
          const osc = sesCtx.createOscillator();
          const gain = sesCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, sesCtx.currentTime);
          gain.gain.setValueAtTime(vol, sesCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, sesCtx.currentTime + sure);
          osc.connect(gain);
          gain.connect(sesCtx.destination);
          osc.start();
          osc.stop(sesCtx.currentTime + sure);
        }, idx * ara);
      });
    } catch (_) {
      /* ses yoksa çanta yine açılır */
    }
  }

  function azHareket() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function cantaZamanIptal() {
    window.clearTimeout(cantaZaman);
    cantaZaman = 0;
  }

  function cantaKilitAc() {
    cantaKilit = true;
    window.setTimeout(() => {
      cantaKilit = false;
    }, CANTA_MS);
  }

  function cantaAcikMi() {
    return cantaDock.classList.contains("orta") || cantaDock.classList.contains("acik");
  }

  function cantaModulPanelleri(arac) {
    const cift = [
      [ebatlamaPanel, "ebatlama"],
      [telPanel, "tel"],
      [ocrPanel, "ocr"],
    ];
    cift.forEach(([el, ad]) => {
      if (el) el.hidden = arac !== ad;
    });
  }

  function cantaKapat(zorla) {
    if (!cantaAcikMi()) return;
    if (!zorla && cantaKilit) return;
    if (!zorla) cantaKilitAc();
    cantaZamanIptal();
    cantaDock.classList.remove("acik", "odak");
    cantaDon.hidden = true;
    cantaModulPanelleri("");
    document.querySelectorAll(".canta-arac").forEach((el) => el.classList.remove("secili"));
    cantaPerde.classList.remove("aktif");
    const bitir = () => {
      cantaDock.classList.remove("orta");
      cerceve.classList.remove("canta-orta");
      cantaAletler.hidden = true;
      cantaPerde.hidden = true;
      cantaBtn.setAttribute("aria-expanded", "false");
      if (!zorla && cekmeceCantaIcinKapandi) {
        cekmeceCantaIcinKapandi = false;
        cekmece.classList.remove("kapali");
        cekmece.removeAttribute("inert");
      }
    };
    if (zorla || azHareket()) {
      bitir();
      return;
    }
    cantaZaman = window.setTimeout(bitir, CANTA_KAPAN_MS);
  }

  function cantaOdak(arac) {
    if (!cantaDock.classList.contains("acik")) return;
    cantaDock.classList.add("odak");
    cantaPerde.classList.remove("aktif");
    cantaDon.hidden = false;
    document.querySelectorAll(".canta-arac").forEach((el) => {
      el.classList.toggle("secili", el.getAttribute("data-arac") === arac);
    });
    cantaModulPanelleri(arac);
    if (arac === "tel") telTuvalKur();
  }

  function aracKapisiAc(tur) {
    const arac = String(tur || "");
    if (!arac) return;
    if (arac === "ebatlama") {
      kapiAc(VARSAYILAN_EBATLAMA);
      return;
    }
    if (arac === "ocr") {
      kapiAc(VARSAYILAN_OCR);
      return;
    }
    if (arac === "elle") {
      kapiAc(VARSAYILAN_ELLE);
      return;
    }
    if (arac === "tel") {
      kapiAc(VARSAYILAN_TEL);
      return;
    }
  }

  function cantaAc() {
    if (cantaKilit || cantaAcikMi()) return;
    const programSayfa = cekmece.dataset.acik === "programlar";
    if (!programSayfa) {
      if (!cekmece.classList.contains("kapali")) cekmeceCantaIcinKapandi = true;
      panelKapat();
    }
    karaPanelKapat();
    cantaKilitAc();
    cantaZamanIptal();
    cantaAletler.hidden = false;
    cantaPerde.hidden = false;
    cantaPerde.classList.add("aktif");
    cantaBtn.setAttribute("aria-expanded", "true");
    cerceve.classList.add("canta-orta");
    cantaDock.classList.add("orta");
    cantaSes("open");
    const kapakAc = () => cantaDock.classList.add("acik");
    if (azHareket()) kapakAc();
    else cantaZaman = window.setTimeout(kapakAc, CANTA_ORTA_MS);
  }

  function sahneGoster(id) {
    const hedef = id || "";
    document.querySelectorAll("#ana > [data-panel], #cekmece > section[data-panel]").forEach((s) => {
      const on = s.getAttribute("data-panel") === hedef;
      s.hidden = !on;
      s.classList.toggle("is-aktif", on);
    });
    document.querySelectorAll(".ray-btn[data-panel]").forEach((b) => {
      const on = b.dataset.panel === hedef;
      b.classList.toggle("aktif", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    document.querySelectorAll(".cekmece-link").forEach((b) => {
      b.classList.toggle("aktif", b.dataset.panel === hedef);
    });
    cekmece.dataset.acik = hedef;
  }

  function panelAc(id) {
    sahneGoster(id);
    cekmece.classList.remove("kapali");
    cekmece.removeAttribute("inert");
    if (cekmecePerde) cekmecePerde.hidden = true;
    cekmeceCantaIcinKapandi = false;
    cantaKapat(true);
  }

  function panelKapat() {
    sahneGoster("");
    cekmece.classList.add("kapali");
    cekmece.setAttribute("inert", "");
    if (cekmecePerde) cekmecePerde.hidden = true;
  }

  function ustaTebrik() {
    if (!ustaTost) return;
    window.clearTimeout(ustaTostZaman);
    ustaTost.hidden = false;
    ustaTost.classList.remove("suzul");
    void ustaTost.offsetWidth;
    ustaTost.classList.add("suzul");
    ustaTostZaman = window.setTimeout(() => {
      ustaTost.classList.remove("suzul");
      ustaTost.hidden = true;
    }, USTA_TOST_MS);
  }

  function karaDurumYaz(metin) {
    if (!karaDurum) return;
    karaDurum.textContent = metin || "";
  }

  function karaKutuyaIsle(kesin, canli) {
    const kutu = karaMetin;
    if (!kutu) return;
    const govde = String(kesin || "");
    const ara = String(canli || "").trim();
    const ek = ara ? (govde && !/\s$/.test(govde) ? " " : "") + ara : "";
    kutu.value = govde + ek;
    kutu.scrollTop = kutu.scrollHeight;
  }

  function karaListeCiz() {
    if (!karaListe) return;
    karaListe.replaceChildren();
    karaSatirlar.forEach((s, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "kara-satir";
      btn.dataset.idx = String(idx);
      btn.textContent = s;
      btn.title = "Kutuya al ve düzelt";
      karaListe.appendChild(btn);
    });
    karaListe.scrollTop = karaListe.scrollHeight;
  }

  function karaSatirAktar(idx) {
    const s = karaSatirlar[idx];
    if (!s || !karaMetin) return;
    karaCanli = "";
    const ham = String(karaMetin.value || "");
    const pos = ham.indexOf(s);
    karaMetin.focus();
    if (pos >= 0) {
      karaKesin = ham;
      karaMetin.setSelectionRange(pos, pos + s.length);
      return;
    }
    const ayir = ham && !ham.endsWith("\n") && !/\s$/.test(ham) ? "\n" : "";
    karaKesin = ham + ayir + s;
    karaKutuyaIsle(karaKesin, "");
    const bas = karaKesin.length - s.length;
    karaMetin.setSelectionRange(Math.max(0, bas), karaKesin.length);
  }

  function karaSatirEkle(metin) {
    const temiz = String(metin || "").replace(/\s+/g, " ").trim();
    if (!temiz || !karaMetin) return;
    let taban = String(karaMetin.value || karaKesin || "");
    if (karaCanli) {
      const iz = taban.endsWith(karaCanli) ? karaCanli.length : 0;
      if (iz) taban = taban.slice(0, -iz);
      taban = taban.replace(/\s+$/, "");
    }
    karaCanli = "";
    karaKesin = taban ? taban + (/\s$/.test(taban) ? "" : " ") + temiz : temiz;
    const son = karaSatirlar[karaSatirlar.length - 1] || "";
    if (son !== temiz) {
      karaSatirlar.push(temiz);
      if (karaSatirlar.length > 80) karaSatirlar = karaSatirlar.slice(-80);
    }
    karaKutuyaIsle(karaKesin, "");
    karaListeCiz();
  }

  function karaSessizlikKur() {
    window.clearTimeout(karaSessizlik);
    karaSessizlik = window.setTimeout(() => {
      karaDinlemeyiDurdur(true);
      karaDurumYaz("7 sn sessizlik — durdu. Eksikse 💡 butona tekrar bas.");
    }, KARA_SESSIZ_MS);
  }

  function karaDinlemeyiDurdur(sessizlik) {
    karaDurIstek = true;
    window.clearTimeout(karaSessizlik);
    karaSessizlik = 0;
    if (karaDinleyici) {
      const din = karaDinleyici;
      karaDinleyici = null;
      din.onresult = null;
      din.onerror = null;
      din.onend = null;
      try {
        din.stop();
      } catch (_) {
        /* zaten durmuş olabilir */
      }
      try {
        din.abort();
      } catch (_) {
        /* abort yoksa stop yeter */
      }
    }
    if (karaCanli) {
      karaSatirEkle(karaCanli);
      karaCanli = "";
    }
    if (karaKutuBtn) karaKutuBtn.classList.remove("kayit");
    if (!sessizlik) karaDurumYaz("");
  }

  function karaKonusmaMotoru() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function karaDinlemeyiBaslat() {
    const Motor = karaKonusmaMotoru();
    if (!Motor) {
      karaDurumYaz("Konuşma tanıma yok. Kutuya yaz, sonra gönder.");
      return;
    }
    karaDurIstek = true;
    karaDinlemeyiDurdur(false);
    karaDurIstek = false;
    karaYeniden = 0;
    const din = new Motor();
    din.lang = "tr-TR";
    din.interimResults = true;
    din.continuous = true;
    din.maxAlternatives = 1;
    din.onresult = (ev) => {
      karaSessizlikKur();
      let ara = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const sonuc = ev.results[i];
        const parca = sonuc[0];
        if (!parca) continue;
        const metin = String(parca.transcript || "").replace(/\s+/g, " ").trim();
        if (!metin) continue;
        if (sonuc.isFinal) {
          const guven = typeof parca.confidence === "number" ? parca.confidence : 1;
          if (guven > 0 && guven < 0.35) continue;
          karaSatirEkle(metin);
        } else {
          ara = ara ? ara + " " + metin : metin;
        }
      }
      karaCanli = ara;
      karaKutuyaIsle(karaKesin, karaCanli);
    };
    din.onerror = (ev) => {
      const kod = ev && ev.error ? ev.error : "";
      if (kod === "no-speech" || kod === "aborted") return;
      if (kod === "not-allowed" || kod === "service-not-allowed") {
        karaDurIstek = true;
        karaDurumYaz("Mikrofon izni yok. Kutuya yaz.");
        if (karaKutuBtn) karaKutuBtn.classList.remove("kayit");
      }
    };
    din.onend = () => {
      if (karaDurIstek || !karaKutuPanel || karaKutuPanel.hidden) return;
      if (karaYeniden >= KARA_YENIDEN_TAVAN) {
        karaDurumYaz("Dinleme tavanı. Eksikse butona tekrar bas.");
        if (karaKutuBtn) karaKutuBtn.classList.remove("kayit");
        return;
      }
      karaYeniden += 1;
      window.setTimeout(() => {
        if (karaDurIstek || !karaDinleyici) return;
        try {
          karaDinleyici.start();
        } catch (_) {
          /* motor meşgulse bir sonraki basış yeter */
        }
      }, 120);
    };
    karaDinleyici = din;
    try {
      din.start();
    } catch (_) {
      karaDurumYaz("Mikrofon meşgul. Kutuya yaz veya tekrar bas.");
      return;
    }
    if (karaKutuBtn) karaKutuBtn.classList.add("kayit");
    karaDurumYaz("Dinleniyor… 7 sn sessizlikte durur.");
    karaSessizlikKur();
  }

  function karaPanelKapat() {
    karaDinlemeyiDurdur(false);
    karaCanli = "";
    if (karaKutuPanel) karaKutuPanel.hidden = true;
    if (karaPerde) karaPerde.hidden = true;
    if (karaKutuBtn) karaKutuBtn.setAttribute("aria-expanded", "false");
  }

  function karaPanelAc() {
    const id = (cekmece && cekmece.dataset.acik) || "meydan";
    karaBaglam = { id, ad: MODUL_AD[id] || id };
    if (karaModul) karaModul.textContent = "Modül: " + karaBaglam.ad;
    const acikti = karaKutuPanel && !karaKutuPanel.hidden;
    if (!acikti) {
      karaSatirlar = [];
      karaCanli = "";
      karaKesin = "";
      if (karaMetin) karaMetin.value = "";
      karaListeCiz();
    }
    if (karaKutuPanel) karaKutuPanel.hidden = false;
    if (karaPerde) karaPerde.hidden = false;
    if (karaKutuBtn) karaKutuBtn.setAttribute("aria-expanded", "true");
    karaDinlemeyiBaslat();
  }

  function karaHavuzOku() {
    try {
      const ham = JSON.parse(localStorage.getItem(KARA_ANAHTAR) || "[]");
      return Array.isArray(ham) ? ham : [];
    } catch (_) {
      return [];
    }
  }

  function karaHavuzYaz(liste) {
    const kesik = liste.slice(0, 24);
    localStorage.setItem(KARA_ANAHTAR, JSON.stringify(kesik));
  }

  function karaGonder() {
    karaDinlemeyiDurdur(false);
    karaCanli = "";
    karaKesin = String((karaMetin && karaMetin.value) || "").trim();
    const metin = karaKesin;
    const kart = {
      id: Date.now(),
      zaman: new Date().toISOString(),
      modul: karaBaglam.id,
      modulAd: karaBaglam.ad,
      metin,
    };
    try {
      const havuz = karaHavuzOku();
      havuz.unshift(kart);
      karaHavuzYaz(havuz);
    } catch (_) {
      /* depo dolsa da teşekkür gösterilir */
    }
    ustaTebrik();
    karaDurumYaz("Teşekkürler, öneriniz kaydedildi");
    if (karaGonderBtn) karaGonderBtn.disabled = true;
    window.setTimeout(() => {
      if (karaGonderBtn) karaGonderBtn.disabled = false;
      karaPanelKapat();
    }, 900);
  }

  function modAyarla(telefon) {
    const tel = !!telefon;
    document.body.classList.toggle("mod-telefon", tel);
    document.body.classList.toggle("mod-masa", !tel);
    if (modTelefon) {
      modTelefon.classList.toggle("aktif", tel);
      modTelefon.setAttribute("aria-pressed", tel ? "true" : "false");
    }
    if (modMasa) {
      modMasa.classList.toggle("aktif", !tel);
      modMasa.setAttribute("aria-pressed", tel ? "false" : "true");
    }
    try {
      localStorage.setItem(MOD_ANAHTAR, tel ? "telefon" : "masa");
    } catch (_) {
      /* depo yoksa görünüm yine değişir */
    }
  }

  if (modTelefon) {
    modTelefon.addEventListener("click", (ev) => {
      ev.preventDefault();
      modAyarla(true);
    });
  }
  if (modMasa) {
    modMasa.addEventListener("click", (ev) => {
      ev.preventDefault();
      modAyarla(false);
    });
  }
  modAyarla(true);

  function ocrUrlUygula() {
    const temiz = VARSAYILAN_OCR;
    if (ocrLink) ocrLink.href = temiz;
    if (ebatlamaLink) ebatlamaLink.href = VARSAYILAN_EBATLAMA;
  }

  const cekmeceDizin = document.querySelector(".cekmece-dizin");
  if (cekmeceDizin) {
    cekmeceDizin.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".cekmece-link");
      if (!btn) return;
      panelAc(btn.dataset.panel);
    });
  }

  cekmece.addEventListener("click", (ev) => {
    if (ev.target.closest(".usta-cekmece-kayit") && kayitBtn) kayitBtn.click();
    if (ev.target.closest("[data-is-ara]")) {
      araDurum.hidden = false;
      araDurum.textContent = "İş arama motoru henüz yok — arama kutusu yerinde.";
    }
  });

  const ray = document.querySelector(".ray");
  function rayKapat() {
    if (!ray) return;
    ray.classList.remove("acik");
    ray.setAttribute("aria-expanded", "false");
  }
  function rayAc() {
    if (!ray) return;
    ray.classList.add("acik");
    ray.setAttribute("aria-expanded", "true");
  }
  if (ray) {
    ray.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".ray-btn");
      if (!btn) return;
      if (btn.classList.contains("ray-ana") || !btn.dataset.panel) {
        if (ray.classList.contains("acik")) rayKapat();
        else rayAc();
        return;
      }
      if (!ray.classList.contains("acik")) {
        rayAc();
        return;
      }
      if (btn.classList.contains("aktif")) {
        rayKapat();
        return;
      }
      panelAc(btn.dataset.panel);
      rayKapat();
    });
    document.addEventListener("click", (ev) => {
      if (!ray.classList.contains("acik")) return;
      if (ray.contains(ev.target)) return;
      rayKapat();
    });
  }

  const programlarBtn = document.getElementById("programlarBtn");
  if (programlarBtn) {
    programlarBtn.addEventListener("click", () => {
      panelAc("programlar");
    });
  }
  document.querySelectorAll("[data-ev]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ev = btn.getAttribute("data-ev");
      if (ev === "canta") cantaAc();
      else if (ev) panelAc(ev);
    });
  });
  const programlarGeriBtn = document.getElementById("programlarGeriBtn");
  if (programlarGeriBtn) {
    programlarGeriBtn.addEventListener("click", () => {
      panelKapat();
    });
  }

  if (cekmecePerde) cekmecePerde.addEventListener("click", panelKapat);

  cantaBtn.addEventListener("click", () => {
    if (cantaAcikMi()) cantaKapat();
    else cantaAc();
  });
  cantaPerde.addEventListener("click", () => cantaKapat());

  if (karaKutuBtn) {
    karaKutuBtn.addEventListener("click", () => {
      karaPanelAc();
    });
  }
  if (karaGonderBtn) karaGonderBtn.addEventListener("click", karaGonder);
  if (karaMetin) {
    karaMetin.addEventListener("input", () => {
      karaCanli = "";
      karaKesin = karaMetin.value;
    });
  }
  if (karaListe) {
    karaListe.addEventListener("click", (ev) => {
      const satir = ev.target.closest(".kara-satir");
      if (!satir) {
        if (karaMetin) karaMetin.focus();
        return;
      }
      karaSatirAktar(Number(satir.dataset.idx));
    });
  }

  araForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const q = (document.getElementById("araGirdi").value || "").trim();
    araDurum.hidden = false;
    araDurum.textContent = q
      ? `"${q}" için sonuç motoru henüz yok — arama kutusu yerinde.`
      : "Usta, fason veya malzeme yazın.";
  });

  function profilBos() {
    return {
      surum: 3,
      ad: "",
      dukkan: "",
      telefon: "",
      kullanim: 0,
      sonHatirlatma: 0,
      dogrulanmis: false,
    };
  }

  function profilEksik(p) {
    return !String(p.ad || "").trim() && !String(p.dukkan || "").trim();
  }

  function hatirlatmaEsigi(kullanim) {
    const k = Number(kullanim) || 0;
    if (k < SERBEST_KULLANIM) return false;
    if (HATIRLATMA_ESIK.indexOf(k) !== -1) return true;
    return k > 42 && k % 10 === 0;
  }

  function nazikTesvikGoster(p) {
    if (!p || !profilEksik(p)) return false;
    const k = Number(p.kullanim) || 0;
    if (!hatirlatmaEsigi(k)) return false;
    return Number(p.sonHatirlatma) !== k;
  }

  function tesvikAc() {
    /* Araçlarda profil perde yok; kimlik yalnız meydan yazışmasında. */
    return;
  }

  function profilOku() {
    try {
      const ham = JSON.parse(localStorage.getItem(PROFIL_ANAHTAR) || "null");
      if (!ham || typeof ham !== "object") return profilBos();
      return { ...profilBos(), ...ham };
    } catch {
      return profilBos();
    }
  }

  function profilYaz(p) {
    localStorage.setItem(PROFIL_ANAHTAR, JSON.stringify(p));
    hesapOzet.textContent = p.ad ? p.ad : "Misafir";
    kayitBtn.textContent = p.ad ? "Profil" : "Başla";
    const av = document.getElementById("hesapAvatar");
    if (av) av.textContent = ((p.ad || "M").trim().charAt(0) || "M").toUpperCase();
  }

  function dialogGoster(adim) {
    adimBasla.hidden = adim !== "basla";
    adimProfil.hidden = adim !== "profil";
    adimDogrula.hidden = adim !== "dogrula";
    if (typeof hesapDialog.showModal === "function") hesapDialog.showModal();
  }

  function kacHtml(metin) {
    return String(metin).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function panoEkle(metin, konu) {
    const p = profilOku();
    const etiket = konu || "diğer";
    const html =
      '<p class="pano-meta"><span class="pano-etiket">' + kacHtml(etiket) + "</span> " +
      kacHtml(p.ad || "Usta") +
      " · az önce</p>" +
      "<h2>" + kacHtml(metin) + "</h2>" +
      '<p class="pano-yanit">Yanıt bekleniyor — havuz yerelde; sunucu sonra bağlanır.</p>';
    document.querySelectorAll(".pano-liste").forEach((liste) => {
      const kart = document.createElement("article");
      kart.className = "pano-kart";
      kart.innerHTML = html;
      liste.prepend(kart);
    });
    ustaTebrik();
  }

  function meydanKapisi(hedef) {
    const p = profilOku();
    if (hedef === "pano") {
      const girdi = document.getElementById("panoSoru");
      const konu = document.getElementById("panoKonu");
      panoBekleyenMetin = (girdi && girdi.value ? girdi.value : "").trim();
      if (!panoBekleyenMetin) {
        araDurum.hidden = false;
        araDurum.textContent = "Önce sorunu veya tecrübeyi yaz.";
        return;
      }
      if (p.dogrulanmis && String(p.ad || "").trim() && String(p.telefon || "").trim()) {
        panoEkle(panoBekleyenMetin, konu ? konu.value : "diğer");
        if (girdi) girdi.value = "";
        panoBekleyenMetin = "";
        araDurum.hidden = false;
        araDurum.textContent = "Havuza düştü. Sunucu henüz yok; kart bu oturumda durur.";
        return;
      }
    } else if (p.dogrulanmis && String(p.ad || "").trim() && String(p.telefon || "").trim()) {
      if (hedef === "ilan") {
        ilanFormAc(ilanBekleyenTur);
        return;
      }
      araDurum.hidden = false;
      araDurum.textContent = "Yazışma kapısı açık — sohbet motoru henüz yok.";
      return;
    }
    meydanBekleyen = hedef;
    meydanOtp = "";
    kodGoster.hidden = true;
    kodGoster.textContent = "";
    dogrulaKod.value = "";
    dogrulaAd.value = p.ad || "";
    dogrulaTel.value = p.telefon || "";
    dialogGoster("dogrula");
  }

  function cantaVeKapat() {
    if (hesapDialog.open) hesapDialog.close();
    cantaAc();
  }

  function kullanimSay() {
    const p = profilOku();
    p.kullanim = (Number(p.kullanim) || 0) + 1;
    profilYaz(p);
    tesvikAc();
  }

  function hesapKapisiAc() {
    const p = profilOku();
    ustaAd.value = p.ad || "";
    dialogGoster("basla");
  }
  document.getElementById("girisBtn").addEventListener("click", hesapKapisiAc);
  const ayarBtn = document.getElementById("ayarBtn");
  if (ayarBtn) ayarBtn.addEventListener("click", hesapKapisiAc);
  const geriBtn = document.getElementById("geriBtn");
  if (geriBtn) {
    geriBtn.addEventListener("click", () => {
      if (hesapDialog.open) {
        hesapDialog.close();
        return;
      }
      karaPanelKapat();
      if (
        (telPanel && !telPanel.hidden) ||
        (ocrPanel && !ocrPanel.hidden) ||
        (ebatlamaPanel && !ebatlamaPanel.hidden)
      ) {
        cantaModulPanelleri("");
        cantaDon.hidden = true;
        if (cantaDock.classList.contains("odak")) {
          cantaDock.classList.remove("odak");
          cantaPerde.classList.add("aktif");
          cantaPerde.hidden = false;
          document.querySelectorAll(".canta-arac").forEach((el) => el.classList.remove("secili"));
        }
        return;
      }
      if (cantaAcikMi()) {
        cantaKapat();
        return;
      }
      if (ray && ray.classList.contains("acik")) {
        rayKapat();
        return;
      }
      if (!cekmece.classList.contains("kapali")) panelKapat();
    });
  }
  kayitBtn.addEventListener("click", () => {
    const p = profilOku();
    if (p.ad || p.dukkan) {
      ustaDukkan.value = p.dukkan || "";
      ustaTel.value = p.telefon || "";
      dialogGoster("profil");
      return;
    }
    ustaAd.value = "";
    dialogGoster("basla");
  });
  const ustaKayitAc = document.getElementById("ustaKayitAc");
  if (ustaKayitAc) ustaKayitAc.addEventListener("click", () => kayitBtn.click());
  document.getElementById("adKaydet").addEventListener("click", () => {
    const p = profilOku();
    p.ad = (ustaAd.value || "").trim();
    profilYaz(p);
    ustaTebrik();
    cantaVeKapat();
  });
  document.getElementById("adAtla").addEventListener("click", cantaVeKapat);
  document.getElementById("profilKaydet").addEventListener("click", () => {
    const p = profilOku();
    p.dukkan = (ustaDukkan.value || "").trim();
    p.telefon = (ustaTel.value || "").trim();
    profilYaz(p);
    ustaTebrik();
    if (hesapDialog.open) hesapDialog.close();
  });
  document.getElementById("profilAtla").addEventListener("click", () => {
    const p = profilOku();
    p.sonHatirlatma = Number(p.kullanim) || 0;
    profilYaz(p);
    if (hesapDialog.open) hesapDialog.close();
  });
  hesapDialog.addEventListener("close", () => {
    if (adimProfil.hidden) return;
    const p = profilOku();
    if (profilEksik(p)) {
      p.sonHatirlatma = Number(p.kullanim) || 0;
      profilYaz(p);
    }
  });
  document.getElementById("kodGonder").addEventListener("click", () => {
    const ad = (dogrulaAd.value || "").trim();
    const tel = (dogrulaTel.value || "").trim();
    if (!ad || !tel) {
      kodGoster.hidden = false;
      kodGoster.textContent = "Ad soyad ve telefon yazın. Bu kapı yalnızca meydan içindir.";
      return;
    }
    meydanOtp = String(Math.floor(1000 + Math.random() * 9000));
    kodGoster.hidden = false;
    kodGoster.textContent =
      "SMS hattı bağlı değil. Deneme kodu (telefonunuza gitmez): " + meydanOtp;
  });
  document.getElementById("kodOnay").addEventListener("click", () => {
    const ad = (dogrulaAd.value || "").trim();
    const tel = (dogrulaTel.value || "").trim();
    const kod = (dogrulaKod.value || "").trim();
    if (!ad || !tel) {
      kodGoster.hidden = false;
      kodGoster.textContent = "Ad soyad ve telefon gerekli.";
      return;
    }
    if (!meydanOtp || kod !== meydanOtp) {
      kodGoster.hidden = false;
      kodGoster.textContent = "Kod uyuşmuyor. Önce «Kod üret» deyin.";
      return;
    }
    const p = profilOku();
    p.ad = ad;
    p.telefon = tel;
    p.dogrulanmis = true;
    profilYaz(p);
    ustaTebrik();
    meydanOtp = "";
    if (hesapDialog.open) hesapDialog.close();
    meydanKapisi(meydanBekleyen || "yazi");
  });

  document.querySelectorAll(".meydan-aksiyon[data-meydan]").forEach((btn) => {
    btn.addEventListener("click", () => meydanKapisi(btn.getAttribute("data-meydan")));
  });

  const ilanDialog = document.getElementById("ilanDialog");
  const ilanTur = document.getElementById("ilanTur");
  const ilanBaslik = document.getElementById("ilanBaslik");
  const ilanYer = document.getElementById("ilanYer");
  const ilanUcret = document.getElementById("ilanUcret");
  const ilanDetay = document.getElementById("ilanDetay");
  const ilanTel = document.getElementById("ilanTel");

  function telWa(ham) {
    const rakam = String(ham || "").replace(/\D/g, "");
    if (!rakam) return "";
    if (rakam.startsWith("90")) return rakam;
    if (rakam.startsWith("0")) return "90" + rakam.slice(1);
    return "90" + rakam;
  }

  function ilanPanelId(tur) {
    if (tur === "makine") return "ikinci-el";
    if (tur === "sponsor") return "reklam";
    return "istihdam";
  }

  function ilanEtiket(tur) {
    if (tur === "makine") return "Makine";
    if (tur === "sponsor") return "Sponsor";
    return "İş";
  }

  function ilanFormAc(tur) {
    const p = profilOku();
    ilanBekleyenTur = tur === "makine" || tur === "sponsor" ? tur : "is";
    if (!(p.dogrulanmis && String(p.ad || "").trim() && String(p.telefon || "").trim())) {
      meydanBekleyen = "ilan";
      meydanOtp = "";
      kodGoster.hidden = true;
      kodGoster.textContent = "";
      dogrulaKod.value = "";
      dogrulaAd.value = p.ad || "";
      dogrulaTel.value = p.telefon || "";
      dialogGoster("dogrula");
      return;
    }
    if (ilanTur) ilanTur.value = ilanBekleyenTur;
    if (ilanBaslik) ilanBaslik.value = "";
    if (ilanYer) ilanYer.value = "";
    if (ilanUcret) ilanUcret.value = "";
    if (ilanDetay) ilanDetay.value = "";
    if (ilanTel) ilanTel.value = p.telefon || "";
    if (ilanDialog && typeof ilanDialog.showModal === "function") ilanDialog.showModal();
  }

  function ilanKartHtml(veri) {
    const etiket = ilanEtiket(veri.tur);
    const sponsorSinif = veri.tur === "sponsor" ? " ilan-sponsor" : "";
    const wa = telWa(veri.tel);
    const telHref = String(veri.tel || "").trim()
      ? "tel:" + String(veri.tel).replace(/\s/g, "")
      : "tel:+903421234567";
    const waHref = wa
      ? "https://wa.me/" + wa + "?text=" + encodeURIComponent(veri.baslik || "İlan")
      : "https://wa.me/903421234567";
    const yerSatir = veri.yer || "Yer yok";
    return (
      '<p class="ilan-meta"><span class="ilan-etiket">' +
      kacHtml(etiket) +
      "</span> " +
      kacHtml(yerSatir) +
      "</p>" +
      "<h2>" +
      kacHtml(veri.baslik) +
      "</h2>" +
      (veri.detay ? '<p class="ilan-detay">' + kacHtml(veri.detay) + "</p>" : "") +
      (veri.ucret ? '<p class="ilan-ucret">' + kacHtml(veri.ucret) + "</p>" : '<p class="ilan-ucret">Görüşmeli</p>') +
      '<div class="ilan-aksiyon">' +
      '<a class="ilan-ara" href="' +
      kacHtml(telHref) +
      '">Ara</a>' +
      '<a class="ilan-wa" href="' +
      kacHtml(waHref) +
      '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
      "</div>"
    );
  }

  function ilanListeyeEkle(veri) {
    const panel = ilanPanelId(veri.tur);
    const html = ilanKartHtml(veri);
    document.querySelectorAll('.cekmece-panel[data-panel="' + panel + '"] .ilan-liste, .modul[data-panel="' + panel + '"] .ilan-liste').forEach((liste) => {
      const kart = document.createElement("article");
      kart.className = "ilan-kart" + (veri.tur === "sponsor" ? " ilan-sponsor" : "");
      kart.setAttribute("role", "listitem");
      kart.innerHTML = html;
      liste.prepend(kart);
    });
  }

  document.querySelectorAll("[data-ilan-ac]").forEach((btn) => {
    btn.addEventListener("click", () => ilanFormAc(btn.getAttribute("data-ilan-ac") || "is"));
  });
  const ilanGonder = document.getElementById("ilanGonder");
  if (ilanGonder) {
    ilanGonder.addEventListener("click", () => {
      const tur = ilanTur ? ilanTur.value : "is";
      const baslik = (ilanBaslik && ilanBaslik.value ? ilanBaslik.value : "").trim();
      const yer = (ilanYer && ilanYer.value ? ilanYer.value : "").trim();
      const ucret = (ilanUcret && ilanUcret.value ? ilanUcret.value : "").trim();
      const detay = (ilanDetay && ilanDetay.value ? ilanDetay.value : "").trim();
      const tel = (ilanTel && ilanTel.value ? ilanTel.value : "").trim();
      if (!baslik) {
        araDurum.hidden = false;
        araDurum.textContent = "Başlık yazmadan ilan olmaz.";
        return;
      }
      if (!tel) {
        araDurum.hidden = false;
        araDurum.textContent = "İletişim telefonu şart — Ara / WhatsApp buna gider.";
        return;
      }
      ilanListeyeEkle({ tur, baslik, yer, ucret, detay, tel });
      if (ilanDialog && ilanDialog.open) ilanDialog.close();
      panelAc(ilanPanelId(tur));
      ustaTebrik();
      araDurum.hidden = false;
      araDurum.textContent = "İlan listeye eklendi (yerel). Sunucu sonra bağlanır.";
    });
  }
  const ilanIptal = document.getElementById("ilanIptal");
  if (ilanIptal) {
    ilanIptal.addEventListener("click", () => {
      if (ilanDialog && ilanDialog.open) ilanDialog.close();
    });
  }

  const panoForm = document.getElementById("panoForm");
  if (panoForm) {
    panoForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      meydanKapisi("pano");
    });
  }

  cantaDon.addEventListener("click", () => {
    cantaDock.classList.remove("odak");
    cantaDon.hidden = true;
    cantaModulPanelleri("");
    cantaPerde.classList.add("aktif");
    cantaPerde.hidden = false;
    document.querySelectorAll(".canta-arac").forEach((el) => el.classList.remove("secili"));
  });

  cantaAletler.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const arac = ev.target.closest(".canta-arac");
    if (!arac) return;
    const tur = arac.getAttribute("data-arac");
    if (arac.classList.contains("kapali") || arac.hasAttribute("disabled")) {
      ev.preventDefault();
      araDurum.hidden = false;
      araDurum.textContent = "Bu araç henüz yok.";
      return;
    }
    ev.preventDefault();
    aracKapisiAc(tur);
  });

  const programKapilar = document.querySelector(".program-kapilar");
  if (programKapilar) {
    programKapilar.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".program-kapi");
      if (!btn) return;
      ev.preventDefault();
      aracKapisiAc(btn.getAttribute("data-arac"));
    });
  }

  function ebatlamaKabaHesap() {
    if (!ebatSonuc) return;
    const boy = Number((document.getElementById("ebatPlakaBoy") || {}).value);
    const en = Number((document.getElementById("ebatPlakaEn") || {}).value);
    const kerf = Number((document.getElementById("ebatKerf") || {}).value);
    const ham = (document.getElementById("ebatParcalar") || {}).value || "";
    if (!(boy > 0) || !(en > 0) || !(kerf >= 0)) {
      ebatSonuc.hidden = false;
      ebatSonuc.textContent = "Plaka boy, en ve kerf milimetre olsun.";
      return;
    }
    const plakaAlan = boy * en;
    let parcaAlan = 0;
    let adetToplam = 0;
    let satirHata = 0;
    ham.split(/\n/).forEach((satir) => {
      const t = satir.trim();
      if (!t) return;
      const m = t.replace(/,/g, ".").match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(?:\s*[x×]\s*(\d+))?/i);
      if (!m) {
        satirHata += 1;
        return;
      }
      const pb = Number(m[1]);
      const pe = Number(m[2]);
      const ad = m[3] ? Number(m[3]) : 1;
      if (!(pb > 0) || !(pe > 0) || !(ad > 0)) {
        satirHata += 1;
        return;
      }
      parcaAlan += (pb + kerf) * (pe + kerf) * ad;
      adetToplam += ad;
    });
    if (!adetToplam) {
      ebatSonuc.hidden = false;
      ebatSonuc.textContent = satirHata
        ? "Satır okunamadı. Örnek: 720 x 400 x 2"
        : "Önce parça yaz. Usta mühürlemeden hesap yok.";
      return;
    }
    const plakaAdet = Math.max(1, Math.ceil(parcaAlan / plakaAlan));
    const fire = Math.max(0, 100 - (parcaAlan / (plakaAdet * plakaAlan)) * 100);
    ebatSonuc.hidden = false;
    ebatSonuc.textContent =
      adetToplam +
      " parça · kaba " +
      plakaAdet +
      " plaka · alan fire ~%" +
      fire.toFixed(0) +
      ". Bu yerleşim değil; çizim sonraki adım." +
      (satirHata ? " " + satirHata + " satır atlandı." : "");
  }
  if (ebatHesap) ebatHesap.addEventListener("click", ebatlamaKabaHesap);

  function telTuvalKur() {
    const tuval = document.getElementById("telTuval");
    if (!tuval || tuval.dataset.hazir === "1") return;
    const ctx = tuval.getContext("2d");
    if (!ctx) return;
    tuval.dataset.hazir = "1";
    ctx.strokeStyle = "#202124";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    let ciz = false;
    function nokta(ev) {
      const kutu = tuval.getBoundingClientRect();
      const dokun = ev.touches && ev.touches[0];
      const x = ((dokun ? dokun.clientX : ev.clientX) - kutu.left) * (tuval.width / kutu.width);
      const y = ((dokun ? dokun.clientY : ev.clientY) - kutu.top) * (tuval.height / kutu.height);
      return { x: x, y: y };
    }
    function bas(ev) {
      ev.preventDefault();
      ciz = true;
      const p = nokta(ev);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
    function yurut(ev) {
      if (!ciz) return;
      ev.preventDefault();
      const p = nokta(ev);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    function bitir() {
      ciz = false;
    }
    tuval.addEventListener("mousedown", bas);
    tuval.addEventListener("mousemove", yurut);
    window.addEventListener("mouseup", bitir);
    tuval.addEventListener("touchstart", bas, { passive: false });
    tuval.addEventListener("touchmove", yurut, { passive: false });
    tuval.addEventListener("touchend", bitir);
    const sil = document.getElementById("telTemizle");
    if (sil) {
      sil.addEventListener("click", () => {
        ctx.clearRect(0, 0, tuval.width, tuval.height);
      });
    }
  }

  ocrUrlUygula();
  panelKapat();
  const baslangic = profilOku();
  profilYaz(baslangic);

  (function sponsorPano() {
    const ray = document.getElementById("sponsorRay");
    const noktaKutu = document.getElementById("sponsorNokta");
    if (!ray || !noktaKutu) return;
    const kartlar = ray.querySelectorAll(".sponsor-kart");
    if (!kartlar.length) return;
    const sus = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    noktaKutu.innerHTML = "";
    kartlar.forEach((_, n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", (n + 1) + ". sponsor");
      if (n === 0) {
        b.className = "aktif";
        b.setAttribute("aria-current", "true");
      }
      noktaKutu.appendChild(b);
    });
    const noktalar = noktaKutu.querySelectorAll("button");
    let zaman = 0;
    function genislik() {
      const k = kartlar[0];
      if (!k) return ray.clientWidth;
      return k.getBoundingClientRect().width;
    }
    function indeks() {
      const w = genislik();
      if (!(w > 0)) return 0;
      return Math.max(0, Math.min(kartlar.length - 1, Math.round(ray.scrollLeft / w)));
    }
    function sar(i) {
      const n = kartlar.length;
      return ((i % n) + n) % n;
    }
    function git(i) {
      const n = sar(i);
      const w = ray.clientWidth;
      ray.scrollTo({ left: n * w, behavior: "smooth" });
    }
    function noktaYaz() {
      const i = indeks();
      noktalar.forEach((b, n) => {
        b.classList.toggle("aktif", n === i);
        if (n === i) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
    }
    function dur() {
      if (zaman) {
        window.clearInterval(zaman);
        zaman = 0;
      }
    }
    function basla() {
      if (sus || document.hidden) return;
      dur();
      zaman = window.setInterval(() => git(indeks() + 1), 4500);
    }
    function elle(i) {
      git(i);
      dur();
      basla();
    }
    noktalar.forEach((b, n) => b.addEventListener("click", () => elle(n)));
    ray.addEventListener("scroll", noktaYaz, { passive: true });
    ray.addEventListener("pointerenter", dur);
    ray.addEventListener("pointerleave", basla);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) dur();
      else basla();
    });
    basla();
  })();
})();
