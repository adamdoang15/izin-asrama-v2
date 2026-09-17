import type { Metadata } from "next";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";

export const metadata: Metadata = {
  title: "Panduan & SOP Perizinan | Izin Asrama",
  description: "Prosedur, alur pengajuan, jenis izin, dan aturan perizinan gelara asrama.",
};

export default function PanduanPage() {
  const alurLangkah = [
    {
      step: "01",
      title: "Pengajuan Izin",
      desc: "Gelara mengisi form pengajuan izin melalui aplikasi dengan memilih jenis izin, tujuan, alasan, serta waktu keluar dan perkiraan kembali.",
    },
    {
      step: "02",
      title: "Verifikasi Pengurus",
      desc: "Mentor asrama memeriksa permohonan. Gelara dapat melihat status persetujuan secara real-time di aplikasi.",
    },
    {
      step: "03",
      title: "Keberangkatan",
      desc: "Setelah izin disetujui, status berubah menjadi 'Sedang Keluar'. Gelara dapat meninggalkan area asrama sesuai waktu yang ditentukan.",
    },
    {
      step: "04",
      title: "Kepulangan & Validasi GPS",
      desc: "Saat tiba kembali di asrama, Gelara menekan tombol 'Saya sudah kembali'. Aplikasi akan memvalidasi posisi GPS berada dalam radius 100 meter lokasi asrama.",
    },
  ];

  const jenisIzin = [
    {
      nama: "Harian",
      badge: "HARIAN",
      desc: "Izin keluar untuk keperluan kurang dari 2 jam (misal: beli perlengkapan, jajan, laundry, dll) tanpa menginap.",
    },
    {
      nama: "Menginap",
      badge: "MENGINAP",
      desc: "Izin pulang ke rumah atau menginap di luar asrama untuk  hari libur resmi asrama atau pengajuan dari orang tua.",
    },
    {
      nama: "Rekreasi",
      badge: "REKREASI",
      desc: "Izin untuk kegiatan pribadi seperti keluar untuk berolahraga, mengunjungi perpustakaan, atau kegiatan pribadi lainnya yang lebih dari 2 jam.",
    },
    {
      nama: "Keluarga",
      badge: "KELUARGA",
      desc: "Izin khusus untuk acara atau urusan penting bersama keluarga.",
    },
    {
      nama: "Darurat",
      badge: "DARURAT",
      desc: "Izin mendadak untuk keperluan medis atau duka cita keluarga yang memerlukan penanganan cepat.",
    },
  ];

  const faqs = [
    {
      q: "Mengapa aplikasi meminta izin akses lokasi (GPS)?",
      a: "Lokasi GPS hanya diminta saat gelara menekan tombol 'Saya sudah kembali' untuk memvalidasi bahwa gelara benar-benar sudah berada di area/radius asrama. Aplikasi tidak melacak lokasi gelara secara terus-menerus.",
    },
    {
      q: "Bagaimana jika terjadi keterlambatan kembali?",
      a: "Sistem akan mencatat durasi keterlambatan secara otomatis. Gelara disarankan segera melapor kepada mentor saat tiba jika ada kendala perjalanan.",
    },
    {
      q: "Apakah wali gelara bisa memantau statistik izin?",
      a: "Ya, wali gelara dan publik dapat melihat ringkasan statistik perizinan di halaman utama tanpa menampilkan data pribadi gelara.",
    },

  ];

  return (
    <>
      <PublicNav />
      <main className="flex-1 bg-paper">
        {/* Header Hero Section */}
        <section className="border-b border-line bg-paper-raised">
          <div className="mx-auto max-w-4xl px-6 py-10 md:py-14">
            <span className="inline-block rounded-full bg-teal-soft px-3 py-1 text-xs font-semibold text-teal">
              Standar Operasional Prosedur
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Panduan Perizinan Gelara
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink-soft md:text-base">
              Informasi lengkap alur pengajuan, jenis izin, aturan kepulangan, dan pertanyaan umum seputar perizinan asrama.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-12 px-6 py-10">
          {/* Section 1: Alur Perizinan */}
          <section>
            <h2 className="text-xl font-semibold text-ink">1. Alur Pengajuan & Kepulangan</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Tahapan prosedur dari pengajuan awal hingga konfirmasi kembali ke asrama.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {alurLangkah.map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-line bg-paper-raised p-5 shadow-sm"
                >
                  <span className="text-xs font-bold text-teal">{item.step}</span>
                  <h3 className="mt-1 font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Jenis-Jenis Izin */}
          <section>
            <h2 className="text-xl font-semibold text-ink">2. Kategori & Jenis Izin</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Pilihlah jenis izin yang paling sesuai saat membuat pengajuan di aplikasi.
            </p>
            <div className="mt-6 space-y-3">
              {jenisIzin.map((item) => (
                <div
                  key={item.badge}
                  className="rounded-xl border border-line bg-paper-raised p-4 sm:flex sm:items-start sm:gap-6"
                >
                  <div className="flex items-center gap-3 sm:w-44 shrink-0">
                    <span className="rounded-md bg-teal-soft px-2.5 py-1 text-xs font-semibold text-teal">
                      {item.badge}
                    </span>
                    <h3 className="font-medium text-ink">{item.nama}</h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:mt-0 flex-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Ketentuan Waktu & Validasi Lokasi */}
          <section className="rounded-2xl border border-line bg-paper-raised p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">3. Ketentuan Waktu & Validasi Radius</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal">•</span>
                <span>
                  <strong className="text-ink">Batas Perkiraan Kembali:</strong> Gelara wajib kembali ke asrama sebelum batas waktu yang tertera pada surat izin.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal">•</span>
                <span>
                  <strong className="text-ink">Validasi Radius GPS:</strong> Konfirmasi tombol kepulangan hanya dapat diproses saat gelara terdeteksi berada di lokasi asrama.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-teal">•</span>
                <span>
                  <strong className="text-ink">Keterlambatan:</strong> Apabila gelara menekan tombol kepulangan melewati perkiraan waktu kembali, status akan dicatat sebagai <em>Terlambat</em> beserta jumlah durasi keterlambatannya.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 4: FAQ */}
          <section>
            <h2 className="text-xl font-semibold text-ink">4. Pertanyaan Umum (FAQ)</h2>
            <div className="mt-6 grid gap-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-line bg-paper-raised p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-ink">Q: {faq.q}</h3>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">A: {faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Back to Home CTA */}
          <div className="pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal hover:underline"
            >
              ← Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-ink-soft">
          <span>Izin Asrama — Panduan & SOP</span>
        </div>
      </footer>
    </>
  );
}
