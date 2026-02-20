---
"rrule": patch
---

Refactored the core recurrence-rule implementation to share query/caching logic across RRule and RRuleSet, while also fixing a few correctness/performance issues in iteration and caching behavior.

## Bug Fixes

- Fixed removeFilteredDays accumulation bug
  - Was overwriting filtered on each iteration instead of accumulating. Only the last day's filter status was returned, causing sub-daily frequencies to   
    potentially skip the wrong number of days when earlier days in the set were filtered out.

- Fixed RRuleSet.clone() inverted noCache 
  - Changed new RRuleSet(!!this._cache) to new RRuleSet(!this._cache). The constructor param is noCache, so the old code was enabling cache on uncached
    sets and vice versa.

- Removed dead lno1wkst = 0 assignment
  - The value was assigned inside an if block but never read afterward. Changed declaration from let to const.

## Architecture

- Extracted RRuleBase abstract class
  - Moved shared query methods (all, between, before, after, count) and caching logic into RRuleBase.
  - RRule extends RRuleBase — keeps options, _iter, toString, toText, NLP methods.
  - RRuleSet extends RRuleBase — no longer extends RRule or calls super({}, noCache) with fake empty options.
  - Exported RRuleBase from src/index.ts so consumers can use instanceof RRuleBase for any rule-like object.
  - Updated test utilities to use RRuleBase for shared type checking.

## Performance

- rrules()/exrules() — eliminated serialize+reparse
  - Was: this._rrule.map((e) => rrulestr(e.toString())) — serializes to RFC string then re-parses.
  - Now: this._rrule.map((e) => e.clone()) — direct clone, removed the rrulestr import entirely.

- _addRule/_addDate — eliminated O(n) array allocation
  - Was: collection.map(String).includes(String(rrule)) — allocates a new array on every call.
  - Now: collection.some((r) => String(r) === str) — short-circuits without allocating.
  - Same pattern for _addDate: .some((d) => d.getTime() === time) instead of .map(Number).includes(Number(date)).

- Added cache size bounds (src/cache.ts)
  - Added MAX_CACHE_SIZE = 64 constant.
  - before/after/between caches now evict the oldest entry (FIFO) when the limit is reached, preventing unbounded memory growth on long-lived instances.

## Type Safety

- Narrowed bynweekday to tuple type (src/types.ts)
  - Changed bynweekday: number[][] | null to bynweekday: [number, number][] | null in ParsedOptions, enabling safe destructuring without ! assertions in
    monthinfo.ts and parseoptions.ts.

- Narrowed toText options to ParsedOptions (src/nlp/totext.ts)
  - Changed private options: Partial<Options> to private options: ParsedOptions, removing ~40 ! assertions on this.options.freq, this.options.interval,
    this.options.bymonthday, etc.

- Added explicit return types to dateutil helpers (src/dateutil.ts)
  - getWeekday(): number, getMonthDays(): number, monthRange(): [number, number].
  - Eliminated downstream ! assertions in datetime.ts and yearinfo.ts where these return values were used.

- Added explicit return type to extractName (src/rrulestr.ts)
  - Typed as { name: string; value: string } with default destructuring values, removing ! assertions on name and value.

- Added default destructuring values in parseString (src/parsestring.ts)
  - const [key = '', value = ''] = attr.split('=') and similar patterns, eliminating undefined-possibility assertions.

- Fixed Cache.all type (src/cache.ts)
  - Was: Date[] | Partial<IterArgs> | false — Partial<IterArgs> was never stored as all.
  - Now: Date[] | false.

- Clarified cache miss check (src/cache.ts)
  - Changed if (!cached && this.all) to if (cached === false && this.all) — makes intent explicit for "not in cache" vs "cached as null".

## Code Cleanup

Converted C-style loops to for...of across 7 files
- monthinfo.ts, optionstostring.ts, parseoptions.ts, yearinfo.ts, iterset.ts, iter/index.ts, iter/poslist.ts — eliminates uncertain array-index !
  assertions.

Removed dead code (src/iter/index.ts)
- Deleted redundant interval === 0 check (already checked at function entry).

Removed redundant instanceof runtime guards (src/rruleset.ts)
- _addRule had if (!(rrule instanceof RRule)) and _addDate had if (!(date instanceof Date)) — parameters are already typed, so these were always true.
  Removed guards and corresponding tests.

Fixed test parse() null safety (test/lib/utils.ts)
- Added null guard for regex match result before destructuring. Simplified with Number() instead of intermediate variables.

## Features

- toText() now includes start date (src/nlp/totext.ts)
  - When dtstart is explicitly set in rule options, toText() appends , starting [formatted date] to the output.
  - Example: "every 2 months on the 15th, starting February 18, 2026".
  - Rules without an explicit dtstart are unaffected.

## Tooling

- Updated README (README.md)
  - Fixed stale badges, broken code examples, byeaster docs, wkst typo, LICENCE/LICENSE link, dev tooling (Biome), and documented new toText() starting
    date behavior.
