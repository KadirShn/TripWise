import { Pressable, View } from 'react-native';
import { AppText } from './app-text';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}
export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  error?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label">{label}</AppText>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.surfaceMuted : colors.surface,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <AppText variant="label" style={{ color: selected ? colors.primary : colors.text }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
