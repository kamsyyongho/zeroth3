import { ApiResponse, ApisauceInstance } from 'apisauce';
import { getGeneralApiProblem } from '../api-problem';
import {
  GeneralApiProblem,
  getRawDataResult,
  ProblemKind,
  ServerError,
  uploadRawDataResult,
} from '../types';
import { RawDataAdditionalProps } from '../types/raw-data.types';
import { ParentApi } from './parent-api';

/**
 * Manages all raw audio data requests to the API.
 */
export class RawData extends ParentApi {
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
    super(apisauce, attemptToRefreshToken);
  }

  /**
   * Gets raw audio data
   * @param projectId
   */
  async getRawData(projectId: number): Promise<getRawDataResult> {
    // make the api call
    const response = await this.apisauce.get<
      RawDataAdditionalProps,
      ServerError
    >(`/projects/${projectId}/data/raw`);
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(
            () => this.getRawData(projectId),
            problem
          );
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const results = response.data as RawDataAdditionalProps;
      return { kind: 'ok', results };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Upload audio files
   * @param projectId
   * @param modelConfigId
   * @param files - multipart files to upload
   * @returns `rejected` if total file size exceeded
   * - total size of all files together must be less than 10MB
   */
  async uploadRawData(
    projectId: number,
    modelConfigId: number,
    files: File[]
  ): Promise<uploadRawDataResult> {
    // compile data
    const request = new FormData();
    request.append('model-config', modelConfigId.toString());
    files.forEach(file => request.append('files', file));
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.post(
      `/projects/${projectId}/data/raw`,
      request,
      config
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(
            () => this.uploadRawData(projectId, modelConfigId, files),
            problem
          );
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }
}
