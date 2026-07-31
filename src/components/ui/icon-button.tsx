import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, type PressableProps } from 'react-native';
import { radius } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function IconButton({
  icon,
  accessibilityLabel,
  ...props
}: PressableProps & {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accessibilityLabel: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.pill,
        backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
      })}
      {...props}
    >
      <MaterialCommunityIcons name={icon} size={24} color={colors.text} />
    </Pressable>
  );
}
