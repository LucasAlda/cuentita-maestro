// import { env } from "@/env";
import { db } from "@/server/db";
import webPush from "web-push";

/******  REINTRODUCIR CUANDO HAGAMOS NOTIFICACIONES Y ESTE EL ENV   ********/

// webPush.setVapidDetails(
//   `mailto:${env.WEB_PUSH_EMAIL}`,
//   env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "",
//   env.WEB_PUSH_PRIVATE_KEY ?? "",
// );

export async function sendNotification(
  id: string,
  msg: { title: string; message: string },
) {
  const suscriptions = await db.notificationSuscription.findMany({
    where: {
      userId: id,
    },
  });

  const promises = suscriptions.map((suscription) => {
    return webPush.sendNotification(
      {
        endpoint: suscription.endpoint,
        keys: {
          auth: suscription.auth ?? "",
          p256dh: suscription.p256dh ?? "",
        },
      },
      JSON.stringify(msg),
    );
  });

  const result = await Promise.allSettled(promises);
  const failed = result.some((r) => r.status === "rejected");
  if (failed) {
    console.log(result.filter((r) => r.status === "rejected"));
  }

  return !failed;
}
