import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format, isValid } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { AppText } from './app-text';
import { TextField } from './text-field';

interface DateTimeFieldProps {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  optional?: boolean;
  disabled?: boolean;
}

const parseValue = (value?: string, fallback = new Date()) => {
  const parsed = value ? new Date(value) : fallback;
  return isValid(parsed) ? parsed : fallback;
};

export function DateTimeField({
  label,
  value,
  onChangeText,
  error,
  minimumDate,
  maximumDate,
  optional,
  disabled,
}: DateTimeFieldProps) {
  const { colors } = useAppTheme();
  const { i18n, t } = useTranslation();
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [draftDate, setDraftDate] = useState(() => parseValue(value, minimumDate ?? new Date()));
  const selectedDate = parseValue(value, minimumDate ?? new Date());
  const formattedValue = value
    ? format(selectedDate, 'd MMMM yyyy, HH:mm', {
        locale: i18n.language === 'en' ? enUS : tr,
      })
    : t('common.selectDateTime');

  const commit = (date: Date) => onChangeText?.(date.toISOString());
  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: selectedDate,
      mode: 'date',
      minimumDate,
      maximumDate,
      onValueChange: (_dateEvent, pickedDate) => {
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          is24Hour: true,
          onValueChange: (_timeEvent, pickedTime) => {
            const result = new Date(pickedDate);
            result.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            commit(result);
          },
        });
      },
    });
  };
  const openPicker = () => {
    if (disabled) return;
    if (process.env.EXPO_OS === 'android') {
      openAndroidPicker();
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
        placeholder="YYYY-MM-DDTHH:mm:ssZ"
        autoCapitalize="none"
      />
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={openPicker}
          style={({ pressed }) => ({
            minHeight: 48,
            flex: 1,
            paddingHorizontal: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            borderCurve: 'continuous',
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            opacity: disabled ? 0.55 : 1,
          })}
        >
          <AppText style={{ flex: 1, color: value ? colors.text : colors.textMuted }}>
            {formattedValue}
          </AppText>
          <MaterialCommunityIcons name="calendar-clock-outline" size={22} color={colors.primary} />
        </Pressable>
        {optional && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.clear')}
            onPress={() => onChangeText?.('')}
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              borderCurve: 'continuous',
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            })}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
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
                mode="datetime"
                display="spinner"
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
