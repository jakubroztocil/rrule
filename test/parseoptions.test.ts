import { RRule } from '../src';
import { parseOptions } from '../src/parseoptions';

describe('TZID', () => {
  it('leaves null when null', () => {
    const options = parseOptions({ tzid: null });
    expect(options.parsedOptions.tzid).toBeNull();
  });

  it('uses a string when passed in', () => {
    const options = parseOptions({ tzid: 'America/Los_Angeles' });
    expect(options.parsedOptions.tzid).toBe('America/Los_Angeles');
  });
});

describe('byweekday', () => {
  it('works with a single numeric day', () => {
    const options = parseOptions({ byweekday: 1 });
    expect(options.parsedOptions.byweekday).toEqual([1]);
  });

  it('works with a single Weekday day', () => {
    const options = parseOptions({ byweekday: RRule.TU });
    expect(options.parsedOptions.byweekday).toEqual([1]);
  });

  it('works with a single string day', () => {
    const options = parseOptions({ byweekday: 'TU' });
    expect(options.parsedOptions.byweekday).toEqual([1]);
  });

  it('works with a multiple numeric days', () => {
    const options = parseOptions({ byweekday: [1, 2] });
    expect(options.parsedOptions.byweekday).toEqual([1, 2]);
  });

  it('works with a multiple Weekday days', () => {
    const options = parseOptions({ byweekday: [RRule.TU, RRule.WE] });
    expect(options.parsedOptions.byweekday).toEqual([1, 2]);
  });

  it('works with a multiple string days', () => {
    const options = parseOptions({ byweekday: ['TU', 'WE'] });
    expect(options.parsedOptions.byweekday).toEqual([1, 2]);
  });
});
