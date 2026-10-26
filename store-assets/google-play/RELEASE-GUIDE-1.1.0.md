# TripWise 1.1.0 — Google Play yayın rehberi

Adımları bu sırayla uygulayın. 1.1.0 istemcisi yeni Supabase RPC'lerine ihtiyaç duyar, migration ise 1.0 istemcileriyle uyumludur. Bu yüzden önce veritabanı, sonra uygulama güncellenir.

## 1. Kodu main'e alın

`feature/v1.1-updates` PR'ını inceleyip `main`'e merge edin ve yerelde `main`'e geçin:

```powershell
git checkout main
git pull
pnpm install
```

## 2. Supabase'i güncelleyin

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase functions deploy delete-account
```

İsteğe bağlı doğrulama (iki test hesabıyla, README'deki ortam değişkenleri ayarlıyken):

```powershell
pnpm test:rls
```

## 3. EAS ortam değişkenlerini kontrol edin

```powershell
npx eas-cli@latest login
npx eas-cli@latest env:list --environment production
```

`EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` listede olmalıdır. Eksikse ekleyin:

```powershell
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://PROJECT_REF.supabase.co" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "YOUR_PUBLISHABLE_KEY" --visibility plaintext
```

## 4. .aab üretin

```powershell
npx eas-cli@latest build --platform android --profile production
```

- `production` profili Google Play için `.aab` üretir.
- `appVersionSource: remote` ve `autoIncrement: true` ayarlı olduğu için `versionCode` EAS tarafından otomatik artırılır. Elle değiştirmeyin.
- Uygulama imzası EAS'te saklanan upload anahtarıyla yapılır; 1.0.0'ı da EAS ile yüklediyseniz aynı anahtar kullanılır.
- Build bitince terminaldeki veya expo.dev'deki linkten `.aab` dosyasını indirin.

> Bu sürüm yeni native modüller içerir (`expo-print`, `expo-sharing`, `expo-file-system`). OTA güncelleme yetmez, yeni build gerekir.

## 5. Play Console'a yükleyin

### Seçenek A: elle yükleme

1. Play Console → TripWise → **Test ve yayınlama → Üretim** (önce denemek isterseniz **Kapalı test** veya **Dahili test**).
2. **Yeni sürüm oluştur** → indirdiğiniz `.aab` dosyasını yükleyin.
3. Sürüm adı otomatik olarak `1.1.0 (versionCode)` gelir.
4. Sürüm notlarına `release-notes-1.1.0.md` içindeki `tr-TR` ve `en-US` metinlerini yapıştırın.
5. **Sonraki** → uyarıları gözden geçirin → **Üretime yayınla**. Kademeli dağıtım (ör. %20) ile başlamak riski azaltır.

### Seçenek B: EAS Submit

Play Console'da bir servis hesabı JSON anahtarı oluşturduysanız:

```powershell
npx eas-cli@latest submit --platform android --latest
```

## 6. Mağaza girişini güncelleyin

**Mağaza varlığı → Ana mağaza girişi → Telefon ekran görüntüleri**: `phone/` klasöründeki 1080×1920 görüntüleri sırasıyla yükleyin (en az 2, en fazla 8).

Kısa açıklama önerisi (80 karakter sınırı):

> Grup gezilerinde harcamaları böl, borçları kapat, rotanı arkadaşlarınla planla.

## 7. Veri güvenliği formunu gözden geçirin

**Uygulama içeriği → Veri güvenliği**: 1.1.0 ile değişenler:

- Gezi verileri artık davet koduyla katılan diğer kullanıcılara görünür (kullanıcının başlattığı paylaşım).
- "Güncel kuru getir" yalnızca para birimi kodlarını Frankfurter servisine gönderir; kişisel veri gönderilmez.
- Dışa aktarılan dosyalar yalnızca kullanıcının seçtiği uygulamayla paylaşılır.

Uygulama içindeki gizlilik politikası bu değişikliklerle güncellendi. Play Console'da harici bir gizlilik politikası URL'si kullanıyorsanız onu da güncelleyin.
