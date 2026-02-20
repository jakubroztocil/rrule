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

  let ranges: number[][] = [];
  if (options.freq === RRule.YEARLY) {
    if (empty(options.bymonth)) {
      ranges = [[0, yearlen]];
    } else {
      for (let j = 0; j < options.bymonth.length; j++) {
        month = options.bymonth[j]!;
        ranges.push(mrange.slice(month - 1, month + 1));
      }
    }
  } else if (options.freq === RRule.MONTHLY) {
    ranges = [mrange.slice(month - 1, month + 1)];
  }

  if (empty(ranges)) {
    return result;
  }

  // Weekly frequency won't get here, so we may not
  // care about cross-year weekly periods.
  result.nwdaymask = repeat(0, yearlen) as number[];

  for (let j = 0; j < ranges.length; j++) {
    const rang = ranges[j]!;
    const first = rang[0]!;
    const last = rang[1]! - 1;

    for (let k = 0; k < options.bynweekday!.length; k++) {
      let i: number;
      const [wday, n] = options.bynweekday![k]!;
      if (n! < 0) {
        i = last + (n! + 1) * 7;
        i -= pymod(wdaymask[i]! - wday!, 7);
      } else {
        i = first + (n! - 1) * 7;
        i += pymod(7 - wdaymask[i]! + wday!, 7);
      }
      if (first <= i && i <= last) result.nwdaymask[i] = 1;
    }
  }

  return result;
}
