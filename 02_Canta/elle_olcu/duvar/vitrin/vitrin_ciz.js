(function () {
  var GEREK_RENK = {
    oda_zemin: "rgba(226, 232, 240, 0.92)",
    seramik: "rgba(148, 163, 184, 0.85)",
    kapi: "rgba(120, 53, 15, 0.9)",
    esik: "rgba(180, 83, 9, 0.92)",
    sifon: "rgba(14, 116, 144, 0.85)",
    yukselti: "rgba(180, 83, 9, 0.8)",
    mermer: "rgba(71, 85, 105, 0.85)"
  };

  window.VitrinCizKur = function (B) {
    function sahne() {
      return B.sahne;
    }

    function kusHarita() {
      var s = sahne();
      var cv = s.canvas;
      var w = cv.width;
      var h = cv.height;
      var o = B.taslakOlcu();
      var en = o.en;
      var boy = o.boy;
      var pay = Math.max(280, Math.round(Math.min(en, boy) * 0.22));
      var pad = 36;
      var olcek = Math.min((w - 2 * pad) / (en + 2 * pay), (h - 2 * pad) / (boy + 2 * pay)) * B.camOlcek;
      var x0 = (w - en * olcek) / 2 + B.camX;
      var yAlt = (h + boy * olcek) / 2 + B.camY;
      return {
        en: en, boy: boy, olcek: olcek, x0: x0, yAlt: yAlt, pay: pay,
        sx: function (x) { return x0 + x * olcek; },
        sy: function (z) { return yAlt - z * olcek; },
        mm: function (px, py) {
          return { x: (px - x0) / olcek, z: (yAlt - py) / olcek };
        }
      };
    }

    function olcuYazi(s, x, y, metin, hiza, taban) {
      s.font = "800 14px Segoe UI";
      s.textAlign = hiza || "center";
      s.textBaseline = taban || "bottom";
      s.lineJoin = "round";
      s.lineWidth = 4;
      s.strokeStyle = "#0f172a";
      s.strokeText(metin, x, y);
      s.fillStyle = "#fde68a";
      s.fillText(metin, x, y);
    }

    function cizOdaCetvel(sx, sy, en, boy, pay) {
      var s = sahne();
      var O = B.O;
      s.strokeStyle = "#f8fafc";
      s.lineWidth = 2.4;
      s.beginPath();
      s.moveTo(sx(0), sy(0));
      s.lineTo(sx(0), sy(-pay));
      s.lineTo(sx(en), sy(-pay));
      s.lineTo(sx(en), sy(0));
      s.moveTo(sx(0), sy(0));
      s.lineTo(sx(-pay), sy(0));
      s.lineTo(sx(-pay), sy(boy));
      s.lineTo(sx(0), sy(boy));
      s.stroke();
      olcuYazi(s, sx(en / 2), sy(-pay) - 6, O.yazi(en), "center", "bottom");
      olcuYazi(s, sx(-pay * 0.72), sy(boy / 2), O.yazi(boy), "center", "middle");
    }

    function cizParcaCetvel(sx, sy, g, odaEn, odaBoy, pay) {
      if (!g) return;
      var s = sahne();
      var O = B.O;
      var a = g.x;
      var b = g.x + g.en;
      var c = g.z;
      var d = g.z + g.boy;
      s.strokeStyle = "#fde68a";
      s.lineWidth = 2.2;
      function tikEn(x) {
        s.beginPath();
        s.moveTo(sx(x), sy(0));
        s.lineTo(sx(x), sy(-pay));
        s.stroke();
      }
      tikEn(0);
      tikEn(a);
      tikEn(b);
      tikEn(odaEn);
      s.beginPath();
      s.moveTo(sx(0), sy(-pay));
      s.lineTo(sx(odaEn), sy(-pay));
      s.stroke();
      s.setLineDash([5, 4]);
      s.lineWidth = 1.4;
      s.beginPath();
      s.moveTo(sx(a), sy(c));
      s.lineTo(sx(a), sy(-pay));
      s.moveTo(sx(b), sy(c));
      s.lineTo(sx(b), sy(-pay));
      s.moveTo(sx(a), sy(c));
      s.lineTo(sx(-pay), sy(c));
      s.moveTo(sx(a), sy(d));
      s.lineTo(sx(-pay), sy(d));
      s.stroke();
      s.setLineDash([]);
      if (a > 20) olcuYazi(s, sx(a / 2), sy(-pay) - 6, O.yazi(a), "center", "bottom");
      olcuYazi(s, sx((a + b) / 2), sy(-pay) - 6, O.yazi(g.en), "center", "bottom");
      if (odaEn - b > 20) olcuYazi(s, sx((b + odaEn) / 2), sy(-pay) - 6, O.yazi(odaEn - b), "center", "bottom");
      function tikBoy(z) {
        s.beginPath();
        s.moveTo(sx(0), sy(z));
        s.lineTo(sx(-pay), sy(z));
        s.stroke();
      }
      s.strokeStyle = "#fde68a";
      s.lineWidth = 2.2;
      tikBoy(0);
      tikBoy(c);
      tikBoy(d);
      tikBoy(odaBoy);
      s.beginPath();
      s.moveTo(sx(-pay), sy(0));
      s.lineTo(sx(-pay), sy(odaBoy));
      s.stroke();
      if (c > 20) olcuYazi(s, sx(-pay / 2), sy(c / 2), O.yazi(c), "center", "middle");
      olcuYazi(s, sx(-pay / 2), sy((c + d) / 2), O.yazi(g.boy), "center", "middle");
      if (odaBoy - d > 20) olcuYazi(s, sx(-pay / 2), sy((d + odaBoy) / 2), O.yazi(odaBoy - d), "center", "middle");
    }

    function cizGerecler2d(sx, sy) {
      var s = sahne();
      var yerlesim = B.yerlesim;
      var i, g, olcek, sira;
      olcek = sx(1) - sx(0);
      sira = [];
      for (i = 0; i < yerlesim.length; i++) {
        if (yerlesim[i].tip === "oda_zemin") sira.push(i);
      }
      for (i = 0; i < yerlesim.length; i++) {
        if (yerlesim[i].tip !== "oda_zemin") sira.push(i);
      }
      for (i = 0; i < sira.length; i++) {
        g = yerlesim[sira[i]];
        if (g.tip === "oda_zemin" && B.camSeciliTip !== "oda_zemin") continue;
        s.fillStyle = GEREK_RENK[g.tip] || "#64748b";
        s.fillRect(sx(g.x), sy(g.z + g.boy), g.en * olcek, g.boy * olcek);
        if (g.tip === "yukselti") {
          var yMetin = g.yno > 0 ? "Y" + g.yno : "";
          var yUz = (g.kenar === 0 || g.kenar === 2) ? g.en : g.boy;
          if (B.camSeciliTip === "yukselti" && yUz > 0) yMetin = (yMetin ? yMetin + "  " : "") + B.O.yazi(yUz);
          if (g.p && g.p.kod > 0) yMetin = (yMetin ? yMetin + "  " : "") + "+" + B.O.yazi(g.p.kod);
          if (yMetin) olcuYazi(s, sx(g.x + g.en / 2), sy(g.z + g.boy / 2), yMetin, "center", "middle");
        }
        if (sira[i] === B.seciliIx) {
          s.strokeStyle = "#2563eb";
          s.lineWidth = 3;
          s.strokeRect(sx(g.x), sy(g.z + g.boy), g.en * olcek, g.boy * olcek);
        }
      }
      if (B.onizleme) {
        g = B.onizleme;
        s.fillStyle = GEREK_RENK[g.tip] || "#64748b";
        s.globalAlpha = 0.7;
        s.fillRect(sx(g.x), sy(g.z + g.boy), g.en * olcek, g.boy * olcek);
        s.globalAlpha = 1;
        s.strokeStyle = "#1e3a5f";
        s.lineWidth = 2;
        s.strokeRect(sx(g.x), sy(g.z + g.boy), g.en * olcek, g.boy * olcek);
      }
    }

    function doldurDuvarKutu(kenar, x0, y0, z0, x1, y1, z1, cam) {
      var t;
      if (x1 < x0) { t = x0; x0 = x1; x1 = t; }
      if (y1 < y0) { t = y0; y0 = y1; y1 = t; }
      if (z1 < z0) { t = z0; z0 = z1; z1 = t; }
      if (x1 - x0 < 1 || y1 - y0 < 1 || z1 - z0 < 1) return;
      var kirik = "#f4f1ea";
      var ic = "#e8e4dc";
      var cizgi = "#c4b8a8";
      var yuz = [
        { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], ic: kenar === "arka" },
        { pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], ic: kenar === "on" },
        { pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], ic: kenar === "sag" },
        { pts: [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], ic: kenar === "sol" },
        { pts: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], ic: false },
        { pts: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], ic: false }
      ];
      yuz.sort(function (a, b) {
        var ca = (a.pts[0][0] + a.pts[2][0]) / 2 - cam.ex, da = (a.pts[0][1] + a.pts[2][1]) / 2 - cam.ey, ea = (a.pts[0][2] + a.pts[2][2]) / 2 - cam.ez;
        var cb = (b.pts[0][0] + b.pts[2][0]) / 2 - cam.ex, db = (b.pts[0][1] + b.pts[2][1]) / 2 - cam.ey, eb = (b.pts[0][2] + b.pts[2][2]) / 2 - cam.ez;
        return (cb * cb + db * db + eb * eb) - (ca * ca + da * da + ea * ea);
      });
      var i;
      for (i = 0; i < yuz.length; i++) doldurYuz(yuz[i].pts, yuz[i].ic ? ic : kirik, cizgi, cam);
    }

    function doldurKutu(x0, y0, z0, x1, y1, z1, dolgu, cizgi, cam) {
      var t;
      if (x1 < x0) { t = x0; x0 = x1; x1 = t; }
      if (y1 < y0) { t = y0; y0 = y1; y1 = t; }
      if (z1 < z0) { t = z0; z0 = z1; z1 = t; }
      if (x1 - x0 < 1 || y1 - y0 < 1 || z1 - z0 < 1) return;
      var yuz = [
        [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
        [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
        [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
        [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]],
        [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
        [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]
      ];
      yuz.sort(function (a, b) {
        var ca = (a[0][0] + a[2][0]) / 2 - cam.ex, da = (a[0][1] + a[2][1]) / 2 - cam.ey, ea = (a[0][2] + a[2][2]) / 2 - cam.ez;
        var cb = (b[0][0] + b[2][0]) / 2 - cam.ex, db = (b[0][1] + b[2][1]) / 2 - cam.ey, eb = (b[0][2] + b[2][2]) / 2 - cam.ez;
        return (cb * cb + db * db + eb * eb) - (ca * ca + da * da + ea * ea);
      });
      var i;
      for (i = 0; i < yuz.length; i++) doldurYuz(yuz[i], dolgu, cizgi, cam);
    }

    function duvarKalCiz(kenar) {
      var k = B.duvarKalinlikKenar ? B.duvarKalinlikKenar(kenar) : 0;
      return k > 0 ? k : 150;
    }

    function cizGerecler3d(cam) {
      var yerlesim = B.yerlesim;
      var i, g, yuk;
      for (i = 0; i < yerlesim.length; i++) {
        g = yerlesim[i];
        if (g.tip === "oda_zemin") continue;
        yuk = 80;
        if (g.tip === "yukselti") yuk = (g.p && g.p.yukseklik > 0) ? g.p.yukseklik : 150;
        else if (g.tip === "sifon") yuk = 50;
        else if (g.tip === "esik" || g.tip === "kapi") yuk = (g.p && g.p.yukseklik > 0) ? g.p.yukseklik : ((g.p && g.p.kasa > 0) ? g.p.kasa : 80);
        doldurKutu(g.x, 0, g.z, g.x + g.en, yuk, g.z + g.boy, GEREK_RENK[g.tip] || "#64748b", "#7c2d12", cam);
      }
    }

    function cepheKanatKutu(no, sol, alt, en, boy, icMm, oEn, oBoy, kal) {
      var y0 = alt, y1 = alt + boy, w = en;
      var d = icMm > 0 ? icMm : 50;
      if (d > kal) d = kal;
      if (no === 1) return [sol, y0, kal - d, sol + w, y1, kal];
      if (no === 2) return [oEn - kal, y0, sol, oEn - kal + d, y1, sol + w];
      if (no === 3) return [oEn - sol - w, y0, oBoy - kal, oEn - sol, y1, oBoy - kal + d];
      return [kal - d, y0, oBoy - sol - w, kal, y1, oBoy - sol];
    }

    function cepheKutu(no, sol, alt, en, boy, cik, oEn, oBoy, kal) {
      var y0 = alt, y1 = alt + boy, w = en, d = cik > 0 ? cik : kal;
      if (!(d > 0)) d = kal > 0 ? kal : 150;
      if (no === 1) return [sol, y0, 0, sol + w, y1, d];
      if (no === 2) return [oEn - d, y0, sol, oEn, y1, sol + w];
      if (no === 3) return [oEn - sol - w, y0, oBoy - d, oEn - sol, y1, oBoy];
      return [0, y0, oBoy - sol - w, d, y1, oBoy - sol];
    }

    function duvarElemanRenk(e) {
      if (e.sinif === "void") return ["rgba(30, 41, 59, 0.82)", "#0f172a"];
      if (e.sinif === "protrusion") return ["rgba(234, 88, 12, 0.78)", "#9a3412"];
      return ["rgba(71, 85, 105, 0.78)", "#334155"];
    }

    function cizDuvarEleman(cam, oEn, oBoy) {
      var liste = (B.durum && B.durum.elemanlar) || [];
      var i, e, nos, ni, no, sol, kutu, kanat, renk, kal, kenar, icMm;
      var MOTOR_KENAR = { 1: "on", 2: "sag", 3: "arka", 4: "sol" };
      for (i = 0; i < liste.length; i++) {
        e = liste[i];
        nos = e.duvarlar && e.duvarlar.length ? e.duvarlar : [e.duvar_no];
        renk = duvarElemanRenk(e);
        for (ni = 0; ni < nos.length; ni++) {
          no = nos[ni];
          kenar = MOTOR_KENAR[no] || "on";
          kal = duvarKalCiz(kenar);
          sol = no === e.duvar_no ? e.sol : 0;
          if (e.tip === "kapi" || e.tip === "pencere") {
            if (e.tip === "kapi" && !e.kapi) continue;
            kutu = cepheKutu(no, sol, e.alt, e.en, e.boy, kal, oEn, oBoy, kal);
            doldurKutu(kutu[0], kutu[1], kutu[2], kutu[3], kutu[4], kutu[5], "#d4cfc6", "#b8b0a4", cam);
            icMm = e.tip === "kapi" ? ((e.kasa && e.kasa.pervaz === "var") ? 70 : 50) : 60;
            kanat = cepheKanatKutu(no, sol, e.alt, e.en, e.boy, icMm, oEn, oBoy, kal);
            doldurKutu(kanat[0], kanat[1], kanat[2], kanat[3], kanat[4], kanat[5],
              (e.tip === "kapi" && e.kapi && e.kapi.camli) ? "#b8d4e8" : (e.tip === "kapi" ? "#c4a484" : "#b8d4e8"),
              e.tip === "kapi" ? "#7c2d12" : "#64748b", cam);
          } else {
            kutu = cepheKutu(no, sol, e.alt, e.en, e.boy, e.cikinti_mm || 0, oEn, oBoy, kal);
            doldurKutu(kutu[0], kutu[1], kutu[2], kutu[3], kutu[4], kutu[5], renk[0], renk[1], cam);
          }
        }
      }
    }

    function kutuEkran(k, cam) {
      var kos = [
        [k[0], k[1], k[2]], [k[3], k[1], k[2]], [k[3], k[4], k[2]], [k[0], k[4], k[2]],
        [k[0], k[1], k[5]], [k[3], k[1], k[5]], [k[3], k[4], k[5]], [k[0], k[4], k[5]]
      ];
      var i, p, minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9, rz = 1e9;
      for (i = 0; i < kos.length; i++) {
        p = proje(kos[i][0], kos[i][1], kos[i][2], cam);
        if (p.x < minx) minx = p.x;
        if (p.y < miny) miny = p.y;
        if (p.x > maxx) maxx = p.x;
        if (p.y > maxy) maxy = p.y;
        if (p.rz != null && p.rz < rz) rz = p.rz;
      }
      return { minx: minx, miny: miny, maxx: maxx, maxy: maxy, rz: rz };
    }

    function elemanBul(px, py) {
      var durum = B.durum;
      if (!durum || B.motorSayfa !== "duvar") return -1;
      var oEn = durum.oda ? durum.oda.en : 4000;
      var oBoy = durum.oda ? durum.oda.boy : 3000;
      var yuk = durum.oda && durum.oda.yuk > 0 ? durum.oda.yuk : 2600;
      var cv = sahne().canvas;
      var cam = yorungeCam(cv.width, cv.height, oEn, oBoy, yuk);
      var liste = durum.elemanlar || [];
      var MOTOR_KENAR = { 1: "on", 2: "sag", 3: "arka", 4: "sol" };
      var i, e, no, kenar, kal, kutu, ekran, ix = -1, enIyi = 1e9;
      for (i = 0; i < liste.length; i++) {
        e = liste[i];
        if (e.tip === "pimas") continue;
        no = e.duvar_no;
        kenar = MOTOR_KENAR[no] || "on";
        kal = duvarKalCiz(kenar);
        kutu = cepheKutu(no, e.sol, e.alt, e.en, e.boy, e.cikinti_mm || 0, oEn, oBoy, kal);
        if (e.tip === "kapi" || e.tip === "pencere") kutu = cepheKutu(no, e.sol, e.alt, e.en, e.boy, kal, oEn, oBoy, kal);
        ekran = kutuEkran(kutu, cam);
        if (px < ekran.minx || px > ekran.maxx || py < ekran.miny || py > ekran.maxy) continue;
        if (ekran.rz < enIyi) {
          enIyi = ekran.rz;
          ix = i;
        }
      }
      return ix;
    }

    function cizDuvarKod3d(cam, en, boy, yuk) {
      var s = sahne();
      var kenarlar = ["on", "sag", "arka", "sol"];
      var i, kenar, kal, x, y, z, p, sec, ad;
      y = yuk * 0.72;
      for (i = 0; i < kenarlar.length; i++) {
        kenar = kenarlar[i];
        if (B.duvarOruluKenar && !B.duvarOruluKenar(kenar)) continue;
        kal = duvarKalCiz(kenar);
        if (kenar === "on") { x = en / 2; z = kal + 8; }
        else if (kenar === "arka") { x = en / 2; z = boy - kal - 8; }
        else if (kenar === "sol") { x = kal + 8; z = boy / 2; }
        else { x = en - kal - 8; z = boy / 2; }
        p = proje(x, y, z, cam);
        ad = B.duvarDYazi ? B.duvarDYazi(kenar) : kenar;
        sec = B.duvarSecKenar === kenar;
        s.font = (sec ? "800 22px " : "800 16px ") + "Segoe UI, sans-serif";
        s.textAlign = "center";
        s.textBaseline = "middle";
        s.lineWidth = 4;
        s.strokeStyle = "#e8e4dc";
        s.strokeText(ad, p.x, p.y);
        s.fillStyle = sec ? "#fb923c" : "#7c2d12";
        s.fillText(ad, p.x, p.y);
      }
    }

    function kareAdim() {
      return 1000;
    }

    function cizAtolyeAlan(w, h) {
      var s = sahne();
      s.fillStyle = "#3a4046";
      s.fillRect(0, 0, w, h);
      var k = kusHarita();
      var a = k.mm(0, 0);
      var b = k.mm(w, h);
      var xMin = Math.min(a.x, b.x);
      var xMax = Math.max(a.x, b.x);
      var zMin = Math.min(a.z, b.z);
      var zMax = Math.max(a.z, b.z);
      var adim = kareAdim();
      var x0 = Math.floor(xMin / adim) * adim;
      var z0 = Math.floor(zMin / adim) * adim;
      var sx = k.sx;
      var sy = k.sy;
      var x, z, n;
      s.beginPath();
      s.strokeStyle = "rgba(255,255,255,0.11)";
      s.lineWidth = 1;
      n = 0;
      for (x = x0; x <= xMax + adim && n < 80; x += adim, n++) {
        s.moveTo(sx(x), sy(zMin - adim));
        s.lineTo(sx(x), sy(zMax + adim));
      }
      n = 0;
      for (z = z0; z <= zMax + adim && n < 80; z += adim, n++) {
        s.moveTo(sx(xMin - adim), sy(z));
        s.lineTo(sx(xMax + adim), sy(z));
      }
      s.stroke();
      s.beginPath();
      s.strokeStyle = "rgba(255,255,255,0.22)";
      s.lineWidth = 1.4;
      n = 0;
      for (x = Math.floor(x0 / (adim * 5)) * adim * 5; x <= xMax + adim && n < 24; x += adim * 5, n++) {
        s.moveTo(sx(x), sy(zMin - adim));
        s.lineTo(sx(x), sy(zMax + adim));
      }
      n = 0;
      for (z = Math.floor(z0 / (adim * 5)) * adim * 5; z <= zMax + adim && n < 24; z += adim * 5, n++) {
        s.moveTo(sx(xMin - adim), sy(z));
        s.lineTo(sx(xMax + adim), sy(z));
      }
      s.stroke();
    }

    function cizIzgar3d(cam, en, boy) {
      var s = sahne();
      var adim = kareAdim();
      var pay = Math.max(en, boy) * 3;
      var xMin = -pay;
      var xMax = en + pay;
      var zMin = -pay;
      var zMax = boy + pay;
      var x0 = Math.floor(xMin / adim) * adim;
      var z0 = Math.floor(zMin / adim) * adim;
      var x, z, n, p, q;
      s.beginPath();
      s.strokeStyle = "rgba(255,255,255,0.16)";
      s.lineWidth = 1;
      n = 0;
      for (x = x0; x <= xMax && n < 70; x += adim, n++) {
        p = proje(x, 0, zMin, cam);
        q = proje(x, 0, zMax, cam);
        s.moveTo(p.x, p.y);
        s.lineTo(q.x, q.y);
      }
      n = 0;
      for (z = z0; z <= zMax && n < 70; z += adim, n++) {
        p = proje(xMin, 0, z, cam);
        q = proje(xMax, 0, z, cam);
        s.moveTo(p.x, p.y);
        s.lineTo(q.x, q.y);
      }
      s.stroke();
    }

    function ekOnizleme() {
      if (B.zeminDurum && B.zeminDurum.ekler && B.zeminDurum.ekler.length) return B.zeminDurum.ekler;
      if (B.ekListe && B.ekListe.length) return B.ekListe;
      return [];
    }

    function lIc(en, boy) {
      var a = B.lIc1 > 0 ? B.lIc1 : Math.max(800, Math.round(en * 0.38));
      var b = B.lIc2 > 0 ? B.lIc2 : Math.max(600, Math.round(boy * 0.38));
      if (a >= en) a = Math.max(1, en - 200);
      if (b >= boy) b = Math.max(1, boy - 200);
      return { ic1: a, ic2: b };
    }

    function lYol(en, boy) {
      var i = lIc(en, boy);
      var x = en - i.ic1;
      var z = boy - i.ic2;
      return [[0, 0], [en, 0], [en, z], [x, z], [x, boy], [0, boy]];
    }

    function ekKutuMm(en, boy, e) {
      var kenar = e.kenar || "sag";
      var uz = int(e.en, 800);
      var der = int(e.boy, 400);
      var kay = int(e.kayma, Math.round((kenar === "on" || kenar === "arka" ? en : boy) * 0.3));
      function int(v, d) {
        var n = parseFloat(v);
        return n > 0 ? n : d;
      }
      if (kenar === "sol") {
        return { x: e.tip === "cikinti" ? -der : 0, z: kay, w: der, h: uz };
      }
      if (kenar === "sag") {
        return { x: e.tip === "cikinti" ? en : en - der, z: kay, w: der, h: uz };
      }
      if (kenar === "on") {
        return { x: kay, z: e.tip === "cikinti" ? -der : 0, w: uz, h: der };
      }
      return { x: kay, z: e.tip === "cikinti" ? boy : boy - der, w: uz, h: der };
    }

    function plakaBoya(sx, sy, en, boy, olcek, pts) {
      var s = sahne();
      var x = sx(0);
      var y = sy(boy);
      var w = en * olcek;
      var hgt = boy * olcek;
      s.beginPath();
      s.moveTo(sx(pts[0][0]), sy(pts[0][1]));
      var i;
      for (i = 1; i < pts.length; i++) s.lineTo(sx(pts[i][0]), sy(pts[i][1]));
      s.closePath();
      var yuz = s.createLinearGradient(x, y, x + w * 0.2, y + hgt);
      yuz.addColorStop(0, "#e6d7bf");
      yuz.addColorStop(0.5, "#d5c4a8");
      yuz.addColorStop(1, "#c9b694");
      s.fillStyle = yuz;
      s.fill();
      s.strokeStyle = "#8d7c64";
      s.lineWidth = 1.6;
      s.stroke();
    }

    function sagTekYol(en, boy, e) {
      var k = ekKutuMm(en, boy, e);
      var x0 = k.x, z0 = k.z, x1 = k.x + k.w, z1 = k.z + k.h;
      if (e.tip === "cikinti") {
        return [
          [0, 0], [en, 0], [en, z0], [x1, z0], [x1, z1], [en, z1], [en, boy], [0, boy]
        ];
      }
      return [
        [0, 0], [en, 0], [en, z0], [x0, z0], [x0, z1], [en, z1], [en, boy], [0, boy]
      ];
    }

    function cizOdaPlaka2d(sx, sy, en, boy, olcek) {
      var s = sahne();
      var x = sx(0);
      var y = sy(boy);
      var w = en * olcek;
      var h = boy * olcek;
      var kal = Math.max(5, Math.min(12, olcek * 70));
      var pts = null;
      if (B.gonyePts) pts = B.gonyePts;
      else if (B.odaSaplon === "l") pts = lYol(en, boy);
      else {
        var ekler = ekOnizleme();
        if (ekler.length === 1 && (ekler[0].kenar || "sag") === "sag") {
          pts = sagTekYol(en, boy, ekler[0]);
        }
      }
      s.fillStyle = "rgba(32, 26, 20, 0.2)";
      if (pts) {
        s.beginPath();
        s.moveTo(sx(pts[0][0]) + 5, sy(pts[0][1]) + 5);
        var p;
        for (p = 1; p < pts.length; p++) s.lineTo(sx(pts[p][0]) + 5, sy(pts[p][1]) + 5);
        s.closePath();
        s.fill();
        plakaBoya(sx, sy, en, boy, olcek, pts);
      } else {
        s.fillRect(x + 5, y + 5, w, h);
        s.fillStyle = "#a39278";
        s.fillRect(x, y + h - 1, w + 1, kal);
        s.fillRect(x + w - 1, y, kal, h);
        plakaBoya(sx, sy, en, boy, olcek, [[0, 0], [en, 0], [en, boy], [0, boy]]);
      }
      s.beginPath();
      s.strokeStyle = "rgba(92, 74, 52, 0.11)";
      s.lineWidth = 1;
      var z;
      for (z = 0; z <= boy; z += 120) {
        s.moveTo(sx(0), sy(z));
        s.lineTo(sx(en), sy(z));
      }
      s.stroke();
      var extra = ekOnizleme();
      if (B.onizlemeEk) extra = extra.concat([B.onizlemeEk]);
      var ei, kutu;
      for (ei = 0; ei < extra.length; ei++) {
        if (!extra[ei] || !extra[ei].kenar) continue;
        kutu = ekKutuMm(en, boy, extra[ei]);
        s.fillStyle = extra[ei].tip === "oyuk" ? "rgba(15,23,42,0.32)" : "#d5c4a8";
        if (B.onizlemeEk && extra[ei] === B.onizlemeEk) s.globalAlpha = 0.75;
        s.fillRect(sx(kutu.x), sy(kutu.z + kutu.h), kutu.w * olcek, kutu.h * olcek);
        s.globalAlpha = 1;
        if (extra[ei].tip === "cikinti") {
          s.strokeStyle = "#c2410c";
          s.lineWidth = 2;
          s.strokeRect(sx(kutu.x), sy(kutu.z + kutu.h), kutu.w * olcek, kutu.h * olcek);
        }
      }
      kenarIsaretCiz(sx, sy, en, boy);
    }

    function pusulaKenarAktif() {
      var durum = B.durum;
      if (durum.zemin && B.motorSayfa === "duvar") {
        var no = parseInt(durum.aktif_duvar, 10);
        if (no === 1) return "on";
        if (no === 2) return "sag";
        if (no === 3) return "arka";
        if (no === 4) return "sol";
      }
      if (B.soruAdim === "en") return "on";
      if (B.soruAdim === "boy") return "sol";
      if (B.soruAdim === "kapi_surukle") {
        if (B.onizleme && typeof B.onizleme.kenar === "number") return ["on", "sag", "arka", "sol"][B.onizleme.kenar] || null;
        return B.kapiKenar || null;
      }
      if (B.soruAdim === "yukselti_surukle") {
        if (B.onizleme && typeof B.onizleme.kenar === "number") return ["on", "sag", "arka", "sol"][B.onizleme.kenar] || null;
      }
      if (B.soruAdim === "gonye_duvar") return B.gonyeKenarlar[B.gonyeIx] || null;
      if (B.soruAdim === "ek_yerlestir") {
        if (B.onizlemeEk && B.onizlemeEk.kenar) return B.onizlemeEk.kenar;
      }
      return null;
    }

    function kenarIsaretCiz(sx, sy, en, boy) {
      var s = sahne();
      if (B.soruAdim === "gonye_c1" || B.soruAdim === "gonye_c2") {
        var cap = B.gonyeCaprazUcu(B.soruAdim === "gonye_c1" ? 1 : 2, en, boy);
        s.beginPath();
        s.strokeStyle = "rgba(251, 146, 60, 0.92)";
        s.lineWidth = 4;
        s.lineCap = "round";
        s.moveTo(sx(cap[0][0]), sy(cap[0][1]));
        s.lineTo(sx(cap[1][0]), sy(cap[1][1]));
        s.stroke();
        s.fillStyle = "rgba(234, 88, 12, 0.95)";
        s.beginPath();
        s.arc(sx(cap[0][0]), sy(cap[0][1]), 7, 0, Math.PI * 2);
        s.arc(sx(cap[1][0]), sy(cap[1][1]), 7, 0, Math.PI * 2);
        s.fill();
        return;
      }
      var kenar = pusulaKenarAktif();
      var uc = B.gonyeKenarUcu(kenar, en, boy);
      if (!uc) return;
      s.beginPath();
      s.strokeStyle = "rgba(251, 146, 60, 0.92)";
      s.lineWidth = 4;
      s.lineCap = "round";
      s.moveTo(sx(uc[0][0]), sy(uc[0][1]));
      s.lineTo(sx(uc[1][0]), sy(uc[1][1]));
      s.stroke();
    }

    function cizPusulaKenar(sx, sy, en, boy) {
      var s = sahne();
      var aktif = pusulaKenarAktif();
      var gap = 28;
      function ucgen(x, y, ox, oy, sec) {
        s.beginPath();
        s.moveTo(x + ox * 18, y + oy * 18);
        s.lineTo(x - oy * 11 - ox * 5, y + ox * 11 - oy * 5);
        s.lineTo(x + oy * 11 - ox * 5, y - ox * 11 - oy * 5);
        s.closePath();
        s.fillStyle = sec ? "#fb923c" : "#e2e8f0";
        s.fill();
        s.strokeStyle = sec ? "#7c2d12" : "#0f172a";
        s.lineWidth = 2.2;
        s.stroke();
      }
      function yazi(x, y, metin, hiza, taban, sec) {
        s.font = "800 16px Segoe UI";
        s.textAlign = hiza;
        s.textBaseline = taban;
        s.lineJoin = "round";
        s.lineWidth = 5;
        s.strokeStyle = sec ? "#7c2d12" : "#0f172a";
        s.strokeText(metin, x, y);
        s.fillStyle = sec ? "#fdba74" : "#f8fafc";
        s.fillText(metin, x, y);
      }
      var kX = sx(en / 2);
      var kY = sy(boy) - gap;
      var dX = sx(en) + gap;
      var dY = sy(boy / 2);
      var gX = sx(en / 2);
      var gY = sy(0) + gap;
      var bX = sx(0) - gap;
      var bY = sy(boy / 2);
      ucgen(kX, kY + 12, 0, -1, aktif === "arka");
      yazi(kX, kY - 8, B.duvarDYazi ? B.duvarDYazi("arka") : "Kuzey", "center", "bottom", aktif === "arka");
      ucgen(dX - 12, dY, 1, 0, aktif === "sag");
      yazi(dX + 10, dY, B.duvarDYazi ? B.duvarDYazi("sag") : "Doğu", "left", "middle", aktif === "sag");
      ucgen(gX, gY - 12, 0, 1, aktif === "on");
      yazi(gX, gY + 8, B.duvarDYazi ? B.duvarDYazi("on") : "Güney", "center", "top", aktif === "on");
      ucgen(bX + 12, bY, -1, 0, aktif === "sol");
      yazi(bX - 10, bY, B.duvarDYazi ? B.duvarDYazi("sol") : "Batı", "right", "middle", aktif === "sol");
    }

    function cizOdaCetvel3d(cam, en, boy) {
      var s = sahne();
      var O = B.O;
      var pay = Math.max(220, Math.max(en, boy) * 0.08);
      var a = proje(0, 0, -pay, cam);
      var b = proje(en, 0, -pay, cam);
      var c = proje(-pay, 0, 0, cam);
      var d = proje(-pay, 0, boy, cam);
      s.beginPath();
      s.strokeStyle = "#fde68a";
      s.lineWidth = 2.4;
      s.moveTo(a.x, a.y);
      s.lineTo(b.x, b.y);
      s.moveTo(c.x, c.y);
      s.lineTo(d.x, d.y);
      s.stroke();
      olcuYazi(s, (a.x + b.x) / 2, (a.y + b.y) / 2, O.yazi(en), "center", "bottom");
      olcuYazi(s, (c.x + d.x) / 2, (c.y + d.y) / 2, O.yazi(boy), "center", "middle");
    }

    function cizPusula3d(cam, en, boy) {
      var s = sahne();
      var aktif = pusulaKenarAktif();
      var pay = Math.max(280, Math.max(en, boy) * 0.14);
      var liste = [
        { ad: B.duvarDYazi ? B.duvarDYazi("arka") : "Kuzey", kenar: "arka", x: en / 2, z: boy + pay },
        { ad: B.duvarDYazi ? B.duvarDYazi("on") : "Güney", kenar: "on", x: en / 2, z: -pay },
        { ad: B.duvarDYazi ? B.duvarDYazi("sag") : "Doğu", kenar: "sag", x: en + pay, z: boy / 2 },
        { ad: B.duvarDYazi ? B.duvarDYazi("sol") : "Batı", kenar: "sol", x: -pay, z: boy / 2 }
      ];
      var i, p, sec;
      s.font = "800 18px Segoe UI";
      s.textAlign = "center";
      s.textBaseline = "middle";
      s.lineJoin = "round";
      for (i = 0; i < liste.length; i++) {
        p = proje(liste[i].x, 8, liste[i].z, cam);
        sec = aktif === liste[i].kenar;
        s.lineWidth = 6;
        s.strokeStyle = sec ? "#7c2d12" : "#0f172a";
        s.strokeText(liste[i].ad, p.x, p.y);
        s.fillStyle = sec ? "#fdba74" : "#f8fafc";
        s.fillText(liste[i].ad, p.x, p.y);
      }
    }

    function cizKusBakisi() {
      var s = sahne();
      var cv = s.canvas;
      var w = cv.width;
      var h = cv.height;
      cizAtolyeAlan(w, h);
      var k = kusHarita();
      var en = k.en;
      var boy = k.boy;
      var pay = k.pay;
      var olcek = k.olcek;
      var sx = k.sx;
      var sy = k.sy;
      cizOdaPlaka2d(sx, sy, en, boy, olcek);
      cizPusulaKenar(sx, sy, en, boy);
      var gCet = B.cetvelGerec();
      if (gCet) cizParcaCetvel(sx, sy, gCet, en, boy, pay);
      else cizOdaCetvel(sx, sy, en, boy, pay);
      cizGerecler2d(sx, sy);
    }

    function yorungeCam(w, h, en, boy, yuk) {
      var yor = B.yorunge || { yaw: 0.7, pitch: 0.48, uzak: 0 };
      var tx = en / 2;
      var ty = Math.max(400, yuk * 0.38);
      var tz = boy / 2;
      var uzak = yor.uzak > 0 ? yor.uzak : Math.max(en, boy, yuk) * 1.55;
      var cp = Math.cos(yor.pitch);
      var sp = Math.sin(yor.pitch);
      var cy = Math.cos(yor.yaw);
      var sy = Math.sin(yor.yaw);
      var ex = tx + uzak * sy * cp;
      var ey = ty + uzak * sp;
      var ez = tz + uzak * cy * cp;
      var fx = tx - ex, fy = ty - ey, fz = tz - ez;
      var fl = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1;
      fx /= fl; fy /= fl; fz /= fl;
      var rx = fy * 0 - fz * 1, ry = fz * 0 - fx * 0, rz = fx * 1 - fy * 0;
      var rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
      rx /= rl; ry /= rl; rz /= rl;
      var ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
      return {
        ex: ex, ey: ey, ez: ez, tx: tx, ty: ty, tz: tz,
        f: 640, ox: w * 0.5, oy: h * 0.5,
        rxx: rx, rxy: ry, rxz: rz,
        ryx: ux, ryy: uy, ryz: uz,
        rzx: fx, rzy: fy, rzz: fz
      };
    }

    function proje(x, y, z, cam) {
      if (cam.ex != null) {
        var vx = x - cam.ex, vy = y - cam.ey, vz = z - cam.ez;
        var rx = vx * cam.rxx + vy * cam.rxy + vz * cam.rxz;
        var ry = vx * cam.ryx + vy * cam.ryy + vz * cam.ryz;
        var rz = vx * cam.rzx + vy * cam.rzy + vz * cam.rzz;
        if (rz < 40) rz = 40;
        return { x: cam.ox + cam.f * rx / rz, y: cam.oy - cam.f * ry / rz, rz: rz };
      }
      var dz = z - cam.z;
      if (dz < 40) dz = 40;
      return {
        x: cam.ox + cam.f * (x - cam.x) / dz,
        y: cam.oy - cam.f * (y - cam.y) / dz
      };
    }

    function cizCizgi(a, b, cam) {
      var s = sahne();
      var p = proje(a[0], a[1], a[2], cam);
      var q = proje(b[0], b[1], b[2], cam);
      s.moveTo(p.x, p.y);
      s.lineTo(q.x, q.y);
    }

    function doldurYuz(pts, dolgu, cizgi, cam) {
      var s = sahne();
      var p = pts.map(function (a) { return proje(a[0], a[1], a[2], cam); });
      s.beginPath();
      s.moveTo(p[0].x, p[0].y);
      var i;
      for (i = 1; i < p.length; i++) s.lineTo(p[i].x, p[i].y);
      s.closePath();
      s.fillStyle = dolgu;
      s.globalAlpha = 1;
      s.fill();
      s.strokeStyle = cizgi;
      s.lineWidth = 1.4;
      s.stroke();
    }

    var sonCephe = null;
    var KENAR_AD = { 1: "on", 2: "sag", 3: "arka", 4: "sol" };
    var CEPHE_AD = {
      kapi: "Kapı", pencere: "Pencere", priz: "Priz", su: "Su", gaz: "Gaz",
      radiator: "Radyatör", hava: "Hava", pimas: "Pimaş", sayac: "Sayaç",
      nis: "Niş", kiris: "Kiriş", kolon: "Kolon"
    };

    function cepheDuvar() {
      var mod = B.cepheMod;
      var durum = B.durum;
      var liste, i;
      if (!mod || !durum) return null;
      liste = durum.duvarlar || [];
      for (i = 0; i < liste.length; i++) if (liste[i].no === mod.no) return liste[i];
      return null;
    }

    function cepheHaritaKur() {
      var duvar = cepheDuvar();
      var cv = sahne().canvas;
      var w, h, padX, padUst, padAlt, iw, ih, olcek, rw, rh, x0, y0;
      if (!duvar || !(duvar.en > 0) || !(duvar.boy > 0)) {
        sonCephe = null;
        return null;
      }
      w = cv.width;
      h = cv.height;
      padX = 124;
      padUst = 64;
      padAlt = 108;
      iw = Math.max(40, w - padX * 2);
      ih = Math.max(40, h - padUst - padAlt);
      olcek = Math.min(iw / duvar.en, ih / duvar.boy);
      rw = duvar.en * olcek;
      rh = duvar.boy * olcek;
      x0 = (w - rw) / 2;
      y0 = padUst + Math.max(0, (ih - rh) / 2);
      sonCephe = { en: duvar.en, yuk: duvar.boy, olcek: olcek, x0: x0, y0: y0, rw: rw, rh: rh };
      return sonCephe;
    }

    function cepheSol(e, no) {
      if (!e) return 0;
      if (e.duvar_no === no) return e.sol || 0;
      return 0;
    }

    function cepheNokta(px, py) {
      var h = sonCephe || cepheHaritaKur();
      if (!h || !(h.olcek > 0)) return null;
      return { sol: (px - h.x0) / h.olcek, alt: (h.y0 + h.rh - py) / h.olcek };
    }

    function cepheVur(px, py) {
      var mod = B.cepheMod;
      var h = sonCephe || cepheHaritaKur();
      var e, sol, x, y, w, bh;
      if (!mod || !h || !B.durum) return false;
      e = (B.durum.elemanlar || [])[mod.ix];
      if (!e || !(e.en > 0) || !(e.boy > 0)) return false;
      sol = cepheSol(e, mod.no);
      x = h.x0 + sol * h.olcek;
      y = h.y0 + h.rh - ((e.alt || 0) + e.boy) * h.olcek;
      w = e.en * h.olcek;
      bh = e.boy * h.olcek;
      return px >= x - 14 && px <= x + w + 14 && py >= y - 14 && py <= y + bh + 14;
    }

    function cepheKutuCiz(s, h, e, no, sec) {
      if (e.tip === "kapi" && !e.kapi) return;
      var sol = cepheSol(e, no);
      var x = h.x0 + sol * h.olcek;
      var y = h.y0 + h.rh - ((e.alt || 0) + e.boy) * h.olcek;
      var w = Math.max(2, e.en * h.olcek);
      var bh = Math.max(2, e.boy * h.olcek);
      var ad = e.tip === "kapi" && !e.kapi ? "Boşluk" : (CEPHE_AD[e.tip] || e.tip);
      if (e.tip === "kapi" && !e.kapi) s.fillStyle = "#3a4046";
      else if (e.tip === "kapi" && e.kapi) s.fillStyle = e.kapi.camli ? "#b8d4e8" : "#c4a484";
      else s.fillStyle = sec ? "#fdba74" : (e.sinif === "void" ? "#d4cfc6" : (e.sinif === "protrusion" ? "#ea580c" : "#64748b"));
      s.fillRect(x, y, w, bh);
      s.lineWidth = sec ? 3 : 1.4;
      s.strokeStyle = sec ? "#7c2d12" : "#334155";
      s.strokeRect(x, y, w, bh);
      if (w > 36 && bh > 18) {
        s.font = "700 12px Segoe UI, sans-serif";
        s.textAlign = "center";
        s.textBaseline = "middle";
        s.fillStyle = sec ? "#7c2d12" : "#1a1e22";
        s.fillText(ad, x + w / 2, y + bh / 2);
      }
    }

    function cizCepheCetvel(s, h, e, no) {
      var O = B.O;
      var adim = 1000;
      var sol = 0;
      var en = 0;
      var alt = 0;
      var boy = 0;
      var dis = 34;
      var x, y, m;
      if (!O || !O.yazi || !O.goster) return;
      if (e) {
        sol = cepheSol(e, no);
        en = e.en || 0;
        alt = e.alt || 0;
        boy = e.boy || 0;
      }
      x = function (mm) { return h.x0 + mm * h.olcek; };
      y = function (mm) { return h.y0 + h.rh - mm * h.olcek; };
      s.strokeStyle = "#fde68a";
      s.lineWidth = 2.2;
      s.beginPath();
      s.moveTo(x(0), y(0) + dis);
      s.lineTo(x(h.en), y(0) + dis);
      s.moveTo(x(0) - dis, y(0));
      s.lineTo(x(0) - dis, y(h.yuk));
      s.stroke();
      s.lineWidth = 1.3;
      var merkezX = [];
      var merkezY = [];
      if (e && en > 0) {
        if (sol > 20) merkezX.push(sol / 2);
        merkezX.push(sol + en / 2);
        if (h.en - sol - en > 20) merkezX.push((sol + en + h.en) / 2);
      }
      if (e && boy > 0) {
        if (alt > 20) merkezY.push(alt / 2);
        merkezY.push(alt + boy / 2);
        if (h.yuk - alt - boy > 20) merkezY.push((alt + boy + h.yuk) / 2);
      }
      function yakinX(mm) {
        var i, px = x(mm);
        for (i = 0; i < merkezX.length; i++) if (Math.abs(px - x(merkezX[i])) < 42) return true;
        return false;
      }
      function yakinY(mm) {
        var i, py = y(mm);
        for (i = 0; i < merkezY.length; i++) if (Math.abs(py - y(merkezY[i])) < 18) return true;
        return false;
      }
      for (m = 0; m <= h.en + 1; m += adim) {
        if (m > h.en + 1) break;
        s.beginPath();
        s.moveTo(x(m), y(0) + dis - 10);
        s.lineTo(x(m), y(0) + dis);
        s.stroke();
        if (m <= 0 || h.en - m < 40 || yakinX(m)) continue;
        olcuYazi(s, x(m), y(0) + dis + 4, O.goster(m), "center", "top");
      }
      for (m = adim; m < h.yuk - 40; m += adim) {
        s.beginPath();
        s.moveTo(x(0) - dis, y(m));
        s.lineTo(x(0) - dis + 10, y(m));
        s.stroke();
        if (yakinY(m)) continue;
        olcuYazi(s, x(0) - dis - 6, y(m), O.goster(m), "right", "middle");
      }
      if (!e || !(en > 0) || !(boy > 0)) return;
      s.strokeStyle = "#fde68a";
      s.lineWidth = 2.2;
      s.beginPath();
      s.moveTo(x(sol), y(0));
      s.lineTo(x(sol), y(0) + dis);
      s.moveTo(x(sol + en), y(0));
      s.lineTo(x(sol + en), y(0) + dis);
      s.moveTo(x(0) - dis, y(alt));
      s.lineTo(x(0), y(alt));
      s.moveTo(x(0) - dis, y(alt + boy));
      s.lineTo(x(0), y(alt + boy));
      s.stroke();
      s.setLineDash([5, 4]);
      s.lineWidth = 1.4;
      s.beginPath();
      s.moveTo(x(sol), y(alt));
      s.lineTo(x(sol), y(0) + dis);
      s.moveTo(x(sol + en), y(alt));
      s.lineTo(x(sol + en), y(0) + dis);
      s.moveTo(x(sol), y(alt));
      s.lineTo(x(0) - dis, y(alt));
      s.moveTo(x(sol), y(alt + boy));
      s.lineTo(x(0) - dis, y(alt + boy));
      s.stroke();
      s.setLineDash([]);
      if (sol > 20 && x(sol) - x(0) > 44) olcuYazi(s, x(sol / 2), y(0) + dis - 4, O.yazi(sol), "center", "bottom");
      if (x(sol + en) - x(sol) > 44) olcuYazi(s, x(sol + en / 2), y(0) + dis - 4, O.yazi(en), "center", "bottom");
      else olcuYazi(s, x(sol + en / 2), y(alt + boy) - 8, O.yazi(en), "center", "bottom");
      if (h.en - sol - en > 20 && x(h.en) - x(sol + en) > 44) {
        olcuYazi(s, x((sol + en + h.en) / 2), y(0) + dis - 4, O.yazi(h.en - sol - en), "center", "bottom");
      }
      if (alt > 20 && y(0) - y(alt) > 26) olcuYazi(s, x(0) - dis - 8, y(alt / 2), O.yazi(alt), "right", "middle");
      if (y(alt) - y(alt + boy) > 26) olcuYazi(s, x(0) - dis - 8, y(alt + boy / 2), O.yazi(boy), "right", "middle");
      else olcuYazi(s, x(sol + en / 2), y(alt) + 6, O.yazi(boy), "center", "top");
      if (h.yuk - alt - boy > 20 && y(alt + boy) - y(h.yuk) > 26) {
        olcuYazi(s, x(0) - dis - 8, y((alt + boy + h.yuk) / 2), O.yazi(h.yuk - alt - boy), "right", "middle");
      }
    }

    function cizCephe() {
      var s = sahne();
      var cv = s.canvas;
      var h = cepheHaritaKur();
      var mod = B.cepheMod;
      var durum = B.durum;
      var kenar, ad, liste, i, e;
      s.fillStyle = "#6d747b";
      s.fillRect(0, 0, cv.width, cv.height);
      if (!h || !mod) return;
      kenar = KENAR_AD[mod.no] || "on";
      ad = B.duvarDYazi ? B.duvarDYazi(kenar) : kenar;
      s.fillStyle = "#e8e4dc";
      s.fillRect(h.x0, h.y0, h.rw, h.rh);
      s.strokeStyle = "#c4b8a8";
      s.lineWidth = 2;
      s.strokeRect(h.x0, h.y0, h.rw, h.rh);
      s.font = "800 22px Segoe UI, sans-serif";
      s.textAlign = "center";
      s.textBaseline = "bottom";
      s.fillStyle = "#fb923c";
      s.fillText(ad, h.x0 + h.rw / 2, h.y0 - 8);
      liste = (durum && durum.elemanlar) || [];
      for (i = 0; i < liste.length; i++) {
        e = liste[i];
        if (!e || i === mod.ix) continue;
        if (e.duvar_no !== mod.no && !(e.duvarlar && e.duvarlar.indexOf(mod.no) >= 0)) continue;
        cepheKutuCiz(s, h, e, mod.no, false);
      }
      e = liste[mod.ix];
      if (e) cepheKutuCiz(s, h, e, mod.no, true);
      cizCepheCetvel(s, h, e, mod.no);
    }

    function govdeNokta(lx, ly, lz, yer) {
      var sy = yer.ayak + lz;
      var geri = yer.D - ly;
      if (yer.kenar === "sag") return [yer.oEn - yer.kal - geri, sy, lx];
      if (yer.kenar === "arka") return [yer.oEn - lx, sy, yer.oBoy - yer.kal - geri];
      if (yer.kenar === "sol") return [yer.kal + geri, sy, yer.oBoy - lx];
      return [lx, sy, yer.kal + geri];
    }

    function govdeSinir(p, yer) {
      var xs = [p.x, p.x + p.en];
      var ys = [p.y, p.y + p.boy];
      var zs = [p.z, p.z + p.kalinlik];
      var minx = 1e9, miny = 1e9, minz = 1e9, maxx = -1e9, maxy = -1e9, maxz = -1e9;
      var a, b, c, n;
      for (a = 0; a < 2; a++) {
        for (b = 0; b < 2; b++) {
          for (c = 0; c < 2; c++) {
            n = govdeNokta(xs[a], ys[b], zs[c], yer);
            if (n[0] < minx) minx = n[0];
            if (n[1] < miny) miny = n[1];
            if (n[2] < minz) minz = n[2];
            if (n[0] > maxx) maxx = n[0];
            if (n[1] > maxy) maxy = n[1];
            if (n[2] > maxz) maxz = n[2];
          }
        }
      }
      return [minx, miny, minz, maxx, maxy, maxz];
    }

    function cizGovde3d(cam, oEn, oBoy) {
      var gov = B.mobilyaGovde ? B.mobilyaGovde() : null;
      var sira = { arkalik: 0, yan: 1, alt: 1, ust: 1, dolgu: 1, raf: 2, kapak: 3, "menteşe": 4 };
      var renk = {
        raf: ["#e6d7bf", "#a89880"],
        arkalik: ["#b5a48c", "#6f6252"],
        dolgu: ["#c9b99a", "#7a6c58"],
        kapak: ["#c4a484", "#7c2d12"],
        "menteşe": ["#94a3b8", "#334155"]
      };
      var parcalar, yer, i, p, k, c;
      if (!gov || B.soruAdim !== "mobilya" || !gov.parcalar || !gov.parcalar.length) return;
      yer = {
        kenar: gov.kenar || "on",
        kal: duvarKalCiz(gov.kenar || "on"),
        oEn: oEn,
        oBoy: oBoy,
        D: gov.derinlik,
        ayak: gov.ayak > 0 ? gov.ayak : 0
      };
      parcalar = gov.parcalar.slice().sort(function (a, b) {
        return (sira[a.ad] || 1) - (sira[b.ad] || 1);
      });
      for (i = 0; i < parcalar.length; i++) {
        p = parcalar[i];
        k = govdeSinir(p, yer);
        c = renk[p.ad] || ["#d5c4a8", "#8d7c64"];
        doldurKutu(k[0], k[1], k[2], k[3], k[4], k[5], c[0], c[1], cam);
      }
    }

    function cizSahne() {
      if (B.cepheMod && B.motorSayfa === "duvar") {
        cizCephe();
        return;
      }
      var s = sahne();
      var durum = B.durum;
      var O = B.O;
      if (!durum.zemin || B.motorSayfa !== "duvar") {
        cizKusBakisi();
        return;
      }
      var cv = s.canvas;
      var w = cv.width;
      var h = cv.height;
      s.fillStyle = "#6d747b";
      s.fillRect(0, 0, w, h);
      var en = durum.oda ? durum.oda.en : 4000;
      var boy = durum.oda ? durum.oda.boy : 3000;
      var yuk = durum.oda && durum.oda.yuk > 0 ? durum.oda.yuk : 2600;
      var cam = yorungeCam(w, h, en, boy, yuk);
      cizIzgar3d(cam, en, boy);
      doldurYuz([[0, 0, 0], [en, 0, 0], [en, 0, boy], [0, 0, boy]], "#d5c4a8", "#8d7c64", cam);
      cizOdaCetvel3d(cam, en, boy);
      cizPusula3d(cam, en, boy);
      var duvarlar = [
        { kenar: "on", d: Math.abs(cam.ez - 0) },
        { kenar: "arka", d: Math.abs(cam.ez - boy) },
        { kenar: "sol", d: Math.abs(cam.ex - 0) },
        { kenar: "sag", d: Math.abs(cam.ex - en) }
      ];
      duvarlar.sort(function (a, b) { return b.d - a.d; });
      var di, kenar, kal;
      for (di = 0; di < duvarlar.length; di++) {
        kenar = duvarlar[di].kenar;
        if (B.duvarOruluKenar && !B.duvarOruluKenar(kenar)) continue;
        kal = duvarKalCiz(kenar);
        if (kenar === "on") doldurDuvarKutu(kenar, 0, 0, 0, en, yuk, kal, cam);
        else if (kenar === "arka") doldurDuvarKutu(kenar, 0, 0, boy - kal, en, yuk, boy, cam);
        else if (kenar === "sol") doldurDuvarKutu(kenar, 0, 0, 0, kal, yuk, boy, cam);
        else doldurDuvarKutu(kenar, en - kal, 0, 0, en, yuk, boy, cam);
      }
      cizDuvarKod3d(cam, en, boy, yuk);
      cizDuvarEleman(cam, en, boy);
      B.setSonCam(cam);
      cizGerecler3d(cam);
      cizGovde3d(cam, en, boy);
    }

    function sahneBoyut() {
      var cv = sahne().canvas;
      var r = cv.getBoundingClientRect();
      var w = Math.max(200, Math.round(r.width));
      var h = Math.max(160, Math.round(r.height));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
    }

    return {
      kusHarita: kusHarita,
      sahneBoyut: sahneBoyut,
      cizSahne: cizSahne,
      elemanBul: elemanBul,
      cepheNokta: cepheNokta,
      cepheVur: cepheVur
    };
  };
})();
