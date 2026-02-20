import { empty, pymod, repeat } from '../helpers';
import { RRule } from '../rrule';
import type { ParsedOptions } from '../types';

export interface MonthInfo {
  lastyear: number;
  lastmonth: number;
  nwdaymask: number[];
}

export function rebuildMonth(
  year: number,
  month: number,
  yearlen: number,
  mrange: number[],
  wdaymask: number[],
  options: ParsedOptions,
) {
  const result: MonthInfo = {
    lastyear: year,
    lastmonth: month,
    nwdaymask: [],
  };

  let ranges: [number, number][] = [];
  if (options.freq === RRule.YEARLY) {
    if (empty(options.bymonth)) {
      ranges = [[0, yearlen]];
    } else {
      for (const m of options.bymonth) {
        month = m;
        ranges.push(mrange.slice(month - 1, month + 1) as [number, number]);
      }
    }
  } else if (options.freq === RRule.MONTHLY) {
    ranges = [mrange.slice(month - 1, month + 1) as [number, number]];
  }

  if (empty(ranges)) {
    return result;
  }

  // Weekly frequency won't get here, so we may not
  // care about cross-year weekly periods.
  result.nwdaymask = repeat(0, yearlen) as number[];

  for (const rang of ranges) {
    const [first, last_] = rang;
    const last = last_ - 1;

    for (const [wday, n] of options.bynweekday!) {
      let i: number;
      if (n < 0) {
        i = last + (n + 1) * 7;
        i -= pymod(wdaymask[i]! - wday, 7);
      } else {
        i = first + (n - 1) * 7;
        i += pymod(7 - wdaymask[i]! + wday, 7);
      }
      if (first <= i && i <= last) result.nwdaymask[i] = 1;
    }
  }

  return result;
}
