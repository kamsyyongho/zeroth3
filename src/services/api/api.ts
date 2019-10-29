import { ApiResponse, ApisauceInstance, create, HEADERS } from 'apisauce';
import { KeycloakInstance } from 'keycloak-js';
import log from '../../util/log/logger';
import ENV from '../env/index';
import { ApiConfig, DEFAULT_API_CONFIG } from './api-config';
import { IAM } from './paths/iam';
import { Projects } from './paths/projects';
import { Models } from './paths/models';

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
  apisauce: ApisauceInstance | undefined;

  /**
   * The Keycloak instance that will hold the auth / refresh tokens.
   */
  keycloak: KeycloakInstance | undefined;

  /**
   * The logout method from `keycloakContext`.
   * - redirects to the login page
   */
  logout: () => void = () => {};

  /**
   * Subclass that manages IAM requests.
   */
  IAM: IAM | undefined;

  /**
   * Subclass that manages project requests.
   */
  projects: Projects | undefined;

  /**
   * Subclass that manages model requests.
   */
  models: Models | undefined;

  /**
   * Creates the api.
   *
   * - Be as quick as possible in here.
   * @param config The configuration to use.
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config;
  }

  /**
   * Sets up the API.  This will be called during the bootup
   * sequence and will happen before the first React component
   * is mounted.
   *
   * Be as quick as possible in here.
   */
  setup(keycloak: KeycloakInstance, logout: () => void): boolean {
    this.keycloak = keycloak;
    this.logout = logout;
    // construct the apisauce instance
    this.apisauce = create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.generateHeader()
    });
    // log all responses
    if (!ENV.isProduction) {
      this.apisauce.addMonitor(this.responseMonitor);
    }
    this.IAM = new IAM(this.apisauce, this.logout);
    this.projects = new Projects(this.apisauce, this.logout);
    this.models = new Models(this.apisauce, this.logout);
    return true;
  }

  /**
   * Logs apisauce responses
   * @param response from `apisauce`
   */
  private responseMonitor(response: ApiResponse<unknown, unknown>): void {
    log({
      file: 'api.ts',
      caller: 'API - responseMonitor',
      value: response,
      api: true
    });
  }

  /**
   * Generates the initial header for API calls
   * - does NOT include `Authorization` if `keycloak` has not been set
   */
  private generateHeader(): HEADERS {
    const header: HEADERS = {
      'Content-Type': 'application/json'
    };
    if (this.keycloak) {
      try {
        const { token } = this.keycloak;
        header.Authorization = `Bearer ${token}`;
        if (!token) {
          log({
            file: `api.ts`,
            caller: `generateHeader`,
            value: 'TOKEN IS UNDEFINED',
            important: true
          });
        }
      } catch (error) {
        log({
          file: `api.ts`,
          caller: `generateHeader- error setting token`,
          value: error,
          error: true
        });
      }
    }
    return header;
  }

  /**
   * Gets the current header that is being used for API calls
   */
  getHeader(): HEADERS | undefined {
    return this.apisauce && this.apisauce.headers;
  }

  /**
   * Update the header with a new auth token from keycloak,
   * or delete `Authorization` from the header entirely.
   * @param reset deletes `Authorization` from the header
   */
  private updateAuthToken(reset = false): void {
    if (!this.apisauce) return;
    if (this.keycloak) {
      try {
        const { token } = this.keycloak;
        this.apisauce.setHeader('Authorization', `Bearer ${token}`);
      } catch (error) {
        log({
          file: `api.ts`,
          caller: `updateAuthToken- error updating token`,
          value: error,
          error: true
        });
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
  setKeycloak(keycloak: KeycloakInstance): void {
    this.keycloak = keycloak;
    this.updateAuthToken();
  }
}
