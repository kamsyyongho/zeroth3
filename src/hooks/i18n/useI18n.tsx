import { TOptions } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ParsedI18n } from './I18nContext';



export const useI18n = (): ParsedI18n => {
  const { t, i18n } = useTranslation();

  /**
   * Translates text.
   * @param key The i18next key.
   * @param options options object to pass for the translation -OR- a default/fallback value string
   */
  const translate = (key: string, options?: TOptions | string): string | null => {
    return key ? t(key, options) : null;
  }

  /**
   * Toggles the current locale between `en` and `ko`
   */
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ko" : "en")
  }

  return { translate, i18n, toggleLanguage }
}