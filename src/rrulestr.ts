import { untilStringToDate } from './dateutil';
import { split } from './helpers';
import { parseDtstart, parseString } from './parsestring';
import { RRule } from './rrule';
import { RRuleSet } from './rruleset';
import type { Options } from './types';

export interface RRuleStrOptions {
  dtstart: Date | null;
  cache: boolean;
  unfold: boolean;
  forceset: boolean;
  compatible: boolean;
  tzid: string | null;
}

/**
 * RRuleStr
 * To parse a set of rrule strings
 */
const DEFAULT_OPTIONS: RRuleStrOptions = {
  dtstart: null,
  cache: false,
  unfold: false,
  forceset: false,
  compatible: false,
  tzid: null,
};

export function parseInput(s: string, options: Partial<RRuleStrOptions>) {
  const rrulevals: Partial<Options>[] = [];
  let rdatevals: Date[] = [];
  const exrulevals: Partial<Options>[] = [];
  let exdatevals: Date[] = [];

  const parsedDtstart = parseDtstart(s);
  const { dtstart } = parsedDtstart;
  let { tzid } = parsedDtstart;

  const lines = splitIntoLines(s, options.unfold);

  lines.forEach((line) => {
    if (!line) return;
    const { name, parms, value } = breakDownLine(line);

    switch (name.toUpperCase()) {
      case 'RRULE':
        if (parms.length) {
          throw new Error(`unsupported RRULE parm: ${parms.join(',')}`);
        }

        rrulevals.push(parseString(line));
        break;

      case 'RDATE': {
        const [, rdateTzid] = /RDATE(?:;TZID=([^:=]+))?/i.exec(line) ?? [];
        if (rdateTzid && !tzid) {
          tzid = rdateTzid;
        }
        rdatevals = rdatevals.concat(parseRDate(value, parms));
        break;
      }

      case 'EXRULE':
        if (parms.length) {
          throw new Error(`unsupported EXRULE parm: ${parms.join(',')}`);
        }

        exrulevals.push(parseString(value));
        break;

      case 'EXDATE':
        exdatevals = exdatevals.concat(parseRDate(value, parms));
        break;

      case 'DTSTART':
        break;

      default:
        throw new Error(`unsupported property: ${name}`);
    }
  });

  return {
    dtstart,
    tzid,
    rrulevals,
    rdatevals,
    exrulevals,
    exdatevals,
  };
}

function buildRule(s: string, options: Partial<RRuleStrOptions>) {
  const { rrulevals, rdatevals, exrulevals, exdatevals, dtstart, tzid } =
    parseInput(s, options);

  const noCache = options.cache === false;

  if (options.compatible) {
    options.forceset = true;
    options.unfold = true;
  }

  if (
    options.forceset ||
    rrulevals.length > 1 ||
    rdatevals.length ||
    exrulevals.length ||
    exdatevals.length
  ) {
    const rset = new RRuleSet(noCache);

    rset.dtstart(dtstart);
    rset.tzid(tzid || undefined);

    rrulevals.forEach((val) => {
      rset.rrule(new RRule(groomRruleOptions(val, dtstart, tzid), noCache));
    });

    rdatevals.forEach((date) => {
      rset.rdate(date);
    });

    exrulevals.forEach((val) => {
      rset.exrule(new RRule(groomRruleOptions(val, dtstart, tzid), noCache));
    });

    exdatevals.forEach((date) => {
      rset.exdate(date);
    });

    if (options.compatible && options.dtstart) rset.rdate(dtstart!);
    return rset;
  }

  const val = rrulevals[0] || {};
  return new RRule(
    groomRruleOptions(
      val,
      val.dtstart || options.dtstart || dtstart,
      val.tzid || options.tzid || tzid,
    ),
    noCache,
  );
}

export function rrulestr(
  s: string,
  options: Partial<RRuleStrOptions> = {},
): RRule | RRuleSet {
  return buildRule(s, initializeOptions(options));
}

function groomRruleOptions(
  val: Partial<Options>,
  dtstart?: Date | null,
  tzid?: string | null,
) {
  return {
    ...val,
    dtstart,
    tzid,
  };
}

function initializeOptions(options: Partial<RRuleStrOptions>) {
  const invalid: string[] = [];
  const keys = Object.keys(options) as (keyof typeof options)[];
  const defaultKeys = Object.keys(
    DEFAULT_OPTIONS,
  ) as (keyof typeof DEFAULT_OPTIONS)[];

  keys.forEach((key) => {
    if (!defaultKeys.includes(key)) invalid.push(key);
  });

  if (invalid.length) {
    throw new Error(`Invalid options: ${invalid.join(', ')}`);
  }

  return { ...DEFAULT_OPTIONS, ...options };
}

function extractName(line: string): { name: string; value: string } {
  if (line.indexOf(':') === -1) {
    return {
      name: 'RRULE',
      value: line,
    };
  }

  const [name = '', value = ''] = split(line, ':', 1);
  return {
    name,
    value,
  };
}

function breakDownLine(line: string) {
  const { name, value } = extractName(line);
  const parms = name.split(';');
  if (!parms) throw new Error('empty property name');

  return {
    name: parms[0]!.toUpperCase(),
    parms: parms.slice(1),
    value,
  };
}

function splitIntoLines(s: string, unfold = false) {
  s = s?.trim();
  if (!s) throw new Error('Invalid empty string');

  // More info about 'unfold' option
  // Go head to http://www.ietf.org/rfc/rfc2445.txt
  if (!unfold) {
    return s.split(/\s/);
  }

  const lines = s.split('\n');
  let i = 0;
  while (i < lines.length) {
    // TODO
    lines[i] = lines[i]!.replace(/\s+$/g, '');
    const line = lines[i];
    if (!line) {
      lines.splice(i, 1);
    } else if (i > 0 && line[0] === ' ') {
      lines[i - 1] += line.slice(1);
      lines.splice(i, 1);
    } else {
      i += 1;
    }
  }

  return lines;
}

function validateDateParm(parms: string[]) {
  parms.forEach((parm) => {
    if (!/(VALUE=DATE(-TIME)?)|(TZID=)/.test(parm)) {
      throw new Error(`unsupported RDATE/EXDATE parm: ${parm}`);
    }
  });
}

function parseRDate(rdateval: string, parms: string[]) {
  validateDateParm(parms);

  return rdateval.split(',').map((datestr) => untilStringToDate(datestr));
}
