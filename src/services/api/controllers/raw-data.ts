import { ApisauceInstance } from 'apisauce';
import { RawDataQueue } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getRawDataQueueResult,
  ProblemKind,
  ServerError,
  uploadRawDataResult,
} from '../types';
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
   * Gets the number of items in the project's upload queue
   * @param projectId
   */
  async getRawDataQueue(projectId: string): Promise<getRawDataQueueResult> {
    // make the api call
    const response = await this.apisauce.get<RawDataQueue, ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/raw-data/queue`),
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
      const queue = response.data as RawDataQueue;
      return { kind: 'ok', queue };
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
    files: File[],
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
    const response = await this.apisauce.post<string | undefined, ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/raw-data`),
      request,
      config,
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['teapot']) {
          try {
            const warningMessage = response.data as string;
            return { kind: 'ok', warningMessage };
          } catch {
            return { kind: ProblemKind['bad-data'] };
          }
        }
        if (problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }
}
