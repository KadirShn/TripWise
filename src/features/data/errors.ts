export type TripDataErrorCode = 'OFFLINE_MUTATION_DISABLED' | 'ACCOUNT_REQUIRED' | 'UNKNOWN';

export class TripDataError extends Error {
  constructor(public readonly code: TripDataErrorCode) {
    super(code);
    this.name = 'TripDataError';
  }
}

// Database RPCs raise these codes as their message so the UI can explain them.
const serverMessageKeys: Record<string, string> = {
  INVITE_NOT_FOUND: 'invites.errors.notFound',
  INVITE_NOT_ALLOWED: 'invites.errors.notAllowed',
  INVITE_MEMBER_UNAVAILABLE: 'invites.errors.memberUnavailable',
  OWNER_CANNOT_LEAVE: 'invites.errors.ownerCannotLeave',
};

export const getTripDataErrorKey = (error: unknown) => {
  if (error instanceof TripDataError) {
    if (error.code === 'OFFLINE_MUTATION_DISABLED') return 'status.offlineMutation';
    if (error.code === 'ACCOUNT_REQUIRED') return 'invites.errors.accountRequired';
  }
  if (error instanceof Error) {
    const key = Object.keys(serverMessageKeys).find((code) => error.message.includes(code));
    if (key) return serverMessageKeys[key];
  }
  return 'auth.genericError';
};
