import type { Options } from '../src';
import { datetime, RRule } from '../src';
import { optionsToString } from '../src/optionstostring';

describe('optionsToString', () => {
  it('serializes valid single lines of rrules', () => {
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
    ];

    expectations.forEach((item) => {
      const s = item[0];
      const s2 = item[1];
      // JSON.stringify(s)
      expect(optionsToString(s)).toEqual(s2);
    });
  });
});
