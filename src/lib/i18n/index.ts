import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, tr } from './resources';

const locale = getLocales()[0]?.languageCode === 'en' ? 'en' : 'tr';

const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: locale,
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
