const BALI_TZ = "Asia/Makassar";

export function formatBaliDateTime(date: Date) {
  return date.toLocaleString("id-ID", { timeZone: BALI_TZ });
}

export function formatBaliDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    timeZone: BALI_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Returns the calendar date in Bali time as "YYYY-MM-DD". */
export function getBaliDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BALI_TZ }).format(date);
}

/** UTC instant range covering a full calendar day in Bali time (defaults to today). */
export function getBaliDayRange(dateKey?: string) {
  const key = dateKey ?? getBaliDateKey(new Date());
  return {
    start: new Date(`${key}T00:00:00+08:00`),
    end: new Date(`${key}T23:59:59.999+08:00`),
  };
}

/** Date/time components in Bali time, useful for generating human-readable codes. */
export function getBaliDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BALI_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";

  return {
    date: get("day"),
    month: get("month"),
    year: get("year"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}
