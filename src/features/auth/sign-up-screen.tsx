import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, TextField } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { normalizeAuthError } from '@/lib/supabase/errors';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { useAuth } from './auth-provider';
import { AuthShell } from './auth-shell';

const schema = z.object({
  displayName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
type FormValues = z.infer<typeof schema>;
export function SignUpScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    try {
      await signUp(values.email, values.password, values.displayName);
      router.replace('/(auth)/sign-in');
    } catch (error) {
      setError('root', { message: t(`auth.${normalizeAuthError(error)}`) });
    }
  });
  return (
    <AuthShell title={t('auth.signUp')} subtitle={t('auth.subtitle')}>
      <View style={{ gap: spacing.md }}>
        <Controller
          control={control}
          name="displayName"
          render={({ field }) => (
            <TextField
              label={t('auth.displayName')}
              value={field.value}
              onChangeText={field.onChange}
              error={errors.displayName ? t('common.required') : undefined}
            />
          )}
        />
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
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label={t('auth.password')}
              value={field.value}
              onChangeText={field.onChange}
              secureTextEntry
              error={errors.password ? t('auth.genericError') : undefined}
            />
          )}
        />
        {errors.root?.message ? (
          <AppText style={{ color: colors.danger }}>{errors.root.message}</AppText>
        ) : null}
        <Button
          label={t('auth.signUp')}
          loading={isSubmitting}
          disabled={!isSupabaseConfigured}
          onPress={() => void submit()}
        />
        <Button variant="ghost" label={t('auth.hasAccount')} onPress={() => router.back()} />
      </View>
    </AuthShell>
  );
}
