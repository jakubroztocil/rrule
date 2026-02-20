import { datetime, untilStringToDate } from '../src/dateutil';

describe('untilStringToDate', () => {
  it('parses a date string', () => {
    const date = untilStringToDate('19970902T090000');
    expect(date.getTime()).toBe(datetime(1997, 9, 2, 9, 0, 0).getTime());
  });
});
