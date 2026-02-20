import { DateTime, type Time } from '../datetime';
import { combine, fromOrdinal, MAXYEAR } from '../dateutil';
import { DateWithZone } from '../datewithzone';
import { isPresent, notEmpty } from '../helpers';
import Iterinfo from '../iterinfo/index';
import type IterResult from '../iterresult';
import { buildTimeset } from '../parseoptions';
import { RRule } from '../rrule';
import {
  freqIsDailyOrGreater,
  type ParsedOptions,
  type QueryMethodTypes,
} from '../types';
import { buildPoslist } from './poslist';

export function iter<M extends QueryMethodTypes>(
  iterResult: IterResult<M>,
  options: ParsedOptions,
) {
  const { dtstart, freq, interval, until, bysetpos } = options;

  let count = options.count;
  if (count === 0 || interval === 0) {
    return emitResult(iterResult);
  }

  const counterDate = DateTime.fromDate(dtstart);

  const ii = new Iterinfo(options);
  ii.rebuild(counterDate.year, counterDate.month);

  let timeset = makeTimeset(ii, counterDate, options);

  for (;;) {
    const [dayset, start, end] = ii.getdayset(freq)(
      counterDate.year,
      counterDate.month,
      counterDate.day,
    );

    const filtered = removeFilteredDays(dayset, start, end, ii, options);

    if (notEmpty(bysetpos)) {
      const poslist = buildPoslist(bysetpos, timeset!, start, end, ii, dayset);

      for (const res of poslist) {
        if (until && res > until) {
          return emitResult(iterResult);
        }

        if (res >= dtstart) {
          const rezonedDate = rezoneIfNeeded(res, options);
          if (!iterResult.accept(rezonedDate)) {
            return emitResult(iterResult);
          }

          if (count) {
            --count;
            if (!count) {
              return emitResult(iterResult);
            }
          }
        }
      }
    } else {
      for (let j = start; j < end; j++) {
        const currentDay = dayset[j];
        if (!isPresent(currentDay)) {
          continue;
        }

        const date = fromOrdinal(ii.yearordinal + currentDay);
        for (const time of timeset!) {
          const res = combine(date, time);
          if (until && res > until) {
            return emitResult(iterResult);
          }

          if (res >= dtstart) {
            const rezonedDate = rezoneIfNeeded(res, options);
            if (!iterResult.accept(rezonedDate)) {
              return emitResult(iterResult);
            }

            if (count) {
              --count;
              if (!count) {
                return emitResult(iterResult);
              }
            }
          }
        }
      }
    }
    // Handle frequency and interval
    counterDate.add(options, filtered);

    if (counterDate.year > MAXYEAR) {
      return emitResult(iterResult);
    }

    if (!freqIsDailyOrGreater(freq)) {
      timeset = ii.gettimeset(freq)(
        counterDate.hour,
        counterDate.minute,
        counterDate.second,
        0,
      );
    }

    ii.rebuild(counterDate.year, counterDate.month);
  }
}

function isFiltered(
  ii: Iterinfo,
  currentDay: number,
  options: ParsedOptions,
): boolean {
  const {
    bymonth,
    byweekno,
    byweekday,
    byeaster,
    bymonthday,
    bynmonthday,
    byyearday,
  } = options;

  return (
    (notEmpty(bymonth) && !bymonth.includes(ii.mmask[currentDay]!)) ||
    (notEmpty(byweekno) && !ii.wnomask![currentDay]) ||
    (notEmpty(byweekday) && !byweekday.includes(ii.wdaymask[currentDay]!)) ||
    (notEmpty(ii.nwdaymask) && !ii.nwdaymask[currentDay]) ||
    (byeaster !== null && !ii.eastermask?.includes(currentDay)) ||
    ((notEmpty(bymonthday) || notEmpty(bynmonthday)) &&
      !bymonthday.includes(ii.mdaymask[currentDay]!) &&
      !bynmonthday.includes(ii.nmdaymask[currentDay]!)) ||
    (notEmpty(byyearday) &&
      ((currentDay < ii.yearlen &&
        !byyearday.includes(currentDay + 1) &&
        !byyearday.includes(-ii.yearlen + currentDay)) ||
        (currentDay >= ii.yearlen &&
          !byyearday.includes(currentDay + 1 - ii.yearlen) &&
          !byyearday.includes(-ii.nextyearlen + currentDay - ii.yearlen))))
  );
}

function rezoneIfNeeded(date: Date, options: ParsedOptions) {
  return new DateWithZone(date, options.tzid).rezonedDate();
}

function emitResult<M extends QueryMethodTypes>(iterResult: IterResult<M>) {
  return iterResult.getValue();
}

function removeFilteredDays(
  dayset: (number | null)[],
  start: number,
  end: number,
  ii: Iterinfo,
  options: ParsedOptions,
) {
  let filtered = false;
  for (let dayCounter = start; dayCounter < end; dayCounter++) {
    const currentDay = dayset[dayCounter]!;

    if (isFiltered(ii, currentDay, options)) {
      filtered = true;
      dayset[currentDay] = null;
    }
  }

  return filtered;
}

function makeTimeset(
  ii: Iterinfo,
  counterDate: DateTime,
  options: ParsedOptions,
): Time[] | null {
  const { freq, byhour, byminute, bysecond } = options;

  if (freqIsDailyOrGreater(freq)) {
    return buildTimeset(options);
  }

  if (
    (freq >= RRule.HOURLY &&
      notEmpty(byhour) &&
      !byhour.includes(counterDate.hour)) ||
    (freq >= RRule.MINUTELY &&
      notEmpty(byminute) &&
      !byminute.includes(counterDate.minute)) ||
    (freq >= RRule.SECONDLY &&
      notEmpty(bysecond) &&
      !bysecond.includes(counterDate.second))
  ) {
    return [];
  }

  return ii.gettimeset(freq)(
    counterDate.hour,
    counterDate.minute,
    counterDate.second,
    counterDate.millisecond,
  );
}
