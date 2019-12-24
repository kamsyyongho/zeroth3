import { ApisauceInstance } from 'apisauce';
import {
  CONTENT_STATUS,
  Segment,
  VoiceData as IVoiceData,
  VoiceDataResults,
  WordAlignment,
} from '../../../types';
import { getGeneralApiProblem } from '../api-problem';
import {
  confirmDataResult,
  fetchUnconfirmedDataResult,
  getAssignedDataResult,
  getSegmentsDataResult,
  MergeTwoSegmentsRequest,
  mergeTwoSegmentsResult,
  ProblemKind,
  RateTranscriptRequest,
  SearchDataRequest,
  searchDataResult,
  ServerError,
  SplitSegmentQuery,
  splitSegmentResult,
  UpdateMemoRequest,
  updateMemoResult,
  UpdateSegmentRequest,
  updateSegmentResult,
  UpdateSegmentsRequest,
  updateSegmentsResult,
  UpdateStatusRequest,
  updateStatusResult,
} from '../types';
import { ResponseCode } from '../types/api.types';
import { ParentApi } from './parent-api';

/**
 * Manages all voice data requests to the API.
 */
export class VoiceData extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param attemptToRefreshToken parent method to refresh the keycloak token
   */
  constructor(apisauce: ApisauceInstance, logout: () => void) {
    super(apisauce, logout);
  }

  /**
   * Gets the voice data for a project
   * @param projectId
   * @param requestOptions - all values are optional
   *```
   *requestOptions = {
   *from?: string;
   *'length-max'?: number;
   *'length-min'?: number;
   *'model-config'?: string;
   *name?: string;
   *page?: number;
   *'score-max'?: number;
   *'score-min'?: number;
   *size?: number;
   *status?: CONTENT_STATUS;
   *till?: Date;
   *transcript?: string;
   *}
   *```
   */
  async searchData(
    projectId: string,
    requestOptions: SearchDataRequest = {}
  ): Promise<searchDataResult> {
    // set default values
    const { page = 0, size = 10 } = requestOptions;
    const query: SearchDataRequest = {
      ...requestOptions,
      page,
      size,
    };
    const response = await this.apisauce.get<VoiceDataResults, ServerError>(
      `/projects/${projectId}/data`,
      query
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
      const data = response.data as VoiceDataResults;
      return { kind: 'ok', data };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets the current voice data assigned to the current user
   * @returns `voiceData` if there is data assigned data
   * @returns `noContent` if status code is 204
   */
  async getAssignedData(): Promise<getAssignedDataResult> {
    const response = await this.apisauce.get<IVoiceData, ServerError>(
      `/data/assigned`
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
      const noContent = response.status === ResponseCode['no-content'];
      const voiceData = response.data as IVoiceData;
      return { kind: 'ok', voiceData, noContent };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Confirms and locks the voice data
   * @param projectId
   * @param dataId
   */
  async confirmData(
    projectId: string,
    dataId: string
  ): Promise<confirmDataResult> {
    const response = await this.apisauce.put<undefined, ServerError>(
      `/projects/${projectId}/data/${dataId}/confirm`
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
   * Assigns one set of assigned data to transcribe
   * - used in the editor
   * @returns `voiceData` if there is data assigned data
   * @returns `noContent` if status code is 204
   */
  async fetchUnconfirmedData(): Promise<fetchUnconfirmedDataResult> {
    const response = await this.apisauce.post<
      IVoiceData | undefined,
      ServerError
    >(`/data/unconfirmed`);
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
      const noContent = response.status === ResponseCode['no-content'];
      const voiceData = response.data as IVoiceData;
      return { kind: 'ok', voiceData, noContent };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Gets the segments for the voice data
   * @param projectId
   * @param dataId
   */
  async getSegments(
    projectId: string,
    dataId: string
  ): Promise<getSegmentsDataResult> {
    const response = await this.apisauce.get<Segment[], ServerError>(
      `/projects/${projectId}/data/${dataId}/segments`
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
      const segments = response.data as Segment[];
      return { kind: 'ok', segments };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Updates a segment's words
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param wordAlignments
   */
  async updateSegment(
    projectId: string,
    dataId: string,
    segmentId: string,
    wordAlignments: WordAlignment[]
  ): Promise<updateSegmentResult> {
    // compile data
    const request: UpdateSegmentRequest = {
      wordAlignments,
    };
    // make the api call
    const response = await this.apisauce.patch<undefined, ServerError>(
      `/projects/${projectId}/data/${dataId}/segments/${segmentId}/word-alignments`,
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

  /**
   * Updates a voice data's segments
   * @param projectId
   * @param dataId
   * @param segments
   */
  async updateSegments(
    projectId: string,
    dataId: string,
    segments: Segment[]
  ): Promise<updateSegmentsResult> {
    // compile data
    const request: UpdateSegmentsRequest = segments;
    // make the api call
    const response = await this.apisauce.patch<undefined, ServerError>(
      `/projects/${projectId}/data/${dataId}/segments`,
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

  /**
   * Splits a segment into two new segments
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param splitIndex
   */
  async splitSegment(
    projectId: string,
    dataId: string,
    segmentId: string,
    splitIndex: number
  ): Promise<splitSegmentResult> {
    const params: SplitSegmentQuery = {
      'split-index': splitIndex,
    };
    const response = await this.apisauce.post<[Segment, Segment], ServerError>(
      // query params on a post are the third (3) parameter
      `/projects/${projectId}/data/${dataId}/segments/${segmentId}/split`,
      null,
      { params }
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
      const segments = response.data as [Segment, Segment];
      return { kind: 'ok', segments };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Merges two segments into one
   * @param projectId
   * @param dataId
   * @param firstSegmentId
   * @param secondSegmentId
   * @returns the new segment to replace the two merged ones
   */
  async mergeTwoSegments(
    projectId: string,
    dataId: string,
    firstSegmentId: string,
    secondSegmentId: string
  ): Promise<mergeTwoSegmentsResult> {
    // compile data
    const request: MergeTwoSegmentsRequest = {
      segmentIdA: firstSegmentId,
      segmentIdB: secondSegmentId,
    };
    const response = await this.apisauce.post<Segment, ServerError>(
      `/projects/${projectId}/data/${dataId}/segments/merge`,
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
      const segment = response.data as Segment;
      return { kind: 'ok', segment };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Manually updates the status of voice data
   * @param projectId
   * @param dataId
   * @param status
   */
  async updateStatus(
    projectId: string,
    dataId: string,
    status: CONTENT_STATUS
  ): Promise<updateStatusResult> {
    // compile data
    const request: UpdateStatusRequest = {
      status,
    };
    const response = await this.apisauce.put<IVoiceData, ServerError>(
      `/projects/${projectId}/data/${dataId}/status`,
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
      const data = response.data as IVoiceData;
      return { kind: 'ok', data };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Manually updates a voice data's memo
   * @param projectId
   * @param dataId
   * @param memo
   */
  async updateMemo(
    projectId: string,
    dataId: string,
    memo: string
  ): Promise<updateMemoResult> {
    // compile data
    const request: UpdateMemoRequest = {
      memo,
    };
    const response = await this.apisauce.patch<undefined, ServerError>(
      `/projects/${projectId}/data/${dataId}/memo`,
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

  /**
   * Submits a rating for the target transcript data
   * @param projectId
   * @param dataId
   * @param rating - <= 1 || >= 5
   */
  async rateTranscript(
    projectId: string,
    dataId: string,
    rating: number
  ): Promise<confirmDataResult> {
    // compile data
    const request: RateTranscriptRequest = {
      rating,
    };
    const response = await this.apisauce.put<undefined, ServerError>(
      `/projects/${projectId}/data/${dataId}/rate`,
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
