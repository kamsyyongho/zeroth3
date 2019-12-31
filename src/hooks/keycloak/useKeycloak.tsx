import Keycloak from 'keycloak-js';
import { useState } from 'react';
import ENV from '../../services/env';
import { ROLES } from '../../types';
import log from '../../util/log/logger';
import { keycloakConfig } from './keycloak-config';
import { ParsedKeycloak } from './KeycloakContext';

export interface KeycloakUser {
  familyName?: string;
  givenName?: string;
  email?: string;
  name?: string;
  preferredUsername?: string;
  organizationId?: number;
}

interface CustomKeycloakTokenParsed extends Keycloak.KeycloakTokenParsed {
  family_name?: string;
  given_name?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  organization_id?: number;
}

interface CustomKeycloakInstance extends Keycloak.KeycloakInstance {
  tokenParsed?: CustomKeycloakTokenParsed;
}

export const useKeycloak = () => {
  const rawKeycloak: CustomKeycloakInstance = Keycloak(keycloakConfig);

  const [keycloakInitialized, setkeycloakInitialized] = useState(false);
  const [keycloak, setKeycloak] = useState(rawKeycloak);

  const init = () => {
    return new Promise<boolean>((resolve, reject) => {
      keycloak
        .init({
          onLoad: "login-required",
          checkLoginIframe: false // without this, IE goes into redirect loop
        })
        .success((authenticated: boolean) => {
          setKeycloak(keycloak);
          resolve(authenticated);
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
        });
        return false;
      });
      setkeycloakInitialized(keycloakResponse);
    };
    startInit();
  };

  /**
   * Logs out of keycloak and redirects to the login page.
   * - redirects to the homepage after re-login
   * - this function gets passed to, and stored in the api
   */
  const logout = () => {
    const redirectUri = ENV.isProduction ? ENV.HOME_URL : `http://localhost:3000/`;
    const logoutOptions = { redirectUri };
    setkeycloakInitialized(false);
    keycloak.logout(logoutOptions);
  };

  let roles: string[] = [];
  let user: KeycloakUser = {};
  try {
    if (keycloak?.tokenParsed?.realm_access) {
      roles = keycloak.tokenParsed.realm_access.roles;
    }
    if (keycloak?.tokenParsed) {
      user = {
        organizationId: keycloak.tokenParsed.organization_id,
        familyName: keycloak.tokenParsed.family_name,
        givenName: keycloak.tokenParsed.given_name,
        email: keycloak.tokenParsed.email,
        name: keycloak.tokenParsed.name,
        preferredUsername: keycloak.tokenParsed.preferred_username,
      };
    }
  } catch (error) {
    log({
      file: `useKeycloak.tsx`,
      caller: `initKeycloak - parse error`,
      value: error,
      error: true,
    });
  }

  /**
   * checks if the user has the required permissions
   */
  const hasPermission = (permittedRoles: ROLES[]) => {
    const permittedRolesStrings: string[] = permittedRoles.map(role => role as string);
    for (let i = 0; i < roles.length; i++) {
      if (permittedRolesStrings.includes(roles[i])) {
        return true;
      }
    }
    return false;
  };

  const parsedKeycloak: ParsedKeycloak = { keycloak, logout, roles, user, hasPermission };

  return { keycloak: parsedKeycloak, keycloakInitialized, initKeycloak };
};