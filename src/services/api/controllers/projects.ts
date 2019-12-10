import { ApiResponse, ApisauceInstance } from 'apisauce';
import { Project } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import { deleteProjectResult, getProjectResult, getProjectsResult, postProjectResult, ProblemKind, ProjectRequest, ServerError, updateProjectResult } from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all project requests to the API.
 */
export class Projects extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param attemptToRefreshToken parent method to refresh the keycloak token
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets a single project project id
   * @param projectId
   */
  async getProject(projectId: string): Promise<getProjectResult> {
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
   */
  async postProject(
    name: string,
  ): Promise<postProjectResult> {
    // compile data
    const request: ProjectRequest = {
      name,
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
  async deleteProject(projectId: string): Promise<deleteProjectResult> {
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
   * @param projectId
   */
  async updateProject(
    name: string,
    projectId: string,
  ): Promise<updateProjectResult> {
    // compile data
    const request: ProjectRequest = {
      name,
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
  async updateSecret(projectId: string): Promise<postProjectResult> {
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
}
