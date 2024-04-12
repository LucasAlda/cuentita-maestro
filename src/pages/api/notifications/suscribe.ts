import { db } from "@/server/db";
import { type NextApiRequest, type NextApiResponse } from "next";
import webPush from "web-push";

webPush.setVapidDetails(
  `mailto:${process.env.WEB_PUSH_EMAIL}`,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "",
  process.env.WEB_PUSH_PRIVATE_KEY ?? "",
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end();
    return;
  }

  const suscription = req.body as {
    userId: string;
    endpoint: string;
    auth: string;
    p256dh: string;
  };

  await db.notificationSuscription.create({
    data: suscription,
  });

  return res.json({ success: true });
}
