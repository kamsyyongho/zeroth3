import { ApisauceInstance, create, HEADERS } from 'apisauce';
import { KeycloakInstance } from 'keycloak-js';
import { ApiConfig, DEFAULT_API_CONFIG } from './api-config';
import { IAM } from './paths/iam';

/**
 * Main class that manages all requests to the API.
 */
export class Api {
  /**
   * Configurable options.
   */
  config: ApiConfig;

  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance;

  /**
   * The Keycloak instance that will hold the auth / refresh tokens.
   */
  keycloak: KeycloakInstance | undefined;

  /**
   * Subclass that manages IAM requests.
   */
  IAM: IAM;

  /**
   * Creates the api.
   *
   * - Be as quick as possible in here.
   * @param config The configuration to use.
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config;
    this.apisauce = create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.generateHeader()
    });
    this.IAM = new IAM(this.apisauce);
  }

  /**
   * Generates the initial header for API calls
   * - does NOT include `Authorization`
   */
  private generateHeader(): HEADERS {
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Gets the current header that is being used for API calls
   */
  private getHeader(): HEADERS | undefined {
    return this.apisauce && this.apisauce.headers;
  }

  /**
   * Update the header with a new auth token from keycloak,
   * or delete `Authorization` from the header entirely.
   * @param reset deletes `Authorizatoin` from the header
   */
  private updateAuthToken(reset = false): void {
    if (this.keycloak) {
      try {
        const { token } = this.keycloak;
        this.apisauce.setHeader('Authorization', `Bearer ${token}`);
      } catch (error) {
        console.log('Error updating auth token:', error);
        reset = true;
      }
    } else if (reset) {
      this.apisauce.deleteHeader('Authorization');
    }
  }

  /**
   * sets the keycloak object within the api and updates the api's auth token
   * @param keycloak
   */
  registerKeycloak(keycloak: KeycloakInstance): void {
    this.keycloak = keycloak;
    this.updateAuthToken();
  }
}
