import { AcousticModel, LanguageModel } from './models.types';

export interface ModelConfig {
  acousticModel: AcousticModel;
  name: string;
  description: string;
  id: string;
  languageModel: LanguageModel;
  thresholdHc: Threshold;
  thresholdLc: Threshold;
}

/**
 * The confidence threshold value
 * - float
 * - `threshold >= 0`
 * - `thresholdHc` `>` `thresholdLc`
 */
export type Threshold = number;
