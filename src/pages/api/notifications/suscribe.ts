import { db } from "@/server/db";
import { type NextApiRequest, type NextApiResponse } from "next";

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
