import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { AppText, Button, Card, SelectField, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { i18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import type { ThemePreference } from '@/theme/theme';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, preference } = useAppTheme();
  const setTheme = useAppStore((s) => s.setThemePreference);
  const mode = useAppStore((s) => s.mode);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const clearMode = useAppStore((s) => s.signOut);
  const { signOut } = useAuth();
  const doSignOut = async () => {
    if (mode === 'authenticated') await signOut();
    else clearMode();
    router.replace('/(auth)/sign-in');
  };
  return (
    <Screen>
      <Card>
        <AppText variant="subtitle">{t('settings.appearance')}</AppText>
        <SelectField
          label={t('settings.appearance')}
          value={preference}
          onChange={(value) => setTheme(value as ThemePreference)}
          options={[
            { value: 'system', label: t('settings.system') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
      </Card>
      <Card>
        <AppText variant="subtitle">{t('settings.language')}</AppText>
        <SelectField
          label={t('settings.language')}
          value={i18n.language === 'en' ? 'en' : 'tr'}
          onChange={(value) => void i18n.changeLanguage(value)}
          options={[
            { value: 'tr', label: t('settings.turkish') },
            { value: 'en', label: t('settings.english') },
          ]}
        />
      </Card>
      <Card>
        <AppText variant="subtitle">{t('settings.account')}</AppText>
        <AppText style={{ color: colors.textMuted }}>
          {mode === 'guest' ? t('settings.guestAccount') : t('auth.email')}
        </AppText>
        <View style={{ gap: spacing.sm }}>
          {mode === 'guest' ? (
            <>
              <Button
                variant="secondary"
                label={t('demo.reset')}
                icon="restore"
                onPress={resetDemo}
              />
              <Button
                label={t('demo.convert')}
                onPress={() => {
                  clearMode();
                  router.push('/(auth)/sign-up');
                }}
              />
            </>
          ) : (
            <Button
              variant="secondary"
              label={t('auth.deleteAccount')}
              icon="account-remove-outline"
              onPress={() => Alert.alert(t('auth.deleteAccount'), t('auth.deleteAccountInfo'))}
            />
          )}
          <Button
            variant="danger"
            label={t('settings.signOut')}
            icon="logout"
            onPress={() => void doSignOut()}
          />
        </View>
      </Card>
      <AppText variant="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
        {t('settings.about')}
      </AppText>
    </Screen>
  );
}
