import { supabase } from "@/lib/supabase";
import type { IzinRowWithUserJoin, StatusIzin, JenisIzin } from "@/lib/types";
import { sendNotificationToPengurus, sendNotificationToUser } from "@/services/notification.service";

export async function syncScheduledIzinStatuses(): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("izin")
    .update({ status: "SEDANG_KELUAR", updated_at: now })
    .eq("status", "DISETUJUI")
    .lte("tanggal_keluar", now);

  if (error) {
    console.error("Gagal menyinkronkan status izin otomatis:", error.message);
  }
}

export async function getRiwayatIzinSantri(userId: number): Promise<IzinRowWithUserJoin[]> {
  const { data, error } = await supabase
    .from("izin")
    .select("*, approved_by_user:users!izin_approved_by_fkey(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Gagal mengambil riwayat izin santri:", error.message);
    return [];
  }
  return (data ?? []) as unknown as IzinRowWithUserJoin[];
}

export async function getIzinCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("izin")
    .select("status", { count: "exact", head: false });

  const counts = { MENUNGGU: 0, DISETUJUI: 0, SEDANG_KELUAR: 0, SUDAH_KEMBALI: 0, DITOLAK: 0 } as Record<string, number>;
  if (error) {
    console.error("Gagal mengambil statistik izin:", error.message);
    return counts;
  }

  for (const row of data ?? []) {
    if (row.status in counts) counts[row.status]++;
  }
  return counts;
}

export async function getIzinKeluarHariIni(dayStart: string, dayEnd: string): Promise<IzinRowWithUserJoin[]> {
  const { data, error } = await supabase
    .from("izin")
    .select("*, users!izin_user_id_fkey(name, kamar), approved_by_user:users!izin_approved_by_fkey(name)")
    .lt("tanggal_keluar", dayEnd)
    .gt("perkiraan_kembali", dayStart)
    .in("status", ["DISETUJUI", "SEDANG_KELUAR"]);

  if (error) {
    console.error("Gagal mengambil izin hari ini:", error.message);
    return [];
  }
  return (data ?? []) as unknown as IzinRowWithUserJoin[];
}

export async function fetchPagedIzin(
  page: number,
  pageSize: number,
  status?: StatusIzin,
  q?: string
): Promise<{ data: IzinRowWithUserJoin[]; count: number }> {
  let query = supabase
    .from("izin")
    .select("*, users!izin_user_id_fkey(name, kamar), approved_by_user:users!izin_approved_by_fkey(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status) query = query.eq("status", status);
  if (q) {
    const { data: users } = await supabase.from("users").select("id").ilike("name", `%${q}%`).eq("role", "SANTRI");
    const userIds = (users ?? []).map((u) => u.id);
    query = query.in("user_id", userIds.length ? userIds : [-1]);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("Gagal mengambil paged izin:", error.message);
    return { data: [], count: 0 };
  }

  return {
    data: (data ?? []) as unknown as IzinRowWithUserJoin[],
    count: count ?? 0,
  };
}

export async function checkActiveIzinConflict(
  userId: number,
  tanggalKeluarISO: string,
  perkiraanKembaliISO: string
): Promise<{ hasConflict: boolean; error?: string }> {
  const { data: activeRequests, error } = await supabase
    .from("izin")
    .select("id, tanggal_keluar, perkiraan_kembali, status")
    .eq("user_id", userId)
    .in("status", ["MENUNGGU", "DISETUJUI", "SEDANG_KELUAR"])
    .lt("tanggal_keluar", perkiraanKembaliISO)
    .gt("perkiraan_kembali", tanggalKeluarISO);

  if (error) {
    return { hasConflict: false, error: `Gagal memeriksa jadwal izin: ${error.message}` };
  }

  return { hasConflict: (activeRequests ?? []).length > 0 };
}

export async function createIzin(
  userId: number,
  jenis_izin: JenisIzin,
  alasan: string,
  tujuan: string,
  tanggal_keluar: string,
  perkiraan_kembali: string
): Promise<{ error?: string }> {
  const { data: inserted, error } = await supabase
    .from("izin")
    .insert({
      user_id: userId,
      jenis_izin,
      alasan,
      tujuan,
      tanggal_keluar,
      perkiraan_kembali,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: `Gagal menyimpan pengajuan: ${error?.message}` };
  }

  await supabase.from("izin_logs").insert({
    izin_id: inserted.id,
    actor_id: userId,
    action: "AJUKAN",
    new_status: "MENUNGGU",
    catatan: null,
  });

  // Trigger push notification to all Pengurus asynchronously
  sendNotificationToPengurus({
    title: "Pengajuan Izin Baru",
    body: `Ada pengajuan izin baru (${jenis_izin}) untuk alasan: ${alasan}`,
    url: "/admin",
  }).catch((err) => console.error("Gagal mengirim notifikasi pengajuan:", err));

  return {};
}

export async function getCurrentIzinStatus(id: number) {
  const { data, error } = await supabase
    .from("izin")
    .select("id, user_id, status, tanggal_keluar, perkiraan_kembali")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function approveIzin(
  id: number,
  actorId: number,
  nextStatus: "DISETUJUI" | "SEDANG_KELUAR"
): Promise<{ error?: string }> {
  const now = new Date().toISOString();

  // Get izin target user before update
  const current = await getCurrentIzinStatus(id);

  const { error } = await supabase
    .from("izin")
    .update({
      status: nextStatus,
      approved_by: actorId,
      approved_at: now,
      catatan_admin: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "MENUNGGU");

  if (error) return { error: `Gagal menyetujui: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "SETUJUI",
    old_status: "MENUNGGU",
    new_status: nextStatus,
    catatan: null,
  });

  if (current?.user_id) {
    sendNotificationToUser(current.user_id, {
      title: "Izin Disetujui",
      body: "Pengajuan izin Anda telah disetujui oleh pengurus.",
      url: "/beranda",
    }).catch((err) => console.error("Gagal mengirim notifikasi persetujuan:", err));
  }

  return {};
}

export async function rejectIzin(
  id: number,
  actorId: number,
  catatan: string
): Promise<{ error?: string }> {
  const now = new Date().toISOString();

  // Get izin target user before update
  const current = await getCurrentIzinStatus(id);

  const { error } = await supabase
    .from("izin")
    .update({
      status: "DITOLAK",
      approved_by: actorId,
      approved_at: now,
      catatan_admin: catatan,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "MENUNGGU");

  if (error) return { error: `Gagal menolak: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "TOLAK",
    old_status: "MENUNGGU",
    new_status: "DITOLAK",
    catatan,
  });

  if (current?.user_id) {
    sendNotificationToUser(current.user_id, {
      title: "Izin Ditolak",
      body: `Pengajuan izin Anda ditolak. Catatan: ${catatan}`,
      url: "/beranda",
    }).catch((err) => console.error("Gagal mengirim notifikasi penolakan:", err));
  }

  return {};
}

export async function markIzinReturned(
  id: number,
  userId: number,
  returnedAt: string,
  returnStatus: "TEPAT_WAKTU" | "TERLAMBAT",
  lateMinutes: number,
  santriName: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("izin")
    .update({
      status: "SUDAH_KEMBALI",
      returned_at: returnedAt,
      return_status: returnStatus,
      late_minutes: lateMinutes,
      updated_at: returnedAt,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "SEDANG_KELUAR");

  if (error) return { error: `Gagal mencatat kepulangan: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: userId,
    action: "KEMBALI",
    old_status: "SEDANG_KELUAR",
    new_status: "SUDAH_KEMBALI",
    catatan: returnStatus === "TERLAMBAT" ? `Terlambat ${lateMinutes} menit.` : "Kembali tepat waktu.",
  });

  // Trigger push notification to all Pengurus asynchronously
  const statusText =
    returnStatus === "TERLAMBAT"
      ? `terlambat ${lateMinutes} menit`
      : "tepat waktu";

  sendNotificationToPengurus({
    title: "Santri Sudah Kembali",
    body: `${santriName} telah kembali ke asrama (${statusText}).`,
    url: "/admin",
  }).catch((err) => console.error("Gagal mengirim notifikasi kepulangan:", err));

  return {};
}