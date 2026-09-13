import webpush from "web-push";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT || "mailto:admin@asrama.com",
    publicKey,
    privateKey
  );
  return true;
}

export async function saveSubscription(
  userId: number,
  endpoint: string,
  auth: string,
  p256dh: string
): Promise<{ error?: string }> {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      auth,
      p256dh,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("Gagal menyimpan subscription notifikasi:", error.message);
    return { error: `Gagal menyimpan notifikasi: ${error.message}` };
  }
  return {};
}

export async function sendNotificationToUser(
  userId: number,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!configureWebPush()) {
    console.warn("VAPID keys belum dikonfigurasi. Notifikasi tidak dikirim.");
    return;
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return;
  }

  const pushPayload = JSON.stringify(payload);

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, pushPayload);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription is expired or invalid, delete it
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
      } else {
        console.error("Gagal mengirim push notification:", err);
      }
    }
  }
}

export async function sendNotificationToPengurus(
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!configureWebPush()) {
    console.warn("VAPID keys belum dikonfigurasi. Notifikasi tidak dikirim.");
    return;
  }

  // Get all PENGURUS users
  const { data: pengurusList, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("role", "PENGURUS")
    .eq("is_active", true);

  if (userError || !pengurusList || pengurusList.length === 0) {
    return;
  }

  const pengurusIds = pengurusList.map((u) => u.id);

  const { data: subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", pengurusIds);

  if (subError || !subscriptions || subscriptions.length === 0) {
    return;
  }

  const pushPayload = JSON.stringify(payload);

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, pushPayload);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
      } else {
        console.error("Gagal mengirim push notification ke pengurus:", err);
      }
    }
  }
}
