// eslint-disable-next-line @typescript-eslint/no-var-requires
import {
  Segment,
  SegmentAndWordIndex,
  Time,
  WordAlignment,
} from '../../../types';

/**
  - Notes about comparator return value:
  - when a<b the comparator's returned value should be:
    - negative number or a value such that `+value` is a negative number
    - examples: `-1` or the string `"-1"`
  - when a>b the comparator's returned value should be:
    - positive number or a value such that `+value` is a positive number
    - examples: `1` or the string `"1"`
  - when a===b
    - any value other than the return cases for a<b and a>b
    - examples: undefined, NaN, 'abc'
 */
type Comparator<A, B> = (
  a: A,
  b: B,
  index: number,
  haystack: ArrayLike<A>,
) => any;

/**
 * This is taken from `'binary-search'` on npm
 * - importing into workers is still experemental in all browsers, so I am copying the content
 * @param haystack
 * @param needle
 * @param comparator
 * @param low
 * @param high
 */
function binarySearch<A, B>(
  haystack: ArrayLike<A>,
  needle: B,
  comparator: Comparator<A, B>,
  low?: number,
  high?: number,
) {
  let mid: number | undefined;
  let cmp: number | undefined;
  if (low === undefined) low = 0;
  else {
    low = low | 0;
    if (low < 0 || low >= haystack.length)
      throw new RangeError('invalid lower bound');
  }
  if (high === undefined) high = haystack.length - 1;
  else {
    high = high | 0;
    if (high < low || high >= haystack.length)
      throw new RangeError('invalid upper bound');
  }
  while (low <= high) {
    // The naive `low + high >>> 1` could fail for array lengths > 2**31
    // because `>>>` converts its operands to int32. `low + (high - low >>> 1)`
    // works for array lengths <= 2**32-1 which is also Javascript's max array
    // length.
    mid = low + ((high - low) >>> 1);
    cmp = +comparator(haystack[mid], needle, mid, haystack);
    // Too low.
    if (cmp < 0.0) low = mid + 1;
    // Too high.
    else if (cmp > 0.0) high = mid - 1;
    // Key found.
    else return mid;
  }
  // Key not found.
  return ~low;
}

const findIndexForMatchingTime = (
  segment: Segment | WordAlignment,
  time: number,
  index: number,
  segments: ArrayLike<Segment | WordAlignment>,
) => {
  if (segments === undefined || index === undefined) return;
  const isLastSegment = index === segments.length - 1;
  if (segment.start <= time) {
    if (!isLastSegment) {
      const nextSegment = segments[index + 1];
      if (nextSegment.start > time) {
        return;
      } else {
        return -1;
      }
    } else {
      return;
    }
  } else {
    return 1;
  }
};

/**
 * Calculates the segment index and word index of the current playing word
 * - updates the state so it can be passed to the editor
 * @params time
 * @params segments
 * @params currentlyPlayingWordTime - used to determine if we don't need to calculate
 * @returns `undefined` on error
 */
const calculatePlayingLocation = (
  time: number,
  segments: Segment[],
  currentlyPlayingWordTime?: Required<Time>,
): SegmentAndWordIndex | undefined => {
  try {
    if (
      currentlyPlayingWordTime &&
      time < currentlyPlayingWordTime.end &&
      time > currentlyPlayingWordTime.start
    ) {
      return;
    }
    if (isNaN(time) || !segments.length) return;
    const segmentIndex = binarySearch(segments, time, findIndexForMatchingTime);
    const wordTime = time - segments[segmentIndex].start;
    const wordIndex = binarySearch(
      segments[segmentIndex].wordAlignments,
      wordTime,
      findIndexForMatchingTime,
    );

    const playingLocation: SegmentAndWordIndex = [segmentIndex, wordIndex];
    return playingLocation;
  } catch (error) {
    console.warn(
      'editor-page.worker',
      'calculatePlayingLocation',
      error.toString(),
    );
    return undefined;
  }
};

// required to prevent linting error
/* eslint no-restricted-globals: off */
addEventListener('message', message => {
  const {
    time,
    segments,
    initialSegmentLoad,
    currentlyPlayingWordTime,
  } = message.data;
  const playingLocation = calculatePlayingLocation(
    time as number,
    segments as Segment[],
    currentlyPlayingWordTime as Required<Time> | undefined,
  );
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  //@ts-ignore
  postMessage({ playingLocation, initialSegmentLoad });
});
