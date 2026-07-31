import { View } from 'react-native';
import { AppText } from './app-text';
import { radius } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const { colors } = useAppTheme();
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR'))
    .join('');
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="label" style={{ color: colors.primary }}>
        {initials}
      </AppText>
    </View>
  );
}
