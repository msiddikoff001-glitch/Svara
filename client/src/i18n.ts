import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enErrors from './locales/en/errors.json';
import ruCommon from './locales/ru/common.json';
import ruErrors from './locales/ru/errors.json';

/**
 * i18next bootstrap for the redesigned client.
 *
 * Keeps the two-namespace setup (`common` / `errors`) inherited from the
 * previous svarapro client so we can port keys 1-to-1 across PRs without
 * rewriting them. Default language is Russian; English falls back to RU
 * for any missing key so partial migrations don't break the UI.
 */
void i18n.use(initReactI18next).init({
  lng: 'ru',
  fallbackLng: 'ru',
  ns: ['common', 'errors'],
  defaultNS: 'common',
  resources: {
    en: { common: enCommon, errors: enErrors },
    ru: { common: ruCommon, errors: ruErrors },
  },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
