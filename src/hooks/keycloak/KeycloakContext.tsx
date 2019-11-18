import { KeycloakInstance } from "keycloak-js";
import { createContext } from "react";
import { noop } from '../../constants';
import { KeycloakUser } from './useKeycloak';

export interface ParsedKeycloak {
  /**
   * the raw keycloak object
   */
  keycloak: KeycloakInstance,
  /**
   * logs the user out of keycloak and redirects to the main page
   */
  logout: () => void;
  /**
   * current roles assigned to the user
   */
  roles: string[];
  user: KeycloakUser;
}

const defaultContext: ParsedKeycloak = {
  keycloak: {} as KeycloakInstance,
  logout: noop,
  roles: [],
  user: {},
};

export const KeycloakContext = createContext(defaultContext);