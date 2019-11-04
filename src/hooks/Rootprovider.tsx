import { CssBaseline } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { SNACKBAR } from '../constants';
import { Api } from '../services/api/api';
import { ApiContext } from './api/ApiContext';
import { I18nContext, ParsedI18n } from './i18n/I18nContext';
import { KeycloakContext, ParsedKeycloak } from "./keycloak/KeycloakContext";

interface RootProviderProps {
  children: React.ReactNode;
  api: Api;
  i18n: ParsedI18n;
  keycloak: ParsedKeycloak;
}

/**
 * Wraps the app in all required global providers
 * @param props the context values to pass to the providers
 */
export default function RootProvider(props: RootProviderProps) {
  return (
    <I18nContext.Provider value={props.i18n}>
      <CssBaseline />
      <KeycloakContext.Provider value={props.keycloak}>
        <ApiContext.Provider value={props.api}>
          <SnackbarProvider maxSnack={3} anchorOrigin={SNACKBAR.anchorOrigin} autoHideDuration={SNACKBAR.autoHideDuration} >
            {props.children}
          </SnackbarProvider>
        </ApiContext.Provider>
      </KeycloakContext.Provider>
    </I18nContext.Provider>
  );
}

