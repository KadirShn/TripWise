export interface AuthUrlTokens {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  type?: string;
  errorDescription?: string;
}

export const parseAuthUrl = (url: string): AuthUrlTokens => {
  const parsed = new URL(url);
  const query = new URLSearchParams(parsed.search);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const get = (name: string) => fragment.get(name) ?? query.get(name) ?? undefined;
  return {
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    code: get('code'),
    type: get('type'),
    errorDescription: get('error_description'),
  };
};
