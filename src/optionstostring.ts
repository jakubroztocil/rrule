import { timeToUntilString } from './dateutil';
import { DateWithZone } from './datewithzone';
import { isArray, isNumber, isPresent, toArray } from './helpers';
import { DEFAULT_OPTIONS, RRule } from './rrule';
import type { Options } from './types';
import { Weekday } from './weekday';

export function optionsToString(options: Partial<Options>) {
  const rrule: string[][] = [];
  let dtstart = '';
  const keys: (keyof Options)[] = Object.keys(options) as (keyof Options)[];
  const defaultKeys = Object.keys(DEFAULT_OPTIONS);

  for (const optKey of keys) {
    if (optKey === 'tzid') continue;
    if (!defaultKeys.includes(optKey)) continue;

    let key = optKey.toUpperCase();
    const value = options[optKey];
    let outValue = '';

    if (!isPresent(value) || (isArray(value) && !value.length)) continue;

    switch (key) {
      case 'FREQ':
        outValue = RRule.FREQUENCIES[options.freq!]!;
        break;
      case 'WKST':
        if (isNumber(value)) {
          outValue = new Weekday(value).toString();
        } else {
          outValue = value.toString();
        }
        break;
      case 'BYWEEKDAY':
        /*
          NOTE: BYWEEKDAY is a special case.
          RRule() deconstructs the rule.options.byweekday array
          into an array of Weekday arguments.
          On the other hand, rule.origOptions is an array of Weekdays.
          We need to handle both cases here.
          It might be worth change RRule to keep the Weekdays.

          Also, BYWEEKDAY (used by RRule) vs. BYDAY (RFC)

          */
        key = 'BYDAY';
        outValue = toArray<Weekday | number[] | number>(
          value as Weekday | number[] | number,
        )
          .map((wday) => {
            if (wday instanceof Weekday) {
              return wday;
            }

            if (isArray(wday)) {
              return new Weekday(wday[0]!, wday[1]!);
            }

            return new Weekday(wday);
          })
          .toString();

        break;
      case 'DTSTART':
        dtstart = buildDtstart(value as number, options.tzid);
        break;

      case 'UNTIL':
        outValue = timeToUntilString(value as number, !options.tzid);
        break;

      default:
        if (isArray(value)) {
          const strValues: string[] = [];
          for (let j = 0; j < value.length; j++) {
            strValues[j] = String(value[j]);
          }
          outValue = strValues.toString();
        } else {
          outValue = String(value);
        }
    }

    if (outValue) {
      rrule.push([key, outValue]);
    }
  }

  const rules = rrule.map(([key, value]) => `${key}=${value}`).join(';');
  let ruleString = '';
  if (rules !== '') {
    ruleString = `RRULE:${rules}`;
  }

  return [dtstart, ruleString].filter((x) => !!x).join('\n');
}

function buildDtstart(dtstart?: number, tzid?: string | null) {
  if (!dtstart) {
    return '';
  }

  return `DTSTART${new DateWithZone(new Date(dtstart), tzid).toString()}`;
}
