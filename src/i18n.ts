import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import ruTranslation from './locales/ru/translation.json';
import ukTranslation from './locales/uk/translation.json';
import beTranslation from './locales/be/translation.json';
import plTranslation from './locales/pl/translation.json';
import deTranslation from './locales/de/translation.json';
import frTranslation from './locales/fr/translation.json';
import kaTranslation from './locales/ka/translation.json';
import hyTranslation from './locales/hy/translation.json';
import csTranslation from './locales/cs/translation.json';
import arTranslation from './locales/ar/translation.json';
import zhCNTranslation from './locales/zh-CN/translation.json';
import jaTranslation from './locales/ja/translation.json';
import kkTranslation from './locales/kk/translation.json';

const resources = {
  en: { translation: enTranslation },
  ru: { translation: ruTranslation },
  uk: { translation: ukTranslation },
  be: { translation: beTranslation },
  pl: { translation: plTranslation },
  de: { translation: deTranslation },
  fr: { translation: frTranslation },
  ka: { translation: kaTranslation },
  hy: { translation: hyTranslation },
  kk: { translation: kkTranslation },
  cs: { translation: csTranslation },
  ar: { translation: arTranslation },
  'zh-CN': { translation: zhCNTranslation },
  ja: { translation: jaTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;