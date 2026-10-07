# PROJE DURUMU — KOD REFERANSI

> Bu belge mevcut kod tabanının durumunu tanımlar.
> Kod ile eski dokümanlar arasında çelişki varsa önce kod incelenir.
> Bu belge varsayım içermez.
> Değişiklik yapıldıkça güncellenmelidir.

Kod esas. Testler çalıştırılmadı; dosyada duruyorlar. Mobilya motoru duruyor; sıfırdan yazılacak bir boşluk değil.

## 1. Gerçekte mevcut olanlar

Kökte `01_Ana_Site`, `02_Canta`, `00_Yayin`, `99_Muze`, `pack_yayin.py`, `cloud_bridge.py`, `firebase.json`.

`02_Canta` dört kapı:

- **OCR:** `02_Canta/ocr_okuyucu/`. `sunucu.py` içinde `/api/tara`, `/api/onizle`, `/api/duzelt`, `/api/ozel-bant`, `/api/usta-geri`, `/api/usta-hafiza`, `/api/olcu-havuzu`, `/api/kota`, `/api/durum`.
- **Ebatlama:** `02_Canta/ebatlama/vitrin/cep_motor.js` içinde `hesapla`, `sonrakiSenaryo`, `kesimAgaci`. `vitrin.js` bunları çağırır. Parça listesi `fire_veri` anahtarından okunur.
- **Reçete:** `02_Canta/elle_olcu/` altında ayrı üç motor.
  - Zemin: `zemin/motor.py` ve `zemin/zemin_motor.js`. `muhur` / `muhur`.
  - Duvar: `duvar/motor.py` ve `duvar/vitrin/duvar_motor.js`. `oda_ayarla`, `engel_ekle`, `oda_hazirlik_onayla`, `kose_pah_ekle`.
  - Mobilya: `mobilya/motor.py`, `mobilya/mobilya_motor.js`, `varsayilan_config.json`, `katalog_arsiv.json`.
- **Tel:** `02_Canta/tel_cizim/motor.py` içinde `parca_hesapla`. Dönüş: `{"hazir": False, "neden": "iskelet"}`.

Mobilya çekirdeğinde yazılmış fonksiyonlar (`02_Canta/elle_olcu/mobilya/motor.py` ve aynı adlarla `02_Canta/elle_olcu/mobilya/mobilya_motor.js`): `MotorConfig.from_dict`, `yukle`, `varsayilan`, `degistir`, `tip_olcu`, `govde_hesapla`, `govde_birlestir`, `kapak_hesapla`, `kapak_yerlestir`, `raf_hesapla`, `raf_yerlestir`, `katalog_yukle`, `standart_enler`, `kose_enler`, `duvar_dizi`, `sira_kur`, `cekmece_hesapla`, `arkalik_hesapla`, `ayak_supurgelik_hesapla`, `hirdavat_hesapla`.

Sahne turu bağlı: `02_Canta/elle_olcu/duvar/vitrin/vitrin.js` içindeki `mobilyaTurKur` sırayla `tip_olcu` ve `sira_kur` çağırır. `sira_kur` her standart kasa için `govde_birlestir`, `raf_yerlestir`, `kapak_yerlestir` çağırır. `02_Canta/elle_olcu/duvar/vitrin/vitrin_ciz.js` içindeki `cizGovde3d` bu kutuları çizer.

## 2. Kısmen tamamlananlar

- **Mobilya turu.** Duvar kilidi (`hazirlik_onay` veya `soruAdim === "duvar_kilit"`) sonrası `mobilyaAc` çalışır. Satırda yalnız `baza`, `duvar`, `boy` (`MOBILYA_TIPLER`). Genişlik katalogdan, derinlik `modul_derinlik`, yükseklik ve yerden `tip_olcu`.
- **Kapak.** `kapak_hesapla` 1 veya 2 kanat ölçer. `kapak_yerlestir` ve `sira_kur` yalnız tek kapak kutusu üretir.
- **Çekmece.** `cekmece_hesapla` yan, ön/arka, taban ve çekmece önü ölçüsü döner. Yükseklik formülü yok. XYZ yok. `sira_kur` ve `vitrin.js` çağırmaz.
- **Hırdavat.** `hirdavat_hesapla` menteşe adedi ve kavela/minifiks/konfirmat birleşim başı döner. `parcalar` boş. Sahneye bağlı değil. Ağırlık (`agirlik_kg`) menteşe adedinde kullanılmaz (`_mentese_kapak_basi` yalnız yükseklik eşiği).
- **Ayak.** `ayak_supurgelik_hesapla` üç sayı döner, parça üretmez. Sahnede `ayak` alanı `tip_olcu.yerden` ile Z kaymasıdır (`mobilyaTurKur` → `cizGovde3d`).
- **Arkalık.** `govde_birlestir` her zaman kanallı arkalık kutusu koyar. `arkalik_hesapla` ayrıca kanallı veya bindirme ölçer; `sira_kur` onu çağırmaz.
- **Dikme.** Yalnız `govde_hesapla(..., dikme_adedi)`. `govde_birlestir` dikme koymaz.
- **Köşe.** `kose_enler` baza 1000 ve 1200’ü (`duz_kasa: false`) listeler. `duvar_dizi` / `sira_kur` bunları koymaz.
- **Dolgu.** Kalan pay tek `dolgu` kutusu. Kasa değil.
- **Ebatlama Python motoru.** `02_Canta/ebatlama/baglanti.py` `motor_levha.py` dosyasını bu deponun dışında, `Takim_Cantasi_Motorlarİ/Fire_okuyucu` yolunda arar. Bu depoda o dosya yok. Ekrandaki hesap `cep_motor.js`.
- **Yayın ağacı.** `00_Yayin` boş değil (ana sayfa, okuyucu, ebatlama, duvar, zemin js, tel, elle). `00_Yayin/mobilya/` dosyası yok.

## 3. Eksik olanlar

Kodda fonksiyonu olmayanlar:

- Kulp, klapa, tezgah parçası, baza bandı parçası, süpürgelik parçası.
- Mobilya motorundan kesim listesi / nest.
- Renk ve malzeme kaydı. `cizGovde3d` içinde sabit renk dizisi var; ayar değil.
- Çift kapak, çekmece ve açık ön yüz seçimi. Menüde bu düğmeler yok.
- Köşe dolabının duvara oturması.
- `oda_modul_ekle` / `odaModulEkle` modül yazmaz. İkisi de `["Mobilya aşaması kapalı."]` döner. `vitrin.js` bu fonksiyonu çağırmaz.

Ayar duruyor, formülde kullanılmıyor (`02_Canta/elle_olcu/mobilya/motor.py` başlık notu ve gövde): `cekmece_derzi`, `arkalik_derinlik`. `modul_genislik` `sira_kur` genişliği değil; `duvar_dizi` içinde `del cfg`.

`mobilyaTurKur` dönüşünde `satir` her zaman `[]`. Kart yazısı `tur.satir.length`, yani `"0"`. `sira_kur` içindeki `modul_adedi` sahneye yazılmaz.

## 4. Sadece dokümanda olup kodda olmayanlar

`02_Canta/elle_olcu/mobilya/MOBILYA_MOTORU_REHBER.md` menü sırası (iş ayarı, oda, katalog ekranı, ön yüz, iç, donanım, tezgah, kesim listesi) arayüzde yok. Tur yalnız üç tip düğmesi çizer.

Aynı dosyada “henüz kuralı yazılmayanlar” altında klapa ve kulp var. Bunların fonksiyonu yok.

`README.md` “5. kapı yok” der. Kodda beşinci program kapısı yok. Aynı dosya “`04_Ilham_ve_Eski` boş” der. Bu adreste dosya yok.

`99_Muze/ARCHITECTURE_yol_haritasi.md` plan belgesidir. `ARCHITECTURE.md` bunu müze diye işaret eder. Güncel sözleşme olarak okunmaz.

## 5. Eski/yanlış yönlendiren dokümanlar

- **`README.md` satır 9 ve 62:** “Mobilya motoru 1–2 kilitlenmeden yazılmaz.” Kodda motor, JS ikizi, config, katalog, test ve sahne turu var.
- **`README.md` satır 19:** Reçeteyi yalnız zemin + duvar diye yazar. `02_Canta/elle_olcu/mobilya/` yok sayılır.
- **`README.md` satır 26:** `00_Yayin` boş der. Klasörde yayın dosyaları var.
- **`.cursorrules` kendi içinde çelişir.** Satır 7: “Mobilya motoru (aşama 3) açık.” Satır 11: “3 (mobilya motoru) 1–2 kilitlenmeden yazılmaz.”
- **`.cursor/rules/kok-hudut.mdc` satır 12** hâlâ “yazılmaz” der. Dosyanın kendi kuralı: çelişirse `.cursorrules` geçerli. Satır 7 motorun açık olduğunu söyler.
- **`02_Canta/elle_olcu/mobilya/MOBILYA_MOTORU_REHBER.md` satır 53:** Genişlik `modul_genislik` 600. **Satır 124:** `modul_genislik` sırada kullanılmaz. Kod satır 124 ile aynı: genişlik `katalog_arsiv.json` → `sablon`.
- **Aynı rehber satır 13:** “2.5 Çekmece yok.” `cekmece_hesapla` var; turda yok.
- **Aynı rehber satır 149:** “Tur bağlanmadan kod yazılmaz.” `mobilyaTurKur` turu `sira_kur` ile bağlı.
- **`ARCHITECTURE.md` kapı tablosu** `/mobilya/katalog_arsiv.json` yazmaz. `02_Canta/ocr_okuyucu/sunucu.py` bu yolu açar (satır 624).
- **`02_Canta/elle_olcu/duvar/motor.py` `oda_modul_ekle`:** “Aşama 3 kapalı.” Bu, mobilya hesabının yokluğu değil. Modül listesine yazma kapalı. Çizim ayrı yoldan (`sira_kur`) gidiyor.

`ARCHITECTURE.md` hesap fonksiyon listesi ve “tur `sira_kur` çağırır” cümlesi kodla uyumlu.

## 6. Mobilya motorunun gerçek mevcut durumu

Dosyalar:

| Dosya | Ne |
| --- | --- |
| `02_Canta/elle_olcu/mobilya/motor.py` | `MotorConfig` ve hesaplar |
| `02_Canta/elle_olcu/mobilya/mobilya_motor.js` | Aynı sözleşme, `window.MobilyaMotor` |
| `02_Canta/elle_olcu/mobilya/varsayilan_config.json` | 44 ayar. Levha 18, derz 2, bindirme 18, baza/duvar gövde 720, boy 2100, derinlik ayarı `modul_derinlik` 580 |
| `02_Canta/elle_olcu/mobilya/katalog_arsiv.json` | `sablon.baza/duvar/boy`. `acik_ek` sıraya girmez |
| `02_Canta/elle_olcu/mobilya/tests/test_mobilya_motor.py` | Config, gövde, kapak, raf, katalog, sıra, çekmece, arkalık, ayak, hırdavat |
| `02_Canta/elle_olcu/mobilya/tests/test_mobilya_js_ikiz.py` | Python ile JS aynı sözlük mü diye bakar |
| `02_Canta/elle_olcu/mobilya/tests/ikiz_kos.js` | JS ikiz koşucusu |

`sira_kur` bir duvar eni için soldan standart kasaları dizer, her kasaya iskelet + raf + tek kapak koyar, kalanı sağda `dolgu` yapar. Köşe genişliği girmez.

`govde_birlestir` parçaları: sol/sağ `yan`, `alt`, `ust`, kanallı `arkalik`. Köşe ön-sol-alt. X sağa, Y arkaya, Z yukarı. Başka motor import etmez. `test_motor_baska_motor_import_etmez` bunu denetler.

JS ikizi `katalogYukle` tarayıcıda `hata` döner; katalog `02_Canta/elle_olcu/duvar/vitrin/vitrin.js` içinde `fetch("/mobilya/katalog_arsiv.json")` ile gelir.

## 7. Mobilya motorunda eksik üretim katmanları

Hesap var, üretim/sahne yok:

- Çekmece: yükseklik, ray seçim kuralı, kutu koordinatı, `sira_kur` çağrısı yok.
- Hırdavat: delik koordinatı ve parça yok. `parcalar: []`.
- Ayak ve süpürgelik: parça yok.
- Bindirme arkalık: `govde_birlestir` kullanmaz.
- Çift kapak yerleşimi yok.
- Dikme iskelete girmez.
- Köşe modülü yerleşmez.
- Dolgu, konstrüksiyon değil, tek kutu.

Hiç yazılmamış üretim:

- Kulp, klapa, tezgah levhası, baza bandı.
- Menteşe parçası. `cizGovde3d` renk anahtarında `"menteşe"` var; `sira_kur` bu adlı parça üretmez.
- Malzeme/renk verisi.
- Mobilya kesim listesinin ebatlamaya gitmesi. OCR kesim listesi ile mobilya parçaları arasında kapı yok (`ARCHITECTURE.md` bunu okuyucu–ebatlama için de söyler).

## 8. UI/menü tarafındaki mevcut durum

**Ana site** `01_Ana_Site/index.html`. Çanta dört düğme: Fire Ebatlama, Mobilya İmalat Akıllı Reçete (`data-arac="elle"` → `/duvar/`), Tel çizim, OCR ölçü. Ayrı “Elle ölçü” veya “Duvar giydir” kapısı yok. `/elle/` `02_Canta/ocr_okuyucu/sunucu.py` içinde `/duvar/` adresine gider.

**Reçete sahnesi** `02_Canta/elle_olcu/duvar/vitrin/index.html`:

- Sol: `modulZemin`, `modulDuvar`, `modulMobilya`.
- Mobilya alt satırı: Baza, Duvar, Boy.
- Menü paneli: Ayarlar, Zemin/Gereçleri, Duvar/Gereçleri, yedek al/yükle, zemini/duvarı düzelt.
- Engel şeridinde Kapı, sifon sürükleme var.
- Ayrı sayfalar dosyada durur: `zemin.html`, `duvar.html`, `kapi.html`, `seramik.html`, `dolap_alti.html`, `ayakli_mermer.html`, `yer_sifonu.html`, `ayarlar.html`. Ana menüde ilk ikisi ve ayarlar linkli.

`02_Canta/elle_olcu/duvar/vitrin/adim_raf.js` sol liste: En, Boy, Eşik, Oda, Gönye, Yükselti, Sifon, Şekil, Duvarlar, Kilit, Mobilya. Duvar kilitli değilse Mobilya “Motor sırada” ve kilitli.

İş ayarı ekranı yok. `MotorConfig` JSON’dan gelir; tur sormaz.

## 9. Yayınlama ve paketleme durumu

`pack_yayin.py` `kopyala()`:

- `01_Ana_Site` → `00_Yayin/`
- OCR statik dosyalar → `00_Yayin/okuyucu/`
- Ebatlama vitrin listesi → `00_Yayin/ebatlama/`
- `tel` ve `duvar` vitrin klasörleri → `00_Yayin/tel`, `00_Yayin/duvar`
- `elle/index.html` yalnız `/duvar/` yönlendirmesi
- `zemin_motor.js` → `00_Yayin/zemin/`
- `mobilya_motor.js` ve `varsayilan_config.json` → `00_Yayin/mobilya/`
- **`katalog_arsiv.json` kopyalanmaz**

`firebase.json` `public` alanı `00_Yayin`. Mevcut `00_Yayin` ağacında `mobilya` dosyası yok. Yerel `sunucu.py` kataloğu ve ayarı kaynaktan verir. Yayın kopyası, bugünkü haliyle, `vitrin.js` içindeki `/mobilya/katalog_arsiv.json` isteğini karşılayacak dosyayı içermez.

`vitrin_kapi_js()` yayın HTML’lerine parola hash’i gömer. Kaynak `MAGI_VITRIN_SIFRE`. Bu değer `.env` içindedir; `.gitignore` `.env` dışlar.

## 10. Kritik çelişkiler

1. README ve `kok-hudut.mdc` motoru “yazılmadı” sayar. `motor.py` ve sahne turu duruyor. `.cursorrules` satır 7 motoru açık sayar.
2. `oda_modul_ekle` “Mobilya aşaması kapalı” der. Sahne modülü `moduller` dizisine yazmaz; `sira_kur` parçalarını `mobilyaGovde` ile çizer. İki yol birbirine bağlı değil.
3. Rehber genişliği hem `modul_genislik` hem katalog der. Çalışan yol katalog.
4. Rehber “tur bağlı değil” ile “tur `sira_kur`” cümlelerini birlikte taşır. Kodda tur bağlı.
5. `ARCHITECTURE.md` kapı tablosu katalog yolunu atlar. `sunucu.py` o yolu açar. `pack_yayin.py` o dosyayı yayınlamaz.
6. `cizGovde3d` menteşe rengi bekler. Tur menteşe parçası üretmez.
7. Kart metni kasa sayısını değil, hep boş `satir` uzunluğunu yazar.

## 11. Kod değişikliği gerektiren işler

Bunlar tespit. Yazılmadı.

- Yayın paketine `katalog_arsiv.json` kopyası. Yoksa Firebase’de tur katalogsuz kalır.
- `mobilyaTurKur` kartının `modul_adedi` okuması. Şu an `satir` boş olduğu için yazı `0`.
- Çekmeceyi tura bağlamak: önce yükseklik ve ray kuralı, sonra kutu. Fonksiyon tek başına sahne değil.
- `hirdavat_hesapla` delik koordinatı ve sahne bağı yok.
- Ayak/süpürgelik parçası yok; yalnız Z kayması var.
- Çift kapak `kapak_yerlestir` içinde yok.
- Köşe `kose_enler` yerleşmiyor.
- `oda_modul_ekle` hâlâ kapalı metin döner. Rehber bunu ayrı onay sayar. Sahne turu bunu beklemiyor.
- README, `kok-hudut.mdc` ve `.cursorrules` satır 11, duran motora göre eski.

## 12. Önerilen uygulama sırası

Kodun bağlı olduğu sıraya göre:

1. Dokümanı koda çek. Motor var. “Sıfırdan yazılacak” cümlesi kalksın.
2. Yayın boşluğu: `katalog_arsiv.json` pack listesine girsin. Mevcut `00_Yayin/mobilya` yok.
3. Tur sayacı: `sira_kur` sonucu `modul_adedi` sahneye yazılsın. Yeni hesap değil.
4. Sıradaki üretim, rehberin kendi yasağıyla: çekmece yüksekliği yazılmadan `cekmece_hesapla` sahneye bağlanmaz. Fonksiyon hazır, kural eksik.
5. Ondan sonra hırdavat deliği. Adet hesabı duruyor, parça yok.
6. Ayak/süpürgelik parçası ve köşe yerleşimi ayrı iş. `oda_modul_ekle` açmak bunlardan bağımsız; bugün çizim o fonksiyondan geçmiyor.

## KULLANIM KURALI

Bu dosya gelecekteki geliştirme çalışmalarında mevcut durum referansıdır.

Hiçbir AI asistanı:

- Mobilya motorunu sıfırdan yazılmış/yazılmamış kabul etmemeli,
- mevcut fonksiyonları tekrar yazmamalı,
- mevcut çalışan hesapları gereksiz yere değiştirmemeli,
- yalnızca eski README veya eski plan belgelerine dayanarak karar vermemeli.

Her geliştirme öncesinde mevcut kod ve bu dosya birlikte kontrol edilmelidir.
