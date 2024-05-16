// import { env } from "@/env";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function useNotification() {
  const session = useSession();
  const user = session.data?.user;
  const [subscribed, setSubscribed] = useState(false);
  const subscription = useRef<PushSubscription>();
  const registration = useRef<ServiceWorkerRegistration>();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (
            sub &&
            !(
              sub.expirationTime &&
              Date.now() > sub.expirationTime - 5 * 60 * 1000
            )
          ) {
            subscription.current = sub;
            setSubscribed(true);
          }
        });
        registration.current = reg;
      });
    }
  }, []);

  const subscribe = async () => {
    console.log(registration.current, user);
    if (!registration.current || !user) return;

    /******  REINTRODUCIR CUANDO HAGAMOS NOTIFICACIONES Y ESTE EL ENV   ********/

    // const sub = await registration.current.pushManager.subscribe({
    //   userVisibleOnly: true,
    //   applicationServerKey: base64ToUint8Array(
    //     env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    //   ),
    // });
    // subscription.current = sub;

    // const parsed = JSON.parse(JSON.stringify(sub));

    // await fetch("/api/notifications/suscribe", {
    //   method: "POST",
    //   headers: {
    //     "Content-type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     userId: user.id,
    //     endpoint: parsed.endpoint,
    //     auth: parsed.keys.auth,
    //     p256dh: parsed.keys.p256dh,
    //   }),
    // });
    setSubscribed(true);
  };

  return { subscribed, subscribe, subscription };
}

// const base64ToUint8Array = (base64: string) => {
//   const padding = "=".repeat((4 - (base64.length % 4)) % 4);
//   const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");

//   const rawData = window.atob(b64);
//   const outputArray = new Uint8Array(rawData.length);

//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// };
