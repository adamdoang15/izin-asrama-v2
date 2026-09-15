"use client";

import { useEffect } from "react";
import { savePushSubscriptionAction } from "@/app/actions/notification";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return;
    }

    async function registerAndSubscribe() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const convertedKey = urlBase64ToUint8Array(vapidPublicKey!);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });
        }

        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.auth && subJson.keys?.p256dh) {
          await savePushSubscriptionAction({
            endpoint: subJson.endpoint,
            keys: {
              auth: subJson.keys.auth,
              p256dh: subJson.keys.p256dh,
            },
          });
        }
      } catch (err) {
        console.error("Gagal menginisialisasi push notification:", err);
      }
    }

    registerAndSubscribe();
  }, []);

  return null;
}
