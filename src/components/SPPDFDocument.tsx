import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { GelaraSummary, AbsentActivityRecord } from "@/services/daily-activity.service";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 60,
    paddingRight: 60,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  headerSubtitle: {
    fontSize: 10,
  },
  title: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  metaTable: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 80,
  },
  metaValue: {
    flex: 1,
  },
  dateAlign: {
    textAlign: "right",
    marginBottom: 10,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
  signatureContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    alignItems: "center",
    width: 220,
  },
  signatureSpace: {
    height: 50,
  },
  signatureName: {
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 10,
  },
  pasalTitle: {
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  pasalSubtitle: {
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  pasalList: {
    marginLeft: 15,
  },
  pasalItem: {
    flexDirection: "row",
    marginBottom: 5,
    textAlign: "justify",
  },
  pasalItemNumber: {
    width: 20,
  },
  pasalItemText: {
    flex: 1,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  }
});

interface SPPDFDocumentProps {
  monthLabel: string;
  year: number;
  gelara: GelaraSummary;
  absences: AbsentActivityRecord[];
  nomorSurat: string;
  bulanSurat: string;
  tahunSurat: string;
}

export default function SPPDFDocument({
  monthLabel,
  year,
  gelara,
  absences,
  nomorSurat,
  bulanSurat,
  tahunSurat,
}: SPPDFDocumentProps) {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const alphaAbsences = absences.filter(a => a.status === "A");
  const CHUNK_SIZE = 20;
  const absenceChunks: typeof alphaAbsences[] = [];

  if (alphaAbsences.length === 0) {
    absenceChunks.push([]);
  } else {
    for (let i = 0; i < alphaAbsences.length; i += CHUNK_SIZE) {
      absenceChunks.push(alphaAbsences.slice(i, i + CHUNK_SIZE));
    }
  }

  const persenAlphaBulanan = gelara.totalTercatatBulanan > 0
    ? (gelara.jumlahABulanan / gelara.totalTercatatBulanan) * 100
    : 0;

  return (
    <Document>
      {/* Page 1: Surat Pemberitahuan */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>LEMBAGA KURSUS DAN PELATIHAN DOA BANGSA</Text>
            <Text style={styles.headerSubtitle}>
              Kp. Salakopi, RT 03 RW 04, Desa Lembursawah, Kecamatan Cicantayan Kabupaten Kota
              Sukabumi, Jawa Barat (43155), e-mail: lkpdb.cty@gmail.com telp: 081311566357, 085283722181
            </Text>
          </View>
        </View>

        <Text style={styles.title}>Surat Pemberitahuan</Text>

        <Text style={styles.dateAlign}>Sukabumi, {currentDate}</Text>

        <View style={styles.metaTable}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Nomor</Text>
            <Text style={styles.metaValue}>: {nomorSurat}/S.Pb/LKPDB/CTY/{bulanSurat}/{tahunSurat}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Perihal</Text>
            <Text style={styles.metaValue}>: Pemberitahuan Pelanggaran Ketentuan Beasiswa</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Lampiran</Text>
            <Text style={styles.metaValue}>: </Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text>Kepada Yth.</Text>
          <Text>Bapak/Ibu/Wali dari {gelara.namaGelara}</Text>
          <Text>Di Tempat</Text>
        </View>

        <Text style={styles.paragraph}>Assalamu'alaikum warahmatullahi wabarakatuh,</Text>

        <Text style={styles.paragraph}>Dengan hormat,</Text>
        <Text style={styles.paragraph}>
          Bersama surat ini kami sampaikan hasil evaluasi kegiatan gelara di LKP Doa Bangsa.
          Berdasarkan data kehadiran dan partisipasi dalam kegiatan LKP Doa Bangsa Cicantayan,
          anak Bapak/Ibu tercatat memiliki tingkat pelanggaran sebesar {persenAlphaBulanan.toFixed(1)}% di bulan {monthLabel}.
          Hal ini perlu menjadi perhatian karena dapat mempengaruhi penilaian kelanjutan beasiswa.
        </Text>

        <Text style={styles.paragraph}>
          Sehubungan dengan hal tersebut, kami memohon partisipasi dan dukungan dari Bapak/Ibu
          untuk turut membantu mengingatkan dan memotivasi anak kita agar lebih aktif mengikuti seluruh
          kegiatan di LKP Doa Bangsa Cicantayan. Keaktifan dan kedisiplinan menjadi salah satu
          indikator utama dalam penilaian kelanjutan beasiswa di LKP Doa Bangsa.
        </Text>

        <Text style={styles.paragraph}>
          Adapun rincian nama dan pasal yang dilanggar terlampir dalam surat ini.
        </Text>

        <Text style={styles.paragraph}>
          Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu,
          kami ucapkan terima kasih.
        </Text>

        <Text style={styles.paragraph}>Wassalamu'alaikum warahmatullahi wabarakatuh.</Text>

        <View wrap={false} style={styles.signatureContainer}>
          <View style={styles.signatureBlock}>
            <Text>Mengetahui,</Text>
            <Text>Ketua LKP Doa Bangsa Cicantayan</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>Hendi Suhendi, S.Pd</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text>Hormat kami,</Text>
            <Text>Ketua Bidang Kegelaraan</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signatureName}>Dindin Haryadi, S.E</Text>
          </View>
        </View>
      </Page>

      {/* Page 2: Lampiran Tabel & Pasal Relevan */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>LEMBAGA KURSUS DAN PELATIHAN DOA BANGSA</Text>
            <Text style={styles.headerSubtitle}>
              Kp. Salakopi, RT 03 RW 04, Desa Lembursawah, Kecamatan Cicantayan Kabupaten Kota
              Sukabumi, Jawa Barat (43155), e-mail: lkpdb.cty@gmail.com telp: 081311566357, 085283722181
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text>Lampiran :</Text>
        </View>

        <Text style={styles.title}>Data Keaktifan</Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: "50%" }]}>
              <Text style={styles.tableCellHeader}>Nama</Text>
            </View>
            <View style={[styles.tableColHeader, { width: "25%" }]}>
              <Text style={styles.tableCellHeader}>Pelanggaran (Alpha) Bulan {monthLabel}</Text>
            </View>
            <View style={[styles.tableColHeader, { width: "25%" }]}>
              <Text style={styles.tableCellHeader}>Sumber Dana</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: "50%" }]}>
              <Text style={styles.tableCell}>{gelara.namaGelara}</Text>
            </View>
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text style={[styles.tableCell, { textAlign: "center" }]}>
                {persenAlphaBulanan.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.tableCol, { width: "25%" }]}>
              <Text style={[styles.tableCell, { textAlign: "center" }]}>
                FKDB
              </Text>
            </View>
          </View>
        </View>

        <View wrap={false}>
          <Text style={[styles.title, { marginTop: 30 }]}>Peraturan Beasiswa YPPDB (Terkait)</Text>

          <Text style={styles.pasalTitle}>Pasal 4</Text>
          <Text style={styles.pasalSubtitle}>Hak dan Kewajiban Penerima Beasiswa</Text>
          <View style={styles.pasalList}>
            <View style={styles.pasalItem}>
              <Text style={styles.pasalItemNumber}>(4)</Text>
              <Text style={styles.pasalItemText}><Text style={styles.bold}>Penerima Beasiswa</Text> berkewajiban aktif mengikuti program LKP dengan perolehan nilai persentase minimum rata-rata 85 % (persen).</Text>
            </View>
          </View>

          <Text style={styles.pasalTitle}>Pasal 8</Text>
          <Text style={styles.pasalSubtitle}>Sanksi dan Denda</Text>
          <View style={styles.pasalList}>
            <View style={styles.pasalItem}>
              <Text style={styles.pasalItemNumber}>(1)</Text>
              <View style={styles.pasalItemText}>
                <Text>YPPDB dapat menghentikan secara sepihak pemberian beasiswa kepada <Text style={styles.bold}>Penerima Beasiswa</Text> dengan kondisi sebagai berikut:</Text>
                <Text>c. <Text style={styles.bold}>Penerima Beasiswa</Text> dinyatakan terbukti melakukan pelanggaran terhadap isi perjanjian ini berdasarkan bukti atau berita acara yang dikeluarkan oleh pihak LKP atau Sekolah.</Text>
              </View>
            </View>
            <View style={styles.pasalItem}>
              <Text style={styles.pasalItemNumber}>(2)</Text>
              <Text style={styles.pasalItemText}>PARA PIHAK sepakat dengan berhentinya perjanjian ini, <Text style={styles.bold}>Penerima Beasiswa</Text> diwajibkan mengembalikan seluruh biaya yang sudah dikeluarkan oleh YPPDB dengan skema penghitungan sebagai berikut :</Text>
            </View>
            <View style={[styles.pasalItem, { justifyContent: "center", marginVertical: 10 }]}>
              <Text style={{ textAlign: "center", fontSize: 10 }}>Pengembalian biaya beasiswa = Jumlah biaya yang telah dikeluarkan oleh YPPDB + 50% dari jumlah biaya</Text>
            </View>
            <View style={[styles.pasalItem, { justifyContent: "center", marginBottom: 10 }]}>
              <Text style={{ textAlign: "center", fontSize: 10 }}>yang telah dikeluarkan oleh YPPDB</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Page 3+: Detail Pelanggaran (Tabel) */}
      {absenceChunks.map((chunk, index) => (
        <Page key={`pelanggaran-${index}`} wrap={false} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Image src="/logo.png" style={styles.logo} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>LEMBAGA KURSUS DAN PELATIHAN DOA BANGSA</Text>
              <Text style={styles.headerSubtitle}>
                Kp. Salakopi, RT 03 RW 04, Desa Lembursawah, Kecamatan Cicantayan Kabupaten Kota
                Sukabumi, Jawa Barat (43155), e-mail: lkpdb.cty@gmail.com telp: 081311566357, 085283722181
              </Text>
            </View>
          </View>

          <Text style={[styles.title, { marginTop: 20 }]}>
            Detail Pelanggaran {absenceChunks.length > 1 ? `- Halaman ${index + 1}` : ''}
          </Text>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, { width: "30%" }]}>
                <Text style={styles.tableCellHeader}>Tanggal</Text>
              </View>
              <View style={[styles.tableColHeader, { width: "70%" }]}>
                <Text style={styles.tableCellHeader}>Keterangan (Alpha)</Text>
              </View>
            </View>

            {chunk.length > 0 ? (
              chunk.map((a, i) => (
                <View style={styles.tableRow} key={i}>
                  <View style={[styles.tableCol, { width: "30%" }]}>
                    <Text style={[styles.tableCell, { textAlign: "center" }]}>{a.tanggal}</Text>
                  </View>
                  <View style={[styles.tableCol, { width: "70%" }]}>
                    <Text style={styles.tableCell}>Tidak hadir pada kegiatan {a.aktivitas}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <View style={[styles.tableCol, { width: "100%" }]}>
                  <Text style={[styles.tableCell, { textAlign: "center" }]}>Tidak ada catatan Alpha khusus pada bulan ini.</Text>
                </View>
              </View>
            )}
          </View>
        </Page>
      ))}
    </Document>
  );
}
