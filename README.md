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
- TripWise marka ikonu, Android adaptive/monochrome ikonları ve markalı splash ekranı
- Uygulama ve web ile uyumlu Gizlilik Politikası ve Hesap/Veri Silme sayfaları
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
2. Yeni projede `supabase/migrations` klasöründeki migration dosyalarını dosya adı sırasıyla çalıştırın. Supabase CLI kullanıyorsanız proje bağlantısından sonra `npx supabase db push` tüm migration'ları doğru sırada uygular.
   - Mevcut bir TripWise veritabanını sağlamlaştırmak için en az [`202607310003_data_integrity_hardening.sql`](supabase/migrations/202607310003_data_integrity_hardening.sql) dosyasını SQL Editor'da bir kez çalıştırın.
   - Bu migration harcama ve payları tek transaction içinde kaydeden `upsert_expense_with_splits` RPC'sini, çapraz-gezi üyelik kontrollerini ve ertelenmiş toplam doğrulamalarını kurar.
   - [`202608010001_account_deletion_cleanup.sql`](supabase/migrations/202608010001_account_deletion_cleanup.sql), başka gezilerdeki kullanıcı katkılarının hesap silmeyi engellememesi için silme öncesi temizleme RPC'sini kurar.
3. Authentication > Providers bölümünde Email sağlayıcısını etkinleştirin. Geliştirme sırasında e-posta doğrulamasını tercihinize göre açın veya kapatın.
4. Authentication > URL Configuration bölümüne mobil yönlendirme için `tripwise://**` ekleyin.
5. Project Settings > API bölümündeki Project URL ve publishable/anon anahtarını `.env.local` içine yazın:

```env
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

6. Metro'yu environment değişikliğinden sonra `pnpm start --clear` ile yeniden başlatın.

### Hesap silme Edge Function

Mobil uygulama [`supabase/functions/delete-account/index.ts`](supabase/functions/delete-account/index.ts) fonksiyonunu çağırır. Fonksiyon yalnızca geçerli kullanıcı JWT'sini kabul eder ve kullanıcıyı kendi kimliği üzerinden siler. Service-role/secret anahtarı mobil uygulamaya eklenmez.

Supabase CLI ile projeyi bağladıktan sonra:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy delete-account
```

Yeni migration uygulandıktan sonra Edge Function'ı yeniden deploy edin. Fonksiyon önce kullanıcının kendi yetkisiyle `prepare_account_deletion` RPC'sini çalıştırır, ardından yalnızca sunucudaki admin istemcisiyle Auth kullanıcısını siler.

`supabase/config.toml` içinde JWT doğrulaması açıktır. Supabase'in otomatik sağladığı sunucu secret'larını `.env.local` içine kopyalamayın.

### İki kullanıcılı RLS doğrulaması

Supabase Authentication bölümünde doğrulanmış iki ayrı test hesabı oluşturun. Ardından yalnızca açık PowerShell oturumu için aşağıdaki değişkenleri tanımlayın:

```powershell
$env:SUPABASE_TEST_URL="https://PROJECT_REF.supabase.co"
$env:SUPABASE_TEST_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
$env:SUPABASE_TEST_USER_A_EMAIL="owner-a@example.com"
$env:SUPABASE_TEST_USER_A_PASSWORD="TEST_PASSWORD_A"
$env:SUPABASE_TEST_USER_B_EMAIL="viewer-b@example.com"
$env:SUPABASE_TEST_USER_B_PASSWORD="TEST_PASSWORD_B"
pnpm test:rls
```

Test; özel gezilerin diğer hesaba görünmediğini, üyelerin okuyabildiğini, `viewer` rolünün yazamadığını ve hatalı harcama transaction'ının geride yarım kayıt bırakmadığını doğrular. Test verileri sonunda silinir. Bu test şifrelerini dosyaya kaydetmeyin.

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
- Sunucu sorgu önbelleği kullanıcı kimliğiyle ayrılır, hesap değişiminde eski kullanıcı verisi temizlenir ve bozuk cache güvenle sıfırlanır.
- Ayarlardaki hesap silme işlemi JWT korumalı `delete-account` Edge Function'ına bağlıdır. Fonksiyon deploy edilmeden buton güvenli biçimde hata gösterir.
- Gizlilik politikası `/privacy`, hesap ve veri silme açıklaması `/delete-account` rotasındadır. Expo web çıktısı yayımlandığında mağaza formlarında bu rotaların herkese açık HTTPS adresleri kullanılabilir.

## Bilinen MVP sınırlamaları

- Canlı çok-kullanıcılı senkronizasyon yoktur; ekran yeniden açılışında/signed-in hydration sırasında güncel snapshot alınır.
- Otomatik döviz kuru yoktur. Ana para biriminden farklı harcamalarda kur kullanıcı tarafından girilir.
- Authenticated çevrimdışı mutasyon kuyruğu yoktur; veri kaybını önlemek için mutasyon sunucu başarısından sonra yerel görünüme uygulanır.
- Hesap silme Edge Function'ının her Supabase ortamına deploy edilmesi manuel release adımıdır.
- Bildirim, QR davet, OCR, dışa aktarma, reklam, abonelik ve production AI özellikleri MVP dışındadır; ayrıntılar [`BACKLOG.md`](BACKLOG.md) içindedir.
