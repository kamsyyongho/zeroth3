import { ApiResponse, ApisauceInstance } from 'apisauce';
import {
  AcousticModel,
  LanguageModel,
  SubGraph,
  TopGraph,
} from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getAcousticModelsResult,
  getLanguageModelsResult,
  getSubGraphsResult,
  getTopGraphsResult,
  PostAcousticModelRequest,
  postAcousticModelResult,
  PostLanguageModelRequest,
  postLanguageModelResult,
  PostSubGraphRequest,
  postSubGraphResult,
  ProblemKind,
  ServerError,
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
    const request: PostAcousticModelRequest = {
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
    const request: PostLanguageModelRequest = {
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
    const request: PostSubGraphRequest = {
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
      const subgraph = response.data as SubGraph;
      return { kind: 'ok', subgraph };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
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
      request.append('public', isPublic ? 'true' : 'false');
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
      const subgraph = response.data as SubGraph;
      return { kind: 'ok', subgraph };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }
}
