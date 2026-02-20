import { Time } from './datetime';
import { getWeekday, isDate, isValidDate } from './dateutil';
import {
  isArray,
  isNumber,
  isPresent,
  isWeekdayStr,
  notEmpty,
} from './helpers';
import { DEFAULT_OPTIONS, defaultKeys, RRule } from './rrule';
import {
  freqIsDailyOrGreater,
  type Options,
  type ParsedOptions,
} from './types';
import { Weekday } from './weekday';

export function initializeOptions(options: Partial<Options>) {
  const invalid: string[] = [];
  const keys = Object.keys(options) as (keyof Options)[];

  // Shallow copy for options and origOptions and check for invalid
  for (const key of keys) {
    if (!defaultKeys.includes(key)) invalid.push(key);
    if (isDate(options[key]) && !isValidDate(options[key])) {
      invalid.push(key);
    }
  }

  if (invalid.length) {
    throw new Error(`Invalid options: ${invalid.join(', ')}`);
  }

  return { ...options };
}

export function parseOptions(options: Partial<Options>) {
  const opts = { ...DEFAULT_OPTIONS, ...initializeOptions(options) };

  if (isPresent(opts.byeaster)) opts.freq = RRule.YEARLY;

  if (!(isPresent(opts.freq) && RRule.FREQUENCIES[opts.freq])) {
    throw new Error(`Invalid frequency: ${opts.freq} ${options.freq}`);
  }

  if (!opts.dtstart) opts.dtstart = new Date(new Date().setMilliseconds(0));

  if (!isPresent(opts.wkst)) {
    opts.wkst = RRule.MO.weekday;
  } else if (isNumber(opts.wkst)) {
    // cool, just keep it like that
  } else {
    opts.wkst = opts.wkst.weekday;
  }

  if (isPresent(opts.bysetpos)) {
    if (isNumber(opts.bysetpos)) opts.bysetpos = [opts.bysetpos];

    for (const v of opts.bysetpos) {
      if (v === 0 || !(v >= -366 && v <= 366)) {
        throw new Error(
          'bysetpos must be between 1 and 366,' + ' or between -366 and -1',
        );
      }
    }
  }

  if (
    !(
      Boolean(opts.byweekno as number) ||
      notEmpty(opts.byweekno as number[]) ||
      notEmpty(opts.byyearday as number[]) ||
      Boolean(opts.bymonthday) ||
      notEmpty(opts.bymonthday as number[]) ||
      isPresent(opts.byweekday) ||
      isPresent(opts.byeaster)
    )
  ) {
    switch (opts.freq) {
      case RRule.YEARLY:
        if (!opts.bymonth) opts.bymonth = opts.dtstart.getUTCMonth() + 1;
        opts.bymonthday = opts.dtstart.getUTCDate();
        break;
      case RRule.MONTHLY:
        opts.bymonthday = opts.dtstart.getUTCDate();
        break;
      case RRule.WEEKLY:
        opts.byweekday = [getWeekday(opts.dtstart)!];
        break;
    }
  }

  // bymonth
  if (isPresent(opts.bymonth) && !isArray(opts.bymonth)) {
    opts.bymonth = [opts.bymonth];
  }

  // byyearday
  if (
    isPresent(opts.byyearday) &&
    !isArray(opts.byyearday) &&
    isNumber(opts.byyearday)
  ) {
    opts.byyearday = [opts.byyearday];
  }

  // bymonthday
  if (!isPresent(opts.bymonthday)) {
    opts.bymonthday = [];
    opts.bynmonthday = [];
  } else if (isArray(opts.bymonthday)) {
    const bymonthday: number[] = [];
    const bynmonthday: number[] = [];

    for (const v of opts.bymonthday) {
      if (v > 0) {
        bymonthday.push(v);
      } else if (v < 0) {
        bynmonthday.push(v);
      }
    }
    opts.bymonthday = bymonthday;
    opts.bynmonthday = bynmonthday;
  } else if (opts.bymonthday < 0) {
    opts.bynmonthday = [opts.bymonthday];
    opts.bymonthday = [];
  } else {
    opts.bynmonthday = [];
    opts.bymonthday = [opts.bymonthday];
  }

  // byweekno
  if (isPresent(opts.byweekno) && !isArray(opts.byweekno)) {
    opts.byweekno = [opts.byweekno];
  }

  // byweekday / bynweekday
  if (!isPresent(opts.byweekday)) {
    opts.bynweekday = null;
  } else if (isNumber(opts.byweekday)) {
    opts.byweekday = [opts.byweekday];
    opts.bynweekday = null;
  } else if (isWeekdayStr(opts.byweekday)) {
    opts.byweekday = [Weekday.fromStr(opts.byweekday).weekday];
    opts.bynweekday = null;
  } else if (opts.byweekday instanceof Weekday) {
    if (!opts.byweekday.n || opts.freq > RRule.MONTHLY) {
      opts.byweekday = [opts.byweekday.weekday];
      opts.bynweekday = null;
    } else {
      opts.bynweekday = [[opts.byweekday.weekday, opts.byweekday.n]];
      opts.byweekday = null;
    }
  } else {
    const byweekday: number[] = [];
    const bynweekday: [number, number][] = [];

    for (const wday of opts.byweekday) {
      if (isNumber(wday)) {
        byweekday.push(wday);
        continue;
      } else if (isWeekdayStr(wday)) {
        byweekday.push(Weekday.fromStr(wday).weekday);
        continue;
      }

      if (!wday.n || opts.freq > RRule.MONTHLY) {
        byweekday.push(wday.weekday);
      } else {
        bynweekday.push([wday.weekday, wday.n]);
      }
    }
    opts.byweekday = notEmpty(byweekday) ? byweekday : null;
    opts.bynweekday = notEmpty(bynweekday) ? bynweekday : null;
  }

  // byhour
  if (!isPresent(opts.byhour)) {
    opts.byhour =
      opts.freq < RRule.HOURLY ? [opts.dtstart.getUTCHours()] : null;
  } else if (isNumber(opts.byhour)) {
    opts.byhour = [opts.byhour];
  }

  // byminute
  if (!isPresent(opts.byminute)) {
    opts.byminute =
      opts.freq < RRule.MINUTELY ? [opts.dtstart.getUTCMinutes()] : null;
  } else if (isNumber(opts.byminute)) {
    opts.byminute = [opts.byminute];
  }

  // bysecond
  if (!isPresent(opts.bysecond)) {
    opts.bysecond =
      opts.freq < RRule.SECONDLY ? [opts.dtstart.getUTCSeconds()] : null;
  } else if (isNumber(opts.bysecond)) {
    opts.bysecond = [opts.bysecond];
  }

  return { parsedOptions: opts as ParsedOptions };
}

export function buildTimeset(opts: ParsedOptions) {
  const millisecondModulo = opts.dtstart.getTime() % 1000;
  if (!freqIsDailyOrGreater(opts.freq)) {
    return [];
  }

  const timeset: Time[] = [];
  opts.byhour.forEach((hour) => {
    opts.byminute.forEach((minute) => {
      opts.bysecond.forEach((second) => {
        timeset.push(new Time(hour, minute, second, millisecondModulo));
      });
    });
  });

  return timeset;
}
