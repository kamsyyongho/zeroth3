import { KeycloakInstance } from 'keycloak-js';
import { useState } from 'react';
import { Api } from '../../services/api/api';

export const useApi = () => {
  const rawApi = new Api();
  const [apiInitialized, setApiInitialized] = useState(false);
  const [api, setApi] = useState(rawApi);

  const initApi = (keycloak: KeycloakInstance, logout: () => void) => {
    if (apiInitialized) setApiInitialized(false); // handle re-login
    const apiResponse = api.setup(keycloak, logout);
    setApiInitialized(apiResponse);
  };

  return { api, apiInitialized, initApi };
};