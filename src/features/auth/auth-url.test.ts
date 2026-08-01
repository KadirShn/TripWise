import { parseAuthUrl } from './auth-url';

describe('Supabase auth deep links', () => {
  it('parses implicit recovery tokens from the URL fragment', () => {
    expect(
      parseAuthUrl(
        'tripwise://reset-password#access_token=access&refresh_token=refresh&type=recovery',
      ),
    ).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      code: undefined,
      type: 'recovery',
      errorDescription: undefined,
    });
  });

  it('parses PKCE codes and provider errors from query parameters', () => {
    expect(parseAuthUrl('tripwise://reset-password?code=pkce-code').code).toBe('pkce-code');
    expect(
      parseAuthUrl('tripwise://reset-password?error_description=Link%20expired').errorDescription,
    ).toBe('Link expired');
  });
});
