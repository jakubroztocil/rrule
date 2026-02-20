import type { Time } from '../datetime';
import { combine, fromOrdinal, sort } from '../dateutil';
import { isPresent, pymod } from '../helpers';
import type Iterinfo from '../iterinfo/index';

export function buildPoslist(
  bysetpos: number[],
  timeset: Time[],
  start: number,
  end: number,
  ii: Iterinfo,
  dayset: (number | null)[],
) {
  const poslist: Date[] = [];

  for (const pos of bysetpos) {
    let daypos: number;
    let timepos: number;

    if (pos < 0) {
      daypos = Math.floor(pos / timeset.length);
      timepos = pymod(pos, timeset.length);
    } else {
      daypos = Math.floor((pos - 1) / timeset.length);
      timepos = pymod(pos - 1, timeset.length);
    }

    const tmp = [];
    for (let k = start; k < end; k++) {
      const val = dayset[k];
      if (!isPresent(val)) continue;
      tmp.push(val);
    }
    let i: number;
    if (daypos < 0) {
      i = tmp.slice(daypos)[0]!;
    } else {
      i = tmp[daypos]!;
    }

    const time = timeset[timepos]!;
    const date = fromOrdinal(ii.yearordinal + i);
    const res = combine(date, time);
    // XXX: can this ever be in the array?
    // - compare the actual date instead?
    if (!poslist.includes(res)) poslist.push(res);
  }

  sort(poslist);

  return poslist;
}
