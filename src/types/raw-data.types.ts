export interface RawDataQueue {
  /** remaining / not yet decoded for the project */
  projectUnprocessed: number;
  /** queue across **all** organizations */
  globalQueue: number;
}
