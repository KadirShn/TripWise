import { View } from 'react-native';
import { AppText } from '@/components/ui';

export function TripCoverEmoji({ emoji, size = 56 }: { emoji: string; size?: number }) {
  const fontSize = Math.round(size * 0.66);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      <AppText
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          width: size,
          fontSize,
          lineHeight: size,
          textAlign: 'center',
        }}
      >
        {emoji}
      </AppText>
    </View>
  );
}
