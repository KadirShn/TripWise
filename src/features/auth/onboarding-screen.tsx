import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, Badge, Button, Card, Screen } from '@/components/ui';
import { useAppStore } from '@/stores/app-store';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const complete = useAppStore((state) => state.completeOnboarding);
  const { colors } = useAppTheme();
  const features = [
    ['scale-balance', t('onboarding.featureExpenses')],
    ['cloud-off-outline', t('onboarding.featureOffline')],
    ['map-clock-outline', t('onboarding.featureItinerary')],
  ] as const;
  return (
    <Screen
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingTop: 72 }}
    >
      <View style={{ gap: spacing.xl }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: radius.lg,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ rotate: '-4deg' }],
          }}
        >
          <MaterialCommunityIcons name="compass-outline" size={42} color={colors.onPrimary} />
        </View>
        <Badge label={t('onboarding.eyebrow')} />
        <AppText variant="display">{t('onboarding.title')}</AppText>
        <AppText style={{ color: colors.textMuted }}>{t('onboarding.description')}</AppText>
        <Card>
          {features.map(([icon, label]) => (
            <View
              key={icon}
              style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
              <AppText variant="label" style={{ flex: 1 }}>
                {label}
              </AppText>
            </View>
          ))}
        </Card>
      </View>
      <Button
        label={t('onboarding.getStarted')}
        icon="arrow-right"
        onPress={() => {
          complete();
          router.replace('/(auth)/sign-in');
        }}
      />
    </Screen>
  );
}
