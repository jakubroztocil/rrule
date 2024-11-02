import { RRule } from '../src'
import { optionsToString } from '../src/optionstostring'
import { DateFormatter } from '../src/nlp/totext'
import { datetime } from './lib/utils'

const texts = [
  ['Every day', 'RRULE:FREQ=DAILY'],
  ['Every day at 10, 12 and 17', 'RRULE:FREQ=DAILY;BYHOUR=10,12,17'],
  [
    'Every week on Sunday at 10, 12 and 17',
    'RRULE:FREQ=WEEKLY;BYDAY=SU;BYHOUR=10,12,17',
  ],
  ['Every week', 'RRULE:FREQ=WEEKLY'],
  ['Every hour', 'RRULE:FREQ=HOURLY'],
  ['Every 4 hours', 'RRULE:INTERVAL=4;FREQ=HOURLY'],
  ['Every week on Tuesday', 'RRULE:FREQ=WEEKLY;BYDAY=TU'],
  ['Every week on Monday, Wednesday', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE'],
  ['Every weekday', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'],
  ['Every 2 weeks', 'RRULE:INTERVAL=2;FREQ=WEEKLY'],
  ['Every month', 'RRULE:FREQ=MONTHLY'],
  ['Every 6 months', 'RRULE:INTERVAL=6;FREQ=MONTHLY'],
  ['Every year', 'RRULE:FREQ=YEARLY'],
  ['Every year on the 1st Friday', 'RRULE:FREQ=YEARLY;BYDAY=+1FR'],
  ['Every year on the 13th Friday', 'RRULE:FREQ=YEARLY;BYDAY=+13FR'],
  ['Every month on the 4th', 'RRULE:FREQ=MONTHLY;BYMONTHDAY=4'],
  ['Every month on the 4th last', 'RRULE:FREQ=MONTHLY;BYMONTHDAY=-4'],
  ['Every month on the 3rd Tuesday', 'RRULE:FREQ=MONTHLY;BYDAY=+3TU'],
  ['Every month on the 3rd last Tuesday', 'RRULE:FREQ=MONTHLY;BYDAY=-3TU'],
  ['Every month on the last Monday', 'RRULE:FREQ=MONTHLY;BYDAY=-1MO'],
  ['Every month on the 2nd last Friday', 'RRULE:FREQ=MONTHLY;BYDAY=-2FR'],
  // ['Every week until January 1, 2007', 'RRULE:FREQ=WEEKLY;UNTIL=20070101T080000Z'],
  ['Every week for 20 times', 'RRULE:FREQ=WEEKLY;COUNT=20'],
]

const fromTexts = [
  ...texts,
  // Testing more flexible weekday formats
  ['Every Mon & Wed', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE'],
  ['Every Mon and Wed', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE'],
  ['Every Tues & Thurs', 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH'],
  ['Every tu. and thurs. & wed.', 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH,WE'],

  // Testing business/work day variations
  ['Every business day', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'],
  ['Every work day', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'],

  // Testing month abbreviations
  ['Every month in Jan', 'RRULE:FREQ=MONTHLY;BYMONTH=1'],
  ['Every week in Sept.', 'RRULE:FREQ=WEEKLY;BYMONTH=9'],
  ['Every day in Dec.', 'RRULE:FREQ=DAILY;BYMONTH=12'],

  // Testing time unit variations
  ['Every hr', 'RRULE:FREQ=HOURLY'],
  ['Every 2 hrs', 'RRULE:INTERVAL=2;FREQ=HOURLY'],
  ['Every min', 'RRULE:FREQ=MINUTELY'],
  ['Every 5 mins', 'RRULE:INTERVAL=5;FREQ=MINUTELY'],

  // Testing @ symbol for at
  ['Every day @ 10', 'RRULE:FREQ=DAILY;BYHOUR=10'],
  ['Every week @ 9', 'RRULE:FREQ=WEEKLY;BYHOUR=9'],

  // Testing plural variations of days
  ['Every Monday and Wednesdays', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE'],
  ['Every Tuesdays & Thursdays', 'RRULE:FREQ=WEEKLY;BYDAY=TU,TH'],

  // Deduplicates
  [
    'Every Monday, Tuesday, Wednesday, and Monday',
    'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE',
  ],
  ['Every month in Jan & January', 'RRULE:FREQ=MONTHLY;BYMONTH=1'],
]

const toTexts = [
  ...texts,
  [
    'Every week on monday',
    'DTSTART;TZID=America/New_York:20220601T000000\nRRULE:INTERVAL=1;FREQ=WEEKLY;BYDAY=MO',
  ],
]

describe('NLP', () => {
  it.each(fromTexts)('fromText() %s', (text, str) => {
    expect(RRule.fromText(text).toString()).toBe(str)
  })

  it.each(toTexts)('toText() %s', (text, str) => {
    expect(RRule.fromString(str).toText().toLowerCase()).toBe(
      text.toLowerCase()
    )
  })

  it.each(texts)('parseText() %s', (text, str) => {
    expect(optionsToString(RRule.parseText(text))).toBe(str)
  })

  it('permits integers in byweekday (#153)', () => {
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: 0,
    })

    expect(rrule.toText()).toBe('every week on Monday')
    expect(rrule.toString()).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO')
  })

  it('sorts monthdays correctly (#101)', () => {
    const options = { freq: 2, bymonthday: [3, 10, 17, 24] }
    const rule = new RRule(options)
    expect(rule.toText()).toBe('every week on the 3rd, 10th, 17th and 24th')
  })

  it('shows correct text for every day', () => {
    const options = {
      freq: RRule.WEEKLY,
      byweekday: [
        RRule.MO,
        RRule.TU,
        RRule.WE,
        RRule.TH,
        RRule.FR,
        RRule.SA,
        RRule.SU,
      ],
    }
    const rule = new RRule(options)
    expect(rule.toText()).toBe('every day')
  })

  it('shows correct text for every minute', () => {
    const options = { freq: RRule.MINUTELY }
    const rule = new RRule(options)
    expect(rule.toText()).toBe('every minute')
  })

  it('shows correct text for every (plural) minutes', () => {
    const options = { freq: RRule.MINUTELY, interval: 2 }
    const rule = new RRule(options)
    expect(rule.toText()).toBe('every 2 minutes')
  })

  it("by default formats 'until' correctly", () => {
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      until: datetime(2012, 11, 10),
    })

    expect(rrule.toText()).toBe('every week until November 10, 2012')
  })

  it("formats 'until' as desired if asked", () => {
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      until: datetime(2012, 11, 10),
    })

    const dateFormatter: DateFormatter = (year, month, day) =>
      `${day}. ${month}, ${year}`

    expect(rrule.toText(undefined, undefined, dateFormatter)).toBe(
      'every week until 10. November, 2012'
    )
  })
})
