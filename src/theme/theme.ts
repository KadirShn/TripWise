export type ThemePreference = 'system' | 'light' | 'dark';

export const lightColors = {
  background: '#FFF8EF',
  surface: '#FFFFFF',
  surfaceMuted: '#F2ECE3',
  text: '#18243A',
  textMuted: '#687287',
  primary: '#2764FF',
  primaryPressed: '#174ED4',
  onPrimary: '#FFFFFF',
  accent: '#FF6B5D',
  border: '#E8DED1',
  success: '#188865',
  danger: '#D94B55',
  warning: '#B86A12',
  overlay: 'rgba(24,36,58,0.52)',
  navy: '#18243A',
  onNavy: '#FFFDF8',
  sky: '#69CCFF',
  skySoft: '#DDF4FF',
  coral: '#FF6B5D',
  coralSoft: '#FFE1DB',
  sun: '#FFD166',
  sunSoft: '#FFF0B9',
  violet: '#7B61FF',
  violetSoft: '#E8E2FF',
  mint: '#43C6A5',
  mintSoft: '#DDF7EF',
} as const;

export const darkColors = {
  background: '#101725',
  surface: '#1A2435',
  surfaceMuted: '#252F40',
  text: '#FFF9EF',
  textMuted: '#B4BED0',
  primary: '#7DA5FF',
  primaryPressed: '#9AB8FF',
  onPrimary: '#101725',
  accent: '#FF8579',
  border: '#344054',
  success: '#4ADE80',
  danger: '#FB7185',
  warning: '#FBBF24',
  overlay: 'rgba(0,0,0,0.6)',
  navy: '#0A1020',
  onNavy: '#FFF9EF',
  sky: '#69CCFF',
  skySoft: '#173E55',
  coral: '#FF8579',
  coralSoft: '#4C292E',
  sun: '#FFD166',
  sunSoft: '#4A3D20',
  violet: '#A695FF',
  violetSoft: '#342E59',
  mint: '#5ED5B6',
  mintSoft: '#1D463E',
} as const;

export type AppColors = { [Key in keyof typeof lightColors]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 12, md: 18, lg: 26, xl: 34, pill: 999 } as const;
