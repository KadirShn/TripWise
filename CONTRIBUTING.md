# TripWise'a katkıda bulunma

Katkınız için teşekkürler. TripWise; finansal doğruluk, veri güvenliği ve erişilebilir kullanıcı deneyimini birlikte korumayı hedefler.

## Geliştirme ortamı

```powershell
git clone https://github.com/KadirShn/TripWise.git
cd TripWise
corepack enable
pnpm install
Copy-Item .env.example .env.local
pnpm start --clear
```

Supabase yapılandırması zorunlu değildir. Yerel UI ve finansal mantık değişiklikleri Demo modu ile geliştirilebilir.

## Çalışma akışı

1. Değişiklik için açıklayıcı bir branch oluşturun.
2. Kapsamı tek bir sorun veya özellik etrafında tutun.
3. Kullanıcı metinlerini doğrudan bileşenlere yazmak yerine i18n kaynaklarına ekleyin.
4. Finansal değerleri integer minor unit olarak kullanın.
5. Yeni finansal davranışlar için deterministik testler ekleyin.
6. PR açmadan önce kalite kontrollerini çalıştırın.

Örnek branch adları:

```text
feat/trip-sharing
fix/percentage-rounding
docs/supabase-setup
```

## Zorunlu kontroller

```powershell
npx expo-doctor
pnpm run lint
pnpm run typecheck
pnpm test --runInBand
pnpm run format:check
```

## Kod ilkeleri

- TypeScript strict kurallarını koruyun; `any` yerine `unknown` kullanıp daraltın.
- Route dosyalarını ince tutun; iş mantığını feature servislerinde veya saf yardımcı fonksiyonlarda yönetin.
- UI bileşenlerinden doğrudan Supabase sorgusu çalıştırmayın.
- RLS politikasını istemci kontrollerinin yerine geçen güvenlik sınırı olarak koruyun.
- Service-role anahtarlarını, gerçek `.env` dosyalarını veya test parolalarını commit etmeyin.
- Temel akışları yalnızca renkle anlatmayın ve dokunma hedeflerini erişilebilir tutun.

## Pull request içeriği

PR açıklamasında şunları belirtin:

- Sorun ve uygulanan çözüm
- Kullanıcıya görünen değişiklikler
- Çalıştırılan doğrulama komutları
- UI değişikliği varsa Android ekran görüntüsü
- Migration varsa mevcut projelere etkisi ve geri dönüş yaklaşımı
