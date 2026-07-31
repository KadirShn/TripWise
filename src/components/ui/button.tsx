import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { AppText } from './app-text';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  label,
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useAppTheme();
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.surfaceMuted
          : 'transparent';
  const color = variant === 'primary' || variant === 'danger' ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.md,
          borderCurve: 'continuous',
          backgroundColor,
          opacity: disabled || loading ? 0.5 : pressed ? 0.78 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      {...props}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {loading ? (
          <ActivityIndicator color={color} />
        ) : icon ? (
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        ) : null}
        <AppText variant="label" style={{ color }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}
