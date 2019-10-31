import { ApiResponse, ApisauceInstance } from 'apisauce';
import {
  AcousticModel,
  LanguageModel,
  SubGraph,
  TopGraph,
} from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  AcousticModelRequest,
  deleteAcousticModelResult,
  deleteLanguageModelResult,
  deleteSubGraphResult,
  getAcousticModelsResult,
  getLanguageModelsResult,
  getSubGraphsResult,
  getTopGraphsResult,
  LanguageModelRequest,
  postAcousticModelResult,
  postLanguageModelResult,
  postSubGraphResult,
  ProblemKind,
  ServerError,
  SubGraphRequest,
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
   * @param logout The logout method from `keycloakContext`.
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets a list of acoustic models
   */
  async getAcousticModels(): Promise<getAcousticModelsResult> {
    // make the api call
    const response: ApiResponse<
      AcousticModel[],
      ServerError
    > = await this.apisauce.get(`/models/acoustic`);
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
   * Create a new acoustic model
   * @param name
   * @param sampleRate
   * @param location
   * @param description
   */
  async postAcousticModel(
    name: string,
    sampleRate: number,
    location: string,
    description = ''
  ): Promise<postAcousticModelResult> {
    // compile data
    const request: AcousticModelRequest = {
      name,
      sampleRate,
      location,
      description,
    };
    // make the api call
    const response: ApiResponse<
      AcousticModel,
      ServerError
    > = await this.apisauce.post(`/models/acoustic`, request);
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
   * Update an existing acoustic model
   * @param modelId
   * @param name
   * @param sampleRate
   * @param location
   * @param description
   */
  async updateAcousticModel(
    modelId: number,
    name: string,
    sampleRate: number,
    location: string,
    description = ''
  ): Promise<updateAcousticModelResult> {
    // compile data
    const request: AcousticModelRequest = {
      name,
      sampleRate,
      location,
      description,
    };
    // make the api call
    const response: ApiResponse<
      AcousticModel,
      ServerError
    > = await this.apisauce.put(`/models/acoustic/${modelId}`, request);
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
   * Delete an existing acoustic model
   * @param modelId
   * @returns a `conflict` kind if the model cannot be deleted
   */
  async deleteAcousticModel(
    modelId: number
  ): Promise<deleteAcousticModelResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(`/models/acoustic/${modelId}`);
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
   * Gets a list of top graphs
   */
  async getTopGraphs(): Promise<getTopGraphsResult> {
    // make the api call
    const response: ApiResponse<
      TopGraph[],
      ServerError
    > = await this.apisauce.get(`/models/topgraphs`);
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
   * Gets a list of language models
   */
  async getLanguageModels(): Promise<getLanguageModelsResult> {
    // make the api call
    const response: ApiResponse<
      LanguageModel[],
      ServerError
    > = await this.apisauce.get(`/models/language-models`);
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
    topGraphId: number,
    subGraphIds: number[],
    description = ''
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
    > = await this.apisauce.post(`/models/language-models`, request);
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
   */
  async updateLanguageModel(
    modelId: number,
    name: string,
    topGraphId: number,
    subGraphIds: number[],
    description = ''
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
    > = await this.apisauce.put(`/models/language-models/${modelId}`, request);
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
    modelId: number
  ): Promise<deleteLanguageModelResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(`/models/language-models/${modelId}`);
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
    > = await this.apisauce.get(`/models/subgraphs`);
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
   * Create a new subgraph
   * @param name
   * @param text
   * @param isPublic
   */
  async postSubGraph(
    name: string,
    text: string,
    isPublic?: boolean
  ): Promise<postSubGraphResult> {
    // compile data
    const request: SubGraphRequest = {
      name,
      text,
      public: isPublic,
    };
    // make the api call
    const response: ApiResponse<
      SubGraph,
      ServerError
    > = await this.apisauce.post(`/models/subgraphs`, request);
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
   * @param subGraphId
   * @param name
   * @param text
   * @param isPublic
   */
  async updateSubGraph(
    subGraphId: number,
    name: string,
    text: string,
    isPublic?: boolean
  ): Promise<updateSubGraphResult> {
    // compile data
    const request: SubGraphRequest = {
      name,
      text,
      public: isPublic,
    };
    // make the api call
    const response: ApiResponse<
      SubGraph,
      ServerError
    > = await this.apisauce.put(`/models/subgraphs/${subGraphId}`, request);
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
  async deleteSubGraph(subGraphId: number): Promise<deleteSubGraphResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(`/models/subgraphs/${subGraphId}`);
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
   * Upload a subgraph file
   * @param name - the subgraph name
   * @param file - multipart file to upload
   * @param isPublic
   */
  async uploadSubGraphFile(
    name: string,
    file: File,
    isPublic?: boolean
  ): Promise<postSubGraphResult> {
    // compile data
    // needs name
    const request = new FormData();
    request.append('name', name);
    request.append('file', file);
    if (typeof isPublic === 'boolean') {
      request.append('public', JSON.stringify(isPublic));
    }
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    // make the api call
    const response: ApiResponse<
      SubGraph,
      ServerError
    > = await this.apisauce.post(`/models/subgraphs/file`, request, config);
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
}
