import ENV from '../../services/env';

/**
 * - just under 12 hours in minutes
 */
export const DEFAULT_KEYCLOAK_TOKEN_REFRESH_INTERVAL = 43200 - 5;

export const keycloakConfig = {
  url: ENV.KEYCLOAK_URL || 'http://keycloak:8080/auth',
  realm: ENV.KEYCLOAK_REALM || 'zeroth',
  clientId: ENV.KEYCLOAK_CLIENT_ID || 'zeroth-web',
  /**
   * Access Token Lifespan (in seconds)
   * - 12 hours
   */
  tokenRefreshInterval: DEFAULT_KEYCLOAK_TOKEN_REFRESH_INTERVAL,
};
