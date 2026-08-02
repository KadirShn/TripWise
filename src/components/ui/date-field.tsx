import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format, isValid, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from './app-text';
import { TextField } from './text-field';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

interface DateFieldProps {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

const fallbackDate = () => new Date();
const parseValue = (value?: string) => {
  if (!value) return fallbackDate();
  const date = parseISO(value);
  return isValid(date) ? date : fallbackDate();
};
const serializeDate = (date: Date) => format(date, 'yyyy-MM-dd');

export function DateField({
  label,
  value,
  onChangeText,
  error,
  minimumDate,
  maximumDate,
  disabled,
}: DateFieldProps) {
  const { colors } = useAppTheme();
  const { i18n, t } = useTranslation();
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => parseValue(value));
  const selectedDate = parseValue(value);
  const formattedValue = value
    ? format(selectedDate, 'd MMMM yyyy', { locale: i18n.language === 'en' ? enUS : tr })
    : t('common.selectDate');

  const commit = (date: Date) => onChangeText?.(serializeDate(date));
  const openPicker = () => {
    if (disabled) return;
    if (process.env.EXPO_OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        minimumDate,
        maximumDate,
        onValueChange: (_event, date) => commit(date),
      });
      return;
    }
    setDraftDate(selectedDate);
    setShowIOSPicker(true);
  };

  if (process.env.EXPO_OS === 'web') {
    return (
      <TextField
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={error}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
      />
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => ({
          minHeight: 54,
          paddingHorizontal: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          opacity: disabled ? 0.55 : 1,
        })}
      >
        <AppText style={{ color: value ? colors.text : colors.textMuted }}>
          {formattedValue}
        </AppText>
        <MaterialCommunityIcons name="calendar-month-outline" size={22} color={colors.primary} />
      </Pressable>
      {error ? (
        <AppText
          variant="caption"
          accessibilityLiveRegion="polite"
          style={{ color: colors.danger }}
        >
          {error}
        </AppText>
      ) : null}

      {process.env.EXPO_OS === 'ios' ? (
        <Modal
          transparent
          animationType="fade"
          visible={showIOSPicker}
          onRequestClose={() => setShowIOSPicker(false)}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            onPress={() => setShowIOSPicker(false)}
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              padding: spacing.lg,
              backgroundColor: colors.overlay,
            }}
          >
            <Pressable
              accessibilityRole="none"
              onPress={(event) => event.stopPropagation()}
              style={{
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.lg,
                borderCurve: 'continuous',
                backgroundColor: colors.surface,
              }}
            >
              <DateTimePicker
                value={draftDate}
                mode="date"
                display="inline"
                locale={i18n.language === 'en' ? 'en-US' : 'tr-TR'}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onValueChange={(_event, date) => setDraftDate(date)}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md }}>
                <Pressable onPress={() => setShowIOSPicker(false)} style={{ padding: spacing.md }}>
                  <AppText style={{ color: colors.textMuted }}>{t('common.cancel')}</AppText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    commit(draftDate);
                    setShowIOSPicker(false);
                  }}
                  style={{ padding: spacing.md }}
                >
                  <AppText variant="label" style={{ color: colors.primary }}>
                    {t('common.save')}
                  </AppText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
