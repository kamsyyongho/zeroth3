import DateFnsUtils from '@date-io/date-fns';
import { CssBaseline } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import { ThemeProvider } from '@material-ui/styles';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import 'react-virtualized/styles.css'; // for the editor's lists
import { SNACKBAR } from '../constants';
import { Api } from '../services/api/api';
import { theme } from '../theme/index';
import { ApiContext } from './api/ApiContext';
import { I18nContext, ParsedI18n } from './i18n/I18nContext';
import { KeycloakContext, ParsedKeycloak } from "./keycloak/KeycloakContext";
import { NavigationPropsContext, ParsedNavigationProps } from './navigation-props/NavigationPropsContext';

interface RootProviderProps {
  children: React.ReactNode;
  api: Api;
  i18n: ParsedI18n;
  keycloak: ParsedKeycloak;
  navigationProps: ParsedNavigationProps;
}

/**
 * Wraps the app in all required global providers
 * @param props the context values to pass to the providers
 */
export default function RootProvider(props: RootProviderProps) {
  return (
    <I18nContext.Provider value={props.i18n}>
      <MuiPickersUtilsProvider utils={DateFnsUtils} locale={props.i18n.pickerLocale}>
        <ThemeProvider theme={theme} >
          <CssBaseline />
          <KeycloakContext.Provider value={props.keycloak}>
            <ApiContext.Provider value={props.api}>
              <NavigationPropsContext.Provider value={props.navigationProps}>
                <SnackbarProvider maxSnack={3} anchorOrigin={SNACKBAR.anchorOrigin} autoHideDuration={SNACKBAR.autoHideDuration} >
                  {props.children}
                </SnackbarProvider>
              </NavigationPropsContext.Provider>
            </ApiContext.Provider>
          </KeycloakContext.Provider>
        </ThemeProvider>
      </MuiPickersUtilsProvider>
    </I18nContext.Provider>
  );
}

