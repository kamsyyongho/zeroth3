import Keycloak from 'keycloak-js';
import { useState } from 'react';
import { ParsedKeycloak } from './KeycloakContext';

interface CustomKeycloakTokenParsed extends Keycloak.KeycloakTokenParsed {
  organization_id?: number
}

interface CustomKeycloakInstance extends Keycloak.KeycloakInstance {
  tokenParsed?: CustomKeycloakTokenParsed
}

export const useKeycloak = () => {
  const keycloakConfig = {
    url: "http://localhost:8080/auth",
    realm: "zeroth",
    clientId: "zeroth-web",
    // Access Token Lifespan (in seconds)
    // tokenRefreshInterval: 60 - 5 // 1 min
    tokenRefreshInterval: 43200 - 5 // 12 hours
  }

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
        .error(() => reject({ message: "Failed to initialize keycloak" }));
    });
  };

  const runInit = async () => {
    const keycloakResponse = await init()
    setkeycloakInitialized(keycloakResponse);
  };

  const initKeycloak = () => {
    const startInit = async () => {
      await runInit()
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
    // do nothing
  }

  const parsedKeycloak: ParsedKeycloak = { keycloak, roles, organizationId }

  return { keycloak: parsedKeycloak, keycloakInitialized, initKeycloak }
}