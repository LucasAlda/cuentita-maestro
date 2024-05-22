import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
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

  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid ID" });
    return;
  }

  const cuentita = await db.cuentita.findUnique({
    where: { id: id },
    include: {
      creator: true,
    },
  });

  if (!cuentita) {
    res.status(404).json({ message: "Cuentita Not found" });
    return;
  }

  const membership = await db.member.findFirst({
    where: {
      userId: session.user.id,
      cuentitaId: id,
    },
  });

  res.json({
    name: cuentita.name,
    category: cuentita.category,
    createdBy: cuentita.creator.name,
    alreadyMember: Boolean(membership),
  });
}
