import { ApiResponse, ApisauceInstance } from 'apisauce';
import { ModelConfig, Project } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  deleteModelConfigResult,
  deleteProjectResult,
  getModelConfigsResult,
  getProjectResult,
  getProjectsResult,
  PostModelConfigRequest,
  postModelConfigResult,
  postProjectResult,
  ProblemKind,
  ProjectRequest,
  ServerError,
  updateProjectResult,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all project requests to the API.
 */
export class Projects extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout The logout method from `keycloakContext`.
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets a single project project id
   * @param projectId
   */
  async getProject(projectId: number): Promise<getProjectResult> {
    // make the api call
    const response: ApiResponse<Project, ServerError> = await this.apisauce.get(
      `/projects/${projectId}`
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
      const project = response.data as Project;
      return { kind: 'ok', project };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets a list of associated projects
   */
  async getProjects(): Promise<getProjectsResult> {
    // make the api call
    const response: ApiResponse<
      Project[],
      ServerError
    > = await this.apisauce.get(`/projects`);
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
      const projects = response.data as Project[];
      return { kind: 'ok', projects };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Create a new project
   * @param name
   * @param thresholdHc
   * @param thresholdLc
   */
  async postProject(
    name: string,
    thresholdHc: number,
    thresholdLc: number
  ): Promise<postProjectResult> {
    // compile data
    const request: ProjectRequest = {
      name,
      thresholdHc,
      thresholdLc,
    };
    // make the api call
    const response: ApiResponse<
      Project,
      ServerError
    > = await this.apisauce.post(`/projects`, request);
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
      const project = response.data as Project;
      return { kind: 'ok', project };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Deletes a project
   * @param projectId
   */
  async deleteProject(projectId: number): Promise<deleteProjectResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(`/projects/${projectId}`);
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
   * Update an existing project
   * @param name
   * @param thresholdHc
   * @param thresholdLc
   * @param projectId
   */
  async updateProject(
    name: string,
    thresholdHc: number,
    thresholdLc: number,
    projectId: number
  ): Promise<updateProjectResult> {
    // compile data
    const request: ProjectRequest = {
      name,
      thresholdHc,
      thresholdLc,
    };
    // make the api call
    const response: ApiResponse<Project, ServerError> = await this.apisauce.put(
      `/projects/${projectId}`,
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
      const project = response.data as Project;
      return { kind: 'ok', project };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Generate a new project secret
   * @param projectId
   */
  async updateSecret(projectId: number): Promise<postProjectResult> {
    // make the api call
    const response: ApiResponse<
      Project,
      ServerError
    > = await this.apisauce.post(`/projects/${projectId}/secret`);
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
      const project = response.data as Project;
      return { kind: 'ok', project };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets a list of associated model configs
   * @param projectId
   */
  async getModelConfigs(projectId: number): Promise<getModelConfigsResult> {
    // make the api call
    const response: ApiResponse<
      ModelConfig[],
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
      const modelConfigs = response.data as ModelConfig[];
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
   */
  async postModelConfig(
    projectId: number,
    name: string,
    description: string,
    acousticModelId: number,
    languageModelId: number
  ): Promise<postModelConfigResult> {
    // compile data
    const request: PostModelConfigRequest = {
      name,
      description,
      acousticModelId,
      languageModelId,
    };
    // make the api call
    const response: ApiResponse<
      ModelConfig,
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
      const modelConfig = response.data as ModelConfig;
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
    projectId: number,
    modelConfigId: number
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
