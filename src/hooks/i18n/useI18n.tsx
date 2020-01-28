import { format, Locale } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { TOptions } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shortcuts } from '../../i18n/translations/shortcuts';
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
  const shortLanguageCode = locale.code.slice(0, 2);
  return shortLanguageCode;
}

function getDateTimeFormat(locale: Locale | PickerLocale) {
  const typedLocale = extendLocaleType(locale);
  const { formatLong } = typedLocale;
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
  const dateTimeString = `${formatLong.date({ width: dateWidth })} - ${formatLong.time({ width: timeWidth })}`;
  return dateTimeString;
}

const isMacOs = () => navigator.userAgent.includes('Mac');

export const useI18n = (): ParsedI18n => {
  const { t, i18n } = useTranslation();
  const defaultLocale = i18n.language === LANGUAGES.en ? extendLocaleType(enUS) : extendLocaleType(ko);
  const defaultDateTimeFormat = getDateTimeFormat(defaultLocale);
  const [pickerLocale, setPickerLocale] = useState<PickerLocale>(defaultLocale);
  const [dateTimeFormat, setDateTimeFormat] = useState<string>(defaultDateTimeFormat);
  const [isMac, setIsMac] = useState<boolean>(isMacOs());

  /**
   * Translates text.
   * @param key The i18next key.
   * @param options options object to pass for the translation -OR- a default/fallback value string
   */
  const translate = (key: string, options?: TOptions | string): string => {
    return key ? t(key, options) : '';
  };

  /**
   * Displays text according to the operating system
   * @param key The i18next key.
   */
  const osText = (key: string): string => {
    if (isMac) {
      return shortcuts.mac[key] ?? '';
    }
    return shortcuts.other[key] ?? '';
  };

  /**
   * Toggles the current locale between `en` and `ko`
   * - also changes the date-time picker locale
   */
  const toggleLanguage = () => {
    const locale = i18n.language === LANGUAGES.en ? extendLocaleType(ko) : extendLocaleType(enUS);
    setPickerLocale(locale);
    const dateTimeFormat = getDateTimeFormat(locale);
    setDateTimeFormat(dateTimeFormat);
    i18n.changeLanguage(i18n.language === LANGUAGES.en ? LANGUAGES.ko : LANGUAGES.en);
  };

  /**
   * Supplies a date-time string for the current locale
   * @param date 
   */
  const formatDate = (date: number | Date) => format(date, dateTimeFormat);

  return {
    translate,
    osText,
    i18n,
    toggleLanguage,
    language: i18n.language,
    pickerLocale,
    dateTimeFormat,
    formatDate,
  };
};