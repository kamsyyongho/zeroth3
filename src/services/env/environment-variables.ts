// tell typescript that there will be a the `node.js` process global variable used
// this is used for the inline environment variables
declare const process: any;

export const KEYCLOAK_URL: string | undefined =
  process.env.REACT_APP_KEYCLOAK_URL;
export const KEYCLOAK_REALM: string | undefined =
  process.env.REACT_APP_KEYCLOAK_REALM;
export const KEYCLOAK_CLIENT_ID: string | undefined =
  process.env.REACT_APP_KEYCLOAK_CLIENT_ID;
