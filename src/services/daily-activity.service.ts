import { jakartaDateParts } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import {
  getRawDailyActivityRecords,
  normalizeGelaraName,
  getConfiguredSheetMap,
  getActiveYearAndMonth,
  ACTIVITY_SHEETS,
  SHOLAT_SHEETS,
  type NormalizedActivityRecord,
  type ActivityStatus,
} from "./daily-activity-ingestion";

/**
 * Re-export Ingestion Adapter primitives for backward compatibility
 */
export {
  getRawDailyActivityRecords,
  normalizeGelaraName,
  getConfiguredSheetMap,
  getActiveYearAndMonth,
  ACTIVITY_SHEETS,
  SHOLAT_SHEETS,
  type NormalizedActivityRecord,
  type ActivityStatus,
};

export type ActivityName = string;

export interface KelasStatistik {
  kelas: string;
  jumlahSantri: number;
  santriNames: string[];
  sholatProgress: number | null;
  sholatTotalTercatat: number;
  sholatAlpha: number;
  sholatSakit: number;
  sholatIzin: number;
  overallProgress: number | null;
  overallTotalTercatat: number;
  overallAlpha: number;
  overallSakit: number;
  overallIzin: number;
}

export interface AbsentActivityRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  tanggalFormatted: string; // e.g. "03 Sep 2026"
  hari: string; // e.g. "Kamis"
  namaGelara: string;
  aktivitas: string;
  status: ActivityStatus;
}

export interface GelaraSummary {
  no: number;
  namaGelara: string;
  progressMingguan: number | null;
  progressBulanan: number | null;
  jumlahAMingguan: number;
  jumlahABulanan: number;
  jumlahSMingguan: number;
  jumlahSBulanan: number;
  jumlahIMingguan: number;
  jumlahIBulanan: number;
  totalTercatatMingguan: number;
  totalTercatatBulanan: number;
}

export interface WeekPeriod {
  id: string;
  label: string;
  shortLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent?: boolean;
}

export interface MonthPeriod {
  id: string;
  label: string;
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
  totalSheetsCount: number;
  sheetNames: string[];
  sourceType: "google-sheet" | "excel" | "sample";
  lastUpdated: string;
  kelasStatistikMingguan?: KelasStatistik[];
  kelasStatistikBulanan?: KelasStatistik[];
}

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
    const dayOfWeek = startDate.getUTCDay();
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
 * Main query facade: Get aggregated daily activity data filtered by week, month, date, and gelara
 */
export async function getDailyActivityData(params?: {
  weekId?: string;
  monthId?: string;
  date?: string;
  gelara?: string;
}): Promise<DailyActivityDataResult> {
  const defaultPeriod = getActiveYearAndMonth();
  const requestedMonthId = params?.monthId || defaultPeriod.monthId;
  const { records, sourceType, sheetNames } = await getRawDailyActivityRecords(requestedMonthId);

  const activeSheetNames = sheetNames && sheetNames.length > 0
    ? sheetNames
    : Array.from(new Set(records.map((r) => r.aktivitas).filter(Boolean)));
  const totalSheetsCount = activeSheetNames.length;

  const monthId = requestedMonthId;
  const [year, month] = monthId.split("-").map((s) => parseInt(s, 10));

  const monthName = NAMA_BULAN[month - 1] || "Bulan";
  const monthPeriod: MonthPeriod = {
    id: monthId,
    label: `${monthName} ${year}`,
    year,
    month,
  };

  const monthSet = new Set<string>();
  const sheetMap = getConfiguredSheetMap();
  Object.keys(sheetMap).forEach((mId) => monthSet.add(mId));

  records.forEach((r) => {
    if (r.tanggal && /^\d{4}-\d{2}/.test(r.tanggal)) {
      monthSet.add(r.tanggal.slice(0, 7));
    }
  });
  if (monthSet.size === 0) {
    monthSet.add(defaultPeriod.monthId);
  }

  const availableMonths: MonthPeriod[] = Array.from(monthSet)
    .sort()
    .map((mId) => {
      const [y, m] = mId.split("-").map((s) => parseInt(s, 10));
      const mName = NAMA_BULAN[m - 1] || "";
      return {
        id: mId,
        label: `${mName} ${y}`,
        year: y,
        month: m,
      };
    });

  const weeks = generateWeeksForMonth(year, month);
  const { year: curY, month: curM, day: curD } = jakartaDateParts();
  const todayIso = `${curY}-${String(curM).padStart(2, "0")}-${String(curD).padStart(2, "0")}`;
  const todayWeek = weeks.find((w) => todayIso >= w.startDate && todayIso <= w.endDate);
  const defaultWeekId = todayWeek?.id || weeks[0]?.id || "w1";
  const selectedWeekId = params?.weekId && weeks.some((w) => w.id === params.weekId)
    ? params.weekId
    : defaultWeekId;

  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || weeks[0];

  const gelaraNamesMap = new Map<string, string>();
  records.forEach((r) => {
    const key = r.namaGelara.toLowerCase().replace(/\s+/g, "");
    if (!gelaraNamesMap.has(key)) {
      gelaraNamesMap.set(key, r.namaGelara);
    }
  });
  const allGelaraNames = Array.from(gelaraNamesMap.values()).sort((a, b) =>
    a.localeCompare(b, "id")
  );

  const gelaraSummaries: GelaraSummary[] = [];

  allGelaraNames.forEach((nama, idx) => {
    const namaKey = nama.toLowerCase().replace(/\s+/g, "");
    const gelaraRecords = records.filter(
      (r) => r.namaGelara.toLowerCase().replace(/\s+/g, "") === namaKey
    );

    const monthRecords = gelaraRecords.filter((r) => r.tanggal.startsWith(monthId));
    const totalTercatatBulanan = monthRecords.length;
    const jumlahABulanan = monthRecords.filter((r) => r.status === "A").length;
    const jumlahSBulanan = monthRecords.filter((r) => r.status === "S").length;
    const jumlahIBulanan = monthRecords.filter((r) => r.status === "I").length;
    const totalTidakHadirBulanan = jumlahABulanan + jumlahSBulanan + jumlahIBulanan;
    const progressBulanan = totalTercatatBulanan > 0
      ? Number((((totalTercatatBulanan - totalTidakHadirBulanan) / totalTercatatBulanan) * 100).toFixed(1))
      : null;

    const weekRecords = gelaraRecords.filter(
      (r) => r.tanggal >= currentWeek.startDate && r.tanggal <= currentWeek.endDate
    );
    const totalTercatatMingguan = weekRecords.length;
    const jumlahAMingguan = weekRecords.filter((r) => r.status === "A").length;
    const jumlahSMingguan = weekRecords.filter((r) => r.status === "S").length;
    const jumlahIMingguan = weekRecords.filter((r) => r.status === "I").length;
    const totalTidakHadirMingguan = jumlahAMingguan + jumlahSMingguan + jumlahIMingguan;
    const progressMingguan = totalTercatatMingguan > 0
      ? Number((((totalTercatatMingguan - totalTidakHadirMingguan) / totalTercatatMingguan) * 100).toFixed(1))
      : null;

    gelaraSummaries.push({
      no: idx + 1,
      namaGelara: nama,
      progressMingguan,
      progressBulanan,
      jumlahAMingguan,
      jumlahABulanan,
      jumlahSMingguan,
      jumlahSBulanan,
      jumlahIMingguan,
      jumlahIBulanan,
      totalTercatatMingguan,
      totalTercatatBulanan,
    });
  });

  let absentRecordsRaw = records.filter((r) => ["A", "S", "I"].includes(r.status));

  if (params?.date) {
    absentRecordsRaw = absentRecordsRaw.filter((r) => r.tanggal === params.date);
  } else {
    absentRecordsRaw = absentRecordsRaw.filter((r) => r.tanggal.startsWith(monthId));
  }

  if (params?.gelara) {
    const qLower = params.gelara.toLowerCase();
    absentRecordsRaw = absentRecordsRaw.filter((r) =>
      r.namaGelara.toLowerCase().includes(qLower)
    );
  }

  absentRecordsRaw.sort((a, b) => {
    if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
    return a.aktivitas.localeCompare(b.aktivitas);
  });

  const absentActivities: AbsentActivityRecord[] = absentRecordsRaw.map((r, i) => ({
    id: `${r.tanggal}-${r.namaGelara}-${r.aktivitas}-${r.status}-${i}`,
    tanggal: r.tanggal,
    tanggalFormatted: formatTanggalIndo(r.tanggal),
    hari: getHariIndo(r.tanggal),
    namaGelara: r.namaGelara,
    aktivitas: r.aktivitas,
    status: r.status,
  }));

  const totalActivitiesCount = records.length;
  const totalAbsentCount = records.filter((r) => r.status === "A").length;

  let santriUsers: { name: string; kelas: string | null }[] = [];
  try {
    const { data: usersData } = await supabase
      .from("users")
      .select("name, kelas")
      .eq("role", "SANTRI")
      .eq("is_active", true);
    if (usersData) santriUsers = usersData;
  } catch (err) {
    console.warn("Gagal mengambil data user santri untuk statistik kelas:", err);
  }

  const userKeyToKelasMap = new Map<string, string>();
  for (const u of santriUsers) {
    if (u.kelas?.trim()) {
      const k = u.kelas.trim();
      userKeyToKelasMap.set(u.name.toLowerCase().replace(/\s+/g, ""), k);
      userKeyToKelasMap.set(normalizeGelaraName(u.name).toLowerCase().replace(/\s+/g, ""), k);
    }
  }

  const resolveKelas = (rawName: string): string => {
    const key = rawName.toLowerCase().replace(/\s+/g, "");
    if (userKeyToKelasMap.has(key)) return userKeyToKelasMap.get(key)!;
    for (const [userKey, kelas] of userKeyToKelasMap.entries()) {
      if (userKey.startsWith(key) || key.startsWith(userKey)) {
        return kelas;
      }
    }
    return "Tanpa Kelas";
  };

  const kelasToSantriMap = new Map<string, string[]>();
  const allClassesSet = new Set<string>();

  for (const u of santriUsers) {
    if (u.kelas?.trim()) allClassesSet.add(u.kelas.trim());
  }

  allGelaraNames.forEach((nama) => {
    const kelas = resolveKelas(nama);
    if (kelas !== "Tanpa Kelas") allClassesSet.add(kelas);

    const list = kelasToSantriMap.get(kelas) || [];
    if (!list.includes(nama)) list.push(nama);
    kelasToSantriMap.set(kelas, list);
  });

  const sortedClasses = Array.from(allClassesSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
  if ((kelasToSantriMap.get("Tanpa Kelas")?.length || 0) > 0) {
    sortedClasses.push("Tanpa Kelas");
  }

  const getRecordKelas = (r: NormalizedActivityRecord): string => {
    return resolveKelas(r.namaGelara);
  };

  const isSholat = (act: string) => (SHOLAT_SHEETS as readonly string[]).includes(act.trim().toUpperCase());

  const calcStats = (recs: NormalizedActivityRecord[], k: string): KelasStatistik => {
    const santriInClass = kelasToSantriMap.get(k) || [];
    const sholatRecs = recs.filter((r) => isSholat(r.aktivitas));
    const sholatTotal = sholatRecs.length;
    const sholatAlpha = sholatRecs.filter((r) => r.status === "A").length;
    const sholatSakit = sholatRecs.filter((r) => r.status === "S").length;
    const sholatIzin = sholatRecs.filter((r) => r.status === "I").length;
    const sholatAbsen = sholatAlpha + sholatSakit + sholatIzin;
    const sholatProgress = sholatTotal > 0 ? Number((((sholatTotal - sholatAbsen) / sholatTotal) * 100).toFixed(1)) : null;

    const overallTotal = recs.length;
    const overallAlpha = recs.filter((r) => r.status === "A").length;
    const overallSakit = recs.filter((r) => r.status === "S").length;
    const overallIzin = recs.filter((r) => r.status === "I").length;
    const overallAbsen = overallAlpha + overallSakit + overallIzin;
    const overallProgress = overallTotal > 0 ? Number((((overallTotal - overallAbsen) / overallTotal) * 100).toFixed(1)) : null;

    return {
      kelas: k,
      jumlahSantri: santriInClass.length,
      santriNames: santriInClass,
      sholatProgress,
      sholatTotalTercatat: sholatTotal,
      sholatAlpha,
      sholatSakit,
      sholatIzin,
      overallProgress,
      overallTotalTercatat: overallTotal,
      overallAlpha,
      overallSakit,
      overallIzin,
    };
  };

  const weekRecs = records.filter((r) => r.tanggal >= currentWeek.startDate && r.tanggal <= currentWeek.endDate);
  const monthRecs = records.filter((r) => r.tanggal.startsWith(monthId));

  const kelasStatistikMingguan: KelasStatistik[] = sortedClasses.map((k) =>
    calcStats(weekRecs.filter((r) => getRecordKelas(r) === k), k)
  );
  const kelasStatistikBulanan: KelasStatistik[] = sortedClasses.map((k) =>
    calcStats(monthRecs.filter((r) => getRecordKelas(r) === k), k)
  );

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
    totalSheetsCount,
    sheetNames: activeSheetNames,
    sourceType,
    lastUpdated: new Date().toISOString(),
    kelasStatistikMingguan,
    kelasStatistikBulanan,
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

export async function getStatistikPerKelas(params?: {
  weekId?: string;
  monthId?: string;
  periode?: "mingguan" | "bulanan";
}): Promise<KelasStatistik[]> {
  const data = await getDailyActivityData({ weekId: params?.weekId, monthId: params?.monthId });
  return params?.periode === "bulanan"
    ? data.kelasStatistikBulanan || []
    : data.kelasStatistikMingguan || [];
}
