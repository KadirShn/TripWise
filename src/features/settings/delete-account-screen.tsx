import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppStore } from '@/stores/app-store';
import { LegalBulletList } from './legal-section';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const mode = useAppStore((state) => state.mode);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const { session, deleteAccount } = useAuth();
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState<'account' | 'demo' | null>(null);

  const accountItems = [
    t('legal.deleteConsequences.account'),
    t('legal.deleteConsequences.trips'),
    t('legal.deleteConsequences.shared'),
    t('legal.deleteConsequences.local'),
  ];

  const runAccountDeletion = async () => {
    if (pending) return;
    setPending(true);
    try {
      await deleteAccount();
      setCompleted('account');
    } catch {
      Alert.alert(t('common.error'), t('auth.deleteAccountError'));
    } finally {
      setPending(false);
    }
  };

  const confirmAccountDeletion = () =>
    Alert.alert(t('legal.deleteConfirmationTitle'), t('legal.deleteConfirmationBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('legal.deleteAction'),
        style: 'destructive',
        onPress: () => void runAccountDeletion(),
      },
    ]);

  const confirmDemoDeletion = () =>
    Alert.alert(t('legal.deleteDemoTitle'), t('legal.deleteDemoBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('legal.deleteDemoAction'),
        style: 'destructive',
        onPress: () => {
          resetDemo();
          setCompleted('demo');
        },
      },
    ]);

  if (completed)
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <MaterialCommunityIcons name="check-decagram" size={60} color={colors.success} />
          <AppText variant="title" style={{ textAlign: 'center' }}>
            {t(
              completed === 'account' ? 'legal.deleteSuccessTitle' : 'legal.deleteDemoSuccessTitle',
            )}
          </AppText>
          <AppText style={{ color: colors.textMuted, textAlign: 'center' }}>
            {t(completed === 'account' ? 'legal.deleteSuccessBody' : 'legal.deleteDemoSuccessBody')}
          </AppText>
          <Button
            label={completed === 'account' ? t('legal.goToSignIn') : t('status.goHome')}
            onPress={() =>
              router.replace(completed === 'account' ? '/(auth)/sign-in' : '/(tabs)/(trips)')
            }
          />
        </View>
      </Screen>
    );

  return (
    <Screen>
      <View
        style={{
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.xl,
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
        }}
      >
        <MaterialCommunityIcons name="account-remove-outline" size={44} color={colors.danger} />
        <AppText variant="title" style={{ textAlign: 'center' }}>
          {t('legal.deleteTitle')}
        </AppText>
        <AppText style={{ color: colors.textMuted, textAlign: 'center' }}>
          {t('legal.deleteIntro')}
        </AppText>
      </View>

      <Card>
        <AppText variant="subtitle">{t('legal.deleteConsequencesTitle')}</AppText>
        <LegalBulletList items={accountItems} />
      </Card>

      {mode === 'authenticated' && session ? (
        <Card>
          <AppText variant="subtitle">{t('legal.authenticatedTitle')}</AppText>
          <AppText style={{ color: colors.textMuted }}>
            {t('legal.authenticatedBody', { email: session.user.email ?? t('auth.email') })}
          </AppText>
          <Button
            variant="danger"
            icon="delete-forever-outline"
            label={t('legal.deleteAction')}
            loading={pending}
            disabled={pending}
            onPress={confirmAccountDeletion}
          />
        </Card>
      ) : mode === 'guest' ? (
        <Card>
          <AppText variant="subtitle">{t('legal.demoTitle')}</AppText>
          <AppText style={{ color: colors.textMuted }}>{t('legal.demoBody')}</AppText>
          <Button
            variant="danger"
            icon="database-remove-outline"
            label={t('legal.deleteDemoAction')}
            onPress={confirmDemoDeletion}
          />
        </Card>
      ) : (
        <Card>
          <AppText variant="subtitle">{t('legal.signedOutTitle')}</AppText>
          <AppText style={{ color: colors.textMuted }}>{t('legal.signedOutBody')}</AppText>
          <Button label={t('auth.signIn')} onPress={() => router.push('/(auth)/sign-in')} />
        </Card>
      )}

      <Button
        variant="ghost"
        icon="shield-lock-outline"
        label={t('legal.openPrivacy')}
        onPress={() => router.push('/privacy')}
      />
    </Screen>
  );
}
