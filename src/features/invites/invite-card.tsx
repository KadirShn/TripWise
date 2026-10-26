import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Share, View } from 'react-native';
import { AppText, Button, Card, SelectField } from '@/components/ui';
import { inviteLink, PLAY_STORE_URL } from '@/constants/app-links';
import { getTripDataErrorKey } from '@/features/data/errors';
import { useTripData } from '@/features/data/use-trip-data';
import type { Trip, TripInvite } from '@/types/domain';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatDateTime } from '@/utils/dates/format';

export function InviteCard({ trip }: { trip: Trip }) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { mode, createInvite } = useTripData();
  const [role, setRole] = useState<TripInvite['role']>('editor');
  const [invite, setInvite] = useState<TripInvite | null>(null);
  const [isCreating, setCreating] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (mode !== 'authenticated')
    return (
      <Card>
        <AppText variant="subtitle">{t('invites.title')}</AppText>
        <AppText style={{ color: colors.textMuted }}>{t('invites.guestNotice')}</AppText>
      </Card>
    );

  const create = async () => {
    if (isCreating) return;
    setCreating(true);
    setErrorKey(null);
    try {
      setInvite(await createInvite(trip.id, role));
    } catch (error) {
      setErrorKey(getTripDataErrorKey(error));
    } finally {
      setCreating(false);
    }
  };
  const share = (code: string) =>
    void Share.share({
      message: t('invites.shareMessage', {
        trip: trip.title,
        code,
        link: inviteLink(code),
        storeUrl: PLAY_STORE_URL,
      }),
    }).catch(() => Alert.alert(t('common.error'), t('export.unavailable')));

  return (
    <Card style={{ backgroundColor: colors.skySoft, boxShadow: 'none' }}>
      <AppText variant="subtitle">{t('invites.title')}</AppText>
      <AppText style={{ color: colors.textMuted }}>{t('invites.description')}</AppText>
      {invite ? (
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              padding: spacing.lg,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {t('invites.codeLabel')}
            </AppText>
            <AppText
              selectable
              accessibilityLabel={`${t('invites.codeLabel')}: ${invite.code.split('').join(' ')}`}
              style={{ fontSize: 30, lineHeight: 38, fontWeight: '900', letterSpacing: 4 }}
            >
              {invite.code}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {t('invites.expires', { date: formatDateTime(invite.expiresAt, i18n.language) })}
            </AppText>
          </View>
          <Button
            icon="share-variant-outline"
            label={t('invites.share')}
            onPress={() => share(invite.code)}
          />
        </View>
      ) : (
        <>
          <SelectField
            label={t('invites.roleLabel')}
            value={role}
            onChange={(value) => setRole(value === 'viewer' ? 'viewer' : 'editor')}
            options={[
              { value: 'editor', label: t('participants.editor') },
              { value: 'viewer', label: t('participants.viewer') },
            ]}
          />
          <Button
            icon="account-multiple-plus-outline"
            label={t('invites.create')}
            loading={isCreating}
            onPress={() => void create()}
          />
        </>
      )}
      {errorKey ? <AppText style={{ color: colors.danger }}>{t(errorKey)}</AppText> : null}
    </Card>
  );
}
