export { datetime } from '../../src/dateutil';

import { RRule, RRuleBase } from '../../src';
import { dateInTimeZone, datetime } from '../../src/dateutil';

export const TEST_CTX = {
  ALSO_TESTSTRING_FUNCTIONS: false,
  ALSO_TESTNLP_FUNCTIONS: false,
  ALSO_TESTBEFORE_AFTER_BETWEEN: false,
  ALSO_TESTSUBSECOND_PRECISION: false,
};

const assertDatesEqual = (actual: Date | Date[], expected: Date | Date[]) => {
  if (!Array.isArray(actual)) actual = [actual];
  if (!Array.isArray(expected)) expected = [expected];

  if (expected.length > 1) {
    expect(actual).toHaveLength(expected.length);
  }

  for (let i = 0; i < expected.length; i++) {
    const act = actual[i];
    const exp = expected[i];
    expect(exp instanceof Date ? exp.toString() : exp).toBe(act.toString());
  }
};

const extractTime = (date: Date) => (date != null ? date.getTime() : void 0);

/**
 * dateutil.parser.parse
 */
export const parse = (str: string) => {
  const parts = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  const [, y, m, d, h, i, s] = parts;
  const year = Number(y);
  const month = Number(m[0] === '0' ? m[1] : m);
  const day = Number(d[0] === '0' ? d[1] : d);
  const hour = Number(h[0] === '0' ? h[1] : h);
  const minute = Number(i[0] === '0' ? i[1] : i);
  const second = Number(s[0] === '0' ? s[1] : s);
  return datetime(year, month, day, hour, minute, second);
};

interface TestRecurring {
  (m: string, testObj: unknown, expectedDates: Date | Date[]): void;
  only: (...args: unknown[]) => void;
  skip: (...args: unknown[]) => void;
}

interface TestObj {
  rrule: RRule;
  method: 'all' | 'between' | 'before' | 'after';
  args: unknown[];
}

export const testRecurring = ((
  msg: string,
  testObj: TestObj | RRule | (() => TestObj),
  expectedDates: Date | Date[],
  itFunc: jest.Func = it,
) => {
  let rule: RRuleBase;
  let method: 'all' | 'before' | 'between' | 'after';
  let args: unknown[];

  if (typeof testObj === 'function') {
    testObj = testObj();
  }

  if (testObj instanceof RRuleBase) {
    rule = testObj;
    method = 'all';
    args = [];
  } else {
    rule = testObj.rrule;
    method = testObj.method;
    args = testObj.args ?? [];
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
      ']';
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    msg = `${msg} ${rule.toString()}`;
  }

  itFunc(msg, () => {
    let time = Date.now();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    let actualDates = rule[method](...args);
    time = Date.now() - time;

    const maxTestDuration = 200;
    expect(time).toBeLessThan(maxTestDuration);

    if (!Array.isArray(actualDates)) actualDates = [actualDates];
    if (!Array.isArray(expectedDates)) expectedDates = [expectedDates];

    assertDatesEqual(actualDates, expectedDates);

    // Additional tests using the expected dates
    // ==========================================================

    if (TEST_CTX.ALSO_TESTSUBSECOND_PRECISION) {
      expect(actualDates.map(extractTime)).toEqual(
        expectedDates.map(extractTime),
      );
    }

    if (TEST_CTX.ALSO_TESTSTRING_FUNCTIONS) {
      // Test toString()/fromString()
      const str = rule.toString();
      const rrule2 = RRule.fromString(str);
      const string2 = rrule2.toString();
      expect(str).toBe(string2);
      if (method === 'all') {
        assertDatesEqual(rrule2.all(), expectedDates);
      }
    }

    if (
      TEST_CTX.ALSO_TESTNLP_FUNCTIONS &&
      rule.isFullyConvertibleToText &&
      rule.isFullyConvertibleToText()
    ) {
      // Test fromText()/toText().
      const str = rule.toString();
      const text = rule.toText();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const rrule2 = RRule.fromText(text, rule.options.dtstart);
      const text2 = rrule2.toText();
      expect(text2).toBe(text);

      // Test fromText()/toString().
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const rrule3 = RRule.fromText(text, rule.options.dtstart);
      expect(rrule3.toString()).toBe(str);
    }

    if (method === 'all' && TEST_CTX.ALSO_TESTBEFORE_AFTER_BETWEEN) {
      // Test before, after, and between - use the expected dates.
      // create a clean copy of the rrule object to bypass caching
      rule = rule.clone();

      if (expectedDates.length > 2) {
        // Test between()
        assertDatesEqual(
          rule.between(
            expectedDates[0],
            expectedDates[expectedDates.length - 1],
            true,
          ),
          expectedDates,
        );

        assertDatesEqual(
          rule.between(
            expectedDates[0],
            expectedDates[expectedDates.length - 1],
            false,
          ),
          expectedDates.slice(1, expectedDates.length - 1),
        );
      }

      if (expectedDates.length > 1) {
        let date: Date;
        let next: Date | undefined;
        let prev: Date | undefined;
        for (let i = 0; i < expectedDates.length; i++) {
          date = expectedDates[i];
          next = expectedDates[i + 1];
          prev = expectedDates[i - 1];

          // Test after() and before() with inc=true.
          assertDatesEqual(rule.after(date, true), date);
          assertDatesEqual(rule.before(date, true), date);

          // Test after() and before() with inc=false.
          next && assertDatesEqual(rule.after(date, false), next);
          prev && assertDatesEqual(rule.before(date, false), prev);
        }
      }
    }
  });
}) as TestRecurring;

testRecurring.only = (...args) => {
  testRecurring.apply(it, [...args, it.only]);
};

testRecurring.skip = ([description]: [string]) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function, no-empty-function
  it.skip(description, () => {});
};

export function expectedDate(
  startDate: Date,
  _currentLocalDate: Date,
  targetZone: string,
): Date {
  return dateInTimeZone(startDate, targetZone);
}
