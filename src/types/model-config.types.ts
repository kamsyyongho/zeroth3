import { AcousticModel, LanguageModel } from './models.types';

export interface ModelConfig {
  acousticModel: AcousticModel;
  name: string;
  description: string;
  id: string;
  languageModel: LanguageModel;
  thresholdLr?: Threshold;
  thresholdHr?: Threshold;
}

/**
 * The confidence threshold value
 * - float
 * - `threshold >= 0`
 * - `thresholdLr` `>` `thresholdHr`
 */
export type Threshold = number;
