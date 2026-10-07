# Mobilyacılar Ağı (Clean)

Gaziantep OSB merkezli atölye ağı. Ustalara ücretsiz **E-Takım Çantası**: tek el, büyük düğme, az adım. Ölçü okuma kayıt/SMS’e bağlı değil.

**Yan kopya.** Asıl kök `..\Mobilyacılar_Agi` dokunulmaz. Canlı `web.app` buradan yayınlanmaz. Çalıştırma ve yayın ayrı onay.

**Kurallar.** Çantada **4** araç; 5. kapı yok. Mobilya İmalat Akıllı Reçete tek kapıdır.

**İmalat merdiveni:** zemin → duvar → mobilya. 1 ve 2: program **%90** soru-cevap; tur + Uygula = kilit; mühürsüz sonraki aşama yok. 3: program **bir tur** çizer, sonra usta. Mobilya motoru 1–2 kilitlenmeden yazılmaz.

OCR akışı bozulmaz: tarama → onay (Geri · Onayla · Düzelt) → bant hafızası → model filtresi (yalnızca ekran) → WhatsApp/indir (tüm dolap). RapidOCR + Gemini yedek; iframe yok. `sunucu.py` / `masaustu.py` `ocr_okuyucu` içinde kalır. Anayasa: kök `.cursorrules`.

## E-Takım Çantası (4)

| # | Program | Durum | Yer |
| --- | --- | --- | --- |
| 1 | OCR ölçü | RapidOCR + Gemini yedek; akış korundu | `02_Canta/ocr_okuyucu` |
| 2 | Fire ebatlama | ~%90 aktif | `02_Canta/ebatlama` |
| 3 | Mobilya İmalat Akıllı Reçete | Zemin ve duvar motorları entegre; menüde tek kapı | `02_Canta/elle_olcu` (`zemin` + `duvar`) |
| 4 | Tel çizim | İskelet / bekliyor | `02_Canta/tel_cizim` |

## Klasör

- `01_Ana_Site` — ağ vitrini + çanta menüsü
- `02_Canta` — dört program
- `00_Yayin` — pack çıktısı (boş)
- `04_Ilham_ve_Eski` — boş

## Asıl amaç

Usta elinde **doğru odayı mühürlemek**, sonra kesime gitmek. Kayıt/SMS yok. İnternet şart değil. Taklit yok: dış CAD/CAM kopyalanmaz.

Performans kuralı: **ölç → kilitle → kes**. Çizim fabrikayı üretmez; mühür kesimi açar.

## Mantık yol haritası (çalışma sırası)

```
OCR (kağıt)     →  onaylı ölçü belgesi     [demirbaş; reçeteye ham foto basılmaz]
       ↓
Zemin (reçete 1) →  %90 soru-cevap + Uygula = MÜHÜR
       ↓
Duvar (reçete 2) →  aynı kilit             [zeminsiz yok]
       ↓
Mobilya (reçete 3) → program BİR TUR çizer, usta onaylar  [1–2 mühürsüz yok]
       ↓
Fire ebatlama   →  kesim / plaka           [mühürden SONRA]
       ↓
CNC / Tel       →  ayrı onay; şimdi iskelet
```

### Reçete 1 — zemin (usta dakikası)

1. Program sorar (en, boy, eşik, gönye, yükselti, sifon). Usta ölçer, bırakır.
2. Tuval odayı gösterir. Çekmece açılınca tuval sıkışmaz, sola kayar.
3. **Üst çubuk** (Geri, Sığdır, İleri, Ayar, Menü) çanta/ayar içindir; çekmeceyle karışmaz.
4. **Sağ çekmece alt menü** yalnız oda parçasıdır: Ölçü + 4 satır (oda zemin, kapı eşiği, yer sifonu, dolap altı yükselti). Satıra tıklanınca parametreler o satırın altında açılır.
5. Tur + Uygula = kilit. Kritik düzeltme yalnız Menü.

### Reçete 2–3 ve kesim

- Duvar: zemin mühürsüz açılmaz.
- Mobilya motoru 1–2 kilitlenmeden yazılmaz; her aşamada tur yok.
- Kesim listesi / nest Fire kapısındadır; reçete motoruna gömülmez.
- Tel çizim ve CNC ayrı iş; reçeteyi şişirmez.

### Bilinçli olmayanlar

5. kapı, 3D satış vitrini, dış CAD/CAM kopyası, stok/ERP, çekmecede seramik/kapı/mermer satırı, üst menü ile çekmece içeriğinin karışması.
