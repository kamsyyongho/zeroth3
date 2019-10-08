import { KeycloakInstance } from "keycloak-js";
import { createContext } from "react";

export interface ParsedKeycloak {
  keycloak: KeycloakInstance,
  roles: string[]
  organizationId?: number
}

const defaultContext: ParsedKeycloak = {
  keycloak: {} as KeycloakInstance,
  roles: [],
  organizationId: undefined
}

export const KeycloakContext = createContext(defaultContext)