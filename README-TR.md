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
- Merkezde havada süzülen ve iğnesi dönen büyütülmüş Guidora pusulası ile altında hızlı ritimli 5'li Newton sarkacı noktalarına sahip şık ve dinamik yükleme ekranı (`PageLoader`) ve açılışta footer sıçramasını engelleyen anti-flash mimarisi;
- kapsamlı popuplar (`AuthModal`, `ToolStudioForm`) için tüm ekranı devralmayan, pencereye hapsolmuş yerel diyalog yükleyicileri;
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

### Performans ve Mimari Optimizasyonları

Hızlı İlk İçerikli Boyama (FCP), akıcı kaydırma (60 FPS) ve düşük ağ tüketimi sağlamak amacıyla mimari seviyesinde şu optimizasyonlar uygulanmıştır:

1. **Evrensel Rota ve Modal Kod Bölümleme (`React.lazy`)**:
   - Tüm ikincil tam sayfa görünümleri (`AdminDashboardPage`, `SubmitToolPage`, `UserProfilePage`) ve modal bileşenleri (`ToolDialog`, `AuthModal`, `NotificationDrawer`, `AccountSettingsModal`) talep anında yüklenen dinamik parçalara ayrılmıştır.
   - İlk sayfa JavaScript bundle boyutu **~201 kB** seviyesinde tutulmuş, açılış yükü en aza indirilmiştir.

2. **React 18 Eşzamanlı Geçişler (Concurrent Transitions) & Kesintisiz Gezinme**:
   - Görünüm ve diyalog geçişleri `useTransition` / `startTransition` ile yürütülür.
   - Arka planda lazy chunk indirilirken mevcut sayfa kullanıcı önünde tamamen görünür ve etkileşime açık kalır.
   - Sayfa geçişlerindeki dikkat dağıtan navbar altı yükleme çubukları ve animasyonları tamamen kaldırılmış; geçişler anında ve temiz şekilde gerçekleşir.
   - Yeni ekran hazır olduğu anda tak diye açılır; eski ekran bellek tasarrufu amacıyla kapatılır (unmount edilir).

3. **Akıllı Ön Yükleme (Prefetching) ve Sıfır Gecikme Hissi**:
   - Kartların üzerine fare geldiğinde (`ProductCard.jsx`, `onMouseEnter`) ilgili detay chunk'ı arka planda önceden çekilir. Tıklandığı an indirme beklemeden anında (0ms) açılır.
   - Tarayıcının işlem yapmadığı boş anlarda (`requestIdleCallback`) `ToolDialog` ve `AuthModal` chunk'ları belleğe alınır.
   - `toolsService.js` üzerindeki demo dışı yapay gecikmeler 0ms'ye indirilmiştir.

4. **Tek Bir Kez PageLoader Kuralı & Anti-Flash Mimarisi**:
   - İnovatif `PageLoader` ekranı **yalnızca tarayıcının ilk gerçek açılışında / hard reload esnasında** (`isInitialLoading`) bir defaya mahsus gösterilir.
   - Açılışta ekrana flaş gibi gelip rahatsızlık veren `index.html` içerisindeki statik inline preloader tamamen kaldırılmıştır (`#root` temizdir).
   - Dinamik sayfalardan ve modallardan `PageLoader` tamamen kaldırılmıştır.
   - `<Suspense fallback={null}>` sayesinde dinamik geçişlerde hiçbir görsel sıçrama veya boş ekran oluşmaz.
   - Flexbox kalıcı tabanlı footer mimarisi (`.main-content { flex: 1 0 auto; min-height: calc(100vh - var(--header-height)); }`) ile footer daima ekranın en altına kilitlenir.

5. **Gecikmeli Arama & Asenkron Sorgu Yönetimi (`useDebounce`)**:
   - Arama ve sıralama çubuğundaki metin girdileri için 250ms gecikmeli tampon (`useDebounce.js`) uygulanmıştır.
   - Kullanıcı klavyede yazarken gereksiz arka arkaya filtreleme tetiklenmez, ana işlem parçacığı kilitlenmez.

6. **DOM Kapsama & Sanallaştırma (`content-visibility: auto`)**:
   - Ürün kataloğu kartları (`.card`) CSS `content-visibility: auto` ve `contain-intrinsic-size: auto 240px` kuralları ile donatılmıştır.
   - Görünür alanın dışındaki kartlar için tarayıcı boyama ve düzen hesaplamalarını atlar; yüzlerce kart yüklense bile akıcı 60 FPS kaydırma korunur.

7. **Satıcı (Vendor) Parça Ayrıştırması**:
   - Ağır harici kütüphaneler (`react`, `react-dom`, `lucide-react`, `marked`, `dompurify`) `vite.config.js` içinde bağımsız vendor chunk'larına ayrılmış, uzun süreli tarayıcı önbelleklemesi (HTTP cache) maksimize edilmiştir.

8. **Geçici QA & Demo Gecikme Aracı (`Header.jsx`, `demoDelay.js`)**:
   - Header çubuğuna eklenen `10s Test: ON/OFF` butonu ile asenkron katalog çekme servisine yapay 10 saniyelik gecikme eklenerek ilk açılış yükleyicisinin rahatça incelenmesi sağlanır.

### Güvenlik Mimarisi ve Koruma Katmanları

İstemci tarafı kod enjeksiyonları, yetkisiz erişimler ve oltalama açıklarına karşı şu güvenlik mekanizmaları devreye alınmıştır:

1. **XSS Dezenfeksiyon Motoru (`DOMPurify`)**:
   - Kullanıcıların ve araçların sağladığı tüm Markdown içerikleri (sürüm notları, belgeler, incelemeler) `marked` tarafından derlendikten sonra `DOMPurify` tabanlı `sanitizeHtml()` süzgecinden geçirilir.
   - `<script>`, `<iframe>`, `onerror`, `onload` gibi zararlı etiket ve nitelikler tamamen ayıklanır.

2. **Harici Bağlantı Güvenliği & Tabnabbing Savunması**:
   - Araç bağlantıları, üretici web siteleri ve şikayet bağlantıları `sanitizeUrl()` denetiminden geçer.
   - `javascript:`, `data:`, `vbscript:`, `file:` gibi tehlikeli URL şemaları engellenir; yalnızca `http:` ve `https:` protokollerine izin verilir.
   - Harici bağlantı pencereleri `safeOpenExternal()` ile `noopener,noreferrer` ve izole `opener` bağlamıyla açılır.

3. **İstemci Taraflı Yetkilendirme Kalkanı (`AdminRouteGuard`)**:
   - Komuta merkezine (`?view=admin`) yönelik doğrudan URL aramalarında oturum ve rol denetimi yapılır.
   - `admin` veya `moderator` rolü taşımayan kullanıcılar için yönetim verileri gizlenir ve 403 Yetkisiz Erişim kalkanı sunulur.

4. **Girdi Temizleme ve Şema Dezenfeksiyonu**:
   - Araç gönderme formu ve kullanıcı profili güncellemelerinde `sanitizePlainText()` yardımıyla HTML etiketleri kırpılır, bellek şişirme girişimleri sınırlandırılır.

5. **İçerik Güvenlik Politikası (Content Security Policy - CSP)**:
   - `index.html` içerisindeki `<meta http-equiv="Content-Security-Policy">` başlığı ile yalnızca yetkilendirilmiş kaynaklardan stil, font, görsel ve WebSocket bağlantısına izin verilir (`frame-ancestors 'none'`).

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

Derlenmiş ve optimize edilmiş statik dosyalar `dist/` klasörüne aktarılır. Derleme hattı otomatik olarak şunları yürütür:
- **Sharp & SVGO Görsel Optimizasyonu**: Kayıpsız SVG ve sıkıştırılmış WebP/PNG/JPEG optimizasyonu (yaklaşık %57 dosya boyutu tasarrufu).
- **Çift Ön Sıkıştırma (Brotli & Gzip)**: Canlı ortam ters vekil sunucuları (Nginx, Caddy, Cloudflare vb.) için anlık yükleme sağlayan `.br` ve `.gz` statik çıktıları.

## Lisans

Bu proje MIT Lisansı ile lisanslanmıştır — ayrıntılar için [LICENSE](LICENSE) dosyasına bakabilirsiniz.

Copyright (c) 2026 **TahsinCr**. Tüm hakları saklıdır.
