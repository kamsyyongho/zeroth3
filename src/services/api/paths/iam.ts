import { ApiResponse, ApisauceInstance } from 'apisauce';
import { getGeneralApiProblem, ProblemKind } from '../api-problem';
import { getUserResult, User } from '../types';

/**
 * Manages all IAM requests to the API.
 */
export class IAM {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance;

  /**
   * Creates the api from the already initiated parent.
   *
   * @param apisauce The apisauce instance.
   */
  constructor(apisauce: ApisauceInstance) {
    this.apisauce = apisauce;
  }

  /**
   * gets a list of associated IAM users
   */
  async getUsers(): Promise<getUserResult> {
    // make the api call
    const response: ApiResponse<User[], unknown> = await this.apisauce.get(
      `/iam/users`
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const users = response.data as User[];
      return { kind: 'ok', users };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }
}
