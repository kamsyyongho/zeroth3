import Keycloak from 'keycloak-js';
import { useState } from 'react';
import ENV from '../../services/env';
import log from '../../util/log/logger';
import { keycloakConfig } from './keycloak-config';
import { ParsedKeycloak } from './KeycloakContext';

interface CustomKeycloakTokenParsed extends Keycloak.KeycloakTokenParsed {
  organization_id?: number
}

interface CustomKeycloakInstance extends Keycloak.KeycloakInstance {
  tokenParsed?: CustomKeycloakTokenParsed
}

export const useKeycloak = () => {
  const rawKeycloak: CustomKeycloakInstance = Keycloak(keycloakConfig);

  const [keycloakInitialized, setkeycloakInitialized] = useState(false);
  const [keycloak, setKeycloak] = useState(rawKeycloak)

  const init = () => {
    return new Promise<boolean>((resolve, reject) => {
      keycloak
        .init({
          onLoad: "login-required",
          checkLoginIframe: false // without this, IE goes into redirect loop
        })
        .success((authenticated: boolean) => {
          setKeycloak(keycloak)
          resolve(authenticated)
        })
        .error((error) => reject(error));
    });
  };

  const initKeycloak = async () => {
    const startInit = async () => {
      const keycloakResponse = await init().catch(error => {
        log({
          file: `useKeycloak.tsx`,
          caller: `initKeycloak - init error`,
          value: error,
          error: true,
        })
        return false
      })
      setkeycloakInitialized(keycloakResponse);
    };
    startInit();
  }

  /**
   * Logs out of keycloak and redirects to the login page.
   * - redirects to the homepage after re-login
   * - this function gets passed to, and stored in the api
   */
  const logout = () => {
    const logoutOptions = { redirectUri: ENV.HOME_URL };
    setkeycloakInitialized(false);
    keycloak.logout(logoutOptions);
  }

  let roles: string[] = []
  let organizationId: number | undefined = undefined
  try {
    if (keycloak && keycloak.tokenParsed && keycloak.tokenParsed.realm_access) {
      roles = keycloak.tokenParsed.realm_access.roles
    }
    if (keycloak && keycloak.tokenParsed) {
      organizationId = keycloak.tokenParsed.organization_id
    }
  } catch (error) {
    log({
      file: `useKeycloak.tsx`,
      caller: `initKeycloak - parse error`,
      value: error,
      error: true,
    })
  }

  const parsedKeycloak: ParsedKeycloak = { keycloak, logout, roles, organizationId }

  return { keycloak: parsedKeycloak, keycloakInitialized, initKeycloak }
}