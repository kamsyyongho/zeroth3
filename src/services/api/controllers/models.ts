import { ApiResponse, ApisauceInstance } from 'apisauce';
import { AxiosRequestConfig } from 'axios';
import { UPLOAD_REQUEST_TIMEOUT } from '../../../constants';
import {
  AcousticModel,
  LanguageModel,
  SubGraph,
  TopGraph,
  TRAINING_METHODS,
} from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  AcousticModelEditRequest,
  deleteLanguageModelResult,
  deleteSubGraphResult,
  getAcousticModelsResult,
  getLanguageModelsResult,
  getSubGraphsResult,
  getTopGraphsResult,
  getTrainingMethodsResult,
  LanguageModelRequest,
  postLanguageModelResult,
  postSubGraphResult,
  ProblemKind,
  refreshAndGetAcousticModelsResult,
  refreshAndGetTopGraphResult,
  ServerError,
  SubGraphRequest,
  TransferLearningRequest,
  transferLearningResult,
  updateAcousticModelResult,
  updateLanguageModelResult,
  updateSubGraphResult,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all model requests to the API.
 */
export class Models extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout parent method coming from keycloak
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets a list of acoustic models
   */
  async getAcousticModels(): Promise<getAcousticModelsResult> {
    // make the api call
    const response = await this.apisauce.get<AcousticModel[], ServerError>(
      this.getPathWithOrganization(`/models/acoustic`),
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
      const acousticModels = response.data as AcousticModel[];
      return { kind: 'ok', acousticModels };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Refreshes the list in the server, then receives acoustic models
   */
  async refreshAndGetAcousticModels(): Promise<
    refreshAndGetAcousticModelsResult
  > {
    // make the api call
    const response = await this.apisauce.get<AcousticModel[], ServerError>(
      this.getPathWithOrganization(`/models/acoustic/refresh`),
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
      const acousticModels = response.data as AcousticModel[];
      return { kind: 'ok', acousticModels };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Update an existing acoustic model's description
   * @param modelId
   * @param description
   * @returns a `conflict` kind if the model cannot be updated
   */
  async updateAcousticModel(
    modelId: string,
    description = '',
  ): Promise<updateAcousticModelResult> {
    // compile data
    const request: AcousticModelEditRequest = {
      description,
    };
    // make the api call
    const response: ApiResponse<
      AcousticModel,
      ServerError
    > = await this.apisauce.put(
      this.getPathWithOrganization(`/models/acoustic/${modelId}`),
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
    // transform the data into the format we are expecting
    try {
      const acousticModel = response.data as AcousticModel;
      return { kind: 'ok', acousticModel };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets a list of top graphs
   */
  async getTopGraphs(): Promise<getTopGraphsResult> {
    // make the api call
    const response: ApiResponse<
      TopGraph[],
      ServerError
    > = await this.apisauce.get(
      this.getPathWithOrganization(`/models/topgraphs`),
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
      const topGraphs = response.data as TopGraph[];
      return { kind: 'ok', topGraphs };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Refreshes top graphs in the server.
   * @returns `null` - `202 code`
   */
  async refreshAndGetTopGraph(): Promise<refreshAndGetTopGraphResult> {
    // make the api call
    const response: ApiResponse<
      TopGraph[],
      ServerError
    > = await this.apisauce.get(
      this.getPathWithOrganization(`/models/topgraphs/refresh`),
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
   * Gets a list of language models
   */
  async getLanguageModels(): Promise<getLanguageModelsResult> {
    // make the api call
    const response: ApiResponse<
      LanguageModel[],
      ServerError
    > = await this.apisauce.get(
      this.getPathWithOrganization(`/models/language-models`),
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
      const languageModels = response.data as LanguageModel[];
      return { kind: 'ok', languageModels };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Create a new language model
   * @param name
   * @param topGraphId
   * @param subGraphIds
   * @param description
   */
  async postLanguageModel(
    name: string,
    topGraphId: string,
    subGraphIds: string[],
    description = '',
  ): Promise<postLanguageModelResult> {
    // compile data
    const request: LanguageModelRequest = {
      name,
      topGraphId,
      subGraphIds,
      description,
    };
    // make the api call
    const response: ApiResponse<
      LanguageModel,
      ServerError
    > = await this.apisauce.post(
      this.getPathWithOrganization(`/models/language-models`),
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
    // transform the data into the format we are expecting
    try {
      const languageModel = response.data as LanguageModel;
      return { kind: 'ok', languageModel };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Update an existing language model
   * @param modelId
   * @param name
   * @param topGraphId
   * @param subGraphIds
   * @param description
   * @returns a `conflict` kind if the model cannot be updated
   */
  async updateLanguageModel(
    modelId: string,
    name: string,
    topGraphId: string,
    subGraphIds: string[],
    description = '',
  ): Promise<updateLanguageModelResult> {
    // compile data
    const request: LanguageModelRequest = {
      name,
      topGraphId,
      subGraphIds,
      description,
    };
    // make the api call
    const response: ApiResponse<
      LanguageModel,
      ServerError
    > = await this.apisauce.put(
      this.getPathWithOrganization(`/models/language-models/${modelId}`),
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
    // transform the data into the format we are expecting
    try {
      const languageModel = response.data as LanguageModel;
      return { kind: 'ok', languageModel };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Delete an existing language model
   * @param modelId
   * @returns a `conflict` kind if the model cannot be deleted
   */
  async deleteLanguageModel(
    modelId: string,
  ): Promise<deleteLanguageModelResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(
      this.getPathWithOrganization(`/models/language-models/${modelId}`),
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
   * Gets a list of sub graphs
   */
  async getSubGraphs(): Promise<getSubGraphsResult> {
    // make the api call
    const response: ApiResponse<
      SubGraph[],
      ServerError
    > = await this.apisauce.get(
      this.getPathWithOrganization(`/models/subgraphs`),
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
      const subGraphs = response.data as SubGraph[];
      return { kind: 'ok', subGraphs };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Create a new subgraph using text
   * @param name
   * @param text
   * @param topGraphId
   * @param isPublic
   * @param isImmutable
   */
  async postSubGraph(
    name: string,
    text: string,
    topGraphId: string,
    isPublic: boolean,
    isImmutable: boolean,
  ): Promise<postSubGraphResult> {
    // compile data
    const request: SubGraphRequest = {
      name,
      text,
      topGraphId,
      public: isPublic,
      immutable: isImmutable,
    };
    // make the api call
    const response: ApiResponse<
      SubGraph,
      ServerError
    > = await this.apisauce.post(
      this.getPathWithOrganization(`/models/subgraphs`),
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
    // transform the data into the format we are expecting
    try {
      const subGraph = response.data as SubGraph;
      return { kind: 'ok', subGraph };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Update an existing subgraph
   * - can only update with text
   * @param subGraphId
   * @param name
   * @param text
   * @param topGraphId
   * @param isPublic
   * @param isImmutable
   * @returns a `conflict` kind if the subgraph cannot be updated
   */
  async updateSubGraph(
    subGraphId: string,
    name: string,
    text: string,
    topGraphId: string,
    isPublic: boolean,
    isImmutable: boolean,
  ): Promise<updateSubGraphResult> {
    // compile data
    const request: SubGraphRequest = {
      name,
      text,
      topGraphId,
      public: isPublic,
      immutable: isImmutable,
    };
    // make the api call
    const response: ApiResponse<
      SubGraph,
      ServerError
    > = await this.apisauce.put(
      this.getPathWithOrganization(`/models/subgraphs/${subGraphId}`),
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
    // transform the data into the format we are expecting
    try {
      const subGraph = response.data as SubGraph;
      return { kind: 'ok', subGraph };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Delete an existing subgraph
   * @param subGraphId
   * @returns a `conflict` kind if the subgraph cannot be deleted
   */
  async deleteSubGraph(subGraphId: string): Promise<deleteSubGraphResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(
      this.getPathWithOrganization(`/models/subgraphs/${subGraphId}`),
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
   * Create a new subgraph using a file to upload
   * - 30 second timeout
   * @param name - the subgraph name
   * @param file - multipart file to upload
   * @param topGraphId
   * @param isPublic
   * @param isImmutable
   */
  async uploadSubGraphFile(
    name: string,
    file: File,
    topGraphId: string,
    isPublic: boolean,
    isImmutable: boolean,
  ): Promise<postSubGraphResult> {
    // compile data
    // needs name
    const request = new FormData();
    request.append('name', name);
    request.append('file', file);
    request.append('top-graph-id', topGraphId);
    if (typeof isPublic === 'boolean') {
      request.append('public', JSON.stringify(isPublic));
    }
    if (typeof isImmutable === 'boolean') {
      request.append('public', JSON.stringify(isImmutable));
    }
    const config: AxiosRequestConfig = {
      headers: {
        'content-type': 'multipart/form-data',
      },
      timeout: UPLOAD_REQUEST_TIMEOUT,
    };
    // make the api call
    const response: ApiResponse<
      SubGraph,
      ServerError
    > = await this.apisauce.post(
      this.getPathWithOrganization(`/models/subgraphs/file`),
      request,
      config,
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
      const subGraph = response.data as SubGraph;
      return { kind: 'ok', subGraph };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Begins training a model based on the selected method
   * @param projectId
   * @param name
   * @param modelConfigId
   * @param dataSetIds
   * @param shared
   * @param hrOnly - only high risk segments will be used in training
   */
  async transferLearning(
    projectId: string,
    name: string,
    modelConfigId: string,
    dataSetIds: string[],
    shared: boolean,
    hrOnly: boolean,
  ): Promise<transferLearningResult> {
    // compile data
    const request: TransferLearningRequest = {
      name,
      modelConfigId,
      dataSetIds,
      shared,
      hrOnly,
    };
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.post(
      this.getPathWithOrganization(`/projects/${projectId}/transfer`),
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
   * Gets the list of available training methods
   */
  async getTrainingMethods(): Promise<getTrainingMethodsResult> {
    // make the api call
    const response: ApiResponse<
      TRAINING_METHODS[],
      ServerError
    > = await this.apisauce.get(`/training-methods`);
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
      const trainingMethods = response.data as TRAINING_METHODS[];
      return { kind: 'ok', trainingMethods };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }
}
