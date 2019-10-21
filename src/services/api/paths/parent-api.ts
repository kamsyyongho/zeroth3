import { ApisauceInstance } from 'apisauce';

/**
 * Manages all of the parent api instances and methods.
 */
export class ParentApi {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance;

  /**
   * The logout method from `keycloakContext`.
   * - redirects to the login page
   */
  logout: () => void = () => {};

  /**
   * Creates the api from the already initiated parent.
   *
   * @param apisauce The apisauce instance.
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    this.apisauce = apisauce;
    this.logout = logout;
  }
}
