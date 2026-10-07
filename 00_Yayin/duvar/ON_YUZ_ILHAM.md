# Ön yüz ilham (zemin sahne, sonsuz saha)

Kaynak: cep CAD / sonsuz tuval + CAD masaüstü. Kod kuralı değil; ilham. Tek tek uygulanır.

## Magi saha (şimdi)

Sağda Shorts sütunu: ikon + alt yazı (Önceki / Sonraki). Üst HUD sayfa. Anket altta. Cam hap ve levha kenarı ok **denendi, ağır bulundu**.

## CAD yerleşim teklifi (havuz — henüz uygulanmadı)

Hedef: AutoCAD / Moblo benzeri, sade, endüstriyel. Görsel karmaşa yok. Koyu/açık uyumlu.

1. **Üst (Header/Toolbar):** yatay çubuk — dosya, dışa aktar, ayarlar, ana araçlar.
2. **Sol panel:** komut satırı, ölçü girdi, parça ekleme, modül listesi.
3. **Sağ panel:** seçili obje — özellik, malzeme, kalınlık, ölçü.
4. **Orta tuval:** çizim/imalat maksimum; arka plan ızgara; temiz.

Not: Tailwind yok; mevcut düz CSS. Usta akışı (en/boy/eşik/anket) ezilmesin diye **parça parça**.

## Kısa modeller

| Model | Ne | Bizde |
| --- | --- | --- |
| YouTube Shorts | Sağ dikey ikon + isim, çubuk yok | İşlem önceki/sonraki (şimdi) |
| YouTube Shorts rafı | Yatay kayan dikey kartlar | Adım rafı (teklif, aşağıda) |
| tldraw / Excalidraw | Cam ada, tam tuval | Hap denendi — durduruldu |
| Concepts | HUD kenara yanaşır | Kalabalıkta gizle |
| Planner 5D | Geri/ileri sağ-alt | Yedek |
| Moblo | Araç objeye yapışmaz; kenar liste | Sol/sağ CAD paneli |
| AutoCAD | Üst menü + komut + özellik | CAD teklifi 1–4 |
| IKEA Kreativ | Seçilince sağ panel | Sağ özellik |

## Yapma (saha)

- Okları plakaya yapıştırmak.
- Hap/cam ada (ağır).
- 44 px altı hedef.
- Chrome’u zoom ile taşımak.
- Dört paneli bir anda usta tek-el sahneye yığmak.

## İmalat yazılımı araştırması (havuz — 24 Eyl 2026)

Kaynak: Cabinet Vision, SmartCabinet, Adeko, SWOOD, KesApp. **Taklit yok.** Kod kuralı değil; sıra ilhamı. Uygulama ayrı onay.

Sektör omurgası üç katman: mekân/modül → üretim belgesi (kesim, bant, hırdavat) → makine (nest/CNC). Bizde belge Fire kapısında, makine ayrı onay.

**Alınır (mantık):** ölçüyü kilitlemeden kesime gitme; kesim listesi reçete motoruna gömülmez; usta çıktısı sade.

**Alınmaz:** 3D satış vitrini, SolidWorks/CAM kopyası, 5. kapı, stok/ERP, çekmecede seramik/kapı/mermer, üst Menü/Ayar ile çekmece alt menüsünü karıştırmak.

Bizim hat (README ile aynı): OCR → zemin mühür → duvar mühür → mobilya bir tur → Fire. Çizim fabrikayı üretmez; mühür kesimi açar.

## Canlı saha teklifi: Adım rafı (havuz — 30 Eyl 2026)

Kaynak: YouTube Shorts rafı + atölye koşulları. Kod kuralı değil; teklif. Yukarıdaki "Yapma" ve vitrin-sahne kuralı geçerli. Uygulama parça parça, her adım ayrı onay.

**Fikir.** Üst çubuğun hemen altında yatay kayan dikey kartlar. Her kart reçetenin bir adımıdır. Usta başını kaldırınca nerede olduğunu, neyin bittiğini, neyin kilitli olduğunu görür. Raf göz içindir; eylem yine altta (anket) ve sağda (Shorts sütunu) kalır.

**Neden üstte.** Göz hizası, sabit yer. Alt kenar başparmağın ve anketin. Sol kenar Android geri hareketiyle çakışır. Sağ kenar eylem sütununun.

### Yerleşim (telefon, dik)

```text
 ‹ Geri          Sığdır   İleri     Ayar   Menü    üst çubuk 52 px
 ───────────────────────────────────────────────
 [Mutfak] [En ✓] [Boy ✓] [Eşik ●] [Oda] [Yük…     adım rafı 96 px, yatay kayar
 ━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░    ilerleme çizgisi
          Kapı eşiğini yerine sürükle usta         program cümlesi
                                             [+]
       ·  ·  ·  ızgara 100 cm  ·  ·  ·       [−]   tuval (boyu değişmez)
             ┌─────────────┐              Sığdır
        K    │     oda     │            ‹ Önceki   sağ Shorts sütunu
             └─────────────┘            › Sonraki
 ╭─────────────────────────────────────────────╮
 │    Küp     Gönyesiz     Girintili     …     │   anket (başparmak bölgesi)
 ╰─────────────────────────────────────────────╯
```

✓ bitti, ● şimdi. Kilitli kart soluk ve kilit ikonludur. Raf yalnız sahnede; Merhaba, Müşteri ve İş sayfalarında yok.

### Kart

- 72 × 80 px, köşe 14 px, aralık 8 px. Dört kart ve bir parçası görünür; yarım kart "kaydır" der.
- İçerik: ikon 24 px (2 px çizgi), ad 16 px kalın, değer 14 px (sabit genişlikli rakam, ör. "400").
- İlk kart yapışkandır: müşteri kısa adı + iş türü. Usta hangi işte olduğunu hep görür.
- Kısa ekranda (yükseklik 700 px altı) kart 64 × 64 olur; değer yalnız aktif kartta yazar.

| Durum | Görünüş |
| --- | --- |
| Bitti | Koyu kart, yeşil tik rozeti, değer yazılı |
| Şimdi | Turuncu kart, %6 büyük, tek gölge; kenarı nefes alır |
| Sırada | Panel rengi, soluk yazı |
| Kilitli | %45 opak, kilit ikonu |
| Mühürlü aşama | Damga ikonu, "Mühürlü" ve sürüm numarası |

Renk durumu söyler, ikon adımı söyler.

### Raf içeriği

| Aşama | Kartlar |
| --- | --- |
| Zemin | En · Boy · Eşik · Oda · Gönye (yalnız Gönyesiz) · Ek (yalnız Girintili/Çıkıntılı) · Yükselti · Sifon · Bırak · Mühür |
| Duvar | Şekil · Duvarlar · örülen her duvar için bir kart (ör. D3 Kuzey, gereç sayısıyla) · Kilit |
| Mobilya | Tek kart. Zemin ve duvar mühürlenmeden kilitli; mühürlerden sonra da yalnız "Motor sırada" der, tıklanmaz (motor ayrı onay). |

Kartlar bugünkü `soruAdim` adımlarına bağlanır (`en`, `boy`, `kapi_surukle`, `oda_tip`, `gonye_*`, `ek_*`, `yukselti`, `sifon`, `birak`; `mutfak_sekil`, `mutfak_duvar`, `duvar_*`, `duvar_kilit`). Yeni adım uydurulmaz.

### Hareket

Yalnız durum değişince ya da usta dokununca. Yalnız `transform` ve `opacity`. Süreler 160, 240, 420 ms.

1. **Adım ilerler:** aktif kart ortaya kayar, önceki karta tik çizilir, ilerleme çizgisi dolar.
2. **Koşullu adım doğar** (Gönye, Ek): yeni kart açılarak yerine girer.
3. **Mühür:** aşama kartına damga iner (ölçek 1,25 → 1, açı −8° → 0). Destekleyen telefonda 40 ms titreşim; Ayarlar'dan kapanır.
4. **Bekleme:** aktif kartın kenarı üç kez nefes alır, sonra durur. OCR'daki nefes çerçevesiyle aynı dil.
5. **Hata:** aktif kart iki kez yatay titrer; program cümlesi kırmızı.
6. **Tuvalde sürükleme ya da katman paneli açılınca:** raf ince çizgiye iner (ilerleme + aktif adım adı). Bırakınca 1,2 sn sonra açılır; çizgiye dokununca da açılır.

Telefonda "hareketi azalt" açıksa hepsi kapanır; durum yine görünür.

### Dokunma

- Raf serbest kayar, kartlar yerine oturur; 2 sn sonra aktif karta döner. Rafta kaydırmak tuvali oynatmaz.
- Raf kenarlarında 16 px boşluk: Android geri hareketiyle çakışma azalır.
- Biten karta dokunma: "Değiştirmek için Önceki usta." Mühürlü aşamada: "Mühürlü usta, düzeltme Menü'de."
- Kilitli karta dokunma: sebep cümlesi (ör. "Önce zemin mühürle usta.").
- Kartla adım atlanmaz: eşik ve ekler ölçüye bağlı, atlama onları bozar. Önceki/Sonraki ve Menü yolları aynen kalır.
- Sonra, isteğe bağlı **ipucu slaytı:** karta uzun basınca Shorts gibi dikey bir kart açılır. 3 sn döngülü çizim (ör. "metreyi sol duvardan sağa çek"), yukarı kaydırınca sonraki adımın ipucu, altta 56 px "Tamam". Video yok; her ipucu küçük satır içi SVG, çevrimdışı çalışır.

### Çubuk ve sütun

- Üst çubuk: yükseklik 40 → 52 px, dokunma hedefi 36 → 48 px, yazı ~10 → 14 px; ikon + yazı. Düzen aynı: Geri · Sığdır · İleri · Ayar · Menü (README tarifi).
- Sağ Shorts sütunu yerinde kalır; ikonları raftaki çizgi diliyle (2 px) eşitlenir.
- Not: Sığdır hem üst çubukta hem sağ sütunda. Biri kalkabilir; README tarifine dokunduğu için ayrı karar.

### Renk ve yazı

| Rol | Koyu (varsayılan) | Güneş (açık tema, isteğe bağlı) |
| --- | --- | --- |
| Arka | `#2c3136` | `#f4f1ea` |
| Panel, raf | `#1a1e22` | `#ffffff` |
| Yazı | `#e8e4dc` | `#1a1e22` |
| Soluk yazı | `#a8a49c` (6,7:1) | `#5b5750` (7,2:1) |
| Şimdi | `#fb923c`, üstünde yazı `#431407` (6,9:1) | `#c2410c`, üstünde yazı `#ffffff` (5,2:1) |
| Bitti | `#16a34a` | `#15803d` |
| Hata | `#dc2626` | `#b91c1c` |

- Bugün turuncu düğmedeki `#7c2d12` yazı 4,1:1; küçük yazıda yetmez.
- Yazı: sistem fontu (Android'de Roboto), web fontu yok. Alt sınır 14 px.
- Köşe 12 px (düğme), 14 px (kart), 16 px (panel). Gölge tek seviye, yalnız aktif kartta ve açık panelde.

### Atölye koşulları

- Eldiven ve toz: hedef en az 48 px, ana eylem 56 px, hedefler arası en az 8 px; çift dokunma yok.
- Tek el: zorunlu eylem rafta değil; altta ve sağda.
- Işık: koyu varsayılan; güneşte "Güneş" teması (Ayarlar).
- Gürültü: onay görsel ve titreşimle; ses yok.
- Ucuz telefon: bulanık cam (`backdrop-filter`) yok, video yok, sürekli animasyon döngüsü yok; raf yalnız adım değişince yeniden çizilir.
- Çevrimdışı: ikonlar satır içi SVG; dış kütüphane, web fontu, CDN yok.

### Teknik not

- Raf tuvalin üstüne biner; düz, opak bant. Raf açılıp kapanınca tuval boyu değişmez, yalnız `transform` çalışır; çizim yeniden kurulmaz.
- Sığdır üstten raf + cümle payı bırakır; oda rafın altında kalmaz.
- `#levhaCam` ve `#levhaCamMotor` raf kadar aşağı iner (tek değişken `--raf`).
- Ad çakışmasın: kodda `gerecSerit` zaten var. Yeni öğe `#adimRaf`, dosya `adim_raf.js`.
- `vitrin.js` yalnız bir olay yayar (`magi-adim`: `soruAdim`, `motorSayfa`, iki kilit, ölçüler); raf yalnız okur. Motor, kayıt ve mühür koduna dokunulmaz.

### Uygulama sırası (her satır ayrı onay)

| Adım | İş | Dosya |
| --- | --- | --- |
| R1 | Görsel temel: renk, yazı ve hareket değişkenleri; üst çubuk 52 px | `index.html` |
| R2 | Raf iskeleti, salt okunur: kartlar, ilerleme, aktif karta dönüş | `index.html`, `adim_raf.js`, `vitrin.js` (yalnız olay) |
| R3 | Hareket anları ve "hareketi azalt" | `adim_raf.js`, `index.html` |
| R4 | Sürüklemede incelme, Sığdır payı | `adim_raf.js`, `vitrin.js` |
| R5 | Dokunma cümleleri | `adim_raf.js` |
| R6 | Güneş teması (isteğe bağlı) | `index.html`, `ayarlar.html` |
| R7 | İpucu slaytları (isteğe bağlı) | `adim_raf.js` |

Her adımda `index.html` içindeki `?v=` artar.

### Yapma (raf)

- Kendi kendine dönen karusel, konfeti, ses, video arka plan, sürekli yanıp sönme.
- Rafa zorunlu eylem koymak; kartla mühür açmak ya da aşama atlatmak.
- Rafı tuvalin boyunu değiştirerek açıp kapamak.

**Uyum:** ızgara, pusula ve cetvel yerinde; hap/cam ada yok; 48 px hedef; üst çubuk, raf ve sağ çekmece birbirine karışmaz; mühürsüz sonraki aşama yok; düzeltme Menü'de; Tailwind, iframe ve 3D satış vitrini yok.

