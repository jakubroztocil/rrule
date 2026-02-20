import { Time } from '../datetime';
import { datetime, sort, toOrdinal } from '../dateutil';
import { isPresent, notEmpty, range, repeat } from '../helpers';
import { Frequency, type ParsedOptions } from '../types';
import { easter } from './easter';
import { type MonthInfo, rebuildMonth } from './monthinfo';
import { rebuildYear, type YearInfo } from './yearinfo';

export type DaySet = [(number | null)[], number, number];
export type GetDayset = () => DaySet;

// =============================================================================
// Iterinfo
// =============================================================================

export default class Iterinfo {
  public yearinfo!: YearInfo;
  public monthinfo!: MonthInfo;
  public eastermask!: number[] | null;

  // eslint-disable-next-line no-empty-function
  constructor(private options: ParsedOptions) {}

  rebuild(year: number, month: number) {
    const options = this.options;

    if (year !== this.lastyear) {
      this.yearinfo = rebuildYear(year, options);
    }

    if (
      notEmpty(options.bynweekday) &&
      (month !== this.lastmonth || year !== this.lastyear)
    ) {
      const { yearlen, mrange, wdaymask } = this.yearinfo;
      this.monthinfo = rebuildMonth(
        year,
        month,
        yearlen,
        mrange,
        wdaymask,
        options,
      );
    }

    if (isPresent(options.byeaster)) {
      this.eastermask = easter(year, options.byeaster);
    }
  }

  get lastyear() {
    return this.monthinfo ? this.monthinfo.lastyear : null;
  }

  get lastmonth() {
    return this.monthinfo ? this.monthinfo.lastmonth : null;
  }

  get yearlen() {
    return this.yearinfo.yearlen;
  }

  get yearordinal() {
    return this.yearinfo.yearordinal;
  }

  get mrange() {
    return this.yearinfo.mrange;
  }

  get wdaymask() {
    return this.yearinfo.wdaymask;
  }

  get mmask() {
    return this.yearinfo.mmask;
  }

  get wnomask() {
    return this.yearinfo.wnomask;
  }

  get nwdaymask() {
    return this.monthinfo ? this.monthinfo.nwdaymask : [];
  }

  get nextyearlen() {
    return this.yearinfo.nextyearlen;
  }

  get mdaymask() {
    return this.yearinfo.mdaymask;
  }

  get nmdaymask() {
    return this.yearinfo.nmdaymask;
  }

  ydayset() {
    return [range(this.yearlen), 0, this.yearlen] as DaySet;
  }

  mdayset(_: unknown, month: number) {
    const start = this.mrange[month - 1]!;
    const end = this.mrange[month]!;
    const set = repeat<number | null>(null, this.yearlen);
    for (let i = start; i < end; i++) set[i] = i;
    return [set, start, end] as DaySet;
  }

  wdayset(year: number, month: number, day: number) {
    // We need to handle cross-year weeks here.
    const set = repeat<number | null>(null, this.yearlen + 7);
    let i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
    const start = i;
    for (let j = 0; j < 7; j++) {
      set[i] = i;
      ++i;
      if (this.wdaymask[i] === this.options.wkst) break;
    }
    return [set, start, i] as DaySet;
  }

  ddayset(year: number, month: number, day: number) {
    const set = repeat(null, this.yearlen) as (number | null)[];
    const i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
    set[i] = i;
    return [set, i, i + 1] as DaySet;
  }

  htimeset(hour: number, _: number, second: number, millisecond: number) {
    let set: Time[] = [];
    this.options.byminute.forEach((minute) => {
      set = set.concat(this.mtimeset(hour, minute, second, millisecond));
    });
    sort(set);
    return set;
  }

  mtimeset(hour: number, minute: number, _: number, millisecond: number) {
    const set = this.options.bysecond.map(
      (second) => new Time(hour, minute, second, millisecond),
    );

    sort(set);
    return set;
  }

  stimeset(hour: number, minute: number, second: number, millisecond: number) {
    return [new Time(hour, minute, second, millisecond)];
  }

  getdayset(freq: Frequency): (y: number, m: number, d: number) => DaySet {
    switch (freq) {
      case Frequency.YEARLY:
        return this.ydayset.bind(this);
      case Frequency.MONTHLY:
        return this.mdayset.bind(this);
      case Frequency.WEEKLY:
        return this.wdayset.bind(this);
      case Frequency.DAILY:
        return this.ddayset.bind(this);
      default:
        return this.ddayset.bind(this);
    }
  }

  gettimeset(
    freq: Frequency.HOURLY | Frequency.MINUTELY | Frequency.SECONDLY,
  ): (h: number, m: number, s: number, ms: number) => Time[] {
    switch (freq) {
      case Frequency.HOURLY:
        return this.htimeset.bind(this);
      case Frequency.MINUTELY:
        return this.mtimeset.bind(this);
      case Frequency.SECONDLY:
        return this.stimeset.bind(this);
    }
  }
}
