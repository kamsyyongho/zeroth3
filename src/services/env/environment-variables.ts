/**
 * @returns `true` if `NODE_ENV === "production"`
 */

export const isProduction = process.env.REACT_APP_ENV || process.env.NODE_ENV === 'production';
export const NODE_ENV = process.env.REACT_APP_ENV || process.env.NODE_ENV;
export const KEYCLOAK_URL = NODE_ENV === 'production'
    ? 'http://13.125.20.108:8080/auth'
    : 'http://13.125.20.108:9080/auth';
export const KEYCLOAK_REALM = 'zeroth';
export const KEYCLOAK_CLIENT_ID = 'zeroth-web';
export const BACKEND_URL = NODE_ENV === 'production'
    ? 'http://13.125.20.108:8081'
    : 'http://13.125.20.108:9081';
/**
 * Homepage to redirect to after logout
 */
export const HOME_URL = NODE_ENV === 'production'
    ? 'http://staging.zeroth-ee.alabs.ai'
    : 'http://test.zeroth-ee.alabs.ai';
