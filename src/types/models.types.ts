export interface BaseModel {
  id: number;
  name: string;
}

export interface Model extends BaseModel {
  description: string;
  version: string;
}

export interface AcousticModel extends Model {
  sampleRate: number;
  location?: string;
}

export interface LanguageModel extends Model {
  sampleRate: number;
  baseModel: BaseModel;
  subGraphs: BaseModel[];
}

export type Subgraph = BaseModel;
