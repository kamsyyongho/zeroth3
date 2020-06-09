import {ApisauceInstance} from 'apisauce';
import {CONTENT_STATUS, Segment, VoiceData as IVoiceData, VoiceDataResults, WordAlignment,} from '../../../types';
import {getGeneralApiProblem} from '../api-problem';
import {
  approveDataResult,
  confirmDataResult,
  fetchUnconfirmedDataResult,
  getAssignedDataResult,
  getDataToReview,
  getHistory,
  getSegmentsDataResult,
  MergeTwoSegmentsRequest,
  mergeTwoSegmentsResult,
  MergeWordsInSegmentRequest,
  mergeWordsInSegmentResult,
  ProblemKind,
  RateTranscriptRequest,
  rejectDataResult,
  ResponseCode,
  SearchDataRequest,
  searchDataResult,
  ServerError,
  SetFreeTextTranscriptRequest,
  setFreeTextTranscriptResult,
  SplitSegmentByTimeQuery,
  splitSegmentByTimeResult,
  SplitSegmentQuery,
  splitSegmentResult,
  SplitWordInSegmentRequest,
  splitWordInSegmentResult,
  UpdateMemoRequest,
  updateMemoResult,
  UpdateSegmentRequest,
  updateSegmentResult,
  UpdateSegmentsRequest,
  updateSegmentsResult,
  UpdateSegmentTimeRequest,
  updateSegmentTimeResult,
  UpdateSpeakerRequest,
  updateSpeakerResult,
  UpdateStatusRequest,
  updateStatusResult,
} from '../types';
import {deleteUnconfirmedVoiceDataResult} from '../types/voice-data.types';
import {ParentApi} from './parent-api';

/**
 * Manages all voice data requests to the API.
 */
export class VoiceData extends ParentApi {
  /**
   * Creates the api from the already initiated parent.
   * @param apisauce The apisauce instance.
   * @param logout parent method coming from keycloak
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
   *'sort-by'?: string;
   *}
   *```
   */
  async searchData(
    projectId: string,
    requestOptions: SearchDataRequest = {},
  ): Promise<searchDataResult> {
    // set default values
    const { page = 0, size = 10 } = requestOptions;
    const query: SearchDataRequest = {
      ...requestOptions,
      page,
      size,
    };
    const response = await this.apisauce.get<VoiceDataResults, ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/data`),
      query,
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
      this.getPathWithOrganization(`/data/assigned`),
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
    dataId: string,
  ): Promise<confirmDataResult> {
    const response = await this.apisauce.put<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/confirm`,
      ),
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

  async rejectData(
      projectId: string,
      dataId: string,
  ): Promise<rejectDataResult> {
    const response = await this.apisauce.put<undefined, ServerError>(
        this.getPathWithOrganization(
            `/projects/${projectId}/data/${dataId}/reject`,
        ),
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

  async requestApproval(
      projectId: string,
      dataId: string,
  ): Promise<approveDataResult> {
    const response = await this.apisauce.put<undefined, ServerError>(
        this.getPathWithOrganization(
            `/projects/${projectId}/data/${dataId}/review`,
        ),
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
   * @param dataSetId - the data set to pull voice data from
   * @returns `voiceData` if there is data assigned data
   * @returns `noContent` if status code is 204
   */
  async fetchUnconfirmedData(
    dataSetId?: string,
  ): Promise<fetchUnconfirmedDataResult> {
    const params = dataSetId
      ? {
          'data-set': dataSetId,
        }
      : undefined;
    // query params on a post are the third (3) parameter
    const response = await this.apisauce.post<
      IVoiceData | undefined,
      ServerError
    >(
      this.getPathWithOrganization(`/data/unconfirmed`),
      null,
      params ? { params } : undefined,
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
   * Gets the segments for the voice data
   * @param projectId
   * @param dataId
   */
  async getSegments(
    projectId: string,
    dataId: string,
  ): Promise<getSegmentsDataResult> {
    const response = await this.apisauce.get<Segment[], ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments`,
      ),
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
    wordAlignments: WordAlignment[],
  ): Promise<updateSegmentResult> {
    // compile data
    const request: UpdateSegmentRequest = {
      wordAlignments,
    };
    // make the api call
    const response = await this.apisauce.patch<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/word-alignments`,
      ),
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
   * Removes the high-risk segment value from a segment
   * @param projectId
   * @param dataId
   * @param segmentId
   */
  async removeHighRiskFlagFromSegment(
    projectId: string,
    dataId: string,
    segmentId: string,
  ): Promise<updateSegmentResult> {
    // make the api call
    const response = await this.apisauce.patch<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/no-risk`,
      ),
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
    segments: Segment[],
  ): Promise<updateSegmentsResult> {
    // compile data
    const request: UpdateSegmentsRequest = segments;
    // make the api call
    const response = await this.apisauce.patch<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments`,
      ),
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
   * Splits a segment into two new segments
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param splitIndex - the wordAlignment index to split at
   */
  async splitSegment(
    projectId: string,
    dataId: string,
    segmentId: string,
    splitIndex: number,
  ): Promise<splitSegmentResult> {
    const params: SplitSegmentQuery = {
      'split-index': splitIndex,
    };
    const response = await this.apisauce.post<[Segment, Segment], ServerError>(
      // query params on a post are the third (3) parameter
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/split`,
      ),
      null,
      { params },
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
   * Splits a segment that only has one word alignment item
   * - splits based off of the index within the word and the time within the segment
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param time - within the segment
   * @param wordStringSplitIndex - the string index to split the word at
   */
  async splitSegmentByTime(
    projectId: string,
    dataId: string,
    segmentId: string,
    time: number,
    wordStringSplitIndex: number,
  ): Promise<splitSegmentByTimeResult> {
    // set to 2 sig figs
    const adjustedTime = Number(time.toFixed(2));
    const params: SplitSegmentByTimeQuery = {
      time: adjustedTime,
      'word-split-index': wordStringSplitIndex,
    };
    const response = await this.apisauce.post<[Segment, Segment], ServerError>(
      // query params on a post are the third (3) parameter
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/split-by-time`,
      ),
      null,
      { params },
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
    secondSegmentId: string,
  ): Promise<mergeTwoSegmentsResult> {
    // compile data
    const request: MergeTwoSegmentsRequest = {
      segmentIdA: firstSegmentId,
      segmentIdB: secondSegmentId,
    };
    const response = await this.apisauce.post<Segment, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/merge`,
      ),
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
    status: CONTENT_STATUS,
  ): Promise<updateStatusResult> {
    // compile data
    const request: UpdateStatusRequest = {
      status,
    };
    const response = await this.apisauce.put<IVoiceData, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/status`,
      ),
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
    memo: string,
  ): Promise<updateMemoResult> {
    // compile data
    const request: UpdateMemoRequest = {
      memo,
    };
    const response = await this.apisauce.patch<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/memo`,
      ),
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
   * Submits a rating for the target transcript data
   * @param projectId
   * @param dataId
   * @param rating - <= 1 || >= 5
   */
  async rateTranscript(
    projectId: string,
    dataId: string,
    rating: number,
  ): Promise<confirmDataResult> {
    // compile data
    const request: RateTranscriptRequest = {
      rating,
    };
    const response = await this.apisauce.put<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/rate`,
      ),
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
   * Overwrites segment data with free text
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param freeText
   * @returns the updated segment with one free-text word
   */
  async setFreeTextTranscript(
    projectId: string,
    dataId: string,
    segmentId: string,
    freeText: string,
  ): Promise<setFreeTextTranscriptResult> {
    // compile data
    const request: SetFreeTextTranscriptRequest = {
      freeText,
    };
    const response = await this.apisauce.post<Segment, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/free-text`,
      ),
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
      const segment = response.data as Segment;
      return { kind: 'ok', segment };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Merge two neighboring words within a segment
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param firstWordIndex
   * @param secondWordIndex
   */
  async mergeWordsInSegment(
    projectId: string,
    dataId: string,
    segmentId: string,
    firstWordIndex: number,
    secondWordIndex: number,
  ): Promise<mergeWordsInSegmentResult> {
    // compile data
    const request: MergeWordsInSegmentRequest = {
      indexWordA: firstWordIndex,
      indexWordB: secondWordIndex,
    };
    const response = await this.apisauce.post<Segment, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/merge-word`,
      ),
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
      const segment = response.data as Segment;
      return { kind: 'ok', segment };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  /**
   * Split a word into two while providing word timing info
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param splitCharacterIndex
   * @param splitTime
   * @param wordAlignmentIndex
   */
  async splitWordInSegment(
    projectId: string,
    dataId: string,
    segmentId: string,
    splitCharacterIndex: number,
    splitTime: number,
    wordAlignmentIndex: number,
  ): Promise<splitWordInSegmentResult> {
    // compile data
    const request: SplitWordInSegmentRequest = {
      splitCharacterIndex,
      splitTime,
      wordAlignmentIndex,
    };
    const response = await this.apisauce.post<Segment, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/split-word`,
      ),
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
      const segment = response.data as Segment;
      return { kind: 'ok', segment };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }
  /**
   * Updates a segment's speaker
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param speaker
   */
  async updateSpeaker(
    projectId: string,
    dataId: string,
    segmentId: string,
    speaker: string,
  ): Promise<updateSpeakerResult> {
    // compile data
    const request: UpdateSpeakerRequest = {
      speaker,
    };
    // make the api call
    const response = await this.apisauce.patch<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/speaker`,
      ),
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
   * Updates a segment's start time and length
   * @param projectId
   * @param dataId
   * @param segmentId
   * @param speaker
   */
  async updateSegmentTime(
    projectId: string,
    dataId: string,
    segmentId: string,
    start: number,
    length: number,
  ): Promise<updateSegmentTimeResult> {
    // compile data
    const request: UpdateSegmentTimeRequest = {
      length,
      start,
    };
    // make the api call
    const response = await this.apisauce.patch<undefined, ServerError>(
      this.getPathWithOrganization(
        `/projects/${projectId}/data/${dataId}/segments/${segmentId}/time`,
      ),
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
   * Deletes voice data from a project
   * @param projectId
   * @param dataId
   */
  async deleteUnconfirmedVoiceData(
    projectId: string,
    dataId: string,
  ): Promise<deleteUnconfirmedVoiceDataResult> {
    // make the api call
    const response = await this.apisauce.delete<undefined, ServerError>(
      this.getPathWithOrganization(`/projects/${projectId}/data/${dataId}`),
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

  async deleteAllDataSet(projectId: string, filterParams: any = {}) {
    //over ride no request body in delete request in axios
    const response = await this.apisauce.delete<undefined, ServerError>(
        this.getPathWithOrganization(`/projects/${projectId}/data`),
        {},
        {
          data: {filterParams},
        }
    );

    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind === ProblemKind['unauthorized']) {
          this.logout();
        }
        return problem;
      }
    }
    return { kind: 'ok' };
  }
  async getDataToReview(): Promise<getDataToReview> {
    const response = await this.apisauce.get<IVoiceData, ServerError>(
        this.getPathWithOrganization('/reviews')
    );

    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind = ProblemKind.unauthorized) {
          this.logout();
        }
        return problem;
      }
    }
    try {
      const voiceData = response.data as IVoiceData[];
      return { kind: 'ok', voiceData };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  async getHistory(): Promise<getHistory> {
    const response = await this.apisauce.get<IVoiceData, ServerError>(
        this.getPathWithOrganization('/history')
    );

    if(!response.ok) {
      const problem = getGeneralApiProblem(response);
      if(problem) {
        if(problem.kind = ProblemKind.unauthorized) {
          this.logout();
        }
        return problem;
      }
    }
    try {
      const voiceData = response.data as IVoiceData[];
      return { kind: 'ok', voiceData };
    } catch {
      return { kind: ProblemKind['bad-data'] };
    }
  }

  async getAudio (audioUrl: string) {
    const response = await this.apisauce.get(audioUrl);

    return response;
  }
}
