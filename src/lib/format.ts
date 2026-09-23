// All display formatting and "day boundary" calculations are pinned to WIB
// (Asia/Jakarta, UTC+7) explicitly. Without this, formatting would follow
// whatever timezone the server process happens to run in (often UTC on
// cloud hosting), silently shifting every displayed time by hours.

const TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function formatTanggalWaktu(value: string | null | undefined): string {
  if (!value) return "-";
  try {
    const date = new Date(value);
    const tanggal = new Intl.DateTimeFormat("id-ID", {
      timeZone: TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
    const waktu = new Intl.DateTimeFormat("id-ID", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    return `${tanggal}, ${waktu} WIB`;
  } catch {
    return value;
  }
}

export function formatTanggal(value: string | null | undefined): string {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Converts a naive "YYYY-MM-DDTHH:mm" string (as produced by
 * <input type="datetime-local">, with no timezone info) into a proper UTC
 * ISO timestamp, treating the value as WIB local time. Without this, the
 * same string parsed with `new Date(...)` would be interpreted using the
 * *server's* timezone — e.g. a santri picking "14:30" would be stored as
 * 14:30 UTC (21:30 WIB) if the server runs in UTC.
 */
export function wibInputToISOString(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const ms =
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? "0")) -
    WIB_OFFSET_MS;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
export function jakartaDateParts(value: string | Date = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

/**
 * Kebalikan dari wibInputToISOString: mengubah ISO timestamp (UTC) menjadi
 * string "YYYY-MM-DDTHH:mm" yang merepresentasikan jam WIB-nya, supaya bisa
 * dipakai sebagai defaultValue/value pada <input type="datetime-local">.
 */
export function isoToWibInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const wibMs = date.getTime() + WIB_OFFSET_MS;
  const wib = new Date(wibMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}T${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`;
}

export const isoToWibInputString = isoToWibInputValue;


/**
 * ISO start/end instants (UTC) for a given WIB calendar day — i.e. the range
 * [00:00 WIB, 24:00 WIB) for that date — regardless of the server's own
 * timezone. Defaults to "today" in WIB.
 */
export function jakartaDayRange(value: string | Date = new Date()) {
  const { year, month, day } = jakartaDateParts(value);
  const start = new Date(Date.UTC(year, month - 1, day) - WIB_OFFSET_MS);
  const end = new Date(Date.UTC(year, month - 1, day + 1) - WIB_OFFSET_MS);
  return { start: start.toISOString(), end: end.toISOString() };
}

