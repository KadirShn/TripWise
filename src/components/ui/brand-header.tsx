import { Image } from 'expo-image';
import { View } from 'react-native';
import { AppText } from './app-text';
import { radius, spacing } from '@/theme/theme';

const brandIcon = require('../../../assets/brand/tripwise-icon.png');

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <Image
      accessibilityLabel="TripWise"
      source={brandIcon}
      contentFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: size >= 56 ? radius.md : Math.max(8, Math.round(size * 0.28)),
      }}
    />
  );
}

export function BrandHeader({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <BrandMark />
      <AppText variant="subtitle" numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );
}
