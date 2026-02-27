import { Options } from '../src/types'
import { RRule } from '../src/rrule'
import { optionsToString } from '../src/optionstostring'
import { datetime } from './lib/utils'

describe('optionsToString', () => {
  it('serializes valid single lines of rrules', function () {
    const expectations: [Partial<Options>, string][] = [
      [
        { freq: RRule.WEEKLY, until: datetime(2010, 1, 1, 0, 0, 0) },
        'RRULE:FREQ=WEEKLY;UNTIL=20100101T000000Z',
      ],
      [
        {
          dtstart: datetime(1997, 9, 2, 9, 0, 0),
          tzid: 'America/New_York',
        },
        'DTSTART;TZID=America/New_York:19970902T090000',
      ],
      [
        {
          dtstart: datetime(1997, 9, 2, 9, 0, 0),
          freq: RRule.WEEKLY,
        },
        'DTSTART:19970902T090000Z\n' + 'RRULE:FREQ=WEEKLY',
      ],
      [
        {
          dtstart: datetime(1997, 9, 2, 9, 0, 0),
          tzid: 'America/New_York',
          freq: RRule.WEEKLY,
        },
        'DTSTART;TZID=America/New_York:19970902T090000\n' + 'RRULE:FREQ=WEEKLY',
      ],
      [
        {
          freq: RRule.MONTHLY,
          count: 3,
          byweekday: ['MO', 'TU'],
        },
        'RRULE:FREQ=MONTHLY;COUNT=3;BYDAY=MO,TU',
      ],
    ]

    expectations.forEach(function (item) {
      const s = item[0]
      const s2 = item[1]
      // JSON.stringify(s)
      expect(optionsToString(s)).toEqual(s2)
    })
  })

  it('serializes WeekdayStr arrays through RRule.toString()', () => {
    const rule = new RRule({
      freq: RRule.MONTHLY,
      count: 3,
      byweekday: ['MO', 'TU'],
    })

    expect(rule.toString()).toBe('RRULE:FREQ=MONTHLY;COUNT=3;BYDAY=MO,TU')
  })
})
