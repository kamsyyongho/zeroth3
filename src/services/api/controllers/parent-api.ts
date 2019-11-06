import { ApisauceInstance } from 'apisauce';
import { GeneralApiProblem } from '../types';

/**
 * Manages all of the parent api instances and methods.
 */
export class ParentApi {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance;

  /**
   * Refreshes the keycloak auth token
   * - logs out if it fails to refresh
   * @param callback - the callback to retry after refresh
   * @param responseProblem - the original server response
   */
  attemptToRefreshToken: <T>(
    callback: () => T,
    responseProblem: GeneralApiProblem
  ) => Promise<GeneralApiProblem | T>;

  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param attemptToRefreshToken parent method to refresh the keycloak token
   */
  constructor(
    apisauce: ApisauceInstance,
    attemptToRefreshToken: <T>(
      callback: () => T,
      responseProblem: GeneralApiProblem
    ) => Promise<GeneralApiProblem | T>
  ) {
    this.apisauce = apisauce;
    this.attemptToRefreshToken = attemptToRefreshToken;
  }
}
