import Keycloak from 'keycloak-js';
import { useState } from 'react';
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
        console.log("Keycloak init error:", error)
        return false
      })
      setkeycloakInitialized(keycloakResponse);
    };
    startInit();
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
    console.log("Keycloak parse error:", error)
  }

  const parsedKeycloak: ParsedKeycloak = { keycloak, roles, organizationId }

  return { keycloak: parsedKeycloak, keycloakInitialized, initKeycloak }
}