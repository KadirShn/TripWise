import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, Card, TextField } from '@/components/ui';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { useAuth } from './auth-provider';
import { AuthShell } from './auth-shell';

const schema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { session, recoveryStatus, updatePassword } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async ({ password }) => {
    try {
      await updatePassword(password);
      router.replace('/(tabs)/(trips)');
    } catch {
      setError('root', { message: t('auth.genericError') });
    }
  });

  if (recoveryStatus === 'loading') {
    return (
      <AuthShell title={t('auth.newPasswordTitle')} subtitle={t('common.loading')}>
        <Card>
          <AppText style={{ color: colors.textMuted }}>{t('auth.recoveryPreparing')}</AppText>
        </Card>
      </AuthShell>
    );
  }

  if (!session || recoveryStatus === 'error') {
    return (
      <AuthShell title={t('auth.newPasswordTitle')} subtitle={t('auth.recoveryInvalid')}>
        <Button
          label={t('auth.sendNewResetLink')}
          onPress={() => router.replace('/(auth)/forgot-password')}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('auth.newPasswordTitle')} subtitle={t('auth.newPasswordDescription')}>
      <View style={{ gap: spacing.md }}>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label={t('auth.newPassword')}
              value={field.value}
              onChangeText={field.onChange}
              secureTextEntry
              autoComplete="new-password"
              error={errors.password ? t('auth.passwordRequirements') : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <TextField
              label={t('auth.confirmPassword')}
              value={field.value}
              onChangeText={field.onChange}
              secureTextEntry
              autoComplete="new-password"
              error={
                errors.confirmPassword?.message === 'passwordMismatch'
                  ? t('auth.passwordMismatch')
                  : errors.confirmPassword
                    ? t('auth.passwordRequirements')
                    : undefined
              }
            />
          )}
        />
        {errors.root?.message ? (
          <AppText style={{ color: colors.danger }}>{errors.root.message}</AppText>
        ) : null}
        <Button
          label={t('auth.updatePassword')}
          loading={isSubmitting}
          onPress={() => void submit()}
        />
      </View>
    </AuthShell>
  );
}
