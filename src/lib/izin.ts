import { supabase } from "@/lib/supabase";

/**
 * Promotes approved permissions whose scheduled exit time has arrived.
 * This is intentionally idempotent, so it can safely run before reads.
 */
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
