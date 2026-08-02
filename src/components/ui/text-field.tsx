import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './app-text';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export const TextField = forwardRef<
  TextInput,
  TextInputProps & { label: string; error?: string; hint?: string }
>(function TextField({ label, error, hint, multiline, style, ...props }, ref) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const { onBlur, onFocus, ...inputProps } = props;
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          {
            minHeight: multiline ? 104 : 52,
            color: colors.text,
            backgroundColor: colors.surface,
            borderWidth: focused || error ? 2 : 1,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.border,
            borderRadius: radius.md,
            borderCurve: 'continuous',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            fontSize: 16,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...inputProps}
      />
      {error ? (
        <AppText
          variant="caption"
          accessibilityLiveRegion="polite"
          style={{ color: colors.danger }}
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" style={{ color: colors.textMuted }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});
