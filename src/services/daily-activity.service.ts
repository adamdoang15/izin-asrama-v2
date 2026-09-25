/**
 * Daily Activity Service
 *
 * Bertanggung jawab untuk:
 * 1. Mengambil data dari Google Sheets / Excel / Endpoint / Sample Fallback
 * 2. Membaca & menormalisasi 16 sheet aktivitas gelara
 * 3. Menghitung progress mingguan & bulanan sesuai rumus:
 *    Progress (%) = ((Total kegiatan tercatat - Jumlah status A) / Total kegiatan tercatat) * 100
 * 4. Menyaring daftar ketidakhadiran (hanya status 'A')
 * 5. Menangani caching, filter, dan error state dengan aman tanpa crash
 */

/**
 * Daftar sheet aktivitas hardcoded sebagai fallback
 * Digunakan jika auto-discovery via HTML scraping gagal
 */
export const ACTIVITY_SHEETS = [
  "BANGUN TIDUR",
  "MANDI PAGI",
  "SHOLAT SUBUH",
  "PENGAMBILAN HP",
  "TC",
  "PIKET",
  "MAKAN PAGI",
  "BERANGKAT SEKOLAH",
  "SHOLAT DZUHUR",
  "SHOLAT ASHAR",
  "SHOLAT MAGHRIB",
  "SHOLAT ISYA",
  "MAKAN MALAM",
  "KBM",
  "APEL MALAM",
  "PENGUMPULAN HP",
] as const;

export type ActivityName = string;

export type ActivityStatus = "H" | "S" | "T" | "I" | "A";

export interface NormalizedActivityRecord {
  tanggal: string; // YYYY-MM-DD
  namaGelara: string;
  aktivitas: string;
  status: ActivityStatus;
}

export interface AbsentActivityRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  tanggalFormatted: string; // e.g. "03 Sep 2026"
  hari: string; // e.g. "Kamis"
  namaGelara: string;
  aktivitas: string;
}

export interface GelaraSummary {
  no: number;
  namaGelara: string;
  progressMingguan: number | null; // null jika tidak ada data tercatat
  progressBulanan: number | null; // null jika tidak ada data tercatat
  jumlahAMingguan: number;
  jumlahABulanan: number;
  totalTercatatMingguan: number;
  totalTercatatBulanan: number;
}

export interface WeekPeriod {
  id: string; // e.g. "w4"
  label: string; // e.g. "Minggu 4 (21 Sep - 27 Sep 2026)"
  shortLabel: string; // e.g. "Minggu 4"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent?: boolean;
}

export interface MonthPeriod {
  id: string; // e.g. "2026-09"
  label: string; // e.g. "September 2026"
  year: number;
  month: number;
}

export interface DailyActivityDataResult {
  month: MonthPeriod;
  availableMonths: MonthPeriod[];
  weeks: WeekPeriod[];
  selectedWeekId: string;
  selectedMonthId: string;
  gelaraSummaries: GelaraSummary[];
  absentActivities: AbsentActivityRecord[];
  allGelaraNames: string[];
  totalActivitiesCount: number;
  totalAbsentCount: number;
  sourceType: "google-sheet" | "excel" | "sample";
  lastUpdated: string;
}

// In-memory cache untuk records
interface CacheEntry {
  timestamp: number;
  data: NormalizedActivityRecord[];
  sourceType: "google-sheet" | "excel" | "sample";
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 menit cache

// Cache untuk hasil auto-discovery nama sheet
interface SheetDiscoveryCache {
  timestamp: number;
  sheetNames: string[];
}

let sheetDiscoveryCache: SheetDiscoveryCache | null = null;
const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit cache

/**
 * Auto-discover nama sheet dari Google Sheets htmlview.
 * Parse tab-tab yang ada di bagian bawah spreadsheet.
 * Jika gagal, kembalikan array kosong (gunakan fallback ACTIVITY_SHEETS).
 */
async function discoverSheetNames(sheetId: string): Promise<string[]> {
  const now = Date.now();
  if (
    sheetDiscoveryCache &&
    now - sheetDiscoveryCache.timestamp < DISCOVERY_CACHE_TTL_MS
  ) {
    return sheetDiscoveryCache.sheetNames;
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

    // Pola 1: <li id="sheet-button-...">Nama Sheet</li>
    const pattern1 = /<li[^>]*id=["']sheet-button-[^"']*["'][^>]*>([^<]+)<\/li>/gi;
    let m: RegExpExecArray | null;
    while ((m = pattern1.exec(html)) !== null) {
      const name = m[1].trim();
      if (name && !names.includes(name)) names.push(name);
    }

    // Pola 2 (fallback): data-name="..." pada elemen tab
    if (names.length === 0) {
      const pattern2 = /data-name=["']([^"']+)["']/gi;
      while ((m = pattern2.exec(html)) !== null) {
        const name = m[1].trim();
        if (name && !names.includes(name)) names.push(name);
      }
    }

    // Pola 3 (fallback): class="goog-tab" dan ambil innerText
    if (names.length === 0) {
      const pattern3 = /class=["'][^"']*goog-tab[^"']*["'][^>]*>([^<]+)</gi;
      while ((m = pattern3.exec(html)) !== null) {
        const name = m[1].trim();
        if (name && name.length > 0 && name.length < 100 && !names.includes(name)) {
          names.push(name);
        }
      }
    }

    if (names.length > 0) {
      console.log(`[SheetDiscovery] Ditemukan ${names.length} sheet:`, names);
      sheetDiscoveryCache = { timestamp: now, sheetNames: names };
      return names;
    }

    console.warn("[SheetDiscovery] Tidak ada nama sheet ditemukan dari htmlview.");
    return [];
  } catch (err) {
    console.warn("[SheetDiscovery] Gagal fetch htmlview:", err);
    return [];
  }
}

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatTanggalIndo(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][monthIdx] || "";
  return `${String(day).padStart(2, "0")} ${monthName} ${year}`;
}

function getHariIndo(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return NAMA_HARI[d.getUTCDay()] || "";
}

/**
 * Normalisasi nama gelara untuk konsistensi pencocokan antar-sheet.
 * Menangani: spasi ganda, non-breaking space, karakter invisible,
 * Unicode lookalikes, dan kapitalisasi tidak konsisten.
 */
export function normalizeGelaraName(rawName: string): string {
  return (
    rawName
      // Unicode normalization (NFC) – satukan karakter komposit
      .normalize("NFC")
      // Ganti semua jenis whitespace (termasuk \u00A0 non-breaking space) dengan spasi biasa
      .replace(/[\s\u00A0\u200B\u200C\u200D\uFEFF]+/g, " ")
      // Hapus karakter non-printable / control characters
      .replace(/[\x00-\x1F\x7F]/g, "")
      .trim()
      .toLowerCase()
      // Title-case setiap kata secara individual
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

/**
 * Generate kalender minggu (Senin - Minggu) untuk sebuah bulan
 */
export function generateWeeksForMonth(year: number, month: number): WeekPeriod[] {
  const weeks: WeekPeriod[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][month - 1];

  let currentStartDay = 1;
  let weekIndex = 1;

  while (currentStartDay <= daysInMonth) {
    const startDate = new Date(Date.UTC(year, month - 1, currentStartDay));
    const dayOfWeek = startDate.getUTCDay(); // 0 = Minggu, 1 = Senin, ...
    // Senin = 1, Minggu = 7
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    let endDay = currentStartDay + daysUntilSunday;
    if (endDay > daysInMonth) {
      endDay = daysInMonth;
    }

    const startDayStr = String(currentStartDay).padStart(2, "0");
    const endDayStr = String(endDay).padStart(2, "0");
    const startIso = `${year}-${String(month).padStart(2, "0")}-${startDayStr}`;
    const endIso = `${year}-${String(month).padStart(2, "0")}-${endDayStr}`;

    weeks.push({
      id: `w${weekIndex}`,
      label: `Minggu ${weekIndex} (${currentStartDay} ${monthName} - ${endDay} ${monthName} ${year})`,
      shortLabel: `Minggu ${weekIndex}`,
      startDate: startIso,
      endDate: endIso,
    });

    currentStartDay = endDay + 1;
    weekIndex++;
  }

  return weeks;
}

/**
 * Generate Sample Dataset realistis untuk September 2026
 * Sesuai contoh pada issue.md (16 sheet aktivitas, gelara: Adam Abdilah, Bakhita Akhtara Khairan, dll.)
 */
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

  // Specific deterministic absences for realistic testing matching issue.md
  // Contoh issue:
  // Adam Abdilah: 1 Sep (BANGUN TIDUR), 3 Sep (PIKET), 5 Sep (SHOLAT SUBUH)
  // Bakhita: 5 Sep (MANDI PAGI)
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
          // Pseudorandom deterministic pattern based on day, sheet length, and gelara
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

/**
 * Parsing CSV dari Google Sheet per sheet
 */
function parseCsvRows(csvText: string, activityName: string, year = 2026, month = 9): NormalizedActivityRecord[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const records: NormalizedActivityRecord[] = [];

  let nameColIdx = 2;
  const dateColMap: { colIdx: number; dateIso: string }[] = [];

  const row0 = parseCsvLine(lines[0]);
  const row1 = lines.length > 1 ? parseCsvLine(lines[1]) : [];

  // Find NAMA column in row 0 or row 1
  for (let i = 0; i < row0.length; i++) {
    const cell = row0[i].trim().toUpperCase();
    if (cell === "NAMA" || cell === "NAMA GELARA" || cell === "NAMA SANTRI") {
      nameColIdx = i;
      break;
    }
  }

  // Find day numbers in row 1 (or row 0 if single header)
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

  // Parse data rows
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

/**
 * Fetch all raw activity records from configured source or sample fallback
 */
export async function getRawDailyActivityRecords(): Promise<{
  records: NormalizedActivityRecord[];
  sourceType: "google-sheet" | "excel" | "sample";
}> {
  const now = Date.now();
  if (memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return { records: memoryCache.data, sourceType: memoryCache.sourceType };
  }

  const sheetUrl = process.env.DAILY_ACTIVITY_SHEET_URL;
  const sheetId = process.env.DAILY_ACTIVITY_SHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  // 1. Google Sheets API via Key
  if (sheetId && apiKey) {
    try {
      const records: NormalizedActivityRecord[] = [];
      const fetchPromises = ACTIVITY_SHEETS.map(async (sheetName) => {
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
              dateIso: `2026-09-${String(dayNum).padStart(2, "0")}`,
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
        memoryCache = { timestamp: now, data: records, sourceType: "google-sheet" };
        return { records, sourceType: "google-sheet" };
      }
    } catch (err) {
      console.warn("Google Sheets API fetch failed, falling back to sample data:", err);
    }
  }

  // 2. Google Sheets Published CSV via Sheet ID (tanpa API key)
  //    Gunakan auto-discovery nama sheet via htmlview, fallback ke ACTIVITY_SHEETS
  if (sheetId && !apiKey) {
    try {
      // Auto-discover nama sheet; jika gagal gunakan daftar hardcoded
      let sheetsToFetch: string[] = await discoverSheetNames(sheetId);
      if (sheetsToFetch.length === 0) {
        console.warn("[SheetDiscovery] Menggunakan daftar sheet hardcoded sebagai fallback.");
        sheetsToFetch = [...ACTIVITY_SHEETS];
      }

      const records: NormalizedActivityRecord[] = [];
      const fetchPromises = sheetsToFetch.map(async (sheetName) => {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return [];
        const csvText = await res.text();
        return parseCsvRows(csvText, sheetName);
      });

      const results = await Promise.all(fetchPromises);
      for (const sheetRes of results) {
        records.push(...sheetRes);
      }

      if (records.length > 0) {
        memoryCache = { timestamp: now, data: records, sourceType: "google-sheet" };
        return { records, sourceType: "google-sheet" };
      }
    } catch (err) {
      console.warn("Google Sheets CSV fetch failed, falling back to sample data:", err);
    }
  }

  // 3. Custom endpoint URL (e.g. Google Apps Script Web App returning JSON)
  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          memoryCache = { timestamp: now, data: json, sourceType: "google-sheet" };
          return { records: json, sourceType: "google-sheet" };
        }
      }
    } catch (err) {
      console.warn("Custom Sheet URL fetch failed, falling back to sample data:", err);
    }
  }

  // 4. Default Sample Data Fallback (September 2026)
  const sampleRecords = generateSampleData();
  memoryCache = { timestamp: now, data: sampleRecords, sourceType: "sample" };
  return { records: sampleRecords, sourceType: "sample" };
}

/**
 * Main function: Get aggregated daily activity data filtered by week, month, date, and gelara
 */
export async function getDailyActivityData(params?: {
  weekId?: string;
  monthId?: string;
  date?: string;
  gelara?: string;
}): Promise<DailyActivityDataResult> {
  const { records, sourceType } = await getRawDailyActivityRecords();

  const year = 2026;
  const month = 9;
  const monthId = params?.monthId || "2026-09";
  const monthPeriod: MonthPeriod = {
    id: monthId,
    label: "September 2026",
    year,
    month,
  };

  const availableMonths: MonthPeriod[] = [
    { id: "2026-09", label: "September 2026", year: 2026, month: 9 },
  ];

  const weeks = generateWeeksForMonth(year, month);
  // Default to Week 4 (or provided weekId)
  const defaultWeekId = "w4";
  const selectedWeekId = params?.weekId && weeks.some((w) => w.id === params.weekId)
    ? params.weekId
    : defaultWeekId;

  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || weeks[0];

  // Unique list of all gelara names — gunakan Map untuk dedup nama yang
  // secara visual sama tapi beda karakter tersembunyi (normalize sebagai key)
  const gelaraNamesMap = new Map<string, string>(); // key: lowercase-stripped → value: normalized
  records.forEach((r) => {
    const key = r.namaGelara.toLowerCase().replace(/\s+/g, "");
    if (!gelaraNamesMap.has(key)) {
      gelaraNamesMap.set(key, r.namaGelara);
    }
  });
  const allGelaraNames = Array.from(gelaraNamesMap.values()).sort((a, b) =>
    a.localeCompare(b, "id")
  );

  // Calculate monthly & weekly summaries for each gelara
  const gelaraSummaries: GelaraSummary[] = [];

  allGelaraNames.forEach((nama, idx) => {
    // Filter records for this gelara — gunakan key-based match agar nama dengan
    // karakter tersembunyi berbeda tetap dikenali sebagai orang yang sama
    const namaKey = nama.toLowerCase().replace(/\s+/g, "");
    const gelaraRecords = records.filter(
      (r) => r.namaGelara.toLowerCase().replace(/\s+/g, "") === namaKey
    );

    // Monthly aggregation
    const monthRecords = gelaraRecords.filter((r) => r.tanggal.startsWith(monthId));
    const totalTercatatBulanan = monthRecords.length;
    const jumlahABulanan = monthRecords.filter((r) => r.status === "A").length;
    const progressBulanan = totalTercatatBulanan > 0
      ? Number((((totalTercatatBulanan - jumlahABulanan) / totalTercatatBulanan) * 100).toFixed(1))
      : null;

    // Weekly aggregation (currentWeek.startDate <= tanggal <= currentWeek.endDate)
    const weekRecords = gelaraRecords.filter(
      (r) => r.tanggal >= currentWeek.startDate && r.tanggal <= currentWeek.endDate
    );
    const totalTercatatMingguan = weekRecords.length;
    const jumlahAMingguan = weekRecords.filter((r) => r.status === "A").length;
    const progressMingguan = totalTercatatMingguan > 0
      ? Number((((totalTercatatMingguan - jumlahAMingguan) / totalTercatatMingguan) * 100).toFixed(1))
      : null;

    gelaraSummaries.push({
      no: idx + 1,
      namaGelara: nama,
      progressMingguan,
      progressBulanan,
      jumlahAMingguan,
      jumlahABulanan,
      totalTercatatMingguan,
      totalTercatatBulanan,
    });
  });

  // Extract all absent records (status === 'A')
  let absentRecordsRaw = records.filter((r) => r.status === "A");

  // Apply filters to absent list if specified
  if (params?.date) {
    absentRecordsRaw = absentRecordsRaw.filter((r) => r.tanggal === params.date);
  } else if (params?.weekId) {
    absentRecordsRaw = absentRecordsRaw.filter(
      (r) => r.tanggal >= currentWeek.startDate && r.tanggal <= currentWeek.endDate
    );
  } else if (params?.monthId) {
    absentRecordsRaw = absentRecordsRaw.filter((r) => r.tanggal.startsWith(params.monthId!));
  }

  if (params?.gelara) {
    const qLower = params.gelara.toLowerCase();
    absentRecordsRaw = absentRecordsRaw.filter((r) =>
      r.namaGelara.toLowerCase().includes(qLower)
    );
  }

  // Sort by date ascending, then activity
  absentRecordsRaw.sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
    return a.aktivitas.localeCompare(b.aktivitas);
  });

  const absentActivities: AbsentActivityRecord[] = absentRecordsRaw.map((r, i) => ({
    id: `${r.tanggal}-${r.namaGelara}-${r.aktivitas}-${i}`,
    tanggal: r.tanggal,
    tanggalFormatted: formatTanggalIndo(r.tanggal),
    hari: getHariIndo(r.tanggal),
    namaGelara: r.namaGelara,
    aktivitas: r.aktivitas,
  }));

  const totalActivitiesCount = records.length;
  const totalAbsentCount = records.filter((r) => r.status === "A").length;

  return {
    month: monthPeriod,
    availableMonths,
    weeks,
    selectedWeekId,
    selectedMonthId: monthId,
    gelaraSummaries,
    absentActivities,
    allGelaraNames,
    totalActivitiesCount,
    totalAbsentCount,
    sourceType,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get individual detail for a specific Gelara
 */
export async function getGelaraDetail(
  namaGelara: string,
  weekId?: string,
  monthId = "2026-09"
) {
  const data = await getDailyActivityData({ weekId, monthId });
  const summary = data.gelaraSummaries.find(
    (s) => s.namaGelara.toLowerCase() === namaGelara.toLowerCase()
  );

  const currentWeek = data.weeks.find((w) => w.id === data.selectedWeekId) || data.weeks[0];

  const absentWeekly = data.absentActivities.filter(
    (a) =>
      a.namaGelara.toLowerCase() === namaGelara.toLowerCase() &&
      a.tanggal >= currentWeek.startDate &&
      a.tanggal <= currentWeek.endDate
  );

  const absentMonthly = data.absentActivities.filter(
    (a) =>
      a.namaGelara.toLowerCase() === namaGelara.toLowerCase() &&
      a.tanggal.startsWith(monthId)
  );

  return {
    summary: summary || null,
    currentWeek,
    absentWeekly,
    absentMonthly,
  };
}
