import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { sendNotification } from "@/server/notify";
import { type NextApiResponse, type NextApiRequest } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { cuentitaId } = req.body;

  const users = await db.user.findMany({
    where: {
      member: {
        some: {
          cuentitaId,
        },
      },
    },
  });

  await Promise.all(
    users
      .filter((u) => u.id !== req.body.juanfra)
      .map((user) =>
        sendNotification(user.id, {
          title: req.body.title,
          message: req.body.message,
        }),
      ),
  );

  res.json({ success: true });
}
