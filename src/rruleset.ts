import { sort, timeToUntilString } from './dateutil';
import type IterResult from './iterresult';
import { iterSet } from './iterset';
import { optionsToString } from './optionstostring';
import { RRule } from './rrule';
import { RRuleBase } from './rrulebase';
import type { IterResultType, QueryMethodTypes } from './types';

export class RRuleSet extends RRuleBase {
  public readonly _rrule: RRule[];
  public readonly _rdate: Date[];
  public readonly _exrule: RRule[];
  public readonly _exdate: Date[];

  private _dtstart?: Date | null;
  private _tzid?: string;

  /**
   *
   * @param {Boolean?} noCache
   * The same strategy as RRule on cache, default to false
   * @constructor
   */
  constructor(noCache = false) {
    super(noCache);

    this._rrule = [];
    this._rdate = [];
    this._exrule = [];
    this._exdate = [];
  }

  dtstart(value?: Date | null): Date | null | undefined {
    if (value !== undefined) {
      this._dtstart = value;
    }
    if (this._dtstart !== undefined) {
      return this._dtstart;
    }
    for (const rule of this._rrule) {
      if (rule.origOptions.dtstart) return rule.origOptions.dtstart;
    }
    return undefined;
  }

  tzid(value?: string): string | undefined {
    if (value !== undefined) {
      this._tzid = value;
    }
    if (this._tzid !== undefined) {
      return this._tzid;
    }
    for (const rule of this._rrule) {
      if (rule.origOptions.tzid) return rule.origOptions.tzid;
    }
    return undefined;
  }

  _iter<M extends QueryMethodTypes>(
    iterResult: IterResult<M>,
  ): IterResultType<M> {
    return iterSet(
      iterResult,
      this._rrule,
      this._exrule,
      this._rdate,
      this._exdate,
      this.tzid(),
    );
  }

  /**
   * Adds an RRule to the set
   *
   * @param rrule
   */
  rrule(rrule: RRule) {
    _addRule(rrule, this._rrule);
  }

  /**
   * Adds an EXRULE to the set
   *
   * @param rrule
   */
  exrule(rrule: RRule) {
    _addRule(rrule, this._exrule);
  }

  /**
   * Adds an RDate to the set
   *
   * @param date
   */
  rdate(date: Date) {
    _addDate(date, this._rdate);
  }

  /**
   * Adds an EXDATE to the set
   *
   * @param date
   */
  exdate(date: Date) {
    _addDate(date, this._exdate);
  }

  /**
   * Get list of included rrules in this recurrence set.
   *
   * @return List of rrules
   */
  rrules(): RRule[] {
    return this._rrule.map((e) => e.clone());
  }

  /**
   * Get list of excluded rrules in this recurrence set.
   *
   * @return List of exrules
   */
  exrules(): RRule[] {
    return this._exrule.map((e) => e.clone());
  }

  /**
   * Get list of included datetimes in this recurrence set.
   *
   * @return List of rdates
   */
  rdates() {
    return this._rdate.map((e) => new Date(e.getTime()));
  }

  /**
   * Get list of included datetimes in this recurrence set.
   *
   * @return List of exdates
   */
  exdates() {
    return this._exdate.map((e) => new Date(e.getTime()));
  }

  valueOf() {
    let result: string[] = [];

    if (!this._rrule.length && this._dtstart) {
      result = result.concat(optionsToString({ dtstart: this._dtstart }));
    }

    this._rrule.forEach((rrule) => {
      result = result.concat(rrule.toString().split('\n'));
    });

    this._exrule.forEach((exrule) => {
      result = result.concat(
        exrule
          .toString()
          .split('\n')
          .map((line) => line.replace(/^RRULE:/, 'EXRULE:'))
          .filter((line) => !/^DTSTART/.test(line)),
      );
    });

    if (this._rdate.length) {
      result.push(rdatesToString('RDATE', this._rdate, this.tzid()));
    }

    if (this._exdate.length) {
      result.push(rdatesToString('EXDATE', this._exdate, this.tzid()));
    }

    return result;
  }

  /**
   * to generate recurrence field such as:
   * DTSTART:19970902T010000Z
   * RRULE:FREQ=YEARLY;COUNT=2;BYDAY=TU
   * RRULE:FREQ=YEARLY;COUNT=1;BYDAY=TH
   */
  toString() {
    return this.valueOf().join('\n');
  }

  /**
   * Create a new RRuleSet Object completely base on current instance
   */
  clone(): RRuleSet {
    const rrs = new RRuleSet(!this._cache);

    for (const rule of this._rrule) rrs.rrule(rule.clone());
    for (const rule of this._exrule) rrs.exrule(rule.clone());
    for (const date of this._rdate) rrs.rdate(new Date(date.getTime()));
    for (const date of this._exdate) rrs.exdate(new Date(date.getTime()));

    return rrs;
  }
}

function _addRule(rrule: RRule, collection: RRule[]) {
  if (!(rrule instanceof RRule)) {
    throw new TypeError(`${String(rrule)} is not an instance of RRule`);
  }

  const str = String(rrule);
  if (!collection.some((r) => String(r) === str)) {
    collection.push(rrule);
  }
}

function _addDate(date: Date, collection: Date[]) {
  if (!(date instanceof Date)) {
    throw new TypeError(`${String(date)} is not an instance of Date`);
  }

  const time = date.getTime();
  if (!collection.some((d) => d.getTime() === time)) {
    collection.push(date);
    sort(collection);
  }
}

function rdatesToString(
  param: string,
  rdates: Date[],
  tzid: string | undefined,
) {
  const isUTC = !tzid || tzid.toUpperCase() === 'UTC';
  const header = isUTC ? `${param}:` : `${param};TZID=${tzid}:`;

  const dateString = rdates
    .map((rdate) => timeToUntilString(rdate.valueOf(), isUTC))
    .join(',');

  return `${header}${dateString}`;
}
