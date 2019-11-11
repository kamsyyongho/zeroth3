export interface TopGraph {
  id: number;
  name: string;
}

export interface Model extends TopGraph {
  description: string;
  version: string;
}

export interface AcousticModel extends Model {
  /**
   * in Hz
   */
  sampleRate: number;
  location: string;
}

export interface LanguageModel extends Model {
  topGraph: TopGraph;
  subGraphs: TopGraph[];
}

export type SubGraph = TopGraph;

export interface ModelConfig {
  acousticModel: AcousticModel;
  name: string;
  description: string;
  id: number;
  languageModel: LanguageModel;
}
