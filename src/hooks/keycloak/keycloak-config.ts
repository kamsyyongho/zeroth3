import ENV from '../../services/env/index';

export const keycloakConfig = {
  url: ENV.KEYCLOAK_URL || 'http://localhost:8080/auth',
  realm: ENV.KEYCLOAK_REALM || 'zeroth',
  clientId: ENV.KEYCLOAK_CLIENT_ID || 'zeroth-web',
  /**
   * Access Token Lifespan (in seconds)
   * - 12 hours
   */
  tokenRefreshInterval: 43200 - 5
};
