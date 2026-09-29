import { NextResponse } from "next/server";
import { getIzinMendekatiTenggat, markIzinReminded } from "@/services/izin.service";
import { sendNotificationToUser } from "@/services/notification.service";

// Panggil endpoint ini setiap menit via Vercel Cron atau cron job eksternal.
// Contoh konfigurasi Vercel (vercel.json):
//   { "crons": [{ "path": "/api/cron/remind-return", "schedule": "* * * * *" }] }
//
// Lindungi dengan CRON_SECRET supaya tidak bisa dipanggil sembarangan:
//   Authorization: Bearer <CRON_SECRET>

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Validasi secret header (opsional tapi sangat disarankan)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const izinList = await getIzinMendekatiTenggat();

  if (izinList.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const izin of izinList) {
    const waktuKembali = new Date(izin.perkiraan_kembali);
    const menitSisa = Math.round((waktuKembali.getTime() - Date.now()) / 60000);
    const label = menitSisa <= 1 ? "kurang dari 1 menit" : `${menitSisa} menit`;

    try {
      await sendNotificationToUser(izin.user_id, {
        title: "⏰ Izin hampir habis!",
        body: `Batas waktu kembali untuk izin "${izin.tujuan}" tinggal ${label} lagi. Segera kembali ke asrama.`,
        url: "/beranda",
      });

      await markIzinReminded(izin.id);
      sent++;
    } catch (err) {
      console.error(`Gagal mengirim reminder untuk izin #${izin.id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: izinList.length });
}
