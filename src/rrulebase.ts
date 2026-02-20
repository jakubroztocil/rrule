import { Cache, type CacheKeys } from './cache';
import CallbackIterResult from './callbackiterresult';
import { isValidDate } from './dateutil';
import IterResult, { type IterArgs } from './iterresult';
import type { IterResultType, QueryMethods, QueryMethodTypes } from './types';

export abstract class RRuleBase implements QueryMethods {
  public _cache: Cache | null;

  constructor(noCache = false) {
    this._cache = noCache ? null : new Cache();
  }

  protected abstract _iter<M extends QueryMethodTypes>(
    iterResult: IterResult<M>,
  ): IterResultType<M>;

  private _cacheGet(what: CacheKeys | 'all', args?: Partial<IterArgs>) {
    if (!this._cache) return false;
    return this._cache._cacheGet(what, args);
  }

  public _cacheAdd(
    what: CacheKeys | 'all',
    value: Date[] | Date | null,
    args?: Partial<IterArgs>,
  ) {
    if (!this._cache) return;
    return this._cache._cacheAdd(what, value, args);
  }

  /**
   * @param {Function} iterator - optional function that will be called
   * on each date that is added. It can return false
   * to stop the iteration.
   * @return Array containing all recurrences.
   */
  all(iterator?: (d: Date, len: number) => boolean): Date[] {
    if (iterator) {
      return this._iter(new CallbackIterResult('all', {}, iterator));
    }

    let result = this._cacheGet('all') as Date[] | false;
    if (result === false) {
      result = this._iter(new IterResult('all', {}));
      this._cacheAdd('all', result);
    }
    return result;
  }

  /**
   * Returns all the occurrences of the rrule between after and before.
   * The inc keyword defines what happens if after and/or before are
   * themselves occurrences. With inc == True, they will be included in the
   * list, if they are found in the recurrence set.
   *
   * @return Array
   */
  between(
    after: Date,
    before: Date,
    inc = false,
    iterator?: (d: Date, len: number) => boolean,
  ): Date[] {
    if (!isValidDate(after) || !isValidDate(before)) {
      throw new Error('Invalid date passed in to RRule.between');
    }
    const args = {
      before,
      after,
      inc,
    };

    if (iterator) {
      return this._iter(new CallbackIterResult('between', args, iterator));
    }

    let result = this._cacheGet('between', args);
    if (result === false) {
      result = this._iter(new IterResult('between', args));
      this._cacheAdd('between', result, args);
    }
    return result as Date[];
  }

  /**
   * Returns the last recurrence before the given datetime instance.
   * The inc keyword defines what happens if dt is an occurrence.
   * With inc == True, if dt itself is an occurrence, it will be returned.
   *
   * @return Date or null
   */
  before(dt: Date, inc = false): Date | null {
    if (!isValidDate(dt)) {
      throw new Error('Invalid date passed in to RRule.before');
    }
    const args = { dt: dt, inc: inc };
    let result = this._cacheGet('before', args);
    if (result === false) {
      result = this._iter(new IterResult('before', args));
      this._cacheAdd('before', result, args);
    }
    return result as Date | null;
  }

  /**
   * Returns the first recurrence after the given datetime instance.
   * The inc keyword defines what happens if dt is an occurrence.
   * With inc == True, if dt itself is an occurrence, it will be returned.
   *
   * @return Date or null
   */
  after(dt: Date, inc = false): Date | null {
    if (!isValidDate(dt)) {
      throw new Error('Invalid date passed in to RRule.after');
    }
    const args = { dt: dt, inc: inc };
    let result = this._cacheGet('after', args);
    if (result === false) {
      result = this._iter(new IterResult('after', args));
      this._cacheAdd('after', result, args);
    }
    return result as Date | null;
  }

  /**
   * Returns the number of recurrences in this set. It will have go trough
   * the whole recurrence, if this hasn't been done before.
   */
  count(): number {
    return this.all().length;
  }

  abstract clone(): RRuleBase;
  abstract toString(): string;
}
