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
