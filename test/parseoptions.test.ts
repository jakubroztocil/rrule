import { parseOptions } from '../src/parseoptions'
import { RRule } from '../src'
import { Options } from '../src/types'

describe('numeric BYxxx ranges', () => {
  const ranges: {
    name: keyof Options
    valid: number[]
    invalid: number[]
  }[] = [
    { name: 'byhour', valid: [0, 23], invalid: [-1, 24, 25] },
    { name: 'byminute', valid: [0, 59], invalid: [-1, 60] },
    { name: 'bysecond', valid: [0, 59, 60], invalid: [-1, 61] },
    { name: 'bymonth', valid: [1, 12], invalid: [0, 13] },
    { name: 'bymonthday', valid: [-31, -1, 1, 31], invalid: [-32, 0, 32] },
  ]

  describe.each(ranges)('$name', ({ name, valid, invalid }) => {
    const options = {
      freq: RRule.DAILY,
      count: 2,
      dtstart: new Date(Date.UTC(2026, 0, 1)),
    }

    it.each([...invalid, NaN, Infinity, -Infinity, 1.5])(
      'rejects invalid scalar and list member %s',
      (value) => {
        expect(() => new RRule({ ...options, [name]: value })).toThrow(name)
        expect(
          () => new RRule({ ...options, [name]: [valid[0], value] })
        ).toThrow(name)
      }
    )

    it.each([...invalid.map(String), '1.5', 'invalid'])(
      'rejects invalid RRULE scalar and list member %s',
      (value) => {
        const prefix = `FREQ=DAILY;COUNT=2;${name.toUpperCase()}=`
        expect(() => RRule.fromString(prefix + value)).toThrow(name)
        expect(() => RRule.fromString(prefix + valid[0] + ',' + value)).toThrow(
          name
        )
      }
    )

    it.each(valid)('accepts the valid boundary %s', (value) => {
      expect(() => new RRule({ ...options, [name]: value })).not.toThrow()
      expect(() =>
        RRule.fromString(`FREQ=DAILY;${name.toUpperCase()}=${value}`)
      ).not.toThrow()
    })

    it('preserves caller arrays and serialized options', () => {
      const values = valid.slice()
      Object.freeze(values)
      const rule = new RRule({ ...options, [name]: values })
      expect(rule.origOptions[name]).toEqual(valid)
      expect(rule.toString()).toContain(
        `${name.toUpperCase()}=${valid.join(',')}`
      )
      expect(rule.clone().origOptions[name]).toEqual(valid)
    })

    it.each([{ value: null }, { value: undefined }, { value: [] }])(
      'preserves optional input $value',
      ({ value }) => {
        expect(() => new RRule({ ...options, [name]: value })).not.toThrow()
      }
    )
  })

  it('keeps valid calendar and clock boundaries in recurrence output', () => {
    const rule = new RRule({
      freq: RRule.YEARLY,
      dtstart: new Date(Date.UTC(2026, 0, 1)),
      count: 2,
      bymonth: [1, 12],
      bymonthday: [-31, 31],
      byhour: [0, 23],
      byminute: [0, 59],
      bysecond: [0, 59],
    })
    expect(rule.all()).toEqual([
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:59.000Z'),
    ])
  })
})

describe('TZID', () => {
  it('leaves null when null', () => {
    const options = parseOptions({ tzid: null })
    expect(options.parsedOptions.tzid).toBeNull()
  })

  it('uses a string when passed in', () => {
    const options = parseOptions({ tzid: 'America/Los_Angeles' })
    expect(options.parsedOptions.tzid).toBe('America/Los_Angeles')
  })
})

describe('byweekday', () => {
  it('works with a single numeric day', () => {
    const options = parseOptions({ byweekday: 1 })
    expect(options.parsedOptions.byweekday).toEqual([1])
  })

  it('works with a single Weekday day', () => {
    const options = parseOptions({ byweekday: RRule.TU })
    expect(options.parsedOptions.byweekday).toEqual([1])
  })

  it('works with a single string day', () => {
    const options = parseOptions({ byweekday: 'TU' })
    expect(options.parsedOptions.byweekday).toEqual([1])
  })

  it('works with a multiple numeric days', () => {
    const options = parseOptions({ byweekday: [1, 2] })
    expect(options.parsedOptions.byweekday).toEqual([1, 2])
  })

  it('works with a multiple Weekday days', () => {
    const options = parseOptions({ byweekday: [RRule.TU, RRule.WE] })
    expect(options.parsedOptions.byweekday).toEqual([1, 2])
  })

  it('works with a multiple string days', () => {
    const options = parseOptions({ byweekday: ['TU', 'WE'] })
    expect(options.parsedOptions.byweekday).toEqual([1, 2])
  })
})
