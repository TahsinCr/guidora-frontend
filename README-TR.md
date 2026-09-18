[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Sass](https://img.shields.io/badge/Sass-SCSS%20Modules-CC6699?style=flat-square&logo=sass&logoColor=white)](https://sass-lang.com/)
[![License: MIT](https://img.shields.io/badge/Lisans-MIT-blue.svg?style=flat-square)](LICENSE)

[English](README.md) | **Türkçe**

# Guidora

Guidora, yapay zekâ platformlarını ve yazılım geliştirici araçlarını keşfetmek, filtrelemek ve karşılaştırmak için geliştirilmiş bir web ön yüz projesidir. Figma tasarım dosyalarındaki hiyerarşiyi doğrudan SCSS modülleri, esnek auto-layout kuralları ve responsive ızgara mekanikleri ile tarayıcıya aktarır.

Proje, istemci tarafı tek sayfa uygulaması (SPA) olarak yapılandırılmıştır. Araç sorguları ve sayfalama mantığı servis sınırının (`toolsService.js`) arkasında soyutlandığı için doğrudan canlı bir backend API'sine bağlanmaya hazırdır.

## Kapsam

Bu proje şunları sağlar:

- masaüstü ekran yoğunluğuna göre optimize edilmiş uyarlanabilir bir kart ızgarası (1920x1080 ekranda satır başına 4 kart);
- kategori, onay durumu, platform ve fiyatlandırma modeline göre çoklu filtreleme;
- dinamik sıralama (Alaka Düzeyi, En Yüksek Puan, Popülerlik, Yenilik) ve metin tabanlı arama;
- Figma tasarım şablonlarına birebir sadık iki sütunlu araç detay ekranı;
- dokümantasyon ve sürüm notları için yerel Markdown (`marked`) render desteği;
- GitHub reposundan otomatik veri çekebilen (yıldız, lisans, etiketler, README) ve çift modlu Markdown editörüne sahip "Araç Ekleme" ekranı;
- puan kartları, yıldız seçici ve faydalı oylaması sunan etkileşimli topluluk yorumları sistemi;
- içerik moderasyonu ve sorun bildirimi için özel raporlama modalı;
- kullanıcının kaydırma hareketini önceden algılayan (`IntersectionObserver`) sonsuz kaydırma akışı;
- anlamsal CSS değişkenleri (custom properties) üzerine kurulu tam çift tema (Karanlık ve Açık) desteği;
- yer imlerine eklenebilir ve tarayıcı geçmişiyle uyumlu URL sorgu senkronizasyonu (`?tool=<id>`);
- Figma Auto-Layout özelliklerini (`fill`, `hug`, `fixed`) CSS kurallarına dönüştüren SCSS yerleşim motoru.

Bu proje bilinçli olarak şunları içermez:

- sunucu taraflı veritabanı veya backend API servisleri;
- otomatik veri kazıma (scraping) veya bot boru hatları;
- kullanıcı kimlik doğrulama, ödeme veya araç başvuru backend mekanizmaları.

Pratik sınır şudur: istemci tarafı sunum, yerleşim matematiği, tema değişkenleri ve arayüz etkileşim durumu bu depoda yönetilir; kalıcı depolama, scraping ve kimlik doğrulama harici backend servislerinde yer alır.

## Mimari

```text
Sunum Katmanı (React 18 Arayüzü)
├── Kabuk Düzeni       Header, Footer, Dinamik Breadcrumb
├── Katalog Görünümü   Hero vitrini, kategori hapları, sıralama çubuğu ve kart ızgarası
├── Detay Modalı       Figma 2 kolonlu görünüm, sekmeler, statü metrikleri ve yan panel
└── Ekleme & Moderasyon Araç Ekleme modalı, GitHub entegrasyonu, Markdown editörü ve Raporlama
             │
             ▼
Uygulama Durumu ve Servisler
├── Tema Yönetimi      Dark / Light mod ve localStorage senkronizasyonu
├── Servis Katmanı     toolsService soyutlaması (mock veri, filtreleme, yorumlar ve GitHub)
└── URL Senkronizasyonu Arama parametreleri ile durum yönetimi (?tool=...)
             │
             ▼
Stil ve Tasarım Motoru (SCSS)
├── Tasarım Token'ları Semantik CSS değişkenleri (_theme.scss, _reset.scss)
└── Auto-Layout        Figma yerleşim kuralları: fill, hug, fixed, flex, gap (_layout.scss)
```

Bağımlılıklar yukarıdan aşağıya doğru akar. Arayüz bileşenleri görsel kurallar ve yerleşimler için tasarım katmanını kullanır, araç verilerini ise doğrudan dosyalardan çekmek yerine servis katmanından talep eder. Bileşenler katman sınırlarını aşmaz veya küresel durumu kontrolsüzce değiştirmez.

## Proje Yapısı

- `src/components/`: Sorumluluk alanlarına göre ayrılmış modüler arayüz bileşenleri (`layout`, `home`, `tool-detail`, `submit` ve `common` markdown renderer).
- `src/services/`: Asenkron servis soyutlaması (`toolsService`) ve küratörlü veri seti (`mockData`).
- `src/context/`: Tema tercihlerini ve `localStorage` senkronizasyonunu yöneten React context yapısı (`ThemeContext`).
- `src/styles/`: Semantik tema değişkenlerini (`base/`) ve Figma yerleşim kurallarını (`modules/`) içeren merkezi SCSS sistemi.

## Yerleşim ve Tasarım Detayları

### Auto-Layout SCSS Motoru

Tüm bileşen stillerinde dağınık piksel kaydırmaları yerine `src/styles/modules/_layout.scss` kullanılır:

```scss
@use '@/styles/modules/layout' as layout;

// Boyutlandırma kuralları
@include layout.width(fill);     // width: 100%
@include layout.width(hug);      // width: fit-content
@include layout.width(340px);    // sabit genişlik: 340px

// Standart Flexbox
@include layout.flex(row, space-between, center, 16px);
@include layout.flex(column, flex-start, stretch, 20px);

// Kutu özellikleri
@include layout.box($padding: 24px, $border: 1px solid var(--border-card), $radius: var(--radius-lg));
```

### 1920x1080 Çözünürlükte Izgara Hesabı

Katalog ızgarası `repeat(auto-fill, minmax(350px, 1fr))` kuralını `20px` aralıkla uygular:

- Standart bir 1920x1080 ekran penceresinde, 210px genişliğindeki kenar çubuğu ve dış boşluklar düşüldüğünde kullanılabilir içerik alanı yaklaşık `1578px` olur.
- Izgara hesaplaması:
  $$\frac{1578\text{px} - (3 \times 20\text{px})}{4} = 379.5\text{px}$$
- Bu hesaplama sonucunda **satır başına tam olarak 4 kart** yerleşir ve kartlar boşlukları orantılı dolduracak şekilde ~380px genişliğe oturur.
- 1440px veya 1200px gibi daha dar pencerelerde aynı kural taşma yapmadan 3 veya 2 sütuna yeniden hizalanır.

### Sonsuz Kaydırma Mekanizması

Akış, `IntersectionObserver` ile parça parça yüklenir:

- Ürün listesinin sonuna görünmez bir gözlemci öğe (sentinel) yerleştirilmiştir.
- `rootMargin: '600px'` parametresi sayesinde kullanıcı henüz sayfanın en altına varmadan bir sonraki paket talep edilir.
- İlk açılışta 16 araç gelir; sonraki her tetiklemede filtreli kümeden 12'şer araç eklenir.

### Çift Tema Mimarisi

Temalar, kök `<html>` etiketi üzerindeki `data-theme` niteliği ile değiştirilir:

- **Karanlık Mod**: Koyu lacivert zemin (`#070c18`, `#0d1527`), zarif kenarlıklar (`rgba(255, 255, 255, 0.08)`) ve mor vurgular (`#8a38f5`).
- **Açık Mod**: Temiz arka plan (`#f8fafc`), yükseltilmiş beyaz kart yüzeyleri (`#ffffff`), belirgin kenarlıklar (`#e2e8f0`) ve koyu metin (`#0f172a`), 15:1 kontrast oranını korur.
- Seçimler `localStorage` üzerinde saklanarak sonraki ziyaretlerde korunur.

## Kurulum ve Çalıştırma

### Gereksinimler

- Node.js 18.x veya daha yeni bir sürüm
- npm 9.x veya daha yeni bir sürüm

### Kurulum

```bash
# Depoyu klonlayın
git clone https://github.com/TahsinCr/guidora-frontend-webside-design.git
cd guidora-frontend-webside-design

# Bağımlılıkları kurun
npm install
```

### Geliştirme Sunucusu

```bash
npm run dev
```

Uygulama yerel ortamda `http://127.0.0.1:5173/` adresinde çalışmaya başlar.

### Canlı Sürüm Derlemesi (Build)

```bash
npm run build
```

Derlenmiş ve optimize edilmiş statik dosyalar `dist/` klasörüne aktarılır.

## Lisans

Bu proje MIT Lisansı ile lisanslanmıştır — ayrıntılar için [LICENSE](LICENSE) dosyasına bakabilirsiniz.

Copyright (c) 2026 **TahsinCr**. Tüm hakları saklıdır.
