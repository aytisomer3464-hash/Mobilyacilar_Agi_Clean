# MOBİLYACILAR AĞI — GELİŞTİRME YOL HARİTASI

> Referans: `00_PROJE_DURUMU.md`.
> Amaç: duran hesabı yeniden yazmak değil; eksikleri bağımlılık sırasıyla tamamlamak.
> Kod ile bu belge çelişirse önce kod bakılır.
> Bir aşama, bir önceki aşamanın testi geçmeden açılmaz.
> İşaretler: **tamam** kodda çalışır ve tura veya teste bağlıdır. **kısmi** fonksiyon veya sahne vardır, üretim eksiktir. **eksik** bu depoda fonksiyonu yoktur. **doküman/plan** yalnız belgede vardır.

## AŞAMA 0 — Gerçek durum ve dokümantasyon

**tamam:** `00_PROJE_DURUMU.md` kökte duruyor. Mobilya motoru, JS ikizi, config, katalog, test ve sahne turu kodda var.

**kısmi:** Eski cümleler hâlâ duruyor. `README.md` satır 9, 19, 26 ve 62. `.cursorrules` satır 7 ile satır 11 çelişir. `.cursor/rules/kok-hudut.mdc` satır 12 “yazılmaz” der. `02_Canta/elle_olcu/mobilya/MOBILYA_MOTORU_REHBER.md` satır 13, 53, 124 ve 149 birbiriyle ve kodla çelişir. `ARCHITECTURE.md` kapı tablosu `/mobilya/katalog_arsiv.json` yolunu yazmaz; `02_Canta/ocr_okuyucu/sunucu.py` satır 624 bu yolu açar.

**doküman/plan:** `99_Muze/ARCHITECTURE_yol_haritasi.md`. Güncel sözleşme değildir.

**Bağımlılık:** Yok. Sonraki her aşama bu düzeltmeden sonra okunur.

**İş:** Dokümanı koda çek. Motoru “yok” veya “sıfırdan yazılacak” diye yazma. Genişlik kuralını katalog (`katalog_arsiv.json` → `sablon`) olarak yaz. `modul_genislik` sıra genişliği değildir.

**Beklenen çıktı:** README, `.cursorrules`, `kok-hudut.mdc`, rehber ve `ARCHITECTURE.md` kapı tablosu `00_PROJE_DURUMU.md` ile aynı gerçeği söyler.

**Değişecek dosyalar:** `README.md`, `.cursorrules`, `.cursor/rules/kok-hudut.mdc`, `02_Canta/elle_olcu/mobilya/MOBILYA_MOTORU_REHBER.md`, `ARCHITECTURE.md`. `99_Muze/ARCHITECTURE_yol_haritasi.md` müze kalır; güncel kural yapılmaz.

**Test:** Kod çalıştırılmaz. Çelişen cümleler tek tek dosya satırıyla kapatılır.

**Geçiş:** “Motor yazılmaz / sıfırdan yazılacak” cümlesi bu beş dosyada kalmamış olur. Aşama 1 ancak ondan sonra açılır.

## AŞAMA 1 — Mevcut mobilya motorunun korunması ve sınırlarının belirlenmesi

**tamam, yeniden yazılmaz:**

- `02_Canta/elle_olcu/mobilya/motor.py` — `MotorConfig`, `tip_olcu`, `govde_hesapla`, `govde_birlestir`, `kapak_hesapla`, `kapak_yerlestir`, `raf_hesapla`, `raf_yerlestir`, `katalog_yukle`, `standart_enler`, `kose_enler`, `duvar_dizi`, `sira_kur`, `cekmece_hesapla`, `arkalik_hesapla`, `ayak_supurgelik_hesapla`, `hirdavat_hesapla`
- `02_Canta/elle_olcu/mobilya/mobilya_motor.js` — aynı adlar, `window.MobilyaMotor`
- `02_Canta/elle_olcu/mobilya/varsayilan_config.json` — 44 ayar
- `02_Canta/elle_olcu/mobilya/katalog_arsiv.json` — `sablon`; `acik_ek` sıraya girmez
- `02_Canta/elle_olcu/mobilya/tests/test_mobilya_motor.py`
- `02_Canta/elle_olcu/mobilya/tests/test_mobilya_js_ikiz.py`
- `02_Canta/elle_olcu/mobilya/tests/ikiz_kos.js`

**Sınır (kısmi, bu aşamada genişletilmez):** `sira_kur` iskelet + raf + tek kapak + sağ `dolgu` üretir. Çekmece, hırdavat, ayak parçası, bindirme arkalık, dikme ve köşe bu turda yoktur. `cekmece_derzi` ve `arkalik_derinlik` ayarda durur, formülde kullanılmaz. `modul_genislik` sıra genişliği değildir (`duvar_dizi` içinde `del cfg`).

**Bağımlılık:** Aşama 0.

**İş:** Mevcut testleri çalıştır. Formül ve imza değiştirme. İkiz sözleşmesi: Python sözlüğü ile JS sözlüğü aynı kalır.

**Beklenen çıktı:** Koruma listesi ve “bu aşamada dokunulmaz” fonksiyon listesi. Yeni hesap yok.

**Değişecek dosyalar:** Yok. Yalnız test çalıştırılır.

**Test:** `test_mobilya_motor.py` ve `test_mobilya_js_ikiz.py`. `test_motor_baska_motor_import_etmez` dahil.

**Geçiş:** Bu iki test dosyası geçer. Geçmeden Aşama 2 açılmaz.

## AŞAMA 2 — Mobilya motoru dosya/katman mimarisi

Dosya bölme yok. Refactor yok. Yalnız mevcut fonksiyonun katmanı yazılır.

| Katman | Mevcut fonksiyon | İşaret |
| --- | --- | --- |
| Domain / Parameters | `MotorConfig`, `varsayilan_config.json`, `katalog_arsiv.json` | tamam |
| Rules | `tip_olcu`, `standart_enler`, `kose_enler`, `duvar_dizi`, `_mentese_kapak_basi`, `RAY_TIPLERI`, `ARKALIK_TIPLERI`, `TIPLER` | tamam (kural var; hepsi tura bağlı değil) |
| Calculators | `govde_hesapla`, `kapak_hesapla`, `raf_hesapla`, `cekmece_hesapla`, `arkalik_hesapla`, `ayak_supurgelik_hesapla`, `hirdavat_hesapla` | kısmi: çekmece yüksekliği yok; ayak parça döndürmez; hırdavat `parcalar` boş |
| Manufacturing | `govde_birlestir`, `raf_yerlestir`, `kapak_yerlestir`, `sira_kur` | kısmi: tek kapak ve kanallı arkalık; dolgu tek kutu |
| Optimization | Mobilya motorunda fonksiyon yok | eksik. Ebatlama `cep_motor.js` ayrı kapıdır; mobilya hesabı değildir |
| BOM | `hirdavat_hesapla` birleşim başı adet döner | kısmi. Reçete dosyası yok |
| Outputs | Dönüş `{"hazir","hatalar","parcalar",...}` | kısmi. Kesim listesi yok. `cizGovde3d` çizimdir, üretim çıktısı değildir |

**Bağımlılık:** Aşama 1 testleri geçmiş olmalı. Bu tablo Aşama 5 ve sonrasının hangi fonksiyonu çağıracağını belirler. Yeni katman dosyası açılmaz.

**İş:** Tabloyu `00_PROJE_DURUMU.md` ile aynı tut. Fonksiyon taşıma.

**Beklenen çıktı:** Katman tablosu. Dosya ağacı aynı kalır.

**Değişecek dosyalar:** Yok.

**Test:** Aşama 1 testleri tekrar. Sözleşme değişmediği için sonuç aynı olmalı.

**Geçiş:** Tablo onaylanır ve Aşama 1 testleri hâlâ geçer. Geçmeden yayın işi açılmaz.

## AŞAMA 3 — Mevcut yayın sorunlarının düzeltilmesi

**kısmi:** `pack_yayin.py` `kopyala()` `mobilya_motor.js` ve `varsayilan_config.json` dosyalarını `00_Yayin/mobilya/` altına kopyalar. `katalog_arsiv.json` kopyalanmaz.

**eksik yayın ağacı:** Mevcut `00_Yayin` içinde `mobilya` dosyası yok. `firebase.json` `public` alanı `00_Yayin`. `vitrin.js` `fetch("/mobilya/katalog_arsiv.json")` ister. Yerel `sunucu.py` kataloğu kaynaktan verir; yayın kopyası vermez.

**Bağımlılık:** Aşama 2. Katalog içeriği değişmez; yalnız pakete girer.

**İş:** `katalog_arsiv.json` kopya listesine eklenir. `kopyala()` sonrası `00_Yayin/mobilya/` kaynakla aynı üç dosyayı içerir: motor js, config, katalog.

**Beklenen çıktı:** Yayın turu katalog dosyasını `00_Yayin` içinden okuyabilir.

**Değişecek dosyalar:** `pack_yayin.py`. Üretilen çıktı: `00_Yayin/mobilya/mobilya_motor.js`, `00_Yayin/mobilya/varsayilan_config.json`, `00_Yayin/mobilya/katalog_arsiv.json`.

**Test:** Pack sonrası üç dosyanın varlığı. Kaynak ile yayın katalog içeriği aynı. Aşama 1 hesap testleri tekrar (hesap dosyasına dokunulmaz).

**Geçiş:** Üç dosya `00_Yayin/mobilya/` altında durur. Geçmeden tur sayacı işi açılmaz.

## AŞAMA 4 — Mobilya turunun mevcut UI durumunun düzeltilmesi

**kısmi:** `02_Canta/elle_olcu/duvar/vitrin/vitrin.js` `mobilyaTurKur` `tip_olcu` ve `sira_kur` çağırır. Dönüşte `satir` her zaman `[]`. Kart `tur.satir.length` yazar, yani `"0"`. `sira_kur` içindeki `modul_adedi` sahneye yazılmaz.

**tamam, korunur:** `sira_kur` parça listesi `mobilyaGovde` olur. `vitrin_ciz.js` `cizGovde3d` bu kutuları çizer. Tip düğmeleri `baza`, `duvar`, `boy`.

**Bağımlılık:** Aşama 3. Yeni hesap yok. `modul_adedi` zaten `sira_kur` dönüşündedir.

**İş:** Kart `modul_adedi` okur. `satir: []` kasa sayısı sanılmaz. `govde_birlestir`, `raf_yerlestir`, `kapak_yerlestir` formülü değişmez.

**Beklenen çıktı:** Duvar dolunca kart, dizilen kasa adedini gösterir.

**Değişecek dosyalar:** `02_Canta/elle_olcu/duvar/vitrin/vitrin.js`. Yayın kopyası ayrıca pack ile yenilenir; kaynak hesap dosyası değişmez.

**Test:** Aşama 1 testleri. Ayrıca `sira_kur` sonucu `modul_adedi > 0` iken kartın bu sayıyı yazdığı kontrol. Mevcut parça kutuları aynı kalır.

**Geçiş:** Kart doğru adedi yazar ve mevcut motor testleri bozulmaz. Geçmeden çekmece açılmaz.

## AŞAMA 5 — Çekmece üretim katmanı

**kısmi:** `cekmece_hesapla` yan, ön/arka, taban ve çekmece önü ölçüsü döner. Ray tipi `tandem` (gizli dahil) veya `bilyali`. Ray uzunluğu ve açıklık yüksekliğini çağıran verir.

**eksik:** Çekmece yüksekliği kuralı. Ray seçim kuralı (dosyada yok). XYZ. `sira_kur` ve `vitrin.js` çağrısı. Menüde çekmece düğmesi.

**Bağımlılık:** Aşama 4. `cekmece_derzi` ayarda durur, formülde bağlı değildir; bağlamak ayrı karar ister, bu sıranın 1. adımı değildir.

Sıra, tek iş tek adım:

1. Çekmece yükseklik kuralı. **eksik.**
2. Ray seçimi. **eksik.** Tip eşlemesi **tamam** (`RAY_TIPLERI`).
3. Çekmece parçaları. **kısmi:** adlar var, yükseklik yok.
4. Ölçüler. **kısmi:** genişlik ve bazı boylar var.
5. Koordinatlar. **eksik.**
6. Motor entegrasyonu: `sira_kur` ancak 1–5 yazılıktan sonra çağırır. Şimdi çağırmaz.
7. Sahne: `cizGovde3d` ancak kutu üretildikten sonra. Şimdi çekmece parçası yok.
8. Test: Python ve JS ikizi.

**Beklenen çıktı:** Bir kasada, kuralı yazılmış çekmece kutuları. Mevcut `cekmece_hesapla` imzası bozulmadan genişler veya yeni fonksiyon eklenir; gövde formülü yeniden yazılmaz.

**Değişecek dosyalar:** `02_Canta/elle_olcu/mobilya/motor.py`, `mobilya_motor.js`, iki test dosyası. Sahne ancak 7. adımda: `vitrin.js`, `vitrin_ciz.js`.

**Test:** Mevcut `test_cekmece_tandem`, `test_cekmece_bilyali`, `test_cekmece_gizli_ray_tandem_sayilir` bozulmaz. Yeni yükseklik, koordinat ve `sira_kur` çağrısı için yeni test. İkiz testi aynı sözlüğü ister.

**Geçiş:** 1–8 biter ve eski çekmece testleri geçer. Geçmeden kapak aşaması açılmaz.

## AŞAMA 6 — Kapak / çift kapak / klapa

**tamam:** `kapak_hesapla` 1 veya 2 kanat ölçer. `kapak_yerlestir` tek kapak, gövdenin önü. `sira_kur` her kasada bu tek kapağı koyar.

**kısmi:** Çift kapak ölçüsü var. Çift kapak yerleşimi yok.

**eksik:** Klapa fonksiyonu. **doküman/plan:** `MOBILYA_MOTORU_REHBER.md` “henüz kuralı yazılmayanlar” altında klapa. Menüde klapa düğmesi yok.

**Bağımlılık:** Aşama 5. Kapak formülü (`iç ölçü + bindirme − derz`) korunur. Çekmece önü ile kapak aynı kapağı paylaşmaz; çekmece kutusu durmadan çift kapak yerleşimi ona bağlanmaz.

Ayrı işler, tek committe birleşmez:

- Tek kapak: korunur. Yeniden yazılmaz.
- Çift kapak: `kapak_hesapla(..., 2)` yerleşime bağlanır. Yeni ölçü formülü yazılmaz.
- Klapa: kural cümlesi yokken kod yazılmaz. **eksik / doküman.**

**Beklenen çıktı:** Çift kapak iki kutu olarak durur. Klapa, kural yazılmadan parça üretmez.

**Değişecek dosyalar:** Çift kapak için `motor.py`, `mobilya_motor.js`, testler, sonra `sira_kur` çağrısı ve sahne. Klapa dosyası bu aşamada açılmaz; kural ayrı onay ister.

**Test:** `test_kapak_tek_ic_olcuden`, `test_kapak_cift`, `test_kapak_yerlestir_onde` bozulmaz. Çift kapak yerleşimi için yeni test. Klapa testi, fonksiyon yokken “var” diye yazılmaz.

**Geçiş:** Tek kapak testi geçer. Çift kapak yerleşimi testi geçer. Klapa hâlâ eksikse bu, aşamayı kilitlemez; sonraki aşamaya “klapa eksik” notuyla geçilir. Klapa kodu kural onayı olmadan yazılmaz.

## AŞAMA 7 — Arkalık / dikme / köşe / dolgu

Birbirine bağlı değiller. Tek değişiklikte birleştirilmez.

- **Kanallı arkalık — tamam.** `govde_birlestir` kanallı kutu koyar. Yeniden yazılmaz.
- **Bindirme arkalık — kısmi.** `arkalik_hesapla` ölçer. `sira_kur` çağırmaz. `arkalik_derinlik` formülde yok.
- **Dikme — kısmi.** `govde_hesapla(..., dikme_adedi)` parça ölçüsü verir. `govde_birlestir` dikme koymaz.
- **Köşe — kısmi liste, eksik yerleşim.** `kose_enler` baza 1000 ve 1200 (`duz_kasa: false`). Düz sıraya girmez. Duvara oturma kodu yok.
- **Dolgu — kısmi.** Kalan pay tek `dolgu` kutusu. Kasa değil. **doküman/plan:** rehber “dolgu menüde ayrı parça” der; menüde bu düğme yok.

**Bağımlılık:** Aşama 6 kapak testi. Köşe, `kose_enler` listesine bağlıdır; dolgu ve dikme ona bağlı değildir.

**Beklenen çıktı:** Her iş kendi testiyle biter. Biri bitmeden diğeri aynı yamada yazılmaz.

**Değişecek dosyalar:** İşe göre `motor.py`, `mobilya_motor.js`, testler. Köşe yerleşimi ayrıca `vitrin.js`. Dolgu menüsü Aşama 14’e kalır; bu aşama yalnız kutu sözleşmesini netleştirir.

**Test:** Mevcut `test_arkalik_kanalli`, `test_arkalik_bindirme`, `test_govde_dikme`, `test_katalog_standart_ve_kose`, `test_sira_kur_dolgu_sagda` bozulmaz. Yeni yerleşim için yeni test.

**Geçiş:** Seçilen tek işin yeni testi geçer ve eski gövde testi bozulmaz. Dört işin hepsi bitmeden Aşama 8 açılabilir; bitmeyen iş “eksik” kalır ve sonraki aşama onu tamamlanmış saymaz.

## AŞAMA 8 — Ayak / süpürgelik / baza

**kısmi:** `ayak_supurgelik_hesapla` `ayak_yuksekligi`, `supurgelik_yuksekligi`, `supurgelik_geri` döner. `parcalar` boş. Sahnede `tip_olcu.yerden` Z kaymasıdır. Baza yüksekliği `baza_govde_yukseklik`. Bu üç ayar korunur.

**eksik:** Ayak parçası, süpürgelik parçası, baza bandı parçası. Fonksiyon yok. **doküman/plan:** rehber “ayak parçası yok; Z kayması ayak değildir.”

**Bağımlılık:** Aşama 7’deki gövde kutusu durur. Ayak parçası, gövde formülünü yeniden yazmaz; alta eklenir. Z kayması, parça üretilene kadar kalır.

**Beklenen çıktı:** Ayak ve süpürgelik gerçek parça kutusu. Mevcut üç sayı aynen kalır.

**Değişecek dosyalar:** `motor.py`, `mobilya_motor.js`, testler. Sahne, parça adı `cizGovde3d` içine ancak kutu üretildikten sonra girer.

**Test:** `test_ayak_supurgelik_varsayilan` ve hata testleri bozulmaz. Parça ölçüsü için yeni test. İkiz.

**Geçiş:** Parça testi geçer, eski ayak sayı testi bozulmaz. Geçmeden delik işi açılmaz.

## AŞAMA 9 — Hırdavat ve delik üretimi

**tamam, yeniden yazılmaz:** `hirdavat_hesapla` menteşe adedi (`_mentese_kapak_basi` × kapak adedi). Kavela, minifiks, konfirmat birleşim başı ölçü. `raf_hesapla` `raf_pimi_adet` × raf adedi ve aks listesi.

**kısmi:** Delik koordinatı yok. `parcalar` boş. Ağırlık menteşe adedine girmez. Sahneye bağlı değil. `cizGovde3d` renk anahtarında `"menteşe"` var; `sira_kur` bu adlı parça üretmez.

**eksik:** Menteşe delik koordinatı. Kulp. Başka hırdavat adı kodda yok.

**Bağımlılık:** Aşama 6 kapak yüksekliği (menteşe eşiği onu kullanır). Aşama 5 çekmece, ray deliği istenirse ona bağlıdır; raf pimi çekmeceye bağlı değildir.

**İş:** Adet fonksiyonunu yeniden yazma. Koordinat, mevcut adedin üstüne eklenir.

**Beklenen çıktı:** Menteşe, raf pimi, kavela, minifiks, konfirmat için koordinat veya “birleşim başı, toplam yok” sınırı açıkça durur. Kod bugün toplam birleşim sayısı üretmez.

**Değişecek dosyalar:** `motor.py`, `mobilya_motor.js`, testler. Sahne rengi parça üretmeden “menteşe var” sayılmaz.

**Test:** `test_hirdavat_varsayilan`, `test_hirdavat_cift_kapak`, `test_raf_aks_ve_pim_ayardan_gelir` bozulmaz. Koordinat için yeni test.

**Geçiş:** Eski adet testleri geçer. Yeni koordinat testi, yazıldıysa geçer. Koordinat yazılmadıysa aşama açık kalır; malzeme aşaması adet hesabını tamamlanmış sanmaz.

## AŞAMA 10 — Malzeme / renk / yüzey bilgisi

**eksik:** Parça üzerinde malzeme, renk, dekor, kenar bant alanı yok.

**kısmi çizim:** `cizGovde3d` sabit renk dizisi. Ayar değil.

**doküman/plan:** Rehber “katman 6 renk ve malzeme bitmedi” der. Menüde malzeme seçimi yok.

**Bağımlılık:** Aşama 9 parça adları durur. OCR `kenar_bant.py` ayrı kapıdır; mobilya parçasına kendiliğinden yazılmaz.

**İş:** Üretim parçasına alan ekleme sözleşmesi. Zorunlu alan uydurulmaz. `cizGovde3d` renkleri malzeme kaydı sayılmaz.

**Beklenen çıktı:** Parça sözlüğüne eklenecek alanların listesi: malzeme, kalınlık (bugün `kalinlik` kutu boyu olarak var), renk/dekor, bant. Bant kuralı bu depoda mobilya motorunda yoksa alan opsiyonel kalır.

**Değişecek dosyalar:** Sözleşme yazılırsa `motor.py` parça üreticileri ve JS ikizi. Renk paleti uydurulmaz.

**Test:** Eski kutu alanları (`ad`, `x`, `y`, `z`, `en`, `boy`, `kalinlik`) bozulmaz. Yeni alan için yeni test. Alan yokken test “var” demez.

**Geçiş:** Sözleşme ya kodda durur ya da “eksik” diye kapanır. Yarım alan zorunlu yapılmaz. Geçiş, Aşama 1 kutu testlerinin bozulmamasına bağlıdır.

## AŞAMA 11 — Üretim veri modeli

**tamam alanlar, kodda var:** `ad`, `en`, `boy`, `kalinlik`, `adet` (`_parca` / `_kutu`). Kutu için ayrıca `x`, `y`, `z`.

**eksik:** Ortak üretim sözleşmesi dosyası. Malzeme, bant, operasyon. Bunlar Aşama 10 yazılmadan zorunlu olmaz.

**Bağımlılık:** Aşama 10. OCR `kesim_listesi_sanity_kontrol` alanları (`uzunluk_mm`, `genislik_mm`, `adet`, `kalinlik_mm`) mobilya kutusunun alan adları değildir. İkisi karıştırılmaz.

**İş:** Yalnız kodda duran alanlar zorunlu olur. Doğrulanmamış alan zorunlu yazılmaz.

**Beklenen çıktı:** Parça sözleşmesi: ad, ölçüler, adet, kalınlık. Malzeme, bant ve operasyon ancak Aşama 10’da kodlandıysa eklenir.

**Değişecek dosyalar:** Sözleşme `motor.py` dönüşüne eklenirse JS ikizi ve test. Ayrı şema dosyası, onay olmadan açılmaz.

**Test:** `test_sonuc_json_olur` bozulmaz. Yeni zorunlu alan, eski testi kırmadan eklenir.

**Geçiş:** Sözleşme testi geçer. Geçmeden kesim çıktısı açılmaz.

## AŞAMA 12 — Kesim / bant / üretim çıktıları

**eksik:** Mobilya motorundan kesim listesi, bant listesi, nest. Fonksiyon yok.

**ayrı kapı, mobilya değildir:** OCR `02_Canta/ocr_okuyucu/dogrulama.py` ve `kenar_bant.py`. Ebatlama `cep_motor.js` `fire_veri` okur. İkisi arasında paket kapısı yoktur (`ARCHITECTURE.md`).

**Bağımlılık:** Aşama 11 sözleşmesi. OCR listesi buraya taşınmaz.

**İş:** Mobilya parçalarından ayrı bir üretim listesi. OCR kesim listesi ile aynı fonksiyon yapılmaz.

**Beklenen çıktı:** Mobilya üretim listesi, kendi parça adlarıyla. `fire_veri` anahtarı bu listenin sahibi olmaz.

**Değişecek dosyalar:** Yeni çıktı fonksiyonu mobilya motorunda. OCR ve ebatlama dosyalarına yazılmaz.

**Test:** Yeni liste testi. OCR `test_kenar_bant.py` ve ebatlama hesabı bozulmaz.

**Geçiş:** Mobilya listesi testi geçer ve OCR testleri aynı kalır. Geçmeden BOM açılmaz.

## AŞAMA 13 — BOM / hırdavat reçetesi

**kısmi:** `hirdavat_hesapla` içinde `hirdavat` listesi: menteşe adedi; kavela, minifiks, konfirmat birleşim başı. Toplam birleşim sayısı yok.

**eksik:** Reçete dosyası, toplam adet, kulp satırı.

**Bağımlılık:** Aşama 9 adet hesabı ve Aşama 12 parça listesi. Adet fonksiyonu yeniden yazılmaz; reçete onu okur.

**Beklenen çıktı:** Parça listesi + hırdavat satırları. Birleşim başı ile toplam ayrı durur.

**Değişecek dosyalar:** Reçeteyi toplayan fonksiyon `motor.py` ve JS ikizi. `hirdavat_hesapla` gövdesi yalnız okunur.

**Test:** Mevcut hırdavat testleri bozulmaz. Reçete toplamı için yeni test. Toplam, kod yazılmadan “var” sayılmaz.

**Geçiş:** Reçete testi geçer. Geçmeden menü bağlanmaz.

## AŞAMA 14 — UI / menülerin gerçek motorlara bağlanması

**tamam menü:** `01_Ana_Site/index.html` dört kapı. Reçete `data-arac="elle"` → `/duvar/`. Sahne solunda Zemin, Duvar, Mobilya. Mobilya alt satırı Baza, Duvar, Boy.

**eksik düğme:** Çift kapak, çekmece, açık ön yüz, dolgu, malzeme, kesim. Rehberdeki iş ayarı / katalog / ön yüz / iç / donanım menüsü **doküman/plan**. Kodda yok.

**Bağımlılık:** Aşama 5–13’te gerçekten biten iş. Bitmeyen iş için düğme konmaz.

**İş:** Düğme, ancak ilgili fonksiyon turda parça üretiyorsa bağlanır. Sahte “çalışıyor” düğmesi yok.

**Beklenen çıktı:** Yeni düğme sayısı, biten üretim katmanı sayısıyla aynı.

**Değişecek dosyalar:** `02_Canta/elle_olcu/duvar/vitrin/vitrin.js`, `index.html`. Ana site dört kapısı değişmez.

**Test:** Kilitli duvarda Mobilya “Motor sırada” kalır (`adim_raf.js`). Açık turda yalnız çalışan tip ve bitmiş işlem seçilir.

**Geçiş:** Her yeni düğme bir motor çağrısı yapar. Çağrısız düğme kalmaz. Geçmeden veri akışı işi açılmaz.

## AŞAMA 15 — Zemin → Duvar → Mobilya entegrasyonu

**tamam, korunur:**

- Zemin `muhur` / `zemin_motor.js` `muhur`. Alan `kilit`.
- Duvar `zemin_kilit`, `hazirlik_onay`.
- Mobilya `mobilyaAc` yalnız duvar kilidinden sonra. `adim_raf.js` kilitsiz mobilyayı kilitli tutar.

**kapalı yan yol:** `02_Canta/elle_olcu/duvar/motor.py` `oda_modul_ekle` ve `duvar_motor.js` `odaModulEkle` her zaman `["Mobilya aşaması kapalı."]` döner. `vitrin.js` bunları çağırmaz. Çizim `sira_kur` → `mobilyaGovde` yolundadır. Bu fonksiyon tur yolu değildir. Açmak ayrı onay ister; bu aşama onu tur sanmaz.

**eksik akış:** Mobilya parçasının zemin veya duvar kaydına yazılması. `moduller` dizisi dolmaz.

**Bağımlılık:** Aşama 14. Kilit sırası değişmez: zemin mühürsüz duvar yok; duvar onaysız mobilya turu yok.

**İş:** Veri, duran kilit bayraklarından geçer. `oda_modul_ekle` yeniden yazılmaz. `sira_kur` girdisi seçili duvar eni ve `tip_olcu` olarak kalır.

**Beklenen çıktı:** Mühürsüz tur yok. Tur, duvar enini ve oda yüksekliğini duran alanlardan okumaya devam eder.

**Değişecek dosyalar:** Yalnız kopuk bulunan bağ. Varsayılan olarak `vitrin.js`. `motor.py` (zemin/duvar) ve `oda_modul_ekle` dokunulmaz.

**Test:** Mevcut duvar ve zemin testleri (`test_zemin_motor.py`, `test_duvar_motor.py`) bozulmaz. Mobilya turu kilitsiz açılmaz.

**Geçiş:** Kilit testi geçer. `oda_modul_ekle` hâlâ kapalı metin dönebilir; bu, turu bozmaz. Geçiş, turun kilit bayrağına bağlı kalmasına bağlıdır.

## AŞAMA 16 — Python / JavaScript ikiz doğrulaması

**tamam:** `test_mobilya_js_ikiz.py` mevcut hesapları JS ile karşılaştırır. `katalogYukle` tarayıcıda hata döner; katalog fetch ile gelir.

**İş:** Aşama 5–13’te eklenen her hesap için Python sonucu, JS sonucu ve ortak sözlük. Yeni fonksiyon ikizsiz tura çıkmaz.

**Bağımlılık:** İlgili aşamanın kendi testi. Bu aşama hepsini toplar.

**Beklenen çıktı:** Yeni fonksiyonlar `test_mobilya_js_ikiz.py` listesindedir. `1` ile `1.0` ayrımı JS’te yoktur (`ARCHITECTURE.md` sınırı). Test bu yüzden `_temiz` ile tamsayı yazar.

**Değişecek dosyalar:** `tests/test_mobilya_js_ikiz.py`, gerekirse `tests/ikiz_kos.js`. Motor formülü burada değiştirilmez.

**Test:** İkiz dosyasının tamamı.

**Geçiş:** İkiz testi geçer. Geçmeden regresyon turu kapanmaz.

## AŞAMA 17 — Test ve regresyon

**tamam dosyalar:** `test_mobilya_motor.py`, `test_mobilya_js_ikiz.py`, zemin `test_zemin_motor.py`, duvar `test_duvar_motor.py`, OCR test klasörü.

**Kural:** Eski test bozulmaz. Yeni davranış yeni test ister. Test, Aşama 0’dan beri her aşamanın geçiş şartıdır. Bu aşama hepsini bir arada çalıştırır.

**Bağımlılık:** Aşama 16.

**Beklenen çıktı:** Mobilya, zemin, duvar testleri geçer. OCR testleri, OCR dosyasına dokunulmadıysa aynı kalır.

**Değişecek dosyalar:** Yalnız kırılan testi düzelten kod. Kırık, formülü sessizce değiştirerek kapatılmaz.

**Test:** Yukarıdaki dosyalar.

**Geçiş:** Hepsi geçer. Geçmeden yayın uyumu açılmaz.

## AŞAMA 18 — Yayın / Firebase / pack_yayin

**kısmi:** Aşama 3 üç mobilya dosyasını pakete alır. Bu aşama, o tarihte kaynaktaki mobilya js, config ve kataloğun `00_Yayin/mobilya/` ile aynı olduğunu tekrar bakar.

**Bağımlılık:** Aşama 17. `firebase.json` `public` = `00_Yayin`. `pack_yayin.py` `duman` güvenlik başlığı ve kapı yollarını denetler.

**İş:** Kaynakta değişen vitrin ve mobilya dosyaları pack ile yenilenir. `katalog_arsiv.json` listede kalır. OCR `.env` repoya girmez.

**Beklenen çıktı:** `00_Yayin/mobilya/` üç dosya. Duvar vitrini güncel `vitrin.js` ile aynı turu taşır.

**Değişecek dosyalar:** `pack_yayin.py` yalnız hâlâ eksik kopya varsa. Çıktı `00_Yayin/`.

**Test:** Pack sonrası dosya varlığı. `duman` ve `duman_firebase`. Aşama 17 testleri tekrar.

**Geçiş:** Yayın ağacı kaynakla aynı mobilya üçlüsünü içerir ve duman kontrolü geçer. Geçmeden son denetim açılmaz.

## AŞAMA 19 — Son teknik denetim

Kontrol listesi. Yeni özellik yok.

- Dosya yapısı: `02_Canta/elle_olcu/mobilya/` duruyor; motor başka klasöre taşınmadı.
- Motor: Aşama 1 fonksiyonları duruyor; yeniden yazılmadı.
- UI: Düğmeler yalnız biten işe bağlı.
- Test: Aşama 17 geçer.
- Yayın: Aşama 18 üç dosya.
- Dokümantasyon: `00_PROJE_DURUMU.md` ve bu dosya, biten işe göre güncellenir.
- Eski kurallar: “motor yok / sıfırdan yazılacak” geri gelmez.
- Çelişkiler: `oda_modul_ekle` kapalı yan yol olarak duruyorsa belgede böyle yazılır. Tur yolu `sira_kur` olarak yazılır.

**Bağımlılık:** Aşama 18.

**Beklenen çıktı:** Güncel `00_PROJE_DURUMU.md`. Bitmeyen işler eksik kalır; tamamlandı diye yazılmaz.

**Değişecek dosyalar:** `00_PROJE_DURUMU.md`, bu dosyada biten maddelerin işareti. Kod, denetim sırasında değiştirilmez.

**Test:** Aşama 17’nin aynı komutu.

**Geçiş:** Denetim listesi işli. Açık eksik varsa adıyla durur. Kapatılmış sayılmaz.

## KARAR KURALI

- Duran fonksiyon yeniden yazılmaz: `govde_birlestir`, `sira_kur`, `tip_olcu`, `kapak_hesapla`, `raf_yerlestir`, `hirdavat_hesapla` adet kısmı, `MotorConfig`.
- Bağımlılık yukarıdaki “Bağımlılık” satırındadır. Atlamak yok.
- Kodda fonksiyonu yoksa işaret **eksik**tir: klapa, kulp, tezgah parçası, süpürgelik parçası, baza bandı, malzeme kaydı, mobilya kesim listesi, BOM toplamı.
- Yalnız belgede varsa işaret **doküman/plan**dır: rehber menü sırası, klapa cümlesi, `99_Muze/ARCHITECTURE_yol_haritasi.md`.
- Her aşama kendi testini geçmeden sonraki aşama açılmaz.
