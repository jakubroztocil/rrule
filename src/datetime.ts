import { getWeekday, MAXYEAR, monthRange } from './dateutil';
import { divmod, empty, pymod } from './helpers';
import { Frequency, type ParsedOptions } from './types';

export class Time {
  public hour: number;
  public minute: number;
  public second: number;
  public millisecond: number;

  constructor(
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
  ) {
    this.hour = hour;
    this.minute = minute;
    this.second = second;
    this.millisecond = millisecond || 0;
  }

  getHours() {
    return this.hour;
  }

  getMinutes() {
    return this.minute;
  }

  getSeconds() {
    return this.second;
  }

  getMilliseconds() {
    return this.millisecond;
  }

  getTime() {
    return (
      (this.hour * 60 * 60 + this.minute * 60 + this.second) * 1000 +
      this.millisecond
    );
  }
}

export class DateTime extends Time {
  public day: number;
  public month: number;
  public year: number;

  static fromDate(date: Date) {
    return new DateTime(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.valueOf() % 1000,
    );
  }

  constructor(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
  ) {
    super(hour, minute, second, millisecond);
    this.year = year;
    this.month = month;
    this.day = day;
  }

  getWeekday() {
    return getWeekday(new Date(this.getTime()));
  }

  getTime() {
    return new Date(
      Date.UTC(
        this.year,
        this.month - 1,
        this.day,
        this.hour,
        this.minute,
        this.second,
        this.millisecond,
      ),
    ).getTime();
  }

  getDay() {
    return this.day;
  }

  getMonth() {
    return this.month;
  }

  getYear() {
    return this.year;
  }

  public addYears(years: number) {
    this.year += years;
  }

  public addMonths(months: number) {
    this.month += months;
    if (this.month > 12) {
      const yearDiv = Math.floor(this.month / 12);
      this.month = pymod(this.month, 12);
      this.year += yearDiv;
      if (this.month === 0) {
        this.month = 12;
        --this.year;
      }
    }
  }

  public addWeekly(days: number, wkst: number) {
    if (wkst > this.getWeekday()) {
      this.day += -(this.getWeekday() + 1 + (6 - wkst)) + days * 7;
    } else {
      this.day += -(this.getWeekday() - wkst) + days * 7;
    }

    this.fixDay();
  }

  public addDaily(days: number) {
    this.day += days;
    this.fixDay();
  }

  public addHours(hours: number, filtered: boolean, byhour: number[]) {
    if (filtered) {
      // Jump to one iteration before next day
      this.hour += Math.floor((23 - this.hour) / hours) * hours;
    }

    for (;;) {
      this.hour += hours;
      const { div: dayDiv, mod: hourMod } = divmod(this.hour, 24);
      if (dayDiv) {
        this.hour = hourMod;
        this.addDaily(dayDiv);
      }

      if (empty(byhour) || byhour.includes(this.hour)) break;
    }
  }

  public addMinutes(
    minutes: number,
    filtered: boolean,
    byhour: number[],
    byminute: number[],
  ) {
    if (filtered) {
      // Jump to one iteration before next day
      this.minute +=
        Math.floor((1439 - (this.hour * 60 + this.minute)) / minutes) * minutes;
    }

    for (;;) {
      this.minute += minutes;
      const { div: hourDiv, mod: minuteMod } = divmod(this.minute, 60);
      if (hourDiv) {
        this.minute = minuteMod;
        this.addHours(hourDiv, false, byhour);
      }

      if (
        (empty(byhour) || byhour.includes(this.hour)) &&
        (empty(byminute) || byminute.includes(this.minute))
      ) {
        break;
      }
    }
  }

  public addSeconds(
    seconds: number,
    filtered: boolean,
    byhour: number[],
    byminute: number[],
    bysecond: number[],
  ) {
    if (filtered) {
      // Jump to one iteration before next day
      this.second +=
        Math.floor(
          (86399 - (this.hour * 3600 + this.minute * 60 + this.second)) /
            seconds,
        ) * seconds;
    }

    for (;;) {
      this.second += seconds;
      const { div: minuteDiv, mod: secondMod } = divmod(this.second, 60);
      if (minuteDiv) {
        this.second = secondMod;
        this.addMinutes(minuteDiv, false, byhour, byminute);
      }

      if (
        (empty(byhour) || byhour.includes(this.hour)) &&
        (empty(byminute) || byminute.includes(this.minute)) &&
        (empty(bysecond) || bysecond.includes(this.second))
      ) {
        break;
      }
    }
  }

  public fixDay() {
    if (this.day <= 28) {
      return;
    }

    let daysinmonth = monthRange(this.year, this.month - 1)[1];
    if (this.day <= daysinmonth) {
      return;
    }

    while (this.day > daysinmonth) {
      this.day -= daysinmonth;
      ++this.month;
      if (this.month === 13) {
        this.month = 1;
        ++this.year;
        if (this.year > MAXYEAR) {
          return;
        }
      }

      daysinmonth = monthRange(this.year, this.month - 1)[1];
    }
  }

  public add(options: ParsedOptions, filtered: boolean) {
    const { freq, interval, wkst, byhour, byminute, bysecond } = options;

    switch (freq) {
      case Frequency.YEARLY:
        return this.addYears(interval);
      case Frequency.MONTHLY:
        return this.addMonths(interval);
      case Frequency.WEEKLY:
        return this.addWeekly(interval, wkst);
      case Frequency.DAILY:
        return this.addDaily(interval);
      case Frequency.HOURLY:
        return this.addHours(interval, filtered, byhour);
      case Frequency.MINUTELY:
        return this.addMinutes(interval, filtered, byhour, byminute);
      case Frequency.SECONDLY:
        return this.addSeconds(interval, filtered, byhour, byminute, bysecond);
    }
  }
}
