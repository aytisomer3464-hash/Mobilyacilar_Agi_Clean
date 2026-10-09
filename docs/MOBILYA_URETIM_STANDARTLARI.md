# MOBİLYACILAR AĞI — MOBİLYA ÜRETİM STANDARTLARI

**Tarih:** 08.10.2026  
**Sürüm:** 0.5 — 0.2 (GÖREV 021 birleşimi) + S-01/S-02 (GÖREV 022) + vida sınıflandırması (GÖREV 023) + konfirmat satırı kaldırıldı (GÖREV 024) + toplam gövde vidası (GÖREV 025)  
**Durum:** Yaşayan standart belgesinin çalışma nüshası. **ONAY BEKLİYOR** konuları kapatılmadan bu belge yeni üretim formülü veya otomatik karar için yetki oluşturmaz.  
**Kapsam:** Mobilya İmalat / Akıllı Reçete Motoru. İç ölçü birimi **mm**.

## 0. Kaynaklar, doğrulama sınırı ve etiketler

**Birincil arşivler**

- **[A]** `docs/referanslar/2026-10-07_mobilya_imalat_toplu_calisma_arsivi_v2.md` — *Mobilyacılar Ağı, Mobilya İmalat / Akıllı Reçete Toplu Çalışma Arşivi*, 07.10.2026, v2; özgün PDF: `Mobilyacilar_Agi_Tam_Calisma_Arsivi_2026-10-07_v2.pdf`. A–P bölümlerinin etiketleri aynen esas alınır.
- **[M]** `docs/referanslar/2026-10-08_akilli_recete_sistem_mimarisi_v2.md` — *Akıllı Reçete Sistem Mimarisi v2*, 08.10.2026; özgün DOCX: `Mobilyacilar_Agi_Akilli_Recete_Sistem_Mimarisi_v2.docx`. Bir mimari/hedef tasarım belgesidir; öneriler mevcut çalışan kod kanıtı sayılmaz.
- **[K]** Yerel repo kodu: `02_Canta/elle_olcu/mobilya/motor.py`, `mobilya_motor.js`, `varsayilan_config.json` (CFG), `katalog_arsiv.json` (KAT). İlk olarak GÖREV 019 raporundan alındı; **GÖREV 021'de (08.10.2026) yerel çalışma ağacında doğrudan doğrulandı**. Satır/fonksiyon kanıtı ilgili hücrede verilir.
- **[U]** Kullanıcının 08.10.2026 onayladığı GÖREV 013–017 kararları (017 seçenek A; kullanıcı kaydında 018 olarak da anılır) ve Cursor'un rapor ettiği uygulamalar. GÖREV 014–015 GitHub'a `bb8d4cb` ile aktarılmış; GÖREV 016/017-A değişiklikleri **henüz commit edilmemiştir** (GÖREV 021 `git status`: `motor.py`, `mobilya_motor.js`, iki test dosyası ve rehber `M`). 08.10.2026'da rapor edilen en son Mobilya testi: **121 geçti, 0 hata**; bu nüshada yeniden çalıştırılmadı.
- **[Y]** `02_KARAR_DEFTERI.md` ve `03_ANA_YONETIM_NIHAI_2026-10-08.md`: ana yönetim onay/sınır ilkeleri. **GÖREV 021 notu:** bu iki dosya Clean repoda bulunamadı; içerikleri bu nüshada doğrulanmadı.

**Etiketler:** **KESİN** = arşivde kullanıcı onaylı olarak kayıtlı; **KAYIT** = tekrar teyit gerektiren eski görüşme; **ÖNERİ** = uygulamaya otomatik dönüşmeyen tercih/hedef; **AÇIK** = kapanmamış üretim konusu; **DEĞİŞTİRİLDİ** = eski hükmün yeni kararla yer değiştirmesi; **KOD DEĞERİ** = yalnız kodda/ayarda bulunan, karar kaydı olmayan değer (teyit gerekir; Ek A); **ONAY BEKLİYOR** = kodla uyumsuzluk, yeni uygulama tercihi veya teknik karar için kullanıcı onayı gerekli. Bu etiketler birbirinin yerine kullanılmaz.

**Kaynak üstünlüğü:** Onaylı üretim standardı otomatik olarak koddaki mevcut değere indirgenmez; koddaki eski değer de yeni standardın yerine geçmez. Çelişki kayda alınır ve ilgili imalat kuralının uygulaması onaylanana kadar mevcut çalışan kod izinsiz değiştirilmez. Kodun çalışıyor olması üretim güvenliği teyidi değildir.

## 1. Sabit çerçeve, onay ve hesap sırası

| Statü | Kural | Kaynak / tarih | Kod / fark |
|---|---|---|---|
| KESİN | Ana akış **Zemin → Duvar → Mobilya**; engeller ve kilit/onay aşamaları korunur. | [A] A–B, 07.10; [M] §2, 08.10 | Temel akış korunuyor. |
| KESİN | İç birim **mm**; mm/cm dönüşümü yalnız arayüz gösterimidir. | [A] A, 07.10 | Motor ayarları mm (CFG). Arayüz hesap sınırı ayrıca doğrulanmalı. |
| KESİN | Usta, kritik seçim ve istisnalarda son karar sahibidir. Şüpheli/onaysız bilgi doğrudan kesime gitmez. | [A] A–B, K, 07.10 | Usta ayarı/onayının modül bazında kapsanması tamamlanmadı. Motorda kesim çıktısı yok. |
| KESİN | Geliştirme katmanları **Domain/Parameters → Rules → Calculators → Manufacturing → Optimization → BOM → Outputs → Tests**. Çalışan çekirdek korunur. | [A] A, N, 07.10 | Katmanlar tek dosyada (`motor.py`); fiziksel klasör yok. Toplu yeniden yazım yok. |
| KESİN | **“Üretim standartları tamamlanmadan yeni motor kodu yazdırılmaz.”** Kararlar önce yaşayan standart/karar belgesinde toplanır. (arşiv metni aynen) | [A] A, P, 07.10 | GÖREV 014–017'nin kod işleri bu belgeden önce yürütüldü; bu belge geçmiş işin geçerlilik kanıtı değildir. **ONAY BEKLİYOR: S-13.** |
| DEĞİŞTİRİLDİ | Eski “sıfırdan yazılmaz / refactor yapılmaz” katı yasakları kaldırıldı. | [A] N, 07.10 | — |
| KAYIT | `motor.py` hemen parçalanmaz; katman klasörleri hemen açılmaz. | [A] N, 07.10 | Uyumlu. |
| KESİN | Her adım ayrı onay; analiz/belge ile kod aynı komutta karışmaz. Yayınlama ayrı onay; `00_Yayin` pack çıktısıdır. | [A] N, 07.10 | — |

**Hesap/imalat bağımlılığı [A] B (KESİN):** zemin/oda → duvarlar → engel/tesisat → cihaz/ankraj → otomatik ilk tur → usta düzeltmesi → kasa/köşe/boşluk/dolgu → dekoratif parçalar → kapak/çekmece yüzleri → hırdavat → BOM/kesim. İç üretim sırası: kasa → köşe/engeller → dikme/raf → boşluk/dolgu → dekoratif yan/klapa → ayak/baza → cephe → kapak/çekmece yüzü → kulp → menteşe/ray → delikler → PVC → BOM → kesim listesi. Bunlar **hedef üretim bağımlılığıdır**; bütün aşamaların bugünkü kodda tamamlandığı anlamına gelmez.

**Bugünkü kod [K]:** `sira_kur` yalnız kasa + raf + kapak + sağ dolgu kutusu üretir. Köşe, engel, dikme, dekoratif, ayak parçası ve hırdavat turda yok.

| Statü | Kural | Kaynak / tarih |
|---|---|---|
| KESİN — 08.10 kararı | Çift kapak, çekmeceden **önce** geliştirilir; klapa ve çekmece önü bu kararın dışındadır. | [U] GÖREV 013 |
| DEĞİŞTİRİLDİ | Çift kapağın çekmece aşamasından sonra gelmesi (`8dc2a85:01_YOL_HARITASI.md` 142, 152). | [U] GÖREV 013 ile |

## 2. Gövde ve bağlantı / vida

| Statü | Standart ve sınırlar | Kaynak / tarih | Kod ve çelişki |
|---|---|---|---|
| KESİN | Standart levha **18 mm**; bu levhada ana gövde vidası **4×50 mm**. Özel/kalın levhada çap veya boy artırılabilir. | [A] C, 07.10; uygulama onayı GÖREV 022, 08.10 | **UYGULANDI (S-01, commitsiz).** `govde_vida_cap` 4, `govde_vida_boy` 50 (CFG); `hirdavat_hesapla` / `hirdavatHesapla` listesine `govde_vidasi` kaydı eklendi. Ayar değiştirilerek çap/boy artırılabilir. |
| KESİN | Birleşim derinliği **250 mm'den küçük: 2 vida**; **250–450 mm: 3 vida** (450 dahil); **450'den büyük–700 mm: 4 vida** (700 dahil, GÖREV 022). | [A] C, 07.10; GÖREV 022, 08.10 | **UYGULANDI (S-02, commitsiz).** `govde_vida_esik_1..3` 250/450/700, `govde_vida_adet_1..3` 2/3/4 (CFG). Birleşim derinliği = alt/üst panel derinliği = dış derinlik. Örnek: 249 → 2, 250 → 3, 450 → 3, 451 → 4, 580 → 4, 700 → 4. Eşikler artan değilse hata. Toplam: bkz. aşağıdaki GÖREV 025 satırı. |
| KESİN — 08.10 kararı | Toplam gövde imalat vidası, mevcut gövde parçalarının gerçek bağlantı noktalarından hesaplanır; birleşim başı adet 2/3/4 kuralından gelir. Doğrulanmış kuralı olmayan bağlantı sayılmaz. | [U] GÖREV 025, 08.10 | **UYGULANDI (commitsiz).** Gövdede alt ve üst iki yan arasına oturur (`govde_hesapla`: genişlik = iç genişlik, derinlik = dış derinlik) → 4 birleşim (yan–alt ×2, yan–üst ×2). `govde_vidasi` satırı: `birlesim_sayisi` 4, `toplam_adet` = 4 × birleşim başı. 580 → 4 × 4 = **16**; 320 → 4 × 3 = 12; 249 → 4 × 2 = 8. Genişlik, yükseklik ve kapak adedi toplamı değiştirmez. |
| AÇIK | Dikme, sabit raf, arkalık ve askı/duvar montaj bağlantılarının vida adedi. | [A] L; GÖREV 025 | Doğrulanmış kural yok; toplam vidaya **dahil değil**. **ONAY BEKLİYOR: S-02b.** |
| AÇIK | **700 mm üstü** birleşim derinliği için vida adedi. | [A] C, 07.10; GÖREV 022 | Onaylı kural yok; kod değer uydurmaz, `hirdavat_hesapla` hata döner: “Birleşim derinliği 700 mm üstünde: gövde vidası adedi için onaylı kural yok.” **ONAY BEKLİYOR: S-02a.** |
| DEĞİŞTİRİLDİ | Eski **“her birleşime 3 vida”** hükmü, yukarıdaki 2/3/4 derinlik kuralıyla değiştirilmiş. | [A] C, 07.10 | Eski değer yeniden ana standart yapılmaz. |
| KESİN | **7×50 konfirmat** ana gövde bağlantı standardı sayılmaz. | [A] C, 07.10 | **UYGULANDI (S-01a, GÖREV 024, commitsiz).** Eski `konfirmat 7×50, birleşim başı 2` satırı `hirdavat_hesapla` / `hirdavatHesapla` listesinden çıkarıldı. Liste: menteşe, kavela, minifiks, `govde_vidasi`. `konfirmat_cap/boy/birlesim` ayarları eski ayar dosyaları bozulmasın diye pasif duruyor; hesaba girmez. |
| KESİN — 08.10 kararı | Vida türleri kullanım amacına göre ayrılır: **4×50 gövde imalat vidası**, **7×50 askı sistemi duvar montaj vidası**. İkisi de ayarlanabilir parametredir. | [U] GÖREV 023, 08.10 | **UYGULANDI (commitsiz).** `hirdavat_hesapla` sonucu `vida_turleri`: `govde_imalat` (`govde_vida_cap/boy` 4/50), `aski_duvar_montaj` (`duvar_montaj_vida_cap/boy` 7/50). `govde_vidasi` satırında `kullanim: "govde_imalat"`. |
| AÇIK | Askı/duvar montaj vidasının adedi, dübel tipi ve bağlantı kuralı; hangi dolap tiplerinde kullanılacağı. | GÖREV 023 | Kural yok; motor montaj vidası için liste satırı ve adet üretmez. **ONAY BEKLİYOR: S-15.** |
| KAYIT | Kelebek bağlantı alternatif; minifiks+kavela modüler alternatif olabilir. | [A] C, 07.10 | Kodda alternatif değil sabit liste: `kavela` 8×30 birleşim 2, `minifiks_birlesim` 2 (CFG). Kelebek yok. |
| AÇIK | Sabit raf bağlantı tipi ve bağlama/vida hesabı. | [A] L, 07.10 | Kod kararı verilmedi. |

**Sınır notu:** Arşiv `>700 mm` için vida adedi belirtmiyor; bu belge bu aralıkta sayı üretmez.

## 3. Dikme ve geniş açıklık

| Statü | Kural | Kaynak / tarih | Kod / eksik |
|---|---|---|---|
| KESİN | Genişlik **≤800 mm**: otomatik dikme yok. | [A] D, 07.10 | `sira_kur` dikme koymaz; uyumlu. |
| KESİN | **801–900 mm**: dikme opsiyonel. | [A] D, 07.10 | `govde_hesapla(..., dikme_adedi)` kesim listesi verebilir; tur çağırmaz, seçim arayüzü yok. |
| KESİN | **>900 mm**: otomatik dikme ekleme; **“dikme/ilave taşıyıcı önerilir”** uyarısı ver. | [A] D, 07.10 | Uyarı yok. Katalogda en geniş düz kasa 900; köşe 1000/1200 sıraya girmez. **ONAY BEKLİYOR: S-09.** |
| KESİN | Usta manuel dikey dikme, raf-altı veya özel destek seçebilir. | [A] D, 07.10 | Kullanıcı seçimiyle gerçek imalat parçası üretimi eksik. |

## 4. Kapak, ön yüz ve `kapak_adedi`

### 4.0 Ölçü formülü (kodda mevcut)

| Statü | Kural | Kaynak / tarih | Kod |
|---|---|---|---|
| KAYIT | Kapak dış değil iç ölçüden hesaplanır. 600×720 → 596×716. | `motor.py` 9 (“karar: 2026-10-04”) | `kapak_hesapla` |
| KAYIT | Tam bindirme 18 mm: Blum CLIP top BLUMOTION 110° (71B3550), 0 mm plaka, delik payı 7. | `motor.py` 20 | `kapak_binis` 18 (CFG) |
| KOD DEĞERİ | Yükseklik = iç yükseklik + 2·bindirme − 2·derz. Tek kapak eni = iç en + 2·bindirme − 2·derz. Çift kanat eni = (iç en + 2·bindirme − 3·derz) / 2. | [K] `kapak_hesapla` | — |
| KOD DEĞERİ | Kapak kalınlığı = `levha` 18. | [K] `kapak_yerlestir` | Karar kaydı yok. |
| KESİN — 08.10 kararı | Kapak formülü korunur; çift kapak yeni ölçü formülü yazmadan `kapak_hesapla(..., 2)` ile yerleşir. | [U] GÖREV 013; `8dc2a85:01_YOL_HARITASI.md` 152, 157 | `kapak_yerlestir(..., kapak_adedi)` (`bb8d4cb`) |

### 4.1 Arşivdeki **öneri eşikleri** — otomatik zorunluluk değildir

| Statü | Eşik / öneri | Kaynak / tarih | Bugünkü kullanım |
|---|---|---|---|
| KESİN (öneri kuralı) | **Duvar/üst:** genişlik ≤450 mm tek kapak; >450 mm **çift kapak önerisi**. | [A] E, 07.10 | **ÖNERİ** olarak gösterilir; otomatik `kapak_adedi: 2` atama yok [U]. Kodda eşik yok. |
| KESİN (öneri kuralı) | **Baza/alt:** genişlik ≤500 mm tek kapak; >500 mm **çift kapak önerisi**. | [A] E, 07.10 | **ÖNERİ** olarak gösterilir; fırın/evye/çekmece modüllerini kapak sanma [U]. Kodda eşik yok. |
| KESİN (öneri kuralı) | **Boy:** ≤600 mm tek kapak önerisi. | [A] E, 07.10 | 600 mm boy dolabına doğrudan çift kapak atanmaz [U]. >600 için kural yok (AÇIK). |
| KESİN | Çift kapak varsayılan eşit/simetrik; usta sağ–sol için ayrı ölçü verebilir. | [A] E, 07.10 | Simetrik çift kanat çalışıyor; asimetrik ayar ve test yok. **ONAY BEKLİYOR: S-08.** |
| KESİN | Açık dekoratif kutu gerçek kapaksız üretim parçası; ön hizası kapak kalınlığı kadar öne çıkar. | [A] E, 07.10 | Açık dekoratif modül yok; `kapak_adedi` 0 kabul etmez. **S-11.** |

### 4.2 Bugün onaylanmış `kapak_adedi` sözleşmesi

| Statü | Kural | Kaynak / tarih | Uygulama durumu |
|---|---|---|---|
| KESİN — 08.10 kararı | Katalogda isteğe bağlı `kapak_adedi`: alan yoksa **1**, geçerli adet **1/2**; geçersiz veya çelişen aynı tip/genişlik kayıtları hata. | [U] GÖREV 013, 016 | Python `_kapak_adetleri`, JS `kapakAdetleri` → `sira_kur`/`siraKur`; **yerel, commit edilmemiş**. |
| KESİN — 08.10 kararı | Sayısal **1.0 → 1**, **2.0 → 2**; 1.5/2.5 ve 0, 3, bool, string, null, NaN reddedilir. | [U] GÖREV 017-A | Python `json.loads` / JS `JSON.parse` farkı nedeniyle karar verilerek uygulandı; test raporu 121/0, commit edilmedi. |
| KESİN — 08.10 kararı | **Katalog etiketlerinden tek başına otomatik kapak atama yok**; gerçek modül tipi ve usta seçimi ayrıca ele alınacak. | [U] GÖREV 011–019, yönetim kararı | `katalog_arsiv.json` içinde `kapak_adedi` alanı yok; her kasa tek kapak. |
| KAYIT — rapor | Örnek 600 mm çift kasa: 297 mm kanat, `x=2,301`; 900 mm çift kasa: 447 mm kanat, `x=2,451`, mevcut `kapak_hesapla(..., 2)` kullanılıyor. | [U] GÖREV 014, `bb8d4cb` | Formülle hesap doğrulandı: (564+36−6)/2 = 297; (864+36−6)/2 = 447. Yeni tek/çift formül icat edilmez. |

**Katalog durumu [K] (KAT `sablon`, “Ömer, 2026-10-06”):** baza **150** (“Dar şişelik / havluluk”), **300** (“Tek kapaklı dar”), **400/450** (“Tek kapaklı standart”), **600** (“Çift kapak veya fırın”), **800/900** (“Geniş çift kapak, evye veya tencere çekmecesi”); köşe **1000/1200** (`duz_kasa: false`, sıraya girmez). Duvar **300/450/600/800/900** (ad yok). Boy **600** (“Kiler, fırın-mikrodalga kolon”). `acik_ek` genişlikleri sıraya girmez. Katalogda `kapak_adedi` olmadığından varsayılan tek kapak.

Eşiklerin katalog genişliklerine uygulanışı (yalnız bilgi; katalogda değer yok, otomatik atama yapılmaz):

| Tip | Tek kapak önerisi | Çift kapak önerisi |
|---|---|---|
| Baza | 150, 300, 400, 450 | 600, 800, 900 |
| Duvar | 300, 450 | 600, 800, 900 |
| Boy | 600 | — |

**ONAY BEKLİYOR (S-07):** modülün **kapaklı / fırın / evye / çekmeceli / açık** seçimi ve ustanın kapak adedini nerede onaylayacağı; eşiğin ayarda mı katalogda mı tutulacağı. Kodun bugünkü `kapak_adedi` sistemi kasaya bağlı sabit katalog değeridir, usta onay adımı yoktur. Hiçbir genişliğe kendiliğinden `2` atanmayacak.

### 4.3 Kapak derzleri ve menteşeye etkisi

Kodda tek değer: `derz` 2 (CFG), tipe göre ayrım yok. Bindirme levhaya eşit olduğundan sonuç: yanlarda 2, çift kapak ortasında 2, üstte 2, altta 2 (toplam 4).

| Statü | Geçmiş görüşme | Kaynak / tarih | Kod sonucu / açık karar |
|---|---|---|---|
| KAYIT | Baza/üst kapak: sağ–sol **3 mm**, çift orta **3 mm**, üst–alt toplam **4 mm**. | [A] E, 07.10 | Yan 2, orta 2 → farklı; üst–alt toplam 4 → uyumlu. **ONAY BEKLİYOR: S-05.** |
| KAYIT | Boy kapak: yan **2 mm**, düşey toplam **7 mm**; **7 mm zemin kalınlığı değildir**. | [A] E, 07.10 | Yan 2 → uyumlu; düşey toplam 4 → farklı. **ONAY BEKLİYOR: S-05.** |
| AÇIK | Derzlerin nihai formülü, bindirme ve yatay/düşey boşluk paylaşımı. | [A] E, 07.10 | Kesin formül olarak sunulamaz; var olan hesaplar korunur. |
| AÇIK | Tek kanat en üst genişlik sınırı ve büyük kanat menteşe/yük güvenliği. | 08.10 GÖREV 019 risk tespiti | Arşiv kesin sınır vermiyor; kullanıcı/atölye doğrulaması gerekir. |

## 5. Menteşe ve delik sistemi

| Statü | Arşiv kaydı | Kaynak / tarih | Kod / açık karar |
|---|---|---|---|
| KAYIT | Başlangıç menteşesi **frensiz tas menteşe**. Frenli, düz, deveboynu/tam deveboynu, 90° köşe alternatifleri konuşulmuş. | [A] F, 07.10 | Kod notu frenli **Blum CLIP top BLUMOTION** (`motor.py` 20; bindirme 18 bu menteşeye göre). Alternatif tip yok. **ONAY BEKLİYOR: S-06.** |
| KAYIT | Kanat yüksekliği **≤900: 2**, **901–1350: 3**, **1351–2000: 4**, **>2000: 5** menteşe. | [A] F, 07.10 | Kod eşiği **900/1600/2200** (CFG `mentese_esik_1..3`, `mentese_adet_1..4` = 2/3/4/5). **ONAY BEKLİYOR: S-06.** |
| KOD DEĞERİ | Menteşe adedi = kapak başı × kapak adedi. | [K] `hirdavat_hesapla` | Turda (`sira_kur`) çağrılmaz. |
| KAYIT | **35 mm tas/delik** sistemi ve ayarlanabilir delik ölçüleri konuşuldu. | [A] F, 07.10 | Kodda tas deliği yok. |
| AÇIK | Tas deliği kenar uzaklığı, menteşe plaka delikleri, eksiksiz delik koordinatları. | [A] F, L, 07.10 | Teknik onay olmadan kesim/CNC/delme emri yok. |
| AÇIK | Kapak ağırlığı, genişliği, malzemesi ve menteşe seçimi ilişkisi. | 08.10 GÖREV 019 risk tespiti | Kod menteşe adedinde ağırlık kullanmaz (`motor.py` 22); `panel_yogunluk` 650 (CFG) yalnız ağırlık bilgisi. Yeni sınır üretilmedi. |

## 6. Normal / seyyar raf ve raf pimleri

| Statü | Standart | Kaynak / tarih | Kod / çelişki |
|---|---|---|---|
| KESİN | Raf levhası **18 mm**. | [A] G, 07.10 | Raf kalınlığı `levha` 18; uyumlu. Ayrı raf kalınlığı ayarı yok. |
| KESİN | Varsayılan geri çekme **30 mm**, kullanıcı değiştirebilir. `raf_derinligi = govde_derinligi - 30`. | [A] G, 07.10 | `raf_geri` 20 (CFG) **iç derinlikten** düşer; iç derinlik = dış − `arkalik_kanal` 10. Sonuç bugün dış − 30 (580 → **550**), yani sayı aynı. Yerleşimde raf önden 20 geride, arkada kanal 10 (`raf_yerlestir`: `y = raf_geri`). **ONAY BEKLİYOR: S-03** (tanım/parametre farkı). |
| KESİN | 32 mm sistem: delik aksı **32 mm**, delik çapı **5 mm**, ön kenardan aks varsayılan **37 mm**; parametrik. | [A] G, 07.10 | `raf_aks` 32 uyumlu. Delik çapı ayarı yok. `raf_aks_baslangic` 37 (CFG) kodda **iç tabandan dikey ilk delik yüksekliği** olarak kullanılır (`_raf_akslari`); ön kenar mesafesi ayarı yok. **ONAY BEKLİYOR: S-14.** |
| KESİN | Türkiye tipi çakmalı raf pimi: metal çivi/silindir gövde + plastik başlık; bu tipte 32 mm aks sırası zorunlu değil. | [A] G, 07.10 | Özel pim ailesi desteği yok. |
| KESİN | Yaklaşık **330–350 mm derinliğe kadar** küçük/üst rafta **3 taşıyıcı seçilebilsin**. Büyük/alt rafta **4 veya 5** seçilebilsin. | [A] G, 07.10 | `raf_pimi_adet` 4 sabit (CFG); raf pimi = 4 × raf adedi. **ONAY BEKLİYOR: S-04.** |
| KOD DEĞERİ | Raf eni = iç en − `raf_tolerans` 1. Raf adedi verilmezse ⌊iç yükseklik / `raf_aralik` 350⌋. Raf yeri: eşit aralığa en yakın delik. | [K] `raf_hesapla`, `_raf_yerleri` | Karar kaydı yok. |

> Derinlik aralığı, pim adedi önerisinden ayrı olarak rafın yük sınıfını ispatlamaz; yük/taşıma hesabı arşivde tam tanımlı değildir.

## 7. Ağır yük / yatak dolabı rafı

| Statü | Standart | Kaynak / tarih | Kod / eksik |
|---|---|---|---|
| KESİN | **500/550/600 mm** gibi büyük derinlikte takviyeli raf seçeneği. | [A] H, 07.10 | Kodda yok. |
| KESİN | Raf önünden arkaya **10 mm** boşluk, sonra **18 mm** kalınlığında ön takviye. | [A] H, 07.10 | Kodda yok. |
| KESİN | Ön takviye yüksekliği **40 mm** varsayılan, **50 mm** opsiyonel. | [A] H, 07.10 | Kodda yok. |
| KESİN | Sağ/sol **40 mm** taşıyıcı/takviye çıtası; `yan_cita_boyu = raf_derinligi - 10 - 18` (600 → 572 mm). | [A] H, 07.10 | Kodda yok; imalat parçası/hesap testleri yok. |
| KESİN | Yan çıta montaj toleransı **0–5 mm** kısaltılabilir, parametrik. | [A] H, 07.10 | Üretime aktarmak için ayrıca kod/test gerekir. |

## 8. Çekmece ve ray

Bu bölümdeki teknik sayılar **KAYIT** statüsündedir; kesin üretim toleransı olarak **uygulanamaz**.

| Statü | Kaydedilmiş görüşme | Kaynak / tarih | Kod / karar durumu |
|---|---|---|---|
| KAYIT | Ray aileleri: teleskopik/bilyalı, beyaz makaralı, frenli teleskopik, gizli/Tandem. | [A] I, 07.10 | Kod `RAY_TIPLERI`: tandem, gizli (= tandem), bilyalı. Makaralı ve frenli teleskopik yok. Ray ürününe özgü tablo **ONAY BEKLİYOR**. |
| KAYIT | **500 mm** ana ray, **450 mm** alternatif. | [A] I, 07.10 | Ray boyunu çağıran verir. Seçim/uygunluk kuralı **ONAY BEKLİYOR**. |
| KAYIT | Ray yan boşluğu **12,5 mm / yan**. | [A] I, 07.10 | `ray_bosluk` 12.5 (CFG), bilyalıda kullanılır; uyumlu. Tandemde `tandem_pay` 42 (KOD DEĞERİ). Teknik üretici teyidi **ONAY BEKLİYOR**. |
| KAYIT | Çekmece kutusunda **50 mm düşüm**, usta değiştirebilir; teknik minimum ayrıca kontrol edilmeli. | [A] I, 07.10 | Kodda yok. Nihai sınır yok. |
| KAYIT | 3 çekmeceli ön yüzde **1:2:3**, 2 çekmeceli ön yüzde **1:1** oran. | [A] I, 07.10 | Kodda yok. Katalog/cephe seçimi açık. |
| KAYIT | Üç çekmecede **50 mm ara değer**. | [A] I, 07.10 | Anlamı, tolerans ve dağılımı teyit edilmeli. |
| KAYIT | Çekmece yanları, ön/arkadan yaklaşık **15 mm** yüksek. | [A] I, 07.10 | Kod kutu yüksekliği hesaplamaz. |
| KAYIT | **4 mm** taban; **8 mm** kanal/geri çekilme. | [A] I, 07.10 | Kod tabanı genişlik ve boydan `cekmece_taban_payi` 2 düşerek verir (CFG); taban kalınlığı yok. Teyit gerekir. |
| KOD DEĞERİ | Çekmece önü derzi. | [K] `motor.py` 16 | Çekmece önü `derz` kullanır; `cekmece_derzi` 2 (CFG) bağlı değil. |
| AÇIK | Ray delikleri, çekmece XYZ, kutu net ölçüleri, iç/dış ön yüz, üretici farkları. | [A] I, L, 07.10 | Çekmece motoruna aktarım kullanıcı onayıyla yapılacak. |

## 9. Köşe dolabı, dolgu, çarpışma

| Statü | Kural | Kaynak / tarih | Kod / eksik |
|---|---|---|---|
| KESİN | Köşe dolabı normal modüller bitip boşluk kalınca sıkıştırılmaz; **erken aşamada** çözülür. | [A] J, 07.10 | `kose_enler` listeler; `sira_kur` köşeyi yerleştirmez. **ONAY BEKLİYOR: S-10.** |
| KESİN | Sağ/sol köşe **aynalanabilir**. | [A] J, 07.10 | Parça dönüşüm/yerleşim kuralları yok. |
| ÖNERİ | Kör köşe başlangıcı yaklaşık **1000 mm**, alternatif **1200 mm**; yaklaşık **500 mm** açıklık, **580–585 mm** derinlik. | [A] J, 07.10 | Katalog köşe 1000/1200, `modul_derinlik` 580; liste uyumlu, yerleşim yok. Hazır kesin üretim ölçüsü değildir. |
| KESİN | Dolgu sabit pay değildir; kullanılabilir alan ve çarpışmayla hesaplanır. | [A] J, 07.10 | Kalan pay sağda tek dolgu kutusu (`sira_kur`, `_en_sec`). **ONAY BEKLİYOR: S-10.** |
| KESİN | Köşe dikmesi/kayıt gerçek imalat parçasıdır, yalnız sahne kutusu olamaz. | [A] J, 07.10 | Gerçek parça/BOM bağlantısı yok. |
| ÖNERİ | Normal raf ekonomik varsayılan; mekanizma seçilirse üretici teknik ölçüsü geçerli. | [A] J, 07.10 | Mekanizma kataloğu teyit edilmeli. |
| KESİN | Kapak + menteşe + kulp beraber; komşu kapak/çekmece/kulp, cihaz ve servis alanıyla **çarpışma kontrolü**. | [A] J, 07.10 | Kapsamlı çarpışma kontrolü yok; **ONAY BEKLİYOR** uygulama aşaması (S-10). |
| KESİN | Köşe kartlarında **M.A. Akıllı Köşe**, bindirmeli, L, 45° ve mekanizmalı varyantlar bulunacak. | [A] J, 07.10 | Menü/UI ve geometriler ayrı teslim. |

## 10. Usta ayarları, geçersizlik ve izlenebilirlik

| Statü | Kural | Kaynak / tarih | Kod / uygulama |
|---|---|---|---|
| KESİN | Usta; vida, bağlantı, renk/malzeme, arkalık ve atölye standartlarını değiştirebileceği ayara sahip olmalı. | [A] K, 07.10 | Ayar ekranı yok; tüm değerler `varsayilan_config.json` (54 ayar). Parametre şeması hazırlanmalı. |
| KESİN | **Varsayılan** ile **zorunlu üretim koşulu** ayrılır; override sınırları açıkça tanımlanır. | [A] K, 07.10 | Ayrım kodda yok. Yeni veri sözleşmesi/kritik kurallar için onay gereklidir. |
| KESİN | Motor öneri verebilir ama usta onayını gerektiren kararı gizlice otomatik parça üretimine çeviremez. | [A] K, 07.10 | `kapak_adedi` önerisi otomatik ikiye çevrilmez [U]. |
| ÖNERİ — mimari | Onaylı mekân modeli, ölçülü engel/ankraj, sert/koşullu/yumuşak engel sınıfları ve kural öncelikleri. | [M] §§3–5, 08.10 | Hedef mimari; mevcut motorun tamamlanmış özelliği diye etiketlenmez. |
| ÖNERİ — mimari | İlk tur açıklanabilir taslaktır; çakışma/üretilebilirlik kontrolü, ölçü teyidi, gerekçeli override, revizyon/onay izi. | [M] §§6–8, 08.10 | Yeni kapsam/veri sözleşmesi için ayrıca onay ve test. |
| ÖNERİ — mimari | Çıktı sırası: kasa/boşluk → dekoratif → cephe/kapak → hırdavat → PVC → BOM/kesim → nesting/CNC. | [M] §9, 08.10 | CNC makineye özgü doğrulama olmadan otomatik iş emrine dönüşmez. |

## 11. Henüz açık diğer üretim alanları

Aşağıdakiler [A] L (07.10) uyarınca **AÇIK**; arşivden kesin sayı/formül türetilmez:

1. Sabit raf bağlantısı ve vida hesabı.
2. Çekmece raylarının teknik tabloları, kutu yükseklikleri ve delik koordinatları.
3. Arkalık kanal/bindirme seçimi ve net ölçü formülleri. (Kod: kanallı dış − 2·kanal, bindirme dış; `arkalik` 8, `arkalik_kanal` 10; gövde kutusu kanallı; `arkalik_derinlik` 10 formülde yok — KOD DEĞERİ.)
4. Ayak, baza bandı ve süpürgelik gerçek parça üretimi. (Kod: ayak 100, süpürgelik 100, geri 50; parça yok, ayak yalnız sahnede yükseklik kaydırır — KOD DEĞERİ.)
5. Menteşe tas/plaka deliklerinin kesin koordinatları.
6. Kulp, klapa ve tezgâh kuralları.
7. PVC/bant için kenar bazlı reçete ve ölçü etkisi.
8. Malzeme/renk veri modeli.
9. Mobilya parçasının Ebatlama'ya aktarım veri sözleşmesi.
10. BOM/hırdavat, maliyet ve kesim çıktı şemaları.

**Kayıt sınırı:** [A] M'deki 24 adımlık geliştirme zinciri bir yol haritasıdır, bu bölümün yerine teknik standart sayılmaz. [A] O'daki eski “çift kapak yerleşimi eksik” kaydı, 08.10.2026 GÖREV 014 ile **DEĞİŞTİRİLDİ** (yerleşim kısmı); katalog, kullanıcı seçimi ve ön yüz bağlantıları hâlâ açık.

## 12. ONAY BEKLİYOR — çelişki ve karar takip listesi

Bu tablo **kod değişikliği emri değildir**. Her madde için yeni karar numarası/tarihi ve test kabul koşulu ayrıca kaydedilir. (Sürüm 1'deki OB-1…OB-8 eşleşmesi son sütunda.)

| ID | Öncelik | Konu | Arşivdeki kural | Kodda doğrulanan / eksik | Gereken karar | Sürüm 1 |
|---|---|---|---|---|---|---|
| S-01 | — | Ana gövde vidası | **4×50**, 18 mm [A-C KESİN] | **UYGULANDI** GÖREV 022 (commitsiz): `govde_vidasi` 4×50; testler 145/0 | Kapandı. | OB-3 |
| S-01a | — | Konfirmat kaydı | 7×50 ana standart değil [A-C KESİN]; 7×50 duvar montaj vidası (GÖREV 023) | **UYGULANDI** GÖREV 024 (commitsiz): satır listeden çıktı; testler 147/0 | Kapandı. Pasif `konfirmat_*` ayarlarının silinmesi ayrı karar (S-01b). | — |
| S-01b | P2 | Pasif `konfirmat_*` ayarları | — | 3 ayar dosyada ve `MotorConfig`'te duruyor, hesapta kullanılmıyor | Silinsin mi? Silinirse eski ayar dosyaları “Bilinmeyen ayar” hatası verir. | — |
| S-02 | — | Birleşim vida sayısı | **2/3/4**, derinlik eşikleri [A-C KESİN] | **UYGULANDI** GÖREV 022 (commitsiz): 249/250/450/451/700 sınır testleri Python ve JS'de geçti | Kapandı. Toplam adet GÖREV 025'te eklendi (yan–alt/üst, 4 birleşim). | OB-3 |
| S-02b | P1 | Diğer bağlantıların vidası | Dikme, sabit raf, arkalık: kural yok [A-L AÇIK]; montaj S-15 | Toplamda yok; `hirdavat_hesapla` dikme adedi almaz | Her bağlantı türü için birleşim sayısı ve adet kuralı. | — |
| S-02a | P1 | 700 mm üstü vida adedi | Arşivde kural yok | Hata döner, değer üretmez | Kural mı verilecek, hata mı kalacak? | — |
| S-03 | P1 | Raf geri çekilmesi | **30 mm**, `gövde − 30` [A-G KESİN] | `raf_geri` 20 iç derinlikten; sonuç bugün dış − 30 (580 → 550); önde 20, arkada kanal 10 | “Gövde derinliği” dış mı iç mi; 30 tek parametre mi olacak; `arkalik_kanal` değişirse sonuç ayrılır. | OB-6 |
| S-04 | P1 | Raf pimleri | 3/4/5 seçeneği [A-G KESİN] | Sabit **4** | Seçim girdisi, yük/derinlik bağlantısı. | OB-8 |
| S-05 | P0 | Kapak derzleri | **3/3, düşey 4** ve boy **2/düşey 7** [A-E KAYIT] | Tek `derz` 2 → yan 2, orta 2, düşey 4 | Kesin formül/tolerans: halen **AÇIK**. | OB-4 |
| S-06 | P1 | Menteşe türü ve sayısı | Frensiz; **900/1350/2000** [A-F KAYIT] | BLUMOTION notu; **900/1600/2200** | Tür ve eşik: arşiv mi kod mu; ürün/kanat yüküyle teknik teyit. | OB-5 |
| S-07 | P1 | Kapak seçim ekranı / kapak adedi modeli | Genişliğe bağlı **öneri**, usta son söz [A-E/K] | Katalogdan sabit 1/2; öneri/onay adımı yok | Kapaklı/cihaz/çekmece/açık modül ayrımı, eşiğin yeri, usta onayı. | OB-2 |
| S-08 | P1 | Asimetrik kapak | Usta sağ/sol ölçü verebilir [A-E KESİN] | Yalnız simetrik yerleşim | Ayrı kanat ölçü modeli, formül ve test onayı. | — |
| S-09 | P1 | Geniş kasada dikme | >900'de uyarı [A-D KESİN] | Uyarı yok | Uyarı/manuel destek iş akışı. | — |
| S-10 | P1 | Köşe/dolgu/çarpışma | Erken köşe, ölçülü dolgu [A-J KESİN] | Köşe turda yok, sağda tek dolgu kutusu | Yerleşim ve çarpışma sözleşmesi. | — |
| S-11 | P1 | Üretim çıktısı / açık modül | Kapaksız dekoratif, BOM, PVC vb. | Yok/kısmi | İmalat parça ve çıktı şemaları. | — |
| S-12 | P1 | Çekmece/menteşe/arkalık diğerleri | Çoğu KAYIT veya AÇIK [A-F/I/L] | Kısmi | Ürün bazında ayrı teknik teyit. | — |
| S-13 | P2 | Standarttan önce yazılmış kod ve belge senkronu | [A] A: standart önce; 07.10 arşivi | `bb8d4cb` commitli; GÖREV 016/017-A commitsiz; `00_PROJE_DURUMU`, yol haritası, rehber eski satırlar | Commitsiz işin kaderi; belgeleri **ayrı onaylı görevle** güncelleme. | OB-1 |
| S-15 | P1 | Askı/duvar montaj vidası kullanımı | 7×50 askı duvar montaj vidası [U GÖREV 023] | Yalnız tür/ölçü (`vida_turleri`); adet, dübel, tip ataması yok | Adet, dübel, bağlantı ve dolap tipi kuralı. | — |
| S-14 | P1 | 37 mm'nin anlamı ve delik çapı | Ön kenardan aks 37, çap 5 [A-G KESİN] | 37 dikey ilk delik yüksekliği; ön kenar ve çap ayarı yok | 37'nin yatay mı dikey mi kullanılacağı; dikey ilk delik için ayrı değer. | OB-7 |

## 13. Değişiklik disiplini ve karar kaydı

- **Bu sürümde yalnız belge hazırlandı.** Motor, JS ikizi, katalog, config, mevcut testler ve diğer belgeler değiştirilmedi.
- [A] P gereği arşiv **kontrol kopyası**, bu Markdown **yaşayan standart adayıdır**. KAYIT/ÖNERİ/AÇIK maddeleri onaysız üretim kuralı olmaz.
- Her yeni üretim kararı için kayıt: `Karar ID / tarih / konu / önceki statü / onaylanan kural ve eşikler / kaynak / etkilenen modül / gerekli test / kullanıcı onayı / uygulanma-commit durumu`.
- Değişen eski hüküm silinmez; **DEĞİŞTİRİLDİ** etiketi ve eski/yeni karar bağlantısı tutulur.
- Kod değişikliğinde Python–JS ikiz testleri zorunludur. Commit/push ve yayın ayrı kullanıcı onayı ile yapılır; gündelik rutin Git işlemleri kullanıcıyla kararlaştırılan iş bitimi düzenine göre yürütülür.
- Güncel yerel repo denetiminde [K] ve [U] kaynaklı değerler değişmişse, **sessizce üzerine yazılmaz**; bu belgedeki uyuşmazlık kaydı kanıta göre güncellenip yeniden değerlendirilir.

## Ek A — Yalnız kodda bulunan değerler (KOD DEĞERİ)

Karar kaydı yok; teyit edilmeden üretim standardı sayılmaz. Kaynak: CFG (`varsayilan_config.json`), KOD (`motor.py`).

| Konu | Değer | Kaynak |
|---|---|---|
| Tipler | Yalnız baza, duvar, boy | KOD `TIPLER` |
| Gövde iç ölçü | En ve yükseklik dış − 2·levha; derinlik dış − `arkalik_kanal` 10 | KOD `_ic` |
| Baza | Gövde yüksekliği 720, ayak 100 | CFG `baza_govde_yukseklik`, `ayak_yuksekligi` |
| Duvar | Gövde yüksekliği 720, yerden 1410 (ayak 100 + baza 720 + tezgah 40 + tezgah üstü 550) | CFG `duvar_govde_yukseklik`, `tezgah_kalinlik`, `tezgah_ustu_bosluk` |
| Boy | Gövde yüksekliği 2100; oda kısaysa oda yüksekliği | CFG `boy_govde_yukseklik` |
| Derinlik | 580 (her tip) | CFG `modul_derinlik` |
| Sıra kuralı | Soldan, sığan en geniş standart; kalan sağda dolgu | KOD `_en_sec` |
| Panel yoğunluğu | 650 kg/m³ (kapak ağırlığı bilgisi; menteşe adedinde kullanılmaz) | CFG `panel_yogunluk` |

## Sürüm geçmişi

| Sürüm | Tarih | Değişiklik |
|---|---|---|
| 1 (Cursor) | 2026-10-08 | GÖREV 020. ARŞ, MİM, 08.10 kararları ve kod değerlerinden derlendi; OB-1…OB-8. |
| 0.1 (kullanıcı) | 2026-10-08 | Kullanıcı nüshası; S-01…S-13, [K] ikinci el. |
| 0.2 | 2026-10-08 | GÖREV 021. 0.1 esas alındı; [K] yerel kodla doğrulandı; sürüm 1'den OB-6/OB-7 ayrıntısı, menteşe türü çelişkisi, kapak formülü, ARŞ A metni, yol haritası DEĞİŞTİRİLDİ kaydı ve KOD DEĞERİ eki aktarıldı; S-14 eklendi. Onaylı üretim kararı değiştirilmedi. Kod değiştirilmedi. |
| 0.3 | 2026-10-08 | GÖREV 022. S-01/S-02 Python ve JS motoruna uygulandı (commitsiz); 700 dahil 4 vida kullanıcı onayıyla eklendi. Mobilya testleri 145 geçti, 0 hata. S-01a ve S-02a açıldı. |
| 0.4 | 2026-10-08 | GÖREV 023. Vida sınıflandırması: 4×50 gövde imalat, 7×50 askı duvar montaj (`duvar_montaj_vida_cap/boy`). Montaj adedi/dübel kuralı üretilmedi (S-15). Testler 146 geçti, 0 hata. |
| 0.5 | 2026-10-08 | GÖREV 024. Eski konfirmat 7×50 satırı aktif hırdavat listesinden çıkarıldı (S-01a kapandı); pasif ayarlar S-01b. Testler 147 geçti, 0 hata. |
| 0.6 | 2026-10-08 | GÖREV 025. Toplam gövde vidası: yan–alt/üst 4 birleşim × 2/3/4 (580 → 16). Dikme, raf, arkalık, montaj dahil değil (S-02b). Testler 148 geçti, 0 hata. |
