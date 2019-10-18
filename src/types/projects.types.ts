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
 * The confidence threshold values
 * - `1 >=` threshold `<= 100`
 * - `thresholdHc` `>` `thresholdLc`
 */
export type Threshold = number;
