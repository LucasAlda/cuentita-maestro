import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { sendNotification } from "@/server/notify";
import { type NextApiRequest, type NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const cuentitaId = req.body.cuentitaId as string;

  const cuentita = await db.cuentita.findUnique({
    where: { id: cuentitaId },
  });

  const users = await db.user.findMany({
    where: {
      member: {
        some: {
          cuentitaId: cuentitaId,
        },
      },
    },
  });

  await Promise.all(
    users
      .filter((u) => u.id !== session.user.id)
      .map((user) =>
        sendNotification(user.id, {
          title: `${cuentita?.name}: ha sido ELIMINADA :(`,
        }),
      ),
  );

  await db.cuentita.delete({ where: { id: cuentitaId } });

  res.json({ success: true });
}
