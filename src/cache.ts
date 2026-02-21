import { clone, cloneDates } from './dateutil';
import { isArray } from './helpers';
import IterResult, { type IterArgs } from './iterresult';

export type CacheKeys = 'before' | 'after' | 'between';

/** Max cached entries per query method (before/after/between) */
const MAX_CACHE_SIZE = 64;

function argsMatch(
  left: IterArgs[keyof IterArgs] | undefined,
  right: IterArgs[keyof IterArgs] | undefined,
) {
  if (Array.isArray(left)) {
    if (!Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    return left.every((date, i) => date.getTime() === right[i]!.getTime());
  }

  if (left instanceof Date) {
    return right instanceof Date && left.getTime() === right.getTime();
  }

  return left === right;
}

export class Cache {
  all: Date[] | false = false;
  before: IterArgs[] = [];
  after: IterArgs[] = [];
  between: IterArgs[] = [];

  /**
   * @param {String} what - all/before/after/between
   * @param {Array,Date} value - an array of dates, one date, or null
   * @param {Object?} args - _iter arguments
   */
  public _cacheAdd(
    what: CacheKeys | 'all',
    value: Date[] | Date | null,
    args?: Partial<IterArgs>,
  ) {
    if (value) {
      value = value instanceof Date ? clone(value) : cloneDates(value);
    }

    if (what === 'all') {
      this.all = value as Date[];
    } else {
      args!._value = value;
      // Evict oldest entry if cache is full
      if (this[what].length > MAX_CACHE_SIZE) {
        this[what].shift();
      }
      this[what].push(args as IterArgs);
    }
  }

  /**
   * @return false - not in the cache
   * @return null  - cached, but zero occurrences (before/after)
   * @return Date  - cached (before/after)
   * @return []    - cached, but zero occurrences (all/between)
   * @return [Date1, DateN] - cached (all/between)
   */
  public _cacheGet(
    what: CacheKeys | 'all',
    args?: Partial<IterArgs>,
  ): Date | Date[] | false | null {
    let cached: Date | Date[] | false | null = false;
    const argsKeys = args ? (Object.keys(args) as (keyof IterArgs)[]) : [];
    const findCacheDiff = (item: IterArgs) => {
      for (let i = 0; i < argsKeys.length; i++) {
        const key = argsKeys[i]!;
        if (!argsMatch(args![key], item[key])) {
          return true;
        }
      }
      return false;
    };

    if (what === 'all') {
      cached = this.all as Date[];
    } else {
      // Let's see whether we've already called the
      // 'what' method with the same 'args'
      for (const item of this[what]) {
        if (argsKeys.length && findCacheDiff(item)) continue;
        cached = item._value;
        break;
      }
    }

    if (cached === false && this.all) {
      // Not in the cache, but we already know all the occurrences,
      // so we can find the correct dates from the cached ones.
      const iterResult = new IterResult(what, args!);
      for (const date of this.all) {
        if (!iterResult.accept(date)) break;
      }
      cached = iterResult.getValue() as Date;
      this._cacheAdd(what, cached, args);
    }

    return isArray(cached)
      ? cloneDates(cached)
      : cached instanceof Date
        ? clone(cached)
        : cached;
  }
}
