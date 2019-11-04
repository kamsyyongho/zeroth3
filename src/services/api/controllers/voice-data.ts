import { ApiResponse, ApisauceInstance } from 'apisauce';
import { getGeneralApiProblem } from '../api-problem';
import {
  ProblemKind,
  RenameOrganizationRequest,
  renameOrganizationResult,
  SearchDataRequest,
  searchDataResult,
  ServerError,
  VoiceDataResults,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all voice data requests to the API.
 */
export class VoiceData extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout The logout method from `keycloakContext`.
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets the voice data for a project
   * @param projectId
   * @param request - all values are optional
   */
  async searchData(
    projectId: number,
    request: SearchDataRequest = {}
  ): Promise<searchDataResult> {
    // set default values
    const { page = 0, size = 10 } = request;
    const query: SearchDataRequest = {
      ...request,
      page,
      size,
    };
    const response = await this.apisauce.get<VoiceDataResults, ServerError>(
      `/projects/${projectId}/data`,
      query
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
      const data = response.data as VoiceDataResults;
      return { kind: 'ok', data };
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
