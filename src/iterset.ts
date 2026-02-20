import { sort } from './dateutil';
import { DateWithZone } from './datewithzone';
import { iter } from './iter';
import type IterResult from './iterresult';
import type { RRule } from './rrule';
import type { IterResultType, QueryMethodTypes } from './types';

export function iterSet<M extends QueryMethodTypes>(
  iterResult: IterResult<M>,
  _rrule: RRule[],
  _exrule: RRule[],
  _rdate: Date[],
  _exdate: Date[],
  tzid: string | undefined,
) {
  const _exdateHash: { [k: number]: boolean } = {};
  const _accept = iterResult.accept;

  function evalExdate(after: Date, before: Date) {
    _exrule.forEach((rrule) => {
      rrule.between(after, before, true).forEach((date) => {
        _exdateHash[Number(date)] = true;
      });
    });
  }

  _exdate.forEach((date) => {
    const zonedDate = new DateWithZone(date, tzid).rezonedDate();
    _exdateHash[Number(zonedDate)] = true;
  });

  iterResult.accept = function (date) {
    const dt = Number(date);
    if (Number.isNaN(dt)) return _accept.call(this, date);
    if (!_exdateHash[dt]) {
      evalExdate(new Date(dt - 1), new Date(dt + 1));
      if (!_exdateHash[dt]) {
        _exdateHash[dt] = true;
        return _accept.call(this, date);
      }
    }
    return true;
  };

  if (iterResult.method === 'between') {
    evalExdate(iterResult.args.after!, iterResult.args.before!);
    iterResult.accept = function (date) {
      const dt = Number(date);
      if (!_exdateHash[dt]) {
        _exdateHash[dt] = true;
        return _accept.call(this, date);
      }
      return true;
    };
  }

  for (const rdate of _rdate) {
    const zonedDate = new DateWithZone(rdate, tzid).rezonedDate();
    if (!iterResult.accept(new Date(zonedDate.getTime()))) break;
  }

  _rrule.forEach((rrule) => {
    iter(iterResult, rrule.options);
  });

  const res = iterResult._result;
  sort(res);
  switch (iterResult.method) {
    case 'all':
    case 'between':
      return res as IterResultType<M>;
    case 'before':
      return ((res.length && res[res.length - 1]) || null) as IterResultType<M>;
    default:
      return ((res.length && res[0]) || null) as IterResultType<M>;
  }
}
