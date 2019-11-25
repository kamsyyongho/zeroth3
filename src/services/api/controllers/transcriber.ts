import { ApisauceInstance } from 'apisauce';
import {
  PaginatedResults,
  Transcriber as TranscriberInterface,
  TrascriberStatsResults,
} from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  getTranscribersResult,
  getTranscribersWithStatsResults,
  ProblemKind,
  ServerError,
  TranscribersWithStatsRequest,
} from '../types';
import { ParentApi } from './parent-api';

/**
 * Manages all transcriber management requests to the API.
 */
export class Transcriber extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param attemptToRefreshToken parent method to refresh the keycloak token
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets the transcribers for the current organization
   */
  async getTranscribers(): Promise<getTranscribersResult> {
    const response = await this.apisauce.get<
      TranscriberInterface[],
      ServerError
    >(`/transcribers`);
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
      const transcribers = response.data as TranscriberInterface[];
      return { kind: 'ok', transcribers };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets a paginated list of transcribers and their current stats
   * @param page
   * @param size
   */
  async getTranscribersWithStats(
    page = 0,
    size = 10
  ): Promise<getTranscribersWithStatsResults> {
    // set default values
    const query: TranscribersWithStatsRequest = {
      page,
      size,
    };
    const response = await this.apisauce.get<
      TrascriberStatsResults,
      ServerError
    >(`/transcribers/stats`, query);
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
      const data = response.data as TrascriberStatsResults;
      const transcribersStats = data.content;
      delete data.content;
      const pagination: PaginatedResults = { ...data };
      return { kind: 'ok', transcribersStats, pagination };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }
}
