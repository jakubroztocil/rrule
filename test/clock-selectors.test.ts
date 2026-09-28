import { RRule, RRuleSet, rrulestr } from '../src'

const iso = (dates: Date[]) => dates.map((date) => date.toISOString())
const start = new Date('2008-01-01T09:00:00Z')
const expected = Array.from({ length: 12 }, (_, index) =>
  new Date(start.getTime() + index * 30000).toISOString()
)

describe('repeated clock selectors', () => {
  it.each([false, true])(
    'preserves COUNT in a parsed set (cache=%s)',
    (cache) => {
      for (const seconds of ['0,30', '0,30,0']) {
        const text =
          'DTSTART:20080101T090000Z\n' +
          `RRULE:FREQ=MINUTELY;COUNT=12;BYSECOND=${seconds}`
        const set = rrulestr(text, { forceset: true, cache })
        expect(set).toBeInstanceOf(RRuleSet)
        const query = () =>
          iso(
            set.between(
              new Date('2008-01-01T00:00:00Z'),
              new Date('2009-01-01T00:00:00Z'),
              true
            )
          )
        expect(query()).toEqual(expected)
        expect(query()).toEqual(expected)
        expect(set.toString()).toBe(text)
      }
    }
  )

  it.each([
    ['DAILY', 'BYHOUR=9,10,9', 'BYHOUR=9,10'],
    ['HOURLY', 'BYMINUTE=0,30,0', 'BYMINUTE=0,30'],
    ['MINUTELY', 'BYSECOND=0,30,0', 'BYSECOND=0,30'],
    [
      'DAILY',
      'BYHOUR=9,10,9;BYMINUTE=0,30,0;BYSECOND=0,30,0',
      'BYHOUR=9,10;BYMINUTE=0,30;BYSECOND=0,30',
    ],
  ])('counts distinct times for %s / %s', (frequency, repeated, unique) => {
    const prefix = `DTSTART:20080101T090000Z\nRRULE:FREQ=${frequency};COUNT=12;`
    const dates = iso(rrulestr(prefix + repeated).all())
    expect(dates).toEqual(iso(rrulestr(prefix + unique).all()))
    expect(new Set(dates).size).toBe(12)
  })

  it('does not mutate the original selector arrays or their serialization', () => {
    const options = {
      freq: RRule.DAILY,
      dtstart: start,
      count: 2,
      byhour: [9, 9],
      byminute: [0, 0],
      bysecond: [0, 30, 0],
    }
    const serialized = RRule.optionsToString(options)
    Object.freeze(options.byhour)
    Object.freeze(options.byminute)
    Object.freeze(options.bysecond)
    const rule = new RRule(options)
    expect(iso(rule.all())).toEqual(expected.slice(0, 2))
    expect(rule.origOptions).toEqual(options)
    expect(rule.toString()).toBe(serialized)
    expect(rule.clone().toString()).toBe(serialized)
    expect(iso(rule.clone().all())).toEqual(expected.slice(0, 2))
    expect(options.byhour).toEqual([9, 9])
    expect(options.byminute).toEqual([0, 0])
    expect(options.bysecond).toEqual([0, 30, 0])
  })

  it('applies RDATE and EXDATE to the complete counted occurrence set', () => {
    const set = rrulestr(
      'DTSTART:20080101T090000Z\n' +
        'RRULE:FREQ=MINUTELY;COUNT=12;BYSECOND=0,30,0\n' +
        'EXDATE:20080101T090100Z\n' +
        'RDATE:20080101T091000Z',
      { forceset: true }
    )
    expect(iso(set.all())).toEqual([
      ...expected.filter((date) => date !== expected[2]),
      '2008-01-01T09:10:00.000Z',
    ])
  })

  it('returns distinct occurrences through the inclusive UNTIL boundary', () => {
    const rule = rrulestr(
      'DTSTART:20080101T090000Z\n' +
        'RRULE:FREQ=MINUTELY;UNTIL=20080101T090430Z;BYSECOND=0,30,0'
    )
    expect(iso(rule.all())).toEqual(expected.slice(0, 10))
  })

  it('applies BYSETPOS to distinct candidate times', () => {
    const prefix =
      'DTSTART:20080101T090000Z\nRRULE:FREQ=DAILY;COUNT=3;BYSETPOS=2;'
    expect(iso(rrulestr(prefix + 'BYSECOND=0,0,30').all())).toEqual([
      '2008-01-01T09:00:30.000Z',
      '2008-01-02T09:00:30.000Z',
      '2008-01-03T09:00:30.000Z',
    ])
  })
})
