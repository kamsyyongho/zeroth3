import { ApiResponse, ApisauceInstance } from 'apisauce';
import { Role, User } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  assignRolesResult,
  deleteRoleResult,
  deleteUserResult,
  GeneralApiProblem,
  getRolesResult,
  getUserResult,
  inviteUserResult,
  ProblemKind,
  ServerError,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all IAM requests to the API.
 */
export class IAM extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param attemptToRefreshToken parent method to refresh the keycloak token
   */
  constructor(
    apisauce: ApisauceInstance,
    attemptToRefreshToken: <T>(
      callback: () => T,
      responseProblem: GeneralApiProblem
    ) => Promise<GeneralApiProblem | T>
  ) {
    super(apisauce, attemptToRefreshToken);
  }

  /**
   * Gets a list of associated IAM users
   */
  async getUsers(): Promise<getUserResult> {
    // make the api call
    const response: ApiResponse<User[], ServerError> = await this.apisauce.get(
      `/iam/users`
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(() => this.getUsers(), problem);
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const users = response.data as User[];
      return { kind: 'ok', users };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets a list of associated organization roles
   */
  async getRoles(): Promise<getRolesResult> {
    // make the api call
    const response: ApiResponse<Role[], ServerError> = await this.apisauce.get(
      `/iam/roles`
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(() => this.getRoles(), problem);
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const roles = response.data as Role[];
      return { kind: 'ok', roles };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Deletes a user from an organization
   * @param userId
   */
  async deleteUser(userId: number): Promise<deleteUserResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(`/iam/users/${userId}`);
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(
            () => this.deleteUser(userId),
            problem
          );
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }

  /**
   * Assign roles to a user
   * @param userId
   * @param roleIds
   */
  async assignRoles(
    userId: number,
    roleIds: number[]
  ): Promise<assignRolesResult> {
    // compile data
    const request = {
      items: roleIds,
    };
    // make the api call
    const response: ApiResponse<User[], ServerError> = await this.apisauce.post(
      `/iam/users/${userId}/roles`,
      request
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(
            () => this.assignRoles(userId, roleIds),
            problem
          );
        }
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const users = response.data as User[];
      return { kind: 'ok', users };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Deletes a single role from a user
   * @param userId
   * @param roleId
   */
  async deleteRole(userId: number, roleId: number): Promise<deleteRoleResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(`/iam/users/${userId}/roles/${roleId}`);
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(
            () => this.deleteRole(userId, roleId),
            problem
          );
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }

  /**
   * Invite a user to an organization
   * @param email
   */
  async inviteUser(email: string): Promise<inviteUserResult> {
    // compile data
    const request = {
      email,
    };
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.post(`/iam/users/invite`, request);
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        if (problem.kind === ProblemKind['unauthorized']) {
          return this.attemptToRefreshToken(
            () => this.inviteUser(email),
            problem
          );
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }
}