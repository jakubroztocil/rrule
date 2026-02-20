// =============================================================================
// Helper functions
// =============================================================================

import { ALL_WEEKDAYS, type WeekdayStr } from './weekday';

export const isPresent = <T>(value?: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number';

export const isWeekdayStr = (value: unknown): value is WeekdayStr =>
  typeof value === 'string' && ALL_WEEKDAYS.includes(value as WeekdayStr);

export const isArray = Array.isArray;

/**
 * Simplified version of python's range()
 */
export const range = (start: number, end?: number): number[] => {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  const rang = [];
  for (let i = start; i < end; i++) rang.push(i);
  return rang;
};

export const repeat = <T>(value: T | T[], times: number): (T | T[])[] => {
  let i = 0;
  const array: (T | T[])[] = [];

  if (isArray(value)) {
    for (; i < times; i++) array[i] = ([] as T[]).concat(value);
  } else {
    for (; i < times; i++) array[i] = value;
  }
  return array;
};

export const toArray = <T>(item: T | T[]): T[] => {
  if (isArray(item)) {
    return item;
  }

  return [item];
};

/**
 * Python like split
 */
export const split = (str: string, sep: string, num: number) => {
  const splits = str.split(sep);
  return num
    ? splits.slice(0, num).concat([splits.slice(num).join(sep)])
    : splits;
};

/**
 * closure/goog/math/math.js:modulo
 * Copyright 2006 The Closure Library Authors.
 * The % operator in JavaScript returns the remainder of a / b, but differs from
 * some other languages in that the result will have the same sign as the
 * dividend. For example, -1 % 8 == -1, whereas in some other languages
 * (such as Python) the result would be 7. This function emulates the more
 * correct modulo behavior, which is useful for certain applications such as
 * calculating an offset index in a circular list.
 *
 * @param {number} a The dividend.
 * @param {number} b The divisor.
 * @return {number} a % b where the result is between 0 and b (either 0 <= x < b
 * or b < x <= 0, depending on the sign of b).
 */
export const pymod = (a: number, b: number) => {
  const r = a % b;
  // If r and b differ in sign, add b to wrap the result to the correct sign.
  return r * b < 0 ? r + b : r;
};

/**
 * @see: <http://docs.python.org/library/functions.html#divmod>
 */
export const divmod = (a: number, b: number) => ({
  div: Math.floor(a / b),
  mod: pymod(a, b),
});

export const empty = <T>(obj: T[] | null | undefined) =>
  !isPresent(obj) || obj.length === 0;

/**
 * Python-like boolean
 *
 * @return {Boolean} value of an object/primitive, taking into account
 * the fact that in Python an empty list's/tuple's
 * boolean value is False, whereas in JS it's true
 */
export const notEmpty = <T>(obj: T[] | null | undefined): obj is T[] =>
  !empty(obj);
