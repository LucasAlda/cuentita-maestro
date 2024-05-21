import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { Cuentita: true },
  });

  if (!user) {
    res.status(400).json({ message: "User does not exist" });
    return;
  }

  const cuentitas = user?.Cuentita;

  res.json(cuentitas);
}
