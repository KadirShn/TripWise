export type TripDataErrorCode = 'OFFLINE_MUTATION_DISABLED' | 'UNKNOWN';

export class TripDataError extends Error {
  constructor(public readonly code: TripDataErrorCode) {
    super(code);
    this.name = 'TripDataError';
  }
}

export const getTripDataErrorKey = (error: unknown) =>
  error instanceof TripDataError && error.code === 'OFFLINE_MUTATION_DISABLED'
    ? 'status.offlineMutation'
    : 'auth.genericError';
