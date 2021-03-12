import { ApisauceInstance } from 'apisauce';
import { noop } from '../../../constants';
import { LOCAL_STORAGE_KEYS } from '../../../types';

/**
 * Manages all of the parent api instances and methods.
 */
export abstract class ParentApi {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance;

  /**
   * The logout method from `keycloakContext`.
   * - redirects to the login page
   */
  logout: () => void = noop;

  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    this.apisauce = apisauce;
    this.logout = logout;
  }

  /**
   * Adds the correct organization information to api requests
   * - logs out if there is no valid ID
   * @param path the api path we are making a request to
   */
  private buildPathStringWithOrganizationInfo(path: string): string {
    const organizationId = localStorage.getItem(
      LOCAL_STORAGE_KEYS.ORGANIZATION_ID,
    );
    if (typeof organizationId === 'string') {
      return `/organizations/${organizationId}${path}`;
    } else {
      this.logout();
      return path;
    }
  }

  getDecoderPath(path:string): string {
    return '/decoding' + this.buildPathStringWithOrganizationInfo(path);
  }

  /**
   * Adds the correct organization information to api requests
   * - puts `/organizations/{organizationId}` to the beginning of the path
   * - logs out if there is no valid ID
   * @param path the api path we are making a request to
   */
  getPathWithOrganization(path: string): string {
    return '/api' + this.buildPathStringWithOrganizationInfo(path);
  }

  getPathWithGrap(path: string): string {
    return '/grafana/api' + path;
  }
}

