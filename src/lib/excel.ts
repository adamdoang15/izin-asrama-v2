import ExcelJS from "exceljs";
import type { IzinRowWithUserJoin } from "@/lib/types";
import { JENIS_IZIN_LABEL } from "@/lib/types";
import { formatTanggalWaktu } from "@/lib/format";

export async function buildLaporanIzinExcel(
  rows: IzinRowWithUserJoin[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Izin Asrama";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Laporan Izin");

  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "Nama Gelara", key: "nama_santri", width: 22 },
    { header: "Kamar", key: "kamar", width: 12 },
    { header: "Jenis Izin", key: "jenis_izin", width: 16 },
    { header: "Tujuan", key: "tujuan", width: 28 },
    { header: "Alasan", key: "alasan", width: 30 },
    { header: "Tanggal Keluar", key: "tanggal_keluar", width: 26 },
    { header: "Perkiraan Kembali", key: "perkiraan_kembali", width: 26 },
    { header: "Status", key: "status", width: 16 },
    { header: "Disetujui Oleh", key: "approved_by", width: 20 },
    { header: "Waktu Disetujui", key: "approved_at", width: 26 },
    { header: "Waktu Kembali", key: "returned_at", width: 26 },
    { header: "Status Kembali", key: "return_status", width: 16 },
    { header: "Terlambat (menit)", key: "late_minutes", width: 18 },
    { header: "Catatan Petugas", key: "catatan_admin", width: 30 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" },
  };
  headerRow.alignment = { vertical: "middle" };

  rows.forEach((row, index) => {
    sheet.addRow({
      no: index + 1,
      nama_santri: row.users?.name ?? "Tidak diketahui",
      kamar: row.users?.kamar ?? "-",
      jenis_izin: JENIS_IZIN_LABEL[row.jenis_izin],
      tujuan: row.tujuan,
      alasan: row.alasan,
      tanggal_keluar: formatTanggalWaktu(row.tanggal_keluar),
      perkiraan_kembali: formatTanggalWaktu(row.perkiraan_kembali),
      status: row.status.replaceAll("_", " "),
      approved_by: row.approved_by_user?.name ?? "-",
      approved_at: formatTanggalWaktu(row.approved_at),
      returned_at: formatTanggalWaktu(row.returned_at),
      return_status: row.return_status ?? "-",
      late_minutes: row.late_minutes ?? "-",
      catatan_admin: row.catatan_admin ?? "-",
    });
  });

  sheet.autoFilter = { from: "A1", to: "O1" };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
