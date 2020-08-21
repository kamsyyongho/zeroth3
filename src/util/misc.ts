import randomColor from 'randomcolor';
import { WORD_KEY_SEPARATOR } from '../constants/misc.constants';
import {
  DEFAULT_HUES,
  HUES,
  RandomColorOptions,
  SegmentAndWordIndex,
} from '../types';

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
 * @param huesToUse - default is `'red'`, `'orange'`, `'purple'`
 */
export function getRandomColor(
  options?: RandomColorOptions,
  huesToUse?: HUES[],
) {
  if (options) {
    return randomColor(options);
  }
  if (!huesToUse) {
    huesToUse = DEFAULT_HUES;
  }

  const hues = Object.keys(huesToUse).map(hue => hue);
  const hue = hues[getRandomInt(hues.length)];
  const defaultOptions: RandomColorOptions = {
    hue,
  };
  return randomColor(defaultOptions);
}

// export function parseWordKey(key: string): SegmentAndWordIndex {
//   const { segmentIndex, wordIndex } = key.split(WORD_KEY_SEPARATOR);
//   return [Number(segmentIndex), Number(wordIndex)];
// }
//
// export function generateWordKeyString(location: SegmentAndWordIndex) {
//   const key = `${location[0]}${WORD_KEY_SEPARATOR}${location[1]}`;
//   return key;
// }

export const isMacOs = () => navigator.userAgent.includes('Mac');

export const setPageTitle = (title: string) => {
  document.title = title;
};
