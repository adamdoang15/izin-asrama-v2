import type { StatusIzin } from "@/lib/types";

const STATUS_CONFIG: Record<StatusIzin, { label: string; dot: string; text: string }> = {
  MENUNGGU: { label: "Menunggu", dot: "bg-amber", text: "text-amber" },
  PERLU_REVISI: { label: "Perlu direvisi", dot: "bg-clay", text: "text-clay" },
  DISETUJUI: { label: "Disetujui", dot: "bg-sage", text: "text-sage" },
  DITOLAK: { label: "Ditolak", dot: "bg-clay", text: "text-clay" },
  SEDANG_KELUAR: { label: "Sedang keluar", dot: "bg-teal", text: "text-teal" },
  SUDAH_KEMBALI: { label: "Sudah kembali", dot: "bg-sage", text: "text-sage" },
  TIDAK_JADI: { label: "Tidak jadi", dot: "bg-ink-soft", text: "text-ink-soft" },
  DIHAPUS: { label: "Dihapus", dot: "bg-ink-soft", text: "text-ink-soft" },
};

export default function StatusPill({ status }: { status: StatusIzin }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border border-current ${cfg.text} bg-opacity-10`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
