import { AcousticModel, LanguageModel } from './models.types';

export interface ModelConfig {
  acousticModel: AcousticModel;
  name: string;
  description: string;
  id: string;
  languageModel: LanguageModel;
  progress: number;
  thresholdLr?: Threshold;
  thresholdHr?: Threshold;
  alias?: string;
  replicas?: number;
  uptime?: Date;
  workerCount?: number;
}

/**
 * The confidence threshold value
 * - float
 * - `threshold >= 0`
 * - `thresholdLr` `>` `thresholdHr`
 */
export type Threshold = number | null;
