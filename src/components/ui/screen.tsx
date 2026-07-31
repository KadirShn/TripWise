import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  View,
} from 'react-native';
import { OfflineBanner } from './offline-banner';
import { DemoBanner } from './demo-banner';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function Screen({
  children,
  contentContainerStyle,
  scroll = true,
  ...props
}: PropsWithChildren<ScrollViewProps & { scroll?: boolean }>) {
  const { colors } = useAppTheme();
  const content = (
    <>
      <OfflineBanner />
      <DemoBanner />
      {children}
    </>
  );
  if (!scroll)
    return <View style={{ flex: 1, backgroundColor: colors.background }}>{content}</View>;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          { padding: spacing.lg, paddingBottom: 48, gap: spacing.lg },
          contentContainerStyle,
        ]}
        {...props}
      >
        {content}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
