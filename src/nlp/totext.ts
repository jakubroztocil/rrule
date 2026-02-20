import { isArray, isNumber, isPresent } from '../helpers';
import { RRule } from '../rrule';
import type { ByWeekday, Options, ParsedOptions } from '../types';
import type { Weekday } from '../weekday';
import ENGLISH, { type Language } from './i18n';

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Return true if a value is in an array
 */
const contains = (arr: string[], val: string) => arr.indexOf(val) !== -1;

// =============================================================================
// ToText
// =============================================================================

export type GetText = (id: string | number | Weekday) => string;

const defaultGetText: GetText = (id) => id.toString();

export type DateFormatter = (
  year: number,
  month: string,
  day: number,
) => string;

const defaultDateFormatter: DateFormatter = (
  year: number,
  month: string,
  day: number,
) => `${month} ${day}, ${year}`;

/**
 *
 * @param {RRule} rrule
 * Optional:
 * @param {Function} gettext function
 * @param {Object} language definition
 * @constructor
 */
export default class ToText {
  static IMPLEMENTED: string[][];
  private rrule: RRule;
  private text: string[];
  private gettext: GetText;
  private dateFormatter: DateFormatter;
  private language: Language;
  private options: ParsedOptions;
  private origOptions: Partial<Options>;
  private bymonthday!: Options['bymonthday'] | null;
  private byweekday: {
    allWeeks: ByWeekday[] | null;
    someWeeks: ByWeekday[] | null;
    isWeekdays: boolean;
    isEveryDay: boolean;
  } | null;

  constructor(
    rrule: RRule,
    gettext: GetText = defaultGetText,
    language: Language = ENGLISH,
    dateFormatter: DateFormatter = defaultDateFormatter,
  ) {
    this.text = [];
    this.language = language || ENGLISH;
    this.gettext = gettext;
    this.dateFormatter = dateFormatter;
    this.rrule = rrule;
    this.options = rrule.options;
    this.origOptions = rrule.origOptions;

    if (this.origOptions.bymonthday) {
      const bymonthday = ([] as number[]).concat(this.options.bymonthday);
      const bynmonthday = ([] as number[]).concat(this.options.bynmonthday);

      bymonthday.sort((a, b) => a - b);
      bynmonthday.sort((a, b) => b - a);
      // 1, 2, 3, .., -5, -4, -3, ..
      this.bymonthday = bymonthday.concat(bynmonthday);
      if (!this.bymonthday.length) this.bymonthday = null;
    }

    if (isPresent(this.origOptions.byweekday)) {
      const byweekday = !isArray(this.origOptions.byweekday)
        ? [this.origOptions.byweekday]
        : this.origOptions.byweekday;
      const days = String(byweekday);

      this.byweekday = {
        allWeeks: byweekday.filter(
          (weekday: ByWeekday) => !(weekday as Weekday).n,
        ),
        someWeeks: byweekday.filter((weekday: ByWeekday) =>
          Boolean((weekday as Weekday).n),
        ),
        isWeekdays:
          days.indexOf('MO') !== -1 &&
          days.indexOf('TU') !== -1 &&
          days.indexOf('WE') !== -1 &&
          days.indexOf('TH') !== -1 &&
          days.indexOf('FR') !== -1 &&
          days.indexOf('SA') === -1 &&
          days.indexOf('SU') === -1,
        isEveryDay:
          days.indexOf('MO') !== -1 &&
          days.indexOf('TU') !== -1 &&
          days.indexOf('WE') !== -1 &&
          days.indexOf('TH') !== -1 &&
          days.indexOf('FR') !== -1 &&
          days.indexOf('SA') !== -1 &&
          days.indexOf('SU') !== -1,
      };

      const sortWeekDays = (a: ByWeekday, b: ByWeekday) =>
        (a as Weekday).weekday - (b as Weekday).weekday;

      this.byweekday.allWeeks!.sort(sortWeekDays);
      this.byweekday.someWeeks!.sort(sortWeekDays);

      if (!this.byweekday.allWeeks!.length) this.byweekday.allWeeks = null;
      if (!this.byweekday.someWeeks!.length) this.byweekday.someWeeks = null;
    } else {
      this.byweekday = null;
    }
  }

  /**
   * Test whether the rrule can be fully converted to text.
   *
   * @param {RRule} rrule
   * @return {Boolean}
   */
  static isFullyConvertible(rrule: RRule) {
    const canConvert = true;

    if (!(rrule.options.freq in ToText.IMPLEMENTED)) return false;
    if (rrule.origOptions.until && rrule.origOptions.count) return false;

    for (const key in rrule.origOptions) {
      if (contains(['dtstart', 'tzid', 'wkst', 'freq'], key)) return true;
      if (!contains(ToText.IMPLEMENTED[rrule.options.freq]!, key)) return false;
    }

    return canConvert;
  }

  isFullyConvertible() {
    return ToText.isFullyConvertible(this.rrule);
  }

  /**
   * Perform the conversion. Only some of the frequencies are supported.
   * If some of the rrule's options aren't supported, they'll
   * be omitted from the output an "(~ approximate)" will be appended.
   *
   * @return {*}
   */
  toString() {
    const gettext = this.gettext;

    if (!(this.options.freq in ToText.IMPLEMENTED)) {
      return gettext('RRule error: Unable to fully convert this rrule to text');
    }

    this.text = [gettext('every')];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this[RRule.FREQUENCIES[this.options.freq]]();

    if (this.options.until) {
      this.add(gettext('until'));
      const until = this.options.until;
      this.add(
        this.dateFormatter(
          until.getUTCFullYear(),
          this.language.monthNames[until.getUTCMonth()]!,
          until.getUTCDate(),
        ),
      );
    } else if (this.options.count) {
      this.add(gettext('for'))
        .add(this.options.count.toString())
        .add(
          this.plural(this.options.count) ? gettext('times') : gettext('time'),
        );
    }

    if (this.origOptions.dtstart) {
      this.text.push(',');
      this.add(gettext('starting'));
      const dtstart = this.origOptions.dtstart;
      this.add(
        this.dateFormatter(
          dtstart.getUTCFullYear(),
          this.language.monthNames[dtstart.getUTCMonth()]!,
          dtstart.getUTCDate(),
        ),
      );
    }

    if (!this.isFullyConvertible()) this.add(gettext('(~ approximate)'));

    return this.text.join('');
  }

  HOURLY() {
    const gettext = this.gettext;

    if (this.options.interval !== 1) this.add(this.options.interval.toString());

    this.add(
      this.plural(this.options.interval) ? gettext('hours') : gettext('hour'),
    );
  }

  MINUTELY() {
    const gettext = this.gettext;

    if (this.options.interval !== 1) this.add(this.options.interval.toString());

    this.add(
      this.plural(this.options.interval)
        ? gettext('minutes')
        : gettext('minute'),
    );
  }

  DAILY() {
    const gettext = this.gettext;

    if (this.options.interval !== 1) this.add(this.options.interval.toString());

    if (this.byweekday?.isWeekdays) {
      this.add(
        this.plural(this.options.interval)
          ? gettext('weekdays')
          : gettext('weekday'),
      );
    } else {
      this.add(
        this.plural(this.options.interval) ? gettext('days') : gettext('day'),
      );
    }

    if (this.origOptions.bymonth) {
      this.add(gettext('in'));
      this._bymonth();
    }

    if (this.bymonthday) {
      this._bymonthday();
    } else if (this.byweekday) {
      this._byweekday();
    } else if (this.origOptions.byhour) {
      this._byhour();
    }
  }

  WEEKLY() {
    const gettext = this.gettext;

    if (this.options.interval !== 1) {
      this.add(this.options.interval.toString()).add(
        this.plural(this.options.interval) ? gettext('weeks') : gettext('week'),
      );
    }

    if (this.byweekday?.isWeekdays) {
      if (this.options.interval === 1) {
        this.add(
          this.plural(this.options.interval)
            ? gettext('weekdays')
            : gettext('weekday'),
        );
      } else {
        this.add(gettext('on')).add(gettext('weekdays'));
      }
    } else if (this.byweekday?.isEveryDay) {
      this.add(
        this.plural(this.options.interval) ? gettext('days') : gettext('day'),
      );
    } else {
      if (this.options.interval === 1) this.add(gettext('week'));

      if (this.origOptions.bymonth) {
        this.add(gettext('in'));
        this._bymonth();
      }

      if (this.bymonthday) {
        this._bymonthday();
      } else if (this.byweekday) {
        this._byweekday();
      }

      if (this.origOptions.byhour) {
        this._byhour();
      }
    }
  }

  MONTHLY() {
    const gettext = this.gettext;

    if (this.origOptions.bymonth) {
      if (this.options.interval !== 1) {
        this.add(this.options.interval.toString()).add(gettext('months'));
        if (this.plural(this.options.interval)) this.add(gettext('in'));
      } else {
        // this.add(gettext('MONTH'))
      }
      this._bymonth();
    } else {
      if (this.options.interval !== 1) {
        this.add(this.options.interval.toString());
      }
      this.add(
        this.plural(this.options.interval)
          ? gettext('months')
          : gettext('month'),
      );
    }
    if (this.bymonthday) {
      this._bymonthday();
    } else if (this.byweekday?.isWeekdays) {
      this.add(gettext('on')).add(gettext('weekdays'));
    } else if (this.byweekday) {
      this._byweekday();
    }
  }

  YEARLY() {
    const gettext = this.gettext;

    if (this.origOptions.bymonth) {
      if (this.options.interval !== 1) {
        this.add(this.options.interval.toString());
        this.add(gettext('years'));
      } else {
        // this.add(gettext('YEAR'))
      }
      this._bymonth();
    } else {
      if (this.options.interval !== 1) {
        this.add(this.options.interval.toString());
      }
      this.add(
        this.plural(this.options.interval) ? gettext('years') : gettext('year'),
      );
    }

    if (this.bymonthday) {
      this._bymonthday();
    } else if (this.byweekday) {
      this._byweekday();
    }

    if (this.options.byyearday) {
      this.add(gettext('on the'))
        .add(
          this.list(
            this.options.byyearday,
            this.nth as GetText,
            gettext('and'),
          ),
        )
        .add(gettext('day'));
    }

    if (this.options.byweekno) {
      this.add(gettext('in'))
        .add(
          this.plural((this.options.byweekno as number[]).length)
            ? gettext('weeks')
            : gettext('week'),
        )
        .add(this.list(this.options.byweekno, undefined, gettext('and')));
    }
  }

  private _bymonthday() {
    const gettext = this.gettext;
    if (this.byweekday?.allWeeks) {
      this.add(gettext('on'))
        .add(
          this.list(
            this.byweekday.allWeeks,
            this.weekdaytext as GetText,
            gettext('or'),
          ),
        )
        .add(gettext('the'))
        .add(this.list(this.bymonthday!, this.nth as GetText, gettext('or')));
    } else {
      this.add(gettext('on the')).add(
        this.list(this.bymonthday!, this.nth as GetText, gettext('and')),
      );
    }
    // this.add(gettext('DAY'))
  }

  private _byweekday() {
    const gettext = this.gettext;
    if (this.byweekday!.allWeeks && !this.byweekday!.isWeekdays) {
      this.add(gettext('on')).add(
        this.list(this.byweekday!.allWeeks, this.weekdaytext as GetText),
      );
    }

    if (this.byweekday!.someWeeks) {
      if (this.byweekday!.allWeeks) this.add(gettext('and'));

      this.add(gettext('on the')).add(
        this.list(
          this.byweekday!.someWeeks,
          this.weekdaytext as GetText,
          gettext('and'),
        ),
      );
    }
  }

  private _byhour() {
    const gettext = this.gettext;

    this.add(gettext('at')).add(
      this.list(this.origOptions.byhour!, undefined, gettext('and')),
    );
  }

  private _bymonth() {
    this.add(
      this.list(
        this.options.bymonth,
        this.monthtext as unknown as GetText,
        this.gettext('and'),
      ),
    );
  }

  nth(n: number | string) {
    n = parseInt(n.toString(), 10);
    let nth: string;
    const gettext = this.gettext;

    if (n === -1) return gettext('last');

    const npos = Math.abs(n);
    switch (npos) {
      case 1:
      case 21:
      case 31:
        nth = npos + gettext('st');
        break;
      case 2:
      case 22:
        nth = npos + gettext('nd');
        break;
      case 3:
      case 23:
        nth = npos + gettext('rd');
        break;
      default:
        nth = npos + gettext('th');
    }

    return n < 0 ? `${nth} ${gettext('last')}` : nth;
  }

  monthtext(m: number) {
    return this.language.monthNames[m - 1];
  }

  weekdaytext(wday: Weekday | number) {
    const weekday = isNumber(wday) ? (wday + 1) % 7 : wday.getJsWeekday();
    return (
      ((wday as Weekday).n ? `${this.nth((wday as Weekday).n!)} ` : '') +
      this.language.dayNames[weekday]
    );
  }

  plural(n: number) {
    return n % 100 !== 1;
  }

  add(s: string) {
    this.text.push(' ');
    this.text.push(s);
    return this;
  }

  list(
    arr: ByWeekday | ByWeekday[],
    callback?: GetText,
    finalDelim?: string,
    delim = ',',
  ) {
    if (!isArray(arr)) {
      arr = [arr];
    }
    const delimJoin = (
      array: string[],
      delimiter: string,
      finalDelimiter: string,
    ) => {
      let list = '';

      for (let i = 0; i < array.length; i++) {
        if (i !== 0) {
          if (i === array.length - 1) {
            list += ` ${finalDelimiter} `;
          } else {
            list += `${delimiter} `;
          }
        }
        list += array[i];
      }
      return list;
    };

    callback = callback || ((o) => o.toString());

    const realCallback = (arg: ByWeekday) => {
      return callback?.call(this, arg);
    };

    if (finalDelim) {
      return delimJoin(arr.map(realCallback), delim, finalDelim);
    } else {
      return arr.map(realCallback).join(`${delim} `);
    }
  }
}
