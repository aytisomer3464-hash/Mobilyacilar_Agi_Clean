# Mobilyacılar Ağı – Akıllı Reçete Sistem Mimarisi v2

> Arşiv kopyası. Kaynak: `Mobilyacilar_Agi_Cursor_Referans_Paketi_2026-10-08.pdf`, sayfa 1–4. Metin PDF'ten aktarıldı; içerik değiştirilmedi. Yaşayan üretim standardı değildir.

Mevcut çalışan akışın kaydı ve üretim odaklı geliştirme önerileri

## 1. Yönetici özeti

Mobilyacılar Ağı'nın tarif edilen mevcut altyapısı Zemin Motoru → Duvar Motoru → engeller → kilit/onay sırasıyla çalışıyor ve yaklaşık %80–90 oranında soru-cevap ve yönlendirmeli ilerliyor. Bu akış mevcut bir kabiliyettir; bu belgede yeni öneri olarak sunulmamaktadır. Geliştirme önerisi, bu sağlam başlangıcı Mobilya Motoru, doğrulanabilir kurallar ve imalata hazırlık kontrolleriyle genişletmektir.

Hedef, rutin yerleşim ve reçete kararlarının büyük bölümünü sistemin yönetmesi; usta veya tasarımcının istisnaları inceleyip son düzenlemeyi yapmasıdır. Bu hedef bir tasarım amacı olarak ele alınmalı, gerçek başarı oranı saha verisiyle ölçülmelidir. Otomatik üretim emri veya makine dosyası ancak tüm zorunlu kontroller geçtiğinde hazırlanmalıdır.

## 2. Mevcut mimarinin doğru kaydı

| Katman | Mevcut rol | Belgedeki statü |
| --- | --- | --- |
| Zemin Motoru | Mekânın taban/zemin bilgisini kurar. | Mevcut çalışan mimari |
| Duvar Motoru | Duvarları ve mekân geometrisini oluşturur. | Mevcut çalışan mimari |
| Engeller | Mekândaki engelleri akışa dahil eder. | Mevcut çalışan mimari; türleri geliştirilerek ayrıştırılabilir |
| Kilit / onay | Geometri ve girilen bilgileri onay aşamasında sabitler. | Mevcut çalışan mimari |
| Yönlendirmeli soru-cevap | Kullanıcıdan eksik girdileri adım adım alır. | Mevcut işleyiş yaklaşık %80–90 kapsamda; kullanıcı tarafından bildirilen durum |

Önerilen tasarım ilkesi: çalışan Zemin ve Duvar akışı korunmalı; yeni motorlar mevcut veriyi tekrar toplamak yerine aynı onaylı mekân modelini kullanmalıdır. Her değişiklik kaynağı, değeri ve onayıyla izlenebilir olmalıdır.

## 3. Önerilen hedef mimari

1. Mekân modeli: Zemin ve Duvar Motoru'nun onaylı çıktısı, ölçü birimi ve koordinat sistemi tanımlı ortak veri modeline aktarılır.
2. Engel ve ankraj katmanı: engeller sınıflandırılır; cihaz ve tesisat noktaları konum, ölçü, tolerans ve güven düzeyiyle saklanır.
3. Kural motoru: zorunlu kısıtlar, koşullu teknik kurallar ve tavsiye/uyarıları ayrı seviyelerde değerlendirir; her sonuç neden kodu ve kaynak kuralıyla açıklanır.
4. Mobilya Motoru: seçilen modül/katalog ve ölçülere göre otomatik ilk yerleşim ve reçete taslağı oluşturur.
5. Doğrulama: çarpışma, açıklık, ölçü tutarlılığı ve üretilebilirlik kontrolleri çalışır; hata varsa üretim çıktısı engellenir veya eksik veri sorulur.
6. Usta incelemesi ve çıktı: kullanıcı farkları görür, override gerekçesi girer, kilitler/onaylar; sistem sürümlü reçete, BOM, kesim ve CNC hazırlık çıktıları üretir.

## 4. Engel sınıfları ve karar öncelikleri

| Sınıf | Anlamı | Sistem davranışı |
| --- | --- | --- |
| Katı / sert engel | Duvar, kolon, sabit şaft veya mobilyanın giremeyeceği doğrulanmış hacim. | Çakışan çözümü reddet; geçersizliği göster. Yetkili düzeltme olmadan aşılmaz. |
| Teknik-koşullu engel | Priz, vana, boru, radyatör, davlumbaz hattı veya servis erişimi gereken alan. | Kuralın koşuluna göre yasak bölge, zorunlu boşluk ya da erişim alanı uygula. Belirsizlikte soru sor. |
| Yumuşak / uyarı alanı | Kullanım tercihi, görsel hizalama, önerilen çalışma boşluğu gibi ihlal edilebilir tercih. | Çözüm üret; ihlali önem derecesiyle açıkla ve kullanıcı onayı iste. |

Önerilen öncelik sırası: (1) ölçü ve geometri bütünlüğü, (2) katı engeller, (3) güvenlik/tesisat ve servis erişimi koşulları, (4) üretilebilirlik ve donanım gereksinimleri, (5) yumuşak tercihler ve estetik optimizasyon. Aynı seviyedeki kurallar çakışırsa sistem sessizce seçim yapmamalı; çakışmayı raporlamalıdır. Üst seviyedeki zorunlu kural, alt seviyedeki tercihi geçersiz kılar.

## 5. Cihaz ve tesisat ankrajları

Ankraj, yalnızca harita üzerindeki bir nokta değil, mobilya tasarımını etkileyen ölçülü bir referans nesnesidir. Veri alanları en azından şunları içermelidir: tür, x-y-z konumu, yön/normal, ölçü veya bağlantı aralığı, tolerans, servis erişim zarfı, bağlı duvar/zemin kimliği, ölçüm yöntemi, güven düzeyi, fotoğraf/not ve son doğrulayan kişi.

- Elektrik prizi ve anahtar: kapak/arka panel çakışması ve erişilebilirlik kontrolü.
- Su/gider/vanalar: lavabo modülü, sifon ve bakım erişimi için teknik boşluk.
- Gaz hattı ve sayaç: uygulanacak yerel teknik kurallara göre yetkili doğrulama gerektiren kısıt.
- Davlumbaz, baca ve havalandırma: bağlantı noktası ile kanal güzergâhı ilişkisi.
- Radyatör ve borular: ısı yayılımı ve bakım/temizlik boşluğu.

Ankrajın güven düzeyi düşükse sistem ölçüyü gerçek kabul ederek otomatik kilitlememeli; kullanıcıdan doğrulama istemeli veya taslağı "ölçü teyidi bekliyor" durumuna almalıdır. Güvenlik ve mevzuat değerleri projeye/ülkeye göre yetkili uzman tarafından yapılandırılmalıdır.

## 6. Mobilya Motorunda otomatik ilk tur

İlk tur, kesin imalat kararı değil; açıklanabilir, düzenlenebilir bir taslak olmalıdır. Girdiler: onaylı mekân, engeller/ankrajlar, kullanıcı ihtiyaçları, seçilen ürün ailesi, malzeme ve donanım tercihleri. Sistem önce zorunlu sınırları uygular, sonra modül yerleşimini puanlar ve en iyi uygun taslağı sunar.

- Taslakla birlikte kullanılan varsayımları ve eksik bilgileri göster.
- Her modülün ölçü ve yerleşim gerekçesini, kural sonuçlarını ve uyarıları incelemeye aç.
- Alternatifleri karşılaştır: depolama kapasitesi, toplam ölçü, yaklaşık malzeme ihtiyacı ve tercih ihlalleri.
- Çözüm bulunamıyorsa geçersiz bir taslağı zorla üretmek yerine çakışan kuralı ve gereken kullanıcı girdisini bildir.

## 7. Usta override ve onay

Usta override, kontrollü bir istisna kaydıdır. Her override; etkilenen nesneyi/kuralı, önceki değeri, yeni değeri, gerekçeyi, kullanıcıyı, zamanı ve taslak sürümünü saklamalıdır. Sert engeller ve güvenlik açısından kritik koşullar sıradan override ile aşılamaz; ancak veri düzeltme ve yetkili yeniden doğrulama akışı kullanılabilir.

- Önce/sonra farklarını görsel ve sayısal olarak göster.
- Override sonrasında etkilenen çarpışma ve üretilebilirlik kontrollerini yeniden çalıştır.
- Onaylı sürümü değişmez bir revizyon olarak sakla; sonraki düzenleme yeni revizyon oluşturur.
- Öğrenme için override nedenlerini sınıflandır; kayıtları kural güncellemesi için öneri olarak kullan, otomatik kural değişikliğine dönüştürme.

## 8. Çarpışma ve üretilebilirlik kontrolleri

### Çarpışma kontrolü

Modüller arası çakışma, mobilya ile katı/koşullu engel kesişimi, kapak ve çekmece açılım hacmi, ankraj/servis alanı, duvar ve zemin ilişkisi kontrol edilir. Sınır toleransları ürün ailesine göre tanımlanır; toleranslar evrensel sabit gibi sunulmaz. Sonuçlar hata, bloklayıcı uyarı ve bilgilendirme olarak ayrılır.

### Üretilebilirlik kontrolü

Parça ölçülerinin seçili levha/işleme kapasitesine sığması, kenar bantlama ve yön bilgisi, bağlantı elemanı/işleme erişimi, makine sınırları, malzeme bulunabilirliği ve montaj sırası değerlendirilir. Makineye özel takım yolu ve post-processor üretimi entegrasyon aşamasında ilgili makine üreticisi/tedarikçisiyle doğrulanır.

## 9. Reçete ve imalat veri sırası

Kullanıcıya ve imalata giden reçete aşağıdaki bağımlılık sırasını izlemelidir. Sıralama, aşağıdaki adımın önceki adımdan türediğini ve değişiklikte yeniden hesaplanması gerektiğini anlatır:

7. Kasa çözümü: gövde tipi, dış ölçüler, iç bölmeler ve malzeme kalınlıkları.
8. Boşluk ve dolgu: duvar/zemin toleransları, montaj payı ve kapama parçaları.
9. Dekoratif elemanlar: taç, baza, yan kapama, süpürgelik ve benzeri parçalar.
10. Cephe ve kapak: cephe ölçüleri, bindirme/boşluk, açılım ve hareket alanları.
11. Hırdavat: menteşe, ray, kaldırma mekanizması, kulp ve bağlantı elemanları.
12. PVC / kenar bantlama: hangi kenarın hangi bantla işleneceği ve yön bilgisi.
13. BOM ve kesim listesi: parça kodu, miktar, ölçü, malzeme, kalınlık, kenarlar ve revizyon.
14. Nesting ve CNC çıktısı: levha yerleşimi ve doğrulanmış makine formatı; yalnızca onaylı ve üretilebilir revizyondan.

## 10. Önerilen uygulama planı

| Aşama | Teslim edilecek sonuç | Kabul ölçütü |
| --- | --- | --- |
| 1. Veri sözleşmesi | Mekân, engel, ankraj, modül ve reçete alanlarının sözlüğü. | Zemin/Duvar verisi kayıpsız aktarılır; ölçü birimi ve koordinat açıklıdır. |
| 2. Engel ve kural motoru | Üç engel seviyesi, öncelik ve gerekçeli sonuçlar. | Örnek senaryolar beklenen blok/uyarı/izin sonucunu verir. |
| 3. Otomatik ilk tur | Kural uyumlu mobilya taslağı ve eksik bilgi soruları. | Çözümler izlenebilir; imkânsız senaryoda üretim çıktısı oluşmaz. |
| 4. Usta incelemesi | Fark görünümü, gerekçeli override, revizyon ve kilit. | Değişiklik geçmişi ve yeniden doğrulama çalışır. |
| 5. Üretim çıktıları | BOM, kesim, PVC ve makineye özel entegrasyon. | Atölye örnek siparişiyle çıktı karşılaştırması ve makine onayı yapılır. |

Her aşama gerçek proje örnekleriyle gölge modda denenmeli; sistemin önerisi ustanın kararını başlangıçta otomatik değiştirmemelidir. Kabul ölçütleri; ilk seferde doğru çözüm oranı, ustanın düzeltme süresi, kritik çakışma kaçırma sayısı, ölçü teyidi bekleyen iş oranı ve reçete/atölye uyuşmazlığı üzerinden ölçülmelidir. %80–90 rutin karar hedefi ancak bu ölçümler tanımlı örneklemde sağlandığında başarı olarak raporlanmalıdır.

## 11. Dünya örneklerinden çıkarılan yaklaşım

Üretici dokümantasyonlarında tekrar eden desen; parametrik/kurallı tasarımın üretim verisine bağlanması, tasarım değişikliğinin ilişkili parçalara yansıması, kesim/BOM/raporların hazırlanması ve CNC bağlantısının makineye özgü doğrulanmasıdır. Bu örnekler Mobilyacılar Ağı'nın mevcut durumunun kanıtı değildir; yalnızca önerilen hedef mimari için karşılaştırma noktalarıdır.

- Hexagon Cabinet Vision, tasarım ve mühendislik kurallarını maliyet, BOM, kesim listesi, nesting ve CNC çıktılarıyla ilişkilendiren modüler bir tasarım-üretim akışı tarif eder.
- TopSolid'Wood, tasarım aşamasında işleme kısıtlarını dikkate alan CAD/CAM yaklaşımını ve model ile CAM hazırlığı arasındaki ilişkilendirmeyi açıklar.
- imos iX ürün dokümantasyonu, tasarım/sipariş ve üretim işlevlerini modüller halinde konumlandırır; entegre veri modelinin değişiklikleri yönetme rolünü belirtir.
- Autodesk Fusion'ın marangozluk/CNC içeriği, parametrik tasarım, takım yolu, simülasyon, nesting ve NC kodu üretimini öne çıkarır; makineye uygun post-processor gereğini ayrıca tanımlar.

## 12. Sonuç ve önerilen karar

Mevcut Zemin → Duvar → engeller → kilit/onay zinciri korunmalı ve ortak mekân modelinin temeli olarak ele alınmalıdır. İlk geliştirme dilimi, engel sınıfları + kural öncelikleri + gerekçeli sonuçlar olmalıdır. Ardından ankrajlar ve Mobilya Motoru'nun açıklanabilir ilk taslağı; sonrasında override, çarpışma/üretilebilirlik ve BOM/kesim/CNC entegrasyonu gelmelidir. Bu sıra, çalışan çekirdeği koruyarak otomasyon kapsamını ölçülebilir biçimde artırır.

## Kaynaklar

- Hexagon, Cabinet Vision: https://hexagon.com/products/cabinet-vision
- TopSolid, TopSolid'Wood: https://www.topsolid.com/en/products/topsolidwood
- imos, About imos iX: https://support.imos3d.com/fileadmin/imosOnlineHelp/iX2023/ENG/SR2/Content/general/about_ix.html
- Autodesk, CNC Cabinetmaking Software: https://www.autodesk.com/solutions/cnc-cabinetmaking-software

Not: Mevcut sistem kapsamı ve yaklaşık %80–90 yönlendirmeli çalışma oranı, kullanıcı tarafından verilen proje bilgisidir. Bu belge bağımsız bir yazılım denetimi veya saha performans ölçümü değildir.
