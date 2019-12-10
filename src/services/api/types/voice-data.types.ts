import {
  CONTENT_STATUS,
  Segment,
  VoiceData,
  WordAlignment,
} from '../../../types';
import { VoiceDataResults } from '../../../types/voice-data.types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface SearchDataRequest {
  from?: Date;
  till?: Date;
  /**
   * in seconds
   */
  'length-max'?: number;
  /**
   * in seconds
   * - from `0`
   */
  'length-min'?: number;
  'model-config'?: number;
  name?: string;
  /**
   * to `100`
   */
  'score-max'?: number;
  /**
   * from `0`
   */
  'score-min'?: number;
  /**
   * page size
   */
  size?: number;
  page?: number;
  status?: CONTENT_STATUS;
  transcript?: string;
}

export interface FetchUnconfirmedQuery {
  'model-config': string;
}

export interface SplitSegmentQuery {
  'split-index': number;
}

export interface UpdateStatusRequest {
  status: CONTENT_STATUS;
}

export interface UpdateMemoRequest {
  memo: string;
}

export interface AssignUnconfirmedQuery {
  'model-config': string;
}

export interface AssignUnconfirmedRequest {
  transcriberId: string;
  voiceDataIds: string[];
}
export interface RateTranscriptRequest {
  rating: number;
}

export interface MergeTwoSegmentsRequest {
  segmentIdA: string;
  segmentIdB: string;
}

export interface UpdateSegmentRequest {
  wordAlignments: WordAlignment[];
}

export type UpdateSegmentsRequest = Segment[];

/////////////
// RESULTS //
/////////////

export type confirmDataResult = { kind: 'ok' } | GeneralApiProblem;

export type searchDataResult =
  | { kind: 'ok'; data: VoiceDataResults }
  | GeneralApiProblem;

export type getAssignedDataResult =
  | { kind: 'ok'; data: VoiceDataResults }
  | GeneralApiProblem;

export type fetchUnconfirmedDataResult = { kind: 'ok' } | GeneralApiProblem;

export type getSegmentsDataResult =
  | { kind: 'ok'; segments: Segment[] }
  | GeneralApiProblem;

export type updateSegmentResult = { kind: 'ok' } | GeneralApiProblem;

export type updateSegmentsResult = { kind: 'ok' } | GeneralApiProblem;

export type assignUnconfirmedResult = { kind: 'ok' } | GeneralApiProblem;

export type splitSegmentResult =
  | { kind: 'ok'; segments: [Segment, Segment] }
  | GeneralApiProblem;

export type mergeTwoSegmentsResult =
  | { kind: 'ok'; segment: Segment }
  | GeneralApiProblem;

export type updateStatusResult =
  | { kind: 'ok'; data: VoiceData }
  | GeneralApiProblem;

export type updateMemoResult = { kind: 'ok' } | GeneralApiProblem;
