import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Card, SelectField, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppStore } from '@/stores/app-store';
import type { AppLanguage } from '@/stores/app-store';
import type { ThemePreference } from '@/theme/theme';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, preference } = useAppTheme();
  const setTheme = useAppStore((s) => s.setThemePreference);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const mode = useAppStore((s) => s.mode);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const clearMode = useAppStore((s) => s.signOut);
  const { session, signOut } = useAuth();
  const [accountAction, setAccountAction] = useState<'sign-out' | null>(null);
  const doSignOut = async () => {
    if (accountAction) return;
    setAccountAction('sign-out');
    try {
      const result = mode === 'authenticated' ? await signOut() : null;
      if (mode !== 'authenticated') clearMode();
      router.replace('/(auth)/sign-in');
      if (result?.remoteSignOutFailed)
        Alert.alert(t('settings.localSignOutTitle'), t('settings.localSignOutDescription'));
    } catch {
      Alert.alert(t('common.error'), t('auth.genericError'));
    } finally {
      setAccountAction(null);
    }
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
          value={language}
          onChange={(value) => setLanguage(value as AppLanguage)}
          options={[
            { value: 'tr', label: t('settings.turkish') },
            { value: 'en', label: t('settings.english') },
          ]}
        />
      </Card>
      <Card>
        <AppText variant="subtitle">{t('settings.account')}</AppText>
        <AppText style={{ color: colors.textMuted }}>
          {mode === 'guest' ? t('settings.guestAccount') : (session?.user.email ?? t('auth.email'))}
        </AppText>
        <View style={{ gap: spacing.sm }}>
          {mode === 'guest' && (
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
          )}
          <Button
            variant="danger"
            label={t('settings.signOut')}
            icon="logout"
            loading={accountAction === 'sign-out'}
            disabled={accountAction !== null}
            onPress={() => void doSignOut()}
          />
        </View>
      </Card>
      <Card>
        <AppText variant="subtitle">{t('settings.privacy')}</AppText>
        <View style={{ gap: spacing.sm }}>
          <Button
            variant="secondary"
            label={t('legal.privacyTitle')}
            icon="shield-lock-outline"
            onPress={() => router.push('/privacy')}
          />
          <Button
            variant="secondary"
            label={t('legal.deleteTitle')}
            icon="account-remove-outline"
            onPress={() => router.push('/delete-account')}
          />
        </View>
      </Card>
      <AppText variant="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
        {t('settings.about')}
      </AppText>
    </Screen>
  );
}
