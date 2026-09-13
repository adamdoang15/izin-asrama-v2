"use server";

import { auth } from "@/lib/auth";
import { saveSubscription } from "@/services/notification.service";

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export async function savePushSubscriptionAction(subscription: PushSubscriptionPayload): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sesi tidak valid." };
  }

  if (!subscription || !subscription.endpoint || !subscription.keys?.auth || !subscription.keys?.p256dh) {
    return { error: "Payload subscription tidak valid." };
  }

  const userId = Number(session.user.id);
  const result = await saveSubscription(
    userId,
    subscription.endpoint,
    subscription.keys.auth,
    subscription.keys.p256dh
  );

  if (result.error) {
    return { error: result.error };
  }

  return { success: true };
}
