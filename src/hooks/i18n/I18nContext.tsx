import { i18n, TOptions } from 'i18next';
import { createContext } from "react";

export interface ParsedI18n {
  /**
   * the raw i18next object
   */
  i18n: i18n,
  translate: (key: string, options?: TOptions) => string | null
}
const defaultContext: ParsedI18n = {
  i18n: {} as i18n,
  translate: () => null
}

export const I18nContext = createContext(defaultContext)