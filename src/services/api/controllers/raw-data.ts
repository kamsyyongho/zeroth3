import { ApiResponse, ApisauceInstance } from 'apisauce';
import { getGeneralApiProblem } from '../api-problem';
import {
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
   * @param logout parent method coming from keycloak
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets raw audio data
   * @param projectId
   */
  async getRawData(projectId: string): Promise<getRawDataResult> {
    // make the api call
    const response = await this.apisauce.get<
      RawDataAdditionalProps,
      ServerError
    >(this.getPathWithOrganization(`/projects/${projectId}/raw-data`));
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
    projectId: string,
    modelConfigId: string,
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
      this.getPathWithOrganization(
        this.getPathWithOrganization(`/projects/${projectId}/raw-data`)
      ),
      request,
      config
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
