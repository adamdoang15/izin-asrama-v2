import { jakartaDateParts } from "@/lib/format";

/**
 * Daily Activity Ingestion Adapter
 *
 * Bertanggung jawab khusus untuk intake data aktivitas harian:
 * 1. Auto-discovery nama sheet dari Google Sheets HTML view
 * 2. Fetching & parsing data CSV dari Google Sheets atau endpoint eksternal
 * 3. In-memory caching untuk mengurangi network calls
 * 4. Fallback ke synthetic sample data realistis saat offline / development
 */

export const ACTIVITY_SHEETS = [
  "BANGUN TIDUR",
  "MANDI PAGI",
  "SHOLAT SUBUH",
  "PENGAMBILAN HP",
  "TC",
  "PIKET",
  "MAKAN PAGI",
  "OLAHRAGA",
  "BERANGKAT SEKOLAH",
  "SHOLAT DZUHUR",
  "SHOLAT ASHAR",
  "PENGAJIAN MINGGU",
  "PULANG SEKOLAH",
  "MANDI SORE",
  "SHOLAT MAGHRIB",
  "SHOLAT ISYA",
  "MAKAN MALAM",
  "NONTON BARENG",
  "ZOOM VICON",
  "KOORDINASI BULANAN",
  "KBM",
  "APEL MALAM",
  "PENGUMPULAN HP",
  "OPSIH",
] as const;

export const SHOLAT_SHEETS = [
  "SHOLAT SUBUH",
  "SHOLAT DZUHUR",
  "SHOLAT ASHAR",
  "SHOLAT MAGHRIB",
  "SHOLAT ISYA",
] as const;

export type ActivityStatus = "H" | "S" | "T" | "I" | "A";

export interface NormalizedActivityRecord {
  tanggal: string; // YYYY-MM-DD
  namaGelara: string;
  aktivitas: string;
  status: ActivityStatus;
}

// In-memory cache untuk records
interface CacheEntry {
  timestamp: number;
  data: NormalizedActivityRecord[];
  sourceType: "google-sheet" | "excel" | "sample";
  sheetNames: string[];
}

const memoryCacheMap: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 menit cache

// Cache untuk hasil auto-discovery nama sheet
interface SheetDiscoveryCache {
  timestamp: number;
  sheetNames: string[];
}

const sheetDiscoveryCacheMap: Record<string, SheetDiscoveryCache> = {};
const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit cache

/**
 * Normalisasi nama gelara untuk konsistensi pencocokan antar-sheet.
 */
export function normalizeGelaraName(rawName: string): string {
  return rawName
    .normalize("NFC")
    .replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g, " ")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Auto-discover nama sheet dari Google Sheets htmlview.
 */
async function discoverSheetNames(sheetId: string): Promise<string[]> {
  const now = Date.now();
  const cachedDiscovery = sheetDiscoveryCacheMap[sheetId];
  if (cachedDiscovery && now - cachedDiscovery.timestamp < DISCOVERY_CACHE_TTL_MS) {
    return cachedDiscovery.sheetNames;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[SheetDiscovery] htmlview fetch failed: ${res.status}`);
      return [];
    }

    const html = await res.text();
    const names: string[] = [];

    const pattern0 = /items\.push\({\s*name:\s*["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = pattern0.exec(html)) !== null) {
      const name = m[1].trim();
      if (name && !names.includes(name) && name.toUpperCase() !== "REKAP") {
        names.push(name);
      }
    }

    if (names.length === 0) {
      const patternScript = /\{name:\s*["']([^"']+)["']/gi;
      while ((m = patternScript.exec(html)) !== null) {
        const name = m[1].trim();
        if (name && !names.includes(name) && name.toUpperCase() !== "REKAP") {
          names.push(name);
        }
      }
    }

    if (names.length === 0) {
      const pattern1 = /<li[^>]*id=["']sheet-button-[^"']*["'][^>]*>([^<]+)<\/li>/gi;
      while ((m = pattern1.exec(html)) !== null) {
        const name = m[1].trim();
        if (name && !names.includes(name) && name.toUpperCase() !== "REKAP") {
          names.push(name);
        }
      }
    }

    if (names.length === 0) {
      const pattern2 = /data-name=["']([^"']+)["']/gi;
      while ((m = pattern2.exec(html)) !== null) {
        const name = m[1].trim();
        if (name && !names.includes(name) && name.toUpperCase() !== "REKAP") {
          names.push(name);
        }
      }
    }

    if (names.length === 0) {
      const pattern3 = /class=["'][^"']*goog-tab[^"']*["'][^>]*>([^<]+)</gi;
      while ((m = pattern3.exec(html)) !== null) {
        const name = m[1].trim();
        if (name && name.length > 0 && name.length < 100 && !names.includes(name) && name.toUpperCase() !== "REKAP") {
          names.push(name);
        }
      }
    }

    if (names.length > 0) {
      sheetDiscoveryCacheMap[sheetId] = { timestamp: now, sheetNames: names };
      return names;
    }

    return [];
  } catch (err) {
    console.warn("[SheetDiscovery] Gagal fetch htmlview:", err);
    return [];
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsvRows(csvText: string, activityName: string, year = 2026, month = 9): NormalizedActivityRecord[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const records: NormalizedActivityRecord[] = [];
  let nameColIdx = 2;
  const dateColMap: { colIdx: number; dateIso: string }[] = [];

  const row0 = parseCsvLine(lines[0]);
  const row1 = lines.length > 1 ? parseCsvLine(lines[1]) : [];

  for (let i = 0; i < row0.length; i++) {
    const cell = row0[i].trim().toUpperCase();
    if (cell === "NAMA" || cell === "NAMA GELARA" || cell === "NAMA SANTRI") {
      nameColIdx = i;
      break;
    }
  }

  const headerToInspect = row1.length > 0 && row1.some((c) => /^[0-9]{1,2}$/.test(c.trim())) ? row1 : row0;
  const startDataRow = headerToInspect === row1 ? 2 : 1;

  for (let i = 0; i < headerToInspect.length; i++) {
    const cell = headerToInspect[i].trim();
    const dayNum = parseInt(cell, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 && String(dayNum) === cell) {
      const dateIso = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      dateColMap.push({ colIdx: i, dateIso });
    }
  }

  for (let r = startDataRow; r < lines.length; r++) {
    const rowCells = parseCsvLine(lines[r]);
    const rawName = rowCells[nameColIdx]?.trim();
    if (
      !rawName ||
      rawName.toUpperCase() === "TOTAL" ||
      rawName.toUpperCase() === "REKAP" ||
      rawName.toUpperCase() === "NAMA" ||
      rawName.toUpperCase() === "NO"
    ) {
      continue;
    }

    const gelaraName = normalizeGelaraName(rawName);

    for (const { colIdx, dateIso } of dateColMap) {
      if (colIdx < rowCells.length) {
        const rawStatus = rowCells[colIdx]?.trim().toUpperCase();
        if (rawStatus && ["H", "S", "T", "I", "A"].includes(rawStatus)) {
          records.push({
            tanggal: dateIso,
            namaGelara: gelaraName,
            aktivitas: activityName,
            status: rawStatus as ActivityStatus,
          });
        }
      }
    }
  }

  return records;
}

function generateSampleData(): NormalizedActivityRecord[] {
  const records: NormalizedActivityRecord[] = [];
  const year = 2026;
  const month = 9;
  const daysInMonth = 30;

  const gelaraList = [
    { name: "Adam Abdilah", aRatio: 0.07 },
    { name: "Bakhita Akhtara Khairan", aRatio: 0.035 },
    { name: "Ahmad Fauzan", aRatio: 0.05 },
    { name: "Bilal Hidayat", aRatio: 0.04 },
    { name: "Muhammad Farhan", aRatio: 0.06 },
    { name: "Farras Ramadhan", aRatio: 0.045 },
    { name: "Daffa Pratama", aRatio: 0.08 },
    { name: "Rizky Firmansyah", aRatio: 0.05 },
    { name: "Zaidan Alfarizi", aRatio: 0.03 },
    { name: "Ibnu Sina", aRatio: 0.02 },
    { name: "Rayhan Maulana", aRatio: 0.055 },
    { name: "Naufal Hadi", aRatio: 0.04 },
  ];

  const knownA: Record<string, string[]> = {
    "Adam Abdilah": [
      "2026-09-01|BANGUN TIDUR",
      "2026-09-03|PIKET",
      "2026-09-03|BANGUN TIDUR",
      "2026-09-05|SHOLAT SUBUH",
      "2026-09-08|MANDI PAGI",
      "2026-09-12|APEL MALAM",
      "2026-09-15|KBM",
      "2026-09-19|SHOLAT DZUHUR",
      "2026-09-22|TC",
      "2026-09-23|SHOLAT ISYA",
      "2026-09-24|MAKAN MALAM",
      "2026-09-25|PENGAMBILAN HP",
      "2026-09-27|BERANGKAT SEKOLAH",
      "2026-09-28|SHOLAT MAGHRIB",
      "2026-09-29|SHOLAT ASHAR",
      "2026-09-30|PENGUMPULAN HP",
      "2026-09-21|BANGUN TIDUR",
      "2026-09-26|PIKET",
    ],
    "Bakhita Akhtara Khairan": [
      "2026-09-05|MANDI PAGI",
      "2026-09-11|SHOLAT SUBUH",
      "2026-09-14|TC",
      "2026-09-18|PIKET",
      "2026-09-21|KBM",
      "2026-09-23|APEL MALAM",
      "2026-09-26|SHOLAT MAGHRIB",
      "2026-09-29|BANGUN TIDUR",
      "2026-09-30|MAKAN PAGI",
    ],
  };

  for (const gelara of gelaraList) {
    const knownSet = new Set(knownA[gelara.name] || []);

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, "0");
      const dateIso = `${year}-${String(month).padStart(2, "0")}-${dayStr}`;

      for (const sheet of ACTIVITY_SHEETS) {
        const key = `${dateIso}|${sheet}`;
        let status: ActivityStatus = "H";

        if (knownSet.has(key)) {
          status = "A";
        } else {
          const hash = (day * 31 + sheet.charCodeAt(0) * 17 + gelara.name.charCodeAt(0) * 7) % 100;
          if (hash < gelara.aRatio * 100 && knownSet.size === 0) {
            status = "A";
          } else if (hash === 97) {
            status = "I";
          } else if (hash === 98) {
            status = "S";
          } else if (hash === 99) {
            status = "T";
          } else {
            status = "H";
          }
        }

        records.push({
          tanggal: dateIso,
          namaGelara: gelara.name,
          aktivitas: sheet,
          status,
        });
      }
    }
  }

  return records;
}

export function getConfiguredSheetMap(): Record<string, string> {
  const jsonStr = process.env.DAILY_ACTIVITY_SHEETS;
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, string>;
      }
    } catch (e) {
      console.warn("[SheetConfig] Gagal parse DAILY_ACTIVITY_SHEETS JSON:", e);
    }
  }

  const fallbackSheetId = process.env.DAILY_ACTIVITY_SHEET_ID;
  const activePeriod = getActiveYearAndMonth();
  if (fallbackSheetId) {
    return { [activePeriod.monthId]: fallbackSheetId };
  }

  return {};
}

export function getActiveYearAndMonth(): { year: number; month: number; monthId: string } {
  const envMonthId = process.env.DAILY_ACTIVITY_MONTH_ID;
  if (envMonthId && /^\d{4}-\d{2}$/.test(envMonthId)) {
    const [y, m] = envMonthId.split("-").map((s) => parseInt(s, 10));
    return { year: y, month: m, monthId: envMonthId };
  }

  const envYear = process.env.DAILY_ACTIVITY_YEAR ? parseInt(process.env.DAILY_ACTIVITY_YEAR, 10) : null;
  const envMonth = process.env.DAILY_ACTIVITY_MONTH ? parseInt(process.env.DAILY_ACTIVITY_MONTH, 10) : null;
  if (envYear && envMonth) {
    const monthId = `${envYear}-${String(envMonth).padStart(2, "0")}`;
    return { year: envYear, month: envMonth, monthId };
  }

  const { year, month } = jakartaDateParts();
  return { year, month, monthId: `${year}-${String(month).padStart(2, "0")}` };
}

/**
 * Fetch all raw activity records from configured source or sample fallback
 */
export async function getRawDailyActivityRecords(targetMonthId?: string): Promise<{
  records: NormalizedActivityRecord[];
  sourceType: "google-sheet" | "excel" | "sample";
  sheetNames: string[];
}> {
  const now = Date.now();
  const cacheKey = targetMonthId || "default";
  const cached = memoryCacheMap[cacheKey];
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { records: cached.data, sourceType: cached.sourceType, sheetNames: cached.sheetNames };
  }

  const sheetUrl = process.env.DAILY_ACTIVITY_SHEET_URL;
  const sheetMap = getConfiguredSheetMap();

  let activePeriod = getActiveYearAndMonth();
  if (targetMonthId && /^\d{4}-\d{2}$/.test(targetMonthId)) {
    const [y, m] = targetMonthId.split("-").map((s) => parseInt(s, 10));
    activePeriod = { year: y, month: m, monthId: targetMonthId };
  }

  const sheetId = sheetMap[activePeriod.monthId] || process.env.DAILY_ACTIVITY_SHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  // 1. Google Sheets API via Key
  if (sheetId && apiKey) {
    try {
      let sheetsToFetch: string[] = await discoverSheetNames(sheetId);
      if (sheetsToFetch.length === 0) {
        sheetsToFetch = [...ACTIVITY_SHEETS];
      }

      const records: NormalizedActivityRecord[] = [];
      const fetchPromises = sheetsToFetch.map(async (sheetName) => {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const json = await res.json();
        const rows: string[][] = json.values || [];
        if (rows.length < 2) return [];

        const sheetRecords: NormalizedActivityRecord[] = [];
        const headers = rows[0];
        let nameIdx = headers.findIndex((h) => /nama/i.test(h));
        if (nameIdx === -1) nameIdx = 1;

        const dateCols: { colIdx: number; dateIso: string }[] = [];
        for (let i = 0; i < headers.length; i++) {
          const dayNum = parseInt(String(headers[i]).replace(/[^0-9]/g, ""), 10);
          if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
            dateCols.push({
              colIdx: i,
              dateIso: `${activePeriod.year}-${String(activePeriod.month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`,
            });
          }
        }

        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const rawName = row[nameIdx];
          if (!rawName) continue;
          const gelaraName = normalizeGelaraName(rawName);

          for (const { colIdx, dateIso } of dateCols) {
            const rawStatus = row[colIdx]?.trim().toUpperCase();
            if (rawStatus && ["H", "S", "T", "I", "A"].includes(rawStatus)) {
              sheetRecords.push({
                tanggal: dateIso,
                namaGelara: gelaraName,
                aktivitas: sheetName,
                status: rawStatus as ActivityStatus,
              });
            }
          }
        }
        return sheetRecords;
      });

      const results = await Promise.all(fetchPromises);
      for (const sheetRes of results) {
        records.push(...sheetRes);
      }

      if (records.length > 0) {
        memoryCacheMap[cacheKey] = { timestamp: now, data: records, sourceType: "google-sheet", sheetNames: sheetsToFetch };
        return { records, sourceType: "google-sheet", sheetNames: sheetsToFetch };
      }
    } catch (err) {
      console.warn("Google Sheets API fetch failed, falling back to sample data:", err);
    }
  }

  // 2. Google Sheets Published CSV via Sheet ID
  if (sheetId && !apiKey) {
    try {
      let sheetsToFetch: string[] = await discoverSheetNames(sheetId);
      if (sheetsToFetch.length === 0) {
        sheetsToFetch = [...ACTIVITY_SHEETS];
      }

      const records: NormalizedActivityRecord[] = [];
      const fetchPromises = sheetsToFetch.map(async (sheetName) => {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const csvText = await res.text();
        return parseCsvRows(csvText, sheetName, activePeriod.year, activePeriod.month);
      });

      const results = await Promise.all(fetchPromises);
      for (const sheetRes of results) {
        records.push(...sheetRes);
      }

      if (records.length > 0) {
        memoryCacheMap[cacheKey] = { timestamp: now, data: records, sourceType: "google-sheet", sheetNames: sheetsToFetch };
        return { records, sourceType: "google-sheet", sheetNames: sheetsToFetch };
      }
    } catch (err) {
      console.warn("Google Sheets CSV fetch failed, falling back to sample data:", err);
    }
  }

  // 3. Custom endpoint URL
  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          const discovered = Array.from(new Set(json.map((r: { aktivitas?: string }) => r.aktivitas).filter(Boolean))) as string[];
          memoryCacheMap[cacheKey] = { timestamp: now, data: json, sourceType: "google-sheet", sheetNames: discovered };
          return { records: json, sourceType: "google-sheet", sheetNames: discovered };
        }
      }
    } catch (err) {
      console.warn("Custom Sheet URL fetch failed, falling back to sample data:", err);
    }
  }

  // 4. Default Sample Data Fallback
  const sampleRecords = generateSampleData();
  const sampleSheets = [...ACTIVITY_SHEETS];
  memoryCacheMap[cacheKey] = { timestamp: now, data: sampleRecords, sourceType: "sample", sheetNames: sampleSheets };
  return { records: sampleRecords, sourceType: "sample", sheetNames: sampleSheets };
}
