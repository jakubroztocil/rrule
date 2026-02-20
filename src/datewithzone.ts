import { dateInTimeZone, timeToUntilString } from './dateutil';

export class DateWithZone {
  public date: Date;
  public tzid?: string | null;

  constructor(date: Date, tzid?: string | null) {
    if (Number.isNaN(date.getTime())) {
      throw new RangeError('Invalid date passed to DateWithZone');
    }
    this.date = date;
    this.tzid = tzid;
  }

  private get isUTC() {
    return !this.tzid || this.tzid.toUpperCase() === 'UTC';
  }

  public toString() {
    const datestr = timeToUntilString(this.date.getTime(), this.isUTC);
    if (!this.isUTC) {
      return `;TZID=${this.tzid}:${datestr}`;
    }

    return `:${datestr}`;
  }

  public getTime() {
    return this.date.getTime();
  }

  public rezonedDate() {
    if (this.isUTC) {
      return this.date;
    }

    return dateInTimeZone(this.date, this.tzid!);
  }
}
