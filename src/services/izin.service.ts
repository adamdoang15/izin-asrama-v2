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
    .neq("status", "DIHAPUS")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Gagal mengambil riwayat izin gelara:", error.message);
    return [];
  }
  return (data ?? []) as unknown as IzinRowWithUserJoin[];
}

export async function getIzinCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("izin")
    .select("status", { count: "exact", head: false });

  const counts = { MENUNGGU: 0, PERLU_REVISI: 0, DISETUJUI: 0, SEDANG_KELUAR: 0, SUDAH_KEMBALI: 0, DITOLAK: 0 } as Record<string, number>;
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

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.neq("status", "DIHAPUS");
  }
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

export interface IzinExportFilter {
  startDateISO?: string;
  endDateISO?: string;
  status?: StatusIzin;
  jenisIzin?: JenisIzin;
}

export async function fetchIzinForExport(
  filter: IzinExportFilter
): Promise<IzinRowWithUserJoin[]> {
  let query = supabase
    .from("izin")
    .select("*, users!izin_user_id_fkey(name, kamar), approved_by_user:users!izin_approved_by_fkey(name)")
    .order("tanggal_keluar", { ascending: false });

  if (filter.startDateISO) query = query.gte("tanggal_keluar", filter.startDateISO);
  if (filter.endDateISO) query = query.lt("tanggal_keluar", filter.endDateISO);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.jenisIzin) query = query.eq("jenis_izin", filter.jenisIzin);

  const { data, error } = await query;
  if (error) {
    console.error("Gagal mengambil data izin untuk ekspor:", error.message);
    return [];
  }
  return (data ?? []) as unknown as IzinRowWithUserJoin[];
}

export async function checkActiveIzinConflict(
  userId: number,
  tanggalKeluarISO: string,
  perkiraanKembaliISO: string,
  excludeId?: number
): Promise<{ hasConflict: boolean; error?: string }> {
  let query = supabase
    .from("izin")
    .select("id, tanggal_keluar, perkiraan_kembali, status")
    .eq("user_id", userId)
    .in("status", ["MENUNGGU", "DISETUJUI", "SEDANG_KELUAR"])
    .lt("tanggal_keluar", perkiraanKembaliISO)
    .gt("perkiraan_kembali", tanggalKeluarISO);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data: activeRequests, error } = await query;

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
  // Check blacklist status
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("is_blacklisted, blacklist_reason")
    .eq("id", userId)
    .single();

  if (userError) {
    return { error: `Gagal mengonfirmasi status pengguna: ${userError.message}` };
  }

  if (user?.is_blacklisted) {
    const reasonText = user.blacklist_reason ? ` (Alasan: ${user.blacklist_reason})` : "";
    return { error: `Anda sedang diblacklist dan tidak dapat mengajukan izin keluar${reasonText}.` };
  }

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

  // Trigger push notification to all Pengurus
  await sendNotificationToPengurus({
    title: "Pengajuan Izin Baru",
    body: `Ada pengajuan izin baru (${jenis_izin}) untuk alasan: ${alasan}`,
    url: "/beranda",
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
    await sendNotificationToUser(current.user_id, {
      title: "Izin Disetujui",
      body: "Pengajuan izin Anda telah disetujui oleh petugas.",
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
    await sendNotificationToUser(current.user_id, {
      title: "Izin Ditolak",
      body: `Pengajuan izin Anda ditolak. Catatan: ${catatan}`,
      url: "/beranda",
    }).catch((err) => console.error("Gagal mengirim notifikasi penolakan:", err));
  }

  return {};
}

export async function requestIzinRevision(
  id: number,
  actorId: number,
  catatan: string
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const current = await getCurrentIzinStatus(id);
  if (!current) return { error: "Pengajuan tidak ditemukan." };

  const { error } = await supabase
    .from("izin")
    .update({
      status: "PERLU_REVISI",
      catatan_admin: catatan,
      updated_at: now,
    })
    .eq("id", id)
    .eq("status", "MENUNGGU"); // jaga-jaga race condition, sama seperti approveIzin/rejectIzin

  if (error) return { error: `Gagal meminta revisi: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "MINTA_REVISI",
    old_status: "MENUNGGU",
    new_status: "PERLU_REVISI",
    catatan,
  });

  if (current.user_id) {
    await sendNotificationToUser(current.user_id, {
      title: "Pengajuan Izin Perlu Direvisi",
      body: `Catatan dari petugas: ${catatan}`,
      url: "/beranda",
    }).catch((err) => console.error("Gagal mengirim notifikasi minta revisi:", err));
  }

  return {};
}

export interface SubmitRevisionInput {
  jenis_izin: JenisIzin;
  alasan: string;
  tujuan: string;
  tanggal_keluar: string;      // ISO string
  perkiraan_kembali: string;   // ISO string
}

export async function submitIzinRevision(
  id: number,
  userId: number,
  santriName: string,
  input: SubmitRevisionInput
): Promise<{ error?: string }> {
  const now = new Date().toISOString();

  // Ambil data lama untuk snapshot log & validasi kepemilikan/status
  const { data: before, error: beforeError } = await supabase
    .from("izin")
    .select("id, user_id, status, jenis_izin, alasan, tujuan, tanggal_keluar, perkiraan_kembali")
    .eq("id", id)
    .maybeSingle();

  if (beforeError || !before) return { error: "Pengajuan tidak ditemukan." };
  if (before.user_id !== userId) return { error: "Anda tidak memiliki akses ke pengajuan ini." };
  if (before.status !== "PERLU_REVISI") return { error: "Pengajuan ini tidak sedang menunggu revisi Anda." };

  const { error } = await supabase
    .from("izin")
    .update({
      jenis_izin: input.jenis_izin,
      alasan: input.alasan,
      tujuan: input.tujuan,
      tanggal_keluar: input.tanggal_keluar,
      perkiraan_kembali: input.perkiraan_kembali,
      status: "MENUNGGU",
      catatan_admin: null,
      updated_at: now,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "PERLU_REVISI"); // jaga-jaga race condition

  if (error) return { error: `Gagal mengirim ulang revisi: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: userId,
    action: "KIRIM_REVISI",
    old_status: "PERLU_REVISI",
    new_status: "MENUNGGU",
    catatan: null,
    data_sebelum: {
      jenis_izin: before.jenis_izin,
      alasan: before.alasan,
      tujuan: before.tujuan,
      tanggal_keluar: before.tanggal_keluar,
      perkiraan_kembali: before.perkiraan_kembali,
    },
    data_sesudah: {
      jenis_izin: input.jenis_izin,
      alasan: input.alasan,
      tujuan: input.tujuan,
      tanggal_keluar: input.tanggal_keluar,
      perkiraan_kembali: input.perkiraan_kembali,
    },
  });

  await sendNotificationToPengurus({
    title: "Revisi Pengajuan Izin Dikirim",
    body: `${santriName} telah mengirim ulang pengajuan yang direvisi, mohon ditinjau.`,
    url: "/beranda",
  }).catch((err) => console.error("Gagal mengirim notifikasi kirim revisi:", err));

  return {};
}

export async function markIzinReturned(
  id: number,
  userId: number,
  returnedAt: string,
  returnStatus: "TEPAT_WAKTU" | "TERLAMBAT",
  lateMinutes: number,
  santriName: string,
  locationInfo?: { latitude: number; longitude: number; distance: number }
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

  const statusCatatan = returnStatus === "TERLAMBAT" ? `Terlambat ${lateMinutes} menit.` : "Kembali tepat waktu.";
  const locationCatatan = locationInfo
    ? ` [Lokasi GPS: ${locationInfo.latitude.toFixed(6)}, ${locationInfo.longitude.toFixed(6)} (Jarak: ${locationInfo.distance}m)]`
    : "";

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: userId,
    action: "KEMBALI",
    old_status: "SEDANG_KELUAR",
    new_status: "SUDAH_KEMBALI",
    catatan: `${statusCatatan}${locationCatatan}`,
  });

  // Trigger push notification to all Pengurus
  const statusText =
    returnStatus === "TERLAMBAT"
      ? `terlambat ${lateMinutes} menit`
      : "tepat waktu";

  await sendNotificationToPengurus({
    title: "Gelara Sudah Kembali",
    body: `${santriName} telah kembali ke asrama (${statusText}).`,
    url: "/beranda",
  }).catch((err) => console.error("Gagal mengirim notifikasi kepulangan:", err));

  return {};
}

export async function getIzinFullById(id: number) {
  const { data, error } = await supabase
    .from("izin")
    .select("id, user_id, status, jenis_izin, alasan, tujuan, tanggal_keluar, perkiraan_kembali")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export interface EditIzinInput {
  jenis_izin: JenisIzin;
  alasan: string;
  tujuan: string;
  tanggal_keluar: string;
  perkiraan_kembali: string;
}

export async function editIzinByPengurus(
  id: number,
  actorId: number,
  catatanPerubahan: string,
  input: EditIzinInput
): Promise<{ error?: string }> {
  const before = await getIzinFullById(id);
  if (!before) return { error: "Pengajuan tidak ditemukan." };
  if (before.status === "DIHAPUS") return { error: "Pengajuan ini sudah dihapus, tidak bisa diedit." };

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("izin")
    .update({
      jenis_izin: input.jenis_izin,
      alasan: input.alasan,
      tujuan: input.tujuan,
      tanggal_keluar: input.tanggal_keluar,
      perkiraan_kembali: input.perkiraan_kembali,
      updated_at: now,
    })
    .eq("id", id)
    .neq("status", "DIHAPUS"); // jaga-jaga race condition, sama seperti pola approveIzin

  if (error) return { error: `Gagal menyimpan perubahan: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "EDIT_PENGURUS",
    old_status: before.status,
    new_status: before.status, // status tidak berubah
    catatan: catatanPerubahan,
    data_sebelum: {
      jenis_izin: before.jenis_izin,
      alasan: before.alasan,
      tujuan: before.tujuan,
      tanggal_keluar: before.tanggal_keluar,
      perkiraan_kembali: before.perkiraan_kembali,
    },
    data_sesudah: {
      jenis_izin: input.jenis_izin,
      alasan: input.alasan,
      tujuan: input.tujuan,
      tanggal_keluar: input.tanggal_keluar,
      perkiraan_kembali: input.perkiraan_kembali,
    },
  });

  await sendNotificationToUser(before.user_id, {
    title: "Data Pengajuan Izin Diperbarui Petugas",
    body: `Petugas memperbarui data pengajuan izin Anda. Alasan: ${catatanPerubahan}`,
    url: "/beranda",
  }).catch((err) => console.error("Gagal mengirim notifikasi edit oleh pengurus:", err));

  return {};
}

export async function deleteIzinByPengurus(
  id: number,
  actorId: number,
  alasanHapus: string
): Promise<{ error?: string }> {
  const before = await getIzinFullById(id);
  if (!before) return { error: "Pengajuan tidak ditemukan." };
  if (before.status === "DIHAPUS") return { error: "Pengajuan ini sudah dihapus sebelumnya." };

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("izin")
    .update({
      status: "DIHAPUS",
      catatan_admin: alasanHapus,
      deleted_by: actorId,
      deleted_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .neq("status", "DIHAPUS"); // jaga-jaga race condition (klik dobel / dua tab)

  if (error) return { error: `Gagal menghapus pengajuan: ${error.message}` };

  await supabase.from("izin_logs").insert({
    izin_id: id,
    actor_id: actorId,
    action: "HAPUS_PENGURUS",
    old_status: before.status,
    new_status: "DIHAPUS",
    catatan: alasanHapus,
  });

  await sendNotificationToUser(before.user_id, {
    title: "Pengajuan Izin Dihapus Petugas",
    body: `Petugas menghapus pengajuan izin Anda. Alasan: ${alasanHapus}`,
    url: "/beranda",
  }).catch((err) => console.error("Gagal mengirim notifikasi hapus oleh pengurus:", err));

  return {};
}