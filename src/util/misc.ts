import randomColor from 'randomcolor';
import { WORD_KEY_SEPARATOR } from '../constants/misc.constants';
import { Segment, SegmentAndWordIndex } from '../types';

/**
 * Checks if the contents of two sets are equal.
 * @param aSet
 * @param bSet
 * @returns `true` if sets are equal
 */
export function isEqualSet<T>(aSet: Set<T>, bSet: Set<T>) {
  if (aSet.size !== bSet.size) return false;
  const aSetArray = Array.from(aSet);
  // eslint-disable-next-line prefer-const
  for (let a of aSetArray) {
    if (!bSet.has(a)) return false;
  }
  return true;
}

/**
 * Gets the extra and missing items of one set when compared to another set.
 * @param aSet
 * @param bSet
 * @returns `extra` - any items that the first set has but the second doesn't
 * @returns `missing` - any items that the first doesn't set have but the second does
 */
export function differencesBetweenSets<T>(aSet: Set<T>, bSet: Set<T>) {
  const aSetArray = Array.from(aSet);
  const bSetArray = Array.from(bSet);
  const extra: Set<T> = new Set();
  const missing: Set<T> = new Set();
  // eslint-disable-next-line prefer-const
  for (let a of aSetArray) {
    if (!bSet.has(a)) {
      extra.add(a);
    }
  }
  // eslint-disable-next-line prefer-const
  for (let b of bSetArray) {
    if (!aSet.has(b)) {
      missing.add(b);
    }
  }
  return { extra, missing };
}

/**
 * Rounds to the nearest half decimal place
 * @param num
 * @returns a float `#.0`, `#.5`
 */
export function roundHalf(num: number) {
  return (Math.round(num * 2) / 2).toFixed(1);
}

/**
 * Convert seconds to a readable format
 * @param seconds coming from the api
 * @returns `MM:SS` or `HH:MM:SS`
 */
export function formatSecondsDuration(seconds: number): string {
  const milliseconds = 1000 * seconds;
  const tempDateString = new Date(milliseconds).toISOString();
  let timeStartIndex = 11; // HH:MM:SS
  let timeStringLength = 8; // HH:MM:SS
  const HH = tempDateString.substr(timeStartIndex, 2); // HH
  if (Number(HH) <= 0) {
    timeStartIndex = 14; // MM:SS
    timeStringLength = 5; //MM:SS
  }
  return tempDateString.substr(timeStartIndex, timeStringLength);
}

/**
 * random int between `0` and `max`
 * @param max int - non inclusive
 */
export function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

/**
 * - used in the editor / audio player segments
 * @param options overrides the default
 */
export function getRandomColor(options?: RandomColorOptionsSingle) {
  if (options) {
    return randomColor(options);
  }
  const DEFAULT_HUES: string[] = [
    'red',
    'orange',
    'purple',
    'pink',
    'green',
    // 'yellow',
    // 'blue',
    // 'monochrome',
  ];
  const hue = DEFAULT_HUES[getRandomInt(DEFAULT_HUES.length)];
  const defaultOptions: RandomColorOptionsSingle = {
    hue,
  };
  return randomColor(defaultOptions);
}

export function parseWordKey(key: string): SegmentAndWordIndex {
  const [segmentIndex, wordIndex] = key.split(WORD_KEY_SEPARATOR);
  return [Number(segmentIndex), Number(wordIndex)];
}

export function generateWordKeyString(location: SegmentAndWordIndex) {
  const key = `${location[0]}${WORD_KEY_SEPARATOR}${location[1]}`;
  return key;
}

/**
 * Segment arrays of arrays of word keys
 */
type WordKeyLocation3DArray = number[][];

export class WordKeyStore {
  keys: { [x: number]: SegmentAndWordIndex } = {};
  keyCounter = 0;
  wordKeyLocations: WordKeyLocation3DArray = [];

  /**
   * Updates the word key location within the 3D array
   * - push new segments or words if they don't already exist
   */
  private updateWordKeyLocations = (
    wordKey: number,
    wordLocation: SegmentAndWordIndex
  ) => {
    const [segmentIndex, wordIndex] = wordLocation;
    const tempWordKeyLocations = [...this.wordKeyLocations];
    const tempSegmentWordKeys = tempWordKeyLocations[segmentIndex];
    if (!tempSegmentWordKeys) {
      tempWordKeyLocations.push([wordKey]);
    } else {
      const numberOfWordsInSegment = tempSegmentWordKeys.length;
      if (numberOfWordsInSegment - 1 < wordIndex) {
        tempSegmentWordKeys.push(wordKey);
      } else {
        tempSegmentWordKeys.splice(wordIndex, 1, wordKey);
      }
      tempWordKeyLocations.splice(segmentIndex, 1, tempSegmentWordKeys);
    }
    this.wordKeyLocations = [...tempWordKeyLocations];
  };

  /** build the initial multi-dimentional array for the word keys */
  init = (segments: Segment[]) => {
    const tempWordKeyLocations: WordKeyLocation3DArray = [];
    segments.forEach(segment => {
      const tempWords = new Array(segment.wordAlignments.length).fill(-1);
      tempWordKeyLocations.push(tempWords);
    });
    this.wordKeyLocations = tempWordKeyLocations;
    return true;
  };

  /** Generates a new key for a given location
   * @returns the new word key
   */
  generateKey = (wordLocation: SegmentAndWordIndex) => {
    const wordKey = this.keyCounter;
    this.keyCounter++;
    this.keys[wordKey] = wordLocation;
    this.updateWordKeyLocations(wordKey, wordLocation);
    return wordKey;
  };

  /** Get the word location from the word key */
  getLocation = (wordKey: number): SegmentAndWordIndex => {
    return this.keys[wordKey];
  };

  /**
   * Update the word location for the given word key
   * - updates the key bank object and 3D array
   */
  setLocation = (wordKey: number, wordLocation: SegmentAndWordIndex) => {
    this.keys[wordKey] = wordLocation;
    this.updateWordKeyLocations(wordKey, wordLocation);
  };

  /** Get the word key from the word location */
  getKey = (wordLocation: SegmentAndWordIndex) => {
    const [segmentIndex, wordIndex] = wordLocation;
    return this.wordKeyLocations[segmentIndex][wordIndex];
  };

  /**
   * Concats the word locations from the merged segment to the previous one
   * - updates the word keys for the updated locations for the merged segments
   * and the segments that have been shifted up after the merge
   */
  moveKeysAfterSegmentMerge = (removedSegmentIndex: number) => {
    const wordLocations = [...this.wordKeyLocations];
    const segmentToMerge = [...wordLocations[removedSegmentIndex]];
    const locationsAfterMerge = [...wordLocations];
    if (removedSegmentIndex) {
      const prevSegmentIndex = removedSegmentIndex - 1;
      const segmentToMergeInto = locationsAfterMerge[prevSegmentIndex];
      const mergedSegment = segmentToMergeInto.concat(segmentToMerge);
      // to remove the two old and replace with the merged
      locationsAfterMerge.splice(prevSegmentIndex, 2, mergedSegment);
      // to update the moved key locations
      let numberOfWordsInSegmentToMergeInto = segmentToMergeInto.length;
      segmentToMerge.forEach(wordKey => {
        const newLocation: SegmentAndWordIndex = [
          prevSegmentIndex,
          numberOfWordsInSegmentToMergeInto,
        ];
        this.keys[wordKey] = newLocation;
        numberOfWordsInSegmentToMergeInto++;
      });
      // to move the shifted key locations in the word key object
      const shiftedSegments = locationsAfterMerge.slice(removedSegmentIndex);
      shiftedSegments.forEach(segment => {
        segment.forEach(wordKey => {
          const [prevSegmentIndex, prevWordIndex] = this.keys[wordKey];
          const updatedLocation: SegmentAndWordIndex = [
            prevSegmentIndex - 1,
            prevWordIndex,
          ];
          this.keys[wordKey] = updatedLocation;
        });
      });
    }
    this.wordKeyLocations = [...locationsAfterMerge];
  };

  /**
   *
   */
  moveKeysAfterSegmentSplit = (
    segmentIndexToSplit: number,
    splitWordIndex: number
  ) => {
    const wordLocations = [...this.wordKeyLocations];
    const segmentToSplit = [...wordLocations[segmentIndexToSplit]];
    const slicedOriginalSegment = segmentToSplit.slice(0, splitWordIndex);
    const newSegmentContent = segmentToSplit.slice(splitWordIndex);
    // to update the original segment
    wordLocations[segmentIndexToSplit] = [...slicedOriginalSegment];
    // to insert the new segment
    const segmentIndexToInsert = segmentIndexToSplit + 1;
    wordLocations.splice(segmentIndexToInsert, 0, newSegmentContent);

    // update the moved locations for word key object
    newSegmentContent.forEach((wordKey, index) => {
      const updatedLocation: SegmentAndWordIndex = [segmentIndexToSplit, index];
      this.keys[wordKey] = updatedLocation;
    });
    // update the shifted locations for word key object
    const shiftedSegments = wordLocations.slice(segmentIndexToInsert);
    shiftedSegments.forEach(segment => {
      segment.forEach(wordKey => {
        const [prevSegmentIndex, prevWordIndex] = this.getLocation(wordKey);
        const updatedLocation: SegmentAndWordIndex = [
          prevSegmentIndex + 1,
          prevWordIndex,
        ];
        this.keys[wordKey] = updatedLocation;
      });
    });

    this.wordKeyLocations = [...wordLocations];
  };
}
