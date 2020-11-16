import { ApisauceInstance } from 'apisauce';
import { AxiosRequestConfig } from 'axios';
import { UPLOAD_REQUEST_TIMEOUT } from '../../../constants';
import { RawDataQueue } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getRawDataQueueResult,
  PostDownloadLinkRequest,
  PostDownloadLocationRequest,
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
   * Get the full queue history of the given project
   * @param projectId
   */
  async getFullQueue(projectId: string): Promise<> {

  };

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
    // query params
    const params = {
      'model-config': modelConfigId,
    };
    // compile data
    const request = new FormData();
    files.forEach(file => request.append('files', file));
    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'multipart/form-data',
      },
      timeout: UPLOAD_REQUEST_TIMEOUT,
      params,
    };
    // make the api call
    const response = await this.apisauce.post<string | undefined, ServerError>(
      this.getDecoderPath(`/projects/${projectId}/raw-data/upload`),
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

  /**
   * Send the path of the audio file to use that is already on the server
   * @param projectId
   * @param modelConfigName - **NOT** the ID
   * @param path - the path of the file on the server
   */
  async postDownloadLocation(
    projectId: string,
    modelConfigName: string,
    path: string,
  ): Promise<uploadRawDataResult> {
    // compile data
    const request: PostDownloadLocationRequest = {
      modelConfigName,
      path,
    };
    // make the api call
    const response = await this.apisauce.post<undefined, ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/raw-data/location`),
      request,
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
   * Send the url of the audio file to use that is from some online source
   * @param projectId
   * @param modelConfigName - **NOT** the ID
   * @param url - the url of the file online
   */
  async postDownloadLink(
    projectId: string,
    modelConfigName: string,
    url: string,
  ): Promise<uploadRawDataResult> {
    // compile data
    const request: PostDownloadLinkRequest = {
      modelConfigName,
      url,
    };
    // make the api call
    const response = await this.apisauce.post<undefined, ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/raw-data/url`),
      request,
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
