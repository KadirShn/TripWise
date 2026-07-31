# TripWise

TripWise, grup seyahatleri için Android öncelikli, iOS uyumlu bir Expo React Native gider paylaşımı ve günlük rota uygulamasıdır. Arayüzün varsayılan dili Türkçedir. Supabase yapılandırması olmadan uygulama çökmez; tamamen yerel ve kalıcı örnek verilerle demo modunda çalışır.

## MVP ekranları ve özellikleri

- İlk açılış onboarding akışı
- Supabase e-posta/şifre ile kayıt, giriş ve şifre sıfırlama
- Kalıcı, yerel “Demo modu” ve gerçekçi Kapadokya örnek gezisi
- Gezi oluşturma, düzenleme, silme ve bütçe özeti
- Katılımcı yönetimi
- Harcama CRUD; eşit, kesin tutar ve yüzde bölüşümü
- Integer minor-unit para modeli, çoklu para birimi için elle girilen ana-kur değeri
- Katılımcı bakiyeleri ve deterministik sadeleştirilmiş ödeme planı
- Günlük rota CRUD ve tahmini maliyet
- Açık/koyu/sistem teması, Türkçe/İngilizce altyapısı
- SQLite tabanlı yerel kalıcılık, React Query önbellek kalıcılığı ve çevrimdışı uyarısı
- Supabase PostgreSQL migration, kısıtlar, indeksler ve tüm kullanıcı tablolarında RLS

## Teknik yığın

- Expo SDK 57, React Native 0.86, TypeScript strict, Expo Router
- Supabase Auth/PostgreSQL
- TanStack Query, Zustand
- React Hook Form, Zod
- `expo-sqlite`, `expo-secure-store`, `expo-localization`
- i18next, date-fns
- Jest, React Native Testing Library, ESLint, Prettier

## Gereksinimler (Windows 11)

- Node.js 20.19.4 veya üzeri
- npm 10+ veya Corepack/pnpm
- Android için Android Studio ve çalışan bir emulator; alternatif olarak SDK 57 destekleyen Expo Go/dev client
- Supabase özellikleri için bir Supabase projesi

## Yerel kurulum

PowerShell'de repository kökünde:

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env.local
pnpm start
```

Metro arayüzünde `a` tuşu Android emulatorünü açar. Doğrudan:

```powershell
pnpm android
```

Bu proje özel native modül içermez; önce Expo Go ile çalıştırılabilir. Geliştirme build'i gerektiğinde:

```powershell
npx eas-cli@latest build --profile development --platform android
```

## Supabase kurulumu

1. Supabase Dashboard'da yeni bir proje oluşturun.
2. SQL Editor'da [`supabase/migrations/202607310001_initial_schema.sql`](supabase/migrations/202607310001_initial_schema.sql) dosyasının tamamını çalıştırın. Supabase CLI kullanıyorsanız proje bağlantısından sonra `npx supabase db push` da kullanılabilir.
3. Authentication > Providers bölümünde Email sağlayıcısını etkinleştirin. Geliştirme sırasında e-posta doğrulamasını tercihinize göre açın veya kapatın.
4. Authentication > URL Configuration bölümüne mobil yönlendirme için `tripwise://**` ekleyin.
5. Project Settings > API bölümündeki Project URL ve publishable/anon anahtarını `.env.local` içine yazın:

```env
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

6. Metro'yu environment değişikliğinden sonra `pnpm start --clear` ile yeniden başlatın.

Mobil uygulamaya service-role anahtarı konulmamalıdır. `EXPO_PUBLIC_*` değerleri uygulama paketinde görülebilir; yalnızca RLS ile sınırlandırılmış publishable/anon anahtarı kullanılır.

## Kalite komutları

Şartnamedeki komutlar:

```powershell
npx expo-doctor
npm run lint
npm run typecheck
npm test -- --runInBand
```

pnpm karşılıkları:

```powershell
pnpm exec expo-doctor
pnpm lint
pnpm typecheck
pnpm test --runInBand
```

## EAS build

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile production --platform android
```

Android paket adı `app.json` içindeki `expo.android.package` alanında, iOS kimliği ekleneceğinde aynı dosyada tutulur. Mevcut scheme `tripwise`'dır.

## Veri, çevrimdışı davranış ve gizlilik

- Demo verisi cihazdaki SQLite-backed key/value depoda tutulur ve Supabase'e gönderilmez.
- Supabase oturum belirteçleri native platformlarda SecureStore'da tutulur.
- Sunucu sorgu önbelleği cihazda kalıcıdır. Çevrimdışıyken önbellek gösterilir; doğrulanamayan authenticated mutasyonlar uygulanmaz ve form içeriği ekranda korunur.
- Ayarlardaki hesap silme girişi kullanıcıyı bilgilendirir. Production yayınından önce, doğrulanmış kullanıcı için `auth.admin.deleteUser` çağıran service-role korumalı bir Edge Function ve destek/yeniden-kimlik-doğrulama akışı kurulmalıdır. Service-role anahtarı uygulamaya eklenmez.

## Bilinen MVP sınırlamaları

- Canlı çok-kullanıcılı senkronizasyon yoktur; ekran yeniden açılışında/signed-in hydration sırasında güncel snapshot alınır.
- Otomatik döviz kuru yoktur. Ana para biriminden farklı harcamalarda kur kullanıcı tarafından girilir.
- Authenticated çevrimdışı mutasyon kuyruğu yoktur; veri kaybını önlemek için mutasyon sunucu başarısından sonra yerel görünüme uygulanır.
- Hesap silme için production Edge Function/deployment adımı uygulama dışında manuel olarak kurulmalıdır.
- Bildirim, QR davet, OCR, dışa aktarma, reklam, abonelik ve production AI özellikleri MVP dışındadır; ayrıntılar [`BACKLOG.md`](BACKLOG.md) içindedir.
