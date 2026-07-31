export type ThemePreference = 'system' | 'light' | 'dark';

export const lightColors = {
  background: '#F4F7F6',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF2F0',
  text: '#14201E',
  textMuted: '#667572',
  primary: '#0F766E',
  primaryPressed: '#0B5F59',
  onPrimary: '#FFFFFF',
  accent: '#F59E72',
  border: '#D9E4E1',
  success: '#15803D',
  danger: '#C2413A',
  warning: '#B45309',
  overlay: 'rgba(20,32,30,0.45)',
} as const;

export const darkColors = {
  background: '#0B1413',
  surface: '#13201E',
  surfaceMuted: '#1D2D2A',
  text: '#F2F7F6',
  textMuted: '#A9BBB7',
  primary: '#45C7B8',
  primaryPressed: '#2DAA9D',
  onPrimary: '#062B27',
  accent: '#FFAA80',
  border: '#2A403C',
  success: '#4ADE80',
  danger: '#FB7185',
  warning: '#FBBF24',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export type AppColors = { [Key in keyof typeof lightColors]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
