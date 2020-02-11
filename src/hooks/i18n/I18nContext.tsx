import enUSLocale from "date-fns/locale/en-US";
import { i18n, TOptions } from 'i18next';
import { createContext } from "react";
import { noop } from '../../constants';
import { DateTimeFormats, extendLocaleType, PickerLocale } from './useI18n';

export interface ParsedI18n {
  /**
   * the raw i18next object
   */
  i18n: i18n,
  translate: (key: string, options?: TOptions | string) => string,
  osText: (key: string) => string,
  toggleLanguage: () => void;
  language: string;
  dateTimeFormats: DateTimeFormats;
  formatDate: (date: number | Date, dateTimeFormat?: 'dateTime' | 'date' | 'time') => string;
  pickerLocale: PickerLocale;
}


const defaultContext: ParsedI18n = {
  i18n: {} as i18n,
  translate: () => '',
  osText: () => '',
  toggleLanguage: noop,
  language: "en",
  dateTimeFormats: {} as DateTimeFormats,
  formatDate: noop,
  pickerLocale: extendLocaleType(enUSLocale),
};

export const I18nContext = createContext(defaultContext);