export interface VoiceData {
  id: number;
  createdAt: Date;
  sessionId: string;
  modelConfigId: number;
  length: number;
  score: number;
  status: CONTENT_STATUS;
  transcriberId: number;
  transcript: string;
  audioUrl: string;
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
  id: number;
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
