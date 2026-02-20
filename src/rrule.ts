import { Cache, type CacheKeys } from './cache';
import CallbackIterResult from './callbackiterresult';
import { isValidDate } from './dateutil';
import { iter } from './iter/index';
import IterResult, { type IterArgs } from './iterresult';
import type { Language } from './nlp/i18n';
import { fromText, isFullyConvertible, parseText, toText } from './nlp/index';
import type { DateFormatter, GetText } from './nlp/totext';
import { optionsToString } from './optionstostring';
import { initializeOptions, parseOptions } from './parseoptions';
import { parseString } from './parsestring';
import {
  Frequency,
  type IterResultType,
  type Options,
  type ParsedOptions,
  type QueryMethods,
  type QueryMethodTypes,
} from './types';
import { Weekday } from './weekday';

// =============================================================================
// RRule
// =============================================================================

export const Days = {
  MO: new Weekday(0),
  TU: new Weekday(1),
  WE: new Weekday(2),
  TH: new Weekday(3),
  FR: new Weekday(4),
  SA: new Weekday(5),
  SU: new Weekday(6),
};

export const DEFAULT_OPTIONS: Options = {
  freq: Frequency.YEARLY,
  dtstart: null,
  interval: 1,
  wkst: Days.MO,
  count: null,
  until: null,
  tzid: null,
  bysetpos: null,
  bymonth: null,
  bymonthday: null,
  bynmonthday: null,
  byyearday: null,
  byweekno: null,
  byweekday: null,
  bynweekday: null,
  byhour: null,
  byminute: null,
  bysecond: null,
  byeaster: null,
};

export const defaultKeys = Object.keys(DEFAULT_OPTIONS) as (keyof Options)[];

/**
 *
 * @param {Options?} options - see <http://labix.org/python-dateutil/#head-cf004ee9a75592797e076752b2a889c10f445418>
 * - The only required option is `freq`, one of RRule.YEARLY, RRule.MONTHLY, ...
 * @constructor
 */
export class RRule implements QueryMethods {
  public _cache: Cache | null;
  public origOptions: Partial<Options>;
  public options: ParsedOptions;

  // RRule class 'constants'

  static readonly FREQUENCIES: (keyof typeof Frequency)[] = [
    'YEARLY',
    'MONTHLY',
    'WEEKLY',
    'DAILY',
    'HOURLY',
    'MINUTELY',
    'SECONDLY',
  ];

  static readonly YEARLY = Frequency.YEARLY;
  static readonly MONTHLY = Frequency.MONTHLY;
  static readonly WEEKLY = Frequency.WEEKLY;
  static readonly DAILY = Frequency.DAILY;
  static readonly HOURLY = Frequency.HOURLY;
  static readonly MINUTELY = Frequency.MINUTELY;
  static readonly SECONDLY = Frequency.SECONDLY;

  static readonly MO = Days.MO;
  static readonly TU = Days.TU;
  static readonly WE = Days.WE;
  static readonly TH = Days.TH;
  static readonly FR = Days.FR;
  static readonly SA = Days.SA;
  static readonly SU = Days.SU;

  constructor(options: Partial<Options> = {}, noCache = false) {
    // RFC string
    this._cache = noCache ? null : new Cache();

    // used by toString()
    this.origOptions = initializeOptions(options);
    const { parsedOptions } = parseOptions(options);
    this.options = parsedOptions;
  }

  static parseText(text: string, language?: Language) {
    return parseText(text, language);
  }

  static fromText(text: string, language?: Language) {
    return fromText(text, language);
  }

  static parseString = parseString;

  static fromString(str: string) {
    return new RRule(RRule.parseString(str) || undefined);
  }

  static optionsToString = optionsToString;

  protected _iter<M extends QueryMethodTypes>(
    iterResult: IterResult<M>,
  ): IterResultType<M> {
    return iter(iterResult, this.options);
  }

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

  /**
   * Converts the rrule into its string representation
   *
   * @see <http://www.ietf.org/rfc/rfc2445.txt>
   * @return String
   */
  toString() {
    return optionsToString(this.origOptions);
  }

  /**
   * Will convert all rules described in nlp:ToText
   * to text.
   */
  toText(
    gettext?: GetText,
    language?: Language,
    dateFormatter?: DateFormatter,
  ) {
    return toText(this, gettext, language, dateFormatter);
  }

  isFullyConvertibleToText() {
    return isFullyConvertible(this);
  }

  /**
   * @return a RRule instance with the same freq and options
   * as this one (cache is not cloned)
   */
  clone(): RRule {
    return new RRule(this.origOptions);
  }
}
