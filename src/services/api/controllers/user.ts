import { ApisauceInstance } from 'apisauce';
import { DataSet } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getDataSetsToFetchFromResult,
  ProblemKind,
  resetPasswordResult,
  ServerError,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all user requests to the API.
 */
export class User extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout parent method coming from keycloak
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Resets the current user's password
   */
  async resetPassword(): Promise<resetPasswordResult> {
    // make the api call
    const response = await this.apisauce.post<undefined, ServerError>(
      `/reset-password`,
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }

  /**
   * Gets a list of data sets assigned to the user
   */
  async getDataSetsToFetchFrom(): Promise<getDataSetsToFetchFromResult> {
    // make the api call
    const response = await this.apisauce.get<DataSet[], ServerError>(
      this.getPathWithOrganization(`/assigned-datasets`),
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const dataSets = response.data as DataSet[];
      return { kind: 'ok', dataSets };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }
}
