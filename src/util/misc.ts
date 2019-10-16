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
 * @returns `missing` - any items that the first doesn't set has but the second does
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
