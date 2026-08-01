import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, tr } from './resources';

const i18n = createInstance();
void i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
