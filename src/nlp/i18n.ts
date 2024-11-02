// =============================================================================
// i18n
// =============================================================================

export interface Language {
  dayNames: string[]
  monthNames: string[]
  tokens: {
    [k: string]: RegExp
  }
}

const ENGLISH: Language = {
  dayNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  monthNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  tokens: {
    SKIP: /^[ \r\n\t]+|^\.$/,
    number: /^[1-9][0-9]*/,
    numberAsText: /^(one|two|three)/i,
    every: /^every/i,
    'day(s)': /^days?/i,
    'weekday(s)': /^(weekdays?|business\s+days?|work\s+days?)/i,
    'week(s)': /^(weeks?|wks?|weekly)/i,
    'hour(s)': /^(hours?|hrs?|hourly)/i,
    'minute(s)': /^(minutes?|mins?)/i,
    'month(s)': /^(months?|monthly)/i,
    'year(s)': /^(years?|yearly|annually)/i,
    on: /^(on|in)/i,
    at: /^(at|@)/i,
    the: /^the/i,
    first: /^first/i,
    second: /^second/i,
    third: /^third/i,
    nth: /^([1-9][0-9]*)(\.|th|nd|rd|st)/i,
    last: /^last/i,
    for: /^for/i,
    'time(s)': /^times?/i,
    until: /^(un)?til/i,
    monday: /^(mo\.?(n\.?(days?)?)?)/i,
    tuesday: /^(tu\.?(e\.?(s\.?(days?)?)?)?)/i,
    wednesday: /^(we\.?(d\.?(n\.?(esdays?)?)?)?)/i,
    thursday: /^(th\.?(u\.?(r\.?(s\.?(days?)?)?)?)?)/i,
    friday: /^(fr\.?(i\.?(days?)?)?)/i,
    saturday: /^(sa\.?(t\.?(urdays?)?)?)/i,
    sunday: /^(su\.?(n\.?(days?)?)?)/i,
    january: /^(jan\.?(uary)?)/i,
    february: /^(feb\.?(ruary)?)/i,
    march: /^(mar\.?(ch)?)/i,
    april: /^(apr\.?(il)?)/i,
    may: /^may/i,
    june: /^(june?|jun\.)/i,
    july: /^(july?|jul\.)/i,
    august: /^(aug(ust)?|aug\.)/i,
    september: /^(sep(t(ember)?)?|sept\.|sep\.)/i,
    october: /^(oct(ober)?|oct\.)/i,
    november: /^(nov(ember)?|nov\.)/i,
    december: /^(dec(ember)?|dec\.)/i,
    comma: /^(,\s*|(and|or|&)\s*)+/i,
  },
}

export default ENGLISH
