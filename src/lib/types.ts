import type { Database } from "@/types/database.types";

export type Role = Database["public"]["Tables"]["users"]["Row"]["role"];

export type JenisIzin = Database["public"]["Tables"]["izin"]["Row"]["jenis_izin"];

export type StatusIzin = Database["public"]["Tables"]["izin"]["Row"]["status"];

export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type IzinRow = Database["public"]["Tables"]["izin"]["Row"];

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
