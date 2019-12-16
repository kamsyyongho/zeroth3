import { ApisauceInstance } from 'apisauce';
import { DataSet as DataSetInterface, FilterParams } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  AssignTranscribersToDataSetRequest,
  assignTranscribersToDataSetResult,
  getAllResult,
  PostDataSetRequest,
  postDataSetResult,
  ProblemKind,
  ServerError,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all data set requests to the API.
 */
export class DataSet extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param attemptToRefreshToken parent method to refresh the keycloak token
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets all data sets
   * @param projectId
   */
  async getAll(projectId: string): Promise<getAllResult> {
    const response = await this.apisauce.get<DataSetInterface[], ServerError>(
      `/projects/${projectId}/data-sets`
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
      const dataSets = response.data as DataSetInterface[];
      return { kind: 'ok', dataSets };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Creates a new data set
   * @param name
   * @param projectId
   * @param filterParams
   */
  async postDataSet(
    name: string,
    projectId: string,
    filterParams: FilterParams
  ): Promise<postDataSetResult> {
    // build the request
    const request: PostDataSetRequest = {
      name,
      filterParams,
    };
    const response = await this.apisauce.post<undefined, ServerError>(
      `/projects/${projectId}/data-sets`,
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

  /**
   * Assign transcribers to a data set
   * @param dataSetId
   * @param projectId
   * @param transcribers
   */
  async assignTranscribersToDataSet(
    dataSetId: string,
    projectId: string,
    transcribers: string[]
  ): Promise<assignTranscribersToDataSetResult> {
    // build the request
    const request: AssignTranscribersToDataSetRequest = {
      transcribers,
    };
    const response = await this.apisauce.post<undefined, ServerError>(
      `/projects/${projectId}/data-sets/${dataSetId}`,
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
