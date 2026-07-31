import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';
import { AppText, Badge, Button, Card, TextField } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { normalizeAuthError } from '@/lib/supabase/errors';
import { useAppStore } from '@/stores/app-store';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { useAuth } from './auth-provider';
import { AuthShell } from './auth-shell';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type FormValues = z.infer<typeof schema>;

export function SignInScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();
  const enterGuest = useAppStore((state) => state.enterGuest);
  const { signIn } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit(async (values) => {
    try {
      await signIn(values.email, values.password);
      router.replace('/(tabs)/(trips)');
    } catch (error) {
      setError('root', { message: t(`auth.${normalizeAuthError(error)}`) });
    }
  });
  return (
    <AuthShell title={t('auth.welcome')} subtitle={t('auth.subtitle')}>
      {!isSupabaseConfigured ? (
        <Card>
          <Badge label={t('demo.badge')} tone="warning" />
          <AppText style={{ color: colors.textMuted }}>{t('auth.missingConfig')}</AppText>
        </Card>
      ) : null}
      <View style={{ gap: spacing.md }}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('auth.email')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email ? t('auth.genericError') : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('auth.password')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="current-password"
              error={errors.password ? t('auth.genericError') : undefined}
            />
          )}
        />
        {errors.root?.message ? (
          <AppText style={{ color: colors.danger }}>{errors.root.message}</AppText>
        ) : null}
        <Button
          label={t('auth.signIn')}
          loading={isSubmitting}
          disabled={!isSupabaseConfigured}
          onPress={() => void submit()}
        />
        <Link href="/(auth)/forgot-password" asChild>
          <Button variant="ghost" label={t('auth.forgotPassword')} />
        </Link>
        <Button
          variant="secondary"
          icon="flask-outline"
          label={t('auth.demo')}
          onPress={() => {
            enterGuest();
            router.replace('/(tabs)/(trips)');
          }}
        />
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <AppText style={{ color: colors.textMuted }}>{t('auth.noAccount')}</AppText>
          <Link
            href="/(auth)/sign-up"
            style={{ color: colors.primary, fontWeight: '700', minHeight: 44, paddingVertical: 10 }}
          >
            {t('auth.signUp')}
          </Link>
        </View>
      </View>
    </AuthShell>
  );
}
