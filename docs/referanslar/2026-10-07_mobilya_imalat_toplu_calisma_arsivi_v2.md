# MOBİLYACILAR AĞI — Mobilya İmalat / Akıllı Reçete - Toplu Çalışma Arşivi

> Arşiv kopyası. Kaynak: `Mobilyacilar_Agi_Cursor_Referans_Paketi_2026-10-08.pdf`, sayfa 5–8. Metin PDF'ten aktarıldı; içerik ve etiketler değiştirilmedi. Yaşayan üretim standardı değildir (bkz. bölüm P).

7 Ekim 2026 - v2

Bu belge; geri erişilebilen eski sohbet kayıtları, proje/mimari belgeleri, önceki karar defteri ve bu sohbetin son kararlarının üst üste konmasıyla hazırlanmıştır. Etiketler özellikle korunmuştur: KESİN = kullanıcı onaylı; KAYIT = geçmişte konuşulmuş ama yeniden teyit gerektiren; ÖNERİ = varsayılan/başlangıç fikri; AÇIK = henüz kapanmamış konu; DEĞİŞTİRİLDİ = daha yeni kararla geçersizleşen eski kayıt.

## A. Projenin sabit çerçevesi

- KESİN - Proje adı Mobilyacılar Ağı. İlgili alt sistem Mobilya İmalat / Akıllı Reçete motorudur.
- KESİN - Mevcut ana akış Zemin -> Duvar -> Mobilya olarak korunur; kilit/onay zinciri bozulmaz.
- KESİN - İç hesap birimi daima mm'dir. mm/cm yalnız arayüz gösterim tercihidir.
- KESİN - Motor rutin kararların büyük bölümünü otomatik çözmeye çalışır; kritik tercih ve istisnalarda usta son otoritedir.
- KESİN - Üretim standartları tamamlanmadan yeni motor kodu yazdırılmaz. Kararlar önce yaşayan standart/karar belgesinde toplanır.
- KESİN - Katman sırası: Domain/Parameters -> Rules -> Calculators -> Manufacturing -> Optimization -> BOM -> Outputs -> Tests.

## B. Ana hesap / imalat sırası

- KESİN - Zemin/oda -> duvarlar -> engeller/tesisat -> cihaz/ankrajlar -> otomatik ilk tur -> usta düzeltmesi -> kasa/köşe/boşluk/dolgu -> dekoratif parçalar -> kapak/çekmece yüzleri -> hırdavat -> BOM/kesim çıktısı.
- KESİN - İmalat iç sırası ayrıca: kasa -> köşe/engeller -> dikme/raf -> kalan boşluk/dolgu -> dekoratif yan/klapa -> ayak/baza -> cephe -> kapak/çekmece yüzü -> kulp -> menteşe/ray -> delikler -> PVC -> BOM -> kesim listesi.
- KESİN - Şüpheli/onaysız veri doğrudan kesime gönderilmez; onay/mühür mantığı korunur.

## C. Gövde / bağlantı

- KESİN - 18 mm levha için standart ana gövde vidası 4x50 mm.
- KESİN - Birleşim derinliği <250 mm: 2 vida; 250-450 mm: 3 vida; 450 mm tam sınır: 3 vida; >450-700 mm: 4 vida.
- DEĞİŞTİRİLDİ - Eski 'her birleşim noktasında 3 vida' kaydı, daha sonra derinliğe göre 2/3/4 vida kuralıyla geliştirilmiştir.
- KESİN - 7x50 konfirmat ana standart kabul edilmedi.
- KESİN - Özel panel/uygulamada vida çapı veya boyu artırılabilir.
- KAYIT - Kelebek alternatif bağlantı; minifiks+kavela modüler alternatif olarak tutulabilir.

## D. Dikme / geniş açıklık

- KESİN - <=800 mm: otomatik dikme yok.
- KESİN - 801-900 mm: dikme opsiyonel.
- KESİN - >900 mm: motor otomatik dikme eklemez; 'dikme/ilave taşıyıcı önerilir' uyarısı verir.
- KESİN - Usta manuel dikey dikme, raf-altı destek veya özel destek seçebilir.

## E. Kapak ve cephe

- KESİN - Üst dolap: <=450 mm tek kapak; >450 mm çift kapak önerisi.
- KESİN - Baza: <=500 mm tek kapak; >500 mm çift kapak önerisi.
- KESİN - Boy dolabı: <=600 mm tek kapak önerisi.
- KESİN - Çift kapak varsayılan simetrik/eşit; usta sağ-sol ölçüyü ayrı girerek asimetrik yapabilir.
- KESİN - Açık dekoratif kutu kapaksız gerçek üretim parçasıdır; ön hizası kapak kalınlığı kadar öne çıkar.
- KAYIT - Baza/üst kapaklarda sağ-sol derz 3 mm, çift kapak ortası 3 mm, üst-alt toplam boşluk 4 mm konuşuldu.
- KAYIT - Boy dolabında yan derz 2 mm ve toplam dikey boşluk 7 mm konuşuldu. 7 mm zemin kalınlığı değildir; kapak/dikey boşluk kaydıdır.
- AÇIK - Kapak boşluklarının nihai formül ve dağıtım biçimi kodlamadan önce tekrar teyit edilecek.

## F. Menteşe sistemi

- KAYIT - Standart menteşe olarak frensiz tas menteşe konuşuldu.
- KAYIT - Opsiyonlar: frenli, düz, deveboynu/tam deveboynu ve 90 derece köşe menteşesi.
- KAYIT - Menteşe adedi: <=900 mm 2; 901-1350 mm 3; 1351-2000 mm 4; >2000 mm 5.
- KAYIT - 35 mm tas/delik sistemi ve ayarlanabilir delik ölçüleri çalışma içinde konuşuldu.
- AÇIK - Tas deliği kenar mesafesi, plaka deliği ve kesin delik koordinatları son teyit olmadan üretim standardına çevrilmeyecek.

## G. Normal / seyyar raf

- KESİN - Raf levhası 18 mm.
- KESİN - Varsayılan raf geri çekilmesi 30 mm, değiştirilebilir parametre. raf_derinligi = govde_derinligi - 30.
- KESİN - 32 mm sistem: delik aks aralığı 32 mm, delik çapı 5 mm, ön kenardan aks varsayılan 37 mm; parametrik.
- KESİN - Türkiye tipi çakma raf pimi ayrıca desteklenir: metal çivi/silindir gövde + plastik başlık; 32 mm sıra zorunlu değildir.
- KESİN - Yaklaşık 330-350 mm derinliğe kadar küçük/üst raflarda 3 taşıyıcı kullanılabilsin.
- KESİN - Büyük/alt raflarda 4 veya 5 taşıyıcı seçilebilsin.

## H. Ağır yük / yatak dolabı rafı

- KESİN - 500/550/600 mm gibi büyük derinliklerde takviyeli raf sistemi seçilebilir.
- KESİN - Raf önünden arkaya 10 mm boşluk; ardından 18 mm kalınlığında ön baza/takviye.
- KESİN - Ön takviye yüksekliği 40 mm standart; 50 mm opsiyonel.
- KESİN - Sağ-sol 40 mm genişliğinde taşıyıcı/takviye çıtaları kullanılabilir.
- KESİN - yan_cita_boyu = raf_derinligi - 10 - 18. Örnek 600 -> 572 mm.
- KESİN - Montaj toleransı için yan çıta 0-5 mm kısa yapılabilir; parametrik.

## I. Çekmece / ray - geri kazanılan çalışma

- KAYIT - Ray aileleri ayrı tutulacak: teleskopik/bilyalı, düz beyaz makaralı, frenli teleskopik, gizli/Tandem.
- KAYIT - 500 mm ray ana seçenek, 450 mm alternatif olarak konuşuldu.
- KAYIT - Yan ray boşluğu 12,5 mm/yan konuşuldu.
- KAYIT - Çekmece kutusunda 50 mm düşüm varsayılanı konuşuldu; usta değiştirebilir; teknik minimum ayrıca kontrol/uyarı konusu.
- KAYIT - 3 çekmeceli cephede 1:2:3; 2 çekmecede 1:1 oranı konuşuldu.
- KAYIT - 3 çekmece için 50 mm ara değer konuşuldu.
- KAYIT - Kutu yanlarının ön/arkaya göre yaklaşık 15 mm yüksek olması konuşuldu.
- KAYIT - 4 mm taban ve 8 mm kanal/geri çekilme değerleri konuşuldu.
- AÇIK - Bu çekmece değerleri tek tek yeniden teyit edilmeden KESİN üretim standardı sayılmayacak.

## J. Köşe dolabı sistemi

- KESİN - Köşe, normal modüller bittikten sonra kalan yere sıkıştırılmaz; yerleşimin erken aşamasında çözülür.
- KESİN - Sağ/sol köşe aynalanabilir.
- ÖNERİ - Kör köşe başlangıç geometrisi: yaklaşık 1000 mm; 1200 mm/özel ölçü mümkün; yaklaşık 500 mm kapak/açıklık sınıfı; yaklaşık 580-585 mm derinlik.
- KESİN - Dolgu sabit sayı değildir; çarpışma ve kullanılabilir alana göre hesaplanır.
- KESİN - Köşe dikmesi/kayıt görsel kutu değil gerçek imalat parçasıdır.
- ÖNERİ - Normal raf ekonomik varsayılan; mekanizma seçilirse üreticinin teknik ölçüleri geçerlidir.
- KESİN - Kapak+menteşe+kulp birlikte çarpışma kontrolünden geçer; komşu kapak/çekmece/kulp, cihaz ve servis alanı kontrol edilir.
- KESİN - Köşe modülü kütüphanesinde özel 'M.A. Akıllı Köşe' yanında bindirmeli, L, 45 derece ve mekanizmalı seçenekler görsel kartlarla sunulacak.

## K. Usta ayarları / parametreleşme

- KESİN - Usta ayar ekranında vida, bağlantı, renk/malzeme, arkalık ve diğer atölye standartları değiştirilebilir olacak.
- KESİN - Varsayılan değer ile zorunlu üretim kuralı birbirinden ayrılacak; usta override alanları açıkça tanımlanacak.
- KESİN - Motor öneri verebilir; usta onayı gerektiren yerde otomatik parça ekleyerek kararı gizlice vermeyecek.

## L. Henüz açık üretim alanları

- AÇIK - Sabit raf bağlantısının kesin bağlantı/vida kuralı.
- AÇIK - Çekmece ray tiplerinin kesin teknik tabloları, kutu yükseklikleri ve delik koordinatları.
- AÇIK - Arkalık kanal/bindirme seçimi ve kesin ölçü formülleri.
- AÇIK - Ayak, baza bandı ve süpürgelik gerçek parça üretim kuralları.
- AÇIK - Menteşe delik koordinatlarının son hali.
- AÇIK - Kulp ve klapa kuralları.
- AÇIK - Tezgah kuralları.
- AÇIK - PVC/bant kenar bazlı reçete ve ölçü etkisi.
- AÇIK - Malzeme/renk veri modeli.
- AÇIK - Mobilya parçalarının ebatlama/kesim listesine aktarımı.
- AÇIK - BOM/hırdavat ve maliyet çıktı şeması.

## M. 24 adımlık ana geliştirme zinciri

- ZİNCİR - 1. Mevcut durum analizi
- ZİNCİR - 2. 00_PROJE_DURUMU.md oluştur
- ZİNCİR - 3. 01_YOL_HARITASI.md oluştur
- ZİNCİR - 4. Eski/yanlış Cursor kurallarını düzelt
- ZİNCİR - 5. Mobilya İmalat / Akıllı Reçete klasör mimarisini tasarla
- ZİNCİR - 6. Klasör mimarisini kodu bozmadan oluştur
- ZİNCİR - 7. Menü/UI iskeletini çıkar
- ZİNCİR - 8. Menü/UI iskeletini oluştur
- ZİNCİR - 9. Mevcut mobilya motoru fonksiyonlarını yeni katmanlara eşleştir
- ZİNCİR - 10. Domain/Parameters
- ZİNCİR - 11. Rules
- ZİNCİR - 12. Calculators
- ZİNCİR - 13. Manufacturing
- ZİNCİR - 14. Optimization
- ZİNCİR - 15. BOM/Hırdavat
- ZİNCİR - 16. Outputs/üretim çıktıları
- ZİNCİR - 17. Mevcut motoru yeni yapıya bağlama
- ZİNCİR - 18. JS motorunu Python motoruyla eşitleme
- ZİNCİR - 19. Testleri genişletme
- ZİNCİR - 20. UI -> motor bağlantıları
- ZİNCİR - 21. Kesim/bant/hırdavat üretim paketleri
- ZİNCİR - 22. Zemin -> Duvar -> Mobilya akış entegrasyonu
- ZİNCİR - 23. Yayınlama/pack_yayin kontrolü
- ZİNCİR - 24. Son proje denetimi

## N. 7 Ekim 2026 Cursor çalışma kaydı - doğrulanabilenler

- TAMAMLANDI - 01_YOL_HARITASI.md oluşturuldu; o adımda yalnız bu dosyanın değiştiği kaydedildi.
- TAMAMLANDI - `.cursorrules` ve `.cursor/rules/kok-hudut.mdc` güncellendi.
- KESİN - Çalışan motor.py çekirdeği korunacak.
- DEĞİŞTİRİLDİ - Eski 'sıfırdan yazılmaz / refactor yapılmaz' şeklindeki katı yasaklar kaldırıldı.
- KAYIT - Bir aşamada fiziksel domain/parameters/rules/calculators/manufacturing/optimization/bom/outputs klasörlerini hemen açmama ve motor.py'yi hemen parçalamama yönünde çalışma kararı kaydedildi.
- KESİN - Her adım ayrı onayla ilerleyecek; analiz/dokümantasyon ile kod uygulaması aynı komutta karıştırılmayacak.
- KESİN - Yayınlama ayrı onay gerektirir; 00_Yayin pack_yayin.py tarafından üretilen çıktı alanıdır.
- AÇIK - Bugünkü tüm Cursor promptlarının kelimesi kelimesine tam transkripti erişilebilen kayıtlarda bulunmadığı için bu bölüm yalnız doğrulanabilen işlem/kararları içerir.

## O. Kod tabanından bilinen mevcut durum / sınırlar

- KAYIT - Dört kapı: OCR /okuyucu/, Fire /ebatlama/, Reçete /duvar/, Tel /tel/.
- KAYIT - Reçete sırası Zemin -> Duvar -> Mobilya; zemin kilidi `kilit`, duvar taşıyıcı bayrak `zemin_kilit`, duvar onayı `hazirlik_onay`.
- KAYIT - Mobilya motorunda gövde, kapak, raf, katalog/sıra, çekmece, arkalık, ayak-süpürgelik ve hırdavat fonksiyonları mevcut; bazıları yarım/bağlantısız.
- KAYIT - Mevcut eksikler arasında çekmece koordinat/ray kuralı, hırdavat delikleri, ayak/süpürgelik parçaları, bindirme arkalık seçimi, dikmenin iskelete katılması, çift kapak yerleşimi, köşe oturması, dolgu konstrüksiyonu, kulp/klapa/tezgah/baza bandı, malzeme/renk ve ebatlama aktarımı bulunuyor.
- KAYIT - Yayınlamada mobilya_motor.js ve varsayilan_config.json kopyalanıyor; katalog_arsiv.json yayın kopyasında eksik olarak kaydedilmiş.
- KAYIT - OCR -> Ebatlama doğrudan kapısı mevcut değil; ebatlama fire_veri üzerinden elle liste alıyor.

## P. Bu belgenin kullanım kuralı

- KESİN - Bu PDF arşiv/kontrol kopyasıdır. Projedeki yaşayan kaynak dosya `docs/MOBILYA_URETIM_STANDARTLARI.md` veya eşdeğer karar defteri olmalıdır.
- KESİN - KESİN maddeler kullanıcı onayı olmadan değiştirilmez.
- KESİN - KAYIT ve ÖNERİ maddeleri kodlanmadan önce teyit edilir.
- KESİN - Yeni konuşmalarda verilen kararlar aynı belgeye tarih/sürüm ile eklenir; eski karar değişmişse silmek yerine DEĞİŞTİRİLDİ olarak işaretlenir.
- KESİN - Cursor'a bu belge verildiğinde, ayrıca açık uygulama komutu verilmedikçe mevcut motor kodunu değiştirmemelidir.
