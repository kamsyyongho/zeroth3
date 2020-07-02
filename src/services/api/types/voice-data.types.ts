import {
  CONTENT_STATUS,
  Segment,
  VoiceData,
  VoiceDataResults,
  WordAlignment,
  AudioUrlResponse,
} from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface SearchDataRequest {
  'dataSetIds'?: string[];
  filename?: string;
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
  transcriber?: string;
  /**
   * in the form of `field.order` with order being `desc` or `asc`
   * - the field values are `VoiceData` keys
   * @example `sort-by: startAt.desc`
   */
  'sort-by'?: string;
}

export interface SplitSegmentQuery {
  'split-index': number;
}

export interface SplitSegmentByTimeQuery {
  /** time within the segment */
  time: number;
  'word-split-index': number;
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


export type deleteAllDataSet = { kind: 'ok' } | GeneralApiProblem;

export type rejectDataResult = { kind: 'ok' } | GeneralApiProblem;

export type updateRejectReasonResult = { kind: 'ok' } | GeneralApiProblem;

export type approveDataResult = { kind: 'ok' } | GeneralApiProblem;

export type searchDataResult =
  | { kind: 'ok'; data: VoiceDataResults }
  | GeneralApiProblem;

export type getAssignedDataResult =
  | { kind: 'ok'; voiceData: VoiceData; noContent: boolean }
  | GeneralApiProblem;

export type getVoiceDataStateChanges =
  | { kind: 'ok', statusChanges: any[] }
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

export type splitSegmentByTimeResult =
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

export type deleteUnconfirmedVoiceDataResult =
  | { kind: 'ok' }
  | GeneralApiProblem;

export type getDataToReview =
  | { kind: 'ok'; voiceData: VoiceData[] }
  | GeneralApiProblem;

export type getHistory =
  | { kind: 'ok'; data: VoiceDataResults }
  | GeneralApiProblem;

export type getAudioUrl =
    | { kind: 'ok'; url: string }
    | GeneralApiProblem;