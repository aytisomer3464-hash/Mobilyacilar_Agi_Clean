/** Tarayıcıda kâğıt köşe/perspektif kırpma; ham 10–15 MB sunucuya gitmez. */
(function (kok) {
  const ANALIZ = 800;
  const MAX_KENAR = 2200;
  const KALITE = 0.86;
  const MIN_ALAN = 0.10;
  const MAKS_ALAN = 0.96;

  function iptal(sinyal) {
    if (sinyal && sinyal.aborted) {
      const h = new Error("AbortError");
      h.name = "AbortError";
      throw h;
    }
  }

  async function bitmapAl(dosya) {
    try {
      return await createImageBitmap(dosya, { imageOrientation: "from-image" });
    } catch {
      return await createImageBitmap(dosya);
    }
  }

  function canvasCiz(kaynak, w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(kaynak, 0, 0, c.width, c.height);
    return { canvas: c, ctx };
  }

  function otsuEsik(gri, n) {
    const hist = new Array(256).fill(0);
    for (let i = 0; i < n; i++) hist[gri[i]] += 1;
    let toplam = 0;
    for (let i = 0; i < 256; i++) toplam += i * hist[i];
    let wB = 0;
    let sumB = 0;
    let en = 0;
    let esik = 127;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (!wB) continue;
      const wF = n - wB;
      if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (toplam - sumB) / wF;
      const ara = wB * wF * (mB - mF) * (mB - mF);
      if (ara > en) {
        en = ara;
        esik = t;
      }
    }
    return esik;
  }

  function genisle(bin, w, h) {
    const out = new Uint8Array(bin.length);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let v = 0;
        for (let dy = -1; dy <= 1 && !v; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (bin[(y + dy) * w + (x + dx)]) {
              v = 1;
              break;
            }
          }
        }
        out[y * w + x] = v;
      }
    }
    return out;
  }

  function enBuyukLeke(bin, w, h) {
    const goruldu = new Uint8Array(bin.length);
    let enAlan = 0;
    let enEtiket = 0;
    const etiket = new Int32Array(bin.length);
    let no = 1;
    const yigin = [];
    for (let i = 0; i < bin.length; i++) {
      if (!bin[i] || goruldu[i]) continue;
      no += 1;
      let alan = 0;
      yigin.push(i);
      goruldu[i] = 1;
      while (yigin.length) {
        const p = yigin.pop();
        etiket[p] = no;
        alan += 1;
        const x = p % w;
        const y = (p - x) / w;
        const komsu = [p - 1, p + 1, p - w, p + w];
        const sinir = [x > 0, x < w - 1, y > 0, y < h - 1];
        for (let k = 0; k < 4; k++) {
          if (!sinir[k]) continue;
          const q = komsu[k];
          if (bin[q] && !goruldu[q]) {
            goruldu[q] = 1;
            yigin.push(q);
          }
        }
      }
      if (alan > enAlan) {
        enAlan = alan;
        enEtiket = no;
      }
    }
    return { etiket, enEtiket, enAlan };
  }

  function dortKose(etiket, hedef, w, h) {
    let minT = Infinity;
    let maxT = -Infinity;
    let minF = Infinity;
    let maxF = -Infinity;
    let tl = null;
    let br = null;
    let tr = null;
    let bl = null;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (etiket[y * w + x] !== hedef) continue;
        const t = x + y;
        const f = x - y;
        if (t < minT) {
          minT = t;
          tl = [x, y];
        }
        if (t > maxT) {
          maxT = t;
          br = [x, y];
        }
        if (f < minF) {
          minF = f;
          bl = [x, y];
        }
        if (f > maxF) {
          maxF = f;
          tr = [x, y];
        }
      }
    }
    if (!tl || !tr || !br || !bl) return null;
    return [tl, tr, br, bl];
  }

  function koselerGecerli(koseler, w, h, alan) {
    if (!koseler || koseler.length !== 4) return false;
    const cerceve = w * h;
    if (alan < cerceve * MIN_ALAN || alan > cerceve * MAKS_ALAN) return false;
    const xs = koseler.map((p) => p[0]);
    const ys = koseler.map((p) => p[1]);
    const kenar = (Math.min(...xs) <= 2) + (Math.min(...ys) <= 2)
      + (Math.max(...xs) >= w - 3) + (Math.max(...ys) >= h - 3);
    if (kenar >= 3 && alan > cerceve * 0.88) return false;
    return true;
  }

  function lineerCoz(A, b) {
    const n = b.length;
    const M = A.map((satir, i) => satir.concat(b[i]));
    for (let i = 0; i < n; i++) {
      let max = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(M[k][i]) > Math.abs(M[max][i])) max = k;
      }
      const tmp = M[i];
      M[i] = M[max];
      M[max] = tmp;
      const piv = M[i][i];
      if (Math.abs(piv) < 1e-10) return null;
      for (let j = i; j <= n; j++) M[i][j] /= piv;
      for (let k = 0; k < n; k++) {
        if (k === i) continue;
        const f = M[k][i];
        for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
      }
    }
    return M.map((satir) => satir[n]);
  }

  function homografi(kaynak, hedef) {
    const A = [];
    const b = [];
    for (let i = 0; i < 4; i++) {
      const x = kaynak[i][0];
      const y = kaynak[i][1];
      const u = hedef[i][0];
      const v = hedef[i][1];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
      b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
      b.push(v);
    }
    const h = lineerCoz(A, b);
    if (!h) return null;
    return h.concat(1);
  }

  function noktaH(H, x, y) {
    const den = H[6] * x + H[7] * y + H[8];
    if (Math.abs(den) < 1e-12) return [0, 0];
    return [(H[0] * x + H[1] * y + H[2]) / den, (H[3] * x + H[4] * y + H[5]) / den];
  }

  function uzaklik(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  function koseBul(data, w, h) {
    const n = w * h;
    const gri = new Uint8Array(n);
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      gri[i] = (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8;
    }
    const esik = otsuEsik(gri, n);
    const denemeler = [1, 0];
    let enIyi = null;
    for (const kagitAcik of denemeler) {
      const ham = new Uint8Array(n);
      for (let i = 0; i < n; i++) ham[i] = kagitAcik ? (gri[i] >= esik ? 1 : 0) : (gri[i] < esik ? 1 : 0);
      const bin = genisle(genisle(ham, w, h), w, h);
      const { etiket, enEtiket, enAlan } = enBuyukLeke(bin, w, h);
      if (!enEtiket) continue;
      const koseler = dortKose(etiket, enEtiket, w, h);
      if (!koselerGecerli(koseler, w, h, enAlan)) continue;
      enIyi = koseler;
      break;
    }
    return enIyi;
  }

  function warp(kaynak, sw, sh, H, dw, dh) {
    const c = document.createElement("canvas");
    c.width = dw;
    c.height = dh;
    const ctx = c.getContext("2d");
    const dest = ctx.createImageData(dw, dh);
    const srcC = document.createElement("canvas");
    srcC.width = sw;
    srcC.height = sh;
    srcC.getContext("2d").drawImage(kaynak, 0, 0, sw, sh);
    const src = srcC.getContext("2d").getImageData(0, 0, sw, sh).data;
    const out = dest.data;
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const [sx, sy] = noktaH(H, x, y);
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        if (x0 < 0 || y0 < 0 || x0 >= sw - 1 || y0 >= sh - 1) continue;
        const fx = sx - x0;
        const fy = sy - y0;
        const i00 = (y0 * sw + x0) * 4;
        const i10 = i00 + 4;
        const i01 = i00 + sw * 4;
        const i11 = i01 + 4;
        const o = (y * dw + x) * 4;
        for (let k = 0; k < 3; k++) {
          const v = src[i00 + k] * (1 - fx) * (1 - fy)
            + src[i10 + k] * fx * (1 - fy)
            + src[i01 + k] * (1 - fx) * fy
            + src[i11 + k] * fx * fy;
          out[o + k] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
        out[o + 3] = 255;
      }
    }
    ctx.putImageData(dest, 0, 0);
    return c;
  }

  function jpegBlob(canvas, kalite) {
    return new Promise((coz, red) => {
      canvas.toBlob((b) => {
        if (b) coz(b);
        else red(new Error("JPEG yazılamadı"));
      }, "image/jpeg", kalite);
    });
  }

  async function sadeceKucult(bmp, maxKenar, kalite) {
    const olcek = Math.min(1, maxKenar / Math.max(bmp.width, bmp.height));
    const { canvas } = canvasCiz(bmp, bmp.width * olcek, bmp.height * olcek);
    return jpegBlob(canvas, kalite);
  }

  async function kagidiKirpDosya(dosya, secenek) {
    const sinyal = secenek && secenek.signal;
    const maxKenar = (secenek && secenek.maxKenar) || MAX_KENAR;
    const kalite = (secenek && secenek.kalite) || KALITE;
    iptal(sinyal);
    const bmp = await bitmapAl(dosya);
    iptal(sinyal);
    try {
      const aOlcek = Math.min(1, ANALIZ / Math.max(bmp.width, bmp.height));
      const aw = Math.max(8, Math.round(bmp.width * aOlcek));
      const ah = Math.max(8, Math.round(bmp.height * aOlcek));
      const analiz = canvasCiz(bmp, aw, ah);
      const img = analiz.ctx.getImageData(0, 0, aw, ah);
      const koselerKucuk = koseBul(img.data, aw, ah);
      if (!koselerKucuk) return { blob: await sadeceKucult(bmp, maxKenar, kalite), kirpildi: false };

      const koseler = koselerKucuk.map((p) => [p[0] / aOlcek, p[1] / aOlcek]);
      const [tl, tr, br, bl] = koseler;
      let dw = Math.round(Math.max(uzaklik(tl, tr), uzaklik(bl, br)));
      let dh = Math.round(Math.max(uzaklik(tl, bl), uzaklik(tr, br)));
      const sinir = Math.min(1, maxKenar / Math.max(dw, dh, 1));
      dw = Math.max(48, Math.round(dw * sinir));
      dh = Math.max(48, Math.round(dh * sinir));
      const hedef = [[0, 0], [dw - 1, 0], [dw - 1, dh - 1], [0, dh - 1]];
      const H = homografi(hedef, koseler);
      if (!H) return { blob: await sadeceKucult(bmp, maxKenar, kalite), kirpildi: false };

      await new Promise((r) => requestAnimationFrame(r));
      iptal(sinyal);
      const kaynakOlcek = Math.min(1, maxKenar / Math.max(bmp.width, bmp.height));
      const sw = Math.round(bmp.width * kaynakOlcek);
      const sh = Math.round(bmp.height * kaynakOlcek);
      const kH = homografi(
        hedef,
        koseler.map((p) => [p[0] * kaynakOlcek, p[1] * kaynakOlcek]),
      );
      if (!kH) return { blob: await sadeceKucult(bmp, maxKenar, kalite), kirpildi: false };
      const kucukBmp = kaynakOlcek < 1 ? canvasCiz(bmp, sw, sh).canvas : bmp;
      const warpli = warp(kucukBmp, sw, sh, kH, dw, dh);
      const blob = await jpegBlob(warpli, kalite);
      return { blob, kirpildi: true };
    } finally {
      try { bmp.close(); } catch { /* */ }
    }
  }

  kok.KesimKirpici = { kagidiKirpDosya };
})(window);
