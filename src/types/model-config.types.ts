import { AcousticModel, LanguageModel, TopGraph, SubGraph } from './models.types';

export interface ModelConfig {
  acousticModel: AcousticModel;
  name: string;
  description: string;
  id: string;
  languageModel: LanguageModel;
  topGraph: TopGraph;
  subGraphs: SubGraph[];
  progress: number;
  thresholdLr?: Threshold;
  thresholdHr?: Threshold;
  alias?: string;
  replicas?: number;
  uptime?: string;
  workerCount?: number;
  shareable?: boolean;
  imported?: boolean;
}

export interface Capacity {
  available: number;
  occupied: number;
}

/**
 * The confidence threshold value
 * - float
 * - `threshold >= 0`
 * - `thresholdLr` `>` `thresholdHr`
 */
export type Threshold = number | null;
