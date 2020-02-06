import {
  CONTENT_STATUS,
  Segment,
  VoiceData,
  VoiceDataResults,
  WordAlignment,
} from '../../../types';
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
  'model-config'?: string;
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

export interface SplitSegmentQuery {
  'split-index': number;
}

export interface UpdateStatusRequest {
  status: CONTENT_STATUS;
}

export interface UpdateMemoRequest {
  memo: string;
}

export interface RateTranscriptRequest {
  rating: number;
}

export interface SetFreeTextTranscriptRequest {
  freeText: string;
}

export interface MergeWordsInSegmentRequest {
  indexWordA: number;
  indexWordB: number;
}

export interface MergeTwoSegmentsRequest {
  segmentIdA: string;
  segmentIdB: string;
}

export interface SplitWordInSegmentRequest {
  splitCharacterIndex: number;
  splitTime: number;
  wordAlignmentIndex: number;
}

export interface UpdateSegmentRequest {
  wordAlignments: WordAlignment[];
}

export interface UpdateSpeakerRequest {
  speaker: string;
}

export interface UpdateSegmentTimeRequest {
  length: number;
  start: number;
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
  | { kind: 'ok'; voiceData: VoiceData; noContent: boolean }
  | GeneralApiProblem;

export type fetchUnconfirmedDataResult =
  | { kind: 'ok'; voiceData: VoiceData; noContent: boolean }
  | GeneralApiProblem;

export type getSegmentsDataResult =
  | { kind: 'ok'; segments: Segment[] }
  | GeneralApiProblem;

export type updateSegmentResult = { kind: 'ok' } | GeneralApiProblem;

export type updateSegmentsResult = { kind: 'ok' } | GeneralApiProblem;

export type splitSegmentResult =
  | { kind: 'ok'; segments: [Segment, Segment] }
  | GeneralApiProblem;

export type mergeTwoSegmentsResult =
  | { kind: 'ok'; segment: Segment }
  | GeneralApiProblem;

export type updateStatusResult =
  | { kind: 'ok'; data: VoiceData }
  | GeneralApiProblem;

export type setFreeTextTranscriptResult =
  | { kind: 'ok'; segment: Segment }
  | GeneralApiProblem;

export type mergeWordsInSegmentResult =
  | { kind: 'ok'; segment: Segment }
  | GeneralApiProblem;

export type splitWordInSegmentResult =
  | { kind: 'ok'; segment: Segment }
  | GeneralApiProblem;

export type updateMemoResult = { kind: 'ok' } | GeneralApiProblem;

export type updateSpeakerResult = { kind: 'ok' } | GeneralApiProblem;

export type updateSegmentTimeResult = { kind: 'ok' } | GeneralApiProblem;
