import { ApiResponse, ApisauceInstance } from 'apisauce';
import { ModelConfig as ModelConfigType } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  deleteModelConfigResult,
  getModelConfigsResult,
  ModelConfigRequest,
  postModelConfigResult,
  ProblemKind,
  ServerError,
} from '../types';
import { updateModelConfigResult } from '../types/model-config.types';
import { ParentApi } from './parent-api';

/**
 * Manages all model config requests to the API.
 */
export class ModelConfig extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param attemptToRefreshToken parent method to refresh the keycloak token
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets a list of associated model configs
   * @param projectId
   */
  async getModelConfigs(projectId: string): Promise<getModelConfigsResult> {
    // make the api call
    const response: ApiResponse<
      ModelConfigType[],
      ServerError
    > = await this.apisauce.get(`/projects/${projectId}/model-config`);
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
      const modelConfigs = response.data as ModelConfigType[];
      return { kind: 'ok', modelConfigs };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Create a new model config
   * @param projectId
   * @param name
   * @param description
   * @param acousticModelId
   * @param languageModelId
   * @param thresholdHc
   * @param thresholdLc
   */
  async postModelConfig(
    projectId: string,
    name: string,
    description: string,
    acousticModelId: string,
    languageModelId: string,
    thresholdHc: number | null,
    thresholdLc: number | null
  ): Promise<postModelConfigResult> {
    // compile data
    const request: ModelConfigRequest = {
      name,
      thresholdHc,
      thresholdLc,
      description,
      acousticModelId,
      languageModelId,
    };
    // make the api call
    const response: ApiResponse<
      ModelConfigType,
      ServerError
    > = await this.apisauce.post(
      `/projects/${projectId}/model-config`,
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
    // transform the data into the format we are expecting
    try {
      const modelConfig = response.data as ModelConfigType;
      return { kind: 'ok', modelConfig };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Create a new model config
   * @param modelConfigId
   * @param projectId
   * @param name
   * @param description
   * @param acousticModelId
   * @param languageModelId
   * @param thresholdHc
   * @param thresholdLc
   * @returns a `conflict` kind if the model config cannot be updated
   */
  async updateModelConfig(
    modelConfigId: string,
    projectId: string,
    name: string,
    description: string,
    acousticModelId: string,
    languageModelId: string,
    thresholdHc: number | null,
    thresholdLc: number | null
  ): Promise<updateModelConfigResult> {
    // compile data
    const request: ModelConfigRequest = {
      name,
      thresholdHc,
      thresholdLc,
      description,
      acousticModelId,
      languageModelId,
    };
    // make the api call
    const response: ApiResponse<
      ModelConfigType,
      ServerError
    > = await this.apisauce.put(
      `/projects/${projectId}/model-config/${modelConfigId}`,
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
    // transform the data into the format we are expecting
    try {
      const modelConfig = response.data as ModelConfigType;
      return { kind: 'ok', modelConfig };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Deletes an associated model config
   * @param projectId
   * @param modelConfigId
   */
  async deleteModelConfig(
    projectId: string,
    modelConfigId: string
  ): Promise<deleteModelConfigResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(
      `/projects/${projectId}/model-config/${modelConfigId}`
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
