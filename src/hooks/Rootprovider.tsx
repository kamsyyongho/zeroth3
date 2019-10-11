import React from 'react';
import { Api } from '../services/api/api';
import { ApiContext } from './api/ApiContext';
import { KeycloakContext, ParsedKeycloak } from "./keycloak/KeycloakContext";

interface RootProviderProps {
  children: React.ReactNode
  keycloak: ParsedKeycloak
  api: Api
}

/**
 * Wraps the app in all required global providers
 * @param props the context values to pass to the providers
 */
export default function RootProvider(props: RootProviderProps) {
  return (
    <KeycloakContext.Provider value={props.keycloak}>
      <ApiContext.Provider value={props.api}>
        {props.children}
      </ApiContext.Provider>
    </KeycloakContext.Provider>
  );
}

