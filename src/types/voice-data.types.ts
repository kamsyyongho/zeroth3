import { PaginatedResults } from './pagination.types';
export interface VoiceData {
  audioUrl: string;
  id: string;
  startAt: Date;
  endAt: Date;
  ip: string;
  memo: string;
  sessionId: string;
  modelConfigId: string;
  /** seconds */
  length: number;
  status: CONTENT_STATUS;
  /**
   * name of the user assigned to transcribed
   */
  transcriber: string;
  transcript: string;
  transcriptionRating: number;
  webSocketCloseReason: string;
  webSocketCloseStatus: number;
}

export interface VoiceDataResults extends PaginatedResults {
  content: VoiceData[];
}

export enum CONTENT_STATUS {
  RAW = 'RAW',
  DECODED = 'DECODED',
  UNCONFIRMED_LC = 'UNCONFIRMED_LC',
  UNCONFIRMED_HC = 'UNCONFIRMED_HC',
  FETCHED = 'FETCHED',
  CONFIRMED = 'CONFIRMED',
  TRAINABLE_SV = 'TRAINABLE_SV',
  TRAINABLE_USV = 'TRAINABLE_USV',
}

export const CONTENT_STATUS_VALUES: string[] = Object.keys(CONTENT_STATUS).map(
  statusKey => statusKey
);

export interface Segment {
  id: string;
  length: number;
  number: number;
  start: number;
  transcript: string;
  wordAlignments: WordAlignment[];
}

export interface WordAlignment {
  confidence: number;
  length: number;
  speaker: string;
  start: number;
  word: string;
}
