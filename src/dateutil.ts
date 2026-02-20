import type { Time } from './datetime';

type Datelike = Pick<Date, 'getTime'>;

export const datetime = (
  y: number,
  m: number,
  d: number,
  h = 0,
  i = 0,
  s = 0,
) => new Date(Date.UTC(y, m - 1, d, h, i, s));

/**
 * General date-related utilities.
 * Also handles several incompatibilities between JavaScript and Python
 *
 */
export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Number of milliseconds of one day
 */
export const ONE_DAY = 1000 * 60 * 60 * 24;

/**
 * @see: <http://docs.python.org/library/datetime.html#datetime.MAXYEAR>
 */
export const MAXYEAR = 9999;

/**
 * Python uses 1-Jan-1 as the base for calculating ordinals but we don't
 * want to confuse the JS engine with milliseconds > Number.MAX_NUMBER,
 * therefore we use 1-Jan-1970 instead
 */
export const ORDINAL_BASE = datetime(1970, 1, 1);

/**
 * Python: MO-SU: 0 - 6
 * JS: SU-SAT 0 - 6
 */
export const PY_WEEKDAYS = [6, 0, 1, 2, 3, 4, 5];

/**
 * py_date.timetuple()[7]
 */
export const getYearDay = (date: Date) => {
  const dateNoTime = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return (
    Math.ceil(
      (dateNoTime.valueOf() - new Date(date.getUTCFullYear(), 0, 1).valueOf()) /
        ONE_DAY,
    ) + 1
  );
};

export const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const isDate = (value: unknown): value is Date => value instanceof Date;

export const isValidDate = (value: unknown): value is Date =>
  isDate(value) && !Number.isNaN(value.getTime());

/**
 * @return {Number} the date's timezone offset in ms
 */
export const tzOffset = (date: Date) => date.getTimezoneOffset() * 60 * 1000;

/**
 * @see: <http://www.mcfedries.com/JavaScript/DaysBetween.asp>
 */
export const daysBetween = (date1: Date, date2: Date) => {
  // The number of milliseconds in one day
  // Convert both dates to milliseconds
  const date1ms = date1.getTime();
  const date2ms = date2.getTime();

  // Calculate the difference in milliseconds
  const differencems = date1ms - date2ms;

  // Convert back to days and return
  return Math.round(differencems / ONE_DAY);
};

/**
 * @see: <http://docs.python.org/library/datetime.html#datetime.date.toordinal>
 */
export const toOrdinal = (date: Date) => daysBetween(date, ORDINAL_BASE);

/**
 * @see - <http://docs.python.org/library/datetime.html#datetime.date.fromordinal>
 */
export const fromOrdinal = (ordinal: number) =>
  new Date(ORDINAL_BASE.getTime() + ordinal * ONE_DAY);

export const getMonthDays = (date: Date): number => {
  const month = date.getUTCMonth();
  return month === 1 && isLeapYear(date.getUTCFullYear())
    ? 29
    : MONTH_DAYS[month]!;
};

/**
 * @return {Number} python-like weekday
 */
export const getWeekday = (date: Date): number =>
  PY_WEEKDAYS[date.getUTCDay()]!;

/**
 * @see: <http://docs.python.org/library/calendar.html#calendar.monthrange>
 */
export const monthRange = (year: number, month: number): [number, number] => {
  const date = datetime(year, month + 1, 1);
  return [getWeekday(date), getMonthDays(date)];
};

/**
 * @see: <http://docs.python.org/library/datetime.html#datetime.datetime.combine>
 */
export const combine = (date: Date, time: Date | Time) => {
  time = time || date;
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    ),
  );
};

export const clone = (date: Date | Time) => {
  return new Date(date.getTime());
};

export const cloneDates = (dates: Date[] | Time[]) => {
  const clones = [];
  for (const date of dates) {
    clones.push(clone(date));
  }
  return clones;
};

/**
 * Sorts an array of Date or Time objects
 */
export const sort = <T extends Datelike>(dates: T[]) => {
  dates.sort((a, b) => a.getTime() - b.getTime());
};

export const timeToUntilString = (time: number, utc = true) => {
  const date = new Date(time);
  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
    'T',
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
    String(date.getUTCSeconds()).padStart(2, '0'),
    utc ? 'Z' : '',
  ].join('');
};

export const untilStringToDate = (until: string) => {
  const re = /^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/;
  const bits = re.exec(until);

  if (!bits) throw new Error(`Invalid UNTIL value: ${until}`);

  return new Date(
    Date.UTC(
      parseInt(bits[1]!, 10),
      parseInt(bits[2]!, 10) - 1,
      parseInt(bits[3]!, 10),
      parseInt(bits[5]!, 10) || 0,
      parseInt(bits[6]!, 10) || 0,
      parseInt(bits[7]!, 10) || 0,
    ),
  );
};

const dateTZtoISO8601 = (date: Date, timeZone: string) => {
  // date format for sv-SE is almost ISO8601
  const dateStr = date.toLocaleString('sv-SE', { timeZone });
  // '2023-02-07 10:41:36'
  return `${dateStr.replace(' ', 'T')}Z`;
};

export const dateInTimeZone = (date: Date, timeZone: string) => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Date constructor can only reliably parse dates in ISO8601 format
  const dateInLocalTZ = new Date(dateTZtoISO8601(date, localTimeZone));
  const dateInTargetTZ = new Date(dateTZtoISO8601(date, timeZone ?? 'UTC'));
  const tzOffset = dateInTargetTZ.getTime() - dateInLocalTZ.getTime();

  return new Date(date.getTime() - tzOffset);
};
