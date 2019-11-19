import { KeycloakInstance } from "keycloak-js";
import { createContext } from "react";
import { noop } from '../../constants';
import { KeycloakUser } from './useKeycloak';
import { ROLES } from '../../types';

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
  /**
   * checks if the user has the required permissions
   */
  hasPermission: (permittedRoles: ROLES[]) => boolean;
}

const defaultContext: ParsedKeycloak = {
  keycloak: {} as KeycloakInstance,
  logout: noop,
  roles: [],
  user: {},
  hasPermission: noop,
};

export const KeycloakContext = createContext(defaultContext);