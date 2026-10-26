import * as Linking from 'expo-linking';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kadirshn.tripwise';

export const INVITE_CODE_LENGTH = 8;

/** Uppercases and strips separators so "abcd-1234" and "ABCD 1234" both work. */
export const normalizeInviteCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isValidInviteCode = (value: string) =>
  /^[A-HJ-NP-Z2-9]{8}$/.test(normalizeInviteCode(value));

export const inviteLink = (code: string) => Linking.createURL(`join/${code}`);
