import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchIzinForExport } from "@/services/izin.service";
import { buildLaporanIzinExcel } from "@/lib/excel";
import { wibInputToISOString } from "@/lib/format";
import type { StatusIzin, JenisIzin } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PENGURUS") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start"); // YYYY-MM-DD
  const endDate = searchParams.get("end");     // YYYY-MM-DD
  const status = searchParams.get("status") as StatusIzin | null;
  const jenisIzin = searchParams.get("jenis") as JenisIzin | null;

  const rows = await fetchIzinForExport({
    startDateISO: startDate ? wibInputToISOString(`${startDate}T00:00`) ?? undefined : undefined,
    endDateISO: endDate ? wibInputToISOString(`${endDate}T23:59`) ?? undefined : undefined,
    status: status ?? undefined,
    jenisIzin: jenisIzin ?? undefined,
  });

  const buffer = await buildLaporanIzinExcel(rows);
  const filename = `laporan-izin-${startDate ?? "semua"}-${endDate ?? "semua"}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
