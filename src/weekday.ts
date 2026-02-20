// =============================================================================
// Weekday
// =============================================================================

export type WeekdayStr = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
export const ALL_WEEKDAYS: WeekdayStr[] = [
  'MO',
  'TU',
  'WE',
  'TH',
  'FR',
  'SA',
  'SU',
];

export class Weekday {
  public readonly weekday: number;
  public readonly n?: number;

  constructor(weekday: number, n?: number) {
    if (n === 0) throw new Error("Can't create weekday with n == 0");
    this.weekday = weekday;
    this.n = n;
  }

  static fromStr(str: WeekdayStr): Weekday {
    return new Weekday(ALL_WEEKDAYS.indexOf(str));
  }

  // __call__ - Cannot call the object directly, do it through
  // e.g. RRule.TH.nth(-1) instead,
  nth(n: number) {
    return this.n === n ? this : new Weekday(this.weekday, n);
  }

  // __eq__
  equals(other: Weekday) {
    return this.weekday === other.weekday && this.n === other.n;
  }

  // __repr__
  toString() {
    let s: string = ALL_WEEKDAYS[this.weekday]!;
    if (this.n) s = (this.n > 0 ? '+' : '') + String(this.n) + s;
    return s;
  }

  getJsWeekday() {
    return this.weekday === 6 ? 0 : this.weekday + 1;
  }
}
