import { RRule, RRuleSet } from '../src'
import { datetime } from './lib/utils'

describe('RRuleSet cache invalidation', () => {
  it('invalidates cached queries after adding RDATE and EXDATE entries', () => {
    const set = new RRuleSet()
    set.rrule(
      new RRule({
        freq: RRule.MONTHLY,
        count: 5,
        dtstart: datetime(2026, 1, 1, 16, 30),
      })
    )

    const rangeStart = datetime(2026, 3, 1)
    const rangeEnd = datetime(2026, 5, 1, 16, 30)
    const aprilOccurrence = datetime(2026, 4, 1, 16, 30)

    // Populate every cache shape before mutating the set.
    expect(set.all()).toContainEqual(aprilOccurrence)
    expect(set.after(aprilOccurrence, true)).toEqual(aprilOccurrence)
    expect(set.before(aprilOccurrence, true)).toEqual(aprilOccurrence)
    expect(set.between(rangeStart, rangeEnd, true)).toContainEqual(
      aprilOccurrence
    )

    const replacementOccurrence = datetime(2026, 3, 27, 9, 30)
    set.rdate(replacementOccurrence)
    set.exdate(aprilOccurrence)

    expect(set.after(aprilOccurrence, true)).toEqual(
      datetime(2026, 5, 1, 16, 30)
    )
    expect(set.before(aprilOccurrence, true)).toEqual(replacementOccurrence)
    expect(set.between(rangeStart, rangeEnd, true)).toEqual([
      datetime(2026, 3, 1, 16, 30),
      replacementOccurrence,
      datetime(2026, 5, 1, 16, 30),
    ])
    expect(set.all()).toEqual([
      datetime(2026, 1, 1, 16, 30),
      datetime(2026, 2, 1, 16, 30),
      datetime(2026, 3, 1, 16, 30),
      replacementOccurrence,
      datetime(2026, 5, 1, 16, 30),
    ])
  })
})
