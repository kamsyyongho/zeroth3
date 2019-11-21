export interface Project {
  apiKey: string;
  apiSecret: string;
  id: number;
  name: string;
  thresholdHc: Threshold;
  thresholdLc: Threshold;
  validFrom: Date;
}

/**
 * The confidence threshold value
 * - float
 * - `threshold >= 0`
 * - `thresholdHc` `>` `thresholdLc`
 */
export type Threshold = number;
