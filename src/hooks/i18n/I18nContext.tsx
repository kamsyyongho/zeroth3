import enUSLocale from "date-fns/locale/en-US";
import { i18n, TOptions } from 'i18next';
import { createContext } from "react";
import { extendLocaleType, PickerLocale } from './useI18n';

export interface ParsedI18n {
  /**
   * the raw i18next object
   */
  i18n: i18n,
  translate: (key: string, options?: TOptions | string) => string | null,
  toggleLanguage: () => void;
  language: string;
  dateTimeFormat: string;
  pickerLocale: PickerLocale;
}


const defaultContext: ParsedI18n = {
  i18n: {} as i18n,
  translate: () => null,
  toggleLanguage: () => { },
  language: "en",
  dateTimeFormat: "",
  pickerLocale: extendLocaleType(enUSLocale),
};

export const I18nContext = createContext(defaultContext);