import { iter } from './iter/index';
import type IterResult from './iterresult';
import type { Language } from './nlp/i18n';
import { fromText, isFullyConvertible, parseText, toText } from './nlp/index';
import type { DateFormatter, GetText } from './nlp/totext';
import { optionsToString } from './optionstostring';
import { initializeOptions, parseOptions } from './parseoptions';
import { parseString } from './parsestring';
import { RRuleBase } from './rrulebase';
import {
  Frequency,
  type IterResultType,
  type Options,
  type ParsedOptions,
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
export class RRule extends RRuleBase {
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
    super(noCache);

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
