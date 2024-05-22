import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (typeof req.query.id !== "string") {
    res.status(400).json({ message: "Missing id" });
    return;
  }
  const cuentita = await db.cuentita.findUnique({
    where: {
      id: req.query.id,
      member: { some: { userId: session?.user?.id } },
    },
  });

  if (!cuentita) {
    res.status(400).json({ message: "Cuentita does not exist" });
    return;
  }

  const members = await db.user.findMany({
    where: {
      member: { some: { cuentitaId: cuentita.id } },
    },
  });

  res.json({
    ...cuentita,
    members,
  });
}
