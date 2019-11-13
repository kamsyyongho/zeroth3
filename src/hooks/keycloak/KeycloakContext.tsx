import { KeycloakInstance } from "keycloak-js";
import { createContext } from "react";
import { noop } from '../../constants';

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
  organizationId?: number;
}

const defaultContext: ParsedKeycloak = {
  keycloak: {} as KeycloakInstance,
  logout: noop,
  roles: [],
  organizationId: undefined
};

export const KeycloakContext = createContext(defaultContext);