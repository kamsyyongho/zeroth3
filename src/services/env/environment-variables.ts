/**
 * @returns `true` if the `NODE_ENV === "production"`
 */
export const isProduction = process.env.NODE_ENV === 'production';
export const NODE_ENV = process.env.NODE_ENV;
export const KEYCLOAK_URL = process.env.REACT_APP_KEYCLOAK_URL;
export const KEYCLOAK_REALM = process.env.REACT_APP_KEYCLOAK_REALM;
export const KEYCLOAK_CLIENT_ID = process.env.REACT_APP_KEYCLOAK_CLIENT_ID;
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
/**
 * Homepage to redirect to after logout
 */
export const HOME_URL = process.env.REACT_APP_HOME_URL;
