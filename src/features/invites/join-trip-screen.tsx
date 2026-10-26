import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, Card, Screen, SelectField, TextField } from '@/components/ui';
import { isValidInviteCode, normalizeInviteCode } from '@/constants/app-links';
import { useAuth } from '@/features/auth/auth-provider';
import { getTripDataErrorKey } from '@/features/data/errors';
import { useTripData } from '@/features/data/use-trip-data';
import { TripCoverEmoji } from '@/features/trips/trip-cover-emoji';
import { useAppStore } from '@/stores/app-store';
import type { InvitePreview } from '@/types/domain';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

const NEW_MEMBER = 'new';
const schema = z.object({ code: z.string().refine(isValidInviteCode) });
type FormValues = z.infer<typeof schema>;

export function JoinTripScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const initialCode = normalizeInviteCode(params.code ?? '');
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { isLoading: isAuthLoading } = useAuth();
  const { mode, previewInvite, acceptInvite } = useTripData();
  const setPendingInviteCode = useAppStore((state) => state.setPendingInviteCode);
  const [preview, setPreview] = useState<{ code: string; data: InvitePreview } | null>(null);
  const [memberChoice, setMemberChoice] = useState<string>(NEW_MEMBER);
  const [isJoining, setJoining] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: initialCode },
  });

  const loadPreview = useCallback(
    async (rawCode: string) => {
      const code = normalizeInviteCode(rawCode);
      setErrorKey(null);
      try {
        const data = await previewInvite(code);
        setPreview({ code, data });
        setMemberChoice(NEW_MEMBER);
      } catch (error) {
        setPreview(null);
        setErrorKey(getTripDataErrorKey(error));
      }
    },
    [previewInvite],
  );
  const find = handleSubmit((values) => loadPreview(values.code));

  const isAuthenticated = mode === 'authenticated';
  // Opening a shared link should show the invite straight away.
  const autoLoaded = useRef(false);
  useEffect(() => {
    if (autoLoaded.current || !isAuthenticated || !isValidInviteCode(initialCode)) return;
    autoLoaded.current = true;
    void loadPreview(initialCode);
  }, [initialCode, isAuthenticated, loadPreview]);

  if (isAuthLoading) return <Screen />;
  if (!isAuthenticated)
    return (
      <Screen>
        <Card>
          <AppText variant="title">{t('invites.joinTitle')}</AppText>
          <AppText style={{ color: colors.textMuted }}>{t('invites.signInRequired')}</AppText>
          <Button
            icon="login"
            label={t('invites.goToSignIn')}
            onPress={() => {
              setPendingInviteCode(isValidInviteCode(initialCode) ? initialCode : null);
              router.replace('/(auth)/sign-in');
            }}
          />
        </Card>
      </Screen>
    );

  const join = async () => {
    if (!preview || isJoining) return;
    setJoining(true);
    setErrorKey(null);
    try {
      const tripId = await acceptInvite(
        preview.code,
        memberChoice === NEW_MEMBER ? null : memberChoice,
      );
      router.replace({ pathname: '/trip/[tripId]', params: { tripId } });
    } catch (error) {
      setErrorKey(getTripDataErrorKey(error));
      setJoining(false);
    }
  };

  return (
    <Screen>
      <Card>
        <AppText variant="title">{t('invites.joinTitle')}</AppText>
        <AppText style={{ color: colors.textMuted }}>{t('invites.joinDescription')}</AppText>
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <TextField
              label={t('invites.codeInput')}
              value={field.value}
              onChangeText={(value) => field.onChange(normalizeInviteCode(value).slice(0, 8))}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              error={errors.code ? t('invites.invalidCode') : undefined}
            />
          )}
        />
        <Button
          variant={preview ? 'secondary' : 'primary'}
          icon="magnify"
          label={t('invites.find')}
          loading={isSubmitting}
          onPress={() => void find()}
        />
      </Card>
      {preview ? (
        <Card style={{ backgroundColor: colors.mintSoft, boxShadow: 'none' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <TripCoverEmoji emoji={preview.data.coverEmoji} size={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle">
                {t('invites.previewTitle', { trip: preview.data.tripTitle })}
              </AppText>
              <AppText style={{ color: colors.textMuted }}>{preview.data.destination}</AppText>
            </View>
          </View>
          <AppText>
            {t('invites.previewRole', { role: t(`participants.${preview.data.role}`) })}
          </AppText>
          {preview.data.alreadyMember ? (
            <>
              <AppText style={{ color: colors.textMuted }}>{t('invites.alreadyMember')}</AppText>
              <Button
                icon="arrow-right"
                label={t('invites.openTrip')}
                onPress={() =>
                  router.replace({
                    pathname: '/trip/[tripId]',
                    params: { tripId: preview.data.tripId },
                  })
                }
              />
            </>
          ) : (
            <>
              {preview.data.unclaimedMembers.length ? (
                <>
                  <AppText style={{ color: colors.textMuted }}>
                    {t('invites.whoAreYouHint')}
                  </AppText>
                  <SelectField
                    label={t('invites.whoAreYou')}
                    value={memberChoice}
                    onChange={setMemberChoice}
                    options={[
                      ...preview.data.unclaimedMembers.map((member) => ({
                        value: member.id,
                        label: member.displayName,
                      })),
                      { value: NEW_MEMBER, label: t('invites.newMember') },
                    ]}
                  />
                </>
              ) : null}
              <Button
                icon="account-check-outline"
                label={t('invites.accept')}
                loading={isJoining}
                onPress={() => void join()}
              />
            </>
          )}
        </Card>
      ) : null}
      {errorKey ? <AppText style={{ color: colors.danger }}>{t(errorKey)}</AppText> : null}
    </Screen>
  );
}
