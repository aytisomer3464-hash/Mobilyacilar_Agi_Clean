const foto = document.getElementById("foto");
const fotoCerceve = document.getElementById("fotoCerceve");
const onizlemeSarici = document.getElementById("onizlemeSarici");
const onizleme = document.getElementById("onizleme");
const ustaKart = document.getElementById("ustaKart");
const fotoBtn = document.getElementById("fotoBtn");
const durum = document.getElementById("durum");
const yuklemeAlani = document.getElementById("yuklemeAlani");
const sonuc = document.getElementById("sonuc");
const listeGovde = document.getElementById("listeGovde");
const yalnizYerel = document.getElementById("yalnizYerel");
const token = document.getElementById("token");
const tokenSatir = document.getElementById("tokenSatir");
const lanAdresleri = document.getElementById("lanAdresleri");
const telCizim = document.getElementById("telCizim");
const telDurum = document.getElementById("telDurum");
const kotaSerit = document.getElementById("kotaSerit");
const havuzDurum = document.getElementById("havuzDurum");
const havuzGecmis = document.getElementById("havuzGecmis");
const havuzAra = document.getElementById("havuzAra");
const havuzListeEl = document.getElementById("havuzListe");
const katkiBildirim = document.getElementById("katkiBildirim");
const ogrenmeDurum = document.getElementById("ogrenmeDurum");
const ayarBtn = document.getElementById("ayarBtn");
const ayarPanel = document.getElementById("ayarPanel");
const rehber = document.getElementById("rehber");
const ustaOnayPerde = document.getElementById("ustaOnayPerde");
const supheUyari = document.getElementById("supheUyari");
const telCizimUyari = document.getElementById("telCizimUyari");
const ozetSerit = document.getElementById("ozetSerit");
const kaynakRozet = document.getElementById("kaynakRozet");
const ciftOnayPerde = document.getElementById("ciftOnayPerde");
const perde = document.getElementById("revizyonPerde");
const supheCubuk = document.getElementById("supheCubuk");
const supheKatman = document.getElementById("supheKatman");
const mercekSahne = document.getElementById("mercekSahne");
const buyutec = document.getElementById("buyutec");
const supheGeri = document.getElementById("supheGeri");

const MAGI_KOPRU = "https://cloud-bridge-470702229392.europe-west1.run.app";
function magiCek(yol, secenekler) {
  try {
    if (typeof window.MAGI_istek === "function") return window.MAGI_istek(yol, secenekler);
  } catch (_) { /* kapi yok */ }
  const url = typeof window.MAGI_apiUrl === "function"
    ? window.MAGI_apiUrl(yol)
    : MAGI_KOPRU + (yol && yol.charAt(0) === "/" ? yol : "/" + (yol || ""));
  return fetch(url, secenekler || {}).catch(() => new Response(
    JSON.stringify({ kod: "ag", detail: "Köprü yok", kesim_listesi: [], hazir: false }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  ));
}
function magiMetin(veri, yedek) {
  const d = veri && veri.detail;
  if (typeof d === "string" && d.trim()) return d;
  if (Array.isArray(d)) {
    const parca = d.map((x) => (x && (x.msg || x.detail || x.message)) || "").filter(Boolean);
    if (parca.length) return parca.join("; ");
  }
  if (d && typeof d === "object") {
    if (typeof d.msg === "string") return d.msg;
    if (typeof d.detail === "string") return d.detail;
  }
  if (veri && veri.kod) {
    const etiket = { ag: "Köprüye ulaşılamadı.", cors: "Köprü CORS engeli.", zaman_asimi: "Köprü zaman aşımı.", html_spa: "Köprü HTML döndü", http_4xx: "İstek reddedildi." };
    return etiket[veri.kod] || yedek;
  }
  return yedek;
}

let mercek = { x: 0, y: 0, olcek: 1 };
let mercekSuruk = null;
let buyutecOlcek = 2.5;
let buyutecNokta = { x: 0, y: 0 };

let sonJson = null;
let kayitId = null;
let onizlemeUrl = null;
let kirpBlob = null;
let kirpIptal = 0;
let revizyonIndeks = null;
let revizyonBit = [false, false, false, false];
let revizyonPvc = 0.4;
let ustaKalinlik = 18;
let ustaRol = "Gövde";
let ustaMalzeme = "Standart gövde";
let fotoKiyasAcik = false;
let listeHazir = false;
let supheKuyruk = [];
let supheI = 0;
let supheBekliyor = false;
let okumaCalisiyor = false;
let taramaKilit = false;
let taramaIptal = null;
let sonDosyaImza = "";
let mercekDeneme = 0;
let sonArsivImza = "";

const GRUP_BASLIK = {
  govde: "Gövde",
  kapak: "Kapak",
  arkalik: "Arkalık",
  klapa: "Klapa",
};
const GRUP_SIRASI = ["govde", "kapak", "arkalik", "klapa"];
const STANDART_PVC = [0.4, 0.8, 1, 2];

let listeFiltresi = "tumu";
let ozelBantMm = [];
let silinecekPvc = null;
let ciftOnayIslem = null;
const ustaGeriPerde = document.getElementById("ustaGeriPerde");
const ustaGeriMetin = document.getElementById("ustaGeriMetin");
const ustaMicBtn = document.getElementById("ustaMicBtn");
const SESSIZLIK_MS = 12000;
let ustaTanima = null;
let ustaDinliyor = false;
let ustaIstekDurdur = false;
let ustaSonSes = 0;
let ustaSessizlikZamanlayici = null;
let ustaSabitMetin = "";

function kacis(metin) {
  return String(metin ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function authBaslik() {
  const basliklar = {};
  if (token.value.trim()) basliklar["X-OCR-Token"] = token.value.trim();
  return basliklar;
}

function ogrenmeYaz(veri) {
  if (!veri || !ogrenmeDurum) return;
  const bekleyen = veri.bekleyen_duzeltme ?? 0;
  const esik = veri.esik ?? 25;
  const hafiza = veri.hafiza_kalip ?? 0;
  ogrenmeDurum.textContent = `Öğrenme sayacı: ${bekleyen} / ${esik} onaylı düzeltme · hafıza ${hafiza}`
    + (veri.son_ozet ? ` — son iyileştirme: ${veri.son_ozet}` : "");
}

function kotaYaz(kota) {
  if (!kotaSerit) return;
  if (!kota) {
    kotaSerit.textContent = "Kota bilgisi yok.";
    kotaSerit.classList.remove("tukendi");
    return;
  }
  const kalan = kota.kalan ?? 0;
  const tavan = kota.tavan ?? 40;
  const odul = kota.odul_kayit_basi ?? 5;
  kotaSerit.textContent = `Haftalık kota: ${kalan} / ${tavan} tarama kaldı`
    + (kota.tukendi ? " — doldu, yerel OCR sürer. Eski defter bırakınca kota yenilenir." : "")
    + ` · Kayıt başı ödül +${odul}`;
  kotaSerit.classList.toggle("tukendi", Boolean(kota.tukendi) || kalan <= 0);
}

function katkiYaz(arsiv, kota) {
  if (!katkiBildirim) return;
  const kayit = Number(arsiv?.harici_kayit ?? arsiv?.kayit ?? 0);
  const katki = Number(kota?.katki_adet ?? 0);
  const yenilenen = Number(kota?.yenilenen ?? 0);
  if (kayit > 0) {
    katkiBildirim.hidden = false;
    katkiBildirim.textContent = `${kayit} kayıt arşive alındı. Kota katkı ödülü: +${yenilenen || (kayit * (kota?.odul_kayit_basi || 5))} (toplam katkı ${katki}).`;
    return;
  }
  if (katki > 0 && yenilenen > 0) {
    katkiBildirim.hidden = false;
    katkiBildirim.textContent = `Arşiv katkısı: ${katki} kayıt, bu hafta kota +${yenilenen}.`;
    return;
  }
  katkiBildirim.hidden = true;
}

function havuzYaz(havuz) {
  if (!havuzDurum) return;
  if (!havuz) {
    havuzDurum.textContent = "";
    return;
  }
  const kayit = havuz.kayit ?? 0;
  const tavan = havuz.tavan ?? 80;
  const oran = havuz.doluluk_oran ?? 0;
  havuzDurum.textContent = `Ölçü havuzu: ${kayit} / ${tavan} liste (${oran}%)`
    + (havuz.uyari ? ` — ${havuz.uyari}` : "");
}

function havuzZamanKisa(iso) {
  if (!iso) return "";
  const parca = String(iso).slice(0, 16).replace("T", " ");
  return parca;
}

function havuzMetinKac(metin) {
  return String(metin || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function havuzListeYukle() {
  if (!havuzListeEl) return;
  const q = String(havuzAra?.value || "").trim();
  try {
    const yanit = await magiCek(`/api/olcu-havuzu?q=${encodeURIComponent(q)}`, { headers: authBaslik() });
    const veri = await yanit.json();
    if (!yanit.ok) {
      havuzListeEl.innerHTML = `<li class="havuz-bos">${veri.detail || "Havuz okunamadı."}</li>`;
      return;
    }
    havuzYaz(veri);
    const liste = Array.isArray(veri.liste) ? veri.liste : [];
    if (!liste.length) {
      havuzListeEl.innerHTML = `<li class="havuz-bos">${q ? "Eşleşen liste yok." : "Havuz boş."}</li>`;
      return;
    }
    havuzListeEl.innerHTML = liste.map((satir) => {
      const id = String(satir.id || "").replace(/[^a-f0-9.]/gi, "");
      const baslik = havuzMetinKac(satir.ozet || "Liste");
      const alt = havuzMetinKac(`${satir.satir || 0} parça · ${havuzZamanKisa(satir.zaman)}`);
      return `<li class="havuz-satir" data-havuz-id="${id}">
        <span class="havuz-satir-metin"><strong>${baslik}</strong>${alt}</span>
        <button type="button" data-havuz-sil="${id}">Sil</button>
      </li>`;
    }).join("");
  } catch {
    havuzListeEl.innerHTML = `<li class="havuz-bos">Havuz okunamadı.</li>`;
  }
}

async function havuzKayitSil(id) {
  try {
    const yanit = await magiCek(`/api/olcu-havuzu?kayit=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authBaslik(),
    });
    const veri = await yanit.json().catch(() => ({}));
    if (!yanit.ok) throw new Error(veri.detail || "Silinemedi");
    havuzYaz(veri);
    await havuzListeYukle();
  } catch {
    if (havuzListeEl) havuzListeEl.innerHTML = `<li class="havuz-bos">Silinemedi.</li>`;
  }
}

function ruloAc() {
  if (!onizlemeSarici) return;
  onizlemeSarici.hidden = false;
  onizlemeSarici.classList.remove("rulo-kapa");
  onizlemeSarici.classList.remove("rulo-ac");
  void onizlemeSarici.offsetWidth;
  onizlemeSarici.classList.add("rulo-ac");
}

function ruloKapatSonra(fn) {
  mercekSifirla();
  buyutecGizle();
  if (!onizlemeSarici || onizlemeSarici.hidden) {
    fn();
    return;
  }
  onizlemeSarici.classList.remove("rulo-ac");
  onizlemeSarici.classList.add("rulo-kapa");
  let bitti = false;
  const bitir = () => {
    if (bitti) return;
    bitti = true;
    onizlemeSarici.removeEventListener("animationend", bitir);
    fn();
  };
  onizlemeSarici.addEventListener("animationend", bitir);
  setTimeout(bitir, 620);
}

function onizlemeGoster(url) {
  if (!onizleme || !onizlemeSarici || !fotoCerceve) return;
  onizleme.src = url;
  fotoCerceve.classList.add("dolu");
  ustaKart?.classList.add("tarama");
  ruloAc();
  const mercekKur = () => mercekParkVeCiz();
  if (onizleme.complete && onizleme.naturalWidth) mercekKur();
  else onizleme.addEventListener("load", mercekKur, { once: true });
}

function mercekGorunurMu() {
  return Boolean(
    fotoCerceve?.classList.contains("dolu")
    && onizlemeSarici
    && !onizlemeSarici.hidden
    && onizleme?.src,
  );
}

function mercekParkVeCiz() {
  if (!mercekGorunurMu()) {
    mercekDeneme = 0;
    return;
  }
  const g = gorselCerceve();
  if (!g) {
    if (mercekDeneme < 24) {
      mercekDeneme += 1;
      requestAnimationFrame(mercekParkVeCiz);
    } else {
      mercekDeneme = 0;
    }
    return;
  }
  mercekDeneme = 0;
  if (!buyutec || buyutec.hidden) {
    buyutecNokta = { x: g.dw / 2, y: Math.max(24, g.dh * 0.36) };
    buyutecOlcek = 2.5;
  }
  buyutecCiz();
  if (buyutec) buyutec.setAttribute("aria-hidden", "false");
}

function fotoKiyasAyarla(acik) {
  fotoKiyasAcik = Boolean(acik);
  if (fotoBtn) {
    fotoBtn.hidden = !listeHazir;
    fotoBtn.setAttribute("aria-pressed", fotoKiyasAcik ? "true" : "false");
  }
  if (!ustaKart) return;
  if (!listeHazir) {
    ustaKart.classList.remove("gizli");
    return;
  }
  if (fotoKiyasAcik) {
    ustaKart.classList.remove("gizli");
    ruloAc();
    requestAnimationFrame(() => {
      telSeritleriCiz();
      mercekParkVeCiz();
    });
  } else {
    ruloKapatSonra(() => {
      if (!fotoKiyasAcik) ustaKart.classList.add("gizli");
    });
  }
}

function kutuDizi(kutu) {
  if (Array.isArray(kutu) && kutu.length >= 4 && typeof kutu[0] === "number") {
    return kutu.slice(0, 4).map(Number);
  }
  if (Array.isArray(kutu) && kutu.length && Array.isArray(kutu[0])) {
    const xs = kutu.map(p => Number(p[0]));
    const ys = kutu.map(p => Number(p[1]));
    const x1 = Math.min(...xs);
    const y1 = Math.min(...ys);
    return [x1, y1, Math.max(...xs) - x1, Math.max(...ys) - y1];
  }
  return null;
}

function mercekUygula() {
  if (!mercekSahne) return;
  mercekSahne.style.transform = `translate(${mercek.x}px, ${mercek.y}px) scale(${mercek.olcek})`;
}

function mercekSifirla() {
  mercek = { x: 0, y: 0, olcek: 1 };
  mercekUygula();
}

function buyutecGizle() {
  if (buyutec) {
    buyutec.hidden = true;
    buyutec.setAttribute("aria-hidden", "true");
  }
}

function buyutecCap() {
  return Math.min(132, Math.max(96, Math.round(Math.min(onizlemeSarici?.clientWidth || 160, onizlemeSarici?.clientHeight || 160) * 0.38)));
}

function buyutecCiz() {
  const g = gorselCerceve();
  if (!g || !buyutec || !onizleme || !onizlemeSarici) return;
  buyutecNokta.x = Math.max(0, Math.min(g.dw, buyutecNokta.x));
  buyutecNokta.y = Math.max(0, Math.min(g.dh, buyutecNokta.y));
  const cap = buyutecCap();
  const zoom = buyutecOlcek;
  const imgKutu = onizleme.getBoundingClientRect();
  const sarici = onizlemeSarici.getBoundingClientRect();
  const merkezX = imgKutu.left + g.ox + buyutecNokta.x;
  const merkezY = imgKutu.top + g.oy + buyutecNokta.y;
  buyutec.style.width = `${cap}px`;
  buyutec.style.height = `${cap}px`;
  buyutec.style.left = `${merkezX - sarici.left - cap / 2}px`;
  buyutec.style.top = `${merkezY - sarici.top - cap / 2}px`;
  buyutec.style.backgroundImage = `url("${onizleme.src}")`;
  buyutec.style.backgroundSize = `${g.dw * zoom}px ${g.dh * zoom}px`;
  buyutec.style.backgroundPosition = `${cap / 2 - buyutecNokta.x * zoom}px ${cap / 2 - buyutecNokta.y * zoom}px`;
  buyutec.hidden = false;
}

function buyutecNoktayiAyarla(istemciX, istemciY) {
  const g = gorselCerceve();
  if (!g || !onizleme) return false;
  const imgKutu = onizleme.getBoundingClientRect();
  const lx = istemciX - imgKutu.left;
  const ly = istemciY - imgKutu.top;
  if (lx < g.ox || ly < g.oy || lx > g.ox + g.dw || ly > g.oy + g.dh) return false;
  buyutecNokta.x = lx - g.ox;
  buyutecNokta.y = ly - g.oy;
  buyutecCiz();
  return true;
}

function buyutecSatiraParkEt(kutu) {
  const g = gorselCerceve();
  const ekran = kutuEkran(kutu);
  if (!g || !ekran) {
    buyutecNokta = { x: g ? g.dw / 2 : 0, y: g ? g.dh / 2 : 0 };
    buyutecCiz();
    return;
  }
  buyutecNokta.x = ekran.left + ekran.width / 2 - g.ox;
  buyutecNokta.y = ekran.top + ekran.height / 2 - g.oy;
  buyutecCiz();
}

function gorselCerceve() {
  const nw = onizleme?.naturalWidth || 0;
  const nh = onizleme?.naturalHeight || 0;
  const cw = onizleme?.clientWidth || 0;
  const ch = onizleme?.clientHeight || 0;
  if (!nw || !nh || !cw || !ch) return null;
  const olcek = Math.min(cw / nw, ch / nh);
  const dw = nw * olcek;
  const dh = nh * olcek;
  return { nw, nh, cw, ch, dw, dh, ox: (cw - dw) / 2, oy: (ch - dh) / 2 };
}

function kutuEkran(kutu) {
  const g = gorselCerceve();
  const dizi = kutuDizi(kutu);
  if (!g || !dizi) return null;
  const [x, y, w, h] = dizi;
  return {
    left: g.ox + (x / g.nw) * g.dw,
    top: g.oy + (y / g.nh) * g.dh,
    width: (w / g.nw) * g.dw,
    height: (h / g.nh) * g.dh,
  };
}

function telKutulari() {
  const kutular = sonJson?.tel_cizim_kutulari;
  return Array.isArray(kutular) ? kutular : [];
}

function telUyariYaz(veri) {
  if (!telCizimUyari) return;
  const metin = veri?.tel_cizim_uyari
    || (veri?.tel_cizim ? "Bu bir tel çizimdir / farklı bir şemadır. Sistem bunu kesim listesi olarak okumaz." : "");
  telCizimUyari.hidden = !metin;
  telCizimUyari.textContent = metin || "";
}

function telSeritleriCiz() {
  if (!supheKatman) return;
  supheKatman.querySelectorAll(".tel-serit").forEach(n => n.remove());
  for (const kutu of telKutulari()) {
    const ekran = kutuEkran(kutu);
    if (!ekran || !onizleme) continue;
    const pay = 3;
    const serit = document.createElement("span");
    serit.className = "tel-serit";
    serit.style.left = `${ekran.left - pay}px`;
    serit.style.top = `${ekran.top - pay}px`;
    serit.style.width = `${Math.max(ekran.width, 12) + pay * 2}px`;
    serit.style.height = `${Math.max(ekran.height, 12) + pay * 2}px`;
    supheKatman.appendChild(serit);
  }
}

function mercekOdakla(kutu) {
  mercekSifirla();
  buyutecSatiraParkEt(kutu);
}

function supheSeritCiz(aktifKutu) {
  if (!supheKatman) return;
  supheKatman.querySelectorAll(".suphe-serit").forEach(n => n.remove());
  const liste = sonJson?.kesim_listesi || [];
  const aktifEkran = kutuEkran(aktifKutu);
  for (const parca of liste) {
    if (!parca?.supheli && !parca?.okunamadi) continue;
    const ekran = kutuEkran(parca.kutu);
    if (!ekran || !onizleme) continue;
    const pay = 2;
    const serit = document.createElement("span");
    const kirmizi = parca.okunamadi || parca.suphe_seviye === "kirmizi";
    serit.className = "suphe-serit " + (kirmizi ? "kirmizi" : "sari");
    if (aktifEkran && Math.abs(aktifEkran.left - ekran.left) < 2 && Math.abs(aktifEkran.top - ekran.top) < 2) {
      serit.classList.add("aktif");
    }
    serit.style.left = `${ekran.left - pay}px`;
    serit.style.top = `${ekran.top - pay}px`;
    serit.style.width = `${Math.max(ekran.width, 8) + pay * 2}px`;
    serit.style.height = `${Math.max(ekran.height, 6) + pay * 2}px`;
    serit.title = parca.suphe_neden || "Şüpheli alan";
    supheKatman.appendChild(serit);
  }
  telSeritleriCiz();
}

function listeKesinMi() {
  if (!sonJson || sonJson.usta_onay?.gerekli || supheBekliyor) return false;
  const liste = sonJson.kesim_listesi || [];
  if (!liste.length && !sonJson.tel_cizim) return false;
  return liste.every(p => !p?.supheli && !p?.onay_bekliyor && !p?.okunamadi);
}

function gonderimKilitle(liste) {
  const kilit = !listeKesinMi() || !(liste && liste.length);
  const wa = document.getElementById("whatsappBtn");
  const indir = document.getElementById("indirBtn");
  if (wa) wa.disabled = kilit;
  if (indir) indir.disabled = kilit;
}

function listeyiFinalizeEt() {
  if (!sonJson) return;
  listeHazir = true;
  if (yuklemeAlani) yuklemeAlani.hidden = true;
  if (supheCubuk) supheCubuk.hidden = true;
  ustaKart?.classList.remove("tarama");
  const telVar = Boolean(sonJson?.tel_cizim || telKutulari().length);
  if (telVar) {
    fotoKiyasAyarla(true);
    requestAnimationFrame(() => telSeritleriCiz());
  } else if (supheKatman) {
    supheKatman.innerHTML = "";
  }
  const bitirListe = () => {
    listeCiz(sonJson);
    sonuc.classList.add("liste-giris");
    adimAyarla(3);
    const liste = kesimListesiniAl(sonJson);
    const kalan = liste.filter(p => p.supheli).length;
    if (kalan) {
      rehberYaz("Şüpheli satırlar onaylanmadan liste kesinleşmez.");
      durum.textContent = `${kalan} satır usta onayı bekliyor.`;
      gonderimKilitle(liste);
      return;
    }
    rehberYaz(
      sonJson?.tel_cizim
        ? (sonJson.tel_cizim_uyari || "Bu bir tel çizimdir / farklı bir şemadır. Sistem bunu kesim listesi olarak okumaz.")
        : (liste.length ? "Liste hazır. WhatsApp veya Listeyi İndir. Kıyas için Foto." : "Liste boş. Fotoğrafı net çekip tekrar deneyin."),
    );
    durum.textContent = liste.length
      ? `${liste.length} kalem hazır.`
      : (sonJson?.tel_cizim ? "Tel çizim kesim listesine yazılmadı." : "Liste boş. Kâğıdı net çekip tekrar deneyin.");
    gonderimKilitle(liste);
    if (listeKesinMi()) arsiveYaz();
  };
  if (telVar) {
    if (fotoBtn) {
      fotoBtn.hidden = false;
      fotoBtn.setAttribute("aria-pressed", "true");
    }
    bitirListe();
    requestAnimationFrame(() => {
      telSeritleriCiz();
      mercekParkVeCiz();
    });
    return;
  }
  ruloKapatSonra(() => {
    fotoKiyasAcik = false;
    if (fotoBtn) {
      fotoBtn.hidden = false;
      fotoBtn.setAttribute("aria-pressed", "false");
    }
    ustaKart?.classList.add("gizli");
    bitirListe();
  });
}

function supheSonraki() {
  supheI += 1;
  if (supheI >= supheKuyruk.length) {
    if (supheCubuk) supheCubuk.hidden = true;
    if (supheKatman) supheKatman.innerHTML = "";
    buyutecGizle();
    supheBekliyor = false;
    listeyiFinalizeEt();
    return;
  }
  supheAdimGoster();
}

function supheAdimGoster() {
  const oge = supheKuyruk[supheI];
  if (!oge || !sonJson) return;
  const parca = sonJson.kesim_listesi[oge.i];
  if (!parca) {
    supheSonraki();
    return;
  }
  fotoKiyasAyarla(true);
  ustaKart?.classList.add("tarama");
  if (yuklemeAlani) yuklemeAlani.hidden = true;
  const sira = document.getElementById("supheSira");
  const ozet = document.getElementById("supheOzet");
  if (sira) sira.textContent = `${supheI + 1} / ${supheKuyruk.length}`;
  if (ozet) {
    ozet.textContent = `${parca.parca_adi || "Parça"}  ${parca.uzunluk_mm} × ${parca.genislik_mm}  adet ${parca.adet}`;
  }
  if (supheCubuk) supheCubuk.hidden = false;
  if (supheGeri) supheGeri.disabled = supheI <= 0;
  rehberYaz("Kırmızı/sarı çerçeve şüpheli satırdadır. Merceği kaydırın. Doğruysa Onayla; hatalıysa Düzelt. Onaysız liste kesinleşmez.");
  requestAnimationFrame(() => {
    mercekSifirla();
    buyutecOlcek = 2.5;
    const oge = supheKuyruk[supheI];
    const parca = sonJson?.kesim_listesi?.[oge?.i];
    if (parca) {
      supheSeritCiz(parca.kutu);
      mercekOdakla(parca.kutu);
    }
  });
}

function supheAkisiBaslat() {
  const liste = sonJson?.kesim_listesi || [];
  supheKuyruk = liste.map((p, i) => ({ p, i })).filter(o => o.p?.supheli);
  supheI = 0;
  if (!supheKuyruk.length) {
    listeyiFinalizeEt();
    return;
  }
  supheBekliyor = true;
  sonuc.hidden = true;
  fotoKiyasAyarla(true);
  adimAyarla(3);
  durum.textContent = `${supheKuyruk.length} şüpheli alan. Üstten alta onaylayın.`;
  if (onizleme?.complete && onizleme.naturalWidth) {
    supheAdimGoster();
  } else if (onizleme) {
    onizleme.addEventListener("load", () => { if (supheBekliyor) supheAdimGoster(); }, { once: true });
    if (onizlemeUrl) onizleme.src = onizlemeUrl;
  } else {
    supheAdimGoster();
  }
}

function okumaSonrasi(veri) {
  sonJson = veri;
  kayitId = veri.kayit_id;
  kaynakRozetYaz(veri.okuma_kaynak);
  ogrenmeYaz(veri.ogrenme);
  kotaYaz(veri.kota);
  listeHazir = false;
  sonuc.hidden = true;
  if (veri.usta_onay?.gerekli) {
    adimAyarla(3);
    rehberYaz("3. Adım: Kalınlık, cins ve malzemeyi onaylayın.");
    ustaOnayAc(veri.usta_onay);
    durum.textContent = "Liste bekliyor; usta onayı.";
    return;
  }
  supheAkisiBaslat();
}

function rehberYaz(metin) {
  if (rehber) rehber.textContent = metin;
}

function telEtiket() {
  if (telDurum) telDurum.textContent = telCizim.checked ? "Açık" : "Kapalı";
}

function adimAyarla(numara) {
  [1, 2, 3].forEach(i => {
    document.getElementById("adim" + i)?.classList.toggle("aktif", i === numara);
  });
}

function secimIsaretle(kutu, secici, deger) {
  kutu.querySelectorAll(`button[${secici}]`).forEach(btn => {
    btn.classList.toggle("secili", btn.getAttribute(secici) === String(deger));
  });
}

function pvcEsit(a, b) {
  return Math.abs(Number(a) - Number(b)) < 0.001;
}

function standartPvcMi(mm) {
  return STANDART_PVC.some(s => pvcEsit(mm, s));
}

function grupAnahtari(parca) {
  const kat = String(parca.kategori || "").toLowerCase();
  const ad = String(parca.parca_adi || "").toLowerCase();
  const kal = Number(parca.kalinlik_mm);
  if (kat.includes("klapa") || ad.includes("klapa")) return "klapa";
  if (kat.includes("kapak") || ad.includes("kapak")) return "kapak";
  if (
    kat.includes("arkalık") || kat.includes("arkalik") || kat.includes("sırt")
    || kat.includes("aralık") || kat.includes("aralik")
    || ad.includes("arkalık") || ad.includes("arkalik") || ad.includes("sırt") || ad.includes("sirt")
    || ad.includes("aralık") || ad.includes("aralik")
    || ([3, 4, 5].includes(kal) && !kat.includes("kapak") && !kat.includes("klapa"))
  ) {
    return "arkalik";
  }
  return "govde";
}

function bantKod(parca) {
  const bant = parca?.bant;
  if (bant && typeof bant === "object" && bant.kod) {
    const dogru = String(bant.kod).match(/[01][-_/][01][-_/][01][-_/][01]/);
    if (dogru) return dogru[0].replace(/[_/]/g, "-");
  }
  if (typeof bant === "string") {
    const dogru = bant.match(/[01][-_/][01][-_/][01][-_/][01]/);
    if (dogru) return dogru[0].replace(/[_/]/g, "-");
  }
  return "0-0-0-0";
}

function bantBitleri(kod) {
  const parca = String(kod || "0-0-0-0").split("-");
  return [0, 1, 2, 3].map(i => parca[i] === "1");
}

function bantKodundan(bitler) {
  return [0, 1, 2, 3].map(i => (bitler[i] ? "1" : "0")).join("-");
}

function bantPvc(parca) {
  const bant = parca?.bant;
  if (bant && typeof bant === "object" && bant.pvc_mm != null) return Number(bant.pvc_mm);
  return varsayilanPvc(parca);
}

function varsayilanPvc(parca) {
  const kat = String(parca?.kategori || parca?.parca_adi || "").toLowerCase();
  if (kat.includes("kapak") || kat.includes("klapa")) return 0.8;
  return 0.4;
}

function kaynakRozetYaz(kaynak) {
  if (!kaynakRozet) return;
  if (!kaynak) {
    kaynakRozet.hidden = true;
    return;
  }
  kaynakRozet.hidden = false;
  if (kaynak === "gemini") {
    kaynakRozet.className = "rozet gemini";
    kaynakRozet.textContent = "🔵 Gemini AI";
  } else if (kaynak === "havuz") {
    kaynakRozet.className = "rozet havuz";
    kaynakRozet.textContent = "Havuz (kota yok)";
  } else {
    kaynakRozet.className = "rozet yerel";
    kaynakRozet.textContent = "🟢 Yerel OCR";
  }
}

function listeImza(liste) {
  const satirlar = Array.isArray(liste) ? liste : [];
  return JSON.stringify(satirlar.map((p) => ({
    m: p?.modul_kodu,
    a: p?.parca_adi,
    u: p?.uzunluk_mm,
    g: p?.genislik_mm,
    k: p?.kalinlik_mm,
    n: p?.adet,
    b: p?.bant,
    s: Boolean(p?.supheli),
  })));
}

async function arsiveYaz() {
  if (!kayitId || !sonJson) return;
  if (!listeKesinMi()) return;
  const liste = tablodanListe();
  const imza = listeImza(liste);
  if (imza === sonArsivImza) return;
  const kaynak = sonJson.okuma_kaynak;
  try {
    const yanit = await magiCek("/api/duzelt", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authBaslik() },
      body: JSON.stringify({
        kayit_id: kayitId,
        kesim_listesi: liste,
        genel_notlar: sonJson?.genel_notlar || [],
      }),
    });
    const veri = await yanit.json();
    if (!yanit.ok) return;
    sonArsivImza = imza;
    sonJson = { ...veri, okuma_kaynak: veri.okuma_kaynak || kaynak, usta_onay: sonJson.usta_onay };
    ogrenmeYaz(veri.ogrenme);
  } catch (hata) {
    try { console.warn("magi arsiv", hata); } catch (_) {}
  }
}

async function durumYukle() {
  try {
    const yanit = await magiCek("/api/durum", { cache: "no-store" });
    if (!yanit.ok) throw new Error("durum");
    const veri = await yanit.json();
    if (veri.lan_adresleri?.length || veri.sabit_adres) {
      const parcalar = [];
      if (veri.sabit_adres) parcalar.push("Sabit: " + veri.sabit_adres);
      const lan = (veri.lan_adresleri || []).filter(a => !a.includes("127.0.0.1")).join("  ·  ")
        || (veri.lan_adresleri || []).join("  ·  ");
      if (lan) parcalar.push("Telefon: " + lan);
      lanAdresleri.textContent = parcalar.join("  ·  ");
    }
    if (veri.token_gerekli) tokenSatir.hidden = false;
    ogrenmeYaz(veri.ogrenme);
    kotaYaz(veri.kota);
    katkiYaz(veri.arsiv_tarama, veri.kota);
    havuzYaz(veri.olcu_havuzu);
    if (Array.isArray(veri.ozel_bant_mm)) ozelBantMm = veri.ozel_bant_mm.map(Number);
    ozelPvcCiz();
  } catch {
    lanAdresleri.textContent = "Sunucu durumuna ulaşılamadı.";
    kotaSerit.textContent = "Kota okunamadı.";
  }
}

function panelAcKapa() {
  const acik = ayarPanel.hidden;
  ayarPanel.hidden = !acik;
  ayarBtn.setAttribute("aria-expanded", acik ? "true" : "false");
  if (acik) durumYukle();
  if (acik && havuzGecmis?.open) havuzListeYukle();
}

havuzGecmis?.addEventListener("toggle", () => {
  if (havuzGecmis.open) havuzListeYukle();
});
document.getElementById("havuzAraBtn")?.addEventListener("click", havuzListeYukle);
havuzAra?.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    ev.preventDefault();
    havuzListeYukle();
  }
});
havuzListeEl?.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("[data-havuz-sil]");
  if (!btn) return;
  const id = btn.getAttribute("data-havuz-sil");
  if (!id) return;
  if (btn.dataset.onay !== "1") {
    btn.dataset.onay = "1";
    btn.textContent = "Emin misin?";
    return;
  }
  btn.disabled = true;
  try {
    await havuzKayitSil(id);
  } catch {
    btn.disabled = false;
    btn.dataset.onay = "";
    btn.textContent = "Sil";
  }
});

ayarBtn.addEventListener("click", panelAcKapa);

let taramaHissiAcik = false;
let nabizZamanlayici = 0;
let sesKapatZamanlayici = 0;
let taramaSes = null;

function hareketAzalt() {
  try {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  } catch {
    return false;
  }
}

function hapticDokun(ms) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    navigator.vibrate(ms);
  } catch {
    /* izin yok veya destek yok */
  }
}

function sesDurdur() {
  if (sesKapatZamanlayici) {
    clearTimeout(sesKapatZamanlayici);
    sesKapatZamanlayici = 0;
  }
  const ctx = taramaSes;
  taramaSes = null;
  if (!ctx) return;
  try {
    if (typeof ctx.close === "function") ctx.close().catch(() => {});
  } catch {
    /* AudioContext kapanışı tarayıcıya bırakılır */
  }
}

function kagitHisirtisiCal() {
  if (hareketAzalt()) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    taramaSes = ctx;
    const sure = 1.25;
    const ornek = Math.max(1, Math.floor(ctx.sampleRate * sure));
    const tampon = ctx.createBuffer(1, ornek, ctx.sampleRate);
    const data = tampon.getChannelData(0);
    let son = 0;
    for (let i = 0; i < ornek; i++) {
      const beyaz = Math.random() * 2 - 1;
      son = 0.88 * son + 0.12 * beyaz;
      const zarf = Math.min(1, i / (ctx.sampleRate * 0.04)) * Math.max(0, 1 - i / ornek);
      const tik = Math.random() < 0.01 ? Math.random() * 0.35 : 0;
      data[i] = (son * 0.5 + tik) * zarf * 0.055;
    }
    const kaynak = ctx.createBufferSource();
    kaynak.buffer = tampon;
    const filtre = ctx.createBiquadFilter();
    filtre.type = "bandpass";
    filtre.frequency.value = 2600;
    filtre.Q.value = 0.65;
    const kazanc = ctx.createGain();
    kazanc.gain.value = 0.18;
    kaynak.connect(filtre);
    filtre.connect(kazanc);
    kazanc.connect(ctx.destination);
    const cal = () => {
      try { kaynak.start(0); } catch { /* tekrar start yok */ }
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(cal).catch(() => {});
    } else {
      cal();
    }
    kaynak.onended = () => sesDurdur();
    sesKapatZamanlayici = window.setTimeout(sesDurdur, 2200);
  } catch {
    /* Web Audio izin/politika hatası akışı bozmaz */
  }
}

function nabizIptal() {
  if (nabizZamanlayici) {
    clearTimeout(nabizZamanlayici);
    nabizZamanlayici = 0;
  }
}

function nabizKur() {
  nabizIptal();
  if (!taramaHissiAcik || hareketAzalt()) return;
  nabizZamanlayici = window.setTimeout(() => {
    nabizZamanlayici = 0;
    if (!taramaHissiAcik) return;
    if (!document.hidden) hapticDokun(8);
    nabizKur();
  }, 11000 + Math.floor(Math.random() * 4000));
}

function taramaHissiniBaslat() {
  if (taramaHissiAcik) return;
  taramaHissiAcik = true;
  hapticDokun(14);
  kagitHisirtisiCal();
  nabizKur();
}

function taramaHissiniDurdur() {
  taramaHissiAcik = false;
  nabizIptal();
  sesDurdur();
  try { hapticDokun(0); } catch { /* */ }
}

function yuklemeGoster(acik) {
  if (yuklemeAlani) {
    yuklemeAlani.hidden = !acik;
    yuklemeAlani.classList.toggle("calisiyor", Boolean(acik) && !document.hidden);
  }
  ustaKart?.classList.toggle("tarama", acik || supheBekliyor || mercekGorunurMu());
  if (acik) taramaHissiniBaslat();
  else taramaHissiniDurdur();
}

function iptalHatasi(hata) {
  return Boolean(hata) && (hata.name === "AbortError" || /abort/i.test(String(hata.message || "")));
}

function taramaIptalEt() {
  try { taramaIptal?.abort(); } catch { /* */ }
  taramaIptal = null;
}

function dosyaImza(dosya) {
  if (!dosya) return "";
  return `${dosya.name}:${dosya.size}:${dosya.lastModified}`;
}

async function kagidiKirp(dosya) {
  const imza = dosyaImza(dosya);
  if (!dosya || !imza) return;
  if (taramaKilit && imza === sonDosyaImza) return;
  taramaIptalEt();
  taramaKilit = true;
  sonDosyaImza = imza;
  const ac = new AbortController();
  taramaIptal = ac;
  const sira = ++kirpIptal;
  rehberYaz("Kâğıt telefonda hizalanıyor…");
  yuklemeGoster(true);
  try {
    if (!window.KesimKirpici || typeof window.KesimKirpici.kagidiKirpDosya !== "function") {
      throw new Error("Tarayıcı kırpıcı yok");
    }
    const kirp = await window.KesimKirpici.kagidiKirpDosya(dosya, {
      signal: ac.signal,
      maxKenar: 2200,
      kalite: 0.86,
    });
    if (sira !== kirpIptal) return;
    if (onizlemeUrl) URL.revokeObjectURL(onizlemeUrl);
    kirpBlob = kirp.blob;
    onizlemeUrl = URL.createObjectURL(kirpBlob);
    onizlemeGoster(onizlemeUrl);
    adimAyarla(2);
    rehberYaz("Ölçüler taranıyor ve süzgeçten geçiyor…");
    await tarayiBaslat(sira, ac.signal);
  } catch (hata) {
    if (iptalHatasi(hata) || sira !== kirpIptal) return;
    kirpBlob = null;
    durum.textContent = hata.message || "Kâğıt telefonda hizalanamadı. Tekrar fotoğraf çekin.";
    yuklemeGoster(false);
    rehberYaz("Kâğıdı düz tutup yeniden çekin. Ham ağır fotoğraf sunucuya gitmez.");
  } finally {
    if (sira === kirpIptal) taramaKilit = false;
  }
}

foto.addEventListener("change", () => {
  const dosya = foto.files?.[0];
  kirpBlob = null;
  if (!dosya) {
    if (onizlemeSarici) onizlemeSarici.hidden = true;
    fotoCerceve?.classList.remove("dolu");
    yuklemeGoster(false);
    adimAyarla(1);
    rehberYaz("Kâğıdı düz tutup fotoğrafını çekin.");
    return;
  }
  if (taramaKilit && dosyaImza(dosya) === sonDosyaImza) return;
  adimAyarla(2);
  rehberYaz("Fotoğraf alındı; kâğıt açılıyor.");
  kagidiKirp(dosya);
});

telCizim.addEventListener("change", telEtiket);
telEtiket();

function kesimListesiniAl(veri) {
  const liste = Array.isArray(veri?.kesim_listesi) ? veri.kesim_listesi : [];
  if (liste.length) return liste;
  const kat = veri?.akilli_recete?.kategoriler;
  if (kat && typeof kat === "object") {
    const birikim = [];
    for (const parcalar of Object.values(kat)) {
      if (Array.isArray(parcalar)) birikim.push(...parcalar);
    }
    if (birikim.length) return birikim;
  }
  return liste;
}

async function tarayiBaslat(sira, sinyal) {
  if (!taramaKilit) return;
  const dosya = foto.files?.[0];
  if ((!dosya && !kirpBlob) || okumaCalisiyor) return;
  if (sira != null && sira !== kirpIptal) return;
  okumaCalisiyor = true;
  adimAyarla(2);
  rehberYaz("Ölçüler taranıyor ve süzgeçten geçiyor…");
  yuklemeGoster(true);
  const gonder = kirpBlob
    ? new File([kirpBlob], "kirpilmis.jpg", { type: kirpBlob.type || "image/jpeg" })
    : null;
  if (!gonder) {
    okumaCalisiyor = false;
    return;
  }
  const form = new FormData();
  form.append("dosya", gonder);
  const params = new URLSearchParams();
  if (yalnizYerel.checked) params.set("yalniz_yerel", "true");
  if (telCizim.checked) params.set("tel_cizim", "true");
  params.set("kirpilmis", "true");
  const sorgu = params.toString() ? "?" + params.toString() : "";
  try {
    const yanit = await magiCek("/api/tara" + sorgu, {
      method: "POST",
      body: form,
      headers: authBaslik(),
      signal: sinyal,
    });
    const veri = await yanit.json().catch(() => ({ kod: "ag", detail: "Köprü JSON dönmedi", kesim_listesi: [] }));
    if (yanit.status === 401) {
      ayarPanel.hidden = false;
      ayarBtn.setAttribute("aria-expanded", "true");
    }
    if (!yanit.ok) {
      const hata = new Error(magiMetin(veri, "Okuma başarısız"));
      hata.kod = veri.kod || (yanit.status >= 400 && yanit.status < 500 ? "http_4xx" : "ag");
      throw hata;
    }
    const liste = kesimListesiniAl(veri);
    if (!Array.isArray(veri.kesim_listesi) || veri.kesim_listesi.length === 0) {
      veri.kesim_listesi = liste;
    }
    if (sira != null && sira !== kirpIptal) return;
    sonJson = veri;
    kayitId = veri.kayit_id;
    yuklemeGoster(false);
    okumaSonrasi(veri);
  } catch (hata) {
    if (iptalHatasi(hata)) return;
    try { console.warn("magi tara", hata && hata.kod, hata); } catch (_) {}
    yuklemeGoster(false);
    durum.textContent = hata.message || String(hata);
  } finally {
    okumaCalisiyor = false;
  }
}

function kalinlikEtiket(parca) {
  const n = Number(parca.kalinlik_mm);
  if (Number.isFinite(n) && n > 0) return `${n} mm`;
  return "";
}

function arkalikAltGruplar(ogeler) {
  const sirali = [...ogeler].sort((a, b) => {
    const ka = Number(a.p.kalinlik_mm);
    const kb = Number(b.p.kalinlik_mm);
    const va = Number.isFinite(ka) ? ka : Infinity;
    const vb = Number.isFinite(kb) ? kb : Infinity;
    return vb - va;
  });
  const gruplar = [];
  for (const oge of sirali) {
    const etiket = kalinlikEtiket(oge.p);
    const son = gruplar[gruplar.length - 1];
    if (son && son.etiket === etiket) son.ogeler.push(oge);
    else gruplar.push({ etiket, ogeler: [oge] });
  }
  return gruplar;
}

function ledHtml(bitler, baslangic) {
  return `<span class="led-cift">`
    + [0, 1].map(i => {
      const acik = bitler[baslangic + i];
      return `<span class="led pasif${acik ? " yanik" : ""}" data-bant-i="${baslangic + i}" aria-hidden="true"></span>`;
    }).join("")
    + `</span>`;
}

function parcaKart(parca, indeks, siraNo) {
  const bolum = document.createElement("div");
  bolum.className = "parca" + (parca.supheli ? " supheli" : "");
  bolum.dataset.indeks = String(indeks);
  const kod = bantKod(parca);
  bolum.dataset.bantKod = kod;
  const bit = bantBitleri(kod);
  bolum.innerHTML =
    `<span class="sira">${siraNo}</span>`
    + `<span class="ad" data-alan="parca_adi">${kacis(parca.parca_adi || "Parça")}</span>`
    + `<span class="olcu-hucre">${ledHtml(bit, 0)}<span class="olcu" data-alan="uzunluk_mm">${kacis(parca.uzunluk_mm ?? "")}</span></span>`
    + `<span class="olcu-hucre">${ledHtml(bit, 2)}<span class="olcu" data-alan="genislik_mm">${kacis(parca.genislik_mm ?? "")}</span></span>`
    + `<span class="adet" data-alan="adet">${kacis(parca.adet ?? "")}</span>`
    + `<button type="button" class="ayar-satir" data-revizyon="${indeks}" aria-label="Revizyon">⚙</button>`
    + `<span data-alan="kalinlik_mm" hidden>${kacis(parca.kalinlik_mm ?? "")}</span>`
    + `<span data-alan="modul_kodu" hidden>${kacis(parca.modul_kodu || "")}</span>`;
  return bolum;
}

function ozetYaz(liste, gorunen) {
  if (!ozetSerit) return;
  const kaynak = gorunen || liste;
  const kalem = kaynak.length;
  const adet = kaynak.reduce((t, p) => t + (Number(p.adet) || 0), 0);
  const grup = GRUP_BASLIK[listeFiltresi];
  ozetSerit.textContent = grup
    ? `${grup}: ${kalem} kalem · ${adet} adet`
    : `${kalem} kalem · ${adet} adet`;
}

function ozelPvcCiz() {
  const kutu = document.getElementById("ozelPvcListe");
  if (!kutu) return;
  kutu.innerHTML = ozelBantMm.map(mm => {
    const etiket = String(mm);
    return `<span class="ozel-pvc-cips" data-ozel-cips="${kacis(mm)}">`
      + `<button type="button" data-pvc="${kacis(mm)}">${kacis(etiket)} mm</button>`
      + `<button type="button" class="ozel-sil" data-sil-pvc="${kacis(mm)}" hidden>Sil</button>`
      + `</span>`;
  }).join("");
  const pvcKutu = document.getElementById("secimPvc");
  if (pvcKutu) secimIsaretle(pvcKutu, "data-pvc", revizyonPvc);
  pvcMenuEtiketYaz();
}

function filtreMenuKapat() {
  const menu = document.getElementById("filtreMenu");
  const btn = document.getElementById("filtreBtn");
  if (menu) menu.hidden = true;
  btn?.setAttribute("aria-expanded", "false");
}

function filtreEtiketYaz() {
  const etiket = document.getElementById("filtreEtiket");
  if (etiket) etiket.textContent = GRUP_BASLIK[listeFiltresi] || "Model";
}

function filtreMenuIsaretle() {
  document.querySelectorAll("#filtreMenu [data-filtre]").forEach(btn => {
    btn.classList.toggle("secili", btn.dataset.filtre === listeFiltresi);
  });
  filtreEtiketYaz();
}

function listeCiz(veri) {
  listeGovde.innerHTML = "";
  const liste = kesimListesiniAl(veri);
  veri.kesim_listesi = liste;
  const kova = { govde: [], kapak: [], arkalik: [], klapa: [] };
  liste.forEach((p, i) => kova[grupAnahtari(p)].push({ p, i }));
  const anahtarlar = listeFiltresi === "tumu" ? GRUP_SIRASI : [listeFiltresi];
  let siraNo = 1;
  let cizilen = 0;
  for (const anahtar of anahtarlar) {
    const oge = kova[anahtar] || [];
    if (!oge.length) continue;
    cizilen += oge.length;
    const grup = document.createElement("section");
    grup.className = "grup";
    const baslik = document.createElement("h3");
    baslik.textContent = GRUP_BASLIK[anahtar];
    grup.appendChild(baslik);
    const diz = (satirlar) => {
      for (const { p, i } of satirlar) {
        grup.appendChild(parcaKart(p, i, siraNo));
        siraNo += 1;
      }
    };
    if (anahtar === "arkalik") {
      for (const alt of arkalikAltGruplar(oge)) {
        if (alt.etiket) {
          const altBaslik = document.createElement("h4");
          altBaslik.textContent = alt.etiket;
          grup.appendChild(altBaslik);
        }
        diz(alt.ogeler);
      }
    } else {
      diz(oge);
    }
    listeGovde.appendChild(grup);
  }
  if (!cizilen && liste.length) {
    const bos = document.createElement("p");
    bos.className = "durum";
    bos.textContent = "Bu grupta parça yok.";
    listeGovde.appendChild(bos);
  }
  const gorunen = listeFiltresi === "tumu"
    ? liste
    : liste.filter(p => grupAnahtari(p) === listeFiltresi);
  ozetYaz(liste, gorunen);
  const supheli = liste.filter(p => p.supheli).length;
  if (supheUyari) {
    supheUyari.hidden = !supheli;
    supheUyari.textContent = supheli ? `${supheli} satır şüpheli — ölçüyü kontrol edin.` : "";
  }
  telUyariYaz(veri);
  sonuc.hidden = false;
  gonderimKilitle(liste);
}

function satirdanBant(kart) {
  return kart?.dataset.bantKod || "0-0-0-0";
}

function kartBantYaz(kart, kod) {
  kart.dataset.bantKod = kod;
  const bit = bantBitleri(kod);
  kart.querySelectorAll(".led").forEach(led => {
    const i = Number(led.dataset.bantI);
    const acik = Boolean(bit[i]);
    led.classList.toggle("yanik", acik);
  });
}

listeGovde.addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-revizyon]");
  if (btn) {
    perdeAc(Number(btn.dataset.revizyon));
  }
});

function tablodanListe() {
  const ham = sonJson?.kesim_listesi || [];
  const kopya = ham.map((eski) => ({ ...eski }));
  for (const kart of listeGovde.querySelectorAll(".parca")) {
    const i = Number(kart.dataset.indeks);
    if (!Number.isInteger(i) || !kopya[i]) continue;
    const al = (alan) => kart.querySelector(`[data-alan="${alan}"]`)?.innerText.trim() ?? "";
    const sayi = (alan) => {
      const n = Number(String(al(alan)).replace(",", "."));
      return Number.isFinite(n) ? n : al(alan);
    };
    const kod = satirdanBant(kart);
    const pvc = bantPvc(kopya[i]);
    Object.assign(kopya[i], {
      modul_kodu: al("modul_kodu") || kopya[i].modul_kodu,
      parca_adi: al("parca_adi"),
      uzunluk_mm: sayi("uzunluk_mm"),
      genislik_mm: sayi("genislik_mm"),
      kalinlik_mm: sayi("kalinlik_mm") || kopya[i].kalinlik_mm,
      adet: sayi("adet"),
      bant: { kod, pvc_mm: pvc },
      supheli: kart.classList.contains("supheli"),
    });
  }
  return kopya;
}

function whatsappMetni(ustaNotu) {
  const liste = tablodanListe();
  const kova = { govde: [], kapak: [], arkalik: [], klapa: [] };
  liste.forEach((p, i) => kova[grupAnahtari(p)].push({ p, i }));
  const satirlar = ["Kesim listesi"];
  let n = 1;
  const isaret = (acik) => (acik ? "■" : "□");
  const satir = (p) => {
    const bit = bantBitleri(bantKod(p));
    return `${n++}  ${p.parca_adi || "Parça"}  ${p.uzunluk_mm} ${isaret(bit[0])}${isaret(bit[1])}  ${p.genislik_mm} ${isaret(bit[2])}${isaret(bit[3])}  adet ${p.adet}`;
  };
  for (const anahtar of GRUP_SIRASI) {
    if (!kova[anahtar].length) continue;
    satirlar.push("", GRUP_BASLIK[anahtar]);
    if (anahtar === "arkalik") {
      for (const alt of arkalikAltGruplar(kova[anahtar])) {
        if (alt.etiket) satirlar.push(alt.etiket);
        for (const { p } of alt.ogeler) satirlar.push(satir(p));
      }
    } else {
      for (const { p } of kova[anahtar]) satirlar.push(satir(p));
    }
  }
  const not = String(ustaNotu || "").trim();
  if (not) {
    satirlar.push("", "---", "Usta notu:", not);
  }
  return satirlar.join("\n");
}

function perdeLedCiz(hedef, bitler, baslangic) {
  hedef.innerHTML = [0, 1].map(i => {
    const acik = bitler[baslangic + i];
    return `<button type="button" class="led${acik ? " yanik" : ""}" data-perde-i="${baslangic + i}" aria-pressed="${acik ? "true" : "false"}"></button>`;
  }).join("");
}

function perdeAc(indeks) {
  const liste = tablodanListe();
  const parca = liste[indeks];
  if (!parca || !perde) return;
  revizyonIndeks = indeks;
  revizyonBit = bantBitleri(bantKod(parca));
  revizyonPvc = bantPvc(parca);
  document.getElementById("revizyonAd").textContent = parca.parca_adi || "Parça";
  document.getElementById("revizyonBoy").value = parca.uzunluk_mm ?? "";
  document.getElementById("revizyonEn").value = parca.genislik_mm ?? "";
  document.getElementById("revizyonAdet").value = parca.adet ?? "";
  perdeLedCiz(document.getElementById("revizyonBoyLed"), revizyonBit, 0);
  perdeLedCiz(document.getElementById("revizyonEnLed"), revizyonBit, 2);
  ozelPvcCiz();
  secimIsaretle(document.getElementById("secimPvc"), "data-pvc", revizyonPvc);
  document.querySelectorAll("[data-sil-pvc]").forEach(btn => {
    btn.hidden = !pvcEsit(btn.dataset.silPvc, revizyonPvc);
  });
  silOnayKapat();
  ozelFormKapat();
  pvcMenuKapat();
  perde.hidden = false;
}

function perdeKapat() {
  silOnayKapat();
  ozelFormKapat();
  pvcMenuKapat();
  perde.hidden = true;
  revizyonIndeks = null;
  if (supheBekliyor && supheCubuk) supheCubuk.hidden = false;
}

function ustaOnayAc(onay) {
  if (!ustaOnayPerde || !onay) return;
  document.getElementById("ustaOnayNeden").textContent = onay.neden || "Seçimleri onaylayın.";
  ustaKalinlik = Number(onay.kalinlik) || 18;
  ustaRol = onay.rol || "Gövde";
  ustaMalzeme = onay.malzeme || "Standart gövde";
  secimIsaretle(document.getElementById("secimKalinlik"), "data-kalinlik", ustaKalinlik);
  secimIsaretle(document.getElementById("secimRol"), "data-rol", ustaRol);
  secimIsaretle(document.getElementById("secimMalzeme"), "data-malzeme", ustaMalzeme);
  ustaOnayPerde.hidden = false;
}

ustaOnayPerde?.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button");
  if (!btn || btn.id === "ustaOnayUygula") return;
  if (btn.dataset.kalinlik) {
    ustaKalinlik = Number(btn.dataset.kalinlik);
    secimIsaretle(document.getElementById("secimKalinlik"), "data-kalinlik", ustaKalinlik);
  }
  if (btn.dataset.rol) {
    ustaRol = btn.dataset.rol;
    secimIsaretle(document.getElementById("secimRol"), "data-rol", ustaRol);
  }
  if (btn.dataset.malzeme) {
    ustaMalzeme = btn.dataset.malzeme;
    secimIsaretle(document.getElementById("secimMalzeme"), "data-malzeme", ustaMalzeme);
  }
});

document.getElementById("ustaOnayUygula")?.addEventListener("click", () => {
  if (!sonJson?.kesim_listesi) return;
  const liste = sonJson.kesim_listesi;
  const hedefler = liste.filter(p => p.onay_bekliyor);
  const uygula = hedefler.length ? hedefler : liste;
  for (const p of uygula) {
    p.kalinlik_mm = ustaKalinlik;
    p.kategori = ustaRol;
    p.malzeme = ustaMalzeme;
    p.onay_bekliyor = false;
    const kod = bantKod(p);
    p.bant = { kod, pvc_mm: varsayilanPvc(p) };
  }
  if (sonJson.usta_onay) sonJson.usta_onay.gerekli = false;
  ustaOnayPerde.hidden = true;
  durum.textContent = "Onaylandı. Şüpheli satırlar kontrol edilecek.";
  supheAkisiBaslat();
});

function silOnayKapat() {
  const kutu = document.getElementById("silOnay");
  if (kutu) kutu.hidden = true;
  silinecekPvc = null;
}

function ozelFormKapat() {
  const form = document.getElementById("ozelPvcForm");
  if (form) form.hidden = true;
}

function pvcMenuEtiketYaz() {
  const etiket = document.getElementById("pvcMenuEtiket");
  if (!etiket) return;
  const mm = Number(revizyonPvc);
  etiket.textContent = Number.isFinite(mm)
    ? `Standart Bant ve Özel Ölçüler · ${mm} mm`
    : "Standart Bant ve Özel Ölçüler";
}

function pvcMenuKapat() {
  const btn = document.getElementById("pvcMenuBtn");
  const govde = document.getElementById("pvcMenuGovde");
  if (govde) govde.hidden = true;
  btn?.setAttribute("aria-expanded", "false");
}

function pvcMenuAcKapa() {
  const btn = document.getElementById("pvcMenuBtn");
  const govde = document.getElementById("pvcMenuGovde");
  if (!govde) return;
  const acik = govde.hidden;
  govde.hidden = !acik;
  btn?.setAttribute("aria-expanded", acik ? "true" : "false");
}

function ciftOnayKapat() {
  ciftOnayIslem = null;
  if (ciftOnayPerde) ciftOnayPerde.hidden = true;
}

function ciftOnayAc(soru, islem) {
  ciftOnayIslem = islem;
  const soruEl = document.getElementById("ciftOnaySoru");
  if (soruEl) soruEl.textContent = soru;
  if (ciftOnayPerde) ciftOnayPerde.hidden = false;
}

perde?.addEventListener("click", (ev) => {
  if (ev.target === perde) {
    silOnayKapat();
    ozelFormKapat();
    perdeKapat();
    return;
  }
  const led = ev.target.closest("[data-perde-i]");
  if (led) {
    const i = Number(led.dataset.perdeI);
    revizyonBit[i] = !revizyonBit[i];
    perdeLedCiz(document.getElementById("revizyonBoyLed"), revizyonBit, 0);
    perdeLedCiz(document.getElementById("revizyonEnLed"), revizyonBit, 2);
  }
  const silBtn = ev.target.closest("[data-sil-pvc]");
  if (silBtn) {
    silinecekPvc = Number(silBtn.dataset.silPvc);
    const onay = document.getElementById("silOnay");
    if (onay) onay.hidden = false;
    ozelFormKapat();
    return;
  }
  if (ev.target.closest("#ozelPvcGir")) {
    const form = document.getElementById("ozelPvcForm");
    if (form) {
      form.hidden = !form.hidden;
      if (!form.hidden) document.getElementById("ozelPvcGirdi")?.focus();
    }
    silOnayKapat();
    return;
  }
  const pvcBtn = ev.target.closest("[data-pvc]");
  if (pvcBtn && pvcBtn.closest("#secimPvc")) {
    revizyonPvc = Number(pvcBtn.dataset.pvc);
    secimIsaretle(document.getElementById("secimPvc"), "data-pvc", revizyonPvc);
    document.querySelectorAll("[data-sil-pvc]").forEach(btn => {
      btn.hidden = !pvcEsit(btn.dataset.silPvc, revizyonPvc);
    });
    pvcMenuEtiketYaz();
    pvcMenuKapat();
  }
});

document.getElementById("ozelPvcKaydet")?.addEventListener("click", async () => {
  const girdi = document.getElementById("ozelPvcGirdi");
  const mm = Number(String(girdi?.value || "").replace(",", "."));
  if (!Number.isFinite(mm)) return;
  if (standartPvcMi(mm)) {
    revizyonPvc = STANDART_PVC.find(s => pvcEsit(s, mm)) ?? mm;
    secimIsaretle(document.getElementById("secimPvc"), "data-pvc", revizyonPvc);
    ozelFormKapat();
    pvcMenuEtiketYaz();
    pvcMenuKapat();
    return;
  }
  try {
    const yanit = await magiCek("/api/ozel-bant", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authBaslik() },
      body: JSON.stringify({ mm }),
    });
    const veri = await yanit.json();
    if (!yanit.ok) {
      durum.textContent = veri.detail || "Özel ölçü kaydedilemedi.";
      return;
    }
    ozelBantMm = (veri.ozel_bant_mm || []).map(Number);
    revizyonPvc = mm;
    ozelPvcCiz();
    document.querySelectorAll("[data-sil-pvc]").forEach(btn => {
      btn.hidden = !pvcEsit(btn.dataset.silPvc, revizyonPvc);
    });
    ozelFormKapat();
    pvcMenuEtiketYaz();
    if (girdi) girdi.value = "";
  } catch {
    durum.textContent = "Özel ölçü kaydedilemedi.";
  }
});

document.getElementById("silHayir")?.addEventListener("click", silOnayKapat);

document.getElementById("silEvet")?.addEventListener("click", async () => {
  if (silinecekPvc == null) return;
  const mm = silinecekPvc;
  try {
    const yanit = await magiCek(`/api/ozel-bant?mm=${encodeURIComponent(mm)}`, {
      method: "DELETE",
      headers: authBaslik(),
    });
    const veri = await yanit.json();
    if (!yanit.ok) {
      durum.textContent = veri.detail || "Ölçü silinemedi.";
      return;
    }
    ozelBantMm = (veri.ozel_bant_mm || []).map(Number);
    if (pvcEsit(revizyonPvc, mm)) revizyonPvc = 0.4;
    ozelPvcCiz();
    silOnayKapat();
  } catch {
    durum.textContent = "Ölçü silinemedi.";
  }
});

document.getElementById("revizyonKapat")?.addEventListener("click", perdeKapat);

document.querySelectorAll(".ok").forEach(btn => {
  btn.addEventListener("click", () => {
    const alan = btn.dataset.alan;
    const yon = Number(btn.dataset.yon);
    const id = alan === "boy" ? "revizyonBoy" : alan === "en" ? "revizyonEn" : "revizyonAdet";
    const girdi = document.getElementById(id);
    const n = Number(String(girdi.value).replace(",", ".")) || 0;
    const adim = alan === "adet" ? 1 : 1;
    girdi.value = String(Math.max(alan === "adet" ? 1 : 0, n + yon * adim));
  });
});

function hafizaParca(p) {
  const okunan = p?.okunan && typeof p.okunan === "object" ? p.okunan : {};
  return {
    ham_metin: p?.ham_metin || okunan.ham_metin || p?.not || "",
    uzunluk_mm: okunan.uzunluk_mm ?? p?.uzunluk_mm,
    genislik_mm: okunan.genislik_mm ?? p?.genislik_mm,
    adet: okunan.adet ?? p?.adet,
    parca_adi: okunan.parca_adi || p?.parca_adi || "",
    bant_kod: okunan.bant_kod || bantKod(p),
    malzeme: p?.malzeme || "",
    kalinlik_mm: p?.kalinlik_mm,
  };
}

async function hafizaGonder(orijinal, hedef) {
  try {
    const yanit = await magiCek("/api/usta-hafiza", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authBaslik() },
      body: JSON.stringify({ kayit_id: kayitId || "", orijinal, hedef }),
    });
    const veri = await yanit.json().catch(() => ({}));
    if (yanit.ok) ogrenmeYaz(veri.ogrenme);
  } catch (hata) {
    try { console.warn("magi hafiza", hata); } catch (_) {}
  }
}

document.getElementById("revizyonUygula")?.addEventListener("click", () => {
  if (revizyonIndeks == null || !sonJson) return;
  const boy = Number(String(document.getElementById("revizyonBoy").value).replace(",", "."));
  const en = Number(String(document.getElementById("revizyonEn").value).replace(",", "."));
  const adet = Number(String(document.getElementById("revizyonAdet").value).replace(",", "."));
  const kart = listeGovde.querySelector(`.parca[data-indeks="${revizyonIndeks}"]`);
  if (kart) {
    const yaz = (alan, deger) => {
      const el = kart.querySelector(`[data-alan="${alan}"]`);
      if (el) el.textContent = String(deger);
    };
    if (Number.isFinite(boy)) yaz("uzunluk_mm", boy);
    if (Number.isFinite(en)) yaz("genislik_mm", en);
    if (Number.isFinite(adet)) yaz("adet", adet);
    kartBantYaz(kart, bantKodundan(revizyonBit));
  }
  if (sonJson.kesim_listesi?.[revizyonIndeks]) {
    const p = sonJson.kesim_listesi[revizyonIndeks];
    const orijinal = hafizaParca(p);
    if (Number.isFinite(boy)) p.uzunluk_mm = boy;
    if (Number.isFinite(en)) p.genislik_mm = en;
    if (Number.isFinite(adet)) p.adet = adet;
    p.bant = { kod: bantKodundan(revizyonBit), pvc_mm: revizyonPvc };
    p.supheli = false;
    p.okunamadi = false;
    hafizaGonder(orijinal, {
      ham_metin: orijinal.ham_metin,
      uzunluk_mm: p.uzunluk_mm,
      genislik_mm: p.genislik_mm,
      adet: p.adet,
      parca_adi: p.parca_adi,
      bant: p.bant,
      malzeme: p.malzeme,
      kalinlik_mm: p.kalinlik_mm,
    });
  }
  ozetYaz(tablodanListe());
  perde.hidden = true;
  revizyonIndeks = null;
  arsiveYaz();
  if (supheBekliyor) supheSonraki();
});

document.getElementById("pvcMenuBtn")?.addEventListener("click", (ev) => {
  ev.stopPropagation();
  pvcMenuAcKapa();
});

document.getElementById("whatsappBtn").addEventListener("click", () => {
  if (!sonJson || !listeKesinMi()) return;
  ciftOnayAc("Kesim listesi kesinciye gönderilsin mi?", ustaGeriAc);
});

document.getElementById("indirBtn")?.addEventListener("click", () => {
  if (!sonJson || !listeKesinMi()) return;
  ciftOnayAc("Kesim listesini indirmek istiyor musunuz?", listeIndir);
});

document.getElementById("jsonBtn").addEventListener("click", () => {
  if (!sonJson) return;
  const blob = new Blob([JSON.stringify(sonJson, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kesim_listesi.json";
  a.click();
});

document.getElementById("yeniBtn").addEventListener("click", () => {
  ciftOnayAc("Yeni kâğıda geçmek istiyor musunuz? Mevcut liste kaybolabilir", yeniKagidaGec);
});

function whatsappGonder(ustaNotu) {
  if (!sonJson) return;
  const url = "https://wa.me/?text=" + encodeURIComponent(whatsappMetni(ustaNotu));
  window.open(url, "_blank", "noopener");
}

function ustaSessizlikKur() {
  clearTimeout(ustaSessizlikZamanlayici);
  ustaSessizlikZamanlayici = setTimeout(() => {
    ustaIstekDurdur = true;
    ustaDinlemeyiDurdur();
  }, SESSIZLIK_MS);
}

function ustaDinlemeyiDurdur() {
  ustaDinliyor = false;
  ustaMicBtn?.classList.remove("dinliyor");
  if (ustaMicBtn) ustaMicBtn.setAttribute("aria-pressed", "false");
  try { ustaTanima?.stop(); } catch { /* */ }
}

function ustaTanimaHazir() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  if (ustaTanima) return ustaTanima;
  const tanima = new SR();
  tanima.lang = "tr-TR";
  tanima.continuous = true;
  tanima.interimResults = true;
  tanima.maxAlternatives = 1;
  tanima.onresult = (ev) => {
    ustaSonSes = Date.now();
    ustaSessizlikKur();
    let ara = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const parca = ev.results[i][0]?.transcript || "";
      if (ev.results[i].isFinal) ustaSabitMetin = (ustaSabitMetin + " " + parca).trim();
      else ara += parca;
    }
    if (ustaGeriMetin) {
      ustaGeriMetin.value = (ustaSabitMetin + (ara ? " " + ara : "")).trim();
    }
  };
  tanima.onend = () => {
    if (!ustaGeriPerde || ustaGeriPerde.hidden) return;
    if (ustaIstekDurdur) {
      ustaDinliyor = false;
      ustaMicBtn?.classList.remove("dinliyor");
      if (ustaMicBtn) ustaMicBtn.setAttribute("aria-pressed", "false");
      return;
    }
    if (Date.now() - ustaSonSes < SESSIZLIK_MS) {
      try { tanima.start(); } catch { /* */ }
    } else {
      ustaDinlemeyiDurdur();
    }
  };
  tanima.onerror = () => {
    if (ustaIstekDurdur) ustaDinlemeyiDurdur();
  };
  ustaTanima = tanima;
  return tanima;
}

function ustaDinlemeyiBaslat() {
  const tanima = ustaTanimaHazir();
  if (!tanima) return;
  ustaIstekDurdur = false;
  ustaDinliyor = true;
  ustaSonSes = Date.now();
  ustaSabitMetin = (ustaGeriMetin?.value || "").trim();
  ustaMicBtn?.classList.add("dinliyor");
  if (ustaMicBtn) ustaMicBtn.setAttribute("aria-pressed", "true");
  ustaSessizlikKur();
  try { tanima.start(); } catch { /* zaten açık */ }
}

function ustaGeriKapat() {
  ustaIstekDurdur = true;
  clearTimeout(ustaSessizlikZamanlayici);
  ustaDinlemeyiDurdur();
  if (ustaGeriPerde) ustaGeriPerde.hidden = true;
}

function ustaGeriAc() {
  if (!sonJson || !ustaGeriPerde) {
    whatsappGonder();
    return;
  }
  if (ustaGeriMetin) ustaGeriMetin.value = "";
  ustaSabitMetin = "";
  ustaGeriPerde.hidden = false;
}

async function ustaGeriGonderVeWa() {
  const not = (ustaGeriMetin?.value || "").trim();
  ustaGeriKapat();
  if (not) {
    try {
      await magiCek("/api/usta-geri", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authBaslik() },
        body: JSON.stringify({ metin: not, kayit_id: kayitId || "" }),
      });
    } catch (hata) {
      try { console.warn("magi usta-geri", hata); } catch (_) {}
    }
  }
  whatsappGonder(not);
}

function listeIndir() {
  if (!sonJson) return;
  const blob = new Blob([whatsappMetni()], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kesim_listesi.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

function yeniKagidaGec() {
  taramaIptalEt();
  taramaKilit = false;
  sonDosyaImza = "";
  sonArsivImza = "";
  mercekDeneme = 0;
  kirpIptal += 1;
  foto.value = "";
  if (onizlemeSarici) onizlemeSarici.hidden = true;
  fotoCerceve?.classList.remove("dolu");
  if (onizlemeUrl) URL.revokeObjectURL(onizlemeUrl);
  onizlemeUrl = null;
  kirpBlob = null;
  sonuc.hidden = true;
  sonuc.classList.remove("liste-giris");
  durum.textContent = "";
  sonJson = null;
  kayitId = null;
  listeHazir = false;
  fotoKiyasAcik = false;
  supheBekliyor = false;
  okumaCalisiyor = false;
  if (supheKatman) supheKatman.innerHTML = "";
  if (supheCubuk) supheCubuk.hidden = true;
  buyutecGizle();
  mercekSifirla();
  yuklemeGoster(false);
  perde.hidden = true;
  revizyonIndeks = null;
  if (ustaOnayPerde) ustaOnayPerde.hidden = true;
  ustaGeriKapat();
  fotoKiyasAyarla(false);
  if (fotoBtn) fotoBtn.hidden = true;
  adimAyarla(1);
  rehberYaz("Kâğıdı düz tutup fotoğrafını çekin.");
  const wa = document.getElementById("whatsappBtn");
  const indir = document.getElementById("indirBtn");
  if (wa) wa.disabled = true;
  if (indir) indir.disabled = true;
  kaynakRozetYaz("");
  telUyariYaz(null);
}

document.getElementById("ciftOnayEvet")?.addEventListener("click", () => {
  const islem = ciftOnayIslem;
  ciftOnayKapat();
  if (typeof islem === "function") islem();
});
document.getElementById("ciftOnayHayir")?.addEventListener("click", ciftOnayKapat);
ciftOnayPerde?.addEventListener("click", (ev) => {
  if (ev.target === ciftOnayPerde) ciftOnayKapat();
});

ustaMicBtn?.addEventListener("click", () => {
  if (ustaDinliyor) {
    ustaIstekDurdur = true;
    ustaDinlemeyiDurdur();
    return;
  }
  ustaDinlemeyiBaslat();
});
document.getElementById("ustaGeriAtla")?.addEventListener("click", () => {
  ustaGeriGonderVeWa();
});
ustaGeriMetin?.addEventListener("input", () => {
  ustaSabitMetin = ustaGeriMetin.value;
});

fotoCerceve?.addEventListener("click", (ev) => {
  if (ev.target.closest("#buyutec, .buyutec, #onizlemeSarici")) {
    ev.preventDefault();
    ev.stopPropagation();
  }
});

fotoCerceve?.addEventListener("keydown", (ev) => {
  if (fotoCerceve.classList.contains("dolu")) return;
  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    foto?.click();
  }
});

fotoBtn?.addEventListener("click", () => {
  if (!listeHazir) return;
  fotoKiyasAyarla(!fotoKiyasAcik);
});

function supheOnceki() {
  if (!supheBekliyor || supheI <= 0) return;
  supheI -= 1;
  if (supheCubuk) supheCubuk.hidden = false;
  supheAdimGoster();
}

document.getElementById("supheGeri")?.addEventListener("click", supheOnceki);

document.getElementById("supheOnay")?.addEventListener("click", () => {
  const oge = supheKuyruk[supheI];
  if (sonJson?.kesim_listesi?.[oge?.i]) {
    const p = sonJson.kesim_listesi[oge.i];
    p.supheli = false;
    p.okunamadi = false;
    hafizaGonder(hafizaParca(p), {
      ham_metin: hafizaParca(p).ham_metin,
      uzunluk_mm: p.uzunluk_mm,
      genislik_mm: p.genislik_mm,
      adet: p.adet,
      parca_adi: p.parca_adi,
      bant: p.bant,
      malzeme: p.malzeme,
      kalinlik_mm: p.kalinlik_mm,
    });
  }
  supheSonraki();
});

document.getElementById("supheDuzelt")?.addEventListener("click", () => {
  const oge = supheKuyruk[supheI];
  if (supheCubuk) supheCubuk.hidden = true;
  if (oge) perdeAc(oge.i);
});

function mercekSurukBaslat(ev) {
  if (!mercekGorunurMu()) return;
  ev.preventDefault();
  ev.stopPropagation();
  mercekSuruk = { id: ev.pointerId };
  onizlemeSarici?.classList.add("surukleniyor");
  buyutecNoktayiAyarla(ev.clientX, ev.clientY);
  try { (ev.currentTarget || onizlemeSarici).setPointerCapture(ev.pointerId); } catch { /* */ }
}

onizlemeSarici?.addEventListener("pointerdown", mercekSurukBaslat);
buyutec?.addEventListener("pointerdown", mercekSurukBaslat);

function mercekSurukTasi(ev) {
  if (!mercekGorunurMu() || !mercekSuruk || mercekSuruk.id !== ev.pointerId) return;
  ev.preventDefault();
  buyutecNoktayiAyarla(ev.clientX, ev.clientY);
}

onizlemeSarici?.addEventListener("pointermove", mercekSurukTasi);
buyutec?.addEventListener("pointermove", mercekSurukTasi);

function mercekBirak(ev) {
  if (!mercekSuruk || mercekSuruk.id !== ev.pointerId) return;
  ev.preventDefault();
  mercekSuruk = null;
  onizlemeSarici?.classList.remove("surukleniyor");
}

onizlemeSarici?.addEventListener("pointerup", mercekBirak);
onizlemeSarici?.addEventListener("pointercancel", mercekBirak);
buyutec?.addEventListener("pointerup", mercekBirak);
buyutec?.addEventListener("pointercancel", mercekBirak);

onizlemeSarici?.addEventListener("wheel", (ev) => {
  if (!mercekGorunurMu()) return;
  ev.preventDefault();
  buyutecOlcek = Math.min(4.2, Math.max(1.6, buyutecOlcek * (ev.deltaY < 0 ? 1.08 : 1 / 1.08)));
  buyutecCiz();
}, { passive: false });

document.addEventListener("keydown", (ev) => {
  const hedef = ev.target;
  if (hedef && (hedef.closest?.("input, textarea, select, [contenteditable]") || hedef.isContentEditable)) return;
  if (!mercekGorunurMu() || (perde && !perde.hidden) || (ustaOnayPerde && !ustaOnayPerde.hidden)) return;
  const tus = ev.key;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(tus)) return;
  ev.preventDefault();
  const adim = ev.shiftKey ? 18 : 8;
  if (tus === "ArrowLeft") buyutecNokta.x -= adim;
  if (tus === "ArrowRight") buyutecNokta.x += adim;
  if (tus === "ArrowUp") buyutecNokta.y -= adim;
  if (tus === "ArrowDown") buyutecNokta.y += adim;
  buyutecCiz();
});

window.addEventListener("resize", () => {
  if (!mercekGorunurMu()) return;
  const oge = supheKuyruk[supheI];
  const parca = sonJson?.kesim_listesi?.[oge?.i];
  if (parca && supheBekliyor) {
    supheSeritCiz(parca.kutu);
  }
  buyutecCiz();
});

document.getElementById("filtreBtn")?.addEventListener("click", (ev) => {
  ev.preventDefault();
  ev.stopPropagation();
  const menu = document.getElementById("filtreMenu");
  const btn = document.getElementById("filtreBtn");
  if (!menu || !btn) return;
  const acik = menu.hidden;
  menu.hidden = !acik;
  btn.setAttribute("aria-expanded", acik ? "true" : "false");
  filtreMenuIsaretle();
});

document.getElementById("filtreMenu")?.addEventListener("click", (ev) => {
  ev.stopPropagation();
  const btn = ev.target.closest("[data-filtre]");
  if (!btn) return;
  listeFiltresi = btn.dataset.filtre || "tumu";
  filtreMenuIsaretle();
  filtreMenuKapat();
  if (sonJson) listeCiz(sonJson);
});

document.addEventListener("click", filtreMenuKapat);

document.addEventListener("visibilitychange", () => {
  const acik = Boolean(yuklemeAlani && !yuklemeAlani.hidden);
  yuklemeAlani?.classList.toggle("calisiyor", acik && !document.hidden);
  if (document.hidden) hapticDokun(0);
});

window.addEventListener("pagehide", () => {
  nabizIptal();
  sesDurdur();
  hapticDokun(0);
  yuklemeAlani?.classList.remove("calisiyor");
});

window.addEventListener("pageshow", () => {
  if (yuklemeAlani && !yuklemeAlani.hidden) {
    yuklemeAlani.classList.toggle("calisiyor", !document.hidden);
    if (taramaHissiAcik) nabizKur();
  }
});

durumYukle();
