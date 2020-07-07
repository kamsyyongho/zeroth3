import { PaginatedResults } from './pagination.types';

// export interface VoiceData {
//   /**
//    * `m3u8` streaming file.
//    * - the peaks data json can be accessed via a path that is based on this url
//    * - `{{audioUrl}}.json`
//    * @example https://domain.com/url.m3u8.json
//    */
//   audioUrl: string;
//   id: string;
//   startAt: Date;
//   endAt: Date;
//   fetchedAt: Date | null;
//   confirmedAt: Date | null;
//   originalFilename: string | null;
//   memo: string | null;
//   ip: string;
//   sessionId: string;
//   modelConfigId: string;
//   projectId: string | null;
//   /** seconds */
//   length: number;
//   status: CONTENT_STATUS;
//   /**
//    * name of the user assigned to transcribe
//    */
//   transcriber: string | null;
//   transcript: string;
//   transcriptionRating: number | null;
//   webSocketCloseReason: string;
//   webSocketCloseStatus: number;
//   transferredBytes: number;
//   highRiskSegments: number;
// }

export interface VoiceData {
  /**
   * `m3u8` streaming file.
   * - the peaks data json can be accessed via a path that is based on this url
   * - `{{audioUrl}}.json`
   * @example https://domain.com/url.m3u8.json
   */
  audioUrl: string;
  confirmedAt: Date | null;
  dataSets: string[],
  decodedAt: Date;
  fetchedAt: Date | null;
  highRiskSegments: number;
  id: string;
  length: number;
  memo: string | null;
  modelConfigId: string;
  originalFilename: string | null
  projectId: string;
  sessionId: string;
  ip: string;
  stateChanges: any[];
  /** seconds */
  status: CONTENT_STATUS;
  /**
   * name of the user assigned to transcribe
   */
  transcriber: string | null;
  transcript: string;
  transcriptionRating: number | null;
  waveformUrl: string;
  wordCount: number;
}

export interface SubSetCountResults {
  testCount: number;
  trainCount: number;
  validationCount: number;
}

export interface VoiceDataResults extends PaginatedResults {
  content: VoiceData[];
}

export interface HistoryDataResults extends PaginatedResults {
  content: VoiceData[];
  status?: CONTENT_STATUS;
}

export enum CONTENT_STATUS {
  DECODED = 'DECODED',
  UNCONFIRMED_HR = 'UNCONFIRMED_HR',
  UNCONFIRMED_LR = 'UNCONFIRMED_LR',
  FETCHED = 'FETCHED',
  CONFIRMED = 'CONFIRMED',
  TRAINABLE_SV = 'TRAINABLE_SV',
  TRAINABLE_USV = 'TRAINABLE_USV',
  IN_REVIEW = 'IN_REVIEW',
  REJECTED = 'REJECTED',
}

export const CONTENT_STATUS_VALUES: string[] = Object.keys(CONTENT_STATUS).map(
  statusKey => statusKey,
);

export interface Segment {
  id: string;
  /** the length in seconds of the segment */
  length: number;
  number: number;
  /** the starting time of the segment */
  start: number;
  /** the current transcript */
  transcript: string;
  /** the original transcript created by the decoder */
  decoderTranscript: string;
  wordAlignments: WordAlignment[];
  speaker: string | null;
  highRisk: boolean;
}

export interface WordAlignment {
  confidence: number;
  /** the length in seconds of the word */
  length: number;
  /** the starting time of the word within the segment */
  start: number;
  word: string;
  rejectReason?: string;
}

export enum TDPTableColumns {
  'sessionId' = 'sessionId',
  'modelConfigId' = 'modelConfigId',
  'length' = 'length',
  'decodedAt' = 'decodedAt',
  'status' = 'status',
  'highRiskSegments' = 'highRiskSegments',
}

export interface AudioUrlResponse extends AudioUrlData {
  data: AudioUrlData;
}

interface AudioUrlData {
  url: string;
}
