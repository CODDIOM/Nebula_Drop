# 🪐 NEBULA DROP — CODDIOM Cosmic Merge (MVP)

**CODDIOM** için geliştirilen, *Suika / Watermelon Game* mekaniğini **11 aşamalı kozmik evrim**, **Cosmic Fever kombo sistemi**, **3 taktiksel güç** ve **Hybrid-Casual meta katmanı** ile birleştiren mobil uyumlu web/hibrit oyun.

## Özellikler
- **11 Aşamalı Kozmik Evrim:** Asteroit → Ay → Merkür → Mars → Venüs → Dünya → Neptün → Satürn → Güneş → Nötron Yıldızı → **Kara Delik** (+ İki Kara Delik birleşiminde **Big Bang** bonusu).
- **Kombo & Cosmic Fever:** 2.2 saniye içinde art arda birleşmeler kombo çarpanını artırır ve Fever barını doldurarak **x2 puan** modunu açar.
- **3 Güç (Power-Up):**
  - **🌋 Sarsıntı (Solar Quake):** Kutuyu fiziksel olarak sallar.
  - **⚡ Lazer:** Seçilen tek bir gezegeni yok eder.
  - **🌀 Zero-G:** 3.2 saniye yerçekimini tersine çevirir.
- **Meta Katmanı:** `localStorage` tabanlı yüksek skor, Stardust (✦) ekonomisi, Günlük Görevler, Kozmik Evrim Albümü, haptik titreşim ve skor paylaşımı.

## Yerel Çalıştırma
```bash
python3 -m http.server 8765
```
Tarayıcıdan `http://localhost:8765` adresine girin.

## iOS & Android'e Paketleme (Capacitor)
Node.js kurulu bir ortamda bu klasörü doğrudan mobil uygulamaya çevirebilirsiniz:
```bash
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "Nebula Drop" "com.coddiom.nebuladrop" --web-dir .
npx cap add ios
npx cap add android
npx cap sync
```
Sonrasında `@capacitor-community/admob` ekleyerek ödüllü reklam ve banner entegrasyonunu bağlayabilirsiniz.
