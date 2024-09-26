import IterResult from '../iterresult'
import { ParsedOptions, freqIsDailyOrGreater, QueryMethodTypes } from '../types'
import { combine, fromOrdinal, MAXYEAR } from '../dateutil'
import Iterinfo from '../iterinfo/index'
import { RRule } from '../rrule'
import { buildTimeset } from '../parseoptions'
import { notEmpty, includes, isPresent } from '../helpers'
import { DateWithZone } from '../datewithzone'
import { buildPoslist } from './poslist'
import { Time, DateTime } from '../datetime'

export function iter<M extends QueryMethodTypes>(
  iterResult: IterResult<M>,
  options: ParsedOptions
) {
  const { dtstart, freq, interval, until, bysetpos } = options

  let count = options.count
  if (count === 0 || interval === 0) {
    return emitResult(iterResult)
  }

  let counterDate = DateTime.fromDate(dtstart)
  const endYear = until ? DateTime.fromDate(until).year : MAXYEAR

  const ii = new Iterinfo(options)
  ii.rebuild(counterDate.year, counterDate.month)

  let timeset = makeTimeset(ii, counterDate, options)

  for (;;) {
    const [dayset, start, end] = ii.getdayset(freq)(
      counterDate.year,
      counterDate.month,
      counterDate.day
    )

    const filtered = removeFilteredDays(dayset, start, end, ii, options)

    if (notEmpty(bysetpos)) {
      const poslist = buildPoslist(bysetpos, timeset, start, end, ii, dayset)

      for (let j = 0; j < poslist.length; j++) {
        const res = poslist[j]
        if (until && res > until) {
          return emitResult(iterResult)
        }

        if (res >= dtstart) {
          const rezonedDate = rezoneIfNeeded(res, options)
          if (!iterResult.accept(rezonedDate)) {
            return emitResult(iterResult)
          }

          if (count) {
            --count
            if (!count) {
              return emitResult(iterResult)
            }
          }
        }
      }
    } else {
      for (let j = start; j < end; j++) {
        const currentDay = dayset[j]
        if (!isPresent(currentDay)) {
          continue
        }

        const date = fromOrdinal(ii.yearordinal + currentDay)
        for (let k = 0; k < timeset.length; k++) {
          const time = timeset[k]
          const res = combine(date, time)
          if (until && res > until) {
            return emitResult(iterResult)
          }

          if (res >= dtstart) {
            const rezonedDate = rezoneIfNeeded(res, options)
            if (!iterResult.accept(rezonedDate)) {
              return emitResult(iterResult)
            }

            if (count) {
              --count
              if (!count) {
                return emitResult(iterResult)
              }
            }
          }
        }
      }
    }
    if (options.interval === 0) {
      return emitResult(iterResult)
    }

    // Handle frequency and interval
    counterDate.add(options, filtered)

    if (counterDate && counterDate.year > endYear) {
      return emitResult(iterResult)
    }

    if (!freqIsDailyOrGreater(freq)) {
      timeset = ii.gettimeset(freq)(
        counterDate.hour,
        counterDate.minute,
        counterDate.second,
        0
      )
    }

    ii.rebuild(counterDate.year, counterDate.month)
  }
}

function isFiltered(
  ii: Iterinfo,
  currentDay: number,
  options: ParsedOptions
): boolean {
  const {
    bymonth,
    byweekno,
    byweekday,
    byeaster,
    bymonthday,
    bynmonthday,
    byyearday,
  } = options

  return (
    (notEmpty(bymonth) && !includes(bymonth, ii.mmask[currentDay])) ||
    (notEmpty(byweekno) && !ii.wnomask[currentDay]) ||
    (notEmpty(byweekday) && !includes(byweekday, ii.wdaymask[currentDay])) ||
    (notEmpty(ii.nwdaymask) && !ii.nwdaymask[currentDay]) ||
    (byeaster !== null && !includes(ii.eastermask, currentDay)) ||
    ((notEmpty(bymonthday) || notEmpty(bynmonthday)) &&
      !includes(bymonthday, ii.mdaymask[currentDay]) &&
      !includes(bynmonthday, ii.nmdaymask[currentDay])) ||
    (notEmpty(byyearday) &&
      ((currentDay < ii.yearlen &&
        !includes(byyearday, currentDay + 1) &&
        !includes(byyearday, -ii.yearlen + currentDay)) ||
        (currentDay >= ii.yearlen &&
          !includes(byyearday, currentDay + 1 - ii.yearlen) &&
          !includes(byyearday, -ii.nextyearlen + currentDay - ii.yearlen))))
  )
}

function rezoneIfNeeded(date: Date, options: ParsedOptions) {
  return new DateWithZone(date, options.tzid).rezonedDate()
}

function emitResult<M extends QueryMethodTypes>(iterResult: IterResult<M>) {
  return iterResult.getValue()
}

function removeFilteredDays(
  dayset: (number | null)[],
  start: number,
  end: number,
  ii: Iterinfo,
  options: ParsedOptions
) {
  let filtered = false
  for (let dayCounter = start; dayCounter < end; dayCounter++) {
    const currentDay = dayset[dayCounter]

    filtered = isFiltered(ii, currentDay, options)

    if (filtered) dayset[currentDay] = null
  }

  return filtered
}

function makeTimeset(
  ii: Iterinfo,
  counterDate: DateTime,
  options: ParsedOptions
): Time[] | null {
  const { freq, byhour, byminute, bysecond } = options

  if (freqIsDailyOrGreater(freq)) {
    return buildTimeset(options)
  }

  if (
    (freq >= RRule.HOURLY &&
      notEmpty(byhour) &&
      !includes(byhour, counterDate.hour)) ||
    (freq >= RRule.MINUTELY &&
      notEmpty(byminute) &&
      !includes(byminute, counterDate.minute)) ||
    (freq >= RRule.SECONDLY &&
      notEmpty(bysecond) &&
      !includes(bysecond, counterDate.second))
  ) {
    return []
  }

  return ii.gettimeset(freq)(
    counterDate.hour,
    counterDate.minute,
    counterDate.second,
    counterDate.millisecond
  )
}
