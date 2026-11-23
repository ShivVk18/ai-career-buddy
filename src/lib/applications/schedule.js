// Pure date helpers for dated tasks (no I/O). Not a "use server" file.

/** A valid IANA time zone name, else null. */
export function validTimeZone(tz) {
  if (typeof tz !== "string" || !tz || tz.length > 64) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localParts(ms, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", weekday: "short", hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const o = {};
  for (const p of parts) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, dow: WEEKDAYS.indexOf(o.weekday), asUtc: Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second) };
}

/** The instant at which the wall clock in `tz` reads y-m-d hour:00. */
function zonedInstant(y, m, d, hour, tz) {
  const want = Date.UTC(y, m - 1, d, hour);
  let guess = want;
  for (let i = 0; i < 3; i++) {
    const offset = localParts(guess, tz).asUtc - guess; // local minus utc
    guess = want - offset;
  }
  return new Date(guess);
}

/**
 * 09:00 on the next Monday (strictly after today) in the user's time zone when known, else the server's.
 * Monday morning is "next Monday" even when today is Monday.
 */
export function nextMondayAt9(now = Date.now(), timeZone) {
  const tz = validTimeZone(timeZone) ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  const l = localParts(now, tz);
  const add = ((8 - l.dow) % 7) || 7;
  const base = new Date(Date.UTC(l.y, l.m - 1, l.d + add));
  return zonedInstant(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), 9, tz);
}
