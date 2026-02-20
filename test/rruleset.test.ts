import { reset as resetMockDate, set as setMockDate } from 'mockdate';
import { Frequency, RRule, RRuleSet, rrulestr } from '../src';
import {
  datetime,
  expectedDate,
  parse,
  TEST_CTX,
  testRecurring,
} from './lib/utils';

describe('RRuleSet', () => {
  beforeAll(() => {
    // Enable additional toString() / fromString() tests
    // for each testRecurring().
    TEST_CTX.ALSO_TESTSTRING_FUNCTIONS = false;

    // Enable additional toText() / fromText() tests
    // for each testRecurring().
    // Many of the tests fail because the conversion is only approximate,
    // but it gives an idea about how well or bad it converts.
    TEST_CTX.ALSO_TESTNLP_FUNCTIONS = false;

    // Thorough after()/before()/between() tests.
    // NOTE: can take a longer time.
    TEST_CTX.ALSO_TESTBEFORE_AFTER_BETWEEN = false;

    TEST_CTX.ALSO_TESTSUBSECOND_PRECISION = false;
  });

  testRecurring('testSet', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 2,
        byweekday: RRule.TU,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 1,
        byweekday: RRule.TH,
        dtstart: parse('19970902T090000'),
      }),
    );
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 4, 9, 0),
    datetime(1997, 9, 9, 9, 0),
  ]);

  testRecurring('testSetDate', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 1,
        byweekday: RRule.TU,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.rdate(datetime(1997, 9, 4, 9));
    set.rdate(datetime(1997, 9, 9, 9));
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 4, 9, 0),
    datetime(1997, 9, 9, 9, 0),
  ]);

  testRecurring('testSetExRule', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 6,
        byweekday: [RRule.TU, RRule.TH],
        dtstart: parse('19970902T090000'),
      }),
    );
    set.exrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 3,
        byweekday: RRule.TH,
        dtstart: parse('19970902T090000'),
      }),
    );
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 9, 9, 0),
    datetime(1997, 9, 16, 9, 0),
  ]);

  testRecurring('testSetExDate', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 6,
        byweekday: [RRule.TU, RRule.TH],
        dtstart: parse('19970902T090000'),
      }),
    );
    set.exdate(datetime(1997, 9, 4, 9));
    set.exdate(datetime(1997, 9, 11, 9));
    set.exdate(datetime(1997, 9, 18, 9));
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 9, 9, 0),
    datetime(1997, 9, 16, 9, 0),
  ]);

  testRecurring('testSetExDateRevOrder', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.MONTHLY,
        count: 5,
        bymonthday: 10,
        dtstart: parse('20040101T090000'),
      }),
    );
    set.exdate(datetime(2004, 4, 10, 9, 0));
    set.exdate(datetime(2004, 2, 10, 9, 0));
    return set;
  }, [
    datetime(2004, 1, 10, 9, 0),
    datetime(2004, 3, 10, 9, 0),
    datetime(2004, 5, 10, 9, 0),
  ]);

  testRecurring('testSetDateAndExDate', () => {
    const set = new RRuleSet();

    set.rdate(datetime(1997, 9, 2, 9));
    set.rdate(datetime(1997, 9, 4, 9));
    set.rdate(datetime(1997, 9, 9, 9));
    set.rdate(datetime(1997, 9, 11, 9));
    set.rdate(datetime(1997, 9, 16, 9));
    set.rdate(datetime(1997, 9, 18, 9));
    set.exdate(datetime(1997, 9, 4, 9));
    set.exdate(datetime(1997, 9, 11, 9));
    set.exdate(datetime(1997, 9, 18, 9));
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 9, 9, 0),
    datetime(1997, 9, 16, 9, 0),
  ]);

  testRecurring('testSetDateAndExRule', () => {
    const set = new RRuleSet();

    set.rdate(datetime(1997, 9, 2, 9));
    set.rdate(datetime(1997, 9, 4, 9));
    set.rdate(datetime(1997, 9, 9, 9));
    set.rdate(datetime(1997, 9, 11, 9));
    set.rdate(datetime(1997, 9, 16, 9));
    set.rdate(datetime(1997, 9, 18, 9));
    set.exrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 3,
        byweekday: RRule.TH,
        dtstart: parse('19970902T090000'),
      }),
    );
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 9, 9, 0),
    datetime(1997, 9, 16, 9, 0),
  ]);

  testRecurring('testSetCachePre', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 2,
        byweekday: RRule.TU,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 1,
        byweekday: RRule.TH,
        dtstart: parse('19970902T090000'),
      }),
    );
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 4, 9, 0),
    datetime(1997, 9, 9, 9, 0),
  ]);

  testRecurring('testSetCachePost', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 2,
        byweekday: RRule.TU,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 1,
        byweekday: RRule.TH,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.all();
    return set;
  }, [
    datetime(1997, 9, 2, 9, 0),
    datetime(1997, 9, 4, 9, 0),
    datetime(1997, 9, 9, 9, 0),
  ]);

  testRecurring('testSetInfiniteAll', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.exrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 10,
        dtstart: parse('19970902T090000'),
      }),
    );

    return {
      rrule: set,
      method: 'all',
      args: [(_: unknown, count: number) => count < 3],
    };
  }, [
    datetime(2007, 9, 2, 9, 0),
    datetime(2008, 9, 2, 9, 0),
    datetime(2009, 9, 2, 9, 0),
  ]);

  testRecurring('testSetInfiniteBetween', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.exrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 10,
        dtstart: parse('19970902T090000'),
      }),
    );
    return {
      rrule: set,
      method: 'between',
      args: [datetime(2000, 9, 2, 9, 0), datetime(2010, 9, 2, 9, 0)],
    };
  }, [
    datetime(2007, 9, 2, 9, 0),
    datetime(2008, 9, 2, 9, 0),
    datetime(2009, 9, 2, 9, 0),
  ]);

  testRecurring('testSetInfiniteBefore', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.exrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 10,
        dtstart: parse('19970902T090000'),
      }),
    );
    return {
      rrule: set,
      method: 'before',
      args: [datetime(2015, 9, 2, 9, 0), false],
    };
  }, [datetime(2014, 9, 2, 9, 0)]);

  testRecurring('testSetInfiniteAfter', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        dtstart: parse('19970902T090000'),
      }),
    );
    set.exrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 10,
        dtstart: parse('19970902T090000'),
      }),
    );
    return {
      rrule: set,
      method: 'after',
      args: [datetime(2000, 9, 2, 9, 0), false],
    };
  }, [datetime(2007, 9, 2, 9, 0)]);

  testRecurring('testBefore70', () => {
    const set = new RRuleSet();

    set.rrule(
      new RRule({
        freq: RRule.YEARLY,
        count: 2,
        dtstart: parse('19600101T090000'),
      }),
    );
    return {
      rrule: set,
      method: 'all',
    };
  }, [datetime(1960, 1, 1, 9, 0), datetime(1961, 1, 1, 9, 0)]);

  describe('valueOf', () => {
    it('generates rrule strings correctly', () => {
      const set = new RRuleSet();

      set.rrule(
        new RRule({
          freq: RRule.YEARLY,
          count: 2,
          dtstart: parse('19600101T090000'),
        }),
      );

      expect(set.valueOf()).toEqual([
        'DTSTART:19600101T090000Z',
        'RRULE:FREQ=YEARLY;COUNT=2',
      ]);
    });

    it('generates multiline rules', () => {
      const set = new RRuleSet();

      set.rrule(
        new RRule({
          freq: RRule.YEARLY,
          count: 2,
          dtstart: parse('19600101T090000'),
        }),
      );

      set.rrule(
        new RRule({
          freq: RRule.WEEKLY,
          count: 3,
        }),
      );

      expect(set.valueOf()).toEqual([
        'DTSTART:19600101T090000Z',
        'RRULE:FREQ=YEARLY;COUNT=2',
        'RRULE:FREQ=WEEKLY;COUNT=3',
      ]);
    });

    it('generates rules with tzid', () => {
      const set = new RRuleSet();

      set.rrule(
        new RRule({
          freq: RRule.YEARLY,
          count: 2,
          dtstart: parse('19600101T090000'),
          tzid: 'America/New_York',
        }),
      );

      set.rrule(
        new RRule({
          freq: RRule.WEEKLY,
          count: 3,
        }),
      );

      expect(set.valueOf()).toEqual([
        'DTSTART;TZID=America/New_York:19600101T090000',
        'RRULE:FREQ=YEARLY;COUNT=2',
        'RRULE:FREQ=WEEKLY;COUNT=3',
      ]);
    });

    it('generates a value with RDATE with tzid', () => {
      const set = new RRuleSet();

      set.rrule(
        new RRule({
          freq: RRule.YEARLY,
          count: 2,
          dtstart: parse('19600101T090000'),
          tzid: 'America/New_York',
        }),
      );

      set.rdate(parse('19610201T090000'));

      set.rdate(parse('19610301T090000'));

      expect(set.valueOf()).toEqual([
        'DTSTART;TZID=America/New_York:19600101T090000',
        'RRULE:FREQ=YEARLY;COUNT=2',
        'RDATE;TZID=America/New_York:19610201T090000,19610301T090000',
      ]);
    });

    it('generates a string with RDATE with TZID when no RRULE is present', () => {
      const set = new RRuleSet();

      set.tzid('America/New_York');

      set.rdate(parse('19610201T090000'));

      set.rdate(parse('19610301T090000'));

      expect(set.toString()).toEqual(
        'RDATE;TZID=America/New_York:19610201T090000,19610301T090000',
      );
    });

    it('generates a string with RDATE in UTC when no RRULE is present', () => {
      const set = new RRuleSet();

      set.tzid('UTC');

      set.rdate(parse('19610201T090000'));

      set.rdate(parse('19610301T090000'));

      expect(set.toString()).toEqual('RDATE:19610201T090000Z,19610301T090000Z');
    });

    it('parses RDATE strings without an RRULE', () => {
      const set = rrulestr(
        'RDATE;TZID=America/New_York:19610201T090000,19610301T090000',
      ) as RRuleSet;
      expect(set).toBeInstanceOf(RRuleSet);
      expect(set.tzid()).toBe('America/New_York');
    });

    it('generates EXDATE with tzid', () => {
      const set = new RRuleSet();

      set.rrule(
        new RRule({
          freq: RRule.YEARLY,
          count: 2,
          dtstart: parse('19600101T090000'),
          tzid: 'America/New_York',
        }),
      );

      set.exdate(parse('19610201T090000'));

      set.exdate(parse('19610301T090000'));

      expect(set.valueOf()).toEqual([
        'DTSTART;TZID=America/New_York:19600101T090000',
        'RRULE:FREQ=YEARLY;COUNT=2',
        'EXDATE;TZID=America/New_York:19610201T090000,19610301T090000',
      ]);
    });

    it('generates correcty zoned recurrences when a tzid is present', () => {
      const targetZone = 'America/New_York';
      const currentLocalDate = new Date(2000, 1, 6, 11, 0, 0);
      setMockDate(currentLocalDate);

      const set = new RRuleSet();

      set.rrule(
        new RRule({
          freq: RRule.YEARLY,
          count: 4,
          dtstart: datetime(2000, 1, 1, 9, 0, 0),
          tzid: targetZone,
        }),
      );

      set.exdate(datetime(2001, 1, 1, 9, 0, 0));

      set.rdate(datetime(2002, 3, 1, 9, 0, 0));

      expect(set.all()).toEqual([
        expectedDate(
          datetime(2000, 1, 1, 9, 0, 0),
          currentLocalDate,
          targetZone,
        ),
        expectedDate(
          datetime(2002, 1, 1, 9, 0, 0),
          currentLocalDate,
          targetZone,
        ),
        expectedDate(
          datetime(2002, 3, 1, 9, 0, 0),
          currentLocalDate,
          targetZone,
        ),
        expectedDate(
          datetime(2003, 1, 1, 9, 0, 0),
          currentLocalDate,
          targetZone,
        ),
      ]);

      resetMockDate();
    });

    it('permits only an rdate with a timezone', () => {
      const set = new RRuleSet();
      set.tzid('America/Los_Angeles');
      set.rdate(datetime(2010, 11, 10, 10, 0, 0));

      expect(set.valueOf()).toEqual([
        'RDATE;TZID=America/Los_Angeles:20101110T100000',
      ]);
      expect(set.toString()).toBe(
        'RDATE;TZID=America/Los_Angeles:20101110T100000',
      );

      const set2 = rrulestr(set.toString());
      expect(set2.toString()).toBe(
        'RDATE;TZID=America/Los_Angeles:20101110T100000',
      );
    });

    it('generates correcty zoned recurrences when a tzid is present but no rrule is present', () => {
      const targetZone = 'America/New_York';
      const currentLocalDate = new Date(2000, 1, 6, 11, 0, 0);
      setMockDate(currentLocalDate);

      const set = new RRuleSet();

      set.tzid(targetZone);

      set.rdate(new Date(Date.parse('2002-03-01T09:00:00')));

      expect(set.all()).toEqual([
        expectedDate(
          new Date(Date.parse('2002-03-01T09:00:00')),
          currentLocalDate,
          targetZone,
        ),
      ]);

      resetMockDate();
    });
  });

  describe('with end date', () => {
    let cursor: Date;

    beforeEach(() => {
      cursor = datetime(2017, 12, 25, 16, 0, 0);
    });

    it('updates the ruleset to exclude recurrence date', () => {
      const legacy = ['RRULE:DTSTART=19990104T110000Z;FREQ=DAILY;INTERVAL=1'];
      const repeat = [
        'DTSTART:19990104T110000Z',
        'RRULE:FREQ=DAILY;INTERVAL=1',
      ];

      const recurrenceDate = datetime(2017, 8, 21, 16, 0, 0);

      expectRecurrence([repeat, legacy]).toAmendExdate(recurrenceDate, [
        'DTSTART:19990104T110000Z',
        'RRULE:FREQ=DAILY;INTERVAL=1',
        'EXDATE:20170821T160000Z',
      ]);
    });

    it('updates the ruleset to exclude recurrence rule', () => {
      const legacy = ['RRULE:DTSTART=19990104T110000Z;FREQ=DAILY;INTERVAL=1'];
      const repeat = [
        'DTSTART:19990104T110000Z',
        'RRULE:FREQ=DAILY;INTERVAL=1',
      ];

      const exrule = new RRule({
        dtstart: datetime(1999, 1, 4, 11, 0, 0),
        freq: Frequency.WEEKLY,
        interval: 2,
        count: 1,
      });

      expectRecurrence([repeat, legacy]).toAmendExrule(exrule, [
        'DTSTART:19990104T110000Z',
        'RRULE:FREQ=DAILY;INTERVAL=1',
        'EXRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=1',
      ]);
    });

    it('updates a never-ending recurrence with an end date', () => {
      const legacy = ['RRULE:DTSTART=20171201T080000Z;FREQ=WEEKLY'];
      const original = ['DTSTART:20171201T080000Z', 'RRULE:FREQ=WEEKLY'];

      expectRecurrence([original, legacy]).toBeUpdatedWithEndDate(
        [
          'DTSTART:20171201T080000Z',
          'RRULE:FREQ=WEEKLY;UNTIL=20171224T235959Z',
        ].join('\n'),
      );
    });

    it('replaces an existing end date with a new one', () => {
      const legacy = [
        'RRULE:DTSTART=20171201T080000Z;FREQ=WEEKLY;UNTIL=20180301T080000Z',
      ];
      const original = [
        'DTSTART:20171201T080000Z',
        'RRULE:FREQ=WEEKLY;UNTIL=20180301T080000Z',
      ];

      expectRecurrence([original, legacy]).toBeUpdatedWithEndDate(
        [
          'DTSTART:20171201T080000Z',
          'RRULE:FREQ=WEEKLY;UNTIL=20171224T235959Z',
        ].join('\n'),
      );
    });

    it('handles rule in a timezone', () => {
      const legacy = [
        'RRULE:DTSTART;TZID=America/New_York:20171201T080000;FREQ=WEEKLY',
      ];
      const original = [
        'DTSTART;TZID=America/New_York:20171201T080000',
        'RRULE:FREQ=WEEKLY',
      ];

      expectRecurrence([original, legacy]).toBeUpdatedWithEndDate(
        [
          'DTSTART;TZID=America/New_York:20171201T080000',
          'RRULE:FREQ=WEEKLY;UNTIL=20171224T235959',
        ].join('\n'),
      );
    });

    const updateWithEndDate = (
      recurrence: string[],
      updatedCursor: Date,
    ): string => {
      const oneDay = 24 * 60 * 60 * 1000;
      const oneDayEarlier = new Date(updatedCursor.getTime() - oneDay);
      const newEndDate = new Date(
        Date.UTC(
          oneDayEarlier.getUTCFullYear(),
          oneDayEarlier.getUTCMonth(),
          oneDayEarlier.getUTCDate(),
          23,
          59,
          59,
        ),
      );

      const rrule = rrulestr(recurrence.join('\n'));

      const newRuleSet = new RRuleSet();
      const rule = new RRule({
        ...rrule.origOptions,
        until: newEndDate,
      });

      newRuleSet.rrule(rule);

      return newRuleSet.toString();
    };

    const amendRuleSetWithExceptionDate = (
      recurrence: string[],
      cursor: Date,
    ): string => {
      const ruleSet = rrulestr(recurrence.join('\n'), {
        forceset: true,
      }) as RRuleSet;
      ruleSet.exdate(cursor);
      return ruleSet.toString();
    };

    const amendRuleSetWithExceptionRule = (
      recurrence: string[],
      exrule: RRule,
    ): string => {
      const ruleSet = rrulestr(recurrence.join('\n'), {
        forceset: true,
      }) as RRuleSet;
      ruleSet.exrule(exrule);
      return ruleSet.toString();
    };

    function expectRecurrence(recurrences: string[][]) {
      return {
        toAmendExrule(excluded: RRule, expected: string[]) {
          recurrences.forEach((recurrence) => {
            const actual = amendRuleSetWithExceptionRule(recurrence, excluded);
            expect(actual).toBe(expected.join('\n'));
          });
        },
        toAmendExdate(excluded: Date, expected: string[]) {
          recurrences.forEach((recurrence) => {
            const actual = amendRuleSetWithExceptionDate(recurrence, excluded);
            expect(actual).toBe(expected.join('\n'));
          });
        },
        toBeUpdatedWithEndDate(expected: string) {
          recurrences.forEach((recurrence) => {
            const actual = updateWithEndDate(recurrence, cursor);
            expect(actual).toBe(expected);
          });
        },
      };
    }
  });

  it('throws a RangeError on an rruleset with invalid TZID and exdate', () => {
    const set = new RRuleSet();
    set.rrule(
      new RRule({
        count: 1,
        dtstart: parse('19970902T090000'),
        tzid: 'America/Unknown',
      }),
    );
    set.exdate(parse('19970902T090000'));

    expect(() => set.all().map(String)).toThrow(RangeError);
  });

  it('throws a TypeError if non-rrules are added via rrule or exrule', () => {
    const set = new RRuleSet();

    expect(() => set.rrule('foo' as unknown as RRule)).toThrow(TypeError);
    expect(() => set.exrule('foo' as unknown as RRule)).toThrow(TypeError);
  });

  it('throws a TypeError if non-dates are added via rdate or exdate', () => {
    const set = new RRuleSet();

    expect(() => set.rdate('foo' as unknown as Date)).toThrow(TypeError);
    expect(() => set.exdate('foo' as unknown as Date)).toThrow(TypeError);
  });

  describe('getters', () => {
    it('rrules()', () => {
      const set = new RRuleSet();
      const rrule = new RRule({
        freq: RRule.YEARLY,
        count: 2,
        dtstart: parse('19600101T090000'),
        tzid: 'America/New_York',
      });
      set.rrule(rrule);

      expect(set.rrules().map((e) => e.toString())).toEqual([rrule.toString()]);
    });

    it('exrules()', () => {
      const set = new RRuleSet();
      const rrule = new RRule({
        freq: RRule.YEARLY,
        count: 2,
        dtstart: parse('19600101T090000'),
        tzid: 'America/New_York',
      });
      set.exrule(rrule);

      expect(set.exrules().map((e) => e.toString())).toEqual([
        rrule.toString(),
      ]);
    });

    it('rdates()', () => {
      const set = new RRuleSet();
      const dt = parse('19610201T090000');
      set.rdate(dt);

      expect(set.rdates()).toEqual([dt]);
    });

    it('exdates()', () => {
      const set = new RRuleSet();
      const dt = parse('19610201T090000');
      set.exdate(dt);

      expect(set.exdates()).toEqual([dt]);
    });
  });
});
