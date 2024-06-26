import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { type NextApiRequest, type NextApiResponse } from "next";
import { sendNotification } from "@/server/notify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invitación inválida" });
    return;
  }

  const cuentita = await db.cuentita.findUnique({
    where: { id: id },
    include: {
      creator: true,
    },
  });

  if (!cuentita) {
    res.status(404).json({ message: "Cuentita no encontrada!" });
    return;
  }

  const membership = await db.member.findFirst({
    where: {
      userId: session.user.id,
      cuentitaId: id,
    },
  });

  if (membership) {
    res.status(400).json({ message: "Ya sos miembro de esta cuentita!" });
    return;
  }

  await db.member.create({
    data: {
      userId: session.user.id,
      cuentitaId: id,
    },
  });

  const users = await db.user.findMany({
    where: {
      member: {
        some: {
          cuentitaId: id,
        },
      },
    },
  });

  await Promise.all(
    users
      .filter((u) => u.id !== session.user.id)
      .map((user) =>
        sendNotification(user.id, {
          title: `${cuentita.name}: Nuevo miembro`,
          message: `Bienvenido, ${session.user.name}!`,
        }),
      ),
  );


  res.json({
    success: true,
  });

  
}
