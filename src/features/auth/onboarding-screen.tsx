import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, BrandMark, Button, Screen, TravelHero } from '@/components/ui';
import { useAppStore } from '@/stores/app-store';
import { spacing } from '@/theme/theme';
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
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingTop: 32 }}
    >
      <View style={{ gap: spacing.xl }}>
        <TravelHero
          eyebrow={t('onboarding.eyebrow')}
          title={t('onboarding.title')}
          description={t('onboarding.description')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <BrandMark size={42} />
            <AppText variant="label" style={{ color: colors.onNavy }}>
              TripWise
            </AppText>
          </View>
        </TravelHero>
        <View style={{ gap: spacing.md }}>
          {features.map(([icon, label], index) => {
            const backgrounds = [colors.coralSoft, colors.skySoft, colors.violetSoft];
            const accents = [colors.coral, colors.primary, colors.violet];
            return (
              <View
                key={icon}
                style={{
                  minHeight: 72,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: 24,
                  backgroundColor: backgrounds[index],
                }}
              >
                <MaterialCommunityIcons name={icon} size={27} color={accents[index]} />
                <AppText variant="label" style={{ flex: 1 }}>
                  {label}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
      <Button
        label={t('onboarding.getStarted')}
        icon="arrow-right"
        style={{ backgroundColor: colors.coral }}
        onPress={() => {
          complete();
          router.replace('/(auth)/sign-in');
        }}
      />
    </Screen>
  );
}
