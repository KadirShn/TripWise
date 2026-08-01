import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, Screen } from '@/components/ui';
import { LegalSection } from './legal-section';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

const sectionKeys = [
  'data',
  'guest',
  'usage',
  'sharing',
  'storage',
  'retention',
  'rights',
  'children',
  'changes',
  'contact',
] as const;

export function PrivacyScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
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
        <MaterialCommunityIcons name="shield-lock-outline" size={44} color={colors.primary} />
        <AppText variant="title" style={{ textAlign: 'center' }}>
          {t('legal.privacyTitle')}
        </AppText>
        <AppText style={{ color: colors.textMuted, textAlign: 'center' }}>
          {t('legal.privacyIntro')}
        </AppText>
        <AppText variant="caption" style={{ color: colors.textMuted }}>
          {t('legal.lastUpdated', { date: t('legal.lastUpdatedValue') })}
        </AppText>
      </View>
      {sectionKeys.map((key) => (
        <LegalSection
          key={key}
          title={t(`legal.sections.${key}.title`)}
          body={t(`legal.sections.${key}.body`)}
        />
      ))}
    </Screen>
  );
}
