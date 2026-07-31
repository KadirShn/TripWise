import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, TextField } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { useAuth } from './auth-provider';
import { AuthShell } from './auth-shell';

const schema = z.object({ email: z.string().email() });
export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  const submit = handleSubmit(async ({ email }) => {
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError('root', { message: t('auth.genericError') });
    }
  });
  return (
    <AuthShell title={t('auth.resetTitle')} subtitle={t('auth.resetDescription')}>
      {sent ? (
        <AppText style={{ color: colors.success }}>{t('auth.resetSent')}</AppText>
      ) : (
        <View style={{ gap: spacing.md }}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                label={t('auth.email')}
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email ? t('auth.genericError') : undefined}
              />
            )}
          />
          {errors.root?.message ? (
            <AppText style={{ color: colors.danger }}>{errors.root.message}</AppText>
          ) : null}
          <Button
            label={t('auth.sendReset')}
            loading={isSubmitting}
            disabled={!isSupabaseConfigured}
            onPress={() => void submit()}
          />
        </View>
      )}
    </AuthShell>
  );
}
