import i18n from 'i18next';
import ENV from '../services/env';
import { translations } from './translations';

const FALLBACK_LANGUAGE = 'en';

export const I18N_CONFIG: i18n.InitOptions = {
  debug: !ENV.isProduction,
  fallbackLng: FALLBACK_LANGUAGE,
  resources: translations
};
