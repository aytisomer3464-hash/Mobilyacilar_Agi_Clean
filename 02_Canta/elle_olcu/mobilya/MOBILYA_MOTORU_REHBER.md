# Mobilya Motoru Rehber

Bu dosya aşama 3 anayasasıdır. Katman atlayan kod yanlıştır. Ölçü kodda sabit değildir; `varsayilan_config.json` içinden gelir.

Reçete sırası zemin, duvar, mobilyadır. Zemin ve duvar motoru burada yeniden yazılmaz.

## Katmanlar

| Katman | Ne | Durum |
| --- | --- | --- |
| 1 | Oda, duvar, kolon, kiriş, priz. Duvar kilitlenir. | Duruyor. Dokunulmaz. |
| 2 | Bir modül iskeleti: yan, alt, üst, kanallı arkalık. `X, Y, Z` kilit. | Yazıldı. |
| 2.5 | Raf, iskeletin içine. | Yazıldı. Çekmece yok. |
| 3 | Modülleri duvar boyunca dizmek. Dolgu sağda. | Yazıldı. `odaModulEkle` kapalı. |
| 4 | Kapak, klapa, bindirme, ayak parçası. | Tek kapak sahnede. Klapa, ayak parçası yok. |
| 5 | Menteşe, delik, kulp. | Menteşe adedi var. Sahneye bağlı değil. |
| 6 | Renk ve malzeme. | İskelet renkleri sahnede. Katman olarak bitmedi. |

Bir önceki katman oturmadan sonrakine kod yazılmaz.

## Şema

```text
varsayilan_config.json
        |
   MotorConfig
        |
 tip_olcu(tip, oda) → yükseklik, yerden
        |
 govde_birlestir(genislik, yukseklik, derinlik)
        |
 raf_yerlestir → raf kutuları
        |
 sira_kur(duvar_en) → kasalar soldan, dolgu sağda, her kasada kapak
        |
    {ad, x, y, z, en, boy, kalinlik}
        |
 vitrin: mobilyaTurKur  (tip baza, duvar veya boy)
        |
 tuval: cizGovde3d
```

Köşe, modülün ön-sol-alt dış köşesidir. `X` sağa, `Y` arkaya, `Z` yukarı.

Sahne başka eksen kullanır: oda `X` en, `Y` yükseklik, `Z` boy. Ayak payı bu çizimde `Z` kaymasıdır; ayak parçası değildir.

`en` kutunun `X` boyu, `boy` `Y` boyu, `kalinlik` `Z` boyudur.

## Modül kuralı

Duvarın boyu kasa değildir.

- Genişlik: `modul_genislik` (şimdilik 600).
- Derinlik: `modul_derinlik` (şimdilik 580).
- Yükseklik ve yerden pay **tipten** gelir. Aşağıdaki üç tip.
- Duvar bu genişlikten darsa hesap durur: «Duvar modüle dar.»

İskelet parçaları: sol yan, sağ yan, alt, üst, kanallı arkalık. Raf `raf_yerlestir` ile içine oturur. Kapak ve menteşe bu kutuda yoktur.

## Tip

Üç tip vardır. Başka tip yok. Ayak yalnız bazadadır.

| Tip | Gövde yüksekliği | Yerden (sahne Z kayması) |
| --- | --- | --- |
| Baza | `baza_govde_yukseklik` 720 | `ayak_yuksekligi` 100 |
| Duvar | `duvar_govde_yukseklik` 720 | `ayak_yuksekligi` + `baza_govde_yukseklik` + `tezgah_kalinlik` + `tezgah_ustu_bosluk` = 1410 |
| Boy | `boy_govde_yukseklik` 2100. Oda kısaysa oda yüksekliği. | 0 |

Tezgah 40. Tezgah üstü 860. Duvar–tezgah boşluğu 550.

Tur baza, duvar veya boy okur. Satırın solundaki üç düğme tipi değiştirir.

Genişlik ve derinlik tipte değişmez: `modul_genislik`, `modul_derinlik`.

## Yasak

- Duvar boyunu tek kutu yapmak.
- Katman atlamak. Gövde yokken kapak veya menteşe çizmek.
- `odaModulEkle` açmak. Katman 3 ayrı onay ister.
- Zemin veya duvar motorunu bu iş için yeniden yazmak.
- 600, 800 gibi ölçüleri koda gömmek.
- Fonksiyon dosyada duruyor diye onu sahneye bağlamak.

`cekmece_hesapla`, `hirdavat_hesapla` duruyor. Tur onları çağırmaz. `kapak_yerlestir` katman 4; tek kapak, ön yüzde.

## Blum (menteşe ve bindirme)

Kaynak: CLIP top BLUMOTION 110°, düz kol, parça 71B3550, plaka 0 mm. Sabit mesafe 11 mm. Bindirme = 11 + delik payı.

18 mm levhayı tam kaplamak için delik payı 7 mm. Bindirme 18 mm. `kapak_binis` bu yüzden 18 kaldı.

Kapak ağırlığı `kapak_hesapla` içinde bir kanat için döner: genişlik × boy × levha × `panel_yogunluk` (650 kg/m³). Milimetre `metre_mm` (1000) ile metreye çevrilir. Menteşe adedi bu kiloyu henüz kullanmaz. `mentese_esik_*` eski metindedir (900, 1600, 2200).

32 mm delik aralığı ve ön sıra 37 mm System 32 ile aynıdır. Blum montaj plakası da ön kenardan 37 mm'dedir.

## Menü sırası

Kaynak: Cabinet Vision, Mozaik, PolyBoard. Menü parça sırası değildir. Önce kural, sonra oda, sonra katalogdan kasa.

1. İş ayarı. Konstrüksiyon, malzeme, menteşe/ray/kulp kataloğu, kapak stili, baza/duvar/boy standart boyları.
2. Oda. Duvar, kapı, pencere, yükseklik, tezgah üstü boşluk.
3. Katalog. Hazır genişlikler. Duvar tek 600 ile dolmaz. Dolgu ayrı parçadır.
4. Ön yüz. Kapak, çift kapak, çekmece, açık.
5. İç. Raf, dikme, çekmece. Ön yüzdeki bölmeye bağlıdır.
6. Donanım ön yüzden gelir. Sonra tezgah, baza bandı, kesim listesi.

Katman 2–4 imalat sırasıdır: iskelet, raf, dizi, tek kapak. Program menüsü tasarım sırasıdır. Sonraki iş menteşe değildir.

## İş ayarı

Tur çizmeden önce kilitlenenler. Hepsi ayardadır. Tur bunları sormaz.

- Konstrüksiyon: çerçevesiz kasa. Yüz çerçevesi yok.
- Malzeme: `levha`. Yoğunluk `panel_yogunluk`.
- Kapak stili: tek kanat, tam bindirme. `kapak_binis`.
- Menteşe ürünü: CLIP top BLUMOTION 110°, 0 mm plaka. Adet şeması henüz kapakta yok.
- Tip boyları: baza, duvar, boy. Ayar adları tip tablosunda.

Ray ve kulp iş ayarında yok. Seçilmeden çekmece ve kulp kodu yazılmaz.

## Katalog

Katalog `katalog_arsiv.json`. Sıra yalnız `sablon` içindeki standart genişliği okur. `acik_ek` sıraya girmez. `modul_genislik` sırada kullanılmaz.

`kapak_adedi` (planlı kural, karar 2026-10-08). **Henüz uygulanmadı:** kod bu alanı okumaz, katalogda alan yok, sıra her kasaya tek kapak koyar.

- Şablon kaydında isteğe bağlıdır. Değer yalnız 1 veya 2 tam sayıdır. `2.0` 2 sayılır; JSON bu ikisini JS'de ayırmaz.
- Alan yoksa 1. Bugünkü tek kapak davranışı korunur.
- Geçersiz değer (0, 3, 1.5 gibi kesirli, yazı, doğru/yanlış, boş) hata verir; parça üretilmez.
- Aynı tip ve aynı genişlikte iki kayıt farklı adet söylerse hata.
- Kanat ölçüsü `kapak_hesapla(..., 2)` içindedir; yeni formül yazılmaz.
- Klapa ve çekmece önü bu kuralın dışındadır.

## Standart ve köşe

Standart kasa: şablonda `duz_kasa` yok veya doğru. Sıra soldan, duvara sığan en geniş standartı koyar. Kalan yine standartsa onu koyar. Değilse sağda dolgu.

Köşe: `duz_kasa` yanlış. Baza 1000 ve 1200. Düz sıraya kutu olarak girmez. Köşe yerleşimi ayrı iştir.

Boy şablonda yalnız 600 standarttır. Bu ezber değildir; listede tek standart odur.

## Henüz kuralı yazılmayanlar

Bunlar cümle olmadan kod yazılmaz:

- Katalog aktif. Sıra standart şablonu okur. Köşe 1000 ve 1200 sıraya girmez.
- Dolgu menüde ayrı parça. Kod hâlâ kalan payı sağa koyar.
- Tip mm ayarda. Tur baza, duvar, boy seçer.
- Raf ve çekmece: raf bağlandı. Çekmece yüksekliği yok.
- Ayak ve süpürgelik parçası. Katman 2 yalnız yüksekliği yukarı kaydırır.
- Klapa, kulp. Çift kapak kuralı Katalog bölümünde yazıldı; kod henüz yok.

## Şu an

Katman 1 kilitli. Katman 2 iskelet, 2.5 raf, 3 sıra, 4 tek kapak. Satırda yalnız Baza, Duvar, Boy. Sıra şablondaki standart genişlikle dolar; köşe girmez; dolgu sağda. `odaModulEkle` kapalı.

İş ayarı yazıldı. Katalog arşivi duruyor. Tur bağlanmadan kod yazılmaz.

## Kod yerleri

| Ne | Dosya |
| --- | --- |
| Hesap | `motor.py` |
| JS ikizi | `mobilya_motor.js` |
| Ayar | `varsayilan_config.json` |
| Katalog arşivi | `katalog_arsiv.json` |
| Test | `tests/test_mobilya_motor.py`, `tests/test_mobilya_js_ikiz.py` |
| Satır ve tur | `duvar/vitrin/vitrin.js` |
| Tuval | `duvar/vitrin/vitrin_ciz.js` |

Başka motoru içe almaz. Canlı `web.app` ve kardeş `Mobilyacılar_Agi` bu rehberin konusu değildir.
