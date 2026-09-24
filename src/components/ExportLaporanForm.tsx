"use client";

export default function ExportLaporanForm() {
  return (
    <form
      method="get"
      action="/api/laporan/export"
      target="_blank"
      className="flex flex-wrap items-end gap-3 rounded-md border border-line bg-paper-raised p-3"
    >
      <div className="space-y-1">
        <label className="block text-xs font-medium" htmlFor="export-start">
          Dari tanggal
        </label>
        <input
          id="export-start"
          type="date"
          name="start"
          className="rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium" htmlFor="export-end">
          Sampai tanggal
        </label>
        <input
          id="export-end"
          type="date"
          name="end"
          className="rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium" htmlFor="export-status">
          Status
        </label>
        <select
          id="export-status"
          name="status"
          className="rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        >
          <option value="">Semua status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DISETUJUI">Disetujui</option>
          <option value="SEDANG_KELUAR">Sedang keluar</option>
          <option value="SUDAH_KEMBALI">Sudah kembali</option>
          <option value="DITOLAK">Ditolak</option>
          <option value="TIDAK_JADI">Tidak jadi</option>
          <option value="DIHAPUS">Dihapus</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium" htmlFor="export-jenis">
          Jenis izin
        </label>
        <select
          id="export-jenis"
          name="jenis"
          className="rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal"
        >
          <option value="">Semua jenis</option>
          <option value="HARIAN">Izin harian</option>
          <option value="MENGINAP">Izin menginap</option>
          <option value="REKREASI">Rekreasi</option>
          <option value="KELUARGA">Keperluan keluarga</option>
          <option value="DARURAT">Darurat</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90"
      >
        ↓ Ekspor Excel
      </button>
    </form>
  );
}
