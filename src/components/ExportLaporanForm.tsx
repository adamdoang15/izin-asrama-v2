"use client";

export default function ExportLaporanForm() {
  return (
    <form
      method="get"
      action="/api/laporan/export"
      target="_blank"
      className="flex flex-col gap-4 w-full"
    >
      {/* Date Range Group */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-paper-raised/40 dark:bg-ink/5 p-3 rounded-2xl border border-line/50 shadow-sm w-full">
        <label className="text-[10px] font-bold uppercase tracking-widest text-ink-soft whitespace-nowrap sm:pl-2">Rentang:</label>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          <input
            type="date"
            name="start"
            className="w-full rounded-xl border border-ink/10 dark:border-line bg-paper-raised dark:bg-ink/10 px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-text hover:bg-white dark:hover:bg-ink/20"
            required
          />
          <span className="hidden sm:block text-ink-soft font-medium opacity-50">-</span>
          <span className="block sm:hidden text-[10px] font-bold uppercase tracking-widest text-ink-soft opacity-50 w-full text-center">Sampai</span>
          <input
            type="date"
            name="end"
            className="w-full rounded-xl border border-ink/10 dark:border-line bg-paper-raised dark:bg-ink/10 px-4 py-2.5 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-text hover:bg-white dark:hover:bg-ink/20"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="relative w-full">
          <select
            name="status"
            className="w-full appearance-none rounded-2xl border border-ink/10 dark:border-line bg-paper-raised/40 dark:bg-ink/5 pl-4 pr-10 py-3 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-pointer hover:bg-paper dark:hover:bg-ink/10 shadow-sm"
          >
            <option value="" className="bg-paper">Semua Status</option>
            <option value="MENUNGGU" className="bg-paper">Menunggu</option>
            <option value="DISETUJUI" className="bg-paper">Disetujui</option>
            <option value="SEDANG_KELUAR" className="bg-paper">Sedang Keluar</option>
            <option value="SUDAH_KEMBALI" className="bg-paper">Sudah Kembali</option>
            <option value="DITOLAK" className="bg-paper">Ditolak</option>
            <option value="TIDAK_JADI" className="bg-paper">Tidak Jadi</option>
            <option value="DIHAPUS" className="bg-paper">Dihapus</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-ink-soft">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
        
        <div className="relative w-full">
          <select
            name="jenis"
            className="w-full appearance-none rounded-2xl border border-ink/10 dark:border-line bg-paper-raised/40 dark:bg-ink/5 pl-4 pr-10 py-3 text-sm font-medium text-ink outline-none focus:border-ink dark:focus:border-teal focus:ring-1 focus:ring-ink dark:focus:ring-teal/50 transition-all cursor-pointer hover:bg-paper dark:hover:bg-ink/10 shadow-sm"
          >
            <option value="" className="bg-paper">Semua Jenis</option>
            <option value="HARIAN" className="bg-paper">Izin Harian</option>
            <option value="MENGINAP" className="bg-paper">Izin Menginap</option>
            <option value="REKREASI" className="bg-paper">Rekreasi</option>
            <option value="KELUARGA" className="bg-paper">Keperluan Keluarga</option>
            <option value="DARURAT" className="bg-paper">Darurat</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-ink-soft">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-teal px-6 py-3.5 text-sm font-bold tracking-wide text-paper-raised hover:bg-teal/90 transition-all active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        Unduh Laporan Excel
      </button>
    </form>
  );
}
