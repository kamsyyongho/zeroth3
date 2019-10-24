export interface TopGraph {
  id: number;
  name: string;
}

export interface Model extends TopGraph {
  description: string;
  version: string;
}

export interface AcousticModel extends Model {
  sampleRate: number;
  location: string;
}

export interface LanguageModel extends Model {
  sampleRate: number;
  baseModel: TopGraph;
  subGraphs: TopGraph[];
}

export type Subgraph = TopGraph;

export interface ModelConfig {
  acousticModel: AcousticModel;
  description: string;
  id: number;
  languageModel: LanguageModel;
}
