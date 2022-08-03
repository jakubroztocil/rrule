import { expect } from 'chai'
import { ExclusiveTestFunction, TestFunction } from 'mocha'
export { datetime } from '../../src/dateutil'
import { datetime } from '../../src/dateutil'
import { RRule, RRuleSet } from '../../src'

const assertDatesEqual = function (
  actual: Date | Date[],
  expected: Date | Date[],
  msg?: string
) {
  msg = msg ? ' [' + msg + '] ' : ''

  if (!(actual instanceof Array)) actual = [actual]
  if (!(expected instanceof Array)) expected = [expected]

  if (expected.length > 1) {
    expect(actual).to.have.length(
      expected.length,
      msg + 'number of recurrences'
    )
    msg = ' - '
  }

  for (let i = 0; i < expected.length; i++) {
    const act = actual[i]
    const exp = expected[i]
    expect(exp instanceof Date ? exp.toString() : exp).to.equal(
      act.toString(),
      msg + (i + 1) + '/' + expected.length
    )
  }
}

const extractTime = function (date: Date) {
  return date != null ? date.getTime() : void 0
}

/**
 * dateutil.parser.parse
 */
export const parse = function (str: string) {
  const parts = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  const [, y, m, d, h, i, s] = parts
  const year = Number(y)
  const month = Number(m[0] === '0' ? m[1] : m)
  const day = Number(d[0] === '0' ? d[1] : d)
  const hour = Number(h[0] === '0' ? h[1] : h)
  const minute = Number(i[0] === '0' ? i[1] : i)
  const second = Number(s[0] === '0' ? s[1] : s)
  return datetime(year, month, day, hour, minute, second)
}

interface TestRecurring {
  (m: string, testObj: unknown, expectedDates: Date | Date[]): void
  only: (...args: unknown[]) => void
  skip: (...args: unknown[]) => void
}

interface TestObj {
  rrule: RRule
  method: 'all' | 'between' | 'before' | 'after'
  args: unknown[]
}

export const testRecurring = function (
  msg: string,
  testObj: TestObj | RRule | (() => TestObj),
  expectedDates: Date | Date[],
  itFunc: TestFunction | ExclusiveTestFunction = it
) {
  let rule: RRule
  let method: 'all' | 'before' | 'between' | 'after'
  let args: unknown[]

  if (typeof testObj === 'function') {
    testObj = testObj()
  }

  if (testObj instanceof RRule || testObj instanceof RRuleSet) {
    rule = testObj
    method = 'all'
    args = []
  } else {
    rule = testObj.rrule
    method = testObj.method
    args = testObj.args ?? []
  }

  // Use text and string representation of the rrule as the message.
  if (rule instanceof RRule) {
    msg =
      msg +
      ' [' +
      (rule.isFullyConvertibleToText() ? rule.toText() : 'no text repr') +
      ']' +
      ' [' +
      rule.toString() +
      ']'
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    msg = msg + ' ' + rule.toString()
  }

  itFunc(msg, function () {
    const ctx = this.test.ctx
    let time = Date.now()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let actualDates = rule[method](...args)
    time = Date.now() - time

    const maxTestDuration = 200
    expect(time).to.be.lessThan(
      maxTestDuration,
      `${rule}' method "${method}" should finish in ${maxTestDuration} ms, but took ${time} ms`
    )

    if (!(actualDates instanceof Array)) actualDates = [actualDates]
    if (!(expectedDates instanceof Array)) expectedDates = [expectedDates]

    assertDatesEqual(actualDates, expectedDates)

    // Additional tests using the expected dates
    // ==========================================================

    if (ctx.ALSO_TEST_SUBSECOND_PRECISION) {
      expect(actualDates.map(extractTime)).to.deep.equal(
        expectedDates.map(extractTime)
      )
    }

    if (ctx.ALSO_TEST_STRING_FUNCTIONS) {
      // Test toString()/fromString()
      const str = rule.toString()
      const rrule2 = RRule.fromString(str)
      const string2 = rrule2.toString()
      expect(str).to.equal(
        string2,
        'toString() == fromString(toString()).toString()'
      )
      if (method === 'all') {
        assertDatesEqual(rrule2.all(), expectedDates, 'fromString().all()')
      }
    }

    if (
      ctx.ALSO_TEST_NLP_FUNCTIONS &&
      rule.isFullyConvertibleToText &&
      rule.isFullyConvertibleToText()
    ) {
      // Test fromText()/toText().
      const str = rule.toString()
      const text = rule.toText()
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const rrule2 = RRule.fromText(text, rule.options.dtstart)
      const text2 = rrule2.toText()
      expect(text2).to.equal(text, 'toText() == fromText(toText()).toText()')

      // Test fromText()/toString().
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const rrule3 = RRule.fromText(text, rule.options.dtstart)
      expect(rrule3.toString()).to.equal(
        str,
        'toString() == fromText(toText()).toString()'
      )
    }

    if (method === 'all' && ctx.ALSO_TEST_BEFORE_AFTER_BETWEEN) {
      // Test before, after, and between - use the expected dates.
      // create a clean copy of the rrule object to bypass caching
      rule = rule.clone()

      if (expectedDates.length > 2) {
        // Test between()
        assertDatesEqual(
          rule.between(
            expectedDates[0],
            expectedDates[expectedDates.length - 1],
            true
          ),
          expectedDates,
          'between, inc=true'
        )

        assertDatesEqual(
          rule.between(
            expectedDates[0],
            expectedDates[expectedDates.length - 1],
            false
          ),
          expectedDates.slice(1, expectedDates.length - 1),
          'between, inc=false'
        )
      }

      if (expectedDates.length > 1) {
        let date
        let next
        let prev
        for (let i = 0; i < expectedDates.length; i++) {
          date = expectedDates[i]
          next = expectedDates[i + 1]
          prev = expectedDates[i - 1]

          // Test after() and before() with inc=true.
          assertDatesEqual(rule.after(date, true), date, 'after, inc=true')
          assertDatesEqual(rule.before(date, true), date, 'before, inc=true')

          // Test after() and before() with inc=false.
          next &&
            assertDatesEqual(rule.after(date, false), next, 'after, inc=false')
          prev &&
            assertDatesEqual(
              rule.before(date, false),
              prev,
              'before, inc=false'
            )
        }
      }
    }
  })
} as TestRecurring

testRecurring.only = function (...args) {
  testRecurring.apply(it, [...args, it.only])
}

testRecurring.skip = function () {
  // eslint-disable-next-line prefer-spread, prefer-rest-params
  it.skip.apply(it, arguments)
}

export function expectedDate(
  startDate: Date,
  currentLocalDate: Date,
  targetZone: string
): Date {
  // get the tzoffset between the client tz and the target tz
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const dateInLocalTZ = new Date(
    startDate.toLocaleString(undefined, { timeZone: localTimeZone })
  )
  const dateInTargetTZ = new Date(
    startDate.toLocaleString(undefined, { timeZone: targetZone })
  )
  const tzOffset = dateInTargetTZ.getTime() - dateInLocalTZ.getTime()

  return new Date(startDate.getTime() - tzOffset)
  // return new Date(new Date(startDate.getTime() + tzOffset).toLocaleDateString(undefined, { timeZone: localTimeZone }))
}
