export type Role = "SANTRI" | "PENGURUS";

export type JenisIzin = "HARIAN" | "MENGINAP" | "REKREASI" | "KELUARGA" | "DARURAT";

export type StatusIzin =
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "SEDANG_KELUAR"
  | "SUDAH_KEMBALI"
  | "TIDAK_JADI";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  role: Role;
  kamar: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IzinRow {
  id: number;
  user_id: number;
  jenis_izin: JenisIzin;
  alasan: string;
  tujuan: string;
  tanggal_keluar: string;
  perkiraan_kembali: string;
  status: StatusIzin;
  catatan_admin: string | null;
  approved_by: number | null;
  approved_at: string | null;
  returned_at: string | null;
  return_status: "TEPAT_WAKTU" | "TERLAMBAT" | null;
  late_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface IzinWithSantri extends IzinRow {
  nama_santri: string;
  kamar: string | null;
  nama_penyetuju: string | null;
}

export interface IzinRowWithUserJoin extends IzinRow {
  users: { name: string; kamar: string | null } | null;
  approved_by_user?: { name: string } | null;
}

export const JENIS_IZIN_LABEL: Record<JenisIzin, string> = {
  HARIAN: "Izin harian",
  MENGINAP: "Izin menginap",
  REKREASI: "Rekreasi",
  KELUARGA: "Keperluan keluarga",
  DARURAT: "Darurat",
};
