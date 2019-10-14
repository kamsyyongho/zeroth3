import React from 'react';
import { Api } from '../services/api/api';
import { ApiContext } from './api/ApiContext';
import { I18nContext, ParsedI18n } from './i18n/I18nContext';
import { KeycloakContext, ParsedKeycloak } from "./keycloak/KeycloakContext";

interface RootProviderProps {
  children: React.ReactNode
  i18n: ParsedI18n
  keycloak: ParsedKeycloak
  api: Api
}

/**
 * Wraps the app in all required global providers
 * @param props the context values to pass to the providers
 */
export default function RootProvider(props: RootProviderProps) {
  return (
    <I18nContext.Provider value={props.i18n}>
      <KeycloakContext.Provider value={props.keycloak}>
        <ApiContext.Provider value={props.api}>
          {props.children}
        </ApiContext.Provider>
      </KeycloakContext.Provider>
    </I18nContext.Provider>
  );
}

