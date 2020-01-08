export interface Range {
  start: number;
  end: number; // this value used as rangeIndex
  text: string;
  data?: unknown; // the parent component props
}

export interface Time {
  start?: number;
  end?: number;
}

export interface Word {
  color: string;
  time?: Time;
  range: Range;
}

export interface WordsbyRangeStartAndEndIndexes {
  [x: string]: Word;
}

export interface WordToCreateTimeFor extends Word {
  segmentStartTime: number;
  segmentEndTime?: number;
  wordKey: string;
}
