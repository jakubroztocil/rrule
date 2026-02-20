import { reset as resetMockDate, set as setMockDate } from 'mockdate';
import { DateWithZone } from '../src/datewithzone';
import { datetime, expectedDate } from './lib/utils';

describe('toString', () => {
  it('returns the date when no tzid is present', () => {
    const dt = new DateWithZone(datetime(2010, 10, 5, 11, 0, 0));
    expect(dt.toString()).toBe(':20101005T110000Z');

    const dt2 = new DateWithZone(datetime(2010, 10, 5, 11, 0, 0), 'UTC');
    expect(dt2.toString()).toBe(':20101005T110000Z');
  });

  it('returns the date with tzid when present', () => {
    const dt = new DateWithZone(datetime(2010, 10, 5, 11, 0, 0), 'Asia/Tokyo');
    expect(dt.toString()).toBe(';TZID=Asia/Tokyo:20101005T110000');
  });
});

it('returns the time of the date', () => {
  const d = datetime(2010, 10, 5, 11, 0, 0);
  const dt = new DateWithZone(d);
  expect(dt.getTime()).toBe(d.getTime());
});

it('rejects invalid dates', () => {
  expect(() => new DateWithZone(new Date(undefined))).toThrow(
    'Invalid date passed to DateWithZone',
  );
});

describe('rezonedDate', () => {
  it('returns the original date when no zone is given', () => {
    const d = datetime(2010, 10, 5, 11, 0, 0);
    const dt = new DateWithZone(d);
    expect(dt.rezonedDate()).toEqual(d);
  });

  it('returns the date in the correct zone when given', () => {
    const targetZone = 'America/New_York';
    const currentLocalDate = new Date(2000, 1, 6, 1, 0, 0);
    setMockDate(currentLocalDate);

    const d = new Date(Date.parse('2010-10-05T11:00:00'));
    const dt = new DateWithZone(d, targetZone);
    expect(dt.rezonedDate()).toEqual(
      expectedDate(
        new Date(Date.parse('2010-10-05T11:00:00')),
        currentLocalDate,
        targetZone,
      ),
    );

    resetMockDate();
  });
});
