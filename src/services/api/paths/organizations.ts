import { ApiResponse, ApisauceInstance } from 'apisauce';
import { getGeneralApiProblem } from '../api-problem';
import { ProblemKind, renameOrganizationResult, ServerError } from '../types';
import { RenameOrganizationRequest } from '../types/organizations.types';
import { ParentApi } from './parent-api';

/**
 * Manages all organization requests to the API.
 */
export class Organizations extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout The logout method from `keycloakContext`.
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Names / renames an organization
   * @param name
   */
  async renameOrganization(name: string): Promise<renameOrganizationResult> {
    // compile data
    const request: RenameOrganizationRequest = {
      name
    };
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.patch(`/organizations/name`, request);
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
