import { Locale } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { TOptions } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ParsedI18n } from './I18nContext';

interface FormatOptions {
  width: LocaleWidths;
}

/**
 * fixes mistyped Locale from `date-fns`
 */
export interface PickerLocale extends Locale {
  formatLong: {
    date: (options?: FormatOptions) => string;
    time: (options?: FormatOptions) => string;
    dateTime: (options?: FormatOptions) => string;
  };
  code: string;
}

enum LANGUAGES {
  en = 'en',
  ko = 'ko',
}

type LocaleWidths = 'full' | 'long' | 'medium' | 'short';

/**
 * extends the `date-fns` locale type with our updated values
 */
export function extendLocaleType(locale: Locale | PickerLocale) {
  return locale as PickerLocale;
}

function getLanguageCode(locale: PickerLocale) {
  // to trim off any region from the language code
  const shortLanguageCode = locale.code.slice(0,2)
  return shortLanguageCode;
}

function getDateTimeFormat(locale: Locale | PickerLocale) {
  const typedLocale = extendLocaleType(locale);
  const {formatLong} = typedLocale;
  const languageCode = getLanguageCode(typedLocale);
  // set length based on language
  let dateWidth: LocaleWidths = 'medium';
  let timeWidth: LocaleWidths = 'medium';
  switch (languageCode) {
    case LANGUAGES.en:
      dateWidth = 'medium';
      timeWidth = 'short';
      break;
    case LANGUAGES.ko:
      dateWidth = 'long';
      timeWidth = 'short';
      break;
  }
  // build the string
  const dateTimeString = `${formatLong.date({width: dateWidth})} - ${formatLong.time({width: timeWidth})} a`;
  return dateTimeString;
}

export const useI18n = (): ParsedI18n => {
  const { t, i18n } = useTranslation();
  const defaultLocale = i18n.language === LANGUAGES.en ? extendLocaleType(enUS) : extendLocaleType(ko);
  const defaultDateTimeFormat = getDateTimeFormat(defaultLocale);
  const [pickerLocale, setPickerLocale] = useState<PickerLocale>(defaultLocale);
  const [dateTimeFormat, setDateTimeFormat] = useState<string>(defaultDateTimeFormat);

  /**
   * Translates text.
   * @param key The i18next key.
   * @param options options object to pass for the translation -OR- a default/fallback value string
   */
  const translate = (key: string, options?: TOptions | string): string | null => {
    return key ? t(key, options) : null;
  };

  /**
   * Toggles the current locale between `en` and `ko`
   * - also changes the date-time picker locale
   */
  const toggleLanguage = () => {
    const locale = i18n.language === LANGUAGES.en ? extendLocaleType(ko) : extendLocaleType(enUS)
    setPickerLocale(locale);
    const dateTimeFormat = getDateTimeFormat(locale);
    setDateTimeFormat(dateTimeFormat);
    i18n.changeLanguage(i18n.language === LANGUAGES.en ? LANGUAGES.ko : LANGUAGES.en);
  };

  return { translate, i18n, toggleLanguage, language: i18n.language, pickerLocale, dateTimeFormat };
};