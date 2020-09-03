import { ApisauceInstance } from 'apisauce';
import { DataSet, Role, User as UserType, Shortcuts, } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getDataSetsToFetchFromResult,
  ProblemKind,
  resetPasswordResult,
  ServerError,
  getProfile,
  getShortcuts,
  updateShortcuts,
  updatePhone,
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
      `/api/reset-password`,
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
  async getDataSetsToFetchFrom(completed?: boolean | null): Promise<getDataSetsToFetchFromResult> {
    let path;
    if(completed === null || completed === undefined) {
      path = '/assigned-datasets';
    } else {
      path = `/assigned-datasets?completed=${completed}`
    }
    // make the api call
    const response = await this.apisauce.get<DataSet[], ServerError>(
      this.getPathWithOrganization(path),
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

  async getProfile (name: string): Promise<getProfile> {
    const params = {name};
    const response = await this.apisauce.get<User, ServerError>(
        '/api/profile',
        params,
    );
    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    try {
      const user = response.data as UserType;
      return { kind: 'ok', user };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  async updatePhone (phone: string): Promise<updatePhone> {
    const params = {phone}
    // make the api call
    const response = await this.apisauce.patch<User, ServerError>(
        `/api/profile/phone`,
        params,
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
    try {
      const user = response.data as UserType;
      return { kind: 'ok', user };
    } catch {
      return { kind: ProblemKind['bad-data'] };

    }
  }

  async getShortcuts (): Promise<getShortcuts> {
    const response = await this.apisauce.get<any, ServerError>(
        '/api/shortcuts',
    );

    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }

    try {
      const data = response.data;
      const shortcuts = JSON.parse(data.shortcuts) as Shortcuts;
      return { kind: 'ok', shortcuts }
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  async updateShortcuts (shortcuts: any): Promise<updateShortcuts> {
    const JSONShortcuts = JSON.stringify(shortcuts)
    const params = {shortcuts: JSONShortcuts};
    const response = await this.apisauce.post<undefined, ServerError>(
        'api/shortcuts',
        params,
    );

    if(!response.ok) {
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
}
