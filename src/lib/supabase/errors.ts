export function normalizeAuthError(error: unknown): 'invalidCredentials' | 'genericError' {
  if (error instanceof Error && /invalid login credentials/i.test(error.message))
    return 'invalidCredentials';
  return 'genericError';
}
