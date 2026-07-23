import { combine, fromOrdinal, sort } from '../dateutil'
import Iterinfo from '../iterinfo/index'
import { pymod, isPresent } from '../helpers'
import { Time } from '../datetime'

export function buildPoslist(
  bysetpos: number[],
  timeset: Time[],
  start: number,
  end: number,
  ii: Iterinfo,
  dayset: (number | null)[]
) {
  const poslist: Date[] = []

  for (let j = 0; j < bysetpos.length; j++) {
    let daypos: number
    let timepos: number
    const pos = bysetpos[j]

    if (pos < 0) {
      daypos = Math.floor(pos / timeset.length)
      timepos = pymod(pos, timeset.length)
    } else {
      daypos = Math.floor((pos - 1) / timeset.length)
      timepos = pymod(pos - 1, timeset.length)
    }

    const tmp = []
    for (let k = start; k < end; k++) {
      const val = dayset[k]
      if (!isPresent(val)) continue
      tmp.push(val)
    }
    let i: number
    if (daypos < 0) {
      i = tmp.slice(daypos)[0]
    } else {
      i = tmp[daypos]
    }

    const time = timeset[timepos]
    const date = fromOrdinal(ii.yearordinal + i)
    const res = combine(date, time)
    // dedupe by value: `res` is a fresh Date each iteration, so an identity
    // check never matches two BYSETPOS positions that resolve to the same
    // instant (RFC 5545 defines the recurrence set as a set of DATE-TIMEs)
    if (!poslist.some((d) => d.getTime() === res.getTime())) poslist.push(res)
  }

  sort(poslist)

  return poslist
}
