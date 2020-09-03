import { ApiResponse, ApisauceInstance } from 'apisauce';
import { Organization } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getOrganizationsResult,
  ProblemKind,
  RenameOrganizationRequest,
  renameOrganizationResult,
  ServerError,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all organization requests to the API.
 */
export class Organizations extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout parent method coming from keycloak
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets the current organizations
   */
  async getOrganizations(): Promise<getOrganizationsResult> {
    const response = await this.apisauce.get<Organization[], ServerError>(
      `api/organizations`
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
      const organizations = response.data as Organization[];
      return { kind: 'ok', organizations };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Names / renames the current organization
   * @param name
   */
  async renameOrganization(name: string): Promise<renameOrganizationResult> {
    // compile data
    const request: RenameOrganizationRequest = {
      name,
    };
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.patch(
      this.getPathWithOrganization(`/name`),
      request
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
}
