import { RRule } from '../rrule';
import type { ByWeekday, Options } from '../types';
import type { WeekdayStr } from '../weekday';
import ENGLISH, { type Language } from './i18n';

// =============================================================================
// Parser
// =============================================================================

class Parser {
  private readonly rules: { [k: string]: RegExp };
  public text!: string;
  public symbol!: string | null;
  public value!: RegExpExecArray | null;
  private done = true;

  constructor(rules: { [k: string]: RegExp }) {
    this.rules = rules;
  }

  start(text: string) {
    this.text = text;
    this.done = false;
    return this.nextSymbol();
  }

  isDone() {
    return this.done && this.symbol === null;
  }

  nextSymbol() {
    let best: RegExpExecArray | null;
    let bestSymbol: string | null = null;

    this.symbol = null;
    this.value = null;
    do {
      if (this.done) return false;

      let rule: RegExp;
      best = null;
      for (const name in this.rules) {
        rule = this.rules[name]!;
        const match = rule.exec(this.text);
        if (match) {
          if (best === null || match[0].length > best[0].length) {
            best = match;
            bestSymbol = name;
          }
        }
      }

      if (best != null) {
        this.text = this.text.substr(best[0].length);

        if (this.text === '') this.done = true;
      }

      if (best == null) {
        this.done = true;
        this.symbol = null;
        this.value = null;
        return;
      }
    } while (bestSymbol === 'SKIP');

    this.symbol = bestSymbol;
    this.value = best;
    return true;
  }

  accept(name: string) {
    if (this.symbol === name) {
      if (this.value) {
        const v = this.value;
        this.nextSymbol();
        return v;
      }

      this.nextSymbol();
      return true;
    }

    return false;
  }

  acceptNumber() {
    return this.accept('number') as RegExpExecArray;
  }

  expect(name: string) {
    if (this.accept(name)) return true;

    throw new Error(`expected ${name} but found ${this.symbol}`);
  }
}

export default function parseText(text: string, language: Language = ENGLISH) {
  const options: Partial<Options> = {};
  const ttr = new Parser(language.tokens);

  if (!ttr.start(text)) return null;

  S();
  return options;

  function S() {
    // every [n]
    ttr.expect('every');
    const n = ttr.acceptNumber();
    if (n) options.interval = parseInt(n[0], 10);
    if (ttr.isDone()) throw new Error('Unexpected end');

    switch (ttr.symbol) {
      case 'day(s)':
        options.freq = RRule.DAILY;
        if (ttr.nextSymbol()) {
          AT();
          F();
        }
        break;

      // FIXME Note: every 2 weekdays != every two weeks on weekdays.
      // DAILY on weekdays is not a valid rule
      case 'weekday(s)':
        options.freq = RRule.WEEKLY;
        options.byweekday = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
        ttr.nextSymbol();
        AT();
        F();
        break;

      case 'week(s)':
        options.freq = RRule.WEEKLY;
        if (ttr.nextSymbol()) {
          ON();
          AT();
          F();
        }
        break;

      case 'hour(s)':
        options.freq = RRule.HOURLY;
        if (ttr.nextSymbol()) {
          ON();
          F();
        }
        break;

      case 'minute(s)':
        options.freq = RRule.MINUTELY;
        if (ttr.nextSymbol()) {
          ON();
          F();
        }
        break;

      case 'month(s)':
        options.freq = RRule.MONTHLY;
        if (ttr.nextSymbol()) {
          ON();
          F();
        }
        break;

      case 'year(s)':
        options.freq = RRule.YEARLY;
        if (ttr.nextSymbol()) {
          ON();
          F();
        }
        break;

      case 'monday':
      case 'tuesday':
      case 'wednesday':
      case 'thursday':
      case 'friday':
      case 'saturday':
      case 'sunday': {
        options.freq = RRule.WEEKLY;
        const key: WeekdayStr = ttr.symbol
          .substr(0, 2)
          .toUpperCase() as WeekdayStr;
        options.byweekday = [RRule[key]];

        if (!ttr.nextSymbol()) return;

        // TODO check for duplicates
        while (ttr.accept('comma')) {
          if (ttr.isDone()) throw new Error('Unexpected end');

          const wkd = decodeWKD() as keyof typeof RRule;
          if (!wkd) {
            throw new Error(
              `Unexpected symbol ${ttr.symbol}, expected weekday`,
            );
          }

          options.byweekday.push(RRule[wkd] as ByWeekday);
          ttr.nextSymbol();
        }
        AT();
        MDAYs();
        F();
        break;
      }

      case 'january':
      case 'february':
      case 'march':
      case 'april':
      case 'may':
      case 'june':
      case 'july':
      case 'august':
      case 'september':
      case 'october':
      case 'november':
      case 'december':
        options.freq = RRule.YEARLY;
        options.bymonth = [decodeM() as number];

        if (!ttr.nextSymbol()) return;

        // TODO check for duplicates
        while (ttr.accept('comma')) {
          if (ttr.isDone()) throw new Error('Unexpected end');

          const m = decodeM();
          if (!m) {
            throw new Error(`Unexpected symbol ${ttr.symbol}, expected month`);
          }

          options.bymonth.push(m);
          ttr.nextSymbol();
        }

        ON();
        F();
        break;

      default:
        throw new Error('Unknown symbol');
    }
  }

  function ON() {
    const on = ttr.accept('on');
    const the = ttr.accept('the');
    if (!(on || the)) return;

    do {
      const nth = decodeNTH();
      const wkd = decodeWKD();
      const m = decodeM();

      // nth <weekday> | <weekday>
      if (nth) {
        // ttr.nextSymbol()

        if (wkd) {
          ttr.nextSymbol();
          if (!options.byweekday) options.byweekday = [] as ByWeekday[];
          (options.byweekday as ByWeekday[]).push(
            RRule[wkd as WeekdayStr].nth(nth),
          );
        } else {
          if (!options.bymonthday) options.bymonthday = [] as number[];
          (options.bymonthday as number[]).push(nth);
          ttr.accept('day(s)');
        }
        // <weekday>
      } else if (wkd) {
        ttr.nextSymbol();
        if (!options.byweekday) options.byweekday = [] as ByWeekday[];
        (options.byweekday as ByWeekday[]).push(RRule[wkd as WeekdayStr]);
      } else if (ttr.symbol === 'weekday(s)') {
        ttr.nextSymbol();
        if (!options.byweekday) {
          options.byweekday = [
            RRule.MO,
            RRule.TU,
            RRule.WE,
            RRule.TH,
            RRule.FR,
          ];
        }
      } else if (ttr.symbol === 'week(s)') {
        ttr.nextSymbol();
        let n = ttr.acceptNumber();
        if (!n) {
          throw new Error(
            `Unexpected symbol ${ttr.symbol}, expected week number`,
          );
        }
        options.byweekno = [parseInt(n[0], 10)];
        while (ttr.accept('comma')) {
          n = ttr.acceptNumber();
          if (!n) {
            throw new Error(
              `Unexpected symbol ${ttr.symbol}; expected monthday`,
            );
          }
          options.byweekno.push(parseInt(n[0], 10));
        }
      } else if (m) {
        ttr.nextSymbol();
        if (!options.bymonth) options.bymonth = [] as number[];
        (options.bymonth as number[]).push(m);
      } else {
        return;
      }
    } while (ttr.accept('comma') || ttr.accept('the') || ttr.accept('on'));
  }

  function AT() {
    const at = ttr.accept('at');
    if (!at) return;

    do {
      let n = ttr.acceptNumber();
      if (!n) {
        throw new Error(`Unexpected symbol ${ttr.symbol}, expected hour`);
      }
      options.byhour = [parseInt(n[0], 10)];
      while (ttr.accept('comma')) {
        n = ttr.acceptNumber();
        if (!n) {
          throw new Error(`Unexpected symbol ${ttr.symbol}; expected hour`);
        }
        options.byhour.push(parseInt(n[0], 10));
      }
    } while (ttr.accept('comma') || ttr.accept('at'));
  }

  function decodeM() {
    switch (ttr.symbol) {
      case 'january':
        return 1;
      case 'february':
        return 2;
      case 'march':
        return 3;
      case 'april':
        return 4;
      case 'may':
        return 5;
      case 'june':
        return 6;
      case 'july':
        return 7;
      case 'august':
        return 8;
      case 'september':
        return 9;
      case 'october':
        return 10;
      case 'november':
        return 11;
      case 'december':
        return 12;
      default:
        return false;
    }
  }

  function decodeWKD() {
    switch (ttr.symbol) {
      case 'monday':
      case 'tuesday':
      case 'wednesday':
      case 'thursday':
      case 'friday':
      case 'saturday':
      case 'sunday':
        return ttr.symbol.substr(0, 2).toUpperCase();
      default:
        return false;
    }
  }

  function decodeNTH() {
    switch (ttr.symbol) {
      case 'last':
        ttr.nextSymbol();
        return -1;
      case 'first':
        ttr.nextSymbol();
        return 1;
      case 'second':
        ttr.nextSymbol();
        return ttr.accept('last') ? -2 : 2;
      case 'third':
        ttr.nextSymbol();
        return ttr.accept('last') ? -3 : 3;
      case 'nth': {
        const v = parseInt(ttr.value![1]!, 10);
        if (v < -366 || v > 366) throw new Error(`Nth out of range: ${v}`);

        ttr.nextSymbol();
        return ttr.accept('last') ? -v : v;
      }

      default:
        return false;
    }
  }

  function MDAYs() {
    ttr.accept('on');
    ttr.accept('the');

    let nth = decodeNTH();
    if (!nth) return;

    options.bymonthday = [nth];
    ttr.nextSymbol();

    while (ttr.accept('comma')) {
      nth = decodeNTH();
      if (!nth) {
        throw new Error(`Unexpected symbol ${ttr.symbol}; expected monthday`);
      }

      options.bymonthday.push(nth);
      ttr.nextSymbol();
    }
  }

  function F() {
    if (ttr.symbol === 'until') {
      const date = Date.parse(ttr.text);

      if (!date) throw new Error(`Cannot parse until date:${ttr.text}`);
      options.until = new Date(date);
    } else if (ttr.accept('for')) {
      options.count = parseInt(ttr.value![0]!, 10);
      ttr.expect('number');
      // ttr.expect('times')
    }
  }
}
