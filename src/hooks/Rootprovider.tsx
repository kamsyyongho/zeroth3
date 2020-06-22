import DateFnsUtils from '@date-io/date-fns';
import { CssBaseline } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { ThemeProvider } from '@material-ui/styles';
import { SnackbarProvider } from 'notistack';
import React from 'reactn';
import { SNACKBAR } from '../constants';
import { Api } from '../services/api/api';
import { theme } from '../theme';
import { ApiContext } from './api/ApiContext';
import { I18nContext, ParsedI18n } from './i18n/I18nContext';
import { KeycloakContext, ParsedKeycloak } from "./keycloak/KeycloakContext";

interface RootProviderProps {
  children: JSX.Element;
  api: Api;
  i18n: ParsedI18n;
  keycloak: ParsedKeycloak;
}

/**
 * Wraps the app in all required global providers
 * @param props the context values to pass to the providers
 */
export default function RootProvider(props: RootProviderProps) {
  const { children, api, i18n, keycloak } = props;
  return (
    <I18nContext.Provider value={i18n}>
      <MuiPickersUtilsProvider utils={DateFnsUtils} locale={i18n.pickerLocale}>
        <ThemeProvider theme={theme} >
          <CssBaseline />
          <KeycloakContext.Provider value={keycloak}>
            <ApiContext.Provider value={api}>
              <SnackbarProvider maxSnack={3} anchorOrigin={SNACKBAR.anchorOrigin} autoHideDuration={SNACKBAR.autoHideDuration} >
                {children}
              </SnackbarProvider>
            </ApiContext.Provider>
          </KeycloakContext.Provider>
        </ThemeProvider>
      </MuiPickersUtilsProvider>
    </I18nContext.Provider>
  );
}

