/* Python testinin JS ikiz koşucusu. stdin: {op, ...} */
var fs = require("fs");
var path = require("path");
var motor = require(path.join(__dirname, "..", "mobilya_motor.js"));
var istek = JSON.parse(fs.readFileSync(0, "utf8"));

function yaz(veri) {
  process.stdout.write(JSON.stringify(veri));
}

try {
  if (istek.op === "from_dict") {
    yaz({ ok: true, cfg: motor.from_dict(istek.veri) });
  } else if (istek.op === "degistir") {
    yaz({ ok: true, cfg: motor.degistir(motor.from_dict(istek.cfg), istek.ayar) });
  } else if (istek.op === "varsayilan") {
    yaz({ ok: true, cfg: motor.varsayilan() });
  } else {
    var fn = motor[istek.fn];
    if (!fn) throw new Error("Bilinmeyen fonksiyon: " + istek.fn);
    var cfg = motor.from_dict(istek.cfg);
    yaz({ ok: true, sonuc: fn.apply(null, [cfg].concat(istek.args)) });
  }
} catch (e) {
  yaz({ ok: false, hata: String(e.message || e) });
}
