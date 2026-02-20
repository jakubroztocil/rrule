import { Cache } from '../src/cache';
import type { IterArgs } from '../src/iterresult';

const dates = [
  new Date('2021-01-01T00:00:00.000+00:00'),
  new Date('2021-01-02T00:00:00.000+00:00'),
  new Date('2021-01-03T00:00:00.000+00:00'),
  new Date('2021-01-04T00:00:00.000+00:00'),
  new Date('2021-01-05T00:00:00.000+00:00'),
  new Date('2021-01-06T00:00:00.000+00:00'),
  new Date('2021-01-07T00:00:00.000+00:00'),
];

describe('Cache', () => {
  it('returns false for an empty cache', () => {
    const cache = new Cache();
    const args: Partial<IterArgs> = {
      after: new Date('2021-01-01T00:00:00.000+00:00'),
      before: new Date('2021-01-08T00:00:00.000+00:00'),
      inc: true,
    };

    expect(cache._cacheGet('between', args)).toBe(false);
  });

  it('returns an empty array for a cached but empty set', () => {
    const cache = new Cache();
    const args: Partial<IterArgs> = {
      after: new Date('2021-01-01T00:00:00.000+00:00'),
      before: new Date('2021-01-08T00:00:00.000+00:00'),
      inc: true,
    };

    cache._cacheAdd('between', [], args);

    expect(cache._cacheGet('between', args)).toEqual([]);
  });

  it('returns cached entries if the "what" and the args both match', () => {
    const cache = new Cache();
    const args: Partial<IterArgs> = {
      after: new Date('2021-01-01T00:00:00.000+00:00'),
      before: new Date('2021-01-08T00:00:00.000+00:00'),
      inc: true,
    };

    cache._cacheAdd('between', dates, args);

    expect(cache._cacheGet('between', args)).toEqual(dates);
  });

  it('does not return cached entries if the "what" matches but the args do not', () => {
    const cache = new Cache();
    const args: Partial<IterArgs> = {
      after: new Date('2021-01-01T00:00:00.000+00:00'),
      before: new Date('2021-01-08T00:00:00.000+00:00'),
      inc: true,
    };

    cache._cacheAdd('between', dates, args);

    expect(
      cache._cacheGet('between', {
        ...args,
        /** 1ms later than the args used for the insert */
        after: new Date('2021-01-01T00:00:00.001+00:00'),
      }),
    ).toBe(false);
  });

  it('does not return cached entries if args match but the "what" does not', () => {
    const cache = new Cache();
    const args: Partial<IterArgs> = {
      after: new Date('2021-01-01T00:00:00.000+00:00'),
      before: new Date('2021-01-08T00:00:00.000+00:00'),
      inc: true,
    };

    cache._cacheAdd('between', dates, args);

    expect(cache._cacheGet('after', args)).toBe(false);
  });

  it('reuses dates cached for the "all" method when querying using another method', () => {
    const cache = new Cache();
    const args: Partial<IterArgs> = {
      after: new Date('2021-01-04T00:00:00.000+00:00'),
      before: new Date('2021-01-06T00:00:00.000+00:00'),
      inc: true,
    };

    cache._cacheAdd('all', dates);

    expect(cache._cacheGet('between', args)).toEqual([
      new Date('2021-01-04T00:00:00.000+00:00'),
      new Date('2021-01-05T00:00:00.000+00:00'),
      new Date('2021-01-06T00:00:00.000+00:00'),
    ]);
  });
});
