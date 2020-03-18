export interface TopGraph {
  id: string;
  name: string;
}

export interface Model extends TopGraph {
  description?: string | null;
  version: string;
}

export interface AcousticModel extends Model {
  /** in Hz */
  sampleRate: number;
  location: string;
  progress: number;
}

export interface LanguageModel extends Model {
  topGraph: TopGraph;
  subGraphs: TopGraph[];
}

export interface SubGraph extends TopGraph {
  immutable: boolean;
  progress: number;
  topGraphId: string;
}

export enum TRAINING_METHODS {
  'TRANSFER_LEARNING' = 'TRANSFER_LEARNING',
}

export const TRAINING_METHOD_VALUES: string[] = Object.keys(
  TRAINING_METHODS,
).map(method => method);

export enum AUDIO_UPLOAD_TYPE {
  FILE = 'FILE',
  PATH = 'PATH',
  URL = 'URL',
}

export const AUDIO_UPLOAD_TYPE_VALUES: string[] = Object.keys(
  AUDIO_UPLOAD_TYPE,
).map(typeKey => typeKey);
