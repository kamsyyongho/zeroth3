import { ApiResponse, ApisauceInstance } from 'apisauce';
import { Role, User } from '../../../types';
import { getGeneralApiProblem, ProblemKind } from '../api-problem';
import {
  assignRolesResult,
  deleteRoleResult,
  deleteUserResult,
  getRolesResult,
  getUserResult,
  inviteUserResult
} from '../types';

/**
 * Manages all IAM requests to the API.
 */
export class IAM {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance;

  /**
   * The logout method from `keycloakContext`.
   * - redirects to the login page
   */
  logout: () => void = () => {};

  /**
   * Creates the api from the already initiated parent.
   *
   * @param apisauce The apisauce instance.
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    this.apisauce = apisauce;
    this.logout = logout;
  }

  /**
   * Gets a list of associated IAM users
   */
  async getUsers(): Promise<getUserResult> {
    // make the api call
    const response: ApiResponse<User[]> = await this.apisauce.get(`/iam/users`);
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
    const response: ApiResponse<Role[]> = await this.apisauce.get(`/iam/roles`);
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
    const response: ApiResponse<undefined> = await this.apisauce.delete(
      `/iam/users/${userId}`
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
      items: roleIds
    };
    // make the api call
    const response: ApiResponse<User[]> = await this.apisauce.post(
      `/iam/users/${userId}/roles`,
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
    const response: ApiResponse<undefined> = await this.apisauce.delete(
      `/iam/users/${userId}/roles/${roleId}`
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
   * Invite a user to an organization
   * @param email
   */
  async inviteUser(email: string): Promise<inviteUserResult> {
    // compile data
    const request = {
      email
    };
    // make the api call
    const response: ApiResponse<undefined> = await this.apisauce.post(
      `/iam/users/invite`,
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
    return { kind: 'ok' };
  }
}
