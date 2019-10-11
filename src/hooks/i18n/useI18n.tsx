import { TOptions } from 'i18next';
import { useTranslation } from 'react-i18next';

export const useI18n = () => {
  const { t, i18n } = useTranslation();

  /**
   * Translates text.
   * @param key The i18next key.
   * @param options optional options to pass for the translation
   */
  const translate = (key: string, options?: TOptions): string | null => {
    return key ? t(key, options) : null;
  }
  return { translate, i18n }
}