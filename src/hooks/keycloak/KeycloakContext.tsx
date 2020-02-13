import { KeycloakInstance } from "keycloak-js";
import { createContext } from "react";
import { noop } from '../../constants';
import { ROLES } from '../../types';
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
  roles: ROLES[];
  user: KeycloakUser;
  /**
   * checks if the user has the required permissions
   */
  hasPermission: (roles: ROLES[], permittedRoles: ROLES[]) => boolean;
  /**
   * sets the user roles for the current organization
   */
  initializeUserRoles: (userRolesForOrganization?: ROLES[]) => void;
}

const defaultContext: ParsedKeycloak = {
  keycloak: {} as KeycloakInstance,
  logout: noop,
  roles: [],
  user: {},
  hasPermission: noop,
  initializeUserRoles: noop,
};

export const KeycloakContext = createContext(defaultContext);