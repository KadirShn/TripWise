import { zodResolver } from '@hookform/resolvers/zod';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { z } from 'zod';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  SelectField,
  Screen,
  TextField,
} from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { getTripDataErrorKey } from '@/features/data/errors';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { InviteCard } from '@/features/invites/invite-card';
import { ViewerNotice } from '@/features/trips/viewer-notice';
import type { MemberRole, TripMember } from '@/types/domain';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

const schema = z.object({
  displayName: z.string().trim().min(2),
  email: z.union([z.string().email(), z.literal('')]),
  role: z.enum(['editor', 'viewer']),
});
type FormValues = z.infer<typeof schema>;
export function ParticipantsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const members = data.members.filter((member) => member.tripId === tripId);
  const canEdit = data.myRole(tripId) !== 'viewer';
  const { addMember: add, updateMember: update, deleteMember: remove } = data;
  const [editing, setEditing] = useState<TripMember | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', role: 'editor' },
  });
  const open = (member: TripMember | 'new') => {
    setEditing(member);
    reset(
      member === 'new'
        ? { displayName: '', email: '', role: 'editor' }
        : {
            displayName: member.displayName,
            email: member.email ?? '',
            role: member.role === 'viewer' ? 'viewer' : 'editor',
          },
    );
  };
  const submit = handleSubmit(async (values) => {
    try {
      const input = {
        tripId,
        displayName: values.displayName.trim(),
        email: values.email || null,
        role: values.role as MemberRole,
      };
      if (editing !== 'new' && editing) await update(editing.id, input);
      else await add({ ...input, userId: null });
      setEditing(null);
    } catch (error) {
      setError('root', { message: t(getTripDataErrorKey(error)) });
    }
  });
  const deleteMember = (member: TripMember) =>
    Alert.alert(t('common.delete'), member.displayName, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          if (deletingId) return;
          setDeletingId(member.id);
          void remove(member.id)
            .catch((error) =>
              Alert.alert(
                t('common.error'),
                error instanceof Error && error.message === 'MEMBER_IN_USE'
                  ? t('participants.inUse')
                  : t(getTripDataErrorKey(error)),
              ),
            )
            .finally(() => setDeletingId(null));
        },
      },
    ]);
  if (data.isLoading) return <TripDataLoadingScreen />;
  if (data.error) return <TripDataErrorScreen onRetry={() => void data.refetch()} />;
  return (
    <Screen>
      {canEdit ? (
        <>
          {trip ? <InviteCard trip={trip} /> : null}
          <Button
            label={t('participants.add')}
            icon="account-plus-outline"
            onPress={() => open('new')}
          />
        </>
      ) : (
        <ViewerNotice />
      )}
      {editing && canEdit ? (
        <Card>
          <AppText variant="subtitle">
            {editing === 'new' ? t('participants.add') : t('participants.edit')}
          </AppText>
          <Controller
            control={control}
            name="displayName"
            render={({ field }) => (
              <TextField
                label={t('participants.name')}
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
                label={t('participants.emailOptional')}
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email ? t('participants.invalidEmail') : undefined}
              />
            )}
          />
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <SelectField
                label={t('participants.role')}
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'editor', label: t('participants.editor') },
                  { value: 'viewer', label: t('participants.viewer') },
                ]}
              />
            )}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              style={{ flex: 1 }}
              variant="ghost"
              label={t('common.cancel')}
              disabled={isSubmitting}
              onPress={() => setEditing(null)}
            />
            <Button
              style={{ flex: 1 }}
              label={t('common.save')}
              loading={isSubmitting}
              onPress={() => void submit()}
            />
          </View>
          {errors.root?.message ? (
            <AppText style={{ color: colors.danger }}>{errors.root.message}</AppText>
          ) : null}
        </Card>
      ) : null}
      {members.length === 0 ? (
        <EmptyState title={t('participants.empty')} description={t('trips.emptyDescription')} />
      ) : (
        members.map((member, index) => (
          <Pressable
            key={member.id}
            accessibilityRole="button"
            disabled={deletingId !== null || !canEdit || member.role === 'owner'}
            onPress={() => open(member)}
          >
            <Card
              style={{
                backgroundColor: [
                  colors.sunSoft,
                  colors.skySoft,
                  colors.violetSoft,
                  colors.mintSoft,
                ][index % 4],
                boxShadow: 'none',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={member.displayName} />
                <View style={{ flex: 1 }}>
                  <AppText variant="label">{member.displayName}</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted }}>
                    {member.email ?? t(`participants.${member.role}`)}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                  <AppText variant="caption" style={{ color: colors.primary }}>
                    {t(`participants.${member.role}`)}
                  </AppText>
                  {member.userId && data.mode === 'authenticated' ? (
                    <Badge label={t('participants.linked')} tone="neutral" />
                  ) : null}
                </View>
                {member.role !== 'owner' && canEdit ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common.delete')}
                    hitSlop={8}
                    disabled={deletingId !== null}
                    onPress={(event) => {
                      event.stopPropagation();
                      deleteMember(member);
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={22}
                      color={deletingId === member.id ? colors.textMuted : colors.danger}
                    />
                  </Pressable>
                ) : null}
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
