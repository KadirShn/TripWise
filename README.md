<div align="center">
  <img src="assets/brand/tripwise-icon.png" width="120" alt="TripWise uygulama ikonu" />

# TripWise

**Grup seyahatlerinde rotayı, bütçeyi ve ortak harcamaları tek yerde yönetin.**

[![Quality](https://github.com/KadirShn/TripWise/actions/workflows/quality.yml/badge.svg)](https://github.com/KadirShn/TripWise/actions/workflows/quality.yml)
![Expo SDK 57](https://img.shields.io/badge/Expo%20SDK-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=18243A)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-43C6A5.svg)](LICENSE)

Android öncelikli · iOS uyumlu mimari · Türkçe varsayılan arayüz
</div>

---

TripWise, arkadaş gruplarının ve ailelerin gezi planlarken en çok zorlandığı iki alanı bir araya getirir: **günlük rota planlama** ve **ortak harcamaları adil biçimde bölüştürme**. Uygulama Supabase hesabıyla çevrimiçi çalışabilir veya herhangi bir sunucu kurulumu olmadan kalıcı demo modunda uçtan uca denenebilir.

## Öne çıkanlar

|     | Özellik                   | Açıklama                                                                                     |
| --- | ------------------------- | -------------------------------------------------------------------------------------------- |
| 🧭  | Gezi ve rota planlama     | Gezileri, katılımcıları ve gün gün aktiviteleri tek akışta yönetin.                          |
| 💸  | Güvenilir gider paylaşımı | Eşit, kesin tutar ve yüzde yöntemleriyle harcamaları minor unit hassasiyetinde bölüştürün.   |
| ⚖️  | Sade ödeme planı          | Katılımcı bakiyelerini hesaplayın ve borçları deterministik olarak en az transfere indirin.  |
| 📶  | Çevrimdışı dayanıklılık   | Önbelleğe alınmış gezi verilerini görüntüleyin; başarısız kayıtlarda form içeriğini koruyun. |
| 🎒  | Hazır demo deneyimi       | Supabase anahtarı olmadan gerçekçi Türkçe örnek veriyle uygulamayı hemen keşfedin.           |
| 🔐  | Kullanıcı bazlı güvenlik  | Supabase RLS, kullanıcıya ayrılmış cache ve JWT korumalı hesap silme akışı kullanın.         |

## MVP kapsamı

- Onboarding, e-posta/şifre kaydı, giriş ve şifre sıfırlama
- E-posta doğrulama durumlarına uygun kullanıcı bilgilendirmesi
- Yerel ve kalıcı demo modu
- Gezi oluşturma, düzenleme, silme ve bütçe özeti
- Katılımcı yönetimi
- Harcama CRUD ve üç farklı bölüştürme yöntemi
- Bakiye hesabı ve sadeleştirilmiş ödeme planı
- Günlük rota ve tahmini aktivite maliyetleri
- Harcama kategori özeti ve bütçe ilerlemesi
- Açık, koyu ve sistem teması
- Türkçe ve İngilizce çeviri altyapısı
- Çevrimdışı, yükleniyor, boş, hata ve yeniden deneme durumları
- Gizlilik politikası ve hesap/veri silme ekranları
- Android adaptive/monochrome ikonları ve markalı splash ekranı

## Tasarım yaklaşımı

TripWise, klasik kurumsal finans uygulamalarından ayrılan seyahat odaklı bir tasarım sistemi kullanır. Sıcak günlük zemini; pasaport laciverti, mercan, gökyüzü, güneş, mor ve mint renkleriyle tamamlanır. Bento özet alanları, gezi posterleri ve zaman çizelgesi biçimindeki rota kartları hem açık hem koyu temada çalışır.

## Teknik yapı

- **Uygulama:** Expo SDK 57, React Native 0.86, Expo Router
- **Dil:** TypeScript strict mode
- **Backend:** Supabase Auth ve PostgreSQL
- **Sunucu durumu:** TanStack Query
- **Yerel durum:** Zustand
- **Formlar:** React Hook Form ve Zod
- **Yerel veri:** expo-sqlite ve SecureStore
- **Yerelleştirme:** i18next, expo-localization ve date-fns
- **Test:** Jest ve React Native Testing Library
- **Kalite:** ESLint, Prettier, Expo Doctor ve GitHub Actions

```text
src/
├── app/                 # Expo Router rotaları
├── components/ui/       # Tasarım sistemi bileşenleri
├── features/            # Auth, geziler, harcamalar, rota ve ayarlar
├── lib/                 # Supabase, query, storage ve i18n altyapısı
├── stores/              # Küçük istemci/UI durumları
├── theme/               # Açık/koyu tema tokenları
├── types/               # Merkezi domain ve veritabanı tipleri
└── utils/               # Para, tarih ve ödeme algoritmaları

supabase/
├── functions/           # Hesap silme Edge Function
└── migrations/          # Şema, RLS ve veri bütünlüğü migration'ları
```

## Hızlı başlangıç

### Gereksinimler

- Node.js 20.19.4 veya üzeri
- pnpm 11
- Android Studio ve Android SDK veya Expo Go
- Supabase özellikleri için isteğe bağlı bir Supabase projesi

### Kurulum

```powershell
git clone https://github.com/KadirShn/TripWise.git
cd TripWise
corepack enable
pnpm install
Copy-Item .env.example .env.local
pnpm start --clear
```

Supabase değişkenlerini boş bırakırsanız uygulama çökmez; **Demo modu** ile açılır.

Android development build için:

```powershell
pnpm android
```

Android SDK yolu otomatik bulunamazsa `android/local.properties` dosyasına kendi SDK dizininizi yazın:

```properties
sdk.dir=C:\\Users\\KULLANICI_ADI\\AppData\\Local\\Android\\Sdk
```

## Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayın:

```env
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

> [!IMPORTANT]
> Mobil uygulamaya hiçbir zaman Supabase `service_role` anahtarı koymayın. `EXPO_PUBLIC_*` değerleri uygulama paketinden görülebilir; yalnızca RLS ile sınırlandırılmış publishable/anon anahtarı kullanın.

## Supabase kurulumu

1. Supabase Dashboard’dan yeni bir proje oluşturun.
2. Authentication → Providers bölümünde **Email** sağlayıcısını etkinleştirin.
3. Authentication → URL Configuration alanına `tripwise://**` yönlendirmesini ekleyin.
4. Project URL ve publishable anahtarını `.env.local` içine yazın.
5. CLI ile projeyi bağlayıp migration’ları uygulayın:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Migration’lar şu güvenlik ve bütünlük katmanlarını kurar:

- Tüm kullanıcı tablolarında Row Level Security
- Gezi sahipliği ve üye rolü kontrolleri
- Harcama ile paylarını tek transaction içinde kaydeden RPC
- Katılımcı, harcama ve bölüşüm satırlarında aynı gezi doğrulaması
- Yeni kullanıcı için profil oluşturma trigger’ı
- Hesap silme öncesi ilişkili verileri güvenle hazırlayan RPC

### Hesap silme fonksiyonu

```powershell
npx supabase functions deploy delete-account
```

[`delete-account`](supabase/functions/delete-account/index.ts) fonksiyonu geçerli kullanıcı JWT’sini doğrular. Auth kullanıcısını silmek için gereken yetkili anahtar yalnızca Supabase sunucu ortamında kalır.

### RLS entegrasyon testi

İki doğrulanmış Supabase test hesabı oluşturduktan sonra yalnızca açık terminal oturumunda:

```powershell
$env:SUPABASE_TEST_URL="https://PROJECT_REF.supabase.co"
$env:SUPABASE_TEST_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
$env:SUPABASE_TEST_USER_A_EMAIL="owner-a@example.com"
$env:SUPABASE_TEST_USER_A_PASSWORD="TEST_PASSWORD_A"
$env:SUPABASE_TEST_USER_B_EMAIL="viewer-b@example.com"
$env:SUPABASE_TEST_USER_B_PASSWORD="TEST_PASSWORD_B"
pnpm test:rls
```

Test; özel gezilerin hesaplar arasında sızmadığını, üye rollerini ve başarısız transaction’ın yarım veri bırakmadığını doğrular. Test parolalarını dosyaya kaydetmeyin.

## Kalite kontrolleri

```powershell
npx expo-doctor
pnpm run lint
pnpm run typecheck
pnpm test -- --runInBand
pnpm run format:check
```

Finansal testler; minor unit para işlemlerini, küsurat dağıtımını, yüzde ve kesin tutar kontrollerini, çoklu para birimi dönüşümünü, bakiye hesabını ve borç sadeleştirmeyi kapsar.

## Android production build

EAS projesi bağlandıktan ve production ortam değişkenleri EAS’e eklendikten sonra:

```powershell
npx eas-cli@latest env:list --environment production
npx eas-cli@latest build --platform android --profile production
```

`production` profili Google Play için `.aab` üretir ve `versionCode` değerini otomatik artırır. Önizleme APK’sı için:

```powershell
npx eas-cli@latest build --platform android --profile preview
```

## Veri ve güvenlik yaklaşımı

- Para değerleri canonical olarak integer minor unit biçiminde saklanır.
- Finansal hesaplamalar saf, deterministik ve test edilmiştir.
- Supabase sorguları UI bileşenlerinin dışında repository katmanında tutulur.
- Query cache kullanıcı kimliğine göre ayrılır ve hesap değişiminde temizlenir.
- Authenticated çevrimdışı mutasyonlar sessizce uygulanmaz; kullanıcı girdisi korunur.
- Demo verileri cihazda yerel kalır ve Supabase’e gönderilmez.
- Gerçek secret’lar repoya dahil edilmez.

## Bilinen MVP sınırları

- Canlı çok kullanıcılı eşzamanlı düzenleme bulunmaz.
- Otomatik döviz kuru servisi yoktur; kur kullanıcı tarafından girilir.
- Authenticated çevrimdışı mutasyon kuyruğu yoktur.
- Push notification, QR davet, OCR, dışa aktarma, reklam ve abonelik MVP dışındadır.

Planlanan ancak henüz uygulanmayan özellikler için [`BACKLOG.md`](BACKLOG.md) dosyasına bakın.

## Katkıda bulunma

Katkılar için geliştirme ortamı, branch ve doğrulama beklentileri [`CONTRIBUTING.md`](CONTRIBUTING.md) dosyasında açıklanmıştır.

## Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
