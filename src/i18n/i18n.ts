import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { I18N_CONFIG } from './i18n-config';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(I18N_CONFIG);
