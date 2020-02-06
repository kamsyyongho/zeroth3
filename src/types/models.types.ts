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
