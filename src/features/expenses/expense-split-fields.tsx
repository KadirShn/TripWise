import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AppText, Avatar, Card, TextField } from '@/components/ui';
import type { SplitMethod, TripMember } from '@/types/domain';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

interface ExpenseSplitFieldsProps {
  members: TripMember[];
  method: SplitMethod;
  selected: string[];
  exactValues: Record<string, string>;
  percentValues: Record<string, string>;
  onToggle: (memberId: string) => void;
  onExactChange: (memberId: string, value: string) => void;
  onPercentChange: (memberId: string, value: string) => void;
}

export function ExpenseSplitFields({
  members,
  method,
  selected,
  exactValues,
  percentValues,
  onToggle,
  onExactChange,
  onPercentChange,
}: ExpenseSplitFieldsProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <Card>
      <AppText variant="subtitle">{t('dashboard.participants')}</AppText>
      {members.map((member) => {
        const active = selected.includes(member.id);
        return (
          <View key={member.id} style={{ gap: spacing.sm }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={member.displayName}
              accessibilityState={{ checked: active }}
              onPress={() => onToggle(member.id)}
              style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <Avatar name={member.displayName} size={36} />
              <AppText variant="label" style={{ flex: 1 }}>
                {member.displayName}
              </AppText>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {active ? <AppText style={{ color: colors.onPrimary }}>✓</AppText> : null}
              </View>
            </Pressable>
            {active && method === 'exact' ? (
              <TextField
                label={t('expenses.shareFor', { name: member.displayName })}
                value={exactValues[member.id] ?? ''}
                onChangeText={(value) => onExactChange(member.id, value)}
                keyboardType="decimal-pad"
              />
            ) : null}
            {active && method === 'percentage' ? (
              <TextField
                label={t('expenses.percentFor', { name: member.displayName })}
                value={percentValues[member.id] ?? ''}
                onChangeText={(value) => onPercentChange(member.id, value)}
                keyboardType="decimal-pad"
              />
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}
