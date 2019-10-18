import { ApiResponse, ApisauceInstance } from 'apisauce';
import { AcousticModel } from '../../../types';
import {
  BaseModel,
  LanguageModel,
  Subgraph
} from '../../../types/models.types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getAcousticModelsResult,
  PostAcousticModelRequest,
  postAcousticModelResult,
  ProblemKind,
  ServerError
} from '../types';
import {
  getBaseModelsResult,
  getLanguageModelsResult,
  getSubgraphsResult,
  PostLanguageModelRequest,
  postLanguageModelResult,
  PostSubgraphRequest,
  postSubgraphResult
} from '../types/models.types';
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
   * @param description
   * @param sampleRate
   * @param location
   */
  async postAcousticModel(
    name: string,
    description: string,
    sampleRate: number,
    location?: string
  ): Promise<postAcousticModelResult> {
    // compile data
    const request: PostAcousticModelRequest = {
      name,
      description,
      sampleRate,
      location
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
   * Gets a list of base models
   */
  async getBaseModels(): Promise<getBaseModelsResult> {
    // make the api call
    const response: ApiResponse<
      BaseModel[],
      ServerError
    > = await this.apisauce.get(`/models/base-models`);
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
      const baseModels = response.data as BaseModel[];
      return { kind: 'ok', baseModels };
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
   * @param description
   * @param baseModelId
   * @param subGraphIds
   */
  async postLanguageModel(
    name: string,
    description: string,
    baseModelId: number,
    subGraphIds: number[]
  ): Promise<postLanguageModelResult> {
    // compile data
    const request: PostLanguageModelRequest = {
      name,
      description,
      baseModelId,
      subGraphIds
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
   * Gets a list of subgraphs
   */
  async getSubgraphs(): Promise<getSubgraphsResult> {
    // make the api call
    const response: ApiResponse<
      Subgraph[],
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
      const subgraphs = response.data as Subgraph[];
      return { kind: 'ok', subgraphs };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Create a new subgraph
   * @param name
   * @param publicBoolean
   * @param text
   */
  async postSubgraph(
    name: string,
    publicBoolean: boolean,
    text: string
  ): Promise<postSubgraphResult> {
    // compile data
    const request: PostSubgraphRequest = {
      name,
      public: publicBoolean,
      text
    };
    // make the api call
    const response: ApiResponse<
      Subgraph,
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
      const subgraph = response.data as Subgraph;
      return { kind: 'ok', subgraph };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Upload a subgraph file
   * @param file - multipart file to upload
   */
  async uploadSubgraphFile(file: any): Promise<postSubgraphResult> {
    // compile data
    const request = new FormData();
    request.append('file', file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data'
      }
    };
    // make the api call
    const response: ApiResponse<
      Subgraph,
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
      const subgraph = response.data as Subgraph;
      return { kind: 'ok', subgraph };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }
}
