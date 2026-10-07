# Mobilyacılar Ağı — Mimari harita

> Hudut `.cursorrules` dosyasındadır. Bu belge bugünkü kodu anlatır. Çelişkide hudut ve kod geçerlidir; düzeltilecek olan bu belgedir.
> Doğrulama: 2026-10-06. Satır numarası yoktur; kaynak dosya adı vardır.
> Plan, faz ve kodda olmayan sözleşme buraya yazılmaz. Önceki yol haritası `99_Muze/ARCHITECTURE_yol_haritasi.md` içindedir.

---

## 1. Hudut ve okuma kuralı

- Bu dosya kural koymaz. Kapı, akış, kilit ve depo adlarını koddan okur.
- Klasör, anahtar veya alan adı değişen adımda bu dosya da aynı adımda güncellenir.
- Kaynak: `.cursorrules`

---

## 2. Kapılar

Sunucu `02_Canta/ocr_okuyucu/sunucu.py` içindedir ve aşağıdaki kapıları açar. Yayın kopyasını `pack_yayin.py` üretir; çıktı `00_Yayin/` altındadır.

| Yayın yolu | Kaynak | Kaynak dosya |
|---|---|---|
| `/` | `01_Ana_Site/` | `sunucu.py`, `pack_yayin.py` |
| `/okuyucu/` | `02_Canta/ocr_okuyucu/web/static/` | `sunucu.py`, `pack_yayin.py` |
| `/ebatlama/` | `02_Canta/ebatlama/vitrin/` | `sunucu.py`, `pack_yayin.py` |
| `/duvar/` | `02_Canta/elle_olcu/duvar/vitrin/` | `sunucu.py`, `pack_yayin.py` |
| `/zemin/zemin_motor.js` | `02_Canta/elle_olcu/zemin/zemin_motor.js` | `sunucu.py` |
| `/mobilya/mobilya_motor.js` | `02_Canta/elle_olcu/mobilya/mobilya_motor.js` | `sunucu.py` |
| `/mobilya/varsayilan_config.json` | `02_Canta/elle_olcu/mobilya/varsayilan_config.json` | `sunucu.py` |
| `/tel/` | `02_Canta/tel_cizim/vitrin/` | `sunucu.py`, `pack_yayin.py` |

`/elle/` adresi `/duvar/` adresine gider. Kaynak: `sunucu.py`, `pack_yayin.py`.

---

## 3. Bugünkü akışlar

Okuyucu kendi kesim listesini üretir. Ebatlama listeyi `fire_veri` anahtarından okur. İkisi arasında paket taşıyan bir kapı yoktur.

Kaynak: `02_Canta/ocr_okuyucu/dogrulama.py`, `02_Canta/ebatlama/vitrin/vitrin.js`.

Reçete sırası zemin, duvar, mobilyadır. Duvar kilitlenince solda Zemin, Duvar ve Engel’in yanında Mobilya düğmesi çıkar. Tıklanınca satırda yalnız Baza, Duvar, Boy çıkar. Yol: `02_Canta/elle_olcu/mobilya/MOBILYA_MOTORU_REHBER.md`. `odaModulEkle` kapalıdır.

Kaynak: `02_Canta/elle_olcu/duvar/vitrin/adim_raf.js`, `02_Canta/elle_olcu/duvar/vitrin/duvar_motor.js`, `02_Canta/elle_olcu/duvar/motor.py`, `02_Canta/elle_olcu/duvar/vitrin/vitrin.js`.

Mobilya hesap çekirdeği `02_Canta/elle_olcu/mobilya/` içindedir. Ayarlar `MotorConfig` ile `varsayilan_config.json` dosyasındandır. Hesaplar: `govde_hesapla`, `govde_birlestir`, `tip_olcu`, `raf_yerlestir`, `kapak_yerlestir`, `duvar_dizi`, `sira_kur`, `kapak_hesapla`, `raf_hesapla`, `cekmece_hesapla`, `arkalik_hesapla`, `ayak_supurgelik_hesapla`, `hirdavat_hesapla`. `govde_birlestir` yan, alt, üst ve kanallı arkalığı X, Y, Z kutusunda kilitler. Modül derinliği ayardan gelir. Sıra genişliği `katalog_arsiv.json` şablonundaki standart ölçüdür; köşe genişliği düz sıraya girmez. Duvar boyu kasa değildir. Raf, kapak ve donanım `govde_birlestir` içinde yoktur. Tur `sira_kur` ile kasaları seçili duvar boyunca dizer; kalan pay sağda dolgudur; her kasanın önünde tek kapak vardır. `odaModulEkle` kapalıdır. Mobilya satırı açıkken yalnız Baza, Duvar, Boy. Seçili duvarın soluna tipi göre yükseklik ve yerden payla çizilir. `kapak_hesapla` bir kanadın kg ağırlığını da döner; menteşe adedi bu kiloyu henüz kullanmaz. Her biri `{"hazir","hatalar","parcalar",...}` döner. Python `motor.py` ve JS ikizi `mobilya_motor.js` aynı sözleşmeyi kullanır. Başka motoru içe almaz. Yerel sunucu `/mobilya/mobilya_motor.js` ve `/mobilya/varsayilan_config.json` yollarını açar. `pack_yayin.py` bu iki dosyayı `00_Yayin/mobilya/` altına kopyalar.

Kaynak: `02_Canta/elle_olcu/mobilya/MOBILYA_MOTORU_REHBER.md`, `02_Canta/elle_olcu/mobilya/motor.py`, `02_Canta/elle_olcu/mobilya/mobilya_motor.js`, `02_Canta/elle_olcu/mobilya/varsayilan_config.json`, `02_Canta/elle_olcu/mobilya/tests/test_mobilya_motor.py`, `02_Canta/elle_olcu/mobilya/tests/test_mobilya_js_ikiz.py`, `sunucu.py`, `pack_yayin.py`.

---

## 4. Kilit ve mühür

| Alan | Anlam | Kaynak dosya |
|---|---|---|
| `kilit` | Zemin mührü | `elle_olcu/zemin/zemin_motor.js`, `elle_olcu/zemin/motor.py` |
| `zemin_kilit` | Duvar tarafında zemin mührünün bayrağı | `elle_olcu/duvar/vitrin/duvar_motor.js`, `vitrin.js` |
| `hazirlik_onay` | Duvar hazırlık onayı | `elle_olcu/duvar/vitrin/duvar_motor.js`, `vitrin.js` |
| `onceki_id` | Yeni mühür bir öncekine bağlanır; eski kayıt silinmez | `elle_olcu/duvar/vitrin/depo.js` |

---

## 5. Depolar

**IndexedDB.** Veritabanı `magi_recete`. Depolar: `ustalar`, `musteriler`, `isler`, `muhurler`, `taslaklar`, `olaylar`.

Kaynak: `02_Canta/elle_olcu/duvar/vitrin/depo.js`.

**localStorage.**

| Anahtar | Sahibi | Kaynak dosya |
|---|---|---|
| `fire_veri`, `plaka_veri`, `fire_levha`, `plaka_levha` | Ebatlama | `ebatlama/vitrin/vitrin.js` |
| `magi_is_kayitlari` | Reçete iş kaydı; IndexedDB `isler` ile birlikte yazılır | `depo.js` |
| `magi_zemin_durum`, `magi_zemin_anket`, `magi_is_turu`, `magi_oda_saplon` | Zemin, anket, iş türü, oda | `elle_olcu/duvar/vitrin/vitrin.js` |
| `magi_atolye_kasa` | Müşteri kasası | `vitrin.js` ve gereç sayfaları |
| `magi_goc_v1` | Taşıma işareti | `depo.js` |

**Okuyucu dosyaları.** `02_Canta/ocr_okuyucu/veri/`. Kaynak: `02_Canta/ocr_okuyucu/ogrenme_kurallari.py` (`veri_kok`).

---

## 6. Doğrulanmış parça alanları

`kesim_listesi_sanity_kontrol` şu alanları zorunlu sayar: `uzunluk_mm`, `genislik_mm`, `adet`, `kalinlik_mm`. Eksik veya sınır dışı parça şüpheli işaretlenir; listeden silinmez.

Kaynak: `02_Canta/ocr_okuyucu/dogrulama.py`.

Bant kodu dört hanelidir. Testlerde görülen örnek `1-0-0-0` biçimidir.

Kaynak: `02_Canta/ocr_okuyucu/kenar_bant.py`, `02_Canta/ocr_okuyucu/tests/test_kenar_bant.py`.

PVC varsayılanı kapak ve klapada 0,8 mm, gövdede 0,4 mm'dir. Metinden 1,0 mm ve 2,0 mm de kabul edilir.

Kaynak: `02_Canta/ocr_okuyucu/kenar_bant.py`.

`paket_id` ve `olcu_tipi` bu doğrulamada yoktur.

---

## 7. Bilinen sınırlar

- Müşteri kasasını sayfalar `magi_atolye_kasa` anahtarına kendi `kasaYaz` işleviyle yazar. `depo.js` içindeki IndexedDB `kasaYaz` bu sayfalardan çağrılmaz. Kaynak: `vitrin.js`, gereç sayfaları, `depo.js`.
- İş kaydı hem `magi_recete` / `isler` hem `magi_is_kayitlari` anahtarındadır. Kaynak: `depo.js`.
- Köprü kaynağında CORS yalnız iki Firebase adresine (`CORS_KOKENLER`) açıktır ve `allow_credentials=False` kullanır. Firebase Hosting yayını Cloud Run'daki köprüyü değiştirmez; canlı köprünün ayarı bu repodan doğrulanamaz. `pack_yayin.py` içindeki `duman` testi köprü kaynağında `127.0.0.1:8765` geçmesine izin vermez. Kaynak: `cloud_bridge.py`, `pack_yayin.py`.
- Köprü `/api/usta-hafiza` ve `/api/usta-geri` uçlarında kaydetmeden `ok: true` döner. Kaynak: `cloud_bridge.py`.
- `X-OCR-Token` yerel sunucuda `OCR_API_TOKEN` doluysa aranır. Köprüde bu kontrol yoktur. Kaynak: `sunucu.py`, `cloud_bridge.py`.
- Tel `parca_hesapla` fonksiyonu `{"hazir": False, "neden": "iskelet"}` döner. Kaynak: `02_Canta/tel_cizim/motor.py`.
- `pack_yayin.py` Okuyucu ve Ebatlama dosyalarını sabit listeyle kopyalar. Listede olmayan dosya yayına çıkmaz. Kaynak: `pack_yayin.py`.
- Duvar hesabı iki dosyada durur: `duvar_motor.js` ve `motor.py`. Kaynak: bu iki dosya.
- Mobilya çekirdeği duvar kilitinden sonra reçete sahnede kasaları duvar boyunca dizer; dolgu sağdadır. `odaModulEkle` "Mobilya aşaması kapalı." der. JS ikizi `1` ile `1.0` ayrımı yapamaz. Kaynak: `adim_raf.js`, `vitrin.js`, `vitrin_ciz.js`, `duvar_motor.js`, `elle_olcu/duvar/motor.py`, `elle_olcu/mobilya/motor.py`, `elle_olcu/mobilya/mobilya_motor.js`.

Açık kalan sorular kilit değildir: kesim paketinin biçimi kodda yoktur; bulut eşitleme kodda yoktur.
