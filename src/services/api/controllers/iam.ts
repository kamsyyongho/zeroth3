import { ApiResponse, ApisauceInstance } from 'apisauce';
import { Map } from 'typescript';
import { Role, User, Grap } from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  assignRolesToUserResult,
  deleteRoleResult,
  deleteUserResult,
  updatePhoneAndNote,
  getRolesResult,
  getUserResult,
  inviteUserResult,
  ProblemKind,
  resetPasswordOfUserResult,
  ServerError,
  updateVoiceMaskingRequiredFlag,
  grapData,
} from '../types';
import { InviteUserRequest } from '../types/iam.types';
import { ParentApi } from './parent-api';

/**
 * Manages all IAM requests to the API.
 */
export class IAM extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout parent method coming from keycloak
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  async getWorkData(): Promise<grapData> {
    /*
    const param ={
      query : 'up',
      start : new Date().setDate(new Date().getDate() -1),
      end : new Date().getTime(),
      step : '1h',
    }*/
    let stdt = String(new Date().setDate(new Date().getDate() -1)).substr(0,10);
    let enddt = String(new Date().getTime()).substr(0,10);


    const response: ApiResponse<Grap, ServerError> = await this.apisauce.get(
      "http://ailab.sorizava.co.kr:9090/api/v1/query_range?query=connected_worker&start="+stdt+"&end="+enddt+"&step=10m",
    );
    
    const grap= response.data as Grap;

    return { kind: 'ok',  grap};
  }  

  /**
   * Gets a list of associated IAM users
   */
  async getUsers(): Promise<getUserResult> {
    // make the api call
    const response: ApiResponse<User[], ServerError> = await this.apisauce.get(
      this.getPathWithOrganization(`/iam/users`),
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
   * Gets a list of associated organization roles
   */
  async getRoles(): Promise<getRolesResult> {
    // make the api call
    const response: ApiResponse<Role[], ServerError> = await this.apisauce.get(
      `/api/iam/roles`,
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
      const roles = response.data as Role[];
      return { kind: 'ok', roles };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  async updatePhoneAndNote(userId: string, note: string, phone: string): Promise<updatePhoneAndNote> {
    note = note ? note : '';
    phone = phone ? phone : '';
    const request = {note, phone};
    // make the api call
    const response: ApiResponse<User, ServerError> = await this.apisauce.put(
        this.getPathWithOrganization(`/iam/users/${userId}`),
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
      const user = response.data as User;
      return { kind: 'ok', user };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Deletes a user from an organization
   * @param userId
   */
  async deleteUser(userId: string): Promise<deleteUserResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(
      this.getPathWithOrganization(`/iam/users/${userId}`),
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
  async assignRolesToUser(
    userId: string,
    roleIds: string[],
  ): Promise<assignRolesToUserResult> {
    // compile data
    const request = {
      items: roleIds,
    };
    // make the api call
    const response: ApiResponse<User, ServerError> = await this.apisauce.post(
      this.getPathWithOrganization(`/iam/users/${userId}/roles`),
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
      const user = response.data as User;
      return { kind: 'ok', user };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Deletes a single role from a user
   * @param userId
   * @param roleId
   */
  async deleteRole(userId: string, roleId: string): Promise<deleteRoleResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.delete(
      this.getPathWithOrganization(`/iam/users/${userId}/roles/${roleId}`),
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
   * @param inviteAsTranscriber
   */
  async inviteUser(
    email: string,
    inviteAsTranscriber?: boolean,
  ): Promise<inviteUserResult> {
    // compile data
    const request: InviteUserRequest = {
      email,
    };
    if (typeof inviteAsTranscriber === 'boolean') {
      request.transcriber = inviteAsTranscriber;
    }
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.post(
      this.getPathWithOrganization(`/iam/users/invite`),
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
   * Reset a user's password on behalf of the user
   * @param userId
   */
  async resetPasswordOfUser(
    userId: string,
  ): Promise<resetPasswordOfUserResult> {
    // make the api call
    const response: ApiResponse<
      undefined,
      ServerError
    > = await this.apisauce.post(
      this.getPathWithOrganization(`/iam/users/${userId}/reset-password`),
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

  async updateVoiceMaskingRequiredFlag(voiceMaskingRequired: boolean): Promise<updateVoiceMaskingRequiredFlag> {
    const request = {
      voiceMaskingRequired,
    };
    const response: ApiResponse<undefined, ServerError> = await this.apisauce.patch(
        this.getPathWithOrganization(`/vm-required`),
        request,
    );

    if(!response.ok) {
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
